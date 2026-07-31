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
4. Show scaled amounts in a form a human would use — ¾ rather than 0.75
5. Let the user enter their own recipes, so the app is useful to someone other than the author
6. Remember recipes between visits, so they aren't re-entered every time

## Stretch Features

1. A list of saved recipes to switch between
2. Quick ×2 / ÷2 buttons alongside the serving input
3. Edit or delete a saved recipe
4. A print-friendly view for the scaled recipe

## Explicitly not building

Named here so scope doesn't creep, and so there's a clear answer to *"what would you add next?"*

- User accounts or logins
- Unit conversion (cups ↔ grams) — needs ingredient density data, an entire project of its own
- Fetching recipes from a website
- Photos or image uploads

---

## Chunk Breakdown

Each chunk is one sitting's work and one commit, built in this order. Value lands at chunk 3 —
everything before it is groundwork, everything after is making it genuinely usable.

| # | Chunk | Status | Commit message | Explained |
|---|---|---|---|---|
| 1 | Page skeleton — `index.html`, `style.css`, `script.js` created and correctly linked, with something visible on screen proving all three are connected | not started | `Create page structure` | ☐ |
| 2 | Display one hard-coded recipe on the page, built from data in JavaScript rather than typed into the HTML | not started | `Display a recipe` | ☐ |
| 3 | **Serving input + scaling.** Change the number, every amount recalculates. *This is the smallest demonstration of value* | not started | `Scale ingredients by servings` | ☐ |
| 4 | Readable amounts — turn `0.75` into `¾`, round sensibly, handle amounts that don't divide cleanly | not started | `Show amounts as fractions` | ☐ |
| 5 | A form to add your own recipe — name, servings, ingredient rows | not started | `Add recipe form` | ☐ |
| 6 | Save recipes in the browser so they survive a refresh | not started | `Save recipes in the browser` | ☐ |
| 7 | Styling and layout — readable on a phone, since that's where a recipe gets read | not started | `Style the layout` | ☐ |
| 8 | Empty states and invalid input — zero servings, negative numbers, blank fields, no recipes yet | not started | `Handle empty and invalid input` | ☐ |

**Status values:** not started → building → explained → committed

### The one genuinely interesting problem

Chunk 4 is where the real thinking is, and it's worth knowing that going in, because it's what
an interviewer will ask about.

Scaling ⅓ cup for 1.75× the servings gives 0.5833… cups. Nobody owns a 0.5833 cup measure. The
app has to decide what to show. Options, each with a cost:

- **Round to a familiar fraction** (½, ⅔, ¾) — usable, but slightly wrong
- **Show the decimal** — accurate, but useless at the counter
- **Convert to smaller units** — 0.58 cups becomes ~9⅓ tablespoons; accurate and usable, but
  more machinery

There is no correct answer, only a defensible choice. Whichever gets picked, the reasoning is
the answer to *"why did you choose this solution?"*

---

## Decisions and Changes

| Date | Decision | Why |
|---|---|---|
| 2026-07-31 | Recipe scaler over setlist builder, lending tracker, split-the-bill | Smallest of the options while still containing real logic. A pure list app gives nothing interesting to explain in the interview; the fraction problem does. |
| 2026-07-31 | Scaling by serving count, not by a multiplier | "Cooking for 6" is how people actually think. "×1.5" makes the user do the first calculation themselves, which is the thing being solved. |
| 2026-07-31 | Users can add their own recipes (required, not stretch) | The course requires value *to another person*. An app containing only the author's hard-coded recipes isn't usable by anyone else. |
| 2026-07-31 | Browser storage, no database | Course rules exclude databases, and storing recipes in the browser is enough for one person on one device. |
| 2026-07-31 | No unit conversion | Converting cups to grams needs a density figure per ingredient. That's a bigger project than this whole assignment. |
