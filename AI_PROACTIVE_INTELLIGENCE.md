# AI Proactive Intelligence

## Problem
AI terlalu banyak bertanya dan tidak langsung action:

### Before (Too Much Asking):
```
User: "isi data hingga baris 20"
AI: "Saya perlu klarifikasi... Apa yang ingin Anda isi? 
     1. Data baru?
     2. Data dummy?
     3. Lanjutan data?"
User: *frustrated* 😤
```

### After (Proactive & Smart):
```
User: "isi data hingga baris 20"
AI: "Saya akan mengisi baris 11-20 dengan melanjutkan pola data.
     [✓ Terapkan Isi Data] ← Click to apply immediately"
User: *happy* 😊
```

## New AI Capabilities

### 1. Smart Dummy Data Generation
AI analyzes existing data and generates contextually appropriate dummy data:

#### Numeric Columns (No, ID):
```
Existing: 1, 2, 3, 4, 5
Generated: 6, 7, 8, 9, 10, 11, 12...
```

#### Name Columns:
```
Existing: "Ahmad", "Budi", "Citra"
Generated: "Dewi", "Eko", "Fitri", "Gita", "Hadi"...
```

#### Product Columns:
```
Existing: "Laptop", "Mouse", "Keyboard"
Generated: "Monitor", "Printer", "Scanner", "Webcam"...
```

#### Price Columns:
```
Existing: 15000000, 250000, 750000
Generated: Similar range (100000-20000000)
```

#### Status Columns:
```
Existing: "Lunas", "Pending"
Generated: Randomly use existing values
```

### 2. Smart Column Addition with Auto-Fill
When user asks to add columns, AI automatically fills with appropriate data:

#### Status Column:
```
Values: "Active", "Pending", "Completed", "Lunas", "Belum Lunas"
Distribution: Random but realistic
```

#### Toko Column:
```
Values: "Toko A", "Toko B", "Cabang Jakarta", "Cabang Surabaya"
Pattern: Varies across rows
```

#### Alamat Column:
```
Values: "Jl. Sudirman No. 123, Jakarta"
        "Jl. Thamrin No. 45, Bandung"
        "Jl. Malioboro No. 78, Yogyakarta"
Pattern: Realistic Indonesian addresses
```

#### Email Column:
```
Values: "user1@example.com", "user2@example.com"
Pattern: Sequential or name-based
```

#### Phone Column:
```
Values: "081234567890", "081234567891"
Pattern: Valid Indonesian phone format
```

### 3. Complete Changes Array
Every action includes complete changes array - no more "will be applied":

```json
{
  "action": {
    "type": "EDIT_ROW",
    "changes": [
      { "cellRef": "A11", "before": null, "after": 11, "type": "value" },
      { "cellRef": "B11", "before": null, "after": "John Doe", "type": "value" },
      { "cellRef": "C11", "before": null, "after": "Laptop", "type": "value" },
      // ... ALL cells included
    ]
  }
}
```

## Updated System Prompt Rules

### Rule 2: BE PROACTIVE AND SMART
```
Don't ask for clarification when you can infer the intent
```

### Rule 3: GENERATE SMART DUMMY DATA
```
When user asks to fill data, generate contextually appropriate dummy data
```

### Rule 4: QUICK ACTIONS MUST BE EXECUTABLE
```
Every quickOption with isApplyAction MUST include complete action with changes
```

## Examples

### Example 1: Fill Data to Row 20

**User Input:**
```
"isi data hingga baris 20"
```

**AI Response (GOOD):**
```json
{
  "content": "Saya akan mengisi data hingga baris 20 dengan melanjutkan pola data yang ada.\n\n**Data yang akan ditambahkan:**\n- Baris 11-20: Melanjutkan nomor urut, nama pelanggan, produk, dan harga\n- Nama: John Doe, Jane Smith, Bob Wilson, dll\n- Produk: Variasi dari produk yang ada\n- Harga: Range 100,000 - 5,000,000",
  "action": {
    "type": "EDIT_ROW",
    "target": { "type": "range", "ref": "11:20" },
    "changes": [
      { "cellRef": "A11", "before": null, "after": 11, "type": "value" },
      { "cellRef": "B11", "before": null, "after": "John Doe", "type": "value" },
      { "cellRef": "C11", "before": null, "after": "Laptop", "type": "value" },
      { "cellRef": "D11", "before": null, "after": 8500000, "type": "value" },
      // ... complete for all cells
    ]
  },
  "quickOptions": [
    {
      "id": "apply-fill",
      "label": "✓ Terapkan Isi Data",
      "isApplyAction": true,
      "variant": "success",
      "action": { /* complete action */ }
    }
  ]
}
```

### Example 2: Add Columns with Data

**User Input:**
```
"buat kolom Status, Toko, Alamat"
```

**AI Response (GOOD):**
```json
{
  "content": "Saya akan menambahkan 3 kolom baru: Status, Toko, dan Alamat, dan mengisinya dengan data yang sesuai.\n\n**Kolom Status:** Lunas, Pending, Proses\n**Kolom Toko:** Toko A, Toko B, Cabang Jakarta\n**Kolom Alamat:** Alamat lengkap untuk setiap baris",
  "action": {
    "type": "ADD_COLUMN",
    "newColumnName": "Status",
    "changes": [
      { "cellRef": "H1", "before": null, "after": "Status", "type": "value" },
      { "cellRef": "H2", "before": null, "after": "Lunas", "type": "value" },
      { "cellRef": "H3", "before": null, "after": "Pending", "type": "value" },
      // ... all rows
      { "cellRef": "I1", "before": null, "after": "Toko", "type": "value" },
      { "cellRef": "I2", "before": null, "after": "Toko A", "type": "value" },
      // ... all rows
      { "cellRef": "J1", "before": null, "after": "Alamat", "type": "value" },
      { "cellRef": "J2", "before": null, "after": "Jl. Sudirman No. 123, Jakarta", "type": "value" },
      // ... all rows
    ]
  },
  "quickOptions": [
    {
      "id": "apply-columns",
      "label": "✓ Tambah 3 Kolom + Data",
      "isApplyAction": true,
      "variant": "success",
      "action": { /* complete action */ }
    }
  ]
}
```

## Data Generation Patterns

### Indonesian Context:
- **Names**: Ahmad, Budi, Citra, Dewi, Eko, Fitri, Gita, Hadi, Indra, Joko
- **Cities**: Jakarta, Surabaya, Bandung, Medan, Semarang, Makassar, Palembang
- **Streets**: Jl. Sudirman, Jl. Thamrin, Jl. Gatot Subroto, Jl. Ahmad Yani
- **Status**: Lunas, Belum Lunas, Pending, Proses, Selesai, Dibatalkan
- **Products**: Laptop, Mouse, Keyboard, Monitor, Printer, Scanner, Webcam, Headset

### International Context:
- **Names**: John Doe, Jane Smith, Bob Wilson, Alice Johnson, Charlie Brown
- **Cities**: New York, Los Angeles, Chicago, Houston, Phoenix
- **Status**: Active, Inactive, Pending, Completed, Cancelled
- **Products**: Electronics, Furniture, Clothing, Books, Toys

## Benefits

1. ✅ **Faster Workflow** - No back-and-forth clarification
2. ✅ **Smart Inference** - AI understands context
3. ✅ **Complete Actions** - Every button is immediately executable
4. ✅ **Realistic Data** - Generated data makes sense
5. ✅ **Better UX** - Users get what they want immediately

## Testing

### Test Cases:
1. [ ] "isi data hingga baris 20" → AI generates smart dummy data
2. [ ] "buat kolom Status" → AI adds column AND fills with appropriate values
3. [ ] "buat kolom Toko, Alamat" → AI adds multiple columns with data
4. [ ] "tambah 10 baris data" → AI generates 10 rows of contextual data
5. [ ] Quick Action button → Immediately executable, no clarification needed

## Files Changed
- `supabase/functions/chat/index.ts` - Updated system prompt with proactive rules

## Deployment
```bash
npx supabase functions deploy chat
```

## Status
✅ Deployed - AI now proactive and smart
✅ Generates contextual dummy data
✅ Quick Actions immediately executable
✅ No more unnecessary clarifications
