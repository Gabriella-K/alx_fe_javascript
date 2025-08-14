// Configuration
const API_URL = 'https://jsonplaceholder.typicode.com/posts'; // Mock API
const SYNC_INTERVAL = 30000; // 30 seconds
const LAST_SYNC_KEY = 'lastSyncTimestamp';
const SERVER_QUOTES_KEY = 'serverQuotes';

// State
let quotes = [];
let serverQuotes = [];
let currentCategory = 'all';
let syncInterval;
let lastSyncTime = null;

// DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const categoryFilter = document.getElementById('categoryFilter');
const exportBtn = document.getElementById('exportQuotes');
const importFile = document.getElementById('importFile');
const syncNowBtn = document.getElementById('syncNow');
const syncStatus = document.getElementById('syncStatus');

// Initialize app
async function init() {
  loadQuotes();
  loadServerQuotes();
  setupEventListeners();
  createAddQuoteForm();
  populateCategories();
  restoreLastCategory();
  filterQuotes();
  startSyncInterval();
  await syncQuotes(); // Initial sync
}

// Core sync function with POST support
async function syncQuotes() {
  try {
    // 1. First push local changes to server using POST
    const localChanges = quotes.filter(q => q.source === 'local' && !q.synced);
    if (localChanges.length > 0) {
      await postQuotesToServer(localChanges);
      // Mark quotes as synced
      quotes.forEach(q => {
        if (q.source === 'local') q.synced = true;
      });
      saveQuotes();
    }

    // 2. Then fetch latest quotes from server
    const freshQuotes = await fetchQuotesFromServer();
    const newQuotes = findNewQuotes(freshQuotes);
    
    if (newQuotes.length > 0) {
      serverQuotes = freshQuotes;
      localStorage.setItem(SERVER_QUOTES_KEY, JSON.stringify(serverQuotes));
      
      const conflicts = mergeQuotes(newQuotes);
      updateUIAfterSync(newQuotes.length, conflicts);
    }
    
    updateSyncStatus(true);
    
  } catch (error) {
    console.error('Sync error:', error);
    updateSyncStatus(false);
  }
}

// POST quotes to server
async function postQuotesToServer(quotesToSend) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quotes: quotesToSend,
        timestamp: Date.now()
      })
    });
    
    if (!response.ok) {
      throw new Error('Server rejected our quotes');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to POST quotes:', error);
    throw error;
  }
}

// GET quotes from server
async function fetchQuotesFromServer() {
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await response.json();
  return data.slice(0, 5).map(post => ({
    id: `server-${post.id}`,
    text: post.title,
    category: 'server',
    source: 'server',
    timestamp: Date.now()
  }));
}

// Helper functions
function findNewQuotes(freshQuotes) {
  if (serverQuotes.length === 0) return freshQuotes;
  const latestServerTimestamp = Math.max(...serverQuotes.map(q => q.timestamp));
  return freshQuotes.filter(q => q.timestamp > latestServerTimestamp);
}

function mergeQuotes(newQuotes) {
  let conflictCount = 0;
  const quoteMap = new Map(quotes.map(q => [q.id, q]));

  newQuotes.forEach(serverQuote => {
    const localQuote = quoteMap.get(serverQuote.id);
    
    if (!localQuote) {
      quotes.push(serverQuote);
    } 
    else if (localQuote.source === 'local' && localQuote.text !== serverQuote.text) {
      Object.assign(localQuote, serverQuote);
      conflictCount++;
    }
  });

  saveQuotes();
  return conflictCount;
}

function updateUIAfterSync(newCount, conflictCount) {
  populateCategories();
  filterQuotes();
  
  if (newCount > 0) {
    showNotification(
      conflictCount > 0 
        ? `${newCount} new quotes (${conflictCount} conflicts resolved)`
        : `${newCount} new quotes added`,
      conflictCount > 0 ? 'warning' : 'success'
    );
  }
}

// UI Notification System
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <p>${message}</p>
    <button class="close-btn">&times;</button>
  `;
  
  document.body.appendChild(notification);
  
  notification.querySelector('.close-btn').addEventListener('click', () => {
    notification.remove();
  });
  
  setTimeout(() => notification.remove(), 5000);
}

// Periodic Sync Management
function startSyncInterval() {
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(() => syncQuotes(), SYNC_INTERVAL);
}

function updateSyncStatus(success) {
  lastSyncTime = Date.now();
  localStorage.setItem(LAST_SYNC_KEY, lastSyncTime.toString());
  
  syncStatus.textContent = success 
    ? `Last synced: ${new Date(lastSyncTime).toLocaleTimeString()}`
    : 'Sync failed - will retry';
  syncStatus.className = success ? 'sync-success' : 'sync-failed';
}

// Data Management
function loadQuotes() {
  const saved = localStorage.getItem('quotes');
  quotes = saved ? JSON.parse(saved) : getDefaultQuotes();
  saveQuotes();
}

function loadServerQuotes() {
  const saved = localStorage.getItem(SERVER_QUOTES_KEY);
  serverQuotes = saved ? JSON.parse(saved) : [];
}

function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

function getDefaultQuotes() {
  return [
    { id: '1', text: "The only way to do great work is to love what you do.", category: "inspiration", source: "local", synced: false, timestamp: Date.now() },
    { id: '2', text: "Innovation distinguishes between a leader and a follower.", category: "business", source: "local", synced: false, timestamp: Date.now() },
    { id: '3', text: "Your time is limited, don't waste it living someone else's life.", category: "life", source: "local", synced: false, timestamp: Date.now() },
    { id: '4', text: "Stay hungry, stay foolish.", category: "inspiration", source: "local", synced: false, timestamp: Date.now() },
    { id: '5', text: "The journey of a thousand miles begins with one step.", category: "life", source: "local", synced: false, timestamp: Date.now() }
  ];
}

// UI Functions
function setupEventListeners() {
  newQuoteBtn.addEventListener('click', showRandomQuote);
  categoryFilter.addEventListener('change', filterQuotes);
  exportBtn.addEventListener('click', exportToJsonFile);
  importFile.addEventListener('change', importFromJsonFile);
  syncNowBtn.addEventListener('click', syncQuotes);
}

function createAddQuoteForm() {
  const form = document.createElement('div');
  form.className = 'form-container';
  form.innerHTML = `
    <h3>Add New Quote</h3>
    <input id="newQuoteText" type="text" placeholder="Enter a new quote">
    <input id="newQuoteCategory" type="text" placeholder="Enter quote category">
    <button onclick="addQuote()">Add Quote</button>
  `;
  quoteDisplay.insertAdjacentElement('afterend', form);
}

function populateCategories() {
  while (categoryFilter.options.length > 1) {
    categoryFilter.remove(1);
  }
  
  [...new Set(quotes.map(q => q.category))]
    .sort()
    .forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      categoryFilter.appendChild(option);
    });
}

function restoreLastCategory() {
  const saved = localStorage.getItem('selectedCategory');
  if (saved) {
    currentCategory = saved;
    categoryFilter.value = saved;
  }
}

function filterQuotes() {
  currentCategory = categoryFilter.value;
  localStorage.setItem('selectedCategory', currentCategory);
  
  const filtered = currentCategory === 'all' 
    ? quotes 
    : quotes.filter(q => q.category === currentCategory);
  
  if (filtered.length === 0) {
    quoteDisplay.innerHTML = `<p>No quotes in this category</p>`;
  } else {
    const randomQuote = filtered[Math.floor(Math.random() * filtered.length)];
    displayQuote(randomQuote);
  }
}

function displayQuote(quote) {
  const sourceBadge = quote.source === 'server' 
    ? '<span class="server-badge">(from server)</span>' 
    : '';
    
  quoteDisplay.innerHTML = `
    <p>"${quote.text}"${sourceBadge}</p>
    <span class="category">${quote.category}</span>
  `;
}

function showRandomQuote() {
  filterQuotes();
}

// Data Operations
function addQuote() {
  const text = document.getElementById('newQuoteText').value.trim();
  const category = document.getElementById('newQuoteCategory').value.trim().toLowerCase();
  
  if (!text || !category) {
    showNotification('Please enter both text and category', 'error');
    return;
  }
  
  const newQuote = {
    id: `local-${Date.now()}`,
    text,
    category,
    source: 'local',
    synced: false,
    timestamp: Date.now()
  };
  
  quotes.push(newQuote);
  saveQuotes();
  
  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';
  
  if (![...categoryFilter.options].some(o => o.value === category)) {
    populateCategories();
  }
  
  currentCategory = category;
  categoryFilter.value = category;
  filterQuotes();
  syncQuotes();
}

function exportToJsonFile() {
  if (!quotes.length) {
    showNotification('No quotes to export', 'error');
    return;
  }
  
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error('Invalid format');
      
      const validated = data.map(q => ({
        id: q.id || `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: q.text || '',
        category: q.category || 'imported',
        source: 'imported',
        synced: false,
        timestamp: q.timestamp || Date.now()
      }));
      
      quotes = validated;
      saveQuotes();
      populateCategories();
      filterQuotes();
      showNotification(`${validated.length} quotes imported`, 'success');
      syncQuotes();
      
    } catch (error) {
      showNotification('Import failed: ' + error.message, 'error');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

// Initialize
document.addEventListener('DOMContentLoaded', init);