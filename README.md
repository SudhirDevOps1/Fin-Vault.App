# 💎 FinVault — Privacy-First Personal Finance Tracker

> **100% Offline** • **Open Source** • **Zero Tracking** • **AI-Powered NLP** • **Multi-Language (Hindi/English)**

A complete personal finance web application that runs entirely in your browser. Your data never leaves your device unless YOU explicitly configure Firebase sync.

---

## 📖 Table of Contents

1. [Features Overview](#-features-overview)
2. [Quick Start (2 minutes)](#-quick-start)
3. [Detailed Setup Guide](#-detailed-setup-guide)
4. [How Each Feature Works](#-how-each-feature-works)
5. [AI Engine Setup](#-ai-engine-setup)
6. [Firebase Cloud Sync Setup](#-firebase-cloud-sync-setup)
7. [Natural Language Parser](#-natural-language-parser-hindi--english)
8. [Receipt Generator](#-receipt-generator)
9. [New Advanced Features](#-new-advanced-features)
10. [Deployment Guide](#-deployment-guide)
11. [Tech Stack](#-tech-stack)
12. [Project Structure](#-project-structure)
13. [Troubleshooting](#-troubleshooting)
14. [Contributing](#-contributing)

---

## ✨ Features Overview

| Feature | Description |
|---------|-------------|
| 🔐 **PIN Lock** | Client-side AES encryption. No server needed |
| 💰 **Expense/Income Tracker** | Add, edit, delete transactions with categories |
| 🧠 **AI Natural Language** | Type "1200 rs mila jisme se 129 ka pen liya" → auto-creates 3 transactions |
| 📊 **Charts & Reports** | Pie charts, bar charts, 6-month trends, daily spending |
| 🧾 **Colorful Receipt** | 5 themes, QR code, watermark, amount in words, PDF/Image export |
| ☁️ **Firebase Sync** | Optional cloud backup to YOUR Firebase project |
| 🎯 **Spending Caps** | Set monthly limits per category with alerts |
| 🔄 **Recurring Txns** | Daily/weekly/monthly automated entries |
| 📤 **Export/Import** | CSV/JSON backup and restore |
| 🌙 **Dark Mode** | Light/Dark/System theme |
| 📱 **Responsive** | Works on mobile, tablet, desktop |
| 🤖 **10+ AI Providers** | Groq, Gemini, Mistral, Cerebras, OpenAI, DeepSeek, and more |
| 💳 **Multi-Account** | Track Cash, Bank, Cards, Crypto, Wallets |
| 🎯 **Budgets** | Weekly/monthly/yearly budgets with rollover |
| 🏆 **Savings Goals** | Track progress, contribute, celebrate milestones |
| 📈 **Investments** | Stocks, MFs, Crypto, Gold, FDs with P&L |
| 💰 **Debts & Loans** | EMI tracking, payment recording, interest calc |
| 🔔 **Bill Reminders** | Browser notifications before due dates |
| #️⃣ **Tags & Hashtags** | Auto-detect #tags from descriptions |
| 🔍 **Advanced Search** | Filters, sorting, pagination, CSV export |

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone <your-repo-url>
cd finvault

# 2. Install
npm install

# 3. Run
npm run dev

# 4. Open
# → http://localhost:5173
```

That's it! The app works fully offline with zero configuration.

---

## 📋 Detailed Setup Guide

### Prerequisites

- **Node.js** 18 or higher ([download](https://nodejs.org))
- **npm** (comes with Node.js)
- A modern browser (Chrome, Firefox, Safari, Edge)

### Step-by-Step Installation

```bash
# Step 1: Clone the repository
git clone <your-repo-url>
cd finvault

# Step 2: Install dependencies
npm install

# Step 3: (Optional) Create environment file for Firebase
cp .env.example .env
# Edit .env with your Firebase keys if you want cloud sync

# Step 4: Start development server
npm run dev

# Step 5: Build for production
npm run build
# Output files are in dist/ folder
```

### First Time Usage

1. **Open the app** → You'll see the PIN setup screen
2. **Set a 4-6 digit PIN** → This encrypts your data locally
3. **Start adding transactions** → Click "Add Transaction" on Dashboard
4. **Try AI mode** → Toggle "AI Natural" tab in the Add Transaction modal
5. **Configure AI keys** → Go to Settings → AI Engine tab → Add your free API key
6. **Explore More** → Click "More" in navigation for advanced features

---

## 🔧 How Each Feature Works

### 🔐 PIN Lock System
- On first visit, you set a PIN (4-6 digits)
- PIN is hashed with PBKDF2 + random salt → stored in IndexedDB
- Next time you open the app, enter PIN to unlock
- **Reset PIN**: Settings → Privacy & Lock PIN → Remove PIN
- **Change PIN**: Enter new PIN + confirm → Update PIN
- Data is AES-encrypted using your PIN as the key

### 💰 Adding Transactions

**Manual Mode:**
1. Click "Add Transaction" on Dashboard or Transactions page
2. Choose Income (💰) or Expense (💸)
3. Enter amount, date, category, description
4. Optionally attach a receipt image (stored as base64 in IndexedDB)
5. Mark as recurring if needed (daily/weekly/monthly/yearly)
6. Click "Add Transaction"

**AI Natural Language Mode:**
1. Toggle to "AI Natural" tab in Add Transaction modal
2. Type naturally: `"1200 rs mila jisme se 129 ka pen liya aur 459 ka book"`
3. Click "Parse Transactions"
4. Review the extracted transactions
5. Click "Add X Transactions" to save all

### 📊 Reports & Analytics
- **Dashboard**: Current month summary + mini chart + recent 10 transactions
- **Reports page**: Select any year/month to view:
  - Income vs Expense area chart (12 months)
  - Savings trend line chart
  - Category breakdown pie chart
  - Daily spending bar chart

### 🎯 Spending Caps
1. Go to Settings → Cap Limits & Categories
2. Select an expense category (e.g., Food & Dining)
3. Set monthly limit (e.g., ₹5000)
4. Set alert threshold (e.g., 80% → alert when you spend ₹4000+)
5. Progress bars show real-time status: Green → Amber → Red

### 📤 Export / Import
- **Export**: Settings → General → Export Backup → Downloads JSON file
- **Import**: Settings → General → Import Backup → Select JSON file → Merge
- **CSV Export**: Transactions page → CSV button → Downloads spreadsheet

---

## 🤖 AI Engine Setup

### Free API Keys (No Credit Card Required!)

| Provider | Free? | Get Key | Best Models |
|----------|-------|---------|-------------|
| ⚡ **Groq** | ✅ FREE | [console.groq.com/keys](https://console.groq.com/keys) | llama-3.3-70b, deepseek-r1, qwen-2.5 |
| ✨ **Gemini** | ✅ FREE | [aistudio.google.com](https://aistudio.google.com/app/apikey) | gemini-2.0-flash, gemini-1.5-pro |
| 🧠 **Cerebras** | ✅ FREE | [cloud.cerebras.ai](https://cloud.cerebras.ai) | llama-3.3-70b, qwen-3-32b, glm-4.5 |
| 🌪️ **Mistral** | 💰 Paid | [console.mistral.ai](https://console.mistral.ai) | mistral-large, pixtral-large |
| 🤖 **OpenAI** | 💰 Paid | [platform.openai.com](https://platform.openai.com) | gpt-4o-mini, o3-mini |
| 🌊 **DeepSeek** | 💰 Cheap | [platform.deepseek.com](https://platform.deepseek.com) | deepseek-chat, deepseek-r1 |
| 🔀 **OpenRouter** | 💰 Pay-per-use | [openrouter.ai](https://openrouter.ai/keys) | Access to ALL models |

### How to Configure

1. **Go to Settings → AI Engine & Auto-Detect tab**
2. **Scroll down to AI Assistant section**
3. **Click a provider** (e.g., Groq) to add it
4. **Paste your API key** in the input field
5. **Select a model** from the dropdown
6. **Click "Test"** to verify the connection
7. **Toggle "Enable Provider"** to activate
8. **Click "Auto-Detect Working Keys"** to scan all providers at once

### Model Selection Guide

**For Hindi/English NLP (Best accuracy):**
- Groq → `llama-3.3-70b-versatile` (recommended, FREE)
- Gemini → `gemini-2.0-flash-exp` (fastest, FREE)
- Cerebras → `llama-3.3-70b` (ultra-fast inference, FREE)

**For budget-conscious:**
- Groq → `llama-3.1-8b-instant` (smaller but fast)
- Gemini → `gemini-1.5-flash-8b` (lightweight)

**For maximum accuracy:**
- OpenRouter → `anthropic/claude-3.5-sonnet`
- OpenAI → `gpt-4o`

### Preferred Engine Override
- **Auto-Detect**: App picks the first working provider automatically
- **Offline Mode**: Uses deterministic Hindi/English parser (no API needed)
- **Specific Provider**: Force-select your preferred provider

---

## ☁️ Firebase Cloud Sync Setup

### When to Use
- You want to access data across multiple devices
- You want cloud backup for safety
- You want to share data with family

### Step-by-Step Firebase Setup

#### 1. Create Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name: `personal-finance-db`
4. Disable Google Analytics (not needed)
5. Click "Create project"

#### 2. Add Web App
1. In Firebase console → Click the web icon (`</>`)
2. Register app name: `FinVault`
3. Copy the config values:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",              // ← Copy this
  authDomain: "xxx.firebaseapp.com", // ← Copy this
  projectId: "personal-finance-db",  // ← Copy this
  storageBucket: "xxx.appspot.com",  // ← Copy this
  messagingSenderId: "123456789",    // ← Copy this
  appId: "1:123:web:abc"             // ← Copy this
};
```

#### 3. Enable Firestore
1. In Firebase console → Build → Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select region closest to you
5. Click "Enable"

#### 4. Configure in FinVault
1. Go to Settings → Firebase Cloud Sync tab
2. Paste **API Key** in the first field
3. Paste **Project ID** in the second field
4. Auth Domain, Storage Bucket auto-fill from Project ID
5. Click **"Bind Firebase Keys & Sync"**
6. Click **"Test Connection"** to verify
7. Toggle **"Enable Synchronization"** ON
8. Click **"Sync Now"** to upload existing data

#### 5. (Alternative) Via .env File
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=personal-finance-db.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=personal-finance-db
VITE_FIREBASE_STORAGE_BUCKET=personal-finance-db.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
```

### How Firebase Sync Works
- **Offline-First**: All data stored in IndexedDB locally
- **Optional Sync**: Only syncs when you enable it and click "Sync Now"
- **Your Project**: Data goes to YOUR Firebase project, not ours
- **Privacy**: We never see your credentials or data
- **Unbind**: Click "Unbind" anytime to go fully offline

---

## 🗣️ Natural Language Parser (Hindi + English)

### How It Works

The parser has **two modes**:

#### Mode 1: AI-Powered (when API key is configured)
The LLM receives your text and returns structured JSON with amounts, descriptions, categories, and confidence scores.

#### Mode 2: Deterministic Fallback (offline, no API needed)
A rule-based parser that understands Hindi and English patterns:

### Supported Patterns

| Pattern | Example | Result |
|---------|---------|--------|
| **Simple income** | `1200 rs mila` | +₹1200 Income |
| **Simple expense** | `500 ka kharcha` | -₹500 Expense |
| **+/- signs** | `+5000 salary, -200 coffee` | Two transactions |
| **Nested (jisme se)** | `1200 rs mila jisme se 129 ka pen liya aur 459 ka book` | +₹1200, -₹129 (pen), -₹459 (book) |
| **Multiple items** | `chai 50, samosa 30, bus 20` | Three expenses |
| **Mixed** | `salary 45000 credited, rent 12000 paid, groceries 3500` | One income + two expenses |
| **Hinglish** | `papa se 5000 mila aur 200 ka recharge kiya` | +₹5000, -₹200 |

### Conjunction Splitting Keywords

| Keyword | Language | Purpose |
|---------|----------|---------|
| `aur` | Hindi | Splits items: "pen liya **aur** book liya" |
| `and` | English | Splits items: "pen **and** book" |
| `jisme se` | Hindi | Nested expense: "1200 mila **jisme se** 500 ka..." |
| `jis me se` | Hindi | Same as above (alternate spelling) |
| `mein se` | Hindi | Same pattern |
| `phir` / `fir` | Hindi | Sequence: "pehle chai **phir** samosa" |
| `uske baad` | Hindi | Then: "**uske baad** 200 ka..." |
| `,` / `;` | Both | Comma/semicolon separation |

### Category Auto-Detection

The parser automatically categorizes based on Hindi/English keywords:

| Category | Keywords |
|----------|----------|
| 🍔 Food | khana, chai, coffee, pizza, biryani, nashta, dhaba, swiggy, zomato |
| 🚗 Transport | bus, train, auto, taxi, cab, petrol, uber, ola, metro |
| 🛍️ Shopping | kapda, shirt, dress, shoes, amazon, flipkart, myntra |
| 📚 Education | pen, book, notebook, school, college, padhai, tuition, copy |
| 💊 Health | dawai, doctor, hospital, medicine, pharmacy, tablet |
| 🏠 Rent | kiraya, ghar, room, pg, hostel, flat |
| 💡 Bills | bill, electricity, recharge, mobile, wifi, netflix, spotify |
| 🎬 Entertainment | movie, cinema, party, trip, tour, outing, picnic |
| 🛒 Groceries | sabzi, atta, dal, chawal, doodh, masala, ration, kirana |
| 💼 Salary | salary, tankhwa, naukri |
| 💻 Freelance | freelance, project, gig, client |
| 🎁 Gift | gift, tohfa, shagun, inam, reward |

---

## 🧾 Receipt Generator

### 5 Beautiful Themes
Choose from 5 professionally designed receipt themes:

1. **Modern** (Purple/Indigo gradient) — Clean, professional
2. **Classic** (Dark slate) — Minimal, elegant
3. **Minimal** (Emerald green) — Fresh, simple
4. **Sunset** (Orange/Red/Yellow) — Warm, vibrant
5. **Midnight** (Deep purple) — Dark mode optimized

### Features
- **Gradient header** with merchant name
- **Amount in words** (₹1200 → "One Thousand Two Hundred Rupees Only")
- **QR Code** for verification
- **Watermark** ("VERIFIED" subtle background)
- **Custom note** field
- **Attached receipt image** display
- **Receipt number** auto-generated

### Export Options
1. **PDF** → Full A4 colorful receipt with gradients
2. **Image (PNG)** → High-res 2x screenshot
3. **Print** → Opens browser print dialog
4. **Share** → Native share (mobile) or clipboard copy
5. **Email** → Opens email client with pre-filled receipt
6. **Copy** → Copies receipt text to clipboard

### Customization
- **Merchant Name**: Change from "FinVault" to your business name
- **Theme**: Switch between 5 color themes
- **QR Code**: Toggle on/off
- **Watermark**: Toggle on/off
- **Custom Note**: Add personalized message

---

## 🆕 New Advanced Features

Access all these from the **"More"** tab in navigation:

### 💳 Accounts & Wallets
- Track multiple accounts: Cash, Bank, Credit Card, Digital Wallet, Crypto, Investment
- Opening balance + auto-calculated current balance
- **Inter-account transfers** (creates paired transactions)
- Multi-currency support (INR/USD/EUR/GBP)
- Net worth dashboard

### 🎯 Budgets
- Weekly / Monthly / Yearly budgets
- Category-specific or global budgets
- **Rollover** unused amount to next period
- Smart "on-track" detection
- Color-coded progress bars

### 🏆 Savings Goals
- Track savings for any target
- **One-click contribute** to goals
- Auto-celebrate when goal completed
- Milestone markers (25%, 50%, 75%, 100%)
- Required-per-day calculation

### 📈 Investments
- Track Stocks, Mutual Funds, Crypto, Gold, FDs, PPF, Real Estate
- Buy price → Current price tracking
- Inline price update
- Real-time P/L calculation
- Asset allocation pie chart

### 💰 Debts & Loans
- Track Loans, Credit Cards, Mortgages, Student, Personal loans
- Principal vs Outstanding progress
- Interest rate + EMI tracking
- **Record payments** → auto-creates expense transaction
- Auto-split into principal + interest

### 🔄 Recurring Transactions
- Daily / Weekly / Monthly / Quarterly / Yearly rules
- Auto-executes on app open (catches up missed dates)
- Pause/Resume controls
- Monthly impact summary

### 🔔 Bill Reminders
- Browser **push notifications** before due dates
- Color-coded urgency (overdue/red, due-soon/amber, normal)
- Mark paid with one click
- Auto-schedule next occurrence
- 8 categories (utility, subscription, internet, phone, insurance, rent, EMI, other)

### #️⃣ Tags & Hashtags
- Custom tags with color coding
- **Auto-detect** `#hashtags` from transaction descriptions
- Shows usage count for each auto-tag
- Tip: type `#vacation` in description → auto-categorizes

### 🔍 Advanced Search
- Search by description, category, #tag
- Filter by type, category, amount range, date range
- Sort by date, amount, or description (asc/desc)
- **Export filtered results to CSV**
- Pagination (20 per page)
- Live totals (income/expense/net) of filtered results

---

## 🚀 Deployment Guide

### Option 1: Static Hosting (Easiest)

```bash
# Build
npm run build

# The dist/ folder contains a single index.html file
# Upload it anywhere:
```

**Netlify:**
1. Drag & drop `dist/` folder to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Done! Get your URL.

**Vercel:**
```bash
npm i -g vercel
vercel --prod
```

**Cloudflare Pages:**
1. Connect GitHub repo
2. Build command: `npm run build`
3. Output directory: `dist`

**GitHub Pages:**
1. Push `dist/` to `gh-pages` branch
2. Enable GitHub Pages in repo settings

### Option 2: Docker (Self-Hosted)

```bash
# Build image
docker build -t finvault .

# Run container
docker run -d -p 8080:80 --name finvault finvault

# Open http://localhost:8080
```

### Option 3: Local File (No Server!)

```bash
npm run build
# Open dist/index.html directly in browser
# Works via file:// protocol!
```

---

## 🏗️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Vite 7** | Build tool, dev server |
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **TailwindCSS 4** | Styling |
| **React Router 7** | Client-side routing |
| **Dexie.js** | IndexedDB wrapper |
| **React Hook Form + Zod** | Form validation |
| **Recharts** | Charts & visualizations |
| **jsPDF** | PDF receipt generation |
| **CryptoJS** | PIN hashing & encryption |
| **date-fns** | Date formatting |
| **Lucide React** | Icons |
| **Firebase** | Optional cloud sync |

---

## 📁 Project Structure

```
finvault/
├── public/                    # Static assets
├── src/
│   ├── components/
│   │   ├── Layout.tsx         # App shell (sidebar + bottom nav)
│   │   ├── AddTransactionModal.tsx  # Manual + AI transaction input
│   │   ├── AINaturalInput.tsx       # AI natural language widget
│   │   ├── AISettings.tsx           # API key management
│   │   ├── AIEngineConsole.tsx      # Auto-detect diagnostics
│   │   ├── CategoryLimits.tsx       # Spending caps
│   │   ├── FirebaseSyncEngine.tsx   # Firebase config UI
│   │   ├── ReceiptModal.tsx         # Colorful receipt generator (5 themes)
│   │   ├── StatCard.tsx             # Dashboard stat cards
│   │   ├── Toggle.tsx               # Accessible toggle switch
│   │   ├── More.tsx                 # Feature hub (9 cards)
│   │   ├── Accounts.tsx             # Multi-account tracking
│   │   ├── Budgets.tsx              # Budget management
│   │   ├── Goals.tsx                # Savings goals
│   │   ├── Investments.tsx          # Investment portfolio
│   │   ├── DebtTracker.tsx          # Loan/EMI tracking
│   │   ├── RecurringManager.tsx     # Recurring rules
│   │   ├── BillReminders.tsx        # Bill notifications
│   │   ├── TagManager.tsx           # Hashtag system
│   │   └── AdvancedSearch.tsx       # Search & filters
│   ├── contexts/
│   │   ├── AuthContext.tsx    # PIN auth + Firebase auth
│   │   ├── ThemeContext.tsx   # Dark/light/system theme
│   │   └── ToastContext.tsx   # Toast notifications
│   ├── hooks/
│   │   └── useTransactions.ts # Transaction CRUD + summaries
│   ├── lib/
│   │   ├── db.ts             # IndexedDB (Dexie) setup
│   │   ├── crypto.ts         # PIN hashing, AES encrypt
│   │   ├── aiProviders.ts    # 10+ AI provider configs + NLP parser
│   │   └── firebase.ts       # Firebase SDK wrapper
│   ├── pages/
│   │   ├── Dashboard.tsx      # Main dashboard
│   │   ├── Transactions.tsx   # Transaction list + filters
│   │   ├── Reports.tsx        # Charts & analytics
│   │   ├── Settings.tsx       # 5-tab settings system
│   │   └── Login.tsx          # PIN entry screen
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   ├── App.tsx               # Router + providers
│   ├── main.tsx              # Entry point
│   └── index.css             # Tailwind + custom styles
├── .env.example              # Firebase config template
├── Dockerfile                # Docker deployment
├── README.md                 # This file
├── index.html                # HTML entry
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🔍 Troubleshooting

### "App shows blank screen"
- Clear browser cache and refresh
- Check browser console for errors
- Try incognito/private mode

### "PIN not working"
- Go to Settings → Privacy → Remove PIN
- This resets authentication
- Set a new PIN

### "AI parsing not working"
- Check if API key is correct: Settings → AI Engine → Test button
- Try a different provider (Groq/Gemini are free and reliable)
- Use the "Auto-Detect Working Keys" button
- Make sure you enabled the provider (toggle ON)

### "Firebase sync failing"
- Verify API Key and Project ID are correct
- Click "Test Connection" in Firebase tab
- Check if Firestore is enabled in Firebase console
- Make sure you're not in a restricted network

### "Charts not showing data"
- Add some transactions first
- Make sure dates are in the selected month/year
- Check if the selected period has data

### "Toggle switches not working"
- Make sure JavaScript is enabled
- Try refreshing the page
- Check if you're running the latest build

### "Receipt PDF looks wrong"
- The PDF is designed with colorful gradients
- Open in a PDF viewer like Adobe Reader for best results
- Print at 100% scale for best results

### "Bill reminders not showing"
- Enable browser notifications when prompted
- Check notification permissions in browser settings
- Make sure bills have due dates in the future

### "Data lost after refresh"
- Data is stored in IndexedDB (browser database)
- Don't clear site data / cookies
- Regularly export backups from Settings

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/awesome`
3. Commit changes: `git commit -m 'Add awesome feature'`
4. Push: `git push origin feature/awesome`
5. Open a Pull Request

### Guidelines
- Follow TypeScript best practices
- Write accessible HTML (ARIA attributes, semantic elements)
- Test on mobile AND desktop
- Don't add external analytics or tracking
- Keep the app 100% functional offline

---

## 📄 License

MIT License — Use freely for personal or commercial projects.

---

## 🙏 Acknowledgments

- Built with privacy as the #1 priority
- All AI processing uses YOUR API keys directly
- Zero data collection, zero tracking, zero analytics
- Your financial data is YOUR data

---

<div align="center">

**Made with ❤️ for financial privacy**

💎 **FinVault** — *Your Money, Your Device, Your Rules*

</div>
