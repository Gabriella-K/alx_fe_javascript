
let quotes = [
  { text: "The only way to do great work is to love what you do.", category: "inspiration" },
  { text: "Innovation distinguishes between a leader and a follower.", category: "business" },
  { text: "Your time is limited, don't waste it living someone else's life.", category: "life" },
  { text: "Stay hungry, stay foolish.", category: "inspiration" },
  { text: "The journey of a thousand miles begins with one step.", category: "life" }
];


const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const categoryFilter = document.getElementById('categoryFilter');
let currentCategory = 'all';


function init() {

  newQuoteBtn.addEventListener('click', showRandomQuote);
  categoryFilter.addEventListener('change', function() {
    currentCategory = this.value;
    showRandomQuote();
  });
  
  
  createAddQuoteForm();
  

  updateCategoryFilter();
  
  
  showRandomQuote();
}


function showRandomQuote() {
  let filteredQuotes = currentCategory === 'all' 
    ? quotes 
    : quotes.filter(quote => quote.category === currentCategory);
  
  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = `<p>No quotes found in this category. Add some!</p>`;
    return;
  }
  
  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];
  
  quoteDisplay.innerHTML = `
    <p>"${quote.text}"</p>
    <span class="category">${quote.category}</span>
  `;
}


function createAddQuoteForm() {
  const formContainer = document.createElement('div');
  formContainer.className = 'form-container';
  
  const heading = document.createElement('h3');
  heading.textContent = 'Add New Quote';
  
  const quoteInput = document.createElement('input');
  quoteInput.id = 'newQuoteText';
  quoteInput.type = 'text';
  quoteInput.placeholder = 'Enter a new quote';
  
  const categoryInput = document.createElement('input');
  categoryInput.id = 'newQuoteCategory';
  categoryInput.type = 'text';
  categoryInput.placeholder = 'Enter quote category';
  
  const addButton = document.createElement('button');
  addButton.textContent = 'Add Quote';
  addButton.onclick = addQuote;
  
  formContainer.appendChild(heading);
  formContainer.appendChild(quoteInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addButton);
  
  
  quoteDisplay.insertAdjacentElement('afterend', formContainer);
}


function addQuote() {
  const textInput = document.getElementById('newQuoteText');
  const categoryInput = document.getElementById('newQuoteCategory');
  
  const text = textInput.value.trim();
  const category = categoryInput.value.trim().toLowerCase();
  
  if (!text || !category) {
    alert('Please enter both quote text and category');
    return;
  }
  
  
  quotes.push({ text, category });
  
  
  textInput.value = '';
  categoryInput.value = '';
  
  
  updateCategoryFilter(category);
  
  
  currentCategory = category;
  categoryFilter.value = category;
  showRandomQuote();
}


function updateCategoryFilter(newCategory = null) {
  
  const categories = [...new Set(quotes.map(quote => quote.category))];
  
  
  if (newCategory && !categories.includes(newCategory)) {
    categories.push(newCategory);
  }
  
  
  while (categoryFilter.options.length > 1) {
    categoryFilter.remove(1);
  }
  
  
  categories.sort().forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}


document.addEventListener('DOMContentLoaded', init);