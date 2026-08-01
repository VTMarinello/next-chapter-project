# Project Plan — Recipe Scaler

## Problem

Recipes are written for a fixed number of servings, but people rarely cook for exactly that
number. Adjusting means doing fraction arithmetic in your head, mid-cook, on every line of the
ingredient list — ⅔ cup scaled for 5 people out of 4 is not something anyone wants to work out
while their pan is heating.

The mistakes are quiet ones. Get an ingredient wrong by a third and the dish is off, but you
won't know why.

**Who has it:** anyone who cooks from a written recipe for a group that isn't the size the
recipe assumed. Cooking for one from a recipe serving four is just as common as scaling up for
guests.

---

## Value

**Enter how many people you're actually cooking for, and see the right amounts.**

No mental math, no errors, no scribbling on the recipe.

---

## Smallest Demonstration of Value

One recipe on screen. Change the serving number. Every ingredient quantity updates to match.

That alone proves the idea works. Everything after it is convenience.

---

## Required Features

1. Display a recipe — name, serving count, list of ingredients with amounts and units
2. Change the number of servings
3. Recalculate every ingredient amount to match the new serving count
4. Show scaled amounts in a form a human would use — `¾ cup`, or `9 tbsp 1 tsp`, never `0.5833 cups`
5. Let the user enter their own recipes, so the app is useful to someone other than the author
6. Paste a recipe as plain text and have it broken into ingredient rows automatically
7. Remember recipes between visits, so they aren't re-entered every time

## Stretch Features

1. A list of saved recipes to switch between
2. Quick ×2 / ÷2 buttons alongside the serving input
3. Edit or delete a saved recipe
4. A print-friendly view for the scaled recipe

## Explicitly not building

Named here so scope doesn't creep, and so there's a clear answer to *"what would you add next?"*

- User accounts or logins
- **Volume ↔ weight conversion** (cups ↔ grams) — needs a density figure for every ingredient, an
  entire project of its own. Note this is *not* the same as the volume ↔ volume conversion the
  formatter does (cups → tbsp → tsp), which needs only fixed ratios and no knowledge of the
  ingredient. See "Formatting strategy" below.
- Fetching recipes from a website — the paste box takes text the user already has; the app never
  goes out and gets it
- Photos or image uploads

---

## Chunk Breakdown

Each chunk is one sitting's work and one commit, built in this order. Value lands at chunk 3 —
everything before it is groundwork, everything after is making it genuinely usable.

| # | Chunk | Status | Commit message | Explained |
|---|---|---|---|---|
| 1 | Page skeleton — `index.html`, `style.css`, `script.js` created and correctly linked, with something visible on screen proving all three are connected | committed | `Create page structure` | ☑ |
| 2 | Display one hard-coded recipe on the page, built from data in JavaScript rather than typed into the HTML | not started | `Display a recipe` | ☐ |
| 3 | **Serving input + scaling.** Change the number, every amount recalculates. *This is the smallest demonstration of value* | not started | `Scale ingredients by servings` | ☐ |
| 4 | Nice fractions — turn `0.75` into `¾` by snapping to the nearest amount a cook can actually measure | not started | `Show amounts as fractions` | ☐ |
| 5 | **Mixed-unit decomposition.** `0.5833 cups` → `9 tbsp 1 tsp`. The change-making ladder, plus the rule deciding when a plain fraction is good enough | not started | `Break amounts into mixed units` | ☐ |
| 6 | A form to add your own recipe — name, servings, ingredient rows. Also the correction UI the parser depends on | not started | `Add recipe form` | ☐ |
| 7 | **Paste-and-parse.** Drop in recipe text, regex splits each line into amount / unit / ingredient and fills the form. Unparsed lines flagged for manual fixing | not started | `Parse pasted recipe text` | ☐ |
| 8 | Save recipes in the browser so they survive a refresh | not started | `Save recipes in the browser` | ☐ |
| 9 | Styling and layout — readable on a phone, since that's where a recipe gets read | not started | `Style the layout` | ☐ |
| 10 | Empty states and invalid input — zero servings, negative numbers, blank fields, no recipes yet | not started | `Handle empty and invalid input` | ☐ |

Chunks 6 and 7 are in that order deliberately: the parser's output lands in the form, and the form
is where mis-parsed lines get corrected. Building the parser first would leave nowhere to fix its
mistakes.

**Status values:** not started → building → explained → committed

### The one genuinely interesting problem

Chunks 5 and 7 are where the real thinking is, and it's worth knowing that going in, because it's
what an interviewer will ask about.

Scaling ⅓ cup for 1.75× the servings gives 0.5833… cups. Nobody owns a 0.5833 cup measure. The
app has to decide what to show. Four options, each with a cost:

| Option | Result | Error | Verdict |
|---|---|---|---|
| Show the decimal | `0.5833 cups` | none | Accurate, useless at the counter |
| Snap to a familiar fraction | `½ cup` | 8.3% off | Readable, but throws away 1⅓ tbsp |
| Step down one unit | `9⅓ tbsp` | 0.4% off | Better, but an odd way to say it |
| **Decompose down a ladder** | **`9 tbsp 1 tsp`** | **exact** | **Chosen** |

**Chosen: decomposition.** Convert to the smallest unit, then take as many of the largest unit as
fit and carry the remainder down — the same algorithm a cash register uses to pick coins. Because
each unit divides evenly into the next, awkward decimals in cups frequently resolve to whole
numbers further down the ladder. This example lands exactly: ⅓ cup is 16 tsp, ×1.75 is 28 tsp,
which is 9 tbsp and 1 tsp with nothing left over.

See "Formatting strategy" below for the full rules.

---

## Formatting strategy

How a scaled number becomes something a person can measure. Applied per ingredient, based on what
kind of unit it uses.

| Unit type | Examples | Treatment |
|---|---|---|
| Imperial volume | cup, tbsp, tsp | Try a fraction; decompose down the ladder if the fraction isn't close enough |
| Metric weight/volume | g, kg, ml, l | Round to sensible precision. `247.3g` → `247g`. No fractions — metric multiplies cleanly |
| Countable | eggs, cloves, cans, sticks | Show the honest number, including `1⅓ eggs`. The cook decides whether to round |
| None | "to taste", "a splash" | Pass through untouched — correct at any batch size |

### The ladder

```
1 cup = 16 tbsp        1 tbsp = 3 tsp        so 1 cup = 48 tsp
```

Convert the amount to teaspoons, then divide back down, largest unit first, carrying the remainder:

```
28 tsp  ÷ 48  =  0 cups,  remainder 28 tsp
        ÷  3  =  9 tbsp,  remainder  1 tsp     →  "9 tbsp 1 tsp"
```

Units contributing zero are omitted — never `0 cups 9 tbsp 1 tsp`.

### Fraction first, decompose second

Decomposition is not always an improvement. `4.5 cups` should display as `4½ cups`, not
`4 cups 8 tbsp` — one measuring cup instead of two, and easier to read.

So the rule is: **snap to a nice fraction first, and keep it if the error is small enough.
Decompose only when the fraction would be meaningfully wrong.** Tolerance: if snapping is off by
more than half a tablespoon, decompose instead. That number is a judgment call and can be tuned.

Nice fractions are the amounts a measuring set can actually express: `¼ ⅓ ½ ⅔ ¾`. Snapping picks
whichever is closest by simple distance, which means the boundaries never get hand-written — add
`⅛` to the list and every boundary re-arranges itself correctly.

### The tail

Once the remainder falls below the finest measurable amount — ⅛ tsp — drop it. Anything above it
snaps to a nice fraction, so the last term reads `1½ tsp` and never `1.4 tsp` or `0.3 tsp`.

---

## Parsing rules

Chunk 7. A **regex** (regular expression — a pattern for finding structure in text) splits each
pasted line into three parts:

```
[amount] [unit] [ingredient]

2 cups flour          →  2      | cups | flour
1 1/2 cups whole milk →  1.5    | cups | whole milk
½ tsp salt            →  0.5    | tsp  | salt
3 large eggs          →  3      |      | large eggs
```

The unit is identified by checking the second word against a known-units list. If it isn't on the
list, it belongs to the ingredient name — which is what makes `3 large eggs` parse correctly
without any special case.

Amounts arrive in several forms and all normalise to a number: `2`, `1.5`, `1/2`, `1 1/2`, `½`.

### The three rules

1. **No number → leave the line alone.** `Salt and pepper to taste` is correct at any batch size.
   Marked unscalable and passed through verbatim.
2. **Ranges scale end to end.** `2-3 cloves` → `4-6 cloves`. A range isn't a special kind of
   number; it's two ordinary numbers with a dash between them. Split, scale each half with the
   same function, rejoin.
3. **Anything unparsed is flagged, never dropped.** It appears in the form for the user to fix by
   hand.

### Why rule 3 is the important one

Recipe text is not standardised, and some lines cannot be parsed by any pattern:

```
1 (14 oz) can diced tomatoes     nested amount
Juice of 1 lemon                 number in the wrong place
```

Perfect parsing is impossible, and the course forbids AI features, so there is no model to fall
back on. **The design answer is to make imperfection cheap rather than to chase perfection:** the
parser fills in what it understands, flags what it doesn't, and the user corrects it in place. It
is a time-saver, not an oracle. Twelve lines parsed and one fixed by hand still beats typing
thirteen.

---

## Function breakdown

Deliberately fine-grained — more functions than a working programmer would write, each small
enough to explain out loud in a sentence. See the code style note in `CLAUDE.md`.

**Parsing** — text in, structured data out

| Function | Job |
|---|---|
| `splitIntoLines(text)` | Pasted blob → array of lines |
| `parseLine(line)` | One line → `{amount, unit, name}` |
| `readLeadingAmount(text)` | Grab the number part off the front |
| `amountTextToNumber(text)` | `"1 1/2"` → `1.5` |
| `fractionCharToNumber(char)` | `"½"` → `0.5` |
| `isRange(text)` | Does it look like `2-3`? |
| `looksLikeUnit(word)` | Is this word on the known-units list? |

**Scaling** — the math

| Function | Job |
|---|---|
| `calculateMultiplier(wanted, makes)` | The one ratio everything uses |
| `scaleAmount(amount, multiplier)` | One number × multiplier |
| `scaleRange(range, multiplier)` | Calls `scaleAmount` twice |
| `scaleIngredient(ing, multiplier)` | Skips unscalable lines |

**Formatting** — the interesting part

| Function | Job |
|---|---|
| `classifyUnit(unit)` | volume / weight / count / none |
| `toBaseUnit(amount, unit)` | Everything → teaspoons (or grams) |
| `decomposeToUnits(baseAmount, ladder)` | The change-making loop |
| `snapToNiceFraction(decimal)` | `0.33` → `⅓` |
| `isFractionGoodEnough(amount, unit)` | Decides fraction vs. decompose |
| `dropNegligibleTail(parts)` | Kills the `0.3 tsp` remainders |
| `roundWeight(number)` | `247.3` → `247` |
| `formatParts(parts)` | `[5 cups, 2 tbsp]` → `"5 cups 2 tbsp"` |
| `formatAmount(amount, unit)` | Top level — picks the strategy above |

**Display & storage**

| Function | Job |
|---|---|
| `renderRecipe(recipe, servings)` | Draw everything |
| `renderIngredientRow(ing)` | One line of the list |
| `readFormIntoRecipe()` | Form fields → recipe object |
| `saveRecipes()` / `loadRecipes()` | Browser storage |

---

## Decisions and Changes

| Date | Decision | Why |
|---|---|---|
| 2026-07-31 | Recipe scaler over setlist builder, lending tracker, split-the-bill | Smallest of the options while still containing real logic. A pure list app gives nothing interesting to explain in the interview; the fraction problem does. |
| 2026-07-31 | Scaling by serving count, not by a multiplier | "Cooking for 6" is how people actually think. "×1.5" makes the user do the first calculation themselves, which is the thing being solved. |
| 2026-07-31 | Users can add their own recipes (required, not stretch) | The course requires value *to another person*. An app containing only the author's hard-coded recipes isn't usable by anyone else. |
| 2026-07-31 | Browser storage, no database | Course rules exclude databases, and storing recipes in the browser is enough for one person on one device. |
| 2026-07-31 | No volume ↔ weight conversion | Converting cups to grams needs a density figure per ingredient. That's a bigger project than this whole assignment. Volume ↔ volume (cups → tbsp → tsp) is in scope — fixed ratios, no ingredient knowledge needed. |
| 2026-07-31 | Paste-and-parse added as a required feature | A bare form plus multiplication is thin — technically and practically. Parsing pasted text is the difference between "useful" and "a demo". |
| 2026-07-31 | Mixed-unit decomposition over rounding to a fraction | Rejected the first suggestion (snap `0.5833 cups` to `½ cup`) as throwing away 1⅓ tbsp, and the second (`9⅓ tbsp`) as an odd way to say it. The ladder gives `9 tbsp 1 tsp` — exact, and how a person would actually say it. **User's idea, pushed back against the AI's suggestion.** |
| 2026-07-31 | Fraction first, decompose only when needed | Decomposition isn't always better: `4½ cups` beats `4 cups 8 tbsp`. Tolerance of half a tablespoon draws the line. |
| 2026-07-31 | Countable items show honest fractions — `1⅓ eggs` | Considered forcing whole numbers and rejected it. The app's job is correct arithmetic; how much egg to waste is the cook's call, not the program's. |
| 2026-07-31 | Unparsed lines are flagged, never dropped | Perfect parsing of non-standard recipe text is impossible and AI features are forbidden by the course. Designing so imperfection is cheap to correct beats chasing accuracy that can't be reached. |
| 2026-07-31 | Form built before parser (chunk 6 before 7) | The parser's output lands in the form, and the form is where mis-parses get fixed. Parser first would leave nowhere to correct its mistakes. |
