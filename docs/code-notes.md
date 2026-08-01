# Code Notes

Plain-English explanations of every chunk built, written by reading the finished code rather
than by the thing that wrote it. Written for someone who has to explain this code out loud.

---

## Chunk 1 — Page skeleton

**What it does for the user:**
Nothing useful yet — and that's the point. Opening `index.html` in a browser shows a
cream-coloured page with the title "Recipe Scaler" in rust red, a one-line description of what
the finished app will do, and below it a small white box outlined in the same rust red
containing the sentence "JavaScript is connected. This sentence came from script.js." That box
is the whole deliverable: it's visible proof that the three files of a web page — the content
file, the styling file, and the behaviour file — are wired together correctly, before any recipe
logic gets built on top of them.

**How it works, step by step:**

1. The browser opens `index.html` and reads it top to bottom. `<!DOCTYPE html>` tells it to use
   modern rules; `<meta charset="UTF-8">` tells it the text is encoded in UTF-8, the character
   set that includes accents and the ⅔-style fraction characters chunk 4 will need.
2. Line 8 hits `<link rel="stylesheet" href="style.css">`, which tells the browser to go fetch
   the styling file. That's how the CSS gets attached — the two files know nothing about each
   other otherwise.
3. The browser draws the `<header>`: the `<h1>` heading and the description paragraph.
4. It draws the `<main>` section, which contains one paragraph: `<p id="connection-status"></p>`.
   It is deliberately empty. An `id` is a unique name tag on an element so other code can find
   it later.
5. Line 23, the last thing before the page ends, is `<script src="script.js"></script>`. The
   browser fetches and runs the JavaScript. Because this tag sits at the *bottom* of the body,
   every element above it already exists by the time the script runs — that's why the placement
   matters, not just tidiness.
6. `script.js` defines a function called `showConnectionStatus` (a function is a named block of
   instructions that only runs when you call it), then on line 12 calls it once.
7. Inside, `document.getElementById("connection-status")` searches the loaded page for the
   element whose id matches that string, and hands it back. `document` is the browser's live
   in-memory version of the page.
8. `statusParagraph.textContent = "..."` writes the sentence into that empty paragraph as plain
   text. The screen updates immediately.
9. Meanwhile `style.css` has already given `#connection-status` (the `#` means "the element with
   this id") a border, rounded corners, padding and a white background — so the sentence lands
   inside a visible box.

**The pieces:**

| Thing | Where | What it's for |
|---|---|---|
| `<link rel="stylesheet">` | index.html:8 | Connects the CSS file. Without it the page is unstyled black-on-white |
| `<p id="connection-status">` | index.html:19 | The empty target. The only element JavaScript touches |
| `<script src="script.js">` | index.html:23 | Connects the JS file. Placed last so the paragraph exists first |
| `body { ... }` | style.css:3-11 | Readable defaults: system font, 40rem max width, centred, cream background |
| `#connection-status { ... }` | style.css:18-23 | The box. Makes the CSS's involvement visible, not just the JS's |
| `showConnectionStatus()` | script.js:4-10 | Finds the paragraph and writes the proof sentence into it |
| `showConnectionStatus();` | script.js:12 | Actually runs it. Defining a function does nothing on its own |

**Terms introduced:**

- **HTML** — the file that says what's on the page (headings, paragraphs) and in what order.
- **CSS** — the file that says what it looks like (colour, spacing, borders).
- **JavaScript** — the file that says what happens (changing the page after it's loaded).
- **element** — one item in the HTML, like a paragraph or a heading, written between tags.
- **id** — a unique name given to one element so code can find exactly that one.
- **DOM** (`document`) — the browser's live model of the page in memory; changing it changes
  what's on screen instantly.
- **`textContent`** — the plain text inside an element. Setting it replaces whatever text was
  there.
- **function** — a named set of instructions that runs only when called by name.
- **`rem`** — a size unit equal to the browser's base font size, so `40rem` grows if the user has
  enlarged their text.

**Worth knowing:**

- **The string `"connection-status"` is written in three separate files** (index.html:19,
  style.css:18, script.js:6) and nothing enforces that they match. Rename the id in the HTML and
  the CSS box quietly disappears, while the JavaScript crashes: `getElementById` returns `null`
  when it finds nothing, and setting `.textContent` on `null` throws an error that only appears
  in the browser's developer console. The page would look blank with no on-screen explanation.
  There is no check for `null` in the code.
- **The failure mode is confusingly quiet.** If the JavaScript file fails to load entirely, the
  CSS still draws an empty bordered box — so you'd see a small blank rectangle rather than an
  obvious error. Conversely, if the CSS fails, the sentence still appears, just unstyled. Worth
  knowing which symptom means what: sentence but no box = CSS broken; box but no sentence = JS
  broken.
- **Wrapping one line in a function is a style choice, not a necessity.**
  `showConnectionStatus` is defined and immediately called once, and never called again. Two
  bare lines would behave identically. It's defensible as habit-forming structure, but be honest
  that it buys nothing here.
- **The colour `#a4432b` is hard-coded twice** in style.css (the heading and the border).
  Changing the theme means changing two places. A CSS custom property would fix that — a
  reasonable thing to say you'd do in chunk 9.
- **The viewport `<meta>` tag is present** (line 6) even though there's no phone-specific styling
  yet. It's harmless and correct to have early — without it phones shrink the whole page to
  simulate a desktop.
- **`textContent` rather than `innerHTML`** is the safer choice: it inserts text as text, so a
  stray `<` or `&` can never be mistaken for markup. That matters later when users type their
  own recipe names in chunk 6.

**Three questions an interviewer could ask:**

1. Your `<script>` tag is at the bottom of the body and there's a comment saying that's so the
   HTML already exists. What actually goes wrong if you move it into the `<head>` instead — and
   what's the alternative that lets you keep it in the head?
2. `document.getElementById("connection-status")` assumes that element exists. What does the
   variable hold if someone renames the id in `index.html`, what does the next line do with it,
   and where would a user see that failure?
3. You said the sentence in the box proves JavaScript is connected. What exactly does it prove
   and what does it *not* prove — for instance, if `style.css` failed to load, would you be able
   to tell from that box?

---

## Chunk 2 — Display a recipe

**What it does for the user:**
Opening `index.html` now shows an actual recipe: "Pancakes," a line saying "Serves 4," and a
bulleted list of five ingredients with their amounts — "2 cups flour," "1.5 cups milk," "3 large
eggs," "2 tbsp sugar," and "Salt and pepper to taste." None of that text exists in the HTML file.
It's built entirely by JavaScript, which reads the recipe from a chunk of data it holds internally
and writes the matching HTML onto the page the instant the page loads.

**How it works, step by step:**

1. The browser loads `index.html` as before. Inside `<main>` there's now a `<div id="recipe"></div>`
   — an empty container with nothing in it, just a labeled empty box waiting to be filled.
2. `script.js` loads last, as in chunk 1. Near the top it defines `exampleRecipe`, a JavaScript
   **object** (a bundle of related data given as `name: value` pairs, like a labeled box of facts)
   that has a `name`, a `servings` number, and an `ingredients` list.
3. `ingredients` is an **array** (an ordered list of items) of five smaller objects, one per
   ingredient. Each has three fields: `amount` (a number, or `null` — JavaScript's way of saying
   "no value" — when there isn't a numeric amount), `unit` (a string, or `""`, an empty string,
   when there's no unit), and `name`.
4. The very last line of the file, `renderRecipe(exampleRecipe)`, is what actually makes anything
   happen. Defining functions doesn't run them — this line is the trigger, same lesson as chunk 1.
5. `renderRecipe` finds the empty `<div id="recipe">` using `document.getElementById("recipe")`,
   then builds and inserts, one at a time: an `<h2>` with the recipe's name, a `<p>` reading
   "Serves 4," and a `<ul>` (an unordered/bulleted list) that it fills by looping over every
   ingredient in the array.
6. For each ingredient, `renderRecipe` calls `renderIngredientRow`, which builds one `<li>` (list
   item) element and hands it back. `renderRecipe` appends each returned `<li>` into the `<ul>`.
7. `renderIngredientRow` doesn't format the text itself — it calls `formatIngredientText` to turn
   the `{amount, unit, name}` object into a single readable string, then sets that string as the
   `<li>`'s `textContent`.
8. `formatIngredientText` builds the string piece by piece: it only includes the amount if it isn't
   `null`, only includes the unit if it isn't `""`, and always includes the name. It joins whatever
   survives with spaces. That's why "Salt and pepper to taste" doesn't come out as
   "null  Salt and pepper to taste" — the missing amount is skipped entirely rather than printed as
   the word "null."
9. `style.css` gives the `#recipe` div a border, rounded corners, and padding, so the whole thing
   appears as a distinct card rather than plain text sitting on the page.

**The pieces:**

| Thing | Where | What it's for |
|---|---|---|
| `<div id="recipe">` | index.html:19 | Empty on purpose; the only element this chunk's JS touches |
| `exampleRecipe` | script.js:9-19 | The hard-coded recipe data — one object with a name, servings, and an array of ingredient objects |
| `formatIngredientText(ingredient)` | script.js:24-38 | Turns one ingredient object into one line of text, skipping missing amount/unit |
| `renderIngredientRow(ingredient)` | script.js:42-46 | Turns one ingredient object into one `<li>` element |
| `renderRecipe(recipe)` | script.js:50-67 | Builds the heading, servings line, and full ingredient list, and inserts all of it into `#recipe` |
| `renderRecipe(exampleRecipe);` | script.js:69 | Actually runs the above — nothing appears without this line |
| `#recipe { ... }` | style.css:18-23 | Border, padding, background so the recipe reads as a card |

**Terms introduced:**

- **object** — a bundle of related data, written as `label: value` pairs inside `{ }`.
  `exampleRecipe` is an object; each ingredient is also an object.
- **array** — an ordered list of items, written inside `[ ]`. `ingredients` is an array of
  ingredient objects.
- **`null`** — JavaScript's explicit "there is no value here," distinct from `0` or `""`. Used for
  `amount` when an ingredient has no number.
- **string** — text data, written in quotes. `""` (empty string) is a string with nothing in it,
  used here for "no unit."
- **`document.createElement(...)`** — asks the browser to build a new, not-yet-visible HTML element
  (like a `<li>` or `<h2>`) in memory, so code can fill it in before adding it to the page.
- **`appendChild(...)`** — inserts an element into the page (or into another element) as its newest
  last child, making it visible.
- **loop (`for...of`)** — a block of code that repeats once for every item in an array; here it runs
  once per ingredient.

**Why the data lives in JavaScript rather than being typed into the HTML:**

If "Pancakes," "4," and the five ingredient lines were typed directly into `index.html` as plain
text, that's *all* they could ever be — text sitting on a page. There would be nothing for code to
grab onto: no way to ask "what's the amount of the second ingredient?" or "multiply every amount by
1.5." By keeping the recipe as a JavaScript object instead, each ingredient is a structured piece of
data with separately addressable `amount`, `unit`, and `name` fields. Chunk 3 needs to reach into
`ingredient.amount` and do math on it; chunk 6's editor needs to read and rewrite those same fields;
chunk 7's parser needs to build objects in this exact shape from pasted text. None of that is
possible if the numbers are baked into English sentences in the HTML. The page currently *looks*
similar either way, but the HTML-in-a-file version is a dead end and the JavaScript-object version
is the foundation everything else in the plan builds on.

**Worth knowing:**

- **`renderRecipe` doesn't clear `#recipe` before filling it.** It only ever calls `appendChild`,
  never removes anything first. Right now that's harmless because `renderRecipe` runs exactly once.
  But chunk 3 needs to redraw the recipe whenever the servings number changes, and if that reuses
  this function as-is, every re-render will pile new headings, servings lines, and ingredient lists
  on top of the old ones instead of replacing them. This will need a "clear the container first"
  step added.
- **`amount: null` and `unit: ""` are two different conventions for "nothing here."** Missing number
  uses `null`; missing unit uses an empty string. That's a deliberate but easy-to-forget
  inconsistency — worth being able to explain why (there's no sensible "empty number" the way
  there's an empty string, so `null` fills that gap), and worth noticing it's a judgment call, not
  the only valid way to model it.
- **The functions here aren't the ones named in `PLAN.md`'s function-breakdown table.** The plan
  describes later functions like `renderEditor` and `renderScaledRecipe`. `formatIngredientText`,
  `renderIngredientRow`, and `renderRecipe` are this chunk's own, simpler stand-ins to prove the
  display works before scaling, editing, or formatting exist. Expect them to be reworked or
  replaced, not just extended, as later chunks land.
- **`servings` is displayed but not used for anything else yet.** There's no input, no math — just
  printing the number 4. That's correct for this chunk (the plan explicitly puts scaling in chunk
  3), but it means the app doesn't yet do anything a static recipe card couldn't do.
- **`formatIngredientText` assumes amount always comes before unit before name**, and doesn't handle
  the case of a unit present with no amount (not present in the sample data, but not guarded against
  either). It works for every row in `exampleRecipe` because the data was written to fit the
  function, not the other way around.

**Three questions an interviewer could ask:**

1. If you wanted to add a sixth ingredient to Pancakes right now, would you edit `index.html`,
   `style.css`, or `script.js` — and why does that answer matter for what happens in chunk 6, where
   a user adds their own recipes?
2. `formatIngredientText` checks `ingredient.amount !== null` and `ingredient.unit !== ""`
   separately, rather than one check for "does this ingredient have both." Walk me through what
   "Salt and pepper to taste" would render as if you removed the amount check but kept the unit
   check.
3. Suppose chunk 3 calls `renderRecipe` a second time after the user changes the servings number.
   What would actually appear on screen, and why?

---

## Chunk 3 — Scale ingredients by servings

**What it does for the user:**
The recipe now actually responds to you. Next to the "Cooking for" box there's a number input
starting at 4, and a small label like "×1.5" beside it. Change the number — say, from 4 to 6 — and
instantly every ingredient amount on screen recalculates: "2 cups flour" becomes "3 cups flour,"
"1.5 cups milk" becomes "2.25 cups milk," and so on. This is the moment the app stops being a static
recipe card and starts doing the one thing it exists to do.

**How it works, step by step:**

1. The page loads. Near the bottom of `script.js`, `handleServingsInputChange()` gets called once by
   name (line 160), the same "defining it doesn't run it, calling it does" pattern from chunks 1 and
   2. This draws the recipe scaled to whatever the input currently holds — 4.
2. Just above that, `servingsInput.addEventListener("input", handleServingsInputChange)` (line 157)
   sets up a standing instruction: "every time this input fires an *input* event, run
   `handleServingsInputChange` again." An **event** is something that happens on the page — a click,
   a keystroke, a page load. An **event listener** is code that says "when that happens, run this
   function." The `"input"` event fires on every single keystroke or click that changes the box's
   value, not just when you click away from it.
3. You type a `6` into the box. The `input` event fires, and `handleServingsInputChange` runs.
4. It looks up the input again, reads its current text with `.value`, and converts that text to an
   actual number with `Number(...)` — `.value` is always a string, even for a number input, so `"6"`
   has to become `6` before math can happen to it.
5. It calls `renderRecipe(exampleRecipe, servingsWanted)`, passing in the original hard-coded recipe
   and the number you just typed.
6. Inside `renderRecipe`, the very first line is `recipeContainer.replaceChildren()` — it empties out
   the `#recipe` box completely before drawing anything new. (Why this line has to be here now is its
   own section below.)
7. `calculateMultiplier(servingsWanted, recipe.servings)` divides what you asked for by what the
   recipe normally makes — `6 / 4 = 1.5`. This one number, the **multiplier**, is what every amount
   gets multiplied by.
8. `renderMultiplier(1.5)` writes `"×1.5"` into the small `<span id="multiplier-display">` next to
   the input, so you can see the ratio being applied.
9. `getScaledIngredients(recipe.ingredients, 1.5)` runs `scaleIngredient` on every ingredient in the
   list and hands back a brand-new list of scaled ingredients (details below).
10. `renderRecipe` then builds the heading, the "Originally serves 4" line, and loops over the
    *scaled* list, building one `<li>` per ingredient with `renderIngredientRow` — exactly as chunk 2
    did, just fed different numbers.
11. The browser redraws instantly. You see the new amounts. Type another digit and the whole sequence
    — event fires, read the box, recalculate, clear the old recipe, redraw — happens again from
    scratch.

**The pieces:**

| Thing | Where | What it's for |
|---|---|---|
| `<input type="number" id="servings-wanted">` | index.html:20 | Where the user types the serving count; starts at `4` |
| `<span id="multiplier-display">` | index.html:23 | Empty on load; filled with text like `×1.5` by `renderMultiplier` |
| `calculateMultiplier(wanted, makes)` | script.js:87-89 | Divides wanted servings by the recipe's normal servings — the one ratio everything else uses |
| `scaleAmount(amount, multiplier)` | script.js:93-95 | Multiplies one number by the multiplier |
| `scaleIngredient(ingredient, multiplier)` | script.js:104-121 | Builds and returns a scaled *copy* of one ingredient object |
| `getScaledIngredients(ingredients, multiplier)` | script.js:125-131 | Runs `scaleIngredient` over the whole array, returns a new array |
| `roundToTwoDecimals(number)` | script.js:137-139 | Tidies the multiplier for display only — doesn't touch the actual scaling math |
| `renderMultiplier(multiplier)` | script.js:143-146 | Writes `×1.5` into the multiplier span |
| `handleServingsInputChange()` | script.js:150-154 | Reads the input, converts it to a number, triggers a full re-render |
| `addEventListener("input", ...)` | script.js:157 | Wires the input box to `handleServingsInputChange` so typing triggers scaling |
| `recipeContainer.replaceChildren()` | script.js:59 | Empties `#recipe` before every redraw |

**Terms introduced:**

- **event** — something that happens on the page that code can react to: a click, a keystroke, the
  page finishing loading.
- **event listener** — code registered to run automatically whenever a specific event happens on a
  specific element. `addEventListener("input", handleServingsInputChange)` means "whenever this box's
  value changes, call this function."
- **`.value`** — the current text sitting inside an input box. Always a string of characters, even
  when the input is typed as numbers, which is why `Number(...)` has to convert it before doing math.
- **`Number(...)`** — converts text into an actual number JavaScript can do arithmetic with.
  `Number("6")` is `6`; `Number("")` (an empty box) is `0`.
- **copy vs. reference** — when a variable holds an object, it doesn't hold the object's data
  directly, it holds a pointer to where that data lives (a *reference*). Two variables pointing at the
  same object are pointing at the *same* data — change one and you've changed both. A *copy* is a
  brand-new object with its own data, so changing the copy leaves the original untouched. This
  distinction is the entire reason `scaleIngredient` is written the way it is — see below.

**Why `replaceChildren()` matters now:**
In chunk 2, `renderRecipe` only ever ran once, so it was safe to just keep calling `appendChild` —
the container started empty and there was nothing to clean up. Now `renderRecipe` runs again on every
keystroke. Without `replaceChildren()`, each run would `appendChild` a second heading, a second
"Originally serves 4" line, and a second ingredient list *underneath* the first — the old recipe
wouldn't disappear, a new one would just stack on top of it. Type three digits and you'd have three
copies of the recipe glued together on the page. `replaceChildren()` called with nothing removes
everything currently inside `#recipe` first, so every redraw starts from a clean, empty box. This is
a bug that was headed off before it ever happened — chunk 2's own notes flagged it as something chunk
3 would need to fix, and the comment on script.js:53-58 spells out exactly that reasoning.

**Why `scaleIngredient` returns a new object instead of changing the original — the important idea in
this chunk:**
`scaleIngredient` never writes `ingredient.amount = ...`. Instead it builds and returns a completely
new `{amount, unit, name}` object, leaving the ingredient it was given untouched. Here's concretely
what would break if it didn't: `exampleRecipe` is one object living in memory, and
`recipe.ingredients` are the *actual* ingredient objects inside it — not copies. If `scaleIngredient`
mutated `ingredient.amount` directly, then scaling to 6 servings would overwrite flour's `amount`
field in `exampleRecipe` itself, permanently, from `2` to `3`. Scale back down to 4 afterward, and
`calculateMultiplier` would produce `4/4 = 1`, so the code would multiply the *already-scaled* `3` by
`1` and get `3` — not `2`. The original recipe's "for 4 people" amounts would be gone, overwritten,
with no way to get back to the true numbers except reloading the page. Every scale operation would
compound on top of whatever the last one left behind, and the multiplier shown would silently stop
matching the amounts on screen. `exampleRecipe` needs to stay the one unchanged source of truth every
single time you re-scale, and the only way to guarantee that is for `scaleIngredient` (and
`getScaledIngredients`, which just runs it over the whole list) to hand back fresh copies instead of
editing what it was given.

**Worth knowing:**

- **A blank input currently multiplies everything by zero.** Clear the box entirely and `Number("")`
  is `0`, so `calculateMultiplier` computes `0 / 4 = 0`, and every ingredient amount scales to `0`.
  Nothing crashes — the page just shows a recipe made of zeroes with `×0` next to it. `min="1"` is on
  the input tag, but it's cosmetic only; nothing in the JavaScript actually checks the value before
  using it. This is explicitly deferred to chunk 10 ("Handle empty and invalid input"), so it's
  expected right now, not a surprise — but it's worth being able to say out loud why it happens.
- **Amounts still display as raw decimals.** Scale to 6 servings and milk shows `2.25 cups milk`, not
  `2¼ cups`. `formatIngredientText` (from chunk 2) just prints whatever number it's given — it has no
  idea how to turn a decimal into a fraction. That translation is chunk 4's entire job.
- **`getScaledIngredients` isn't in `PLAN.md`'s function table.** The plan's "Scaling" section lists
  `calculateMultiplier`, `scaleAmount`, `scaleRange`, and `scaleIngredient` — no
  `getScaledIngredients`. It was added while building because something has to loop `scaleIngredient`
  over the whole ingredient array and hand back the new list, and that's a reasonable, small,
  single-job function in the spirit of the project's own style rules. Worth flagging as a deliberate
  deviation from the plan rather than pretending the plan predicted it — the plan is a living
  document, not a contract.
- **The multiplier shown and the multiplier used for math are not the same value.** `renderMultiplier`
  rounds to two decimals purely for the on-screen `×1.5` label; the actual scaling in `scaleAmount`
  always uses the full, unrounded `wanted / makes` result. That's the right call — rounding the
  display doesn't corrupt the arithmetic — but it's easy to assume they're the same number if you
  haven't read both functions.
- **`min="1"` on the input is decorative.** HTML5 min/max validation only kicks in on form
  submission, and there is no `<form>` here. It does not stop the `input` event firing with `0`, a
  negative number, or an empty string.
- **Fractional servings were possible and unguarded** when this chunk was written: the input had no
  `step="1"`, so `4.5` gave a multiplier of `1.125`. *Fixed after the plan* — both servings boxes now
  reject anything but digits at the keyboard, because `type="number"` accepts `e`, `+`, `-` and `.`
  as valid number characters and reports `.value` as empty when the contents are invalid, so there
  is nothing left to strip out afterwards.

**Three questions an interviewer could ask:**

1. Walk me through what would appear on screen if `replaceChildren()` were deleted from
   `renderRecipe`, and then you typed `6` into the servings box one digit at a time.
2. If `scaleIngredient` set `ingredient.amount = scaleAmount(...)` directly instead of returning a new
   object, describe exactly what the flour amount would show if you scaled to 8 servings and then
   changed the box back down to 4.
3. The `input` event fires on every keystroke, not just when you finish typing. What actually happens,
   step by step, if you type "12" into the servings box — does the recipe scale for "1" at any point,
   and does that matter?

---

## Chunk 4 — Show amounts as fractions

**What it does for the user:**
Scaled amounts stop showing as ugly decimals. Where chunk 3 left milk reading "2.25 cups milk" after
scaling to 6 servings, it now reads "2¼ cups milk" — the number a cook can actually line up against a
measuring cup. Nothing else on the page changes; this chunk only touches how the amount number gets
turned into text.

**How it works, step by step — tracing `2.25` from scaled decimal to `2¼`:**

1. `renderIngredientRow` (from chunk 2) hands `2.25` to `formatIngredientText`, which passes it into
   `formatAmount(2.25)` — the single entry point this whole chunk builds toward.
2. `formatAmount` first calls `splitWholeAndLeftover(2.25)`. `Math.floor(2.25)` gives `2` (the whole
   number part). `2.25 - 2` gives `0.25` (the leftover decimal). It returns
   `{ whole: 2, leftover: 0.25 }`.
3. `formatAmount` hands the leftover, `0.25`, to `snapToNiceFraction(0.25)`. That function walks the
   list `niceFractionAmounts` — `0, ¼, ⅓, ½, ⅔, ¾, 1` — measuring how far `0.25` is from each one.
   `0.25` is exactly `0.25`, so the distance is `0`, the smallest possible, and `¼` wins outright. It
   returns `{ value: 0.25, symbol: "¼" }`.
4. `formatAmount` calls `combineWholeAndFraction(2, { value: 0.25, symbol: "¼" })`. Since the matched
   fraction's value isn't `1`, nothing special happens — it just bundles the whole number and the
   symbol together: `{ whole: 2, symbol: "¼" }`.
5. Finally `formatWholeAndFraction(2, "¼")` runs. The symbol isn't empty and the whole number isn't
   `0`, so it falls to the last case: `whole + symbol`, which is `2` (a number) glued to `"¼"` (a
   string) — JavaScript converts the number to text automatically, producing `"2¼"`.
6. That string comes back up through `formatAmount`, into `formatIngredientText`, which appends the
   unit and ingredient name, and the `<li>` on screen reads "2¼ cups milk".

**Each new function — what goes in, what happens, what comes out:**

| Function | In | What it does | Out |
|---|---|---|---|
| `splitWholeAndLeftover(amount)` | a decimal like `2.25` | floors it to get the whole number, subtracts to get the remainder | `{ whole, leftover }` |
| `snapToNiceFraction(leftover)` | a decimal between 0 and 1, like `0.25` | loops over every candidate in `niceFractionAmounts`, tracks whichever has the smallest absolute distance so far | the closest `{ value, symbol }` object |
| `combineWholeAndFraction(whole, fraction)` | a whole number and the fraction object above | checks if the fraction snapped all the way to `1`; if so, bumps the whole number up instead of showing a fraction | `{ whole, symbol }` |
| `formatWholeAndFraction(whole, symbol)` | a whole number and a symbol string | decides which pieces to show: symbol alone, number alone, or both stuck together | the final display string, e.g. `"3"`, `"¾"`, `"2¼"` |
| `formatAmount(amount)` | the raw scaled decimal | runs the four functions above in sequence | the text that lands in the ingredient row |

**The idea that deserves emphasis — why a loop beats a chain of if/else:**

The obvious-looking alternative would be something like:

```
if (leftover < 0.125) use nothing
else if (leftover < 0.29) use ¼
else if (leftover < 0.42) use ⅓
...
```

That means someone has to sit down and compute every boundary by hand — the midpoint between ¼ (0.25)
and ⅓ (0.333) is 0.291666..., and somebody has to type that number in. `snapToNiceFraction` never
does this. It just measures the plain distance from the leftover to every candidate in
`niceFractionAmounts` and keeps whichever is closest. The boundary between ¼ and ⅓ is never written
down anywhere — it's just the point where "distance to ¼" and "distance to ⅓" happen to be equal, and
the loop finds that automatically for every possible leftover value without anyone computing it.

The payoff shows up the moment someone adds `⅛` to the list later. In the if/else version, adding a
new fraction means re-deriving and rewriting *every* boundary near it by hand — miss one and two
fractions silently overlap or leave a gap. In the loop version, you add one line —
`{ value: 0.125, symbol: "⅛" }` — and every nearby boundary rearranges itself correctly on the next
run, because the loop was never trusting a hand-written number in the first place. The logic scales
to more fractions; the if/else chain gets more fragile with every fraction added.

**The roll-up case — `2.9` → `3`, not `"2 1"`:**

`splitWholeAndLeftover(2.9)` gives `{ whole: 2, leftover: 0.9 }`. `snapToNiceFraction(0.9)` measures
distance to every candidate and finds `1` is closest (distance `0.1`, beating `¾`'s distance of
`0.15`). But the fraction list's entry for `1` has `symbol: ""` — there's no glyph for "one whole" as
a fraction. Without extra handling, the code would produce `2` + `""` = `"2"`, silently dropping
almost a whole unit. `combineWholeAndFraction` catches this specific case explicitly: if the matched
fraction's `value` is exactly `1`, it adds `1` to the whole number instead of attaching a fraction
symbol, giving `{ whole: 3, symbol: "" }`, which `formatWholeAndFraction` then prints as plain `"3"`.
This is the one spot in the chunk that *isn't* derived automatically by the loop — it's a hand-written
special case, because "snap up to the next whole number" is a real possible outcome of the same
distance comparison used everywhere else.

**Worth knowing:**

- **`0.5833 cups` still snaps to `½ cups`, and it's meaningfully wrong.** `snapToNiceFraction` only
  knows about six values; it has no idea that `0.5833` is actually `⅔` minus a sliver, or that
  there's a smaller unit (tablespoons) that could express the remainder exactly. It picks `½` because
  that's the closest of its six options — about 8% off, silently throwing away roughly 1⅓ tablespoons
  of milk. PLAN.md flags this directly: the fix isn't more fraction options, it's chunk 5's
  cups→tbsp→tsp decomposition ladder, which only falls back to a plain fraction when the error is
  small enough to ignore.
- **`formatAmount` takes only one argument (`amount`) — no `unit`.** That means it treats a cup
  measurement and a count of eggs identically: both get the same six-fraction snap. PLAN.md's function
  table lists chunk 5's version as `formatAmount(amount, unit)`, because the *unit* is what determines
  whether decomposing into smaller units is even possible (works for cups/tbsp/tsp, meaningless for
  "eggs" or grams). The signature is going to change, not just gain more logic behind the same inputs.
- **Metric units would currently be mishandled.** No gram or millilitre amounts exist in
  `exampleRecipe` yet, so nothing is visibly broken — but if one were added today it would get snapped
  to a fraction rather than rounded, which is not what PLAN.md's formatting-strategy table specifies.
  Chunk 5's unit classification is what has to catch this; it must not be silently inherited.
- **Ties are broken by list order, not by design.** `snapToNiceFraction` only replaces the current
  best match on a *strict* `<` comparison. If a leftover sits exactly halfway between two fractions,
  the earlier one in `niceFractionAmounts` wins by default — nobody wrote that rule on purpose, it
  just falls out of how the comparison is coded.
- **`0` and `1` share the same empty symbol (`""`) in the fraction list**, but only `1` gets the
  special roll-up treatment in `combineWholeAndFraction`. That's intentional — a leftover that rounds
  down to `0` needs nothing extra, since the whole number is already correct — but it's easy to
  misread the two blank-symbol entries as doing the same job when only one of them triggers extra
  logic.

**Three questions an interviewer could ask:**

1. `niceFractionAmounts` includes `0` and `1` as if they were fractions. Walk me through what breaks
   in `snapToNiceFraction` or `combineWholeAndFraction` if you deleted the `{ value: 1, symbol: "" }`
   entry.
2. If you added `{ value: 0.125, symbol: "⅛" }` to the list, what code, if any, would you have to
   change elsewhere for the app to start correctly showing `⅛` on screen?
3. `formatAmount` produces `½` for both `0.5` exactly and `0.5833`. Explain why that's not a bug in
   this chunk specifically, and what has to exist in chunk 5 to fix it.

---

## Chunk 6 — Add recipe editor

**What it does for the user:**
Below the header there's now a boxed section called "Your Recipe" with a name field, a "Makes ___
servings" field, and a row for every ingredient — each row has a small amount box, a unit box, a name
box, and a small × delete button. On page load the whole thing is already filled in with the pancake
recipe from before, so the app doesn't open on an empty page. Below the ingredient rows is a "+ Add
ingredient" button that appends a new blank row. For the first time, a user can actually change what
recipe is on screen: type over "Pancakes" with a different name, edit any amount, delete a row, or add
one — and the scaled output below updates instantly. Nothing is saved between visits yet (chunk 8),
but for the length of one visit the app is finally usable by someone other than the person who
hard-coded the pancake recipe.

**How it works, step by step:**

1. Page load runs `renderEditor(exampleRecipe)` near the bottom of the file. It writes `"Pancakes"`
   into the name box, `4` into the servings box, and builds one row per ingredient inside
   `#ingredient-rows`.
2. Right after that, `handleEditorFieldChange()` runs once to draw the scaled output for the first
   time, using whatever the editor now contains and whatever the "cooking for" box starts at.
3. Type into any editor field and its `input` event fires `handleEditorFieldChange`. That function
   calls `readEditorIntoRecipe()` to gather everything currently in the boxes into one recipe object,
   then hands it to the same `renderRecipe` from chunk 3 to redraw the output. The editor itself is
   not touched.
4. Click "+ Add ingredient" and `addEmptyRow()` reads the current editor into a recipe object, pushes
   one blank `{amount: null, unit: "", name: ""}` ingredient onto the end, then calls `renderEditor`
   to redraw every row and `handleEditorFieldChange()` to refresh the output.
5. Click a row's × and `deleteRow(index)` does the same pattern — read the editor, remove that one
   ingredient with `splice`, redraw editor and output.

**Each new function — in, what happens, out:**

| Function | In | What it does | Out |
|---|---|---|---|
| `renderEditor(recipe)` | a recipe object | sets `.value` on the name/servings inputs, empties `#ingredient-rows`, builds and appends one row per ingredient | nothing — writes to the page |
| `renderEditorRow(ingredient, index)` | one ingredient and its position | builds three `<input>` elements pre-filled with that ingredient's data, attaches an `input` listener to each, builds a delete button calling `deleteRow(index)` | one `<div class="ingredient-row">` |
| `readEditorIntoRecipe()` | nothing (reads the live page) | reads the name and servings inputs, finds every `.ingredient-row` and calls `readEditorRow` on each | a fresh `{name, servings, ingredients}` object |
| `readEditorRow(row)` | one row element | reads its three inputs; converts amount to a number unless the box is blank | one `{amount, unit, name}` object |
| `addEmptyRow()` | nothing | reads editor, pushes a blank ingredient, redraws editor and output | nothing — side effects only |
| `deleteRow(index)` | the row's position | reads editor, removes that ingredient with `splice`, redraws both | nothing — side effects only |
| `handleEditorFieldChange()` | nothing | reads the wanted-servings box and the editor's recipe, scales, redraws only the output | nothing — side effects only |

**The architectural idea that deserves emphasis — the editor is now the source of truth:**

Up through chunk 4, `exampleRecipe` was what `renderRecipe` actually scaled and displayed every time —
read directly, on every keystroke of the servings box. As of this chunk, `exampleRecipe` is touched
exactly once, at the bottom of the file, to pre-fill the editor's boxes on first load. From that
instant on, nothing else in the file looks at it again. Every scale, every redraw of the output, calls
`readEditorIntoRecipe()` instead — building a brand-new recipe object out of whatever text is
currently sitting in the boxes.

This is what makes chunk 7 possible. The paste-and-parse feature will not need its own path into
scaling. Its whole job will be to take pasted text and fill in these same editor boxes. Once that's
done, a recipe that arrived by pasting and a recipe that arrived by typing are sitting in identical
input boxes, read by the identical `readEditorIntoRecipe()` function. Scaling has no way to tell them
apart, and doesn't need to. That is only possible because this chunk moved "what gets scaled" off a
fixed JavaScript object and onto "whatever is in the editor right now."

**The focus-loss problem and how it was avoided:**

`renderEditor` doesn't just change the text inside the boxes — it deletes the old `<input>` elements
with `replaceChildren()` and builds brand-new ones. If that ran on every keystroke, typing the second
letter of an ingredient name would destroy the very input the cursor is sitting in and replace it with
a new one that has no cursor at all. The browser would silently kick focus out of the field, and a
user typing "flour" would end up with just "f" — every keystroke after the first landing nowhere.

The code avoids this with two separate redraw paths. `renderEditor` — the expensive one that tears
down and rebuilds every input — only runs when a row is added or deleted, because that genuinely does
require new elements. Ordinary typing is caught by `handleEditorFieldChange`, which redraws *only* the
output section below. The editor's own inputs are never touched, so the box being typed in, and its
cursor position, stay exactly where they are.

**Why blank amounts need an explicit check:**

`Number("")` evaluates to `0` in JavaScript — an empty string converts to zero, not to "nothing." If
`readEditorRow` just did `Number(amountInput.value)` unconditionally, leaving the amount box blank for
a row like "Salt and pepper to taste" would silently produce `amount: 0`, and that `0` would then get
multiplied along with every other amount — a phantom "0 tsp salt" in the output where nothing should
scale at all. `readEditorRow` checks `amountInput.value.trim() !== ""` first: only if there's actual
text does it convert. Otherwise `amount` stays `null`, matching the convention `exampleRecipe` already
used, so a hand-typed blank and a hard-coded `null` behave identically everywhere downstream.

**Worth knowing:**

- **CONFIRMED BUG — clearing the "Makes N servings" box produces `Infinity`.** `readEditorIntoRecipe`
  runs `Number(...)` on the servings box with no blank-check, unlike the amount field. Clear that box
  and `servings` becomes `0`, so `calculateMultiplier(6, 0)` divides by zero and returns `Infinity`.
  That flows through `scaleAmount` and `formatAmount` untouched, and the page displays
  **"Infinity cups flour"**. Clearing both boxes gives `NaN` and displays **"NaN cups flour"**. This
  was verified by loading the real `script.js` in Node against a stub DOM, not by reading the code.
  Chunk 6 is what made it reachable: before this, `servings` always came from `exampleRecipe` and was
  permanently `4`. It is the same *class* of gap chunk 3's notes already flagged for the "cooking for"
  box (`min="1"` is cosmetic; nothing in the JS checks it), but with a worse symptom — `×0` at least
  produced readable zeroes. Belongs in chunk 10.
- **The two "blank box" code paths are not symmetric.** `readEditorRow` guards its amount field
  against `Number("")`; `readEditorIntoRecipe` does not guard the servings field. That asymmetry is
  exactly the bug above, and a good answer to "was there a bug you found reviewing your own code?"
- **Deleting a row depends on a full redraw to keep row numbers honest.** Each delete button has a
  fixed `index` baked in at draw time. If `renderEditor` didn't run again immediately after every
  delete, a second delete click would remove whatever ingredient *used to* sit at that position. The
  redraw re-numbers every button to match the array's real current order.
- **The recipe still disappears on refresh.** No browser storage yet — reload and everything typed is
  gone, replaced by the pancake example. Chunk 8.
- **There's still no way to paste a recipe.** Every ingredient is typed by hand, one row at a time.
  The parser is chunk 7 — not built.
- **The layout is only barely styled.** Just enough spacing that boxes don't run together. No distinct
  visual identity for the three regions, no phone stacking. Chunk 9.
- **The scaling maths hasn't changed since chunk 4** — amounts still only snap to a simple fraction.
  The cups→tbsp→tsp ladder (chunk 5) was deliberately postponed so the app would get a usable entry
  point sooner.
- **A real bug was found and fixed while building this:** the recipe-name and servings inputs
  initially had no event listeners, because they're fixed elements in `index.html` rather than
  elements `renderEditor` creates — so the listener code inside `renderEditorRow` never touched them.
  The symptom: typing a new recipe name did nothing to the output, the heading kept reading
  "Pancakes". Fixed by attaching two listeners once at startup, outside `renderEditor`.

**Three questions an interviewer could ask:**

1. `renderEditorRow` attaches an `input` listener to each box it creates, rather than `renderEditor`
   attaching one listener to the whole `#ingredient-rows` container. What would happen if you deleted
   the listener from inside `renderEditorRow` — and why does the recipe-name box need its listener
   attached in a completely different place in the file?
2. `readEditorRow` explicitly checks for a blank amount box before converting it to a number, but
   `readEditorIntoRecipe` doesn't do the same for the servings box. Walk through exactly what appears
   on screen if a user deletes everything in the "Makes ___ servings" box.
3. `addEmptyRow` and `deleteRow` both start by calling `readEditorIntoRecipe()` before changing
   anything. Why is that read necessary — what would go wrong if they started from `exampleRecipe`, or
   from whatever recipe object was last rendered, instead of re-reading the live boxes?

---

## Chunk 5 — Break amounts into mixed units

**What it does for the user:**
This is the technical centrepiece of the app, and it was the user's own idea, pushed back against an
AI suggestion (see `PLAN.md`'s decisions table). Before this chunk, a scaled amount only ever snapped
to the nearest of six fractions — `¼ ⅓ ½ ⅔ ¾` or a whole number. That's fine for `2.25 cups` (→ `2¼
cups`), but scaling ⅓ cup by 1.75× gives `0.5833… cups`, and the nearest of those six fractions is `½
cup` — which quietly throws away about 1⅓ tablespoons of milk, roughly 8% of the real amount. After
this chunk, that same amount displays as `9 tbsp 1 tsp`: broken down into smaller measuring units, the
way a person actually would if asked to measure something no cup exists for. Amounts already using
round numbers, like `4.5 cups`, are untouched — they still show as `4½ cups`, not needlessly split.

**How it works, step by step — tracing `0.5833… cups` (⅓ cup scaled by 1.75×) to `9 tbsp 1 tsp`:**

1. `formatAmount(0.5833, "cups")` is the entry point. `classifyUnit("cups")` checks the unit against
   four hardcoded word lists — `volumeUnitNames`, `weightUnitNames`, `countUnitNames`, or an empty
   string for "no unit" — and returns `"volume"`. That routes the amount to `formatVolumeAmount`.
2. `formatVolumeAmount` tries the cheap option first: `isFractionGoodEnough(0.5833, "cups")`. Inside,
   `splitWholeAndLeftover` gives whole `0`, leftover `0.5833`. `snapToNiceFraction(0.5833)` finds `½`
   (0.5) is the closest of the six candidates.
3. The gap between the real amount and that snapped fraction is `|0.5833 − 0.5| = 0.0833 cups`. That
   gap is converted into teaspoons with `toBaseUnit(0.0833, "cups")` → `0.0833 × 48 = 4 tsp`. That is
   compared against the tolerance, `fractionToleranceInTsp = 1.5` (half a tablespoon). `4 > 1.5`, so
   the fraction is **not** good enough — this amount needs decomposing.
4. `toBaseUnit(0.5833, "cups")` converts the *whole* amount (not just the error) to teaspoons:
   `0.5833 × 48 = 28 tsp` exactly.
5. `decomposeToUnits(28)` walks `volumeLadder` — cup (48 tsp), tbsp (3 tsp), tsp (1 tsp) — from
   largest to smallest, the same way a cash register makes change from the largest coins first. Cup:
   `floor(28 / 48) = 0`, contributes nothing, skipped entirely (so the result never reads "0 cups").
   Tbsp: `floor(28 / 3) = 9`, remainder `28 − 27 = 1`; pushes `{amount: 9, unit: "tbsp"}`. Tsp is the
   smallest rung, so whatever's left — `1` — is pushed as-is.
6. `dropNegligibleTail` checks the last part. `1` is a whole number, so nothing more happens — a
   fractional leftover would have been either dropped (if under ⅛ tsp) or snapped to a nice fraction.
7. `formatParts([{9, tbsp}, {1, tsp}])` joins them into text: `"9 tbsp 1 tsp"`.

**Why converting to teaspoons first makes the whole problem easy:**
Without a common unit, "how many cups, tbsp, and tsp make up 0.5833 cups" would need three different
conversion factors compared pairwise against each other. By converting everything down to the ladder's
smallest rung first — teaspoons — the whole problem becomes one number on one number line. From there,
"how many whole cups fit" is a single division, and whatever's left carries straight down to the next
rung as a smaller version of the exact same question. That's why `toBaseUnit`, `isFractionGoodEnough`,
and `decomposeToUnits` are all written in terms of teaspoons rather than each juggling conversions.

**Why `4.5 cups` stays `4½ cups` and does not become `4 cups 8 tbsp`:**
Run `isFractionGoodEnough(4.5, "cups")`: leftover is `0.5`, and `snapToNiceFraction(0.5)` matches `½`
*exactly* — the gap is `0`, which is well under the `1.5 tsp` tolerance. The fraction is judged good
enough, so `formatVolumeAmount` never even reaches `decomposeToUnits`. This is the "fraction first,
decompose second" rule from `PLAN.md`: decomposition is not automatically better. `4 cups 8 tbsp` is a
worse way to say the same amount — two measuring implements instead of one, harder to read at a glance
— so the code only decomposes when a plain fraction would mislead by more than half a tablespoon.

**Is `28 tsp → 9 tbsp 1 tsp` with zero leftover luck?**
Partly, and it's worth being precise about which part is guaranteed. What **is** guaranteed by design:
`1 cup = 48 tsp` and `1 tbsp = 3 tsp` are both whole-number ratios. Because of that, the
division-and-remainder loop never introduces its own rounding error — cup and tbsp counts always come
out as exact whole numbers, with only the smallest rung (tsp) ever holding a leftover fraction. That
part is structural, not coincidental. What is **not** guaranteed is that the teaspoon count landed on a
whole number (`28`) at all. `⅓ cup` is `16 tsp` exactly (`48 ÷ 3`), and the multiplier `1.75` is `7/4`
— so `16 × 7/4 = 28`, a whole number, because `16` happens to be divisible by `4`. A multiplier of
`1.6×` would give `16 × 1.6 = 25.6 tsp`, ending on a fractional tsp that `dropNegligibleTail` would
snap to `1½ tsp` rather than showing a raw decimal. So: the *lossless* property is guaranteed by the
integer ratios; this example landing on a whole final teaspoon count is a property of these numbers.

**The pieces:**

| Function | In | What it does | Out |
|---|---|---|---|
| `classifyUnit(unit)` | a unit string, e.g. `"cups"` | checks it against four hardcoded word lists | `"volume"` / `"weight"` / `"count"` / `"none"` |
| `toBaseUnit(amount, unit)` | a volume amount and its unit | looks up the unit's ladder rung, multiplies by its teaspoons-per-unit | the amount in teaspoons |
| `isFractionGoodEnough(amount, unit)` | a raw scaled amount and its unit | snaps to the nearest nice fraction, measures the gap in teaspoons, compares to tolerance | `true`/`false` |
| `decomposeToUnits(baseAmountInTsp)` | an amount already in teaspoons | walks cup→tbsp→tsp, taking as many whole units as fit at each rung, carrying the remainder down | an array like `[{9, "tbsp"}, {1, "tsp"}]` |
| `dropNegligibleTail(parts)` | the array `decomposeToUnits` returned | drops the last part if under ⅛ tsp; snaps it to a nice fraction if fractional but not negligible | a cleaned-up array |
| `formatVolumeAmount(amount, unit)` | a raw scaled amount and its unit | tries a fraction first, falls back to decomposing | `"9 tbsp 1 tsp"` or `"4½ cups"` |
| `formatWeightAmount(amount, unit)` | a raw scaled amount, e.g. grams | rounds to a whole number, no fractions | `"247 g"` |
| `formatAmount(amount, unit)` | any raw scaled amount and unit | classifies the unit, hands off to whichever formatter fits | the final display text |

**Worth knowing:**

- **`fractionToleranceInTsp = 1.5` is an arbitrary, hardcoded judgment call**, and the code says so in
  its own comment. It's a hard cutoff, which creates a real discontinuity: an error of `1.49 tsp`
  displays as a clean fraction, and `1.51 tsp` — a difference invisible to a cook — produces a
  completely different-shaped multi-part decomposition. Defensible, but it is a line, not a law.
- **Metric amounts always round to the nearest whole unit**, regardless of scale. `247.3g → 247g` is a
  trivial 0.1% change, but `1.5ml → 2ml` is a 33% change — the same blanket rule at very different
  magnitudes, and nothing in `roundWeight` adjusts for that.
- **The unit vocabulary is a small, hardcoded set of English words.** No `"fl oz"`, `"pint"`, or
  `"quart"`. Any unit outside the lists is classified `"none"` and just rounded to two decimals.
- **`decomposeToUnits` rounds off tiny floating-point noise** before the loop starts, because
  JavaScript can leave a number like `28` sitting as `27.999999999999996`, which would silently
  undercount a unit by one. A real, necessary guard — and a sign floating-point is being trusted with
  exact-looking results.

**Three questions an interviewer could ask:**

1. Why does `isFractionGoodEnough` measure its error in teaspoons instead of in whatever unit the
   ingredient was originally written in — what would break if it compared errors in cups directly for
   a `tbsp`-based ingredient?
2. `4.5 cups` stays `4½ cups` but `0.5833 cups` decomposes into `9 tbsp 1 tsp`. Both start by snapping
   to a fraction. What's the one number that decides which path each amount takes, and where does that
   number come from?
3. If someone typed `"1.5 fl oz"` into an ingredient row, walk through `classifyUnit` and explain
   exactly what would happen to that amount when it's scaled and displayed — and why.

---

## Chunk 7 — Parse pasted recipe text

**What it does for the user:**
Region 1, "Add a Recipe," gets its actual purpose here: paste a block of recipe text into the
textarea, click "Read recipe," and every line becomes a row in the editor below — amount, unit, and
ingredient name split apart automatically, without typing each ingredient by hand. A line the parser
can't make sense of still becomes a row (original text preserved, warning mark beside it) rather than
silently vanishing. A short message at the top of the editor reports what happened: "Read 9 of 10
lines. Check the marked one."

**How it works — tracing the two hard lines through `parseLine`:**

**`"1 (14 oz) can diced tomatoes"` — flagged as unparsed:**

1. `readLeadingAmount` grabs the leading number. `isRange` fails (no dash), so `matchAmountText` tries
   each pattern in order and `plainNumberPattern` matches `"1"`. The rest is `"(14 oz) can diced
   tomatoes"`.
2. The very next check is whether the rest starts with `(`. It does — a parenthetical stuck right
   after an amount is a nested amount this parser doesn't attempt to untangle, so it's flagged rather
   than guessed at.
3. Returns `{amount: null, unit: "", name: <the whole original line>, unparsed: true}`. The row appears
   amber with a `⚠`, and the full original text sits in the name field so there's something to
   *correct* rather than retype.

**`"Juice of 1 lemon"` — NOT flagged, passes through unscaled:**

1. Every amount pattern requires a match starting at the very first character (`^`), and the first
   character is `"J"` — none match. `readLeadingAmount` returns `null`.
2. That is **rule 1**: no leading number means the line is correct as written at any batch size. It
   returns `unparsed: false` — it is *not* flagged.
3. Because `amount` is `null`, the output shows a quiet `(not scaled)` note, the same as "Salt and
   pepper to taste". This is a genuinely debatable outcome: "1 lemon" *is* a real scalable quantity
   that the parser simply never looks for, because the number isn't at the front of the line. Treating
   it identically to a truly unscalable line is a judgment call, not obviously correct — worth having
   an opinion on.

**The three rules, and where each lives:**

| Rule | What it means | Where in the code |
|---|---|---|
| 1. No leading number → leave alone | `readLeadingAmount` returns `null`; passes through with `amount: null`, `unparsed: false` | `parseLine`, the first `if` |
| 2. Ranges scale end to end | `"2-3 cloves"` keeps both numbers as `amount`/`amountMax`, each scaled like a plain amount | `isRange` / `readLeadingRange` |
| 3. Unparseable is flagged, never dropped | original line text kept in `name`, `unparsed: true` | `parseLine`, the `(` check |

**The pieces:**

| Function | In | What it does | Out |
|---|---|---|---|
| `splitIntoLines(text)` | the raw pasted blob | splits on newlines, trims, drops blank lines | array of line strings |
| `matchAmountText(text)` | one line's start | tries four regex patterns in order, most specific first | the matched amount text, or `null` |
| `amountTextToNumber(text)` | a matched amount string | normalizes five shapes (`2`, `1.5`, `1/2`, `1 1/2`, `½`) into a number | a number |
| `looksLikeUnit(word)` | one word, e.g. `"Tbsp."` | lowercases, strips a trailing period, checks `knownUnits` | `true`/`false` |
| `parseLine(line)` | one line of pasted text | applies the three rules above | `{amount, amountMax, unit, name, unparsed}` |
| `countUnparsed(recipe)` | a recipe object | counts ingredients with `unparsed: true` | a number |
| `renderReviewNotice(total, unparsed)` | the two counts | writes the "Read N of M lines" message | nothing — writes to the page |
| `loadPastedText(text)` | the pasted blob | parses every line, keeps existing name/servings, redraws the editor | nothing — side effects |
| `handlePasteButton()` | nothing | reads the clipboard if permitted; otherwise focuses the textarea | nothing — side effects |

**Worth knowing:**

- **The `(` check is narrow and position-specific.** It only catches a parenthetical *immediately*
  after the amount. One anywhere else in the line wouldn't trigger the flag, so flagging isn't
  consistent across every place a `(` could plausibly appear.
- **`Juice of 1 lemon` is a real limitation, not a bug** — the parser only looks for a number at the
  very start. Any quantity written mid-sentence is invisible and silently treated as unscalable.
- **`amountTextToNumberMixed` split on a single literal space** rather than any run of whitespace, so
  `"1  1/2"` (two spaces) produced `NaN` and displayed as "NaN cups flour". *Fixed after the plan* —
  it splits on `/\s+/` now, and every route into a parsed amount passes through one guard that turns
  anything non-finite into "no amount". A second variant of the same bug was found at the same time:
  the dispatcher tested `text.includes(" ")`, so a **tab** between the whole number and the fraction
  never reached the mixed-number path at all.
- **The clipboard button fails silently.** If `readText()` is refused (realistic on a `file://` page),
  the `.catch()` just focuses the textarea — nothing tells the user *why* nothing pasted.
- **`knownUnits` is a fixed list.** An unrecognised unit doesn't break anything — it folds into the
  ingredient name, a soft graceful failure, but some real units are silently unrecognised.

**Three questions an interviewer could ask:**

1. Why does `"1 (14 oz) can diced tomatoes"` get flagged as unparsed, but `"Juice of 1 lemon"` does
   not? Walk through exactly which check in `parseLine` decides each outcome.
2. `looksLikeUnit` is checked against the *second* word after the amount, not the first word of the
   line. What would `parseLine` do with `"3 large eggs"` if that assumption were wrong — and why does
   it work correctly here?
3. Does a line like `"Juice of 1 lemon"` count toward the review notice's "read" total or its "needs a
   check" total — and do you think that's the right way to represent it to the user?

---

## Chunk 8 — Save recipes in the browser

**What it does for the user:**
The recipe survives closing the tab or refreshing. Every edit — typing a name, changing an amount,
adding or deleting a row, pasting a new recipe — is quietly saved as it happens, with no "Save" button
to remember. A "Start over (reset to example)" button gives a way back to the original pancake recipe.

**How it works, step by step:**

1. Every keystroke already calls `handleEditorFieldChange()` (chunk 6). This chunk adds one line: after
   updating the output, it calls `saveRecipes()`.
2. `saveRecipes` calls `readEditorIntoRecipe()` — the same function that feeds the output — then
   converts it to text with `JSON.stringify`. **`localStorage` can only store strings**, never a raw
   object, so this conversion is required. **JSON** (JavaScript Object Notation) represents an object's
   data as a readable string: `{"name":"Pancakes","servings":4,...}`.
3. `localStorage.setItem("recipe-scaler-recipe", recipeText)` writes it under one namespaced key.
   `localStorage` is a key/value store built into the browser: it persists between page loads on the
   same device, never leaves the browser, and isn't a database or a network call — which is why it
   satisfies the project's "no databases, no APIs" rule.
4. On the next page load, `loadRecipes()` runs first. If nothing was saved, `getItem` returns `null`
   and the page falls back to `exampleRecipe`. Otherwise `JSON.parse` turns the text back into an
   object and `renderEditor` fills the boxes with it.
5. "Start over" calls `clearSavedRecipe()` (`removeItem`), redraws with `exampleRecipe`, refreshes the
   output — and deliberately does *not* re-save, so storage stays genuinely empty until the next edit.

**Why both functions are wrapped in `try`/`catch`:**
A **try/catch** block lets code attempt something risky and recover instead of crashing. Two different
failures are guarded, one on each side:

- **The write.** `setItem` can throw — some private browsing modes disable storage, and there's a size
  limit. Without the `catch`, a failed save would throw on *every keystroke*, far more disruptive than
  just failing to save.
- **The read.** `JSON.parse` throws on text that isn't valid JSON — possible if someone hand-edits the
  value in devtools, or an older version wrote a different shape. Without the `catch`, a broken saved
  value would throw the moment the page loads, and the **entire page** would fail before anything
  else ran: a blank screen, an error only in the console, no recipe and no reset button to fix it.

**The pieces:**

| Function | In | What it does | Out |
|---|---|---|---|
| `saveRecipes()` | nothing (reads the live editor) | reads the editor, stringifies, writes to `localStorage`, swallows write errors | nothing — side effect |
| `loadRecipes()` | nothing (reads `localStorage`) | reads the saved string; parses it; returns `null` on missing or broken data | a recipe object, or `null` |
| `clearSavedRecipe()` | nothing | removes the saved key, swallows errors | nothing — side effect |
| `handleResetButton()` | nothing (a click handler) | clears storage, redraws with `exampleRecipe`, refreshes output | nothing — side effect |

**Worth knowing:**

- **A failed save is completely invisible.** Both `catch` blocks are empty by design — reasonable so a
  storage hiccup never breaks typing, but someone typing a whole recipe in a browser where storage is
  disabled would see everything working and then lose it all on refresh, with no warning anywhere.
- **Only one recipe was saved by this chunk** — a single fixed key, no list to switch between.
  *Built after the plan*: a separate saved-recipes page now keeps a named list under its own key, and
  this autosave slot went back to being just the working copy. See "After the plan" in `PLAN.md`.
- **A failed save used to be completely invisible.** Both `catch` blocks were empty, so someone
  typing a whole recipe in a browser with storage disabled would see it working and lose everything
  on refresh. *Fixed after the plan* — `saveRecipes` returns whether it succeeded, and a standing
  notice appears in the editor when it didn't.
- **"Start over" still has no confirmation.** One click irreversibly wipes what's saved. Deleting a
  *saved* recipe does ask first; this doesn't.
- **Saving happens on every keystroke, with no debounce.** Harmless at recipe size, but it writes to
  storage far more often than strictly necessary.

**Three questions an interviewer could ask:**

1. Why does `saveRecipes` need `JSON.stringify` at all — what would happen if you passed the recipe
   object directly to `localStorage.setItem`?
2. Walk through exactly what happens on page load if someone opened devtools and typed garbage into
   the saved `localStorage` value. What does the user see?
3. The "Start over" button has no confirmation prompt. What's the actual sequence of function calls
   when it's clicked, and what would you add to make it ask first?

---

## Chunk 9 — Style the layout

**What it does for the user:**
The app goes from "three boxes with default browser styling" to a page with a visual identity: a warm
cream background, rust-red accents, and three distinctly-shaped regions — paste area, editable form,
and a bolder, larger "hero" card for the scaled output, since that's the part actually read at the
counter while cooking. On a narrow screen, ingredient rows stack vertically instead of staying cramped
in a horizontal row that would require scrolling sideways.

**How it works, step by step:**

1. `style.css` opens with a `:root` block defining nine CSS **custom properties** — reusable named
   values, written as `--name: value` and referenced with `var(--name)`. `--color-rust: #a4432b` is
   the app's one accent colour, defined exactly once.
2. Every element that previously needed the literal hex `#a4432b` typed out — headings, borders,
   buttons, the multiplier display — now writes `var(--color-rust)`. Chunk 1's own notes flagged this
   exact colour as "hard-coded twice… a reasonable thing to say you'd do in chunk 9." This is that fix.
3. `*, *::before, *::after { box-sizing: border-box; }` changes how every element's width is measured,
   so padding and borders are counted *inside* that width rather than added on top. Without it, every
   input box would need its own fix to avoid overflowing its container.
4. `main { display: flex; flex-direction: column; gap: 1.75rem; }` stacks the three regions vertically
   with even spacing controlled from one place instead of each region carrying its own margin.
5. `.region-card` gives all three sections the same base look — white background, thin border, rounded
   corners, subtle shadow. `.region-hero`, layered on top for the output section only, overrides the
   border to be thicker and the shadow stronger, so it visually stands apart as the important one.
6. In `index.html`, the output is now wrapped in a `<section id="scale-output" class="region-card
   region-hero">`. Wrapping an existing element in a new parent doesn't change its `id`, so every
   `getElementById` call in `script.js` still finds the same elements — no behaviour changed.
7. `@media (max-width: 600px)` is a **media query** — a rule that only applies when the window is
   narrower than 600 pixels. Inside it, `.ingredient-row` switches from a horizontal flex row to a
   vertical stack, and each input becomes full width.

**The pieces:**

| Thing | What it's for |
|---|---|
| `:root { --color-rust: #a4432b; … }` | Nine reusable colour values, defined once |
| `box-sizing: border-box` reset | Makes declared widths include padding and border |
| `.region-card` | Shared white-card look for all three regions |
| `.region-hero` | Overrides `.region-card` with a bolder border/shadow for the output |
| `.unparsed-row` / `.unparsed-mark` | Amber styling for a parser-flagged row (chunk 7's data, styled here) |
| `.field-message` | Styling for the inline servings warnings (chunk 10's data, styled here) |
| `@media (max-width: 600px)` | Stacks ingredient rows vertically on narrow screens |

There are no new JavaScript functions in this chunk — a styling and layout pass only, plus one
structural wrap in `index.html` around an existing, already-working element.

**Worth knowing:**

- **`--color-rust-dark`, defined for `button:hover`, barely helps on the device the plan says matters
  most.** `:hover` doesn't reliably trigger on touchscreens, so the one interactive-feedback colour
  defined in this pass mostly benefits desktop users, not the phone users the chunk is designed around.
- **The 600px breakpoint is a single undocumented number.** A reasonable guess for "phone vs not," but
  nothing explains why 600 rather than 480 or 768, and there's no second breakpoint for a small tablet.
- **"Start over" was styled identically to every other button** when this chunk was written.
  *Fixed after the plan* — it's now quiet underlined text in its own row, visually separated from the
  actions that don't destroy anything. Combined with chunk 8's lack of a
  confirmation dialog, a destructive irreversible action looks exactly like harmless ones such as
  "+ Add ingredient". Nothing visually signals that one of these erases data.
- **This is the lowest-risk chunk of the five** — it touches no scaling, parsing, or storage logic, so
  little here can silently produce a wrong number the way the earlier chunks can.

**Three questions an interviewer could ask:**

1. Why define `--color-rust` once in `:root` instead of just carefully keeping the same hex code
   consistent everywhere? What specifically breaks the second approach that the first one fixes?
2. The output section got wrapped in a new `<section>` element in this chunk. Why didn't that require
   changing anything in `script.js`?
3. `.region-hero` is layered on top of `.region-card` rather than written as one combined rule. Walk
   through what properties `#scale-output` ends up with, and why two classes was the right call.

---

## Chunk 10 — Handle empty and invalid input

**What it does for the user:**
Blank or nonsense servings boxes no longer break the page. Before this chunk, clearing the "Makes ___
servings" box made every ingredient display as `Infinity cups flour`; clearing *both* boxes produced
`NaN cups flour`; and clearing just "Cooking for" silently scaled everything to zero, showing a recipe
made entirely of zeroes with no explanation. Now an unusable servings box shows the recipe at its
original unscaled amounts and prints a plain-language message next to the offending box — "Enter how
many servings the recipe makes." — instead of garbage numbers.

**What was actually broken, and why:**
Two number boxes feed `calculateMultiplier`: "Makes N" is the divisor, "Cooking for N" the numerator
(`wanted / makes`). A blank divisor gives `x / 0 = Infinity`. A blank numerator (which reads as `0`)
gives `0 / x = 0`. Blank on both sides gives `0 / 0 = NaN` ("Not a Number"). Chunk 6's notes had
already identified the root cause: `readEditorRow` (reading an ingredient's amount box) explicitly
checks `value.trim() !== ""` before converting — but `readEditorIntoRecipe` (reading the *servings*
box) had no equivalent check, just a bare `Number(...)`. **The same guard existed for one field and
not the other, purely by omission.** The fix generalises a pattern that was only half applied.

**How it works — tracing a blank "Makes ___ servings" box:**

1. `readEditorIntoRecipe` now calls `readServingsInput(rawText)` instead of a bare `Number(...)`.
2. `readServingsInput` trims the text. If empty, it returns `null` immediately — no division ever
   happens with it. Otherwise it converts and passes the result through `isUsableServingsNumber`,
   which requires the number to be finite (`Number.isFinite`, ruling out `Infinity`/`NaN`) **and**
   greater than zero — so `0`, negatives, and `"abc"` are all rejected the same way as a blank box.
3. `recipe.servings` is now `null`. `renderRecipe` calls `determineMultiplier`, which sees the `null`
   and returns `1` — a no-op multiplier — so every amount is shown unchanged rather than divided by
   zero.
4. `renderServingsMessages` writes the plain-language message into the small `<span>` next to the box.
5. `renderMultiplier` receives `canScale = false` and clears the `×N` display entirely, rather than
   showing a misleading `×1` that would look like a deliberate real 1× scale.
6. The "Originally serves N" line uses `servingsDisplayText`, which returns `"?"` rather than printing
   the literal text `"null"`.

**The pieces:**

| Function | In | What it does | Out |
|---|---|---|---|
| `isUsableServingsNumber(number)` | any number | `Number.isFinite(n) && n > 0` — one check catches blank, zero, negative and `NaN` alike | `true`/`false` |
| `readServingsInput(rawText)` | raw text from a servings box | trims, returns `null` if empty or unusable, otherwise the number | a number, or `null` |
| `determineMultiplier(recipeServings, servingsWanted)` | both values (each possibly `null`) | returns `1` if either is `null`; otherwise the real ratio | a multiplier |
| `renderServingsMessages(…)` | both servings values | writes or clears the inline warning next to each box | nothing — writes to the page |
| `servingsDisplayText(recipeServings)` | a servings value, possibly `null` | returns `"?"` for `null` | display text |
| `isUsableAmount(number)` | an ingredient amount | requires finite and non-negative | `true`/`false` |
| `isBlankIngredient(ingredient)` | one ingredient | `true` if amount, unit and name are all empty | `true`/`false` |
| `removeBlankIngredients(ingredients)` | the ingredient array | filters out entirely blank rows before display | a filtered array |

**Worth knowing:**

- **`determineMultiplier` falls back to `1` (show unscaled), not to some other default.** A specific,
  debatable choice: if "Cooking for" has a real number but "Makes" is blank, the recipe shows its
  *original* amounts rather than guessing a scale. The user must fix "Makes" before anything scales,
  even though they did type something into the other box.
- **The fix was extended past servings to ingredient amounts too.** `isUsableAmount` now rejects
  negative amounts — `-2 cups flour` didn't mean anything before either, but wasn't guarded against.
  A negative amount is treated exactly like a blank one: `null`, pass through unscaled. The rejected
  alternatives were flipping the sign or clamping to zero, both of which guess at intent.
- **This was verified, not assumed.** The fix was checked by running the real `script.js` against a
  Node stub DOM: blank/zero/negative in either box, both boxes blank, and all rows deleted — plus
  regression checks that `0.5833 cups` still gives `9 tbsp 1 tsp`, `4.5 cups` still gives `4½ cups`,
  `2-3 cloves` doubled still gives `4-6`, and saved recipes still round-trip through localStorage.
- **All four invalid states show the same message.** Blank, zero, negative and non-numeric are not
  distinguished — deliberate, to keep the message function short, but a user who typed `-2` gets no
  hint that the minus sign specifically was the problem.

**Three questions an interviewer could ask:**

1. `readServingsInput` treats a blank box, a zero, a negative number and non-numeric text all the same
   way — returning `null`. Why is one function with one check better here than three separate `if`
   statements catching each case individually?
2. If "Makes ___ servings" is blank but "Cooking for" has `8` in it, what does the user actually see?
   Is that the most helpful thing the app could show?
3. Point to what specifically caused the original `Infinity` bug in chunk 6's `readEditorIntoRecipe`,
   and explain why the same bug never happened with an ingredient's amount box.
