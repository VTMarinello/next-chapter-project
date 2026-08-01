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
