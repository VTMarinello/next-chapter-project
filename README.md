# Recipe Scaler

Scale any recipe to the number of people you're actually cooking for — and get amounts you can
actually measure.

## Live Demo

[View my project here](https://vtmarinello.github.io/next-chapter-project/)

## Problem

Recipes are written for a fixed number of servings, but people rarely cook for exactly that number.
Adjusting means doing fraction arithmetic in your head, mid-cook, on every line of the ingredient
list. Scaling ⅔ cup for 5 people out of 4 is not something anyone wants to work out while their pan
is heating.

The mistakes are quiet ones. Get an ingredient wrong by a third and the dish is off, but you won't
know why.

Anyone who cooks from a written recipe for a group that isn't the size the recipe assumed has this
problem. Cooking for one from a recipe serving four is just as common as scaling up for guests.

## Value

**Paste in a recipe, say how many people you're feeding, and see the right amounts.**

No mental math, no errors, no scribbling in the margin. And critically — the answer comes back in a
form you can measure. Not `0.5833 cups`, which is arithmetically perfect and useless at a kitchen
counter, but `9 tbsp 1 tsp`.

## Project Plan

The full plan lives in [`PLAN.md`](PLAN.md), including the reasoning behind every design decision.

The project was built in **ten chunks**, one commit each, in dependency order rather than in the
order the features appear on screen:

| # | Chunk | Why it came here |
|---|---|---|
| 1 | Page skeleton | Prove HTML, CSS and JS are connected before building on them |
| 2 | Display a hard-coded recipe | Recipe as *data*, not text — nothing else works without this |
| 3 | Servings input + scaling | The smallest demonstration of value |
| 4 | Nice fractions (`0.75` → `¾`) | Readable output |
| 5 | Mixed-unit decomposition | The hard problem — see below |
| 6 | The editor | Makes the app usable by someone other than me |
| 7 | Paste-and-parse | The centrepiece feature |
| 8 | Save in the browser | Survives a refresh |
| 9 | Styling and layout | Done late, so it styles everything |
| 10 | Empty and invalid input | Hardening, once there was something to harden |

After those ten, the interface was rebuilt around a two-column layout, and a saved-recipes page was
added on top.

Two ordering decisions worth calling out:

- **The editor (6) was built before the parser (7)** deliberately. The parser's output lands in the
  editor, and the editor is where a mis-parsed line gets corrected. Building the parser first would
  have left nowhere to fix its mistakes.
- **Chunk 6 was moved ahead of chunk 5** partway through. After four chunks there was a lot of
  working internal machinery and still no way for a user to type in a recipe. The visible app had
  fallen behind the logic, so the editor was pulled forward.

### The interesting problem

Scaling ⅓ cup by 1.75× gives `0.5833… cups`. Nobody owns a 0.5833 cup measure. There were four
options, each with a real cost:

| Option | Result | Error |
|---|---|---|
| Show the decimal | `0.5833 cups` | none, but useless at the counter |
| Snap to the nearest fraction | `½ cup` | 8.3% off — throws away 1⅓ tbsp |
| Step down one unit | `9⅓ tbsp` | 0.4% off, but an odd way to say it |
| **Decompose down a ladder** | **`9 tbsp 1 tsp`** | **exact** |

The app uses the last one: convert to the smallest unit, then take as many of the largest unit as
fit and carry the remainder down — the same algorithm a cash register uses to pick coins. Because
each unit divides evenly into the next (1 cup = 48 tsp, 1 tbsp = 3 tsp), awkward decimals in cups
frequently resolve to whole numbers further down the ladder. This example lands exactly: ⅓ cup is
16 tsp, ×1.75 is 28 tsp, which is 9 tbsp and 1 tsp with nothing left over.

Decomposing is not always an improvement, though. `4.5 cups` should stay `4½ cups`, not become
`4 cups 8 tbsp` — one measuring cup instead of two. So the rule is **fraction first, decompose only
when the fraction would be meaningfully wrong**, with the line drawn at half a tablespoon of error.

## Features

### Complete

- **Paste a recipe as plain text** and have each line split into amount, unit and ingredient by a
  regex parser
- **Lines that can't be parsed are flagged, never dropped** — the original text is kept in the row
  so there's something to correct rather than retype
- **A review notice** reporting what happened: *"Read 9 of 10 lines. Check the marked one."*
- **Every row is editable** before scaling — add, edit, or delete ingredients
- **Manual entry** for anyone who'd rather type than paste
- **Scaling by serving count**, not by a multiplier — "cooking for 6" is how people actually think
- **Scaling works in both directions.** A recipe that makes 8 scaled for 4 halves everything; the
  maths is one ratio, so shrinking was never a separate feature
- **Measurable output**: fractions (`2¼ cups`), mixed units (`9 tbsp 1 tsp`), rounded metric
  (`438 g`)
- **Lines with no amount pass through untouched** — "Salt and pepper to taste" is correct at any
  batch size, and is marked `(not scaled)` so it doesn't look like a bug
- **Ranges scale end to end** — `2-3 cloves` doubled becomes `4-6 cloves`. Ranges of things you
  *count* round to whole numbers, so scaling by 1.75 gives `4-5 cloves` rather than `3½-5¼`;
  volumes keep their fractions, because `½-¾ cup` is a real instruction
- **Save recipes by name** to a separate [saved recipes page](saved.html), reachable from the
  header. Saved recipes store their *original* amounts plus the servings you last used, so
  reopening and re-scaling can't compound on an earlier scaling
- **The working recipe autosaves** in the browser and survives a refresh, with a "Start over" reset
- **Invalid input doesn't break anything** — a blank or negative servings box shows the recipe
  unscaled with a plain-language message instead of dividing by zero. The servings boxes accept
  digits only
- **It says so when it can't save.** If the browser refuses to store anything, a standing notice
  says the recipe won't survive closing the tab, rather than appearing to work and silently
  losing it
- **Readable on a phone**, since that's where a recipe gets read
- A small **SVG animation** plays when you press "Scale it" — one apple on a table becomes a
  tableful, or clears back down if you're scaling down. It's decoration rather than a feature, but
  it's built the same way as everything else: hand-written CSS keyframes and transitions, no
  animation library. Getting the reversal to look right turned out to be the interesting part —
  see below.

### Next

Three things I'd build with more time:

1. **Print a saved recipe.** A clean print layout — scaled amounts, large type, no interface — so a
   recipe can go on the counter or in a folder without a screen. The saved recipes page is the
   natural place for it, since that's where finished recipes already live.

2. **Handle the awkward input cases better.** The parser is deliberately built to flag what it
   can't read rather than guess, and there are known gaps worth closing: quantities written
   mid-sentence (`Juice of 1 lemon`), nested amounts (`1 (14 oz) can`), and amounts that shrink to
   `0 cup` when a recipe is scaled down hard — that should say "a pinch" or refuse to go below a
   measurable amount, rather than showing zero of a real ingredient.

3. **Scale by what you have on hand.** *"I've only got 2 eggs — what does everything else become?"*
   It's the same ratio the app already uses, run backwards from one ingredient instead of from the
   serving count. The work is in making it feel obvious rather than in the maths: probably a small
   control on the ingredient row itself, so you say "lock this one" and everything else follows.

Deliberately **not** built, so the scope stayed honest:

- **Volume ↔ weight conversion** (cups ↔ grams). This needs a density figure for every individual
  ingredient — a cup of flour and a cup of honey weigh wildly different amounts. That's a bigger
  project than this whole assignment. Note this is *not* the same as the cups → tbsp → tsp
  conversion the app does do, which needs only fixed ratios and no knowledge of the ingredient.
- User accounts, fetching recipes from websites, photo uploads.

## Technologies Used

- **HTML** — two pages: `index.html` (the scaler) and `saved.html` (saved recipes)
- **CSS** — one stylesheet shared by both pages, with custom properties for the palette
- **JavaScript** — `script.js` (all the logic, shared by both pages) and `saved.js` (drawing the
  saved page)
- **`localStorage`** — the browser's built-in key/value store, for saving recipes between visits
- **SVG + CSS keyframes** — the scale animation
- **GitHub Pages** — hosting

Five files, no dependencies. The course lists React and APIs under things the project "does not
need", so libraries were allowed — I skipped them anyway for two reasons: GitHub Pages serves
static files directly, so a build step would be a problem the project doesn't otherwise have; and
every line has to be explainable out loud, which is harder when a library is doing work invisibly.

That constraint had teeth. The animation was first sketched using GSAP, a timeline library loaded
from a CDN. Rebuilding it as plain CSS keyframes and transitions took longer, but "a class toggle
starts four keyframe animations, and each element's delay is its index times 55ms" is something I
can actually explain. It also turned out to be the better design: a CSS *transition* animates
whatever changed in whichever direction it changed, which is what let the animation run backwards —
something the original timeline version couldn't do without conjuring the apples out of nowhere in
its first frame.

## AI Tools Used

**Claude Code (Claude Opus 5)** wrote the code in this repository. That's expected and sanctioned
by the course — the requirement is that I understand it, not that I typed it.

The setup used to stay in control of that:

- **A plan first** ([`PLAN.md`](PLAN.md)) broken into ten chunks, with a decisions table recording
  the *why* behind each choice
- **A builder / explainer split** — one agent implements a single chunk, then a *separate* agent
  reads the finished code with fresh eyes and explains it in plain language. The explainer doesn't
  know what the builder intended, only what the code actually does, which is how several problems
  surfaced.
- **[`docs/code-notes.md`](docs/code-notes.md)** — the resulting plain-English explanation of every
  chunk, including an honest "worth knowing" section per chunk listing what's fragile or debatable
- **A commit per chunk**, so the history shows the project evolving rather than appearing at once
- **Quizzes** on the finished code to find the parts I couldn't explain

[`prompt-history.md`](prompt-history.md) has the prompts that best show how this went — including
the places I pushed back and the AI was wrong.

## Running the Project

**Online:** just open the [live demo](https://vtmarinello.github.io/next-chapter-project/). Nothing
to install.

**Locally:**

```bash
git clone https://github.com/VTMarinello/next-chapter-project.git
cd next-chapter-project
open index.html
```

There is no build step, no `npm install`, and no server required — `index.html` opens straight in a
browser.

One caveat when running from disk: the **"Paste from clipboard" button** may not work over
`file://`, because reading the clipboard programmatically needs a secure context. It works on the
live HTTPS link. The textarea is the primary path and always works — click into it and paste
normally.

### Try it

Paste this into the box and press "Read recipe":

```
2 cups flour
1 1/2 cups whole milk
½ tsp salt
3 large eggs
2-3 cloves garlic
Salt and pepper to taste
250g butter
1 (14 oz) can diced tomatoes
```

Seven of those eight parse cleanly. The tomatoes line gets flagged for you to fix — the nested
`(14 oz)` is a case the parser deliberately refuses to guess at. Then change "Cooking for" to 7 and
press **Scale it**, and watch every amount rework itself into something you could actually measure.
