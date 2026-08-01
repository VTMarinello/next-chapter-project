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

// Draws the whole recipe — name, servings, and every ingredient row —
// into the page.
function renderRecipe(recipe) {
  const recipeContainer = document.getElementById("recipe");

  const heading = document.createElement("h2");
  heading.textContent = recipe.name;
  recipeContainer.appendChild(heading);

  const servingsLine = document.createElement("p");
  servingsLine.textContent = "Serves " + recipe.servings;
  recipeContainer.appendChild(servingsLine);

  const ingredientList = document.createElement("ul");
  for (const ingredient of recipe.ingredients) {
    const row = renderIngredientRow(ingredient);
    ingredientList.appendChild(row);
  }
  recipeContainer.appendChild(ingredientList);
}

renderRecipe(exampleRecipe);
