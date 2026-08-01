// Chunk 2: display one hard-coded recipe on the page.
//
// The recipe lives in JavaScript, not typed into index.html, so that later
// chunks (scaling, saving, editing) can work with it as data instead of text.

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
    textParts.push(ingredient.amount);
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

// Writes the current multiplier (e.g. "×1.5") into its small text spot
// next to the servings input, so the user can see what's being applied.
function renderMultiplier(multiplier) {
  const multiplierDisplay = document.getElementById("multiplier-display");
  multiplierDisplay.textContent = "×" + roundToTwoDecimals(multiplier);
}

// Reads the servings input and re-renders the recipe scaled to that
// number. Runs once on page load, and again every time the input changes.
function handleServingsInputChange() {
  const servingsInput = document.getElementById("servings-wanted");
  const servingsWanted = Number(servingsInput.value);
  renderRecipe(exampleRecipe, servingsWanted);
}

const servingsInput = document.getElementById("servings-wanted");
servingsInput.addEventListener("input", handleServingsInputChange);

// Draws the page for the first time, using whatever the input starts at.
handleServingsInputChange();
