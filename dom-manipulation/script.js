// Configuration
const API_URL = 'https://jsonplaceholder.typicode.com/posts'; // Using JSONPlaceholder as mock API
const SYNC_INTERVAL = 30000; // 30 seconds
const LAST_SYNC_KEY = 'lastSyncTimestamp';
const SERVER_QUOTES_KEY = 'serverQuotes';

// Quotes database - will be loaded from localStorage
let quotes = [];
let serverQuotes = [];
let currentCategory = 'all';
let syncInterval;
let lastSyncTime = null;

// DOM elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const categoryFilter = document.getElementById('categoryFilter');
const exportBtn = document.getElementById('exportQuotes');
const importFile = document.getElementById('importFile');
const syncNowBtn = document.getElementById('syncNow');
const syncStatus = document.getElementById('syncStatus');

// Initialize the app
async function init() {
  // Load quotes from localStorage
  loadQuotes();
  
  // Load server quotes from localStorage
  const savedServerQuotes = localStorage.getItem(SERVER_QUOTES_KEY);
  if (savedServerQuotes) {
    serverQuotes = JSON.parse(savedServerQuotes);
  }
  
  // Load last sync time
  lastSyncTime = localStorage.getItem(LAST_SYNC_KEY);
  updateSyncStatus();
  
  // Set up event listeners
  newQuoteBtn.addEventListener('click', showRandomQuote);
  categoryFilter.addEventListener('change', filterQuotes);
  exportBtn.addEventListener('click', exportToJsonFile);
  importFile.addEventListener('change', importFromJsonFile);
  syncNowBtn.addEventListener('click', syncWithServer);
  
  // Create and add the quote form dynamically
  createAddQuoteForm();
  
  // Populate category filter
  populateCategories();
  
  // Load last selected category from localStorage
  const savedCategory = localStorage.getItem('selectedCategory');
  if (savedCategory) {
    currentCategory = savedCategory;
    categoryFilter.value = savedCategory;
  }
  
  // Show initial quote
  filterQuotes();
  
  // Start periodic sync
  startSyncInterval();
  
  // Initial sync
  await syncWithServer();
}

// Fetch quotes from server
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const serverData = await response.json();
    
    // Transform mock API data to our quote format
    return serverData.slice(0, 5).map((post, index) => ({
      id: `server-${post.id}`,
      text: post.title,
      category: 'server',
      source: 'server',
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Failed to fetch quotes from server:', error);
    return [];
  }
}

// Send quotes to server
async function postQuotesToServer(quotesToSend) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(quotesToSend)
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to post quotes to server:', error);
    return null;
  }
}

// Start periodic sync with server
function startSyncInterval() {
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(syncWithServer, SYNC_INTERVAL);
}

// Update sync status display
function updateSyncStatus() {
  if (lastSyncTime) {
    const lastSyncDate = new Date(parseInt(lastSyncTime));
    syncStatus.textContent = `Last synced: ${lastSyncDate.toLocaleTimeString()}`;
  } else {
    syncStatus.textContent = 'Last synced: Never';
  }
}

// Sync with server
async function syncWithServer() {
  try {
    // First fetch latest quotes from server
    const newServerQuotes = await fetchQuotesFromServer();
    
    // Then send our local quotes to server
    const localQuotesToSend = quotes.filter(q => q.source === 'local');
    if (localQuotesToSend.length > 0) {
      await postQuotesToServer(localQuotesToSend);
    }
    
    // Store server quotes
    serverQuotes = newServerQuotes;
    localStorage.setItem(SERVER_QUOTES_KEY, JSON.stringify(serverQuotes));
    
    // Merge with local quotes
    mergeQuotes();
    
    // Update last sync time
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

// Merge server quotes with local quotes
function mergeQuotes() {
  // Create a map of all existing quotes by ID for quick lookup
  const quoteMap = new Map();
  quotes.forEach(quote => quoteMap.set(quote.id, quote));
  
  // Add or update quotes from server
  let hasConflicts = false;
  serverQuotes.forEach(serverQuote => {
    const existingQuote = quoteMap.get(serverQuote.id);
    
    if (!existingQuote) {
      // New quote from server - add it
      quotes.push(serverQuote);
    } else if (existingQuote.source === 'local' && 
               existingQuote.text !== serverQuote.text) {
      // Conflict detected - server version wins
      hasConflicts = true;
      Object.assign(existingQuote, serverQuote);
    }
  });
  
  // Save merged quotes
  saveQuotes();
  
  // Update UI if needed
  if (hasConflicts) {
    showConflictNotification();
  }
  
  // Refresh category list and display
  populateCategories();
  filterQuotes();
}

// Show conflict notification
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
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 10000);
}

// Load quotes from localStorage
function loadQuotes() {
  const savedQuotes = localStorage.getItem('quotes');
  if (savedQuotes) {
    quotes = JSON.parse(savedQuotes);
  } else {
    // Default quotes if nothing in storage
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

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Populate category dropdown with unique categories
function populateCategories() {
  // Clear existing options (except "All Categories")
  while (categoryFilter.options.length > 1) {
    categoryFilter.remove(1);
  }
  
  // Get all unique categories
  const categories = [...new Set(quotes.map(quote => quote.category))];
  
  // Add categories to dropdown
  categories.sort().forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

// Filter quotes based on selected category
function filterQuotes() {
  currentCategory = categoryFilter.value;
  
  // Save selected category to localStorage
  localStorage.setItem('selectedCategory', currentCategory);
  
  // Get filtered quotes
  const filteredQuotes = currentCategory === 'all' 
    ? quotes 
    : quotes.filter(quote => quote.category === currentCategory);
  
  // Display results
  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = `<p>No quotes found in this category. Add some!</p>`;
  } else {
    // Show a random quote from filtered list
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const quote = filteredQuotes[randomIndex];
    const sourceBadge = quote.source === 'server' ? ' <span style="color:blue">(from server)</span>' : '';
    quoteDisplay.innerHTML = `
      <p>"${quote.text}"${sourceBadge}</p>
      <span class="category">${quote.category}</span>
    `;
  }
}

// Show a random quote (from filtered list)
function showRandomQuote() {
  filterQuotes();
}

// Create the add quote form dynamically
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
  
  // Insert the form after the quote display section
  quoteDisplay.insertAdjacentElement('afterend', formContainer);
}

// Add a new quote
function addQuote() {
  const textInput = document.getElementById('newQuoteText');
  const categoryInput = document.getElementById('newQuoteCategory');
  
  const text = textInput.value.trim();
  const category = categoryInput.value.trim().toLowerCase();
  
  if (!text || !category) {
    alert('Please enter both quote text and category');
    return;
  }
  
  // Add new quote with metadata
  const newQuote = {
    id: `local-${Date.now()}`,
    text,
    category,
    source: 'local',
    timestamp: Date.now()
  };
  
  quotes.push(newQuote);
  
  // Save to localStorage
  saveQuotes();
  
  // Clear inputs
  textInput.value = '';
  categoryInput.value = '';
  
  // Update categories if this is a new one
  const categories = [...new Set(quotes.map(quote => quote.category))];
  if (!Array.from(categoryFilter.options).some(opt => opt.value === category)) {
    populateCategories();
  }
  
  // Set the new category as selected
  currentCategory = category;
  categoryFilter.value = category;
  filterQuotes();
  
  // Sync with server
  syncWithServer();
}

// Export quotes to JSON file using Blob API
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
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

// Import quotes from JSON file
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
      
      // Validate each quote has text and category
      for (const quote of importedQuotes) {
        if (!quote.text || !quote.category) {
          throw new Error('Invalid quote format - each quote must have text and category');
        }
        
        // Add metadata if missing
        if (!quote.id) quote.id = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        if (!quote.source) quote.source = 'imported';
        if (!quote.timestamp) quote.timestamp = Date.now();
      }
      
      // Replace current quotes with imported ones
      quotes = importedQuotes;
      saveQuotes();
      populateCategories();
      filterQuotes();
      
      // Reset file input
      event.target.value = '';
      
      alert(`Successfully imported ${importedQuotes.length} quotes!`);
      
      // Sync with server
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

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);