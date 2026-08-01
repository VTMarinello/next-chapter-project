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
// Just the measurement part of a line — "2 cups", "9 tbsp 1 tsp", "4-6
// cloves" — with no ingredient name. Split out from formatIngredientText so
// the output list can put the quantity and the name in separate elements and
// line every quantity up in its own column. Returns "" when there is nothing
// to measure ("Salt and pepper to taste").
function formatIngredientQuantity(ingredient) {
  const textParts = [];
  const hasRange = ingredient.amountMax !== null && ingredient.amountMax !== undefined;

  if (ingredient.amount !== null && hasRange) {
    // Chunk 5's unit-aware formatAmount can break a single amount into more
    // than one unit ("9 tbsp 1 tsp"), which would make a range unreadable
    // ("9 tbsp 1 tsp - 2 tbsp cups"). So a range is never decomposed: each
    // end is just snapped to a plain fraction with formatFractionAmount,
    // and the unit is written once, after the whole range.
    textParts.push(formatFractionAmount(ingredient.amount) + "-" + formatFractionAmount(ingredient.amountMax));
    if (ingredient.unit !== "") {
      textParts.push(ingredient.unit);
    }
  } else if (ingredient.amount !== null) {
    // formatAmount decides the unit text itself as part of its result -
    // sometimes it's the original unit ("2 cups"), sometimes decomposition
    // has broken it into more than one ("9 tbsp 1 tsp") - so the unit isn't
    // added again separately here.
    textParts.push(formatAmount(ingredient.amount, ingredient.unit));
  } else if (ingredient.unit !== "") {
    textParts.push(ingredient.unit);
  }

  return textParts.join(" ");
}

// The whole line as one string — quantity then name. Kept because it's the
// plain-text form of an ingredient, useful anywhere the two parts don't need
// to be styled separately.
function formatIngredientText(ingredient) {
  const quantity = formatIngredientQuantity(ingredient);

  if (quantity === "") {
    return ingredient.name;
  }

  return quantity + " " + ingredient.name;
}

// Builds the <li> for one ingredient. Kept separate from renderRecipe so
// each function only has one job: this one draws a single row.
function renderIngredientRow(ingredient) {
  const row = document.createElement("li");

  // The quantity and the name go in separate spans rather than one string,
  // so style.css can give the quantity its own fixed column. Every amount
  // then lines up vertically down the list, the way a printed recipe card
  // sets them — the numbers are what you're scanning for while cooking, and
  // they're much easier to read down a straight edge.
  const quantity = document.createElement("span");
  quantity.className = "qty";
  quantity.textContent = formatIngredientQuantity(ingredient);
  row.appendChild(quantity);

  const name = document.createElement("span");
  name.className = "ing";
  name.textContent = ingredient.name;
  row.appendChild(name);

  // Chunk 9: a quiet note for lines with nothing to scale ("salt to
  // taste", or a line the parser couldn't read), so a missing scaled
  // number reads as expected behaviour rather than a bug.
  if (ingredient.amount === null) {
    const note = document.createElement("span");
    note.className = "not-scaled-note";
    note.textContent = "not scaled";
    name.appendChild(note);
  }

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

  // Chunk 10: recipe.servings and servingsWanted can both be null now — see
  // readServingsInput further down — when a servings box is blank, zero,
  // negative, or not a number. renderServingsMessages tells the user which
  // box needs fixing; determineMultiplier falls back to the recipe's
  // original amounts instead of dividing by something unusable.
  renderServingsMessages(recipe.servings, servingsWanted);
  const canScale = recipe.servings !== null && servingsWanted !== null;
  const multiplier = determineMultiplier(recipe.servings, servingsWanted);
  renderMultiplier(multiplier, canScale);

  const heading = document.createElement("h2");
  heading.textContent = recipe.name;
  recipeContainer.appendChild(heading);

  const servingsLine = document.createElement("p");
  servingsLine.textContent = "Originally serves " + servingsDisplayText(recipe.servings);
  recipeContainer.appendChild(servingsLine);

  const scaledIngredients = getScaledIngredients(recipe.ingredients, multiplier);
  renderIngredientList(recipeContainer, scaledIngredients);
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

// Turns a raw scaled amount (a decimal number) into a plain fraction, with
// no unit and no decomposition. This was chunk 4's whole formatAmount
// function; chunk 5 renamed it because it's now just one ingredient of a
// bigger formatAmount(amount, unit) below — the piece that turns a decimal
// into "2¼" is reused by several of the unit-aware paths.
function formatFractionAmount(amount) {
  const { whole, leftover } = splitWholeAndLeftover(amount);
  const nearestFraction = snapToNiceFraction(leftover);
  const combined = combineWholeAndFraction(whole, nearestFraction);
  return formatWholeAndFraction(combined.whole, combined.symbol);
}

// Chunk 5: mixed-unit decomposition.
//
// A fraction alone isn't always the right answer. Scaling ⅓ cup by 1.75×
// gives 0.5833… cups — nobody owns a 0.5833 cup measure, and the nearest
// nice fraction (½ cup) quietly throws away 1⅓ tbsp. The fix is to convert
// the amount down to teaspoons and build it back up from the largest unit
// that fits, the same way a cash register makes change from the fewest,
// largest coins first: as many cups as fit, then as many tbsp as fit in
// what's left, then whatever tsp remain. See decomposeToUnits below for the
// loop itself.
//
// Decomposing is not always an improvement, though — "4 cups 8 tbsp" is a
// worse way to say 4.5 cups than "4½ cups". So the rule is fraction first,
// decompose second: try snapping to a nice fraction, and only fall back to
// decomposing when that fraction would be meaningfully wrong. See
// isFractionGoodEnough below for exactly how "meaningfully wrong" is
// measured.

// classifyUnit sorts a unit word into one of four treatments. Each list
// below is checked case-insensitively and tolerates a trailing period
// ("tbsp."), the same cleanup the paste parser's looksLikeUnit uses.
const volumeUnitNames = ["cup", "cups", "tbsp", "tablespoon", "tablespoons", "tsp", "teaspoon", "teaspoons"];
const weightUnitNames = [
  "g", "gram", "grams", "kg", "kilogram", "kilograms",
  "ml", "milliliter", "milliliters", "millilitre", "millilitres",
  "l", "liter", "liters", "litre", "litres",
  "oz", "ounce", "ounces", "lb", "lbs", "pound", "pounds",
];
const countUnitNames = ["clove", "cloves", "can", "cans", "stick", "sticks", "slice", "slices", "pinch", "dash"];

// Lowercases a unit and drops one trailing period, so "Tbsp.", "TBSP", and
// "tbsp" all compare equal. A small helper of its own because several of
// the functions below need this same cleanup before looking a unit up.
function normalizeUnitText(unit) {
  return unit.trim().toLowerCase().replace(/\.$/, "");
}

// Sorts a unit into "volume" (has a ladder to decompose down), "weight"
// (rounds, never fractions), "count" (an honest fraction, including an
// empty unit like "3 eggs"), or "none" (a unit this app doesn't recognize,
// so nothing special is done to it).
function classifyUnit(unit) {
  const normalizedUnit = normalizeUnitText(unit);

  if (volumeUnitNames.includes(normalizedUnit)) {
    return "volume";
  }
  if (weightUnitNames.includes(normalizedUnit)) {
    return "weight";
  }
  if (normalizedUnit === "") {
    return "count";
  }
  if (countUnitNames.includes(normalizedUnit)) {
    return "count";
  }
  return "none";
}

// The volume ladder: 1 cup = 16 tbsp, 1 tbsp = 3 tsp, so 1 cup = 48 tsp.
// teaspoonsPerUnit is what toBaseUnit and decomposeToUnits convert with.
// singularLabel/pluralLabel are the display text for that rung - tbsp and
// tsp are already abbreviations and don't change with the count, but "cup"
// becomes "cups".
const volumeLadder = [
  { teaspoonsPerUnit: 48, unitNames: ["cup", "cups"], singularLabel: "cup", pluralLabel: "cups" },
  { teaspoonsPerUnit: 3, unitNames: ["tbsp", "tablespoon", "tablespoons"], singularLabel: "tbsp", pluralLabel: "tbsp" },
  { teaspoonsPerUnit: 1, unitNames: ["tsp", "teaspoon", "teaspoons"], singularLabel: "tsp", pluralLabel: "tsp" },
];

// Looks up which ladder rung a unit belongs to, so the same rung data
// (its size in teaspoons, its singular/plural text) can be reused by
// toBaseUnit, canonicalVolumeLabel, and decomposeToUnits.
function findLadderRungForUnit(normalizedUnit) {
  for (const rung of volumeLadder) {
    if (rung.unitNames.includes(normalizedUnit)) {
      return rung;
    }
  }
  return null;
}

// Picks singular or plural text for a rung based on the amount attached to
// it. "1 cup" and "¼ cup" both read as singular, so the cutoff is "more
// than one", not "not exactly one".
function labelForRung(rung, amount) {
  if (amount > 1) {
    return rung.pluralLabel;
  }
  return rung.singularLabel;
}

// The display unit for an amount that's staying a plain fraction (not
// decomposing) — e.g. "0.25 cups" should read as "¼ cup" (singular), even
// though the unit was typed as the plural "cups".
function canonicalVolumeLabel(unit, amount) {
  const normalizedUnit = normalizeUnitText(unit);
  const rung = findLadderRungForUnit(normalizedUnit);
  return labelForRung(rung, amount);
}

// Converts an amount in any volume unit down to teaspoons, the ladder's
// smallest rung. Everything else in the ladder - decomposing, measuring how
// far off a fraction is - works in teaspoons so there's only one base unit
// to reason about.
function toBaseUnit(amount, unit) {
  const normalizedUnit = normalizeUnitText(unit);
  const rung = findLadderRungForUnit(normalizedUnit);
  return amount * rung.teaspoonsPerUnit;
}

// Half a tablespoon, in teaspoons — the cutoff PLAN.md sets for "is a plain
// fraction close enough, or does this amount need decomposing". A judgment
// call, not a law of nature; it can be tuned.
const fractionToleranceInTsp = 1.5;

// Decides whether snapping this amount to a nice fraction (¼, ⅓, ½, ⅔, ¾)
// is close enough to keep, or whether it's off by enough to be worth
// decomposing instead.
//
// It works by finding the fraction snapToNiceFraction would pick, measuring
// the gap between that fraction and the real amount, and converting that
// gap into teaspoons so it can be compared against the half-tablespoon
// tolerance regardless of what unit the ingredient uses.
function isFractionGoodEnough(amount, unit) {
  const { whole, leftover } = splitWholeAndLeftover(amount);
  const nearestFraction = snapToNiceFraction(leftover);
  const snappedAmount = whole + nearestFraction.value;

  const errorInGivenUnit = Math.abs(amount - snappedAmount);
  const errorInTsp = toBaseUnit(errorInGivenUnit, unit);

  return errorInTsp <= fractionToleranceInTsp;
}

// The change-making loop. Takes an amount already converted to teaspoons
// and walks the ladder from the largest rung (cup) to the smallest (tsp),
// at each step taking as many whole units as fit and carrying whatever's
// left down to the next, smaller rung — exactly how a cash register makes
// change from the fewest, largest coins first. A rung that fits zero times
// contributes nothing and is left out of the result, so the amount never
// reads "0 cups 9 tbsp 1 tsp".
//
// The smallest rung (tsp) is handled differently: there's nothing smaller
// left to carry a remainder into, so whatever teaspoons remain — whole or
// fractional — become the last part as-is. dropNegligibleTail, below, is
// what cleans up a fractional last part like 1.4 tsp into 1½ tsp.
function decomposeToUnits(baseAmountInTsp) {
  const parts = [];

  // Floating-point arithmetic can leave tiny noise behind — 28 can come out
  // as 27.999999999999996 — which would make the loop below undercount a
  // unit by one. Rounding to six decimal places clears that noise without
  // affecting any amount a real recipe would ever need.
  let remainder = Math.round(baseAmountInTsp * 1000000) / 1000000;

  for (let rungIndex = 0; rungIndex < volumeLadder.length; rungIndex++) {
    const rung = volumeLadder[rungIndex];
    const isSmallestUnit = rungIndex === volumeLadder.length - 1;

    if (isSmallestUnit) {
      if (remainder > 0) {
        parts.push({ amount: remainder, unit: labelForRung(rung, remainder) });
      }
    } else {
      const wholeUnitsHere = Math.floor(remainder / rung.teaspoonsPerUnit);
      if (wholeUnitsHere > 0) {
        parts.push({ amount: wholeUnitsHere, unit: labelForRung(rung, wholeUnitsHere) });
        remainder = remainder - wholeUnitsHere * rung.teaspoonsPerUnit;
      }
    }
  }

  return parts;
}

// The finest amount a real measuring spoon set can measure — ⅛ tsp. Once a
// decomposed amount's last part falls below this, it isn't worth showing.
const negligibleAmountInTsp = 1 / 8;

// Cleans up the last part decomposeToUnits produced, which is the only one
// that can come out fractional (cup and tbsp remainders are always whole
// numbers - decomposeToUnits carries them down instead of leaving them
// fractional). Two things can happen to that last fractional part:
// - too small to matter (under ⅛ tsp) → drop it entirely
// - otherwise → snap it to a nice fraction, so it reads "1½ tsp" and never
//   the raw decimal "1.4 tsp"
function dropNegligibleTail(parts) {
  if (parts.length === 0) {
    return parts;
  }

  const lastPart = parts[parts.length - 1];

  if (Number.isInteger(lastPart.amount)) {
    return parts;
  }

  if (lastPart.amount < negligibleAmountInTsp) {
    return parts.slice(0, parts.length - 1);
  }

  const snappedPart = { amount: formatFractionAmount(lastPart.amount), unit: lastPart.unit };
  return parts.slice(0, parts.length - 1).concat([snappedPart]);
}

// Turns a list of decomposed parts, like [{amount: 9, unit: "tbsp"},
// {amount: 1, unit: "tsp"}], into the text a cook reads: "9 tbsp 1 tsp".
function formatParts(parts) {
  const partTexts = [];
  for (const part of parts) {
    partTexts.push(part.amount + " " + part.unit);
  }
  return partTexts.join(" ");
}

// Rounds a weight to a whole number. Metric units multiply cleanly, so
// there's no fraction step here the way there is for volume — "247.3g"
// just becomes "247g".
function roundWeight(number) {
  return Math.round(number);
}

// Puts an already-formatted amount and a unit word together, leaving out
// the unit entirely when there isn't one — "3 eggs" has no unit word beyond
// the ingredient's name, so joinAmountAndUnit(amountText, "") is just the
// amount text on its own.
function joinAmountAndUnit(amountText, unit) {
  if (unit === "") {
    return amountText;
  }
  return amountText + " " + unit;
}

// Formats a volume amount: try a plain fraction first, and only decompose
// down the ladder when that fraction would be meaningfully wrong.
function formatVolumeAmount(amount, unit) {
  if (isFractionGoodEnough(amount, unit)) {
    const fractionText = formatFractionAmount(amount);
    const unitLabel = canonicalVolumeLabel(unit, amount);
    return joinAmountAndUnit(fractionText, unitLabel);
  }

  const baseAmountInTsp = toBaseUnit(amount, unit);
  const parts = decomposeToUnits(baseAmountInTsp);
  const finalParts = dropNegligibleTail(parts);
  return formatParts(finalParts);
}

// Formats a weight amount: round it, no fractions.
function formatWeightAmount(amount, unit) {
  const roundedAmount = roundWeight(amount);
  return joinAmountAndUnit(String(roundedAmount), unit);
}

// Formats a countable amount ("1⅓ eggs"): an honest fraction, same as
// formatFractionAmount, with the unit (if there is one) added after. Never
// forced to a whole number — the cook decides whether to round.
function formatCountAmount(amount, unit) {
  const fractionText = formatFractionAmount(amount);
  return joinAmountAndUnit(fractionText, unit);
}

// Formats an amount whose unit this app doesn't recognize: no ladder to
// decompose and no fraction rule that fits, so it's just a plain rounded
// number next to whatever unit was typed.
function formatUnknownAmount(amount, unit) {
  const roundedAmount = roundToTwoDecimals(amount);
  return joinAmountAndUnit(String(roundedAmount), unit);
}

// Top-level entry point: turns a raw scaled amount and its unit into the
// text an ingredient row displays. Looks up what kind of unit this is, and
// hands off to whichever formatting strategy fits it.
function formatAmount(amount, unit) {
  const unitType = classifyUnit(unit);

  if (unitType === "volume") {
    return formatVolumeAmount(amount, unit);
  }
  if (unitType === "weight") {
    return formatWeightAmount(amount, unit);
  }
  if (unitType === "count") {
    return formatCountAmount(amount, unit);
  }

  return formatUnknownAmount(amount, unit);
}

// Writes the current multiplier (e.g. "×1.5") into its small text spot
// next to the servings input, so the user can see what's being applied.
function renderMultiplier(multiplier, canScale) {
  const multiplierDisplay = document.getElementById("multiplier-display");

  // Showing "×1" when scaling couldn't happen would look like a real,
  // deliberate 1x scale rather than "there's nothing to calculate right
  // now" — the inline message next to the bad box already explains that, so
  // the multiplier is left blank instead of showing a misleading number.
  if (!canScale) {
    multiplierDisplay.textContent = "";
    return;
  }

  // "×1" is noise: it appears whenever the two serving counts happen to
  // match, which is the app's own starting state, and it tells the user
  // nothing they can't see from the two identical numbers beside it. The
  // multiplier is only worth showing once it's actually doing something.
  if (multiplier === 1) {
    multiplierDisplay.textContent = "";
    return;
  }

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
  // recipe.servings can be null now (see readServingsInput) when the box was
  // left blank or invalid — setting an input's value straight to null would
  // display the literal text "null", so a blank/invalid box is redrawn as
  // an empty box instead.
  servingsInput.value = recipe.servings === null ? "" : recipe.servings;

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
  // The column headings above the rows are hidden on a narrow screen,
  // where the three boxes stack vertically instead of sitting in a
  // labelled row. Without a placeholder they would be three unlabelled
  // boxes on a phone, which is where this app is meant to be used.
  amountInput.placeholder = "Amount";
  amountInput.setAttribute("aria-label", "Amount");
  amountInput.value = amountFieldText(ingredient);
  amountInput.addEventListener("input", handleEditorFieldChange);
  row.appendChild(amountInput);

  const unitInput = document.createElement("input");
  unitInput.type = "text";
  unitInput.className = "unit-input";
  unitInput.placeholder = "Unit";
  unitInput.setAttribute("aria-label", "Unit");
  unitInput.value = ingredient.unit;
  unitInput.addEventListener("input", handleEditorFieldChange);
  row.appendChild(unitInput);

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "name-input";
  nameInput.placeholder = "Ingredient";
  nameInput.setAttribute("aria-label", "Ingredient");
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

  // Chunk 10: this used to be a bare Number(...), which turns a blank box
  // into 0 and feeds straight into a division further down the line — the
  // root cause of the Infinity/NaN bugs described in PLAN.md's chunk 10
  // row. readServingsInput returns null instead for anything that isn't a
  // usable positive number.
  const servings = readServingsInput(document.getElementById("recipe-servings").value);

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

  const parsedAmount = Number(trimmedText);

  // Chunk 10: a negative amount ("-2 cups flour") doesn't mean anything for
  // a recipe, and neither does text that isn't a number at all ("abc"). Both
  // are treated the same as a blank box — no amount — rather than silently
  // scaling a negative number or showing "NaN cups" in the output.
  if (!isUsableAmount(parsedAmount)) {
    return { amount: null, amountMax: null };
  }

  return { amount: parsedAmount, amountMax: null };
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

// Reads the editor, scales it, and redraws only the output in region 3 -
// the editor itself is left alone so focus never jumps out of the field
// being typed in. Split out from handleEditorFieldChange (below) so the
// "Start over" button can redraw the output without also triggering a save
// right after it has just cleared the save.
function updateScaledOutput() {
  const servingsWantedInput = document.getElementById("servings-wanted");

  // Chunk 10: same fix as readEditorIntoRecipe's servings field — a bare
  // Number(...) here is what turned a blank "cooking for" box into a
  // silent ×0. readServingsInput returns null instead, and renderRecipe
  // decides what to show when it gets one.
  const servingsWanted = readServingsInput(servingsWantedInput.value);
  const recipe = readEditorIntoRecipe();
  renderRecipe(recipe, servingsWanted);
}

// Runs on every keystroke in any editor field (name, servings, or any
// ingredient input) and on every change to the "cooking for" box. Updates
// the scaled output, then saves the current recipe to localStorage (chunk
// 8) so every edit survives a page refresh without the user doing anything
// extra.
function handleEditorFieldChange() {
  updateScaledOutput();
  saveRecipes();
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

// Chunk 8: saving recipes in the browser.
//
// localStorage is a key/value store built into the browser. It persists
// between page loads on the same device and browser, but never leaves the
// browser and isn't a database or a network service - it satisfies the
// project's "no databases, no APIs" rule. It can only store strings, so a
// recipe object has to be turned into a string with JSON.stringify before
// it's saved, and turned back into an object with JSON.parse when it's
// read out again.

// A specific, namespaced key, rather than something generic like "recipe" -
// other pages served from the same origin (a github.io site, for example)
// share the same localStorage, so a vague key risks colliding with
// something else that uses the same name.
const RECIPE_STORAGE_KEY = "recipe-scaler-recipe";

// Reads whatever is currently in the editor and writes it to localStorage.
// Called from handleEditorFieldChange, so it runs after every keystroke,
// every added or deleted row, and every paste-and-parse - any change to the
// recipe gets saved.
function saveRecipes() {
  const recipe = readEditorIntoRecipe();
  const recipeText = JSON.stringify(recipe);

  try {
    localStorage.setItem(RECIPE_STORAGE_KEY, recipeText);
  } catch (error) {
    // setItem can throw - some private/incognito browsing modes disable
    // storage entirely, and storage has a size limit it could hit. Either
    // way, a failed save should never break normal use of the app, so the
    // error is swallowed here instead of shown to the user.
  }
}

// Reads the saved recipe back out of localStorage. Returns null if there
// isn't one - either nothing has been saved yet, or the saved value
// couldn't be used.
function loadRecipes() {
  const recipeText = localStorage.getItem(RECIPE_STORAGE_KEY);

  if (recipeText === null) {
    // Nothing has been saved in this browser yet. Not an error.
    return null;
  }

  try {
    return JSON.parse(recipeText);
  } catch (error) {
    // JSON.parse throws on text that isn't valid JSON. That could happen if
    // someone hand-edits localStorage in devtools, or a saved value was
    // written by a different version of this app. Without this try/catch, a
    // bad saved value would throw right here while the page is loading, and
    // the whole page would fail - a blank screen with only an error in the
    // console. Falling back to null (and from there to exampleRecipe) keeps
    // the app usable instead.
    return null;
  }
}

// Removes the saved recipe from localStorage, so the next page load falls
// back to exampleRecipe instead of whatever was saved.
function clearSavedRecipe() {
  try {
    localStorage.removeItem(RECIPE_STORAGE_KEY);
  } catch (error) {
    // Same reasoning as saveRecipes - storage access can fail, and that
    // shouldn't stop the reset button from at least putting the example
    // recipe back on screen.
  }
}

// The "Start over" button: throws away the saved recipe and puts the
// example recipe back in the editor. Exists so a user who has saved a
// broken or messy recipe has a way back to a known-good starting point -
// without this, a bad save would be stuck in that browser forever.
function handleResetButton() {
  clearSavedRecipe();
  renderEditor(exampleRecipe);
  updateScaledOutput();
}

// Chunk 10: empty states and invalid input.
//
// Two servings boxes feed straight into calculateMultiplier's division:
// "Makes N servings" is the divisor, "Cooking for N people" is the
// numerator. A blank divisor used to produce Infinity, a blank numerator
// used to produce silent zeroes, and both blank together used to produce
// NaN — see PLAN.md's chunk 10 row for the confirmed bugs. The fix applied
// throughout this section is the same idea everywhere: turn "not a usable
// number" into null as early as possible, and treat null as "don't scale,
// and say why" instead of letting a bad number reach the division.

// A servings count only means something if it's a real, positive number.
// Zero, negative, blank, and "abc" all fail this the same way, which is why
// one check covers all of them instead of three separate ones.
function isUsableServingsNumber(number) {
  return Number.isFinite(number) && number > 0;
}

// Reads a servings box's raw text into a number, or null when it isn't
// usable. Returning null — instead of letting a bad value become NaN or a
// silent 0 — means every place that uses this only has to ask one question,
// "is it null?", instead of guarding against several different kinds of
// broken number.
function readServingsInput(rawText) {
  const trimmedText = rawText.trim();
  if (trimmedText === "") {
    return null;
  }

  const number = Number(trimmedText);
  if (!isUsableServingsNumber(number)) {
    return null;
  }

  return number;
}

// Decides what to scale ingredient amounts by. A multiplier only means
// something when both servings numbers are usable — if either is missing or
// invalid there is nothing sensible to divide by, so the recipe is shown at
// its original amounts (multiplier 1) instead of guessing at a number the
// user didn't type.
function determineMultiplier(recipeServings, servingsWanted) {
  if (recipeServings === null || servingsWanted === null) {
    return 1;
  }
  return calculateMultiplier(servingsWanted, recipeServings);
}

// Plain-language explanations shown next to a servings box when it isn't
// usable. Written once here so the same wording appears everywhere the
// message can show up.
const RECIPE_SERVINGS_MESSAGE = "Enter how many servings the recipe makes.";
const SERVINGS_WANTED_MESSAGE = "Enter how many people you're cooking for.";

// Writes, or clears, the inline message next to each servings box. Runs on
// every render, so a message appears the moment a box becomes unusable and
// disappears the moment it's fixed — nothing needs to be dismissed by hand.
function renderServingsMessages(recipeServings, servingsWanted) {
  const makesMessage = document.getElementById("recipe-servings-message");
  makesMessage.textContent = recipeServings === null ? RECIPE_SERVINGS_MESSAGE : "";

  const wantedMessage = document.getElementById("servings-wanted-message");
  wantedMessage.textContent = servingsWanted === null ? SERVINGS_WANTED_MESSAGE : "";
}

// Text for the "Originally serves N" line. There's nothing to print when
// the servings box is blank or invalid, so this says so in plain language
// instead of printing the literal word "null" onto the page.
function servingsDisplayText(recipeServings) {
  if (recipeServings === null) {
    return "?";
  }
  return String(recipeServings);
}

// A negative amount doesn't mean anything for a recipe — there's no such
// thing as "-2 cups flour" — and neither does a non-numeric one ("abc"). An
// amount only counts as usable if it's a real number that isn't negative.
function isUsableAmount(number) {
  return Number.isFinite(number) && number >= 0;
}

// A row counts as blank once every field is empty — no amount, no unit, no
// name. That happens right after "+ Add ingredient" is clicked, or when
// someone clears every field in a row without deleting it. A blank row
// isn't a real ingredient, so the output leaves it out rather than
// rendering it as a stray empty bullet.
function isBlankIngredient(ingredient) {
  return ingredient.amount === null && ingredient.unit.trim() === "" && ingredient.name.trim() === "";
}

// Removes blank rows before the output is drawn. Kept separate from
// isBlankIngredient so that function stays a single yes/no check.
function removeBlankIngredients(ingredients) {
  const displayableIngredients = [];
  for (const ingredient of ingredients) {
    if (!isBlankIngredient(ingredient)) {
      displayableIngredients.push(ingredient);
    }
  }
  return displayableIngredients;
}

// Draws the scaled ingredient list into the given container, or a plain-
// language empty state when there's nothing to show — either every row was
// deleted, or what's left is only blank rows.
function renderIngredientList(container, ingredients) {
  const displayableIngredients = removeBlankIngredients(ingredients);

  if (displayableIngredients.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-state-message";
    emptyMessage.textContent = "No ingredients yet. Add one below, or paste a recipe above.";
    container.appendChild(emptyMessage);
    return;
  }

  const ingredientList = document.createElement("ul");
  for (let index = 0; index < displayableIngredients.length; index++) {
    const row = renderIngredientRow(displayableIngredients[index]);
    // Its position in the list, handed to CSS so each line can be delayed a
    // little more than the one above it when the scale animation plays. CSS
    // can't count elements for itself, so the number has to come from here.
    row.style.setProperty("--i", index);
    ingredientList.appendChild(row);
  }
  container.appendChild(ingredientList);
}

// ---------------------------------------------------------------------------
// The "Scale it" animation.
//
// Amounts already update live on every keystroke, so this button isn't what
// makes scaling happen — it's a deliberate moment where the change is *shown*.
// It replays the scene of one apple becoming a tableful and re-deals the
// ingredient list underneath it.
//
// All the movement itself lives in style.css as keyframes. The only job here
// is switching one class on and off at the right times, which keeps the
// animation something you can read in a stylesheet rather than something
// buried in JavaScript.
// ---------------------------------------------------------------------------

// How long the whole sequence runs, in milliseconds. A little longer than the
// CSS animations, so the last staggered row has finished before the class is
// taken off again.
const scaleAnimationMs = 1800;

// Remembers the timer between clicks. Pressing the button again part-way
// through has to cancel the pending cleanup — otherwise the earlier timer
// would strip the class off midway through the new run and freeze it
// half-played.
let scaleAnimationTimer = null;

// Works out which way the scene should run. Scaling up fills the table;
// scaling down clears it back to the one apple you started with.
function scaleDirection(multiplier) {
  if (multiplier < 1) {
    return "down";
  }

  return "up";
}

function playScaleAnimation(multiplier) {
  const outputPanel = document.getElementById("scale-output");

  if (scaleAnimationTimer !== null) {
    clearTimeout(scaleAnimationTimer);
  }

  // Removing the class and adding it straight back does nothing on its own:
  // the browser batches style changes, sees the class present both before and
  // after, and concludes nothing changed — so the animation never restarts.
  // Reading a layout property in between forces the removal to be applied
  // first, which is what lets the animation start over from the beginning.
  outputPanel.classList.remove("is-scaling", "scale-up", "scale-down");
  void outputPanel.offsetWidth;
  outputPanel.classList.add("is-scaling", "scale-" + scaleDirection(multiplier));

  scaleAnimationTimer = setTimeout(function () {
    outputPanel.classList.remove("is-scaling", "scale-up", "scale-down");
    scaleAnimationTimer = null;
  }, scaleAnimationMs);
}

function handleScaleButton() {
  // Redraw first, so the rows the animation staggers in are the current ones.
  updateScaledOutput();

  // Work out the multiplier the same way the output just did, so the scene
  // runs in the direction the numbers actually moved.
  const recipe = readEditorIntoRecipe();
  const servingsWantedInput = document.getElementById("servings-wanted");
  const servingsWanted = readServingsInput(servingsWantedInput.value);
  const multiplier = determineMultiplier(recipe.servings, servingsWanted);

  playScaleAnimation(multiplier);
}

// Pre-fills the editor with a saved recipe if this browser already has one,
// and falls back to the starting example recipe if not. From here on the
// editor's own fields are what everything else reads from.
const savedRecipe = loadRecipes();
if (savedRecipe === null) {
  renderEditor(exampleRecipe);
} else {
  renderEditor(savedRecipe);
}

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

const resetButton = document.getElementById("reset-button");
resetButton.addEventListener("click", handleResetButton);

const scaleButton = document.getElementById("scale-button");
scaleButton.addEventListener("click", handleScaleButton);

// Draws the output for the first time, using the pre-filled editor and
// whatever the "cooking for" input starts at.
handleEditorFieldChange();
