let quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Inspiration" }
];


const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");


function showRandomQuote() {
  if (quotes.length === 0) {
    quoteDisplay.textContent = "No quotes available. Please add one.";
    return;
  }
  
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const { text, category } = quotes[randomIndex];
  
  quoteDisplay.innerHTML = `
    <p>"${text}"</p>
    <span class="category">— ${category}</span>
  `;
}


function addQuote() {
  const newText = document.getElementById("newQuoteText").value.trim();
  const newCategory = document.getElementById("newQuoteCategory").value.trim();

  if (!newText || !newCategory) {
    alert("Please fill out both fields!");
    return;
  }


  quotes.push({ text: newText, category: newCategory });

  
  quoteDisplay.innerHTML = `
    <p>"${newText}"</p>
    <span class="category">— ${newCategory}</span>
  `;

  
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}


newQuoteBtn.addEventListener("click", showRandomQuote);
document.getElementById("addQuoteBtn").addEventListener("click", addQuote);


showRandomQuote();
