// ---------------------------------------------------------------------------
// The saved recipes page.
//
// Only the drawing lives here. Everything about how a saved recipe is stored,
// read and validated is in script.js, which this page loads first — so there
// is one definition of the storage format rather than two that can drift.
//
// Opening a recipe works by writing it into the same key the editor already
// loads from on startup, then navigating to the main page. That means no
// special "incoming recipe" path on the other side: the editor loads it the
// same way it loads anything else.
// ---------------------------------------------------------------------------

// Turns a saved entry back into the plain recipe shape the editor expects.
// The saved-only fields (id, savedName, scaledFor) are deliberately left
// behind — the editor has no use for them.
function savedEntryToRecipe(entry) {
  return {
    name: entry.savedName,
    servings: entry.servings,
    ingredients: entry.ingredients,
  };
}

// How many real ingredients an entry has, ignoring any blank rows that were
// left in the editor when it was saved.
function countIngredients(entry) {
  return entry.ingredients.filter(function (ingredient) {
    return !isBlankIngredient(ingredient);
  }).length;
}

// A short readable summary of the sizes involved, e.g. "Makes 4 · scaled for 6".
function describeSizes(entry) {
  const parts = [];

  if (entry.servings === null || entry.servings === undefined) {
    parts.push("Servings not set");
  } else {
    parts.push("Makes " + entry.servings);
  }

  // scaledFor is only worth mentioning when it differs from the recipe's own
  // size — "makes 4, scaled for 4" tells you nothing.
  if (
    entry.scaledFor !== null &&
    entry.scaledFor !== undefined &&
    entry.scaledFor !== entry.servings
  ) {
    parts.push("scaled for " + entry.scaledFor);
  }

  return parts.join(" · ");
}

// The first few ingredient names, as a one-line preview, so a row is
// recognisable without opening it.
function describeIngredients(entry) {
  const names = entry.ingredients
    .filter(function (ingredient) {
      return !isBlankIngredient(ingredient);
    })
    .map(function (ingredient) {
      return ingredient.name;
    });

  const shown = names.slice(0, 4).join(", ");

  if (names.length > 4) {
    return shown + ", +" + (names.length - 4) + " more";
  }

  return shown;
}

function openSavedRecipe(entry) {
  // Written through the shared helper so the format matches exactly what the
  // editor's own loader expects, including its shape check.
  localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(savedEntryToRecipe(entry)));
  window.location.href = "index.html";
}

function handleDeleteClick(entry) {
  // Deleting is irreversible and there's no undo, so it asks first. The
  // recipe's name is in the question — "are you sure?" on its own doesn't
  // tell you which one you're about to lose.
  const confirmed = window.confirm('Delete "' + entry.savedName + '"? This cannot be undone.');

  if (!confirmed) {
    return;
  }

  deleteSavedRecipe(entry.id);
  renderSavedPage();
}

// Builds one row. A wide row rather than a square card: they stack down the
// page with a clear rule between each, so twenty of them still read as a list
// instead of a wall of tiles.
function renderSavedRow(entry) {
  const row = document.createElement("article");
  row.className = "saved-row";

  const body = document.createElement("div");
  body.className = "saved-row-body";

  const name = document.createElement("h2");
  name.className = "saved-row-name";
  name.textContent = entry.savedName;
  body.appendChild(name);

  const meta = document.createElement("p");
  meta.className = "saved-row-meta";
  meta.textContent = describeSizes(entry) + " · " + countIngredients(entry) + " ingredients";
  body.appendChild(meta);

  const preview = document.createElement("p");
  preview.className = "saved-row-preview";
  preview.textContent = describeIngredients(entry);
  body.appendChild(preview);

  row.appendChild(body);

  const actions = document.createElement("div");
  actions.className = "saved-row-actions";

  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.textContent = "Open";
  openButton.addEventListener("click", function () {
    openSavedRecipe(entry);
  });
  actions.appendChild(openButton);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "button-danger";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", function () {
    handleDeleteClick(entry);
  });
  actions.appendChild(deleteButton);

  row.appendChild(actions);

  return row;
}

// What to show when there's nothing saved yet. An empty page with a heading
// and no explanation reads as broken rather than as empty.
function renderEmptyState(container) {
  const empty = document.createElement("div");
  empty.className = "saved-empty";

  const heading = document.createElement("p");
  heading.className = "saved-empty-title";
  heading.textContent = "Nothing saved yet";
  empty.appendChild(heading);

  const explain = document.createElement("p");
  explain.textContent =
    "Scale a recipe on the main page, give it a name, and press Save recipe. It'll show up here.";
  empty.appendChild(explain);

  const link = document.createElement("a");
  link.className = "saved-empty-link";
  link.href = "index.html";
  link.textContent = "Go and scale one";
  empty.appendChild(link);

  container.appendChild(empty);
}

function renderSavedPage() {
  const container = document.getElementById("saved-list");
  const subtitle = document.getElementById("saved-sub");
  const entries = loadSavedRecipes();

  container.replaceChildren();

  if (entries.length === 0) {
    subtitle.textContent = "";
    renderEmptyState(container);
    return;
  }

  subtitle.textContent =
    entries.length === 1 ? "1 recipe, stored in this browser" : entries.length + " recipes, stored in this browser";

  // Newest first: the one you just saved is the one you're most likely
  // looking for.
  const newestFirst = entries.slice().reverse();

  for (const entry of newestFirst) {
    container.appendChild(renderSavedRow(entry));
  }
}

renderSavedPage();
