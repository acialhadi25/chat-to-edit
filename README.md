# ChaTtoEdit - AI Copilot for Excel

Your intelligent Excel assistant that understands natural language. Built with React, TypeScript, Supabase, and powered by AI to help you work with spreadsheets faster and smarter.

## 🎯 Overview

ChaTtoEdit provides four powerful Excel tools:
- **Chat to Excel** - Create formulas, clean data, transform, sort, filter spreadsheets via natural language
- **Merge Excel** - Combine multiple Excel files or sheets with intelligent column mapping
- **Split Excel** - Split large spreadsheets by column values or row count
- **Data Entry Form** - Generate custom data entry forms with AI assistance

## 🏗️ Project Architecture

### Core Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Spreadsheet Engine**: FortuneSheet (Luckysheet fork)
- **Styling**: Tailwind CSS + shadcn-ui components
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **AI Integration**: DeepSeek API / Lovable AI Gateway
- **File Processing**: xlsx, xlsx-js-style libraries
- **State Management**: TanStack Query + React Hooks

### Project Structure
```
src/
├── pages/              # Route pages (Excel, Merge, Split, Data Entry, Auth)
├── components/
│   ├── dashboard/     # Excel tool components
│   ├── ui/            # shadcn-ui components
│   └── landing/       # Marketing pages
├── hooks/             # Custom React hooks (useAuth, useProfile, useChatHistory)
├── utils/             # Utilities (Excel operations, streaming chat, formulas)
├── types/             # TypeScript definitions
├── integrations/      # Supabase client setup
└── lib/              # Helper functions

supabase/
├── functions/         # Edge functions (chat for AI integration)
└── migrations/        # Database schema migrations
```

## ⚙️ Environment Setup

### Required Environment Variables
Create a `.env` file in the project root with:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=your_project_id

# Sentry Configuration (Optional - for error tracking and performance monitoring)
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id

# Note: LOVABLE_API_KEY is set in Supabase function environment (not in .env)
```

See `.env.example` for a complete template.

### Getting Supabase Credentials
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Project Settings > API
4. Copy `Project URL` and `anon public key`
5. Paste into `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

### Setting Up Supabase Edge Functions
1. Deploy edge function:
   ```bash
   supabase functions deploy chat
   ```

2. Set LOVABLE_API_KEY in Supabase function environment:
   ```bash
   supabase secrets set LOVABLE_API_KEY="your_lovable_api_key"
   ```

### Database Schema
The app uses the following tables (deployed via Supabase Power):
- `profiles` - User profiles with subscription management (free/pro/enterprise)
- `file_history` - File upload history with metadata
- `chat_history` - Chat conversation history with AI
- `templates` - Custom Excel templates (public/private)
- `payments` - Payment transactions via Midtrans

All tables have Row Level Security (RLS) enabled for data protection.

## 🚀 Getting Started

### Quick Start

```bash
# Clone repository
git clone <YOUR_GIT_URL>
cd chat-to-edit

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### First Time Setup

1. **Register Account**: Create account at http://localhost:5173
2. **Upload Excel**: Drag & drop or click to upload .xlsx, .xls, or .csv
3. **Use AI Chat**: Type natural language commands
4. **Apply Changes**: Review and apply AI suggestions

See `QUICK_START.md` for detailed guide.

### Build for Production
```bash
npm run build
npm run preview
```

## 📋 Feature Status

### ✅ Fully Implemented

#### Chat to Excel
- **30+ Excel Operations**: Formulas (SUM, AVERAGE, VLOOKUP, IF, etc.), data cleansing, transforms
- **Data Management**: Sort, filter, find & replace, remove duplicates, fill down
- **Column Operations**: Add, delete, rename, split, merge, copy
- **Row Operations**: Add, delete, remove empty rows
- **Advanced Features**: Conditional formatting, statistics, pivot summaries, chart creation
- **Formula Support**: Insert formulas with AI assistance, evaluate complex formulas
- **Undo/Redo**: Full history support with Ctrl+Z and Ctrl+Y
- **Multi-sheet Support**: Work with multiple sheets in one workbook

#### Merge Excel
- **Multi-file Merge**: Combine multiple Excel files into one
- **Sheet Consolidation**: Merge sheets from different files
- **Column Mapping**: Automatic and manual column alignment
- **Format Preservation**: Maintain original formatting

#### Split Excel
- **Split by Column**: Separate data based on column values
- **Split by Row Count**: Divide large files into smaller chunks
- **Custom Rules**: Define your own splitting logic
- **Batch Export**: Generate multiple files at once

#### Data Entry Form Builder
- **AI Form Generation**: Describe your needs, AI creates the form
- **Manual Builder**: Visual form designer with drag & drop
- **Field Types**: Text, number, date, select, textarea, checkbox
- **Validation**: Required fields, custom validation rules
- **Excel Export**: Generate ready-to-use Excel forms

#### General Features
- **Chat Interface**: Natural language commands with streaming AI responses
- **Prompt Examples**: 100+ pre-built examples for common tasks
- **Authentication**: Secure login with Supabase Auth
- **File History**: Track all processed files
- **Chat Persistence**: Save and load previous conversations

### 🔄 In Progress / Planned
- Advanced chart customization
- Excel template library
- Collaboration features (share, comments)
- Workflow automation
- Mobile-responsive UI improvements
- Payment integration and usage tracking

## 🔌 Integration Points

### AI Service (Lovable Gateway)
The app communicates with AI via Lovable's managed gateway:

```
Frontend (React)
  ↓ HTTP POST to Supabase Edge Function
  ↓
Supabase Edge Function
  ↓ HTTP POST to https://ai.gateway.lovable.dev/v1/chat/completions
  ↓
Lovable AI Gateway (using Google Gemini 3 Flash)
  ↓ Streams SSE response back
  ↓
Frontend parses streaming JSON
  ↓
Apply action & update UI
```

**Requirements**:
- Valid LOVABLE_API_KEY in Supabase function environment
- Active Lovable subscription with available credits

### Supabase Services
1. **Authentication**: Email/password, OAuth providers
2. **Database**: PostgreSQL for profiles, file_history, chat_history
3. **Row Level Security (RLS)**: Users can only access their own data
4. **Real-time Subscriptions**: Profile updates propagate in real-time
5. **Edge Functions**: Serverless functions for AI proxying

## 🎨 Key Components

### Chat Interfaces
- **ChatInterface**: Excel chat with formula suggestions and streaming AI responses
- **ExcelPromptExamples**: 100+ categorized prompt examples for common Excel tasks

### File Processors
- **src/utils/excelOperations.ts**: Comprehensive Excel operations (30+ functions)
- **src/utils/formulas/**: Formula evaluation engine with support for Excel functions
- **src/utils/streamChat.ts**: AI response streaming handler

### Custom Hooks
- `useAuth()` - Authentication state management
- `useProfile()` - User profile with realtime updates
- `useChatHistory()` - Persist/load chat messages
- `useFileHistory()` - Track processed files
- `useUndoRedo()` - Edit history with undo/redo support

## 🧪 Testing Recommendations

### Test Prompt Examples
Test the AI-powered features with these examples:

**Chat to Excel Examples**:
- "Calculate weighted average of values based on weights"
- "Sort by Region (A-Z) and then by Salary (highest to lowest)"
- "Create pivot table showing Total Sales by Region and Month"
- "Remove all duplicate rows based on Email column"
- "Split Full Name column into First Name and Last Name"

**Merge Excel Examples**:
- Upload 3 files with similar structure and merge them
- Merge sheets from different files with different column orders
- Test automatic column mapping accuracy

**Split Excel Examples**:
- Split a 1000-row file by Department column
- Split into files of 100 rows each
- Test custom split rules

**Data Entry Form Examples**:
- "Create form for employee data: name, age, department, salary, join date"
- "Make registration form with email, phone, address"
- Test AI form generation with various field types

### Testing Procedure
1. Upload test Excel files (various sizes and formats)
2. Click prompt example or type custom command
3. Verify AI response is generated correctly
4. Apply suggested action
5. Verify file is correctly modified
6. Check download works properly
7. Test undo/redo functionality

## 🐛 Known Issues & Limitations

1. **Large Files**: Client-side processing loads entire files into memory. Large files (>100MB) may cause memory issues. Consider server-side processing for production.

2. **JSON Parsing**: AI response parsing assumes Lovable gateway returns proper JSON format. Malformed responses may cause parsing errors (partially handled with fallback).

3. **Payment System**: References to "credits" and payment in UI, but actual payment integration not yet implemented.

4. **Mobile Responsiveness**: Primarily tested on desktop. Mobile UI needs polish.

## 📊 Technology Details

### Excel Processing (xlsx library)
- Parse .xlsx and .xls files
- Insert formulas (SUM, AVERAGE, IF, VLOOKUP, and 30+ more)
- Apply data transforms (uppercase, lowercase, titlecase)
- Find and replace with regex support
- Sort and filter with multiple operators
- Remove duplicates and empty rows
- Merge/split columns
- Conditional formatting
- Chart creation
- Formula evaluation engine
- Multi-sheet support
- Style preservation on export

## 🔐 Security Considerations

- **Supabase RLS**: All database queries filtered by user_id
- **Auth Tokens**: Stored in localStorage, auto-refresh enabled
- **Lovable API Key**: Stored only in Supabase function environment, never exposed to frontend
- **CORS**: Enabled for Supabase endpoints

**Recommendations for Production**:
- Implement CSRF protection
- Add rate limiting
- Sanitize file uploads
- Implement CSP headers
- Regular security audit

## 📈 Monitoring & Debugging

### Sentry Integration (Performance Monitoring)

The app includes Sentry integration for error tracking and performance monitoring:

**Features**:
- **Error Tracking**: Automatic error capture with stack traces
- **Performance Monitoring**: Track Core Web Vitals (LCP, FID, CLS)
- **Custom Metrics**: Excel operation performance tracking
- **Session Replay**: Debug issues with session recordings
- **PII Protection**: Automatically filters out sensitive data

**Setup**:
1. Create a Sentry account at [sentry.io](https://sentry.io)
2. Create a new project (React)
3. Copy your DSN from Project Settings > Client Keys
4. Add to `.env`: `VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id`
5. Restart dev server

**Note**: Sentry is optional. If `VITE_SENTRY_DSN` is not set, the app will run normally without monitoring.

**Tracked Metrics**:
- Core Web Vitals (LCP, FID, CLS)
- Excel operation duration and performance
- Error rates and stack traces
- User interactions and breadcrumbs

### Browser Console
- Check console for detailed error logs from useProfile, streaming operations
- Monitor network tab for Supabase/Lovable gateway calls

### Supabase Dashboard
- View logs from edge functions
- Monitor database queries and RLS policy hits
- Check realtime subscriptions

### Common Issues
1. **"Profile fetch error"**: Profile doesn't exist yet (expected) - app uses defaults
2. **AI gateway 402 error**: Out of Lovable API credits
3. **"Failed to fetch" errors**: Network issues or LOVABLE_API_KEY not set in Supabase
4. **Streaming timeout**: Large responses or slow connection - check network tab

## 📚 Documentation

### For Developers
- See `src/components/*/` for component-specific documentation
- Check `src/utils/` for utility function signatures
- Review `supabase/functions/` for AI integration details

### For Users
- In-app help appears in chat panels
- Prompt examples provide quick-start options
- Error messages guide users on next steps

## 🤝 Contributing

This project is actively being developed. Current focus areas:
1. Advanced Excel features (macros, advanced pivot tables)
2. Excel template library
3. Collaboration features (share, comments)
4. Workflow automation
5. Mobile UI optimization
6. Payment system implementation

## 📄 License

ChaTtoEdit is provided as-is for evaluation and development purposes.

## 🆘 Support

For issues or questions:
1. Check browser console for detailed error logs
2. Review Supabase function logs
3. Verify VITE_SUPABASE_* and LOVABLE_API_KEY are correctly configured
4. Check network requests in DevTools

## 📖 Additional Documentation

- `QUICK_START.md` - Quick start guide for users
- `IMPLEMENTATION_STATUS.md` - Technical implementation details
- `SUPABASE_SETUP.md` - Supabase backend setup guide
- `SUPABASE_INTEGRATION_COMPLETE.md` - Integration status
- `CODE_SPLITTING.md` - Code splitting strategy
- `CONTRIBUTING.md` - Contribution guidelines

## 🎉 Recent Updates

### v1.1.0 (February 2026)
- ✅ Integrated FortuneSheet for better spreadsheet experience
- ✅ Migrated to new Supabase backend with full control
- ✅ Added template system (save/load custom templates)
- ✅ Improved database schema with RLS policies
- ✅ Added subscription management (free/pro/enterprise)
- ✅ Enhanced TypeScript types for type safety
- ✅ Optimized build size and performance

---

**Last Updated**: February 19, 2026
**Version**: 1.1.0
**Status**: Production Ready
