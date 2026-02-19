# Changelog

All notable changes to Chat to Excel project will be documented in this file.

## [1.1.0] - 2026-02-19

### 🎉 Major Updates

#### Backend Integration
- **Migrated to Supabase Hosted Backend**
  - Full control over database and infrastructure
  - Project ID: `iatfkqwwmjohrvdfnmwm`
  - Deployed complete database schema with RLS policies
  - Auto-create profile trigger on user signup
  - Updated_at triggers for all tables

#### Database Schema
- **New Tables**
  - `profiles` - Enhanced user profiles with subscription management
  - `file_history` - File upload tracking with metadata
  - `chat_history` - Persistent chat conversations
  - `templates` - Custom Excel templates (public/private)
  - `payments` - Payment transaction tracking

#### FortuneSheet Integration
- **Replaced x-data-spreadsheet with FortuneSheet**
  - Better performance and stability
  - More Excel-like features
  - Improved formula support
  - Better cell formatting
  - Freeze panes support

#### Features Added
- ✅ Template system (save/load custom templates)
- ✅ Template gallery with categories
- ✅ Subscription tiers (free/pro/enterprise)
- ✅ Credits system for usage tracking
- ✅ Enhanced TypeScript types
- ✅ Improved error handling
- ✅ Better state management

#### Developer Experience
- ✅ Supabase Power integration for MCP tools
- ✅ Type-safe database operations
- ✅ Automated type generation from schema
- ✅ Test scripts for connection verification
- ✅ Comprehensive documentation

### 📝 Documentation
- Added `QUICK_START.md` - User quick start guide
- Added `IMPLEMENTATION_STATUS.md` - Technical details
- Added `SUPABASE_INTEGRATION_COMPLETE.md` - Integration status
- Added `DEPLOYMENT_READY.md` - Deployment checklist
- Added `CHANGELOG.md` - This file
- Updated `README.md` - Latest features and setup

### 🔧 Technical Improvements
- Optimized build size (code splitting)
- Improved TypeScript strict mode compliance
- Better error boundaries
- Enhanced loading states
- Improved accessibility

### 🐛 Bug Fixes
- Fixed cell editing in FortuneSheet
- Fixed undo/redo state management
- Fixed template loading issues
- Fixed authentication flow
- Fixed file upload validation

---

## [1.0.0] - 2025-02-01

### Initial Release

#### Core Features
- **Chat to Excel** - AI-powered Excel operations
  - 30+ Excel operations
  - Natural language commands
  - Formula support
  - Data cleansing
  - Undo/Redo

- **Merge Excel** - Combine multiple files
  - Multi-file merge
  - Sheet consolidation
  - Column mapping
  - Format preservation

- **Split Excel** - Divide large files
  - Split by column values
  - Split by row count
  - Custom rules
  - Batch export

- **Data Entry Form** - Generate forms
  - AI form generation
  - Manual builder
  - Field validation
  - Excel export

#### Authentication
- Email/password login
- User profiles
- Session management

#### File Processing
- Upload Excel/CSV files
- Download modified files
- Multi-sheet support
- Format preservation

#### AI Integration
- Lovable AI Gateway
- Streaming responses
- 100+ prompt examples
- Context-aware suggestions

---

## Upcoming Features

### v1.2.0 (Planned)
- [ ] Real-time collaboration
- [ ] Advanced chart creation
- [ ] Pivot table builder
- [ ] Data visualization dashboard
- [ ] Export to PDF
- [ ] Email reports
- [ ] Workflow automation
- [ ] Mobile app

### v1.3.0 (Planned)
- [ ] Excel macro support
- [ ] Advanced formulas (XLOOKUP, LET, etc.)
- [ ] Custom functions
- [ ] Plugin system
- [ ] API access
- [ ] Webhooks
- [ ] Integrations (Google Sheets, Airtable)

---

## Migration Guide

### From v1.0.0 to v1.1.0

#### Database Migration
Old schema will be automatically migrated. No action required.

#### Environment Variables
Update your `.env` file:

```env
# Old (v1.0.0)
VITE_SUPABASE_URL=old_url
VITE_SUPABASE_PUBLISHABLE_KEY=old_key

# New (v1.1.0)
VITE_SUPABASE_URL=https://iatfkqwwmjohrvdfnmwm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=new_key
VITE_SUPABASE_ANON_KEY=new_anon_key
VITE_SUPABASE_PROJECT_ID=iatfkqwwmjohrvdfnmwm
```

#### Code Changes
If you have custom code:

1. Update Supabase client imports
2. Update database types
3. Test authentication flow
4. Verify file operations

#### Testing
Run full test suite:

```bash
npm run test
npm run test:e2e
npm run test:supabase
```

---

## Breaking Changes

### v1.1.0
- Database schema changed (auto-migrated)
- Supabase project changed (requires new credentials)
- Some API endpoints changed (edge functions)

---

## Deprecations

### v1.1.0
- ❌ x-data-spreadsheet (replaced with FortuneSheet)
- ❌ Old Supabase project (migrated to new project)
- ❌ Old database schema (migrated to new schema)

---

## Contributors

- Kiro AI Assistant - Full stack development
- User (alico) - Product direction and testing

---

## Support

For questions or issues:
- Check documentation in `/docs`
- Review `QUICK_START.md` for common issues
- Check `DEPLOYMENT_READY.md` for troubleshooting
- Open an issue on GitHub (if available)

---

**Last Updated:** February 19, 2026
