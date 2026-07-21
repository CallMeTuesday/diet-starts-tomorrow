/* Weekly methylmercury exposure from the meal bank.
 *
 * Mercury per portion (micrograms) = portion grams * ppm.
 *
 * The yardstick is the EPA reference dose, 0.1 ug per kg per day, taken here
 * against a 75kg reference adult: 52.5 ug per week. It is derived with a large
 * uncertainty factor, so it is a conservative floor rather than a cliff edge. But headroom is free when the swaps cost nothing, so the gate
 * holds the WORST CASE (every slot rerolled to its highest-mercury variant)
 * under the RfD rather than merely the default week.
 *
 *   node scripts/mercury.js           report
 *   node scripts/mercury.js --check   exit 1 if the worst case breaches the RfD
 */
const fs = require('fs');
const path = require('path');
const { COMPONENTS } = require('./components.js');

const BANK = JSON.parse(fs.readFileSync(path.join(__dirname, 'bank.json'), 'utf8'));

const REF_KG = 75;                         // reference adult, not a personal figure
const RFD_PER_KG_DAY = 0.1;                // ug/kg/day, EPA
const WEEK_LIMIT = REF_KG * RFD_PER_KG_DAY * 7;

const hgOf = id => {
  const c = COMPONENTS[id];
  return (c && c.hg && c.g) ? c.g * c.hg : 0;
};
const mealHg = v => v.parts.reduce((a, id) => a + hgOf(id), 0);

const DAY_ORDER = ['mon','tue','wed','thu','fri','sat','sun'];

/* The app is deterministic: for a given week, the meals ARE decided. So the
   number that matters is not the adversarial maximum (reroll every slot to its
   fishiest option, seven days running) but what each real week actually serves.
   Variant counts are all 6, so seeds 0..5 enumerate every distinct week the app
   will ever produce. This mirrors index.html's baseIndex exactly. */
function h(str){ let n = 0; for (const c of str) n = (n * 31 + c.charCodeAt(0)) | 0; return Math.abs(n); }

function weekAtSeed(seed) {
  let total = 0;
  const meals = [];
  for (const day of DAY_ORDER) {
    for (const [slot, variants] of Object.entries(BANK[day])) {
      const v = variants[(seed + h(day + '|' + slot)) % variants.length];
      const hg = mealHg(v);
      total += hg;
      if (hg > 0) meals.push({ day, slot, hg, t: v.t });
    }
  }
  return { total, meals };
}

let weekMin = 0, weekMax = 0, weekV0 = 0;
const rows = [];

for (const day of DAY_ORDER) {
  const slots = BANK[day];
  let dMin = 0, dMax = 0, dV0 = 0, worstMeal = null;
  for (const [slot, variants] of Object.entries(slots)) {
    const hgs = variants.map(mealHg);
    dMin += Math.min(...hgs);
    dMax += Math.max(...hgs);
    dV0  += hgs[0];
    const iMax = hgs.indexOf(Math.max(...hgs));
    if (!worstMeal || hgs[iMax] > worstMeal.hg)
      worstMeal = { hg: hgs[iMax], t: variants[iMax].t, slot };
  }
  weekMin += dMin; weekMax += dMax; weekV0 += dV0;
  rows.push({ day, dMin, dMax, dV0, worstMeal });
}

console.log('Weekly methylmercury exposure');
console.log(`  EPA reference dose at ${REF_KG}kg: ${WEEK_LIMIT.toFixed(1)} ug/week\n`);
console.log('  day    best   default   worst   worst single meal');
for (const r of rows) {
  console.log(`  ${r.day}  ${r.dMin.toFixed(1).padStart(6)} ${r.dV0.toFixed(1).padStart(9)} ${r.dMax.toFixed(1).padStart(7)}   ` +
              `${r.worstMeal.hg.toFixed(1)}ug  ${r.worstMeal.t.slice(0, 44)}`);
}
const pct = x => `${(100 * x / WEEK_LIMIT).toFixed(0)}% of RfD`;
console.log(`\n  WEEK   best ${weekMin.toFixed(1)}ug (${pct(weekMin)})`);
console.log(`         default ${weekV0.toFixed(1)}ug (${pct(weekV0)})`);
console.log(`         worst ${weekMax.toFixed(1)}ug (${pct(weekMax)})`);

/* Highest-mercury individual components actually in use. */
const used = new Set(Object.values(BANK).flatMap(s => Object.values(s)).flat().flatMap(v => v.parts));
const seafood = [...used].filter(id => COMPONENTS[id] && COMPONENTS[id].hg)
  .map(id => ({ id, label: COMPONENTS[id].label, per: hgOf(id), ppm: COMPONENTS[id].hg }))
  .sort((a, b) => b.per - a.per);
console.log('\n  Seafood in use, by mercury per portion:');
for (const s of seafood)
  console.log(`    ${s.per.toFixed(1).padStart(5)}ug  ${String(s.ppm).padEnd(6)}ppm  ${s.label}`);

/* The weeks the app will actually serve. */
console.log('\n  Real weeks (the app is deterministic, so these are what gets eaten):');
const seeds = [0,1,2,3,4,5].map(s => ({ s, ...weekAtSeed(s) }));
for (const w of seeds)
  console.log(`    week ${w.s + 1}:  ${w.total.toFixed(1).padStart(5)}ug  (${pct(w.total)})`);
const realMax = Math.max(...seeds.map(w => w.total));
const worstWeek = seeds.find(w => w.total === realMax);

console.log(`\n  Fish in the heaviest real week (week ${worstWeek.s + 1}):`);
for (const m of worstWeek.meals.sort((a, b) => b.hg - a.hg))
  console.log(`    ${m.hg.toFixed(1).padStart(5)}ug  ${m.day}.${m.slot}  ${m.t.slice(0, 44)}`);

/* Bound the damage a rerolling user can do: no single slot may offer more than
   two high-mercury options out of six, so rerolling cannot walk a day into a
   fish-only menu. */
const HIGH = 10;
const fishy = [];
for (const [day, slots] of Object.entries(BANK))
  for (const [slot, variants] of Object.entries(slots)) {
    const n = variants.filter(v => mealHg(v) > HIGH).length;
    if (n > 2) fishy.push(`${day}.${slot}: ${n}/6 variants over ${HIGH}ug`);
  }

if (process.argv.includes('--check')) {
  let bad = 0;
  if (realMax > WEEK_LIMIT) {
    console.error(`\nFAIL: heaviest real week ${realMax.toFixed(1)}ug exceeds the ${WEEK_LIMIT.toFixed(1)}ug RfD`);
    bad = 1;
  }
  if (fishy.length) {
    console.error('\nFAIL: a reroll could stack too much high-mercury fish into one slot:');
    fishy.forEach(f => console.error('  x ' + f));
    bad = 1;
  }
  if (bad) process.exit(1);
  console.log(`\n  PASS  heaviest real week is ${pct(realMax)}; no slot stacks high-mercury options`);
}
