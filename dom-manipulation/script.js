
const quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Inspiration" }
];


function renderQuote(targetEl, text, category) {
  targetEl.textContent = "";                           
  const p = document.createElement("p");
  p.textContent = `"${text}"`;
  const span = document.createElement("span");
  span.className = "category";
  span.textContent = ` — ${category}`;
  targetEl.appendChild(p);
  targetEl.appendChild(span);
}


function showRandomQuote() {
  const box = document.getElementById("quoteDisplay");
  if (!quotes.length) {
    box.textContent = "No quotes available. Please add one.";
    return;
  }
  const { text, category } = quotes[Math.floor(Math.random() * quotes.length)];
  renderQuote(box, text, category);
}


function addQuote() {
  const textEl = document.getElementById("newQuoteText");
  const catEl  = document.getElementById("newQuoteCategory");
  const text = textEl.value.trim();
  const category = catEl.value.trim();

  if (!text || !category) {
    alert("Please fill out both fields!");
    return;
  }

  
  quotes.push({ text, category });

  
  renderQuote(document.getElementById("quoteDisplay"), text, category);


  textEl.value = "";
  catEl.value = "";
}


document.getElementById("newQuote").addEventListener("click", showRandomQuote);


window.quotes = quotes;
window.showRandomQuote = showRandomQuote;
window.addQuote = addQuote;


showRandomQuote();
