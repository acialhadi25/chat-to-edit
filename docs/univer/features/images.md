# Univer Sheet - Images (Gambar)

## Daftar Isi
- [Overview](#overview)
- [Instalasi](#instalasi)
- [API Reference](#api-reference)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Custom React Hooks](#custom-react-hooks)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Images dapat digunakan untuk memperkaya konten spreadsheet, meningkatkan ekspresi visual, dan membantu mengilustrasikan atau menyoroti informasi penting. Univer mendukung dua tipe gambar: floating images dan cell images.

### Fitur Utama
- ✅ Floating images (gambar mengambang)
- ✅ Cell images (gambar dalam cell)
- ✅ Floating DOM elements
- ✅ Image manipulation (resize, rotate, crop)
- ✅ Support URL dan file upload
- ✅ Anchor types (fixed, move with cells)

### Tipe Images
1. **Floating Images**: Gambar yang mengambang di atas cells
2. **Cell Images**: Gambar yang tertanam dalam cell
3. **Floating DOM**: Custom DOM elements yang mengambang

## Instalasi

### Preset Mode (Recommended)

```bash
npm install @univerjs/preset-sheets-drawing
```

```typescript
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US'
import { UniverSheetsDrawingPreset } from '@univerjs/preset-sheets-drawing'
import UniverPresetSheetsDrawingEnUS from '@univerjs/preset-sheets-drawing/locales/en-US'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'

import '@univerjs/preset-sheets-core/lib/index.css'
import '@univerjs/preset-sheets-drawing/lib/index.css'

const { univerAPI } = createUniver({
  locale: LocaleType.En_US,
  locales: {
    [LocaleType.En_US]: mergeLocales(
      UniverPresetSheetsCoreEnUS,
      UniverPresetSheetsDrawingEnUS
    ),
  },
  presets: [
    UniverSheetsCorePreset(),
    UniverSheetsDrawingPreset()
  ],
})
```

**Untuk Collaboration Feature:**
```typescript
UniverSheetsDrawingPreset({
  collaboration: true
})
```

### Plugin Mode

```bash
npm install @univerjs/docs-drawing @univerjs/drawing @univerjs/drawing-ui @univerjs/sheets-drawing @univerjs/sheets-drawing-ui
```

```typescript
import { LocaleType, mergeLocales, Univer } from '@univerjs/core'
import { UniverDocsDrawingPlugin } from '@univerjs/docs-drawing'
import { IImageIoService, UniverDrawingPlugin } from '@univerjs/drawing'
import { UniverDrawingUIPlugin } from '@univerjs/drawing-ui'
import DrawingUIEnUS from '@univerjs/drawing-ui/locale/en-US'
import { UniverSheetsDrawingPlugin } from '@univerjs/sheets-drawing'
import { UniverSheetsDrawingUIPlugin } from '@univerjs/sheets-drawing-ui'
import SheetsDrawingUIEnUS from '@univerjs/sheets-drawing-ui/locale/en-US'

import '@univerjs/drawing-ui/lib/index.css'
import '@univerjs/sheets-drawing-ui/lib/index.css'
import '@univerjs/sheets-drawing-ui/facade'

const univer = new Univer({
  locale: LocaleType.En_US,
  locales: {
    [LocaleType.En_US]: mergeLocales(
      DrawingUIEnUS,
      SheetsDrawingUIEnUS
    ),
  },
})

univer.registerPlugin(UniverDrawingPlugin)
univer.registerPlugin(UniverDrawingUIPlugin)
univer.registerPlugin(UniverSheetsDrawingPlugin)
univer.registerPlugin(UniverSheetsDrawingUIPlugin)
```

## API Reference

### Floating DOM

#### `FWorksheet.addFloatDomToPosition(layer)`
Menambahkan floating DOM element ke posisi tertentu.

**Parameters:**
- `layer` (object): Konfigurasi layer
  - `componentKey` (string): Key komponen yang sudah diregister
  - `initPosition` (object): Posisi awal
    - `startX`, `endX`, `startY`, `endY` (number)
  - `data` (any): Data untuk komponen

**Returns:** `IDisposable | null` - Disposable untuk remove DOM

#### `FWorksheet.addFloatDomToRange(range, layer, domLayout, id?)`
Menambahkan floating DOM element ke range tertentu.

**Parameters:**
- `range` (FRange): Range target
- `layer` (object): Konfigurasi layer
- `domLayout` (object): Layout configuration
  - `width`, `height` (number): Ukuran
  - `marginX`, `marginY` (string | number): Margin
- `id` (string): Optional ID

**Returns:** `IDisposable | null`

#### `FWorksheet.addFloatDomToColumnHeader(column, layer, domPos, id?)`
Menambahkan floating DOM element ke column header.

**Parameters:**
- `column` (number): Column index
- `layer` (object): Konfigurasi layer
- `domPos` (object): Position configuration
- `id` (string): Optional ID

**Returns:** `IDisposable | null`

### Floating Images

#### `FWorksheet.newOverGridImage()`
Membuat image builder untuk floating image.

**Returns:** `FOverGridImageBuilder` - Image builder instance

#### `FOverGridImageBuilder` Methods

| Method | Description |
|--------|-------------|
| `buildAsync()` | Build image dan return ISheetImage |
| `setSource(url, type)` | Set source gambar |
| `setColumn(col)` | Set posisi horizontal |
| `setRow(row)` | Set posisi vertical |
| `setColumnOffset(offset)` | Set horizontal offset |
| `setRowOffset(offset)` | Set vertical offset |
| `setWidth(width)` | Set lebar gambar |
| `setHeight(height)` | Set tinggi gambar |
| `setAnchorType(type)` | Set anchor type |
| `setCropTop(value)` | Set crop top |
| `setCropLeft(value)` | Set crop left |
| `setCropBottom(value)` | Set crop bottom |
| `setCropRight(value)` | Set crop right |
| `setRotate(angle)` | Set rotation angle |

#### `FWorksheet.insertImage(url, column, row, offsetX, offsetY)`
Insert gambar dengan shortcut method.

**Parameters:**
- `url` (string): URL gambar
- `column` (number): Column index
- `row` (number): Row index
- `offsetX` (number): Horizontal offset
- `offsetY` (number): Vertical offset

**Returns:** `Promise<boolean>` - Success status

#### `FWorksheet.insertImages(images)`
Insert multiple images.

**Parameters:**
- `images` (ISheetImage[]): Array of images

**Returns:** `boolean` - Success status

#### `FWorksheet.getImages()`
Get semua floating images.

**Returns:** `FOverGridImage[]` - Array of images

#### `FWorksheet.getImageById(id)`
Get image by ID.

**Parameters:**
- `id` (string): Image ID

**Returns:** `FOverGridImage | null`

#### `FWorksheet.updateImages(images)`
Update images.

**Parameters:**
- `images` (ISheetImage[]): Array of updated images

**Returns:** `boolean` - Success status

#### `FWorksheet.deleteImages(images)`
Delete images.

**Parameters:**
- `images` (FOverGridImage[]): Array of images to delete

**Returns:** `boolean` - Success status

### Cell Images

#### `FRange.insertCellImageAsync(url)`
Insert image ke dalam cell.

**Parameters:**
- `url` (string): URL gambar

**Returns:** `Promise<boolean>` - Success status

## Contoh Penggunaan

### 1. Insert Floating Image Sederhana

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Insert image di posisi F6
const result = await fWorksheet.insertImage(
  'https://avatars.githubusercontent.com/u/61444807?s=48&v=4',
  5, // column F (0-indexed)
  5, // row 6 (0-indexed)
  10, // offsetX
  10  // offsetY
)

if (result) {
  console.log('Image inserted successfully')
}
```

### 2. Insert Floating Image dengan Builder

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Create image dengan builder pattern
const image = await fWorksheet.newOverGridImage()
  .setSource(
    'https://avatars.githubusercontent.com/u/61444807?s=48&v=4',
    univerAPI.Enum.ImageSourceType.URL
  )
  .setColumn(5)
  .setRow(5)
  .setWidth(500)
  .setHeight(300)
  .buildAsync()

// Insert image
fWorksheet.insertImages([image])
```

### 3. Insert Image dengan Crop

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

const image = await fWorksheet.newOverGridImage()
  .setSource(imageUrl, univerAPI.Enum.ImageSourceType.URL)
  .setColumn(2)
  .setRow(2)
  .setWidth(400)
  .setHeight(300)
  .setCropTop(10)
  .setCropLeft(10)
  .setCropBottom(10)
  .setCropRight(10)
  .buildAsync()

fWorksheet.insertImages([image])
```

### 4. Insert Image dengan Rotation

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

const image = await fWorksheet.newOverGridImage()
  .setSource(imageUrl, univerAPI.Enum.ImageSourceType.URL)
  .setColumn(3)
  .setRow(3)
  .setWidth(300)
  .setHeight(300)
  .setRotate(45) // Rotate 45 degrees
  .buildAsync()

fWorksheet.insertImages([image])
```

### 5. Get dan Update Images

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Get semua images
const images = fWorksheet.getImages()
console.log('Total images:', images.length)

// Update image pertama
if (images.length > 0) {
  const firstImage = images[0]
  const imageBuilder = firstImage.toBuilder()
  
  // Update size
  const updatedImage = await imageBuilder
    .setWidth(100)
    .setHeight(50)
    .buildAsync()
  
  fWorksheet.updateImages([updatedImage])
}
```

### 6. Delete Images

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Get dan delete image pertama
const images = fWorksheet.getImages()
if (images.length > 0) {
  fWorksheet.deleteImages([images[0]])
}

// Delete by ID
const imageById = fWorksheet.getImageById('image-id-123')
if (imageById) {
  fWorksheet.deleteImages([imageById])
}
```

### 7. Insert Cell Image

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Insert image ke cell A10
const fRange = fWorksheet.getRange('A10')
const result = await fRange.insertCellImageAsync(
  'https://avatars.githubusercontent.com/u/61444807?s=48&v=4'
)

if (result) {
  console.log('Cell image inserted')
}
```

### 8. Add Floating DOM Component

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Register React component
univerAPI.registerComponent(
  'myFloatDom',
  ({ data }) => (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#fff',
      border: '1px solid #ccc',
      boxSizing: 'border-box'
    }}>
      popup content: {data?.label}
    </div>
  )
)

// Add floating DOM
const disposable = fWorksheet.addFloatDomToPosition({
  componentKey: 'myFloatDom',
  initPosition: {
    startX: 100,
    endX: 300,
    startY: 100,
    endY: 200
  },
  data: {
    label: 'Hello Univer'
  }
})

// Remove setelah 2 detik
setTimeout(() => {
  disposable?.dispose()
}, 2000)
```

### 9. Add Floating DOM to Range

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Register loading component
function RangeLoading() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#fff',
      border: '1px solid #ccc',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      Loading...
    </div>
  )
}

univerAPI.registerComponent('RangeLoading', RangeLoading)

// Add ke range A1:C3
const fRange = fWorksheet.getRange('A1:C3')
const disposable = fWorksheet.addFloatDomToRange(
  fRange,
  { componentKey: 'RangeLoading' },
  {},
  'myRangeLoading'
)
```

### 10. Add Float Button to Column Header

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Register button component
function FloatButton() {
  return (
    <div
      style={{
        width: '100px',
        height: '30px',
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer'
      }}
      onClick={() => console.log('Button clicked')}
    >
      FloatButton
    </div>
  )
}

univerAPI.registerComponent('FloatButton', FloatButton)

// Add ke column D header
const disposable = fWorksheet.addFloatDomToColumnHeader(
  3, // column D
  {
    componentKey: 'FloatButton',
    allowTransform: false
  },
  {
    width: 100,
    height: 30,
    marginX: 0,
    marginY: 0,
    horizonOffsetAlign: 'right'
  },
  'myFloatButton'
)
```

## Custom React Hooks

### useImageManager Hook

```typescript
import { useCallback, useEffect, useState } from 'react'
import { useFacadeAPI } from './useFacadeAPI'

interface ImageInfo {
  id: string
  column: number
  row: number
  width: number
  height: number
}

export function useImageManager() {
  const univerAPI = useFacadeAPI()
  const [images, setImages] = useState<ImageInfo[]>([])
  const [loading, setLoading] = useState(false)

  // Load semua images
  const loadImages = useCallback(() => {
    if (!univerAPI) return

    const fWorkbook = univerAPI.getActiveWorkbook()
    const fWorksheet = fWorkbook.getActiveSheet()
    const imageList = fWorksheet.getImages()
    
    const imageInfos = imageList.map(img => ({
      id: img.getId(),
      column: img.getColumn(),
      row: img.getRow(),
      width: img.getWidth(),
      height: img.getHeight()
    }))
    
    setImages(imageInfos)
  }, [univerAPI])

  // Insert image
  const insertImage = useCallback(async (
    url: string,
    column: number,
    row: number,
    width: number = 300,
    height: number = 200
  ) => {
    if (!univerAPI) return false

    setLoading(true)
    try {
      const fWorkbook = univerAPI.getActiveWorkbook()
      const fWorksheet = fWorkbook.getActiveSheet()
      
      const image = await fWorksheet.newOverGridImage()
        .setSource(url, univerAPI.Enum.ImageSourceType.URL)
        .setColumn(column)
        .setRow(row)
        .setWidth(width)
        .setHeight(height)
        .buildAsync()
      
      const success = fWorksheet.insertImages([image])
      
      if (success) {
        loadImages()
      }
      
      return success
    } catch (error) {
      console.error('Error inserting image:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [univerAPI, loadImages])

  // Update image
  const updateImage = useCallback(async (
    imageId: string,
    updates: { width?: number; height?: number; rotation?: number }
  ) => {
    if (!univerAPI) return false

    try {
      const fWorkbook = univerAPI.getActiveWorkbook()
      const fWorksheet = fWorkbook.getActiveSheet()
      
      const image = fWorksheet.getImageById(imageId)
      if (!image) return false
      
      const builder = image.toBuilder()
      
      if (updates.width) builder.setWidth(updates.width)
      if (updates.height) builder.setHeight(updates.height)
      if (updates.rotation) builder.setRotate(updates.rotation)
      
      const updatedImage = await builder.buildAsync()
      const success = fWorksheet.updateImages([updatedImage])
      
      if (success) {
        loadImages()
      }
      
      return success
    } catch (error) {
      console.error('Error updating image:', error)
      return false
    }
  }, [univerAPI, loadImages])

  // Delete image
  const deleteImage = useCallback((imageId: string) => {
    if (!univerAPI) return false

    try {
      const fWorkbook = univerAPI.getActiveWorkbook()
      const fWorksheet = fWorkbook.getActiveSheet()
      
      const image = fWorksheet.getImageById(imageId)
      if (!image) return false
      
      const success = fWorksheet.deleteImages([image])
      
      if (success) {
        loadImages()
      }
      
      return success
    } catch (error) {
      console.error('Error deleting image:', error)
      return false
    }
  }, [univerAPI, loadImages])

  useEffect(() => {
    loadImages()
  }, [loadImages])

  return {
    images,
    loading,
    insertImage,
    updateImage,
    deleteImage,
    loadImages
  }
}
```

### Contoh Penggunaan Hook

```typescript
function ImageGallery() {
  const { images, loading, insertImage, updateImage, deleteImage } = useImageManager()
  const [imageUrl, setImageUrl] = useState('')

  const handleInsertImage = async () => {
    if (!imageUrl) return

    const success = await insertImage(imageUrl, 5, 5, 400, 300)
    
    if (success) {
      setImageUrl('')
      console.log('Image inserted!')
    }
  }

  const handleResizeImage = async (imageId: string) => {
    await updateImage(imageId, {
      width: 200,
      height: 150
    })
  }

  return (
    <div>
      <div>
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Image URL"
        />
        <button onClick={handleInsertImage} disabled={loading}>
          Insert Image
        </button>
      </div>
      
      <div>
        <h3>Images ({images.length})</h3>
        {images.map(image => (
          <div key={image.id}>
            <span>
              Position: ({image.column}, {image.row})
              Size: {image.width}x{image.height}
            </span>
            <button onClick={() => handleResizeImage(image.id)}>
              Resize
            </button>
            <button onClick={() => deleteImage(image.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Best Practices

### 1. Image Source Management
```typescript
// ❌ Bad - hardcoded URLs
const url = 'https://example.com/image.jpg'

// ✅ Good - centralized image management
const IMAGE_SOURCES = {
  LOGO: 'https://cdn.example.com/logo.png',
  AVATAR: 'https://cdn.example.com/avatar.jpg'
}

await fWorksheet.insertImage(IMAGE_SOURCES.LOGO, 0, 0, 10, 10)
```

### 2. Error Handling
```typescript
// ✅ Good - handle errors properly
try {
  const image = await fWorksheet.newOverGridImage()
    .setSource(url, univerAPI.Enum.ImageSourceType.URL)
    .setColumn(5)
    .setRow(5)
    .setWidth(500)
    .setHeight(300)
    .buildAsync()
  
  const success = fWorksheet.insertImages([image])
  
  if (!success) {
    console.error('Failed to insert image')
  }
} catch (error) {
  console.error('Error building image:', error)
}
```

### 3. Image Size Optimization
```typescript
// ✅ Good - reasonable image sizes
const MAX_WIDTH = 800
const MAX_HEIGHT = 600

const image = await fWorksheet.newOverGridImage()
  .setSource(url, univerAPI.Enum.ImageSourceType.URL)
  .setColumn(5)
  .setRow(5)
  .setWidth(Math.min(originalWidth, MAX_WIDTH))
  .setHeight(Math.min(originalHeight, MAX_HEIGHT))
  .buildAsync()
```

### 4. Cleanup Floating DOM
```typescript
// ✅ Good - cleanup disposables
const disposables: IDisposable[] = []

const disposable = fWorksheet.addFloatDomToPosition(config)
if (disposable) {
  disposables.push(disposable)
}

// Cleanup on unmount
useEffect(() => {
  return () => {
    disposables.forEach(d => d.dispose())
  }
}, [])
```

### 5. Batch Operations
```typescript
// ✅ Good - batch insert images
const images = await Promise.all([
  buildImage1(),
  buildImage2(),
  buildImage3()
])

fWorksheet.insertImages(images)
```

## Troubleshooting

### Image tidak muncul

**Penyebab:**
- URL tidak valid atau CORS issue
- Image size terlalu besar
- Position di luar viewport

**Solusi:**
```typescript
// Validate URL
const isValidUrl = (url: string) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

if (!isValidUrl(imageUrl)) {
  console.error('Invalid image URL')
  return
}

// Use reasonable size
const image = await fWorksheet.newOverGridImage()
  .setSource(imageUrl, univerAPI.Enum.ImageSourceType.URL)
  .setColumn(0) // Start from visible area
  .setRow(0)
  .setWidth(300) // Reasonable size
  .setHeight(200)
  .buildAsync()
```

### Floating DOM tidak render

**Penyebab:**
- Component tidak diregister
- Position config salah
- React/Vue component error

**Solusi:**
```typescript
// Register component first
univerAPI.registerComponent('MyComponent', MyComponent)

// Validate position
const disposable = fWorksheet.addFloatDomToPosition({
  componentKey: 'MyComponent',
  initPosition: {
    startX: 100,
    endX: 300, // endX > startX
    startY: 100,
    endY: 200  // endY > startY
  },
  data: {}
})

if (!disposable) {
  console.error('Failed to add floating DOM')
}
```

### Image update tidak bekerja

**Penyebab:**
- Image ID tidak ditemukan
- Builder tidak di-build
- Update config tidak valid

**Solusi:**
```typescript
// Validate image exists
const image = fWorksheet.getImageById(imageId)
if (!image) {
  console.error('Image not found')
  return
}

// Build before update
const builder = image.toBuilder()
const updatedImage = await builder
  .setWidth(newWidth)
  .setHeight(newHeight)
  .buildAsync() // Don't forget to build!

fWorksheet.updateImages([updatedImage])
```

## Referensi

- [Official Images Documentation](https://docs.univer.ai/guides/sheets/features/images)
- [Facade API Reference](https://reference.univer.ai/)
- [Drawing Examples](https://github.com/dream-num/univer/tree/dev/examples)

---

**Related Documentation:**
- [UI Components](../ui/components.md)
- [Themes](../ui/themes.md)
- [General API](../core/general-api.md)
