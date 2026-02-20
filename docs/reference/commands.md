# 🎯 Commands Reference - Chat to Excel

Quick reference untuk semua commands yang tersedia dalam aplikasi.

---

## 📦 NPM Scripts

```bash
# Development
npm run dev                    # Start development server
npm run build                  # Build for production
npm run preview                # Preview production build
npm run build:dev              # Build in development mode

# Testing
npm run test                   # Run unit tests
npm run test:watch             # Run tests in watch mode
npm run test:e2e               # Run E2E tests with Playwright
npm run test:e2e:ui            # Run E2E tests with UI
npm run test:e2e:debug         # Debug E2E tests
npm run test:supabase          # Test Supabase connection

# Code Quality
npm run lint                   # Run ESLint
npm run format                 # Format code with Prettier
npm run format:check           # Check code formatting
```

---

## 🗄️ Supabase CLI Commands

```bash
# Setup
npx supabase login                              # Login to Supabase
npx supabase link --project-ref PROJECT_ID      # Link to project
npx supabase init                               # Initialize Supabase

# Database
npx supabase db push                            # Push migrations
npx supabase db pull                            # Pull remote changes
npx supabase db diff                            # Show schema differences
npx supabase migration fetch --yes              # Fetch remote migrations

# Types
npx supabase gen types typescript --linked      # Generate TypeScript types
npx supabase gen types typescript --linked > src/integrations/supabase/types.gen.ts

# Edge Functions
npx supabase functions deploy chat              # Deploy chat function
npx supabase functions deploy chat-docs         # Deploy chat-docs function
npx supabase functions deploy chat-pdf          # Deploy chat-pdf function
npx supabase secrets set KEY=value              # Set function secrets

# Status
npx supabase projects list                      # List projects
npx supabase status                             # Show local status
```

---

## 🔧 Supabase Power Commands (via Kiro)

### List Tables
```typescript
await kiroPowers.use({
  powerName: "supabase-hosted",
  serverName: "supabase",
  toolName: "list_tables",
  arguments: { project_id: "iatfkqwwmjohrvdfnmwm" }
});
```

### Apply Migration
```typescript
await kiroPowers.use({
  powerName: "supabase-hosted",
  serverName: "supabase",
  toolName: "apply_migration",
  arguments: {
    name: "migration_name",
    project_id: "iatfkqwwmjohrvdfnmwm",
    query: "CREATE TABLE ..."
  }
});
```

### Get Advisors
```typescript
await kiroPowers.use({
  powerName: "supabase-hosted",
  serverName: "supabase",
  toolName: "get_advisors",
  arguments: { project_id: "iatfkqwwmjohrvdfnmwm" }
});
```

---

## 💬 AI Chat Commands

### Data Cleaning
```
"Remove empty rows"
"Remove duplicate rows"
"Remove duplicate rows based on column A"
"Trim whitespace from all cells"
"Fix inconsistent capitalization in column B"
"Remove special characters from column C"
"Clean phone numbers in column D"
```

### Data Transformation
```
"Convert column A to uppercase"
"Convert column B to lowercase"
"Convert column C to title case"
"Extract numbers from column D"
"Extract text from column E"
"Split column F by comma"
"Split Full Name into First Name and Last Name"
"Merge columns G and H with space"
"Concatenate columns I and J"
```

### Formulas
```
"Add SUM formula to column K"
"Calculate average of column L"
"Add IF formula to check if column M > 100"
"Create VLOOKUP formula"
"Add COUNTIF formula"
"Calculate percentage in column N"
"Add date calculation"
"Create running total in column O"
```

### Sorting & Filtering
```
"Sort by column A ascending"
"Sort by column B descending"
"Sort by Region (A-Z) then by Salary (highest to lowest)"
"Filter rows where column C > 1000"
"Filter rows where column D contains 'Active'"
"Show only rows where column E is not empty"
```

### Column Operations
```
"Add a new column called 'Total'"
"Delete column F"
"Rename column G to 'Revenue'"
"Copy column H to column I"
"Move column J before column K"
"Hide column L"
"Unhide column M"
```

### Row Operations
```
"Add a new row at the top"
"Delete row 5"
"Delete rows 10 to 20"
"Insert 3 rows after row 15"
"Remove empty rows"
"Duplicate row 8"
```

### Data Analysis
```
"Run data quality audit"
"Generate business insights"
"Calculate statistics for column N"
"Create pivot summary by Region and Product"
"Show me data patterns"
"Find outliers in column O"
"Calculate correlation between columns P and Q"
```

### Conditional Formatting
```
"Highlight cells in column R > 1000 in green"
"Highlight duplicate values in column S"
"Color code column T based on status"
"Apply data bars to column U"
"Highlight top 10 values in column V"
```

### Advanced Operations
```
"Create chart showing sales by month"
"Generate ID column with format 'EMP-001'"
"Fill down formula from row 2 to row 100"
"Find and replace 'old' with 'new'"
"Remove duplicates keeping first occurrence"
"Transpose data"
"Unpivot columns W, X, Y"
```

---

## 🗃️ Database Queries

### Profiles
```typescript
// Get current user profile
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

// Update profile
await supabase
  .from('profiles')
  .update({ full_name: 'John Doe' })
  .eq('id', userId);

// Check credits
const { data } = await supabase
  .from('profiles')
  .select('credits_remaining')
  .eq('id', userId)
  .single();
```

### File History
```typescript
// Get user's files
const { data } = await supabase
  .from('file_history')
  .select('*')
  .eq('user_id', userId)
  .order('uploaded_at', { ascending: false });

// Save file record
await supabase
  .from('file_history')
  .insert({
    user_id: userId,
    file_name: 'data.xlsx',
    row_count: 100,
    sheet_count: 1
  });
```

### Chat History
```typescript
// Get chat history
const { data } = await supabase
  .from('chat_history')
  .select('*')
  .eq('user_id', userId)
  .eq('file_history_id', fileId)
  .order('created_at', { ascending: true });

// Save message
await supabase
  .from('chat_history')
  .insert({
    user_id: userId,
    file_history_id: fileId,
    role: 'user',
    content: 'Remove duplicates'
  });
```

### Templates
```typescript
// Get public templates
const { data } = await supabase
  .from('templates')
  .select('*')
  .eq('is_public', true)
  .order('usage_count', { ascending: false });

// Save template
await supabase
  .from('templates')
  .insert({
    user_id: userId,
    name: 'Sales Report',
    category: 'Business',
    headers: ['Date', 'Product', 'Amount'],
    sample_data: {},
    is_public: false
  });
```

---

## 🔑 Environment Variables

### Development (.env)
```env
VITE_SUPABASE_URL=https://iatfkqwwmjohrvdfnmwm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=iatfkqwwmjohrvdfnmwm
VITE_SENTRY_DSN=your_sentry_dsn
DEEPSEEK_API_KEY=your_deepseek_key
VITE_MIDTRANS_CLIENT_KEY=your_midtrans_key
VITE_MIDTRANS_IS_PRODUCTION=false
```

### Production (.env.production)
```env
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_prod_publishable_key
VITE_SUPABASE_ANON_KEY=your_prod_anon_key
VITE_SUPABASE_PROJECT_ID=your_prod_project_id
VITE_SENTRY_DSN=your_sentry_dsn
VITE_MIDTRANS_CLIENT_KEY=your_prod_midtrans_key
VITE_MIDTRANS_IS_PRODUCTION=true
```

---

## 🚀 Deployment Commands

### Vercel
```bash
# Install CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add VITE_SUPABASE_URL
```

### Netlify
```bash
# Install CLI
npm i -g netlify-cli

# Deploy
netlify deploy

# Deploy to production
netlify deploy --prod

# Set environment variables
netlify env:set VITE_SUPABASE_URL value
```

---

## 🧪 Testing Commands

### Unit Tests
```bash
# Run all tests
npm run test

# Run specific test file
npm run test src/utils/excelOperations.test.ts

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test -- --coverage
```

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test
npm run test:e2e tests/excel-workflow.spec.ts

# Run with UI
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Mobile tests
npm run test:e2e:mobile
```

---

## 🔍 Debugging Commands

### Browser DevTools
```javascript
// In browser console

// Get Supabase client
const supabase = window.supabase;

// Check auth status
await supabase.auth.getSession();

// Test query
await supabase.from('profiles').select('*');

// Check FortuneSheet instance
const luckysheet = window.luckysheet;
luckysheet.getAllSheets();
```

### Node.js Debugging
```bash
# Debug with Node inspector
node --inspect-brk node_modules/.bin/vite

# Debug tests
node --inspect-brk node_modules/.bin/vitest
```

---

## 📊 Monitoring Commands

### Lighthouse
```bash
# Run Lighthouse audit
npx lighthouse http://localhost:5173 --view

# Run specific audits
npx lighthouse http://localhost:5173 --only-categories=performance,accessibility
```

### Bundle Analysis
```bash
# Analyze bundle size
npx vite-bundle-visualizer

# Check dependencies
npm ls
npm outdated
```

---

## 🛠️ Maintenance Commands

### Updates
```bash
# Update dependencies
npm update

# Update specific package
npm update @supabase/supabase-js

# Check for outdated packages
npm outdated

# Update to latest versions
npx npm-check-updates -u
npm install
```

### Cleanup
```bash
# Clear cache
rm -rf node_modules dist .vite
npm install

# Clear Supabase cache
rm -rf supabase/.temp

# Reset database (careful!)
npx supabase db reset
```

---

## 📚 Documentation Commands

### Generate Docs
```bash
# Generate TypeDoc
npx typedoc --out docs src

# Generate API docs
npx swagger-jsdoc -d swaggerDef.js -o swagger.json
```

---

## 🎯 Quick Actions

### Start Fresh
```bash
rm -rf node_modules dist
npm install
npm run dev
```

### Deploy to Production
```bash
npm run build
npm run test
vercel --prod
```

### Update Database Schema
```bash
# Make changes via Supabase Power
npx supabase migration fetch --yes
npx supabase gen types typescript --linked > src/integrations/supabase/types.gen.ts
```

---

**Last Updated:** February 19, 2026  
**Version:** 1.1.0
