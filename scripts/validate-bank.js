/* Audits scripts/bank.json against scripts/components.js.
 *
 * Nothing here trusts the authored numbers: protein is always recomputed from
 * the component table. The text/parts drift check is the important one, since
 * a meal whose text says "salmon" while its parts say "chicken" would carry a
 * silently wrong protein value and read correctly on screen.
 */
const fs = require('fs');
const path = require('path');
const { COMPONENTS } = require('./components.js');

const BANK = JSON.parse(fs.readFileSync(path.join(__dirname, 'bank.json'), 'utf8'));

const TARGETS = {
  mon: { breakfast:38, pre:24, lunch:50, snack:12, dinner:34 },
  tue: { breakfast:40, lunch:44, snack:26, dinner:48 },
  wed: { breakfast:40, lunch:52, snack:22, dinner:44 },
  thu: { breakfast:38, lunch:48, snack:24, dinner:48 },
  fri: { breakfast:34, lunch:46, snack:14, shake:30, dinner:34 },
  sat: { breakfast:42, lunch:42, snack:26, dinner:48 },
  sun: { breakfast:44, lunch:48, snack:22, dinner:44 },
};

/* Components that count as a vegetable for the plate-order rule. */
const VEG = new Set(Object.keys(COMPONENTS).filter(id =>
  /spinach|chard|kale|beetGreens|arugula|beets|broccoli|brussels|bokChoy|asparagus|zucchini|cauliflower|roastedRoots|sweetPotato|squash|redCabbage|tomato|peppers|mushrooms|avocado/.test(id)));

const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const STOP = new Set(['the','and','of','1','2','3','4','5','6','cup','tbsp','oz','tin','scoop','slices','slice','links','dry','half','seeds','sauteed','roasted','grilled','braised','garlicky','wilted','canned','ground']);

function keywords(label) {
  return norm(label).replace(/\([^)]*\)/g, ' ').split(/[^a-z]+/)
    .filter(w => w.length > 2 && !STOP.has(w));
}

let errors = [], warnings = [];
const dayTotals = {};

for (const [day, slots] of Object.entries(BANK)) {
  const targets = TARGETS[day];
  if (!targets) { errors.push(`${day}: no targets defined`); continue; }
  if (Object.keys(slots).sort().join() !== Object.keys(targets).sort().join())
    errors.push(`${day}: slot set mismatch. bank=[${Object.keys(slots)}] targets=[${Object.keys(targets)}]`);

  const perSlotSums = {};

  for (const [slot, variants] of Object.entries(slots)) {
    if (variants.length !== 6) errors.push(`${day}.${slot}: ${variants.length} variants, expected 6`);
    const sums = [];
    const anchors = {};

    variants.forEach((v, i) => {
      const where = `${day}.${slot}[${i}]`;

      // 1. every id must exist
      const bad = v.parts.filter(p => !COMPONENTS[p]);
      if (bad.length) { errors.push(`${where}: unknown component ids ${bad.join(', ')}`); return; }

      // 2. protein is recomputed, never trusted
      const sum = v.parts.reduce((a, p) => a + COMPONENTS[p].p, 0);
      sums.push(sum);
      /* The per-slot target is an authoring aid, not the acceptance criterion.
         Vegetables were added to every main meal after these were authored to
         target, which pushed slots a few grams high on purpose. What actually
         has to hold is the DAY band below, enforced across every reachable
         combination of variants. So this is a warning, not an error. */
      const target = targets[slot];
      if (Math.abs(sum - target) > 8)
        warnings.push(`${where}: ${sum}g vs target ${target}g (off by ${sum - target}) :: ${v.t}`);

      // 3. text/parts drift: every part should be recognisable in the text
      const text = norm(v.t);
      const missing = v.parts.filter(p => {
        const kws = keywords(COMPONENTS[p].label);
        return kws.length && !kws.some(k => text.includes(k));
      });
      if (missing.length)
        errors.push(`${where}: parts absent from text [${missing.join(', ')}] :: "${v.t}"`);

      // 4. no em dashes in copy we authored
      if (/—/.test(v.t)) errors.push(`${where}: em dash in text :: ${v.t}`);

      // 5. plate order: a main meal needs a vegetable
      if (['lunch','dinner'].includes(slot) && !v.parts.some(p => VEG.has(p)))
        errors.push(`${where}: main meal with no vegetable :: ${v.t}`);

      // 6. anchor protein repetition
      const anchor = v.parts.find(p => COMPONENTS[p].p >= 19) || v.parts[0];
      anchors[anchor] = (anchors[anchor] || 0) + 1;
    });

    const spread = Math.max(...sums) - Math.min(...sums);
    if (spread > 6) warnings.push(`${day}.${slot}: protein spread ${spread}g across variants (min ${Math.min(...sums)}, max ${Math.max(...sums)})`);
    perSlotSums[slot] = sums;

    for (const [a, n] of Object.entries(anchors))
      if (n > 2) warnings.push(`${day}.${slot}: anchor "${a}" used ${n}/6 times`);
  }

  // 7. worst-case day totals: every reachable combination, not just variant 0
  const slotKeys = Object.keys(perSlotSums);
  const min = slotKeys.reduce((a, k) => a + Math.min(...perSlotSums[k]), 0);
  const max = slotKeys.reduce((a, k) => a + Math.max(...perSlotSums[k]), 0);
  const v0  = slotKeys.reduce((a, k) => a + perSlotSums[k][0], 0);
  dayTotals[day] = { min, max, v0 };
  /* The real criterion. Every reachable combination of rerolls must clear the
     150g target from the listed meals alone, and must not run so far past it
     that protein crowds out the carbs and fat the surplus depends on. */
  if (min < 150) errors.push(`${day}: worst-case day total ${min}g falls under the 150g target`);
  if (max > 185) errors.push(`${day}: best-case day total ${max}g is past the useful ceiling`);
}

console.log('Day protein totals (from listed meals, before the extra dairy):');
console.log('  day   variant0   worst   best');
for (const [d, t] of Object.entries(dayTotals))
  console.log(`  ${d}   ${String(t.v0).padStart(6)}g ${String(t.min).padStart(7)}g ${String(t.max).padStart(6)}g`);

const uniqueMeals = Object.values(BANK).flatMap(s => Object.values(s)).flat().length;
const uniqueComponents = new Set(Object.values(BANK).flatMap(s => Object.values(s)).flat().flatMap(v => v.parts));
console.log(`\n${uniqueMeals} meals, ${uniqueComponents.size} distinct components in use.`);

if (warnings.length) { console.log('\nWARNINGS:'); warnings.forEach(w => console.log('  ! ' + w)); }
if (errors.length)   { console.log('\nERRORS:');   errors.forEach(e => console.log('  x ' + e)); }
console.log(errors.length ? `\nFAIL: ${errors.length} error(s)` : '\nBANK VALID');
process.exit(errors.length ? 1 : 0);
