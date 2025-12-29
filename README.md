# Personal Dictionary - Chrome Extension (Personal Lexicon)

A powerful Chrome extension to build your personal vocabulary by collecting words with automatic meanings, definitions, and examples. Perfect for language learners, students, and anyone looking to expand their vocabulary.

## 🌟 Features

### Core Features
- **Right-Click to Add Words**: Simply select any word while browsing and right-click to add it to your dictionary
- **Automatic Meaning Generation**: Automatically fetches word meanings, definitions, phonetic pronunciation, part of speech, examples, and synonyms from the Dictionary API
- **Plain Text Export**: Export your dictionary as a beautifully formatted plain text document (.txt) for easy reading and sharing
- **JSON Export/Import**: Backup and restore your dictionary with JSON format

### Study & Learning Features
- **Study Mode (Flashcards)**: Interactive flashcard system to review your words
- **Word Pronunciation**: Click the 🔊 button to hear word pronunciation using browser's speech synthesis
- **Review System**: Mark words as reviewed and track your progress
- **Difficulty Levels**: Categorize words as Easy, Medium, or Hard
- **Custom Categories**: Organize words by categories (academic, business, technical, etc.)

### Productivity Features
- **Daily Word Reminder**: Get daily notifications with random words from your dictionary at a time you choose
- **Statistics Dashboard**: Track your vocabulary growth with detailed statistics
- **Search & Filter**: Quickly find words by searching or filtering by status, difficulty, or category
- **Word Details Modal**: View comprehensive word information including synonyms and examples

### User Experience
- **Modern UI**: Beautiful, responsive design with gradient themes
- **Real-time Updates**: Dictionary updates instantly across all browser tabs
- **Notifications**: Get notified when words are added or updated
- **Empty State Guidance**: Helpful instructions for new users

## 📦 Installation

### From Source (Developer Mode)

1. **Download or Clone** this repository
   ```bash
   git clone <repository-url>
   cd add2dic
   ```

2. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/` in your Chrome browser
   - Or go to Menu (⋮) → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the `add2dic` folder
   - The extension should now appear in your extensions list

5. **Pin the Extension** (Optional but recommended)
   - Click the puzzle piece icon (🧩) in Chrome's toolbar
   - Find "Personal Dictionary - Word Collector"
   - Click the pin icon to keep it visible

## 🚀 Usage

### Adding Words

1. **While Browsing**: Select any word on any webpage
2. **Right-Click**: Right-click on the selected word
3. **Add to Dictionary**: Click "Add '[word]' to Dictionary" from the context menu
4. **Automatic Processing**: The extension will:
   - Check if the word already exists
   - Fetch meaning, pronunciation, examples, and synonyms
   - Add it to your dictionary
   - Show a notification when complete

### Viewing Your Dictionary

1. **Open Extension**: Click the extension icon in your toolbar
2. **Browse Words**: Scroll through your collected words
3. **Search**: Use the search bar to find specific words
4. **Filter**: Use the dropdown to filter by:
   - All Words
   - Unreviewed
   - Reviewed
   - Easy/Medium/Hard difficulty

### Study Mode

1. **Open Extension**: Click the extension icon
2. **Click Study Button**: Click the 🎓 icon in the header
3. **Review Flashcards**: 
   - See the word first
   - Click "Reveal Answer" to see the meaning
   - Mark as reviewed if you know it
   - Click "Next Card" for a new word

### Exporting Your Dictionary

#### Plain Text Export (Recommended)
1. Click the 📄 icon in the extension popup
2. A `.txt` file will be downloaded with all your words formatted beautifully
3. Perfect for printing, sharing, or reading offline

#### JSON Export
1. Click the 💾 icon in the extension popup
2. A `.json` file will be downloaded
3. Use this for backup or importing to another browser

### Settings & Customization

1. **Open Settings**: Click the ⚙️ icon in the extension popup
2. **Configure Options**:
   - **Auto-fetch meanings**: Enable/disable automatic meaning fetching
   - **Show notifications**: Toggle notification display
   - **Daily reminder**: Enable daily word notifications
   - **Reminder time**: Set the time for daily reminders

### Managing Words

- **Edit Word**: Click "Edit" on any word card to modify details
- **Mark as Reviewed**: Click "Mark as Reviewed" to track your progress
- **Delete Word**: Click "Delete" to remove a word (with confirmation)
- **View Details**: Click on a word name to see full details in a modal

## 📁 Project Structure

```
add2dic/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (context menu, API calls)
├── popup.html             # Main extension popup UI
├── popup.js               # Popup functionality
├── options.html           # Settings page
├── options.js             # Settings functionality
├── styles/
│   ├── popup.css          # Popup styling
│   └── options.css        # Settings page styling
├── icons/
│   ├── icon16.png         # Extension icon (16x16)
│   ├── icon48.png         # Extension icon (48x48)
│   └── icon128.png        # Extension icon (128x128)
└── README.md              # This file
```

## 🔧 Technical Details

### Technologies Used
- **Manifest V3**: Latest Chrome extension standard
- **Chrome Storage API**: For local data persistence
- **Chrome Context Menus API**: For right-click functionality
- **Chrome Notifications API**: For user notifications
- **Chrome Alarms API**: For daily reminders
- **Dictionary API**: Free dictionary API (api.dictionaryapi.dev)
- **Web Speech API**: For word pronunciation
- **Vanilla JavaScript**: No frameworks, pure JS for performance

### Data Storage
- All dictionary data is stored locally using Chrome's `chrome.storage.local` API
- Data persists across browser sessions
- No data is sent to external servers except for dictionary API calls
- Your privacy is protected - all data stays on your device

### API Used
- **Dictionary API**: https://api.dictionaryapi.dev/
  - Free, no API key required
  - Provides meanings, pronunciations, examples, and synonyms
  - Supports English language

## 🎨 Design Philosophy

- **User-Centric**: Designed with the user's learning journey in mind
- **Minimalist**: Clean, uncluttered interface
- **Accessible**: Easy to use for users of all technical levels
- **Productive**: Features that enhance vocabulary building
- **Modern**: Following latest web design trends and Chrome extension standards

## 🚧 Future Enhancements

Potential features for future versions:
- Multiple language support
- Spaced repetition algorithm
- Word frequency analysis
- Integration with Anki or other flashcard apps
- Cloud sync across devices
- Word of the day widget
- Progress charts and analytics
- Custom word notes
- Word pronunciation audio files

## 📝 License

This project is open source and available for personal and educational use.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📧 Support

For issues, questions, or suggestions, please open an issue in the repository.

## 🙏 Acknowledgments

- Dictionary API (api.dictionaryapi.dev) for providing free word definitions
- Chrome Extensions team for excellent documentation
- All contributors and users of this extension

---

**Happy Learning! 📚✨**

Build your vocabulary one word at a time.
