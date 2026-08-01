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
    textParts.push(formatAmount(ingredient.amount));
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
      unit: ingredient.unit,
      name: ingredient.name,
    };
  }

  return {
    amount: scaleAmount(ingredient.amount, multiplier),
    unit: ingredient.unit,
    name: ingredient.name,
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

  const amountInput = document.createElement("input");
  amountInput.type = "number";
  amountInput.className = "amount-input";
  // A blank amount is a real, meaningful value here ("Salt and pepper to
  // taste" has none), so amount === null shows as an empty box rather than
  // the input defaulting to "0".
  if (ingredient.amount !== null) {
    amountInput.value = ingredient.amount;
  }
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

  return row;
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

// Reads one row's three inputs into an ingredient object. Split out of
// readEditorIntoRecipe so that function stays a short loop.
function readEditorRow(row) {
  const amountInput = row.querySelector(".amount-input");
  const unitInput = row.querySelector(".unit-input");
  const nameInput = row.querySelector(".name-input");

  // Number("") evaluates to 0, which would silently turn a blank amount box
  // into a zero amount. Checking for an empty string first keeps a blank
  // box meaning "no amount", matching exampleRecipe's use of null.
  let amount = null;
  if (amountInput.value.trim() !== "") {
    amount = Number(amountInput.value);
  }

  return { amount: amount, unit: unitInput.value, name: nameInput.value };
}

// Appends one blank ingredient row and redraws the editor.
function addEmptyRow() {
  // Read the current fields first, so appending a blank row doesn't throw
  // away edits already made to the other rows.
  const recipe = readEditorIntoRecipe();
  recipe.ingredients.push({ amount: null, unit: "", name: "" });
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

// Draws the output for the first time, using the pre-filled editor and
// whatever the "cooking for" input starts at.
handleEditorFieldChange();
