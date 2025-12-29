// Popup Script - Main UI Logic

let dictionary = [];
let filteredDictionary = [];

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadDictionary();
  setupEventListeners();
  renderWords();
  updateStats();
});

// Load dictionary from storage
async function loadDictionary() {
  const result = await chrome.storage.local.get(['dictionary']);
  dictionary = result.dictionary || [];
  filteredDictionary = [...dictionary];
}

// Setup event listeners
function setupEventListeners() {
  // Search input
  document.getElementById('searchInput').addEventListener('input', handleSearch);
  
  // Filter select
  document.getElementById('filterSelect').addEventListener('change', handleFilter);
  
  // Export button
  document.getElementById('exportBtn').addEventListener('click', handleExport);
  
  // Export as text button
  document.getElementById('exportTextBtn').addEventListener('click', handleExportAsText);
  
  // Study mode button
  document.getElementById('studyBtn').addEventListener('click', startStudyMode);
  
  // Settings button
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Stats button
  document.getElementById('statsBtn').addEventListener('click', showStatistics);
  
  // Modal close buttons
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('closeStatsModal').addEventListener('click', closeStatsModal);
  document.getElementById('closeStudyModal').addEventListener('click', closeStudyModal);
  
  // Study mode buttons
  document.getElementById('revealAnswer').addEventListener('click', revealFlashcard);
  document.getElementById('nextCard').addEventListener('click', showNextFlashcard);
  document.getElementById('markReviewed').addEventListener('click', markStudiedWordAsReviewed);
  
  // Close modal on outside click
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('wordModal');
    const statsModal = document.getElementById('statsModal');
    const studyModal = document.getElementById('studyModal');
    if (e.target === modal) closeModal();
    if (e.target === statsModal) closeStatsModal();
    if (e.target === studyModal) closeStudyModal();
  });

  // Listen for storage changes (when words are added from other tabs)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.dictionary) {
      loadDictionary().then(() => {
        handleFilter();
        updateStats();
      });
    }
  });
}

// Handle search
function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  applyFilters(query);
}

// Handle filter
function handleFilter(e) {
  const filter = e?.target?.value || document.getElementById('filterSelect').value;
  const query = document.getElementById('searchInput').value.toLowerCase();
  applyFilters(query, filter);
}

// Apply filters
function applyFilters(query = '', filter = 'all') {
  filteredDictionary = dictionary.filter(entry => {
    // Text search
    const matchesSearch = entry.word.toLowerCase().includes(query) ||
                         entry.meaning.toLowerCase().includes(query);
    
    if (!matchesSearch) return false;
    
    // Filter by category
    switch(filter) {
      case 'unreviewed':
        return !entry.reviewed;
      case 'reviewed':
        return entry.reviewed;
      case 'easy':
        return entry.difficulty === 'easy';
      case 'medium':
        return entry.difficulty === 'medium';
      case 'hard':
        return entry.difficulty === 'hard';
      default:
        return true;
    }
  });
  
  renderWords();
}

// Render words
function renderWords() {
  const container = document.getElementById('wordsContainer');
  
  if (!container) return; // Safety check
  
  if (filteredDictionary.length === 0) {
    // Show empty state
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
      emptyState.style.display = 'block';
    }
    // Clear other content but keep empty state
    const existingCards = container.querySelectorAll('.word-card');
    existingCards.forEach(card => card.remove());
    return;
  }
  
  // Hide empty state first (before clearing)
  const emptyState = document.getElementById('emptyState');
  if (emptyState) {
    emptyState.style.display = 'none';
  }
  
  // Clear container
  container.innerHTML = '';
  
  // Sort by date (newest first)
  const sorted = [...filteredDictionary].sort((a, b) => 
    new Date(b.addedDate) - new Date(a.addedDate)
  );
  
  sorted.forEach(entry => {
    const card = createWordCard(entry);
    container.appendChild(card);
  });
}

// Create word card
function createWordCard(entry) {
  const card = document.createElement('div');
  card.className = 'word-card';
  
  card.innerHTML = `
    <div class="word-header">
      <div class="word-title">
        <div class="word-name">${escapeHtml(entry.word)}</div>
        ${entry.phonetic ? `<div class="word-phonetic">
          ${escapeHtml(entry.phonetic)}
          <button class="pronounce-btn" data-word="${escapeHtml(entry.word)}" title="Pronounce">🔊</button>
        </div>` : ''}
      </div>
      <div class="word-badges">
        ${entry.partOfSpeech ? `<span class="badge badge-pos">${escapeHtml(entry.partOfSpeech)}</span>` : ''}
        <span class="badge badge-difficulty">${escapeHtml(entry.difficulty)}</span>
        ${entry.reviewed ? '<span class="badge badge-reviewed">Reviewed</span>' : ''}
      </div>
    </div>
    <div class="word-meaning">${escapeHtml(entry.meaning)}</div>
    ${entry.example ? `<div class="word-example">"${escapeHtml(entry.example)}"</div>` : ''}
    <div class="word-actions">
      <button class="action-btn btn-review" data-word="${escapeHtml(entry.word)}" data-action="review">
        ${entry.reviewed ? '✓ Reviewed' : 'Mark as Reviewed'}
      </button>
      <button class="action-btn btn-edit" data-word="${escapeHtml(entry.word)}" data-action="edit">Edit</button>
      <button class="action-btn btn-delete" data-word="${escapeHtml(entry.word)}" data-action="delete">Delete</button>
    </div>
  `;
  
  // Add click handlers
  card.querySelector('.word-name').addEventListener('click', () => showWordDetail(entry));
  
  // Add pronunciation button handler
  const pronounceBtn = card.querySelector('.pronounce-btn');
  if (pronounceBtn) {
    pronounceBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pronounceWord(entry.word);
    });
  }
  
  card.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const word = btn.dataset.word;
      
      if (action === 'review') {
        toggleReview(word);
      } else if (action === 'delete') {
        deleteWord(word);
      } else if (action === 'edit') {
        editWord(entry);
      }
    });
  });
  
  return card;
}

// Show word detail modal
function showWordDetail(entry) {
  const modal = document.getElementById('wordModal');
  const body = document.getElementById('modalBody');
  
  body.innerHTML = `
    <div class="modal-word-detail">
      <div class="modal-word-title">${escapeHtml(entry.word)}</div>
      ${entry.phonetic ? `<div class="modal-word-phonetic">${escapeHtml(entry.phonetic)}</div>` : ''}
      
      <div class="modal-section">
        <h3>Definition</h3>
        <p>${escapeHtml(entry.meaning)}</p>
      </div>
      
      ${entry.partOfSpeech ? `
        <div class="modal-section">
          <h3>Part of Speech</h3>
          <p>${escapeHtml(entry.partOfSpeech)}</p>
        </div>
      ` : ''}
      
      ${entry.example ? `
        <div class="modal-section">
          <h3>Example</h3>
          <p>"${escapeHtml(entry.example)}"</p>
        </div>
      ` : ''}
      
      ${entry.synonyms && entry.synonyms.length > 0 ? `
        <div class="modal-section">
          <h3>Synonyms</h3>
          <div class="modal-synonyms">
            ${entry.synonyms.map(syn => `<span class="synonym-tag">${escapeHtml(syn)}</span>`).join('')}
          </div>
        </div>
      ` : ''}
      
      <div class="modal-section">
        <h3>Details</h3>
        <p><strong>Added:</strong> ${formatDate(entry.addedDate)}</p>
        <p><strong>Difficulty:</strong> ${escapeHtml(entry.difficulty)}</p>
        <p><strong>Category:</strong> ${escapeHtml(entry.category)}</p>
        <p><strong>Review Count:</strong> ${entry.reviewCount || 0}</p>
      </div>
    </div>
  `;
  
  modal.style.display = 'block';
}

// Close modal
function closeModal() {
  document.getElementById('wordModal').style.display = 'none';
}

// Close stats modal
function closeStatsModal() {
  document.getElementById('statsModal').style.display = 'none';
}

// Toggle review status
async function toggleReview(word) {
  const entry = dictionary.find(e => e.word === word);
  if (!entry) return;
  
  const updates = {
    reviewed: !entry.reviewed,
    reviewCount: (entry.reviewCount || 0) + 1
  };
  
  await chrome.runtime.sendMessage({
    action: 'updateWord',
    word: word,
    updates: updates
  });
  
  await loadDictionary();
  handleFilter();
  updateStats();
}

// Delete word
async function deleteWord(word) {
  if (!confirm(`Are you sure you want to delete "${word}"?`)) {
    return;
  }
  
  await chrome.runtime.sendMessage({
    action: 'deleteWord',
    word: word
  });
  
  await loadDictionary();
  handleFilter();
  updateStats();
}

// Edit word (simplified - opens options page)
function editWord(entry) {
  chrome.storage.local.set({ editingWord: entry }, () => {
    chrome.runtime.openOptionsPage();
  });
}

// Show statistics
async function showStatistics() {
  const result = await chrome.storage.local.get(['statistics', 'dictionary']);
  const stats = result.statistics || {};
  const dict = result.dictionary || [];
  
  // Calculate additional stats
  const difficultyCounts = {
    easy: dict.filter(w => w.difficulty === 'easy').length,
    medium: dict.filter(w => w.difficulty === 'medium').length,
    hard: dict.filter(w => w.difficulty === 'hard').length
  };
  
  const categoryCounts = {};
  dict.forEach(w => {
    categoryCounts[w.category] = (categoryCounts[w.category] || 0) + 1;
  });
  
  const content = document.getElementById('statsContent');
  content.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${stats.totalWords || 0}</div>
        <div class="stat-label">Total Words</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.wordsReviewed || 0}</div>
        <div class="stat-label">Reviewed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${difficultyCounts.easy}</div>
        <div class="stat-label">Easy</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${difficultyCounts.medium}</div>
        <div class="stat-label">Medium</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${difficultyCounts.hard}</div>
        <div class="stat-label">Hard</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${Object.keys(categoryCounts).length}</div>
        <div class="stat-label">Categories</div>
      </div>
    </div>
    ${stats.lastUpdated ? `<p style="margin-top: 20px; text-align: center; color: #666;">Last updated: ${formatDate(stats.lastUpdated)}</p>` : ''}
  `;
  
  document.getElementById('statsModal').style.display = 'block';
}

// Update stats bar
async function updateStats() {
  const result = await chrome.storage.local.get(['dictionary', 'statistics']);
  const dict = result.dictionary || [];
  const stats = result.statistics || {};
  
  document.getElementById('wordCount').textContent = `${dict.length} words`;
  document.getElementById('reviewedCount').textContent = `${stats.wordsReviewed || 0} reviewed`;
}

// Export dictionary
async function handleExport() {
  const result = await chrome.runtime.sendMessage({ action: 'exportDictionary' });
  
  if (result.success) {
    const dataStr = JSON.stringify(result.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dictionary-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

// Export dictionary as plain text
async function handleExportAsText() {
  const result = await chrome.runtime.sendMessage({ action: 'exportDictionaryAsText' });
  
  if (result.success && result.text) {
    const dataBlob = new Blob([result.text], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dictionary-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

// Start study mode (flashcards)
async function startStudyMode() {
  if (dictionary.length === 0) {
    alert('Your dictionary is empty! Add some words first.');
    return;
  }
  
  // Show study mode modal
  const modal = document.getElementById('studyModal');
  modal.style.display = 'block';
  
  await showNextFlashcard();
}

// Show next flashcard
async function showNextFlashcard() {
  // Reload dictionary to get latest data
  await loadDictionary();
  
  if (dictionary.length === 0) {
    alert('No words available for study!');
    closeStudyModal();
    return;
  }
  
  // Get random word (prefer unreviewed)
  const unreviewed = dictionary.filter(w => !w.reviewed);
  const wordsToChoose = unreviewed.length > 0 ? unreviewed : dictionary;
  const word = wordsToChoose[Math.floor(Math.random() * wordsToChoose.length)];
  
  const studyContent = document.getElementById('studyContent');
  const studyWord = document.getElementById('studyWord');
  const studyMeaning = document.getElementById('studyMeaning');
  const studyExample = document.getElementById('studyExample');
  
  studyWord.textContent = word.word;
  studyMeaning.textContent = '';
  studyExample.textContent = '';
  studyMeaning.style.display = 'none';
  studyExample.style.display = 'none';
  
  // Store current word for review action
  studyContent.dataset.currentWord = word.word;
}

// Reveal flashcard answer
function revealFlashcard() {
  const studyContent = document.getElementById('studyContent');
  const wordText = studyContent.dataset.currentWord;
  const word = dictionary.find(w => w.word === wordText);
  
  if (word) {
    const studyMeaning = document.getElementById('studyMeaning');
    const studyExample = document.getElementById('studyExample');
    
    studyMeaning.textContent = word.meaning;
    studyMeaning.style.display = 'block';
    
    if (word.example) {
      studyExample.textContent = `Example: "${word.example}"`;
      studyExample.style.display = 'block';
    }
  }
}

// Close study modal
function closeStudyModal() {
  document.getElementById('studyModal').style.display = 'none';
}

// Mark word as reviewed from study mode
async function markStudiedWordAsReviewed() {
  const studyContent = document.getElementById('studyContent');
  const wordText = studyContent.dataset.currentWord;
  
  if (wordText) {
    await toggleReview(wordText);
    await showNextFlashcard();
  }
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Pronounce word using Web Speech API
function pronounceWord(word) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  } else {
    alert('Speech synthesis is not supported in your browser.');
  }
}

