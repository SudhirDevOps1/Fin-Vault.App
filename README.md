# 💎 FinVault — Privacy-First Personal Finance Tracker

> **Offline-first** • **PIN-protected** • **AI-powered** • **No analytics** • **Static deploy**

FinVault is a privacy-first personal finance web app built with **Vite + React + TypeScript**. It runs fully in the browser, stores data locally by default, and only talks to AI/Firebase providers when **you explicitly enable and trigger them**.

---

## 📚 Table of Contents

1. [What FinVault Can Do](#-what-finvault-can-do)
2. [Core Privacy Promise](#-core-privacy-promise)
3. [Quick Start](#-quick-start)
4. [Detailed Setup](#-detailed-setup)
5. [How AI Works Safely Everywhere](#-how-ai-works-safely-everywhere)
6. [AI Provider Setup](#-ai-provider-setup)
7. [Firebase Cloud Sync Setup](#-firebase-cloud-sync-setup)
8. [Transaction Input Methods](#-transaction-input-methods)
9. [CSV Bank Statement Import](#-csv-bank-statement-import)
10. [Bank SMS Parser](#-bank-sms-parser)
11. [Receipt Generator](#-receipt-generator)
12. [Advanced Finance Modules](#-advanced-finance-modules)
13. [Keyboard Shortcuts](#-keyboard-shortcuts)
14. [PWA / Install as App](#-pwa--install-as-app)
15. [Deployment Guide](#-deployment-guide)
16. [Project Structure](#-project-structure)
17. [Troubleshooting](#-troubleshooting)

---

## ✨ What FinVault Can Do

### Core Finance Tracking
- Add **income** and **expense** transactions
- Predefined + custom categories
- Attach receipt images
- Monthly summaries, running balances, charts, reports
- Export/import JSON and CSV
- Offline IndexedDB storage via Dexie

### AI Features
- Natural-language transaction parsing in **Hindi / English / Hinglish**
- Safe AI assistant on major pages:
  - Dashboard insights
  - Transactions analysis
  - Reports interpretation
  - Strategy planning in More
- Multi-provider AI engine:
  - Groq
  - Gemini
  - Cerebras
  - Mistral
  - OpenRouter
  - Together
  - Cohere
  - Perplexity
  - DeepSeek
  - OpenAI

### Advanced Production Modules
- Multi-accounts / wallets
- Budgets
- Savings goals
- Investments tracker
- Debts & loans tracker
- Recurring transactions
- Bill reminders with browser notifications
- Tags / hashtags
- Advanced search
- Bank statement CSV import
- Bank SMS auto-parser
- Net worth dashboard
- Indian tax estimator
- Installable PWA
- Keyboard shortcuts

---

## 🔒 Core Privacy Promise

FinVault is built so that **nobody tracks you by default**.

### What is NOT included
- ❌ No analytics scripts
- ❌ No tracking pixels
- ❌ No ad SDKs
- ❌ No hidden telemetry
- ❌ No automatic AI upload
- ❌ No forced cloud sync

### What IS included
- ✅ Data stored locally first
- ✅ PIN/password-based local lock
- ✅ AI only runs when you ask it to
- ✅ AI keys stay in your browser local storage
- ✅ Firebase only works if you configure your own project
- ✅ Strict HTML privacy headers added:
  - `no-referrer`
  - restrictive `Permissions-Policy`
  - CSP hardening
  - no framed embedding

### AI Privacy Shield defaults
Enabled by default:
- **Safe Mode** → redact sensitive references
- **Redact Descriptions** → mask merchant-like/account-like strings
- **Send Summary Only** → AI gets totals + top categories, not raw full detail lists
- **Store AI Chat Locally** → no server-side chat storage

You can change these in:
**Settings → AI Engine & Auto-Detect → AI Privacy Shield**

---

## 🚀 Quick Start

```bash
git clone <your-repo-url>
cd finvault
npm install
npm run dev
```

Then open:
`http://localhost:5173`

---

## 🛠 Detailed Setup

### Requirements
- Node.js 18+
- npm
- Modern browser

### First Run Flow
1. Open app
2. Set a **4–6 digit PIN**
3. Add your first transaction manually or via AI
4. Optionally configure AI providers
5. Optionally configure Firebase sync

### Production Build
```bash
npm run build
```

---

## 🤖 How AI Works Safely Everywhere

FinVault now uses AI across **every major page** (Dashboard, Transactions, Reports, More, Add Transaction, Settings), but with strict privacy and language awareness.

### Where AI appears
- **Dashboard** → monthly summary, savings advice, expense risk, budgeting tips
- **Transactions** → filtered analysis, unusual expenses, recurring patterns, categorization suggestions
- **Reports** → trend interpretation, top category analysis, actionable next steps
- **More** → wealth strategy, planning, feature guidance, goal setting
- **Add Transaction** → natural-language parsing (Hindi, English, Hinglish)
- **Settings AI Tab** → provider setup, privacy controls, diagnostics

### Important safety rules
- AI **never runs automatically** just because the page opened.
- It only runs when the user:
  - clicks a quick prompt,
  - presses send in the assistant,
  - or explicitly uses AI parsing/import tools.
- All API keys stay in **your browser localStorage** — never sent to any FinVault server.
- **Safe Mode** (default ON) redacts IDs, receipt images, account numbers, UPI IDs, and sensitive references before sending anything.
- **Send Summary Only** (default ON) sends only totals and top categories instead of full transaction lists.

### Language Awareness
The AI now **responds in the same language** as your question:
- Hindi query → Hindi reply
- English query → English reply
- Hinglish query → Hinglish reply

Examples that now work perfectly:
- "1 lakh mila jismein se 50 hajaar emi kiya" → correctly splits into +₹1,00,000 income and -₹50,000 expense
- "Mere kharcho ka summary do" → gives Hindi summary
- "Where can I reduce spending this month?" → gives English advice

### Local Offline Assistant
If no AI provider is configured, FinVault uses a smart local assistant that:
- Understands Hindi, English, and Hinglish
- Gives practical advice on saving, budgeting, tax, investment, EMI, trends
- Never sends any data anywhere
- The "No provider configured" hint only appears once (you can dismiss it)

### How to Get Better AI Answers
1. Go to **Settings → AI Engine & Auto-Detect**
2. Add a free provider (Groq or Gemini recommended)
3. Paste API key
4. Click "Test"
5. Enable the provider
6. (Optional) Use "Auto-Detect Working Keys"
7. Review **AI Privacy Shield** (all options are ON by default for maximum privacy)

---

## 🛡️ Core Privacy Promise

FinVault is built so that **nobody tracks you by default**.

### What is NOT included
- ❌ No analytics scripts
- ❌ No tracking pixels
- ❌ No ad SDKs
- ❌ No hidden telemetry
- ❌ No automatic AI upload
- ❌ No forced cloud sync

### What IS included
- ✅ Data stored locally first
- ✅ PIN/password-based local lock
- ✅ AI only runs when you ask it to
- ✅ AI keys stay in your browser local storage
- ✅ Firebase only works if you configure your own project
- ✅ Strict HTML privacy headers added:
  - `no-referrer`
  - restrictive `Permissions-Policy`
  - CSP hardening
  - no framed embedding

### AI Privacy Shield defaults (all ON)
- **Safe Mode** → redact sensitive references
- **Redact Descriptions** → mask merchant-like/account-like strings
- **Send Summary Only** → AI gets totals + top categories, not raw full detail lists
- **Store AI Chat Locally** → no server-side chat storage

You can change these in:
**Settings → AI Engine & Auto-Detect → AI Privacy Shield**

---

## 🚀 Quick Start

```bash
git clone <your-repo-url>
cd finvault
npm install
npm run dev
```

Then open:
`http://localhost:5173`

---

## 🛠 Detailed Setup

### Requirements
- Node.js 18+
- npm
- Modern browser

### First Run Flow
1. Open app
2. Set a **4–6 digit PIN**
3. Add your first transaction manually or via AI
4. Optionally configure AI providers
5. Optionally configure Firebase sync

### Production Build
```bash
npm run build
```

---

## 🧠 How AI Works Safely Everywhere

FinVault now uses AI across every major page, but safely.

### Where AI appears
- **Dashboard** → monthly summary, savings advice, expense risk, budgeting tips
- **Transactions** → filtered analysis, unusual expenses, recurring patterns, categorization suggestions
- **Reports** → trend interpretation, top category analysis, actionable next steps
- **More** → wealth strategy, planning, feature guidance, goal setting
- **Add Transaction** → natural-language parsing (Hindi, English, Hinglish)
- **Settings AI Tab** → provider setup, privacy controls, diagnostics

### Important safety rule
AI **never runs automatically** just because the page opened.

It only runs when the user:
- clicks a quick prompt,
- presses send in the assistant,
- or explicitly uses AI parsing/import tools.

### Safe-context behavior
Before data is sent to an AI provider, FinVault can:
- remove IDs
- remove receipt images
- mask account-like text
- mask UPI references
- mask reference numbers
- reduce raw transaction detail into summary-only context

### Local fallback
If no provider is configured, FinVault still provides:
- local heuristic insights
- deterministic parsing
- offline budget/tax/savings guidance

### Language Awareness
The AI now **responds in the same language** as your question:
- Hindi query → Hindi reply
- English query → English reply
- Hinglish query → Hinglish reply

Examples that now work perfectly:
- "1 lakh mila jismein se 50 hajaar emi kiya" → correctly splits into +₹1,00,000 income and -₹50,000 expense
- "Mere kharcho ka summary do" → gives Hindi summary
- "Where can I reduce spending this month?" → gives English advice

---

## 🤖 AI Provider Setup

### Free-first recommendations
| Provider | Recommended Model | Notes |
|---|---|---|
| Groq | `llama-3.3-70b-versatile` | Very fast, great general finance parsing |
| Gemini | `gemini-2.5-flash-preview-05-20` | Fastest 2.5 model (new default) |
| Cerebras | `llama-3.3-70b` | Ultra-fast inference |

### Supported model groups
FinVault already includes expanded model lists for:
- **Groq** (Llama, Gemma, DeepSeek Distill, Qwen)
- **Gemini** (2.5 flash/pro preview, 2.0 flash, 1.5 pro, Gemma 3 family)
- **Cerebras** (Llama, Qwen, GLM, GPT-OSS)
- **Mistral** (Large, Small, Pixtral, Codestral)
- and more via OpenRouter / Together / OpenAI / DeepSeek

### Setup steps
1. Go to **Settings → AI Engine & Auto-Detect**
2. Add a provider
3. Paste API key
4. Pick model
5. Test provider
6. Enable provider
7. (Optional) Use **Auto-Detect Working Keys**
8. Review **AI Privacy Shield** settings

---

## ☁️ Firebase Cloud Sync Setup

Firebase is **optional**.

### Why use it?
- Cloud backup
- Multi-device continuity
- Your own Firebase project ownership

### Setup steps
1. Create project at [Firebase Console](https://console.firebase.google.com)
2. Add a **Web App**
3. Copy:
   - API key
   - Project ID
   - Auth domain
   - App ID
4. Enable **Firestore Database**
5. In FinVault open:
   **Settings → Firebase Cloud Sync**
6. Fill values
7. Click **"Bind Firebase Keys & Sync"**
8. Click **"Test Connection"** to verify
9. Toggle sync ON if you want cloud mode

### Important privacy note
FinVault does **not** sync to any shared central FinVault server.
It syncs only to **your Firebase project**.

---

## ✍️ Transaction Input Methods

### 1. Manual Form
Use amount, category, description, date, receipt image.

### 2. AI Natural Input
Examples:
- `1200 rs mila jisme se 129 ka pen liya aur 459 ka book`
- `1 lakh mila jismein se 50 hajaar emi kiya`
- `salary 45000 credited, rent 12000 paid, groceries 3500`
- `papa se 5000 mila aur 200 ka recharge kiya`

### 3. Deterministic Offline Parser
Even without AI, FinVault understands patterns like:
- `aur`
- `and`
- `jisme se`
- `jis me se`
- `mein se`
- `+ / - signs`
- Hindi numbers (`1 lakh`, `50 hajaar`, `do lakh`)

### 4. Bank Statement CSV Import
See section below.

### 5. Bank SMS Parser
See section below.

---

## 🏦 CSV Bank Statement Import

Available in:
**Transactions page → CSV import icon**

### What it supports
- HDFC CSV
- SBI CSV
- ICICI CSV
- Axis CSV
- Generic CSV fallback

### Features
- Auto header detection
- Amount parsing
- Date parsing
- Category suggestion
- Duplicate detection
- Preview before import
- Editable category mapping before save

### Typical flow
1. Download statement CSV from bank portal
2. Open **Transactions**
3. Click **CSV Import** icon
4. Choose bank format
5. Upload CSV
6. Review parsed rows
7. Skip duplicates automatically
8. Import selected rows

---

## 📱 Bank SMS Parser

Available in:
**Transactions page → phone icon**

### Example supported SMS
```text
INR 450.00 debited from a/c **1234 at SWIGGY on 15-06-2026. Avl bal: Rs.12500
```

```text
Rs. 50000 credited to your account XX5678 from ACME CORP SALARY JUN 2026
```

### Extracts
- Amount
- Income/expense type
- Merchant/payee
- Account reference (masked in safe flows)
- Available balance (if present)
- Category suggestion

### Good for
- SBI alerts
- HDFC debit/credit alerts
- ICICI notifications
- Axis alerts
- UPI/Paytm/GPay/PhonePe-style messages

---

## 🧾 Receipt Generator

FinVault receipts are now **colorful, themeable, and export-safe**.

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
- **Attached receipt image** preview
- **Receipt number** auto-generated from transaction ID
- PDF, Image, Print, Share, Email, Copy options

---

## 📦 Advanced Finance Modules

Available in **More**:

### Accounts & Wallets
- Cash, bank, wallet, crypto, investment accounts
- Transfers between accounts
- Net total balance view

### Budgets
- Weekly / monthly / yearly budgets
- Category budgets
- Rollover option
- Progress + alerting

### Savings Goals
- Goal targets
- Progress tracking
- Contribute manually
- Milestone-style progression

### Investments
- Stocks / MF / crypto / gold / FD / PPF / real estate
- Buy vs current price
- P&L and asset allocation

### Debts & Loans
- Outstanding principal
- EMI amount
- Interest rate
- Payment recording

### Recurring Transactions
- Daily / weekly / monthly / yearly rules
- Auto-execution on load when due

### Bill Reminders
- Due-date reminders
- Browser notifications
- Mark paid with one click
- Auto-schedule next occurrence
- 8 categories (utility, subscription, internet, phone, insurance, rent, EMI, other)

### Tags & Hashtags
- Custom tags
- Auto-detect hashtags from descriptions

### Advanced Search
- Query + category + amount + date range filters
- Sort controls
- CSV export

### Net Worth Dashboard
- Assets vs liabilities
- 12-month trend
- 5-year projection
- asset allocation

### Indian Tax Estimator
- Old vs new regime comparison
- 80C / 80D / HRA / 24(b) / NPS / more
- best regime suggestion

---

## ⌨️ Keyboard Shortcuts

Press `?` anytime to open the shortcut help panel.

### Available shortcuts
- `G` then `D` → Dashboard
- `G` then `T` → Transactions
- `G` then `R` → Reports
- `G` then `M` → More
- `G` then `S` → Settings
- `N` → New Transaction event
- `Ctrl+K` → Search event
- `Esc` → Close modals / blur input

---

## 📱 PWA / Install as App

FinVault now includes:
- `manifest.json`
- service worker (`public/sw.js`)
- install icons
- standalone app metadata

### Benefits
- Install on mobile/desktop home screen
- Faster reloads
- Better offline availability
- Native-app-like launch experience

### Install steps
**Chrome / Edge desktop:**
- Open app
- Click install icon in address bar

**Android Chrome:**
- Open app
- Browser menu → Add to Home Screen

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

## 📁 Project Structure

```
finvault/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── icon-192.svg
│   └── icon-512.svg
├── src/
│   ├── components/
│   │   ├── Accounts.tsx
│   │   ├── AddTransactionModal.tsx
│   │   ├── AdvancedSearch.tsx
│   │   ├── AIAssistantPanel.tsx
│   │   ├── AIEngineConsole.tsx
│   │   ├── AIPrivacySettings.tsx
│   │   ├── AISettings.tsx
│   │   ├── AINaturalInput.tsx
│   │   ├── BankSMSParser.tsx
│   │   ├── BankStatementImport.tsx
│   │   ├── BillReminders.tsx
│   │   ├── Budgets.tsx
│   │   ├── CategoryLimits.tsx
│   │   ├── DebtTracker.tsx
│   │   ├── FirebaseSyncEngine.tsx
│   │   ├── Goals.tsx
│   │   ├── Investments.tsx
│   │   ├── Layout.tsx
│   │   ├── More.tsx
│   │   ├── NetWorthDashboard.tsx
│   │   ├── ReceiptModal.tsx
│   │   ├── RecurringManager.tsx
│   │   ├── StatCard.tsx
│   │   ├── TagManager.tsx
│   │   └── Toggle.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── ToastContext.tsx
│   ├── hooks/
│   │   ├── useKeyboardShortcuts.tsx
│   │   └── useTransactions.ts
│   ├── lib/
│   │   ├── aiProviders.ts
│   │   ├── crypto.ts
│   │   ├── db.ts
│   │   └── firebase.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── Reports.tsx
│   │   ├── Settings.tsx
│   │   └── Transactions.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── Dockerfile
├── README.md
├── index.html
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
- Try a different provider (Groq or Gemini are free and reliable)
- Use the "Auto-Detect Working Keys" button
- Make sure you enabled the provider (toggle ON)
- Try the exact example "1 lakh mila jismein se 50 hajaar emi kiya" — it should now work perfectly

### "AI always replies in English even when I ask in Hindi"
- The system prompt has been updated to strictly follow the user's language.
- If it still replies in English, try asking in pure Hindi or Hinglish.
- The offline local assistant also now responds in the same language.

### "Firebase test passes but sync is still off"
- Make sure you also enable the sync toggle
- Ensure Firestore is enabled in your Firebase project
- Re-check project ID / API key pairing

### "Charts not showing data"
- Add some transactions first
- Make sure dates are in the selected month/year
- Check if the selected period has data

### "Toggle switches not working"
- Make sure JavaScript is enabled
- Try refreshing the page
- Check if you're running the latest build

### "Receipt download differs slightly from preview"
- The PDF and image export are matched as closely as possible, but browser/font rendering can vary slightly across platforms

### "Bill reminders not showing"
- Enable notification permission in browser
- Check notification permissions in browser settings
- Make sure bills have due dates in the future

### "Data lost after refresh"
- Data is stored in IndexedDB (browser database)
- Don't clear site data / cookies
- Regularly export backups from Settings

---

## ✅ Current Production Readiness Summary

FinVault now includes:
- privacy-safe AI everywhere
- AI privacy shield controls
- CSV import
- SMS parser
- receipts with multiple themes
- bank sync UI
- tax estimator
- net worth dashboard
- advanced search
- more finance modules
- PWA support
- keyboard shortcuts
- no tracking scripts
- full Hindi / English / Hinglish AI support
- improved local offline assistant
- expanded model list for Gemini, Groq, DeepSeek, OpenAI

The app is now a **complete personal finance platform** with 30+ features, all privacy-first, all working offline!

---

## 📄 License

MIT

---

**FinVault** — *your money, your device, your rules.*
💎

Made with ❤️ for financial privacy.


---

## 🧠 AI Provider Setup

### Free-first recommendations
| Provider | Recommended Model | Notes |
|---|---|---|
| Groq | `llama-3.3-70b-versatile` | Very fast, great general finance parsing |
| Gemini | `gemini-2.0-flash-exp` | Strong reasoning, easy key setup |
| Cerebras | `llama-3.3-70b` | Fast inference |

### Supported model groups
FinVault already includes expanded model lists for:
- **Groq** (Llama, Gemma, DeepSeek Distill, Qwen)
- **Gemini** (2.0 flash/thinking, 1.5 flash/pro)
- **Cerebras** (Llama, Qwen, GLM, GPT-OSS)
- **Mistral** (Large, Small, Pixtral, Codestral)
- and more via OpenRouter / Together / OpenAI / DeepSeek

### Setup steps
1. Go to **Settings → AI Engine & Auto-Detect**
2. Add a provider
3. Paste API key
4. Pick model
5. Test provider
6. Enable provider
7. (Optional) Use **Auto-Detect Working Keys**
8. Review **AI Privacy Shield** settings

---

## ☁️ Firebase Cloud Sync Setup

Firebase is **optional**.

### Why use it?
- Cloud backup
- Multi-device continuity
- Your own Firebase project ownership

### Setup steps
1. Create project at [Firebase Console](https://console.firebase.google.com)
2. Add a **Web App**
3. Copy:
   - API key
   - Project ID
   - Auth domain
   - App ID
4. Enable **Firestore Database**
5. In FinVault open:
   **Settings → Firebase Cloud Sync**
6. Fill values
7. Click **Bind Firebase Keys & Sync**
8. Click **Test Connection**
9. Toggle sync ON if you want cloud mode

### Important privacy note
FinVault does **not** sync to any shared central FinVault server.
It syncs only to **your Firebase project**.

---

## ✍️ Transaction Input Methods

### 1. Manual Form
Use amount, category, description, date, receipt image.

### 2. AI Natural Input
Examples:
- `1200 rs mila jisme se 129 ka pen liya aur 459 ka book`
- `salary 45000 credited, rent 12000 paid, groceries 3500`
- `papa se 5000 mila aur 200 recharge`

### 3. Deterministic Offline Parser
Even without AI, FinVault understands patterns like:
- `aur`
- `and`
- `jisme se`
- `jis me se`
- `mein se`
- `+ / - signs`

### 4. Bank Statement CSV Import
See section below.

### 5. Bank SMS Parser
See section below.

---

## 🏦 CSV Bank Statement Import

Available in:
**Transactions page → CSV import icon**

### What it supports
- HDFC CSV
- SBI CSV
- ICICI CSV
- Axis CSV
- Generic CSV fallback

### Features
- Auto header detection
- Amount parsing
- Date parsing
- Category suggestion
- Duplicate detection
- Preview before import
- Editable category mapping before save

### Typical flow
1. Download statement CSV from bank portal
2. Open **Transactions**
3. Click **CSV Import** icon
4. Choose bank format
5. Upload CSV
6. Review parsed rows
7. Skip duplicates automatically
8. Import selected rows

---

## 📱 Bank SMS Parser

Available in:
**Transactions page → phone icon**

### Example supported SMS
```text
INR 450.00 debited from a/c **1234 at SWIGGY on 15-06-2026. Avl bal: Rs.12500
```

```text
Rs. 50000 credited to your account XX5678 from ACME CORP SALARY JUN 2026
```

### Extracts
- Amount
- Income/expense type
- Merchant/payee
- Account reference (masked in safe flows)
- Available balance (if present)
- Category suggestion

### Good for
- SBI alerts
- HDFC debit/credit alerts
- ICICI notifications
- Axis alerts
- UPI/Paytm/GPay/PhonePe-style messages

---

## 🧾 Receipt Generator

FinVault receipts are now **colorful, themeable, and export-safe**.

### 5 receipt themes
- Modern
- Classic
- Minimal
- Sunset
- Midnight

### Features
- Gradient header
- Merchant name customization
- QR code toggle
- Watermark toggle
- Custom note
- Receipt image preview
- Amount in words
- PDF / Image / Print / Share / Email / Copy

### Important improvement
The receipt preview and download are now aligned more closely, so the downloaded output reflects the visual design better.

---

## 📦 Advanced Finance Modules

Available in **More**:

### Accounts & Wallets
- Cash, bank, wallet, crypto, investment accounts
- Transfers between accounts
- Net total balance view

### Budgets
- Weekly / monthly / yearly budgets
- Category budgets
- Rollover option
- Progress + alerting

### Savings Goals
- Goal targets
- Progress tracking
- Contribute manually
- Milestone-style progression

### Investments
- Stocks / MF / crypto / gold / FD / PPF / real estate
- Buy vs current price
- P&L and asset allocation

### Debts & Loans
- Outstanding principal
- EMI amount
- Interest rate
- Payment recording

### Recurring Transactions
- Daily / weekly / monthly / yearly rules
- Auto-execution on load when due

### Bill Reminders
- Due-date reminders
- Browser notifications
- Recurring bill cadence

### Tags & Hashtags
- Custom tags
- Auto-detect hashtags from descriptions

### Advanced Search
- Query + category + amount + date range filters
- Sort controls
- CSV export

### Net Worth Dashboard
- Assets vs liabilities
- 12-month trend
- 5-year projection
- asset allocation

### Indian Tax Estimator
- Old vs new regime comparison
- 80C / 80D / HRA / 24(b) / NPS / more
- best regime suggestion

---

## ⌨️ Keyboard Shortcuts

Press `?` anytime to open the shortcut help panel.

### Available shortcuts
- `G` then `D` → Dashboard
- `G` then `T` → Transactions
- `G` then `R` → Reports
- `G` then `M` → More
- `G` then `S` → Settings
- `N` → New Transaction event
- `Ctrl + K` → Search event
- `Esc` → Close help / blur active input

---

## 📱 PWA / Install as App

FinVault now includes:
- `manifest.json`
- service worker (`public/sw.js`)
- install icons
- standalone app metadata

### Benefits
- Install on mobile/desktop home screen
- Faster reloads
- Better offline availability
- Native-app-like launch experience

### Install steps
**Chrome / Edge desktop:**
- Open app
- Click install icon in address bar

**Android Chrome:**
- Open app
- Browser menu → Add to Home Screen

---

## 🚀 Deployment Guide

### Static Hosting
```bash
npm run build
```
Deploy `dist/` to:
- Netlify
- Vercel
- Cloudflare Pages
- GitHub Pages

### Docker
```bash
docker build -t finvault .
docker run -p 8080:80 finvault
```

### Local file mode
Because the build is static, you can also host it with simple static servers.

---

## 📁 Project Structure

```text
src/
  components/
    AddTransactionModal.tsx
    AIAssistantPanel.tsx
    AIEngineConsole.tsx
    AIPrivacySettings.tsx
    AISettings.tsx
    AINaturalInput.tsx
    Accounts.tsx
    AdvancedSearch.tsx
    BankSMSParser.tsx
    BankStatementImport.tsx
    BillReminders.tsx
    Budgets.tsx
    CategoryLimits.tsx
    DebtTracker.tsx
    FirebaseSyncEngine.tsx
    Goals.tsx
    Investments.tsx
    Layout.tsx
    More.tsx
    ReceiptModal.tsx
    RecurringManager.tsx
    StatCard.tsx
    TagManager.tsx
    Toggle.tsx
  contexts/
  hooks/
    useKeyboardShortcuts.tsx
    useTransactions.ts
  lib/
    aiProviders.ts
    crypto.ts
    db.ts
    firebase.ts
  pages/
    Dashboard.tsx
    Login.tsx
    Reports.tsx
    Settings.tsx
    Transactions.tsx
```

---

## 🩺 Troubleshooting

### Firebase test passes but sync is still off
- Make sure you also enable the sync toggle
- Ensure Firestore is enabled in your Firebase project
- Re-check project ID / API key pairing

### AI not responding
- Confirm provider is enabled
- Confirm API key is valid
- Try another model/provider
- If all fail, local assistant fallback will still work for many summary prompts

### CSV import parsed wrong columns
- Select the correct bank format before import
- Use generic mode if your bank export is custom

### SMS parser missed merchant
- Merchant extraction depends on SMS wording
- If merchant is unclear, parser still saves the amount and type

### PWA install option not visible
- Must be served over `http://localhost` or `https://`
- Some browsers require a few visits before showing install UI

### No browser bill notifications
- Enable notification permission in browser
- Make sure site notifications are not blocked

### Receipt download differs slightly from preview
- PDF and image export are matched as closely as possible, but browser/font rendering can vary slightly across platforms

---

## ✅ Current Production Readiness Summary

FinVault now includes:
- privacy-safe AI everywhere
- AI privacy shield controls
- CSV import
- SMS parser
- receipts with multiple themes
- bank sync UI
- tax estimator
- net worth dashboard
- advanced search
- more finance modules
- PWA support
- keyboard shortcuts
- no tracking scripts

---

## 📄 License

MIT

---

**FinVault** — *your money, your device, your rules.*
