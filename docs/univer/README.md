# Dokumentasi Univer Sheet - Panduan Lengkap

## Daftar Isi

1. [Pengenalan](#pengenalan)
2. [Core API](#core-api)
3. [Features](#features)
4. [UI Customization](#ui-customization)
5. [Best Practices](#best-practices)

## Pengenalan

Univer Sheet adalah spreadsheet engine yang powerful dan fleksibel, dirancang untuk memberikan pengalaman spreadsheet yang profesional di web. Dokumentasi ini mencakup semua fitur dan API yang tersedia.

### Konsep Dasar

- **Workbook**: Container utama yang berisi satu atau lebih worksheet (seperti file Excel)
- **Worksheet**: Sheet individual dalam workbook yang menyimpan data tabel
- **Range**: Area rectangular dalam worksheet yang ditentukan oleh baris dan kolom
- **Cell**: Unit data terkecil dalam worksheet

## Struktur Dokumentasi

Dokumentasi ini dibagi menjadi beberapa bagian:

### Core Features
- [General API](./core/general-api.md) - API umum dan command system
- [Sheets API](./core/sheets-api.md) - Workbook dan Worksheet management
- [Range & Selection](./core/range-selection.md) - Manipulasi range dan selection
- [Formula](./core/formula.md) - Formula dan calculation engine
- [Number Format](./core/numfmt.md) - Format angka dan tanggal
- [Row & Column](./core/row-col.md) - Operasi baris dan kolom
- [Freeze](./core/freeze.md) - Freeze panes
- [Permission](./core/permission.md) - Kontrol akses dan permission

### Advanced Features
- [Filter](./features/filter.md) - Data filtering
- [Data Validation](./features/data-validation.md) - Validasi input data
- [Conditional Formatting](./features/conditional-formatting.md) - Format kondisional
- [Import & Export](./features/import-export.md) - Import/export XLSX
- [Collaboration](./features/collaboration.md) - Collaborative editing

### UI Customization
- [UI Overview](./ui/overview.md) - Struktur UI dan customization
- [Themes](./ui/themes.md) - Theme customization
- [Components](./ui/components.md) - Custom components

## Quick Start

### Instalasi

```bash
npm install @univerjs/preset-sheets-core
```

### Basic Usage

```typescript
import { createUniver } from '@univerjs/presets'
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'

const { univerAPI } = createUniver({
  locale: 'en-US',
  presets: [UniverSheetsCorePreset()],
})

// Buat workbook baru
const workbook = univerAPI.createWorkbook({ name: 'My Workbook' })
const worksheet = workbook.getActiveSheet()

// Set nilai cell
worksheet.getRange('A1').setValue('Hello Univer!')
```

## Referensi Lengkap

Untuk dokumentasi API lengkap, lihat:
- [Facade API Reference](https://reference.univer.ai/)
- [Official Documentation](https://docs.univer.ai/)

## Integrasi dengan Project

Lihat [Integration Guide](./integration/README.md) untuk panduan integrasi dengan project ini.
