// Chunk 1: prove the JavaScript file is actually connected to the page.
// This is temporary scaffolding — later chunks replace it with the real recipe.

function showConnectionStatus() {
  // Find the empty paragraph that index.html left for us
  const statusParagraph = document.getElementById("connection-status");

  // Writing text here is the proof: this sentence exists nowhere in the HTML file
  statusParagraph.textContent = "JavaScript is connected. This sentence came from script.js.";
}

showConnectionStatus();
