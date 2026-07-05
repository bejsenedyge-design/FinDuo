FinTrack Pro
A personal expense tracking application. Works as a static web application — no server needed.
File Structure
fintrack/
├── index.html          ← Login / Registration page
├── app.html            ← Main application (protected by authorization)
├── css/
│   └── styles.css      ← All styles (dark/light theme, auth, animations)
└── js/
    ├── config.js       ← Constants: LANGS, CATEGORIES, ACHIEVEMENTS, LEVELS
    ├── db.js           ← Database: users, sessions, state (localStorage)
    ├── i18n.js         ← Helper functions: t(), fmoney(), fdate()
    ├── ui.js           ← Page render functions (return HTML strings)
    └── app.js          ← Application logic, handlers, AI report, navigation

Script Loading Order
config.js → db.js → i18n.js → ui.js → app.js

Each file depends on the previous ones. app.js runs render() at the end after everything is loaded.
Key Features
| Function | File | Description |
|---|---|---|
| DB.register() / DB.login() | db.js | SHA-256 password hashing via Web Crypto API |
| DB.getUserState() | db.js | Separate state for each user |
| render() | app.js | Single rendering entry point — calls the required renderer |
| getAiReport() | app.js | Response streaming via SSE from Anthropic API |
| openLesson() | app.js | Modal window with lesson content + completion checkmark |
| deleteExpense() | app.js | Deletion with fade-out animation |
| filterHistory() | app.js | History filtering by category without re-rendering |
| Swipe navigation | app.js | TouchEvent → tab switching |
| _expenseRow() | ui.js | Common helper for expense row (with/without delete button) |
Data Storage (localStorage)
ft_users         → JSON array of users (username + passwordHash)
ft_session       → Current session { username, displayName, loginAt }
ft_state_<user>  → Specific user's state (expenses, coins, budget...)

AI Report (Streaming)
 * Uses stream: true → SSE (text/event-stream)
 * Reads ReadableStream via getReader() + TextDecoder
 * Parses content_block_delta events → accumulates text
 * Shows real-time token counter
Languages
Supported: Russian (ru), English (en), Kazakh (kz).
Switching via the 🌐 icon in the header. The language is saved in the user's state.
