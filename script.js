// Chunk 2: display one hard-coded recipe on the page.
//
// The recipe lives in JavaScript, not typed into index.html, so that later
// chunks (scaling, saving, editing) can work with it as data instead of text.
//
// As of chunk 6, this object is only ever used once: to pre-fill the editor
// when the page first loads (see renderEditor(exampleRecipe) at the bottom
// of this file). From that point on, the editor's own fields are the source
// of truth - readEditorIntoRecipe() is what scaling and the output actually
// read from, not this object.

// One ingredient is {amount, unit, name}.
// - amount is a number, or null when there isn't one ("Salt and pepper to taste")
// - unit is a string, or "" when there isn't one ("3 large eggs" has no unit)
const exampleRecipe = {
  name: "Pancakes",
  servings: 4,
  ingredients: [
    { amount: 2, unit: "cups", name: "flour" },
    { amount: 1.5, unit: "cups", name: "milk" },
    { amount: 3, unit: "", name: "large eggs" },
    { amount: 2, unit: "tbsp", name: "sugar" },
    { amount: null, unit: "", name: "Salt and pepper to taste" },
  ],
};

// Turns one ingredient object into a single line of readable text.
// Skips the amount and unit when they're missing, so "Salt and pepper to
// taste" doesn't come out as "null  Salt and pepper to taste".
function formatIngredientText(ingredient) {
  const textParts = [];

  if (ingredient.amount !== null) {
    // Chunk 7: a range ("2-3 cloves") carries a second number, amountMax.
    // Everything without a range leaves amountMax null/undefined and takes
    // the plain single-amount path, unchanged from chunk 4.
    if (ingredient.amountMax !== null && ingredient.amountMax !== undefined) {
      textParts.push(formatAmount(ingredient.amount) + "-" + formatAmount(ingredient.amountMax));
    } else {
      textParts.push(formatAmount(ingredient.amount));
    }
  }

  if (ingredient.unit !== "") {
    textParts.push(ingredient.unit);
  }

  textParts.push(ingredient.name);

  return textParts.join(" ");
}

// Builds the <li> for one ingredient. Kept separate from renderRecipe so
// each function only has one job: this one draws a single row.
function renderIngredientRow(ingredient) {
  const row = document.createElement("li");
  row.textContent = formatIngredientText(ingredient);
  return row;
}

// Draws the whole recipe — name, original serving count, and every
// ingredient row, scaled for servingsWanted — into the page.
function renderRecipe(recipe, servingsWanted) {
  const recipeContainer = document.getElementById("recipe");

  // This function used to only ever run once, so appendChild was safe: the
  // container started empty and stayed that way until filled. Now that
  // changing the servings number re-renders on every change, the old
  // content has to be thrown out first — otherwise each change would stack
  // a new copy of the recipe underneath the last one instead of replacing
  // it. replaceChildren() with no arguments empties the container.
  recipeContainer.replaceChildren();

  const multiplier = calculateMultiplier(servingsWanted, recipe.servings);
  renderMultiplier(multiplier);

  const heading = document.createElement("h2");
  heading.textContent = recipe.name;
  recipeContainer.appendChild(heading);

  const servingsLine = document.createElement("p");
  servingsLine.textContent = "Originally serves " + recipe.servings;
  recipeContainer.appendChild(servingsLine);

  const scaledIngredients = getScaledIngredients(recipe.ingredients, multiplier);

  const ingredientList = document.createElement("ul");
  for (const ingredient of scaledIngredients) {
    const row = renderIngredientRow(ingredient);
    ingredientList.appendChild(row);
  }
  recipeContainer.appendChild(ingredientList);
}

// Chunk 3: scaling ingredients to a different number of servings.

// The one ratio every scaled amount is built from. Cooking for 6 out of a
// recipe that makes 4 gives a multiplier of 1.5 — everything below just
// multiplies by this one number.
function calculateMultiplier(wanted, makes) {
  return wanted / makes;
}

// Multiplies a single amount by the multiplier. Its own function so
// scaleIngredient reads as "scale the amount" rather than a bare "*".
function scaleAmount(amount, multiplier) {
  return amount * multiplier;
}

// Takes one ingredient and returns a scaled COPY of it — a brand new
// object, not the original. This matters: if we changed ingredient.amount
// directly, we'd be editing exampleRecipe's own data. Scale to 6 servings
// and the recipe would remember it's now "for 6", so scaling back down to
// 4 afterwards would multiply again on top of the first change and give a
// wrong number. Building a new object every time keeps exampleRecipe as
// the one unchanged source of truth.
function scaleIngredient(ingredient, multiplier) {
  // Some lines have no amount to scale — "Salt and pepper to taste" is
  // correct at any batch size. Pass those through untouched (but still as
  // a copy, for the same reason as above).
  if (ingredient.amount === null) {
    return {
      amount: ingredient.amount,
      amountMax: ingredient.amountMax,
      unit: ingredient.unit,
      name: ingredient.name,
    };
  }

  // Chunk 7: a range ("2-3 cloves garlic") has a second number, amountMax,
  // that needs scaling too. Ingredients without a range simply don't have
  // this field, so the check below only takes the range path when there
  // really is one.
  if (ingredient.amountMax !== null && ingredient.amountMax !== undefined) {
    const scaledRange = scaleRange(ingredient, multiplier);
    return {
      amount: scaledRange.amount,
      amountMax: scaledRange.amountMax,
      unit: ingredient.unit,
      name: ingredient.name,
    };
  }

  return {
    amount: scaleAmount(ingredient.amount, multiplier),
    amountMax: ingredient.amountMax,
    unit: ingredient.unit,
    name: ingredient.name,
  };
}

// Scales both ends of a range using the same scaleAmount function as a
// plain amount. PLAN.md's insight: a range isn't a special kind of number,
// it's two ordinary numbers with a dash between them, so each one gets
// multiplied the same way and the dash is put back afterward.
function scaleRange(range, multiplier) {
  return {
    amount: scaleAmount(range.amount, multiplier),
    amountMax: scaleAmount(range.amountMax, multiplier),
  };
}

// Runs scaleIngredient over the whole ingredient list and hands back a new
// list of scaled copies, leaving the original list untouched.
function getScaledIngredients(ingredients, multiplier) {
  const scaledIngredients = [];
  for (const ingredient of ingredients) {
    scaledIngredients.push(scaleIngredient(ingredient, multiplier));
  }
  return scaledIngredients;
}

// Rounds to two decimal places, so a multiplier like 1.6666666666666667
// (from 5 servings out of 3) displays as a tidy 1.67 instead of a wall of
// digits. This is just tidying a display number — it is not the fraction
// formatting ("¾ cup") that chunk 4 handles for ingredient amounts.
function roundToTwoDecimals(number) {
  return Math.round(number * 100) / 100;
}

// Chunk 4: nice fractions.
//
// Scaling produces decimals like 2.25 — nobody owns a "2.25 cup" measure.
// This turns that into 2¼, the closest amount a real measuring cup or spoon
// set can actually make. It only snaps to a fraction; deciding when a
// fraction is too far off and breaking the amount into smaller units
// instead (cups -> tbsp -> tsp) is chunk 5.

// The leftover amounts a standard measuring set can make, each paired with
// its printable character. 0 and 1 are included as endpoints: they let the
// loop below treat "round down to the whole number" and "round up to the
// next whole number" the same way it treats every other fraction, instead
// of needing special-case code for them.
const niceFractionAmounts = [
  { value: 0, symbol: "" },
  { value: 0.25, symbol: "¼" },
  { value: 1 / 3, symbol: "⅓" },
  { value: 0.5, symbol: "½" },
  { value: 2 / 3, symbol: "⅔" },
  { value: 0.75, symbol: "¾" },
  { value: 1, symbol: "" },
];

// Splits a scaled amount into its whole number and its decimal leftover.
// 2.25 -> whole 2, leftover 0.25. The leftover is what gets snapped to a
// fraction; the whole number is left alone.
function splitWholeAndLeftover(amount) {
  const whole = Math.floor(amount);
  const leftover = amount - whole;
  return { whole, leftover };
}

// Finds the nice fraction closest to the given leftover decimal.
//
// This is a loop that compares every candidate by plain distance, rather
// than a chain of if/else statements checking hand-picked ranges (like
// "if leftover > 0.6, use ⅔"). The reason: with a loop, the boundary
// between two fractions is never written down anywhere — it just falls out
// of whichever candidate happens to be closer. That means adding a new
// fraction to the list (⅛, say) automatically shifts every boundary around
// it correctly, with no if/else logic to rewrite by hand.
function snapToNiceFraction(leftover) {
  let closestFraction = niceFractionAmounts[0];
  let smallestDistance = Math.abs(leftover - closestFraction.value);

  for (const fraction of niceFractionAmounts) {
    const distance = Math.abs(leftover - fraction.value);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      closestFraction = fraction;
    }
  }

  return closestFraction;
}

// Puts the whole number and the snapped fraction back together, handling
// the case where the leftover snapped all the way up to 1. A leftover of
// 0.9 snaps to the "1" entry in the list, and 2.9 needs to read as 3, not
// as "2" with a stray "1" fraction stuck on it — so a snap to 1 rolls into
// the whole number instead of being displayed as a fraction.
function combineWholeAndFraction(whole, fraction) {
  if (fraction.value === 1) {
    return { whole: whole + 1, symbol: "" };
  }
  return { whole: whole, symbol: fraction.symbol };
}

// Turns a whole number and a fraction symbol into the text a cook reads.
// A whole number alone shows as just the number ("3"), a fraction alone
// shows as just the fraction ("¾", not "0¾"), and both together are
// written side by side with no space ("2¼").
function formatWholeAndFraction(whole, symbol) {
  if (symbol === "") {
    return String(whole);
  }
  if (whole === 0) {
    return symbol;
  }
  return whole + symbol;
}

// Top-level entry point: turns a raw scaled amount (a decimal number) into
// the text an ingredient row displays. Unit-aware formatting — deciding
// when to break an amount into smaller units instead of using a fraction —
// is added in chunk 5.
function formatAmount(amount) {
  const { whole, leftover } = splitWholeAndLeftover(amount);
  const nearestFraction = snapToNiceFraction(leftover);
  const combined = combineWholeAndFraction(whole, nearestFraction);
  return formatWholeAndFraction(combined.whole, combined.symbol);
}

// Writes the current multiplier (e.g. "×1.5") into its small text spot
// next to the servings input, so the user can see what's being applied.
function renderMultiplier(multiplier) {
  const multiplierDisplay = document.getElementById("multiplier-display");
  multiplierDisplay.textContent = "×" + roundToTwoDecimals(multiplier);
}

// Chunk 6: the editor (region 2).
//
// This is the one surface a recipe gets typed into. Both entry paths -
// typing by hand now, pasting text in a later chunk - fill in these same
// fields, so scaling never needs to know or care where a recipe came from.

// Draws the whole editor from a recipe object: the name box, the "makes N
// servings" box, and one row per ingredient. Called on page load and again
// whenever a row is added or deleted - NOT on every keystroke. Redrawing an
// input while the user is typing in it would replace that input with a
// brand new DOM element and the cursor would jump out of it, so ordinary
// editing is handled separately by handleEditorFieldChange below, which
// only re-renders the output.
function renderEditor(recipe) {
  const nameInput = document.getElementById("recipe-name");
  nameInput.value = recipe.name;

  const servingsInput = document.getElementById("recipe-servings");
  servingsInput.value = recipe.servings;

  const rowsContainer = document.getElementById("ingredient-rows");
  rowsContainer.replaceChildren();

  for (let index = 0; index < recipe.ingredients.length; index++) {
    const row = renderEditorRow(recipe.ingredients[index], index);
    rowsContainer.appendChild(row);
  }
}

// Builds one editable ingredient row: amount, unit, name, and a delete
// button. index is the row's position in the ingredients array at the time
// it was drawn, which is what the delete button needs to remove the right
// ingredient.
function renderEditorRow(ingredient, index) {
  const row = document.createElement("div");
  row.className = "ingredient-row";

  // Chunk 7: a parsed line that couldn't be understood still gets a row
  // (rule 3 — flag it, never drop it), so this remembers that fact on the
  // row itself. It's read back out in readEditorRow, which is what lets the
  // mark survive a redraw after adding or deleting a row.
  row.dataset.unparsed = ingredient.unparsed ? "true" : "false";

  const amountInput = document.createElement("input");
  // Chunk 6 used type="number" here. Chunk 7 needs this box to also hold a
  // range like "2-3", which a number input can't display, so it's plain
  // text now and readEditorRow (below) is what makes sense of what's typed
  // into it.
  amountInput.type = "text";
  amountInput.className = "amount-input";
  amountInput.value = amountFieldText(ingredient);
  amountInput.addEventListener("input", handleEditorFieldChange);
  row.appendChild(amountInput);

  const unitInput = document.createElement("input");
  unitInput.type = "text";
  unitInput.className = "unit-input";
  unitInput.value = ingredient.unit;
  unitInput.addEventListener("input", handleEditorFieldChange);
  row.appendChild(unitInput);

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "name-input";
  nameInput.value = ingredient.name;
  nameInput.addEventListener("input", handleEditorFieldChange);
  row.appendChild(nameInput);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "×";
  deleteButton.addEventListener("click", function () {
    deleteRow(index);
  });
  row.appendChild(deleteButton);

  // Chunk 7: a quiet visual flag on rows the parser couldn't make sense
  // of, so there's something to notice besides the review notice text at
  // the top of the editor. Real styling is chunk 9 — this is just enough
  // to be seen.
  if (ingredient.unparsed) {
    row.classList.add("unparsed-row");
    const warningMark = document.createElement("span");
    warningMark.className = "unparsed-mark";
    warningMark.textContent = "⚠";
    warningMark.title = "Couldn't read this line automatically — check it";
    row.appendChild(warningMark);
  }

  return row;
}

// Turns an ingredient's amount into the raw text the (editable) amount box
// shows. Deliberately plain numbers, not formatAmount's pretty fractions —
// this box is for typing into, and "1.5" is easier to edit than "1½".
// A range shows as "2-3", matching what readAmountFieldText below expects
// to read back.
function amountFieldText(ingredient) {
  if (ingredient.amount === null) {
    return "";
  }
  if (ingredient.amountMax !== null && ingredient.amountMax !== undefined) {
    return ingredient.amount + "-" + ingredient.amountMax;
  }
  return String(ingredient.amount);
}

// Reads every editor field back into a recipe object. This is the function
// that makes the editor the source of truth: scaling and the output never
// look at exampleRecipe once the page has loaded, only at whatever is
// currently sitting in these boxes.
function readEditorIntoRecipe() {
  const name = document.getElementById("recipe-name").value;
  const servings = Number(document.getElementById("recipe-servings").value);

  const ingredients = [];
  const rows = document.querySelectorAll("#ingredient-rows .ingredient-row");
  for (const row of rows) {
    ingredients.push(readEditorRow(row));
  }

  return { name: name, servings: servings, ingredients: ingredients };
}

// Reads one row's inputs into an ingredient object. Split out of
// readEditorIntoRecipe so that function stays a short loop.
function readEditorRow(row) {
  const amountInput = row.querySelector(".amount-input");
  const unitInput = row.querySelector(".unit-input");
  const nameInput = row.querySelector(".name-input");

  const parsedAmount = readAmountFieldText(amountInput.value);

  // The unparsed flag was stashed on the row itself when it was drawn (see
  // renderEditorRow), so it survives here even though this function never
  // sees the original ingredient object.
  const unparsed = row.dataset.unparsed === "true";

  return {
    amount: parsedAmount.amount,
    amountMax: parsedAmount.amountMax,
    unit: unitInput.value,
    name: nameInput.value,
    unparsed: unparsed,
  };
}

// Turns the raw text typed into the amount box back into numbers. Handles
// a plain amount ("2"), a range ("2-3"), and a blank box (no amount) —
// the same three shapes amountFieldText can produce, so a row round-trips
// through an edit without losing its range.
function readAmountFieldText(text) {
  const trimmedText = text.trim();

  // Number("") evaluates to 0, which would silently turn a blank amount box
  // into a zero amount. Checking for an empty string first keeps a blank
  // box meaning "no amount", matching exampleRecipe's use of null.
  if (trimmedText === "") {
    return { amount: null, amountMax: null };
  }

  // Reuses the same range check and range reader the paste parser uses
  // (see isRange/readLeadingRange below), so "what counts as a range" is
  // defined in exactly one place.
  if (isRange(trimmedText)) {
    const range = readLeadingRange(trimmedText);
    return { amount: range.amount, amountMax: range.amountMax };
  }

  return { amount: Number(trimmedText), amountMax: null };
}

// Appends one blank ingredient row and redraws the editor.
function addEmptyRow() {
  // Read the current fields first, so appending a blank row doesn't throw
  // away edits already made to the other rows.
  const recipe = readEditorIntoRecipe();
  recipe.ingredients.push({ amount: null, amountMax: null, unit: "", name: "", unparsed: false });
  renderEditor(recipe);
  handleEditorFieldChange();
}

// Removes the ingredient at the given position and redraws the editor.
function deleteRow(index) {
  const recipe = readEditorIntoRecipe();
  // splice(index, 1) removes one item by its position in the array. Because
  // renderEditor runs again right after, every remaining row is redrawn
  // with a fresh index matching its new position - so a second delete on
  // "row 1" removes whatever now sits at position 1, not the row that used
  // to be there before the first delete.
  recipe.ingredients.splice(index, 1);
  renderEditor(recipe);
  handleEditorFieldChange();
}

// Runs on every keystroke in any editor field (name, servings, or any
// ingredient input) and on every change to the "cooking for" box. Reads the
// editor, scales it, and redraws only the output in region 3 - the editor
// itself is left alone so focus never jumps out of the field being typed
// in.
function handleEditorFieldChange() {
  const servingsWantedInput = document.getElementById("servings-wanted");
  const servingsWanted = Number(servingsWantedInput.value);
  const recipe = readEditorIntoRecipe();
  renderRecipe(recipe, servingsWanted);
}

// Chunk 7: paste-and-parse (region 1).
//
// Turns a blob of pasted recipe text into ingredient rows the editor can
// show. The parser's only job is to build a recipe object and hand it to
// renderEditor — exactly the same object shape a hand-typed recipe already
// produces. Nothing here talks to scaling directly; a pasted recipe and a
// typed one are indistinguishable once they land in the editor.

// The units the parser recognises. Checked case-insensitively and with a
// trailing period tolerated ("tbsp." matches "tbsp"), see looksLikeUnit.
const knownUnits = [
  "cup", "cups",
  "tbsp", "tablespoon", "tablespoons",
  "tsp", "teaspoon", "teaspoons",
  "oz", "ounce", "ounces",
  "lb", "lbs", "pound", "pounds",
  "g", "gram", "grams", "kg",
  "ml", "l", "litre", "liter",
  "pinch", "dash",
  "clove", "cloves",
  "can", "cans",
  "stick", "sticks",
  "slice", "slices",
];

// Is this word one of the known units? "Tbsp." (capitalised, with a
// trailing period) and "tbsp" both match the same list entry.
function looksLikeUnit(word) {
  const cleanedWord = word.toLowerCase().replace(/\.$/, ""); // drop one trailing "."
  return knownUnits.includes(cleanedWord);
}

// Unicode fraction characters the parser understands, each mapped to its
// decimal value.
const fractionCharacterValues = {
  "¼": 0.25,
  "½": 0.5,
  "¾": 0.75,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 0.125,
};

// "½" -> 0.5. Returns undefined for any character that isn't one of the
// fractions above.
function fractionCharToNumber(char) {
  return fractionCharacterValues[char];
}

// Finds the first fraction character inside a piece of amount text, or
// null if there isn't one. Used by amountTextToNumber to tell "½" (a bare
// fraction) apart from "1½" (a whole number stuck to a fraction).
function findFractionChar(text) {
  for (const character of text) {
    if (fractionCharToNumber(character) !== undefined) {
      return character;
    }
  }
  return null;
}

// "1/2" -> 0.5. Splits on the slash and divides.
function slashFractionToNumber(text) {
  const parts = text.split("/");
  const numerator = Number(parts[0]);
  const denominator = Number(parts[1]);
  return numerator / denominator;
}

// "1 1/2" -> 1.5. The whole number and the fraction are separated by a
// space; each side is handled by the function that already knows how to
// read it.
function amountTextToNumberMixed(text) {
  const parts = text.split(" ");
  const whole = Number(parts[0]);
  const fractionValue = slashFractionToNumber(parts[1]);
  return whole + fractionValue;
}

// "1½" or "½" -> 1.5 / 0.5. Pulls the fraction character's value out, then
// adds whatever whole number (if any) was written directly in front of it.
function amountTextToNumberWithFractionChar(text, fractionChar) {
  const fractionValue = fractionCharToNumber(fractionChar);
  const wholeNumberText = text.replace(fractionChar, "");
  if (wholeNumberText === "") {
    return fractionValue;
  }
  return Number(wholeNumberText) + fractionValue;
}

// Normalises any of the amount text shapes the parser can hand it — "2",
// "1.5", "1/2", "1 1/2", "½" — into a plain number.
function amountTextToNumber(text) {
  if (text.includes(" ")) {
    return amountTextToNumberMixed(text);
  }
  if (text.includes("/")) {
    return slashFractionToNumber(text);
  }
  const fractionChar = findFractionChar(text);
  if (fractionChar !== null) {
    return amountTextToNumberWithFractionChar(text, fractionChar);
  }
  return Number(text);
}

// Matches a range like "2-3" or "2 - 3" at the very start of a string: one
// or more digits, optional space, a dash, optional space, one or more
// digits.
const rangePattern = /^(\d+)\s*-\s*(\d+)/;

// Does the start of this text look like a range, e.g. "2-3 cloves"?
function isRange(text) {
  return rangePattern.test(text);
}

// Reads a leading range off the front of text. PLAN.md's insight: a range
// isn't a special kind of number, it's two ordinary numbers with a dash
// between them, so this just reads both plain numbers out with rangePattern
// and hands them back separately as amount/amountMax.
function readLeadingRange(text) {
  const match = text.match(rangePattern);
  const low = Number(match[1]);
  const high = Number(match[2]);
  const rest = text.slice(match[0].length).trim();
  return { amount: low, amountMax: high, rest: rest };
}

// Matches a mixed number like "1 1/2": a whole number, some spaces, then a
// simple slash fraction.
const mixedNumberPattern = /^\d+\s+\d+\/\d+/;

// Matches a plain slash fraction on its own, like "1/2".
const slashFractionPattern = /^\d+\/\d+/;

// Matches a unicode fraction character (¼ ½ ¾ ⅓ ⅔ ⅛), optionally with a
// whole number written directly in front of it with no space, like "1½".
const unicodeFractionPattern = /^\d*[¼½¾⅓⅔⅛]/;

// Matches a plain whole or decimal number, like "2" or "2.5" or "250".
const plainNumberPattern = /^\d+(\.\d+)?/;

// Tries each amount shape in turn, most specific first, and returns
// whichever one matches the very start of the text — or null if none do.
// Order matters: mixedNumberPattern has to be checked before
// plainNumberPattern, or "1 1/2" would only ever match as a bare "1".
function matchAmountText(text) {
  const patternsToTry = [mixedNumberPattern, slashFractionPattern, unicodeFractionPattern, plainNumberPattern];
  for (const pattern of patternsToTry) {
    const match = text.match(pattern);
    if (match !== null) {
      return match[0];
    }
  }
  return null;
}

// Grabs the amount off the front of a line of text, in whatever shape it's
// written. Returns null when there's no leading amount at all — that's not
// a failure, it's rule 1: "Salt and pepper to taste" has nothing to grab.
function readLeadingAmount(text) {
  if (isRange(text)) {
    return readLeadingRange(text);
  }

  const amountText = matchAmountText(text);
  if (amountText === null) {
    return null;
  }

  const amount = amountTextToNumber(amountText);
  const rest = text.slice(amountText.length).trim();
  return { amount: amount, amountMax: null, rest: rest };
}

// Turns one line of pasted recipe text into {amount, amountMax, unit, name,
// unparsed}. This is where the three parsing rules from PLAN.md live:
//
// 1. No leading number -> leave the line alone (amount stays null).
// 2. A range ("2-3 cloves") carries amount and amountMax instead of one
//    plain amount — handled upstream by readLeadingAmount / isRange.
// 3. Anything that can't be made sense of is still turned into a row, with
//    the original text kept in the name field and unparsed set to true, so
//    nothing is ever silently dropped.
function parseLine(line) {
  const trimmedLine = line.trim();
  const leadingAmount = readLeadingAmount(trimmedLine);

  // Rule 1: nothing to grab at the front means this line is correct as
  // written, at any batch size.
  if (leadingAmount === null) {
    return { amount: null, amountMax: null, unit: "", name: trimmedLine, unparsed: false };
  }

  // A parenthetical immediately after the amount, like "1 (14 oz) can...",
  // is a nested amount this parser doesn't attempt to untangle. Flagging it
  // is more honest than guessing and getting it wrong.
  if (leadingAmount.rest.startsWith("(")) {
    return { amount: null, amountMax: null, unit: "", name: trimmedLine, unparsed: true };
  }

  const restWords = leadingAmount.rest.split(/\s+/); // split on any run of whitespace
  const firstWord = restWords[0];

  let unit = "";
  let name = leadingAmount.rest;
  if (looksLikeUnit(firstWord)) {
    unit = firstWord;
    name = restWords.slice(1).join(" ");
  }

  // An amount with nothing left to call the ingredient isn't a real parse —
  // flag it instead of showing a blank name.
  if (name.trim() === "") {
    return { amount: null, amountMax: null, unit: "", name: trimmedLine, unparsed: true };
  }

  return {
    amount: leadingAmount.amount,
    amountMax: leadingAmount.amountMax,
    unit: unit,
    name: name.trim(),
    unparsed: false,
  };
}

// Splits a pasted blob of text into individual lines, dropping any blank
// ones (a blank line between ingredients shouldn't become an empty row).
function splitIntoLines(text) {
  const rawLines = text.split("\n");
  const lines = [];
  for (const rawLine of rawLines) {
    const trimmedLine = rawLine.trim();
    if (trimmedLine !== "") {
      lines.push(trimmedLine);
    }
  }
  return lines;
}

// Counts how many of a recipe's ingredients the parser couldn't make sense
// of, for the review notice.
function countUnparsed(recipe) {
  let unparsedCount = 0;
  for (const ingredient of recipe.ingredients) {
    if (ingredient.unparsed) {
      unparsedCount = unparsedCount + 1;
    }
  }
  return unparsedCount;
}

// Writes the plain-language review notice, e.g. "Read 9 of 10 lines. Check
// the marked one." Informative, not blocking — the user can scale the
// recipe regardless of what this says.
function renderReviewNotice(total, unparsed) {
  const noticeElement = document.getElementById("review-notice");
  const readCount = total - unparsed;

  let message = "Read " + readCount + " of " + total + " lines.";
  if (unparsed === 1) {
    message = message + " Check the marked one.";
  } else if (unparsed > 1) {
    message = message + " Check the marked ones.";
  }

  noticeElement.textContent = message;
}

// Parses a pasted blob of text and fills the editor with the result. Keeps
// whatever name and servings are already in the editor — pasting only
// replaces the ingredient list, since a recipe's title and serving count
// don't usually appear as one of the ingredient lines.
function loadPastedText(text) {
  const currentRecipe = readEditorIntoRecipe();

  const lines = splitIntoLines(text);
  const ingredients = [];
  for (const line of lines) {
    ingredients.push(parseLine(line));
  }

  const recipe = { name: currentRecipe.name, servings: currentRecipe.servings, ingredients: ingredients };

  renderEditor(recipe);
  handleEditorFieldChange();
  renderReviewNotice(lines.length, countUnparsed(recipe));
}

// The "Read recipe" button: takes whatever is in the paste textarea right
// now and runs it through the parser.
function handleReadRecipeButton() {
  const pasteTextarea = document.getElementById("paste-textarea");
  loadPastedText(pasteTextarea.value);
}

// The "Paste from clipboard" button. Reading the clipboard programmatically
// needs the user's permission and a secure (https) connection, and can
// silently fail — most notably when the page is opened straight from a
// file on disk (file://) rather than served over https, which is exactly
// how this file can be opened while working on it locally. The textarea is
// always the real way in; when the clipboard read is refused or
// unavailable, this just puts the cursor in the textarea so the user can
// paste by hand (Ctrl/Cmd+V) instead.
function handlePasteButton() {
  const pasteTextarea = document.getElementById("paste-textarea");

  if (!navigator.clipboard || !navigator.clipboard.readText) {
    pasteTextarea.focus();
    return;
  }

  navigator.clipboard
    .readText()
    .then(function (clipboardText) {
      pasteTextarea.value = clipboardText;
    })
    .catch(function () {
      pasteTextarea.focus();
    });
}

// Pre-fills the editor with the starting recipe. From here on the editor's
// own fields are what everything else reads from.
renderEditor(exampleRecipe);

// The name and "makes N servings" fields are fixed in index.html - renderEditor
// only ever sets their .value, it never recreates them - so their listeners
// only need to be attached once, here, rather than inside renderEditor.
const recipeNameInput = document.getElementById("recipe-name");
recipeNameInput.addEventListener("input", handleEditorFieldChange);

const recipeServingsInput = document.getElementById("recipe-servings");
recipeServingsInput.addEventListener("input", handleEditorFieldChange);

const addIngredientButton = document.getElementById("add-ingredient-button");
addIngredientButton.addEventListener("click", addEmptyRow);

const servingsWantedInput = document.getElementById("servings-wanted");
servingsWantedInput.addEventListener("input", handleEditorFieldChange);

const pasteButton = document.getElementById("paste-button");
pasteButton.addEventListener("click", handlePasteButton);

const readRecipeButton = document.getElementById("read-recipe-button");
readRecipeButton.addEventListener("click", handleReadRecipeButton);

// Draws the output for the first time, using the pre-filled editor and
// whatever the "cooking for" input starts at.
handleEditorFieldChange();
