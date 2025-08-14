
const API_URL = 'https://jsonplaceholder.typicode.com/posts'; 
const SYNC_INTERVAL = 30000;
const LAST_SYNC_KEY = 'lastSyncTimestamp';
const SERVER_QUOTES_KEY = 'serverQuotes'
let quotes = [];
let serverQuotes = [];
let currentCategory = 'all';
let syncInterval;
let lastSyncTime = null;


const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const categoryFilter = document.getElementById('categoryFilter');
const exportBtn = document.getElementById('exportQuotes');
const importFile = document.getElementById('importFile');
const syncNowBtn = document.getElementById('syncNow');
const syncStatus = document.getElementById('syncStatus');


async function init() {
  
  loadQuotes();
  
  
  const savedServerQuotes = localStorage.getItem(SERVER_QUOTES_KEY);
  if (savedServerQuotes) {
    serverQuotes = JSON.parse(savedServerQuotes);
  }
  
  
  lastSyncTime = localStorage.getItem(LAST_SYNC_KEY);
  updateSyncStatus();
  

  newQuoteBtn.addEventListener('click', showRandomQuote);
  categoryFilter.addEventListener('change', filterQuotes);
  exportBtn.addEventListener('click', exportToJsonFile);
  importFile.addEventListener('change', importFromJsonFile);
  syncNowBtn.addEventListener('click', syncWithServer);
  
  
  createAddQuoteForm();
  
  
  populateCategories();
  
  
  const savedCategory = localStorage.getItem('selectedCategory');
  if (savedCategory) {
    currentCategory = savedCategory;
    categoryFilter.value = savedCategory;
  }
  
  
  filterQuotes();
  
  
  startSyncInterval();
  
  
  await syncWithServer();
}


function startSyncInterval() {
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(syncWithServer, SYNC_INTERVAL);
}


function updateSyncStatus() {
  if (lastSyncTime) {
    const lastSyncDate = new Date(parseInt(lastSyncTime));
    syncStatus.textContent = `Last synced: ${lastSyncDate.toLocaleTimeString()}`;
  } else {
    syncStatus.textContent = 'Last synced: Never';
  }
}


async function syncWithServer() {
  try {
    
    const response = await fetch(API_URL);
    const serverData = await response.json();
    
    
    const newServerQuotes = serverData.slice(0, 5).map((post, index) => ({
      id: `server-${post.id}`,
      text: post.title,
      category: 'server',
      source: 'server',
      timestamp: Date.now()
    }));
    
    
    serverQuotes = newServerQuotes;
    localStorage.setItem(SERVER_QUOTES_KEY, JSON.stringify(serverQuotes));
    
    
    mergeQuotes();
    
    
    lastSyncTime = Date.now();
    localStorage.setItem(LAST_SYNC_KEY, lastSyncTime.toString());
    updateSyncStatus();
    
    return true;
  } catch (error) {
    console.error('Sync failed:', error);
    syncStatus.textContent = 'Sync failed';
    return false;
  }
}


function mergeQuotes() {
  
  const quoteMap = new Map();
  quotes.forEach(quote => quoteMap.set(quote.id, quote));
  
  
  let hasConflicts = false;
  serverQuotes.forEach(serverQuote => {
    const existingQuote = quoteMap.get(serverQuote.id);
    
    if (!existingQuote) {
      
      quotes.push(serverQuote);
    } else if (existingQuote.source === 'local' && 
               existingQuote.text !== serverQuote.text) {
      
      hasConflicts = true;
      Object.assign(existingQuote, serverQuote);
    }
  });
  
  
  saveQuotes();
  
  
  if (hasConflicts) {
    showConflictNotification();
  }
  
  
  populateCategories();
  filterQuotes();
}


function showConflictNotification() {
  const notification = document.createElement('div');
  notification.className = 'conflict-notification';
  notification.innerHTML = `
    <p>Some of your local quotes were updated by the server.</p>
    <div class="conflict-actions">
      <button onclick="this.parentElement.parentElement.remove()">Dismiss</button>
      <button onclick="location.reload()">Refresh</button>
    </div>
  `;
  document.body.appendChild(notification);
  
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 10000);
}


function loadQuotes() {
  const savedQuotes = localStorage.getItem('quotes');
  if (savedQuotes) {
    quotes = JSON.parse(savedQuotes);
  } else {
    
    quotes = [
      { id: '1', text: "The only way to do great work is to love what you do.", category: "inspiration", source: "local", timestamp: Date.now() },
      { id: '2', text: "Innovation distinguishes between a leader and a follower.", category: "business", source: "local", timestamp: Date.now() },
      { id: '3', text: "Your time is limited, don't waste it living someone else's life.", category: "life", source: "local", timestamp: Date.now() },
      { id: '4', text: "Stay hungry, stay foolish.", category: "inspiration", source: "local", timestamp: Date.now() },
      { id: '5', text: "The journey of a thousand miles begins with one step.", category: "life", source: "local", timestamp: Date.now() }
    ];
    saveQuotes();
  }
}


function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}


function populateCategories() {
  
  while (categoryFilter.options.length > 1) {
    categoryFilter.remove(1);
  }
  
  
  const categories = [...new Set(quotes.map(quote => quote.category))];
  
  
  categories.sort().forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

function filterQuotes() {
  currentCategory = categoryFilter.value;
  

  localStorage.setItem('selectedCategory', currentCategory);
  
  
  const filteredQuotes = currentCategory === 'all' 
    ? quotes 
    : quotes.filter(quote => quote.category === currentCategory);
  
  
  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = `<p>No quotes found in this category. Add some!</p>`;
  } else {
    
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const quote = filteredQuotes[randomIndex];
    const sourceBadge = quote.source === 'server' ? ' <span style="color:blue">(from server)</span>' : '';
    quoteDisplay.innerHTML = `
      <p>"${quote.text}"${sourceBadge}</p>
      <span class="category">${quote.category}</span>
    `;
  }
}


function showRandomQuote() {
  filterQuotes();
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
  
  
  const newQuote = {
    id: `local-${Date.now()}`,
    text,
    category,
    source: 'local',
    timestamp: Date.now()
  };
  
  quotes.push(newQuote);
  
  
  saveQuotes();
  
  
  textInput.value = '';
  categoryInput.value = '';
  
  
  const categories = [...new Set(quotes.map(quote => quote.category))];
  if (!Array.from(categoryFilter.options).some(opt => opt.value === category)) {
    populateCategories();
  }
  
  
  currentCategory = category;
  categoryFilter.value = category;
  filterQuotes();
  

  syncWithServer();
}


function exportToJsonFile() {
  if (quotes.length === 0) {
    alert('No quotes to export!');
    return;
  }
  
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  document.body.appendChild(a);
  a.click();
  
  
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
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
        
        
        if (!quote.id) quote.id = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        if (!quote.source) quote.source = 'imported';
        if (!quote.timestamp) quote.timestamp = Date.now();
      }
      
      
      quotes = importedQuotes;
      saveQuotes();
      populateCategories();
      filterQuotes();
      
      
      event.target.value = '';
      
      alert(`Successfully imported ${importedQuotes.length} quotes!`);
      
      
      syncWithServer();
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