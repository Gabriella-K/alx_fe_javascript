// Quotes array
const quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Inspiration" }
];

// Helper: render quote
function renderQuote(text, category) {
  const display = document.getElementById("quoteDisplay");
  display.textContent = "";
  const p = document.createElement("p");
  p.textContent = `"${text}"`;
  const span = document.createElement("span");
  span.className = "category";
  span.textContent = ` — ${category}`;
  display.appendChild(p);
  display.appendChild(span);
}

// Required: displayRandomQuote
function displayRandomQuote() {
  if (!quotes.length) {
    document.getElementById("quoteDisplay").textContent = "No quotes available.";
    return;
  }
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const { text, category } = quotes[randomIndex];
  renderQuote(text, category);
}

// Required: addQuote
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (!text || !category) {
    alert("Please fill out both fields!");
    return;
  }

  quotes.push({ text, category });
  renderQuote(text, category);

  textInput.value = "";
  categoryInput.value = "";
}

// Event listener for Show New Quote button
document.getElementById("newQuote").addEventListener("click", displayRandomQuote);

// Expose functions globally for checker
window.quotes = quotes;
window.displayRandomQuote = displayRandomQuote;
window.addQuote = addQuote;
