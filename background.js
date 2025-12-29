// Background Service Worker for Chrome Extension
// Handles context menu, word processing, and API calls

// Initialize context menu on extension install
chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({
    id: "addToDictionary",
    title: "Add '%s' to Dictionary",
    contexts: ["selection"]
  });
  
  // Setup daily reminder
  await setupDailyReminder();
});

// Get random word for study mode
async function getRandomWord() {
  const result = await chrome.storage.local.get(['dictionary']);
  const dictionary = result.dictionary || [];
  
  if (dictionary.length === 0) {
    return null;
  }
  
  // Prefer unreviewed words
  const unreviewed = dictionary.filter(w => !w.reviewed);
  const wordsToChoose = unreviewed.length > 0 ? unreviewed : dictionary;
  
  return wordsToChoose[Math.floor(Math.random() * wordsToChoose.length)];
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "addToDictionary") {
    const selectedText = info.selectionText.trim();
    
    if (!selectedText) {
      return;
    }

    // Check if word already exists
    const result = await chrome.storage.local.get(['dictionary']);
    const dictionary = result.dictionary || [];
    
    const wordExists = dictionary.some(entry => 
      entry.word.toLowerCase() === selectedText.toLowerCase()
    );

    if (wordExists) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Word Already Exists',
        message: `"${selectedText}" is already in your dictionary`
      });
      return;
    }

    // Show notification that word is being added
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Adding Word',
      message: `Fetching meaning for "${selectedText}"...`
    });

    try {
      // Fetch word meaning from API
      const wordData = await fetchWordMeaning(selectedText);
      
      // Create dictionary entry
      const entry = {
        word: selectedText,
        meaning: wordData.meaning || 'Meaning not found',
        phonetic: wordData.phonetic || '',
        partOfSpeech: wordData.partOfSpeech || '',
        example: wordData.example || '',
        synonyms: wordData.synonyms || [],
        addedDate: new Date().toISOString(),
        difficulty: 'medium',
        category: 'general',
        reviewed: false,
        reviewCount: 0
      };

      // Add to dictionary
      dictionary.push(entry);
      await chrome.storage.local.set({ dictionary });

      // Update statistics
      await updateStatistics();

      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Word Added!',
        message: `"${selectedText}" has been added to your dictionary`
      });

    } catch (error) {
      console.error('Error adding word:', error);
      
      // Add word without meaning if API fails
      const entry = {
        word: selectedText,
        meaning: 'Unable to fetch meaning. Please add manually.',
        phonetic: '',
        partOfSpeech: '',
        example: '',
        synonyms: [],
        addedDate: new Date().toISOString(),
        difficulty: 'medium',
        category: 'general',
        reviewed: false,
        reviewCount: 0
      };

      dictionary.push(entry);
      await chrome.storage.local.set({ dictionary });
      await updateStatistics();

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Word Added (Limited)',
        message: `"${selectedText}" added but meaning could not be fetched`
      });
    }
  }
});

// Fetch word meaning from Dictionary API
async function fetchWordMeaning(word) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    
    if (!response.ok) {
      throw new Error('Word not found in dictionary API');
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const entry = data[0];
      const meanings = entry.meanings || [];
      
      // Get first meaning with definition
      let meaning = '';
      let partOfSpeech = '';
      let example = '';
      let synonyms = [];

      if (meanings.length > 0) {
        const firstMeaning = meanings[0];
        partOfSpeech = firstMeaning.partOfSpeech || '';
        
        if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
          const firstDef = firstMeaning.definitions[0];
          meaning = firstDef.definition || '';
          example = firstDef.example || '';
          synonyms = firstDef.synonyms || [];
        }
      }

      return {
        meaning,
        phonetic: entry.phonetic || entry.phonetics?.[0]?.text || '',
        partOfSpeech,
        example,
        synonyms: synonyms.slice(0, 5) // Limit to 5 synonyms
      };
    }

    throw new Error('No data returned');
  } catch (error) {
    console.error('Error fetching word meaning:', error);
    throw error;
  }
}

// Update statistics
async function updateStatistics() {
  const result = await chrome.storage.local.get(['dictionary', 'statistics']);
  const dictionary = result.dictionary || [];
  const stats = result.statistics || {
    totalWords: 0,
    wordsReviewed: 0,
    lastUpdated: null
  };

  stats.totalWords = dictionary.length;
  stats.wordsReviewed = dictionary.filter(w => w.reviewed).length;
  stats.lastUpdated = new Date().toISOString();

  await chrome.storage.local.set({ statistics: stats });
}

// Handle messages from popup/options
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'deleteWord') {
    deleteWord(request.word).then(() => {
      sendResponse({ success: true });
    });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'updateWord') {
    updateWord(request.word, request.updates).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'exportDictionary') {
    exportDictionary().then(data => {
      sendResponse({ success: true, data });
    });
    return true;
  }

  if (request.action === 'exportDictionaryAsText') {
    exportDictionaryAsText().then(text => {
      sendResponse({ success: true, text });
    });
    return true;
  }

  if (request.action === 'getRandomWord') {
    getRandomWord().then(word => {
      sendResponse({ success: true, word });
    });
    return true;
  }

  if (request.action === 'updateReminderSettings') {
    setupDailyReminder().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

async function deleteWord(word) {
  const result = await chrome.storage.local.get(['dictionary']);
  const dictionary = result.dictionary || [];
  const filtered = dictionary.filter(entry => entry.word !== word);
  await chrome.storage.local.set({ dictionary: filtered });
  await updateStatistics();
}

async function updateWord(word, updates) {
  const result = await chrome.storage.local.get(['dictionary']);
  const dictionary = result.dictionary || [];
  const index = dictionary.findIndex(entry => entry.word === word);
  
  if (index !== -1) {
    dictionary[index] = { ...dictionary[index], ...updates };
    await chrome.storage.local.set({ dictionary });
    await updateStatistics();
  }
}

async function exportDictionary() {
  const result = await chrome.storage.local.get(['dictionary']);
  return result.dictionary || [];
}

// Export dictionary as plain text document
async function exportDictionaryAsText() {
  const result = await chrome.storage.local.get(['dictionary']);
  const dictionary = result.dictionary || [];
  
  if (dictionary.length === 0) {
    return '';
  }
  
  // Sort alphabetically
  const sorted = [...dictionary].sort((a, b) => 
    a.word.toLowerCase().localeCompare(b.word.toLowerCase())
  );
  
  let text = '='.repeat(60) + '\n';
  text += 'PERSONAL DICTIONARY\n';
  text += `Generated: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}\n`;
  text += `Total Words: ${dictionary.length}\n`;
  text += '='.repeat(60) + '\n\n';
  
  sorted.forEach((entry, index) => {
    text += `${index + 1}. ${entry.word.toUpperCase()}\n`;
    if (entry.phonetic) {
      text += `   Pronunciation: ${entry.phonetic}\n`;
    }
    if (entry.partOfSpeech) {
      text += `   Part of Speech: ${entry.partOfSpeech}\n`;
    }
    text += `   Meaning: ${entry.meaning}\n`;
    if (entry.example) {
      text += `   Example: "${entry.example}"\n`;
    }
    if (entry.synonyms && entry.synonyms.length > 0) {
      text += `   Synonyms: ${entry.synonyms.join(', ')}\n`;
    }
    text += `   Difficulty: ${entry.difficulty} | Category: ${entry.category}\n`;
    text += `   Added: ${new Date(entry.addedDate).toLocaleDateString()}\n`;
    if (entry.reviewed) {
      text += `   Status: Reviewed (${entry.reviewCount || 0} times)\n`;
    }
    text += '\n' + '-'.repeat(60) + '\n\n';
  });
  
  return text;
}

// Setup daily word reminder alarm
async function setupDailyReminder() {
  const result = await chrome.storage.local.get(['settings']);
  const settings = result.settings || {};
  
  if (settings.dailyReminder) {
    // Clear existing alarm
    chrome.alarms.clear('dailyWordReminder');
    
    // Set new alarm for specified time daily
    const when = await getNextReminderTime();
    chrome.alarms.create('dailyWordReminder', {
      when: when,
      periodInMinutes: 24 * 60 // Repeat daily
    });
  } else {
    chrome.alarms.clear('dailyWordReminder');
  }
}

// Get next reminder time based on settings
async function getNextReminderTime() {
  const result = await chrome.storage.local.get(['settings']);
  const settings = result.settings || {};
  const reminderTime = settings.reminderTime || '09:00';
  const [hours, minutes] = reminderTime.split(':').map(Number);
  
  const now = new Date();
  const reminder = new Date();
  reminder.setHours(hours, minutes, 0, 0);
  
  if (reminder <= now) {
    reminder.setDate(reminder.getDate() + 1);
  }
  
  return reminder.getTime();
}

// Handle daily reminder alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyWordReminder') {
    const result = await chrome.storage.local.get(['dictionary', 'settings']);
    const dictionary = result.dictionary || [];
    const settings = result.settings || {};
    
    if (dictionary.length > 0 && settings.dailyReminder) {
      // Get unreviewed words or random word
      const unreviewed = dictionary.filter(w => !w.reviewed);
      const wordsToShow = unreviewed.length > 0 ? unreviewed : dictionary;
      const randomWord = wordsToShow[Math.floor(Math.random() * wordsToShow.length)];
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '📚 Daily Word Reminder',
        message: `${randomWord.word}: ${randomWord.meaning.substring(0, 100)}${randomWord.meaning.length > 100 ? '...' : ''}`
      });
    }
  }
});

// Initialize alarms on startup
chrome.runtime.onStartup.addListener(() => {
  setupDailyReminder();
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.settings) {
    setupDailyReminder();
  }
});

