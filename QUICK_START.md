# 🚀 Quick Start Guide - Chat to Excel

## Prerequisites

- Node.js 18+ installed
- npm or bun package manager
- Supabase account (already configured)

## Installation

```bash
# Clone repository
git clone <your-repo-url>
cd chat-to-edit

# Install dependencies
npm install
# or
bun install

# Setup environment variables
# .env file already configured with Supabase credentials
```

## Development

```bash
# Start development server
npm run dev

# Open browser at http://localhost:5173
```

## First Time Setup

### 1. Register Account
1. Go to http://localhost:5173
2. Click "Register" or "Get Started"
3. Enter email and password
4. Profile will be created automatically

### 2. Upload Excel File
1. Click "Upload Excel" or drag & drop file
2. Supported formats: .xlsx, .xls, .csv
3. File will be displayed in FortuneSheet

### 3. Use AI Chat
1. Type natural language commands
2. Examples:
   - "Remove duplicate rows"
   - "Sort by column A ascending"
   - "Add a formula to calculate total"
   - "Find and replace 'old' with 'new'"
   - "Generate business insights"

### 4. Apply AI Suggestions
1. AI will suggest changes
2. Review changes (highlighted in yellow)
3. Click "Apply" to accept or "Reject" to decline
4. Use Undo/Redo if needed

## Features Overview

### 📊 Excel Operations
- Upload/Download Excel files
- Edit cells, rows, columns
- Apply formulas
- Sort and filter data
- Remove duplicates
- Conditional formatting
- Data cleansing

### 🤖 AI Features
- Natural language commands
- Data quality audit
- Business insights
- Automatic data cleansing
- Formula suggestions
- Data transformation

### 📝 Templates
- Browse template gallery
- Apply pre-built templates
- Save custom templates
- Share templates (public/private)

### 📜 History
- File upload history
- Chat conversation history
- Undo/Redo operations
- Action tracking

### 💳 Subscription
- Free tier: 100 credits
- Pro tier: Unlimited credits
- Enterprise tier: Custom features

## Common Commands

### Data Cleaning
```
"Remove empty rows"
"Remove duplicate rows"
"Trim whitespace from all cells"
"Fix inconsistent capitalization"
"Remove special characters"
```

### Data Transformation
```
"Convert column A to uppercase"
"Extract numbers from column B"
"Split column C by comma"
"Merge columns D and E"
"Add a new column with formula"
```

### Data Analysis
```
"Run data quality audit"
"Generate business insights"
"Calculate statistics for column A"
"Create pivot summary"
"Show me data patterns"
```

### Formulas
```
"Add SUM formula to column E"
"Calculate average of column B"
"Add IF formula to check values"
"Create VLOOKUP formula"
"Add date calculation"
```

## Keyboard Shortcuts

- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo
- `Ctrl+S` - Save (coming soon)
- `Ctrl+F` - Find (in spreadsheet)
- `Ctrl+H` - Find & Replace (in spreadsheet)

## Tips & Tricks

### 1. Use Templates
Start with a template to save time. Browse the template gallery for common use cases.

### 2. Be Specific
The more specific your command, the better the AI can help:
- ❌ "Clean data"
- ✅ "Remove duplicate rows based on column A and B"

### 3. Review Before Applying
Always review AI suggestions before applying. Changes are highlighted in yellow.

### 4. Use Undo/Redo
Made a mistake? Use Undo (Ctrl+Z) to revert changes.

### 5. Save as Template
Created something useful? Save it as a template for future use.

## Troubleshooting

### Issue: File won't upload
**Solution:**
- Check file format (.xlsx, .xls, .csv)
- Check file size (max 10MB)
- Try converting to .xlsx format

### Issue: AI not responding
**Solution:**
- Check internet connection
- Refresh page
- Check if you have credits remaining

### Issue: Changes not applying
**Solution:**
- Click "Apply" button
- Check if action is valid
- Try refreshing the page

### Issue: Can't login
**Solution:**
- Check email and password
- Try "Forgot Password"
- Clear browser cache

## Support

For issues or questions:
1. Check this guide
2. Check `IMPLEMENTATION_STATUS.md` for technical details
3. Check `SUPABASE_SETUP.md` for backend setup
4. Contact support (if available)

## Next Steps

1. ✅ Upload your first Excel file
2. ✅ Try AI commands
3. ✅ Save a template
4. ✅ Explore all features
5. ✅ Upgrade to Pro (optional)

---

**Happy Spreadsheeting! 🎉**
