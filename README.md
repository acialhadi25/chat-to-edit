# ChaTtoEdit - AI-Powered Document Assistant

A sophisticated multi-tool application for intelligently editing **PDFs**, **Excel spreadsheets**, and **Word documents** using AI-powered conversational interfaces. Built with React, TypeScript, Supabase, and integrated with Lovable AI Gateway.

## 🎯 Overview

ChaTtoEdit provides three specialized AI assistants:
- **Chat to PDF** - Extract, merge, split, rotate, watermark PDFs with natural language commands
- **Chat to Excel** - Create formulas, clean data, transform, sort, filter spreadsheets via chat
- **Chat to Docs** - Write, rewrite, translate, summarize, format Word documents conversationally

## 🏗️ Project Architecture

### Core Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn-ui components
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **AI Integration**: Lovable AI Gateway (Google Gemini 3 Flash)
- **File Processing**: pdf-lib, xlsx, docx libraries

### Project Structure
```
src/
├── pages/              # Route pages (Dashboard, PDF, Excel, Docs, Auth)
├── components/
│   ├── pdf/           # PDF tool components
│   ├── docs/          # Docs tool components
│   ├── dashboard/     # Excel tool components
│   ├── ui/            # shadcn-ui components
│   └── landing/       # Marketing pages
├── hooks/             # Custom React hooks (useAuth, useProfile, useChatHistory)
├── utils/             # Utilities (PDF ops, Excel ops, streaming chat)
├── types/             # TypeScript definitions
├── integrations/      # Supabase client setup
└── lib/              # Helper functions

supabase/
├── functions/         # Edge functions (chat-pdf, chat-docs, chat)
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

# Note: LOVABLE_API_KEY is set in Supabase function environment (not in .env)
```

### Getting Supabase Credentials
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Project Settings > API
4. Copy `Project URL` and `anon public key`
5. Paste into `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

### Setting Up Supabase Edge Functions
1. Deploy edge functions:
   ```bash
   supabase functions deploy chat-pdf
   supabase functions deploy chat-docs
   supabase functions deploy chat
   ```

2. Set LOVABLE_API_KEY in Supabase function environment:
   ```bash
   supabase secrets set LOVABLE_API_KEY="your_lovable_api_key"
   ```

### Database Schema
The app automatically creates required tables via migrations:
- `profiles` - User profile, plan, monthly file usage
- `file_history` - Processed files metadata
- `chat_history` - Chat messages for persistence

## 🚀 Getting Started

### Installation
```bash
# Clone repository
git clone <YOUR_GIT_URL>
cd chattoedit

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Build for Production
```bash
npm run build
npm run preview
```

## 📋 Feature Status

### ✅ Fully Implemented
- **PDF Operations**: Extract, merge, split, delete, rotate, watermark pages
- **Excel Operations**: Formulas, data cleansing, transforms, sort, filter, split/merge columns
- **Docs Editing**: Write, rewrite, grammar check, translate, summarize, tone adjustment
- **Chat Interface**: Streaming responses with real-time updates
- **Prompt Examples**: 230+ categorized examples across all tools
- **Authentication**: Supabase Auth with email/password and OAuth
- **History**: File history and chat persistence
- **Undo/Redo**: Full history support for all edits

### ⚠️ Partial Implementation
- **PDF Text Extraction**: Currently returns placeholder (requires pdfjs-dist integration)
- **PDF to Image**: Partially implemented (requires completion)

### 🔄 In Progress / Planned
- Visual merge preview with page thumbnails
- Batch operations (queue multiple edits)
- Advanced error handling for AI gateway
- Mobile-responsive UI polish
- Payment integration and credit system

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
- **PdfChatInterface**: Chat for PDF operations with streaming responses
- **ChatInterface**: Excel chat with formula suggestions
- **DocsChatInterface**: Document editing chat

### File Processors
- **src/utils/pdfOperations.ts**: PDF manipulation (extract, merge, rotate, watermark)
- **src/utils/excelOperations.ts**: Spreadsheet operations (formulas, filters, transforms)
- **src/utils/streamChat*.ts**: AI response streaming handlers

### Custom Hooks
- `useAuth()` - Authentication state management
- `useProfile()` - User profile with realtime updates
- `useChatHistory()` - Persist/load chat messages
- `useFileHistory()` - Track processed files
- `useUndoRedo()` / `useDocsUndoRedo()` - Edit history

## 🧪 Testing Recommendations

### Test Prompt Examples
The new prompt examples added should be tested:

**PDF Merge Examples**:
- "Merge pages 3-4 from File A with pages 12-13 from File B"
- "Merge first 5 pages of File A and last 3 pages of File B"
- "Extract pages 1, 5, 10 from File A and merge with pages 2-4 from File B"

**Excel Examples**:
- "Calculate weighted average of values based on weights"
- "Sort by Region (A-Z) and then by Salary (highest to lowest)"
- "Create pivot table showing Total Sales by Region and Month"

**Docs Examples**:
- "Convert this to a professional case study format"
- "Create a whitepaper with executive summary"
- "Format as FAQ with questions and answers"

### Testing Procedure
1. Upload multiple test files (PDFs, Excel, DOCX)
2. Click prompt example in chat
3. Verify AI response is generated
4. Apply suggested action
5. Verify file is correctly modified
6. Check download works properly

## 🐛 Known Issues & Limitations

1. **PDF Text Extraction**: Currently returns placeholder message. Requires pdfjs-dist integration to properly extract text content from PDFs.

2. **Large Files**: Client-side processing loads entire files into memory. Large files (>100MB) may cause memory issues. Consider server-side processing for production.

3. **JSON Parsing**: AI response parsing assumes Lovable gateway returns proper JSON format. Malformed responses may cause parsing errors (partially handled with fallback).

4. **Payment System**: References to "credits" and payment in UI, but actual payment integration not yet implemented.

5. **Mobile Responsiveness**: Primarily tested on desktop. Mobile UI needs polish.

## 📊 Technology Details

### PDF Processing (pdf-lib)
- Extract specific pages or ranges
- Merge multiple PDFs
- Rotate pages
- Add watermarks with custom text
- Split PDFs into individual pages
- Reorder pages

**Limitations**: No compression, no image conversion (yet), text extraction is placeholder

### Excel Processing (xlsx library)
- Parse .xlsx files
- Insert formulas (SUM, AVERAGE, IF, VLOOKUP, etc.)
- Apply data transforms
- Find and replace
- Sort and filter
- Remove duplicates
- Merge/split columns

### Document Processing (docx library)
- Parse .docx files
- Edit content
- Preserve formatting
- Export to PDF/Markdown
- Undo/redo support

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
1. Complete PDF text extraction implementation
2. Improve AI response parsing robustness
3. Add comprehensive test suite
4. Implement payment system
5. Mobile UI optimization

## 📄 License

ChaTtoEdit is provided as-is for evaluation and development purposes.

## 🆘 Support

For issues or questions:
1. Check browser console for detailed error logs
2. Review Supabase function logs
3. Verify VITE_SUPABASE_* and LOVABLE_API_KEY are correctly configured
4. Check network requests in DevTools

---

**Last Updated**: February 2025
**Version**: 1.0.0-beta
