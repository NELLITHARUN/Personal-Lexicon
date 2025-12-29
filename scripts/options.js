// Options Page Script

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await checkEditMode();
  setupEventListeners();
});

// Load settings
async function loadSettings() {
  const result = await chrome.storage.local.get(['settings']);
  const settings = result.settings || {
    autoFetchMeaning: true,
    showNotifications: true,
    dailyReminder: false,
    reminderTime: '09:00'
  };
  
  document.getElementById('autoFetchMeaning').checked = settings.autoFetchMeaning;
  document.getElementById('showNotifications').checked = settings.showNotifications;
  document.getElementById('dailyReminder').checked = settings.dailyReminder || false;
  document.getElementById('reminderTime').value = settings.reminderTime || '09:00';
}

// Check if editing a word
async function checkEditMode() {
  const result = await chrome.storage.local.get(['editingWord']);
  if (result.editingWord) {
    showEditSection(result.editingWord);
    await chrome.storage.local.remove(['editingWord']);
  }
}

// Show edit section
function showEditSection(word) {
  const section = document.getElementById('editWordSection');
  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth' });
  
  document.getElementById('editWord').value = word.word;
  document.getElementById('editMeaning').value = word.meaning || '';
  document.getElementById('editPhonetic').value = word.phonetic || '';
  document.getElementById('editPartOfSpeech').value = word.partOfSpeech || '';
  document.getElementById('editExample').value = word.example || '';
  document.getElementById('editDifficulty').value = word.difficulty || 'medium';
  document.getElementById('editCategory').value = word.category || 'general';
}

// Setup event listeners
function setupEventListeners() {
  // Settings checkboxes
  document.getElementById('autoFetchMeaning').addEventListener('change', saveSettings);
  document.getElementById('showNotifications').addEventListener('change', saveSettings);
  document.getElementById('dailyReminder').addEventListener('change', (e) => {
    document.getElementById('reminderTimeContainer').style.display = e.target.checked ? 'block' : 'none';
    saveSettings();
  });
  document.getElementById('reminderTime').addEventListener('change', saveSettings);
  
  // Show/hide reminder time based on checkbox
  document.getElementById('dailyReminder').addEventListener('change', (e) => {
    document.getElementById('reminderTimeContainer').style.display = e.target.checked ? 'block' : 'none';
  });
  
  // Initialize reminder time visibility
  if (document.getElementById('dailyReminder').checked) {
    document.getElementById('reminderTimeContainer').style.display = 'block';
  }
  
  // Edit word form
  document.getElementById('editWordForm').addEventListener('submit', handleEditWord);
  document.getElementById('cancelEdit').addEventListener('click', () => {
    document.getElementById('editWordSection').style.display = 'none';
  });
  
  // Export button
  document.getElementById('exportBtn').addEventListener('click', handleExport);
  
  // Import button
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', handleImport);
  
  // Clear button
  document.getElementById('clearBtn').addEventListener('click', handleClear);
}

// Save settings
async function saveSettings() {
  const settings = {
    autoFetchMeaning: document.getElementById('autoFetchMeaning').checked,
    showNotifications: document.getElementById('showNotifications').checked,
    dailyReminder: document.getElementById('dailyReminder').checked,
    reminderTime: document.getElementById('reminderTime').value
  };
  
  await chrome.storage.local.set({ settings });
  
  // Notify background script to update alarms
  chrome.runtime.sendMessage({ action: 'updateReminderSettings' });
}

// Handle edit word
async function handleEditWord(e) {
  e.preventDefault();
  
  const word = document.getElementById('editWord').value;
  const updates = {
    meaning: document.getElementById('editMeaning').value,
    phonetic: document.getElementById('editPhonetic').value,
    partOfSpeech: document.getElementById('editPartOfSpeech').value,
    example: document.getElementById('editExample').value,
    difficulty: document.getElementById('editDifficulty').value,
    category: document.getElementById('editCategory').value
  };
  
  await chrome.runtime.sendMessage({
    action: 'updateWord',
    word: word,
    updates: updates
  });
  
  alert('Word updated successfully!');
  document.getElementById('editWordSection').style.display = 'none';
  document.getElementById('editWordForm').reset();
}

// Handle export
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

// Handle import
async function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const importedData = JSON.parse(event.target.result);
      
      if (!Array.isArray(importedData)) {
        throw new Error('Invalid file format');
      }
      
      // Get current dictionary
      const result = await chrome.storage.local.get(['dictionary']);
      const currentDict = result.dictionary || [];
      
      // Merge dictionaries (avoid duplicates)
      const wordSet = new Set(currentDict.map(w => w.word.toLowerCase()));
      const newWords = importedData.filter(w => !wordSet.has(w.word.toLowerCase()));
      
      const mergedDict = [...currentDict, ...newWords];
      
      await chrome.storage.local.set({ dictionary: mergedDict });
      
      alert(`Imported ${newWords.length} new words! ${importedData.length - newWords.length} duplicates were skipped.`);
      
      // Reset file input
      e.target.value = '';
    } catch (error) {
      alert('Error importing file: ' + error.message);
    }
  };
  
  reader.readAsText(file);
}

// Handle clear
async function handleClear() {
  if (!confirm('Are you sure you want to clear all words? This action cannot be undone!')) {
    return;
  }
  
  if (!confirm('This will delete ALL words in your dictionary. Are you absolutely sure?')) {
    return;
  }
  
  await chrome.storage.local.set({ dictionary: [] });
  await chrome.storage.local.set({ statistics: { totalWords: 0, wordsReviewed: 0, lastUpdated: new Date().toISOString() } });
  
  alert('All words have been cleared.');
}

