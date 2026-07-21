/* Generates the MEALS block in index.html from bank.json + components.js.
 *
 * index.html stays a single self-contained file with no build step to RUN. This
 * is an authoring-time generator, not a runtime dependency: it writes the data
 * into the file and then plays no further part. The gate re-runs it in check
 * mode, so a hand-edit to the generated block is caught rather than silently
 * diverging from the component table it is supposed to be derived from.
 *
 * Usage:
 *   node scripts/build-meals.js          write the block into index.html
 *   node scripts/build-meals.js --check  exit 1 if the file is out of date
 */
const fs = require('fs');
const path = require('path');
const { COMPONENTS } = require('./components.js');

const ROOT = path.join(__dirname, '..');
const BANK = JSON.parse(fs.readFileSync(path.join(__dirname, 'bank.json'), 'utf8'));

const START = '  /* ==== GENERATED MEAL BANK, do not edit by hand ==== */';
const END   = '  /* ==== END GENERATED MEAL BANK ==== */';

/* getDay() index -> bank key, plus each slot's display label and time. */
const DAY_INDEX = { sun:0, mon:1, tue:2, wed:3, thu:4, fri:5, sat:6 };
const SLOT_META = {
  mon: { breakfast:["Breakfast","8:00"], pre:["Pre-workout","11:00"], lunch:["Lunch","12:30"],
         snack:["Pre-class","17:00"], dinner:["Dinner","20:00"] },
  tue: { breakfast:["Breakfast","8:00"], lunch:["Lunch","12:00"], snack:["Snack","15:00"],
         dinner:["Dinner","19:00"] },
  wed: { breakfast:["Breakfast","8:00"], lunch:["Lunch","12:00"], snack:["Snack","15:00"],
         dinner:["Dinner","19:00"] },
  thu: { breakfast:["Breakfast","8:00"], lunch:["Lunch","12:00"], snack:["Snack","15:00"],
         dinner:["Dinner","19:00"] },
  fri: { breakfast:["Breakfast","8:00"], lunch:["Lunch","12:00"], snack:["Pre-class","17:00"],
         shake:["Mid-session","20:00","⚠️ don't skip"], dinner:["Dinner, late","22:00"] },
  sat: { breakfast:["Post-yoga","11:00"], lunch:["Lunch","13:00"], snack:["Snack","16:00"],
         dinner:["Dinner","19:00"] },
  sun: { breakfast:["Breakfast","9:00"], lunch:["Lunch","13:00"], snack:["Snack","16:00"],
         dinner:["Dinner","19:00"] },
};

const q = s => JSON.stringify(s);

function build() {
  const days = Object.entries(BANK).sort((a, b) => DAY_INDEX[a[0]] - DAY_INDEX[b[0]]);
  let out = START + '\n  var MEALS = {\n';

  for (const [dayKey, slots] of days) {
    out += `    ${DAY_INDEX[dayKey]}: {  // ${dayKey}\n`;
    for (const [slotKey, variants] of Object.entries(slots)) {
      const meta = SLOT_META[dayKey][slotKey];
      if (!meta) throw new Error(`no slot meta for ${dayKey}.${slotKey}`);
      const [label, time, flag] = meta;
      out += `      ${slotKey}: { label:${q(label)}, time:${q(time)}`;
      if (flag) out += `, flag:${q(flag)}`;
      out += ', variants:[\n';
      for (const v of variants) {
        const bad = v.parts.filter(p => !COMPONENTS[p]);
        if (bad.length) throw new Error(`${dayKey}.${slotKey}: unknown ids ${bad}`);
        const p = v.parts.reduce((a, id) => a + COMPONENTS[id].p, 0);
        out += `        {t:${q(v.t)}, p:${p}},\n`;
      }
      out += '      ]},\n';
    }
    out += '    },\n';
  }
  out += '  };\n' + END;
  return out;
}

const file = path.join(ROOT, 'index.html');
const html = fs.readFileSync(file, 'utf8');
const s = html.indexOf(START), e = html.indexOf(END);
if (s < 0 || e < 0) { console.error('MARKERS NOT FOUND in index.html'); process.exit(1); }

const next = html.slice(0, s) + build() + html.slice(e + END.length);

if (process.argv.includes('--check')) {
  if (next !== html) {
    console.error('index.html meal block is STALE. Run: node scripts/build-meals.js');
    process.exit(1);
  }
  console.log('  PASS  generated meal block matches components + bank');
  process.exit(0);
}

fs.writeFileSync(file, next);
const n = Object.values(BANK).flatMap(s2 => Object.values(s2)).flat().length;
console.log(`wrote ${n} meals into index.html`);
