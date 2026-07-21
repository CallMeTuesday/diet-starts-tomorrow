/* COMPONENT TABLE - the single source of truth for protein.
 *
 * Every meal in the bank is a list of component ids. Protein per meal is the
 * SUM of its components, computed at build time, never hand-typed. That is the
 * whole point: the previous bank's numbers were authored by hand and several
 * were wrong by 5-10g, which is enough to miss a 150g daily target invisibly.
 *
 * Protein values are grams per the stated portion, cooked weight where the food
 * is eaten cooked, from standard composition data. Rounded to the nearest gram.
 *
 * Portions are ordinary servings. Nothing here is a supplement or a drug.
 */

const COMPONENTS = {
  /* ---- poultry & meat (cooked weight) ---- */
  chickenBreast5:   { label: "chicken breast (5oz)",        p: 44 },
  chickenBreast6:   { label: "chicken breast (6oz)",        p: 53 },
  chickenThigh6:    { label: "chicken thigh (6oz)",         p: 44 },
  turkeyBreast5:    { label: "turkey breast (5oz)",         p: 43 },
  turkeyGround6:    { label: "ground turkey (6oz)",         p: 43 },
  beefSirloin6:     { label: "sirloin (6oz)",               p: 48 },
  beefGround6:      { label: "ground beef 90/10 (6oz)",     p: 44 },
  lambLoin5:        { label: "lamb loin (5oz)",             p: 38 },
  porkTenderloin6:  { label: "pork tenderloin (6oz)",       p: 44 },
  chickenSausage2:  { label: "chicken sausage (2 links)",   p: 22 },
  merguez4:         { label: "merguez (4oz)",               p: 21 },

  /* ---- seafood (cooked / drained) ----
   * `g`  = portion in grams, `hg` = mean methylmercury in ppm (mg/kg), from FDA
   * monitoring data. Mercury per portion is g * hg micrograms, computed by
   * scripts/mercury.js and gated against a weekly ceiling.
   *
   * SPECIES IS NAMED DELIBERATELY. "Mackerel" spans a 15x mercury range: Atlantic
   * mackerel is 0.05 and an FDA Best Choice, king mackerel is 0.73 and on the
   * avoid list. "Tuna" spans 0.126 (skipjack) to 0.689 (bigeye). An unlabelled
   * meal plan lets the shopper pick the wrong end of that range by accident, so
   * the label carries the species and the shopping decision is already made.
   */
  salmon6:          { label: "salmon (6oz)",                p: 42, g:170, hg:0.022 },
  salmon5:          { label: "salmon (5oz)",                p: 35, g:142, hg:0.022 },
  mackerel6:        { label: "Atlantic mackerel (6oz)",     p: 43, g:170, hg:0.050 },
  sardineTin:       { label: "sardines (1 tin)",            p: 23, g: 92, hg:0.013 },
  anchovyTin:       { label: "anchovies (1 tin)",           p: 14, g: 50, hg:0.017 },
  tunaCanned5:      { label: "canned skipjack tuna (5oz)",  p: 35, g:142, hg:0.126 },
  shrimp6:          { label: "shrimp (6oz)",                p: 41, g:170, hg:0.009 },
  mussels4:         { label: "mussels (4oz)",               p: 24, g:113, hg:0.023 },
  oysters6:         { label: "oysters (6)",                 p:  8, g: 50, hg:0.012 },
  octopus5:         { label: "grilled octopus (5oz)",       p: 42, g:142, hg:0.028 },
  troutFillet6:     { label: "trout (6oz)",                 p: 40, g:170, hg:0.071 },
  hake6:            { label: "hake (6oz)",                  p: 37, g:170, hg:0.079 },
  haddock6:         { label: "haddock (6oz)",               p: 41, g:170, hg:0.055 },
  pollock6:         { label: "pollock (6oz)",               p: 39, g:170, hg:0.031 },
  scallops6:        { label: "scallops (6oz)",              p: 35, g:170, hg:0.003 },
  salmonCanned5:    { label: "canned salmon (5oz)",         p: 35, g:142, hg:0.022 },

  /* ---- eggs & dairy ---- */
  eggs3:            { label: "3 eggs",                      p: 19 },
  eggs2:            { label: "2 eggs",                      p: 13 },
  cottageCheese1c:  { label: "cottage cheese (1 cup)",      p: 25 },
  cottageCheeseHalf:{ label: "cottage cheese (½ cup)",      p: 13 },
  greekYogurt1c:    { label: "Greek yogurt (1 cup)",        p: 22 },
  skyr1c:           { label: "skyr (1 cup)",                p: 24 },
  kefir1c:          { label: "kefir (1 cup)",               p:  9 },
  whey1:            { label: "whey (1 scoop)",              p: 24 },
  ricottaHalf:      { label: "ricotta (½ cup)",             p: 14 },
  feta1oz:          { label: "feta (1oz)",                  p:  4 },
  parmesan1oz:      { label: "parmesan (1oz)",              p: 10 },
  halloumi2oz:      { label: "halloumi (2oz)",              p: 13 },
  labneh_half:      { label: "labneh (½ cup)",              p: 10 },
  milk1c:           { label: "milk (1 cup)",                p:  8 },

  /* ---- legumes & grains ---- */
  lentilsHalf:      { label: "lentils (½ cup)",             p:  9 },
  chickpeasHalf:    { label: "chickpeas (½ cup)",           p:  7 },
  whiteBeansHalf:   { label: "white beans (½ cup)",         p:  8 },
  blackBeansHalf:   { label: "black beans (½ cup)",         p:  8 },
  favaBeansHalf:    { label: "fava beans (½ cup)",          p:  7 },
  edamameHalf:      { label: "edamame (½ cup)",             p:  9 },
  quinoa1c:         { label: "quinoa (1 cup)",              p:  8 },
  farro1c:          { label: "farro (1 cup)",               p:  8 },
  bulgur1c:         { label: "bulgur (1 cup)",              p:  6 },
  freekeh1c:        { label: "freekeh (1 cup)",             p:  8 },
  oatsQuarterDry:   { label: "steel-cut oats (¼ cup dry)",  p:  7 },
  jasmineRice1c:    { label: "jasmine rice (1 cup)",        p:  4 },
  sourdough2:       { label: "sourdough (2 slices)",        p:  8 },
  sourdough1:       { label: "sourdough (1 slice)",         p:  4 },
  cornTortilla2:    { label: "corn tortillas (2)",          p:  4 },
  riceCakes2:       { label: "rice cakes (2)",              p:  2 },

  /* ---- nuts & seeds ---- */
  walnuts1oz:       { label: "walnuts (1oz)",               p:  4 },
  pistachios1oz:    { label: "pistachios (1oz)",            p:  6 },
  almonds1oz:       { label: "almonds (1oz)",               p:  6 },
  pumpkinSeeds1oz:  { label: "pumpkin seeds (1oz)",         p:  9 },
  hempHearts3T:     { label: "hemp hearts (3 tbsp)",        p: 10 },
  chia2T:           { label: "chia (2 tbsp)",               p:  4 },
  almondButter2T:   { label: "almond butter (2 tbsp)",      p:  7 },
  tahini2T:         { label: "tahini (2 tbsp)",             p:  5 },

  /* ---- vegetables (cooked, per the standing no-raw-greens rule) ---- */
  spinachCooked1c:  { label: "sautéed spinach",             p:  5 },
  chardCooked1c:    { label: "sautéed chard",               p:  4 },
  kaleCooked1c:     { label: "garlicky kale",               p:  4 },
  beetGreens1c:     { label: "sautéed beet greens",         p:  4 },
  arugulaWilted1c:  { label: "wilted arugula",              p:  3 },
  beets1c:          { label: "roasted beets",               p:  3 },
  broccoli1c:       { label: "broccoli",                    p:  4 },
  brusselsSprouts1c:{ label: "brussels sprouts",            p:  4 },
  bokChoy1c:        { label: "bok choy",                    p:  3 },
  asparagus1c:      { label: "asparagus",                   p:  3 },
  zucchiniNoodles:  { label: "zucchini noodles",            p:  2 },
  cauliflowerRice1c:{ label: "cauliflower rice",            p:  2 },
  roastedRoots1c:   { label: "roasted root vegetables",     p:  3 },
  sweetPotato:      { label: "roasted sweet potato",        p:  2 },
  squashRoasted1c:  { label: "roasted squash",              p:  2 },
  redCabbage1c:     { label: "braised red cabbage",         p:  2 },
  tomato:           { label: "tomato",                      p:  1 },
  peppersSauteed:   { label: "sautéed peppers",             p:  1 },
  mushroomsSauteed: { label: "sautéed mushrooms",           p:  3 },
  avocadoHalf:      { label: "½ avocado",                   p:  2 },
  olives:           { label: "olives",                      p:  1 },
  garlic:           { label: "garlic",                      p:  0 },

  /* ---- fruit ---- */
  blueberries1c:    { label: "blueberries",                 p:  1 },
  blackberries1c:   { label: "blackberries",                p:  2 },
  raspberries1c:    { label: "raspberries",                 p:  1 },
  strawberries1c:   { label: "strawberries",                p:  1 },
  cherries1c:       { label: "cherries",                    p:  2 },
  pomegranate_half: { label: "pomegranate seeds",           p:  1 },
  watermelon2c:     { label: "watermelon",                  p:  2 },
  orangeSegments:   { label: "orange",                      p:  1 },
  banana:           { label: "banana",                      p:  1 },
  figs2:            { label: "figs (2)",                    p:  1 },

  /* ---- fats & extras ---- */
  oliveOil2T:       { label: "olive oil",                   p:  0 },
  darkChocolate1oz: { label: "85% dark chocolate (1oz)",    p:  3 },
  coffee:           { label: "coffee",                      p:  0 },
  lemon:            { label: "lemon",                       p:  0 },
  herbs:            { label: "herbs",                       p:  0 },
  cinnamon:         { label: "cinnamon",                    p:  0 },
};

module.exports = { COMPONENTS };
