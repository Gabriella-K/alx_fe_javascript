
let quotes = [];


const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const categoryFilter = document.getElementById('categoryFilter');
const exportBtn = document.getElementById('exportQuotes');
const importFile = document.getElementById('importFile');
let currentCategory = 'all';


function init() {
  
  loadQuotes();
  
  
  newQuoteBtn.addEventListener('click', showRandomQuote);
  categoryFilter.addEventListener('change', function() {
    currentCategory = this.value;
    
    sessionStorage.setItem('lastCategory', currentCategory);
    showRandomQuote();
  });
  
  exportBtn.addEventListener('click', exportToJsonFile);
  importFile.addEventListener('change', importFromJsonFile);
  
  
  createAddQuoteForm();
  
  
  updateCategoryFilter();
  

  showRandomQuote();
  
  
  const lastCategory = sessionStorage.getItem('lastCategory');
  if (lastCategory) {
    currentCategory = lastCategory;
    categoryFilter.value = lastCategory;
  }
}


function loadQuotes() {
  const savedQuotes = localStorage.getItem('quotes');
  if (savedQuotes) {
    quotes = JSON.parse(savedQuotes);
  } else {
    
    quotes = [
      { text: "The only way to do great work is to love what you do.", category: "inspiration" },
      { text: "Innovation distinguishes between a leader and a follower.", category: "business" },
      { text: "Your time is limited, don't waste it living someone else's life.", category: "life" },
      { text: "Stay hungry, stay foolish.", category: "inspiration" },
      { text: "The journey of a thousand miles begins with one step.", category: "life" }
    ];
    saveQuotes();
  }
}


function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
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
  
  
  sessionStorage.setItem('lastQuote', JSON.stringify(quote));
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
  
  
  saveQuotes();
  
  
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


function exportToJsonFile() {
  if (quotes.length === 0) {
    alert('No quotes to export!');
    return;
  }
  
  const dataStr = JSON.stringify(quotes, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  
  const exportFileDefaultName = 'quotes.json';
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}
function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const fileReader = new FileReader();
  
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      
      if (!Array.isArray(importedQuotes)) {
        throw new Error('Imported data is not an array');
      }
      
      for (const quote of importedQuotes) {
        if (!quote.text || !quote.category) {
          throw new Error('Invalid quote format - each quote must have text and category');
        }
      }
      
      
      quotes = importedQuotes;
      saveQuotes();
      updateCategoryFilter();
      showRandomQuote();
      
      
      event.target.value = '';
      
      alert(`Successfully imported ${importedQuotes.length} quotes!`);
    } catch (error) {
      alert('Error importing quotes: ' + error.message);
    }
  };
  
  fileReader.onerror = function() {
    alert('Error reading file');
  };
  
  fileReader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', init);