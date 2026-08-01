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
