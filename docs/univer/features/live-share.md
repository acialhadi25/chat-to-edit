# Univer Sheet - Live Share

## Daftar Isi
- [Overview](#overview)
- [Instalasi](#instalasi)
- [API Reference](#api-reference)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Referensi](#referensi)

## Overview

Live Share memungkinkan real-time view synchronization antar users, dengan mode Follow dan Present untuk kolaborasi yang lebih baik.

### Fitur Utama
- **Follow Mode**: Follow view dari user lain
- **Present Mode**: Present view ke semua followers
- **Real-time Sync**: Sinkronisasi view secara real-time
- **Multiple Followers**: Support multiple followers
- **Status Tracking**: Track follow/present status
- **Easy Toggle**: Start/stop dengan mudah

### Kapan Menggunakan
- Collaborative editing sessions
- Training dan demonstrations
- Code reviews dalam spreadsheet
- Team presentations
- Remote assistance
- Synchronized data viewing

### Keuntungan
- Better collaboration
- Synchronized viewing experience
- Easy to use
- Real-time updates
- Multiple participants support
- Enhanced productivity


## Instalasi

### Preset Mode (Recommended)

```bash
npm install @univerjs/presets
npm install @univerjs-pro/sheets-live-share @univerjs-pro/sheets-live-share-ui
```

```typescript
import { createUniver, defaultTheme } from '@univerjs/presets';
import { UniverSheetsLiveSharePlugin } from '@univerjs-pro/sheets-live-share';
import { UniverSheetsLiveShareUIPlugin } from '@univerjs-pro/sheets-live-share-ui';
import '@univerjs/presets/lib/styles/preset-sheets-core.css';
import '@univerjs-pro/sheets-live-share-ui/lib/index.css';

const { univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  theme: defaultTheme,
  presets: [
    // ... other presets
  ],
});

// Register live share plugins
univerAPI.registerPlugin(UniverSheetsLiveSharePlugin, {
  license: 'your-pro-license',
});
univerAPI.registerPlugin(UniverSheetsLiveShareUIPlugin);
```

### Plugin Mode

```bash
npm install @univerjs/core @univerjs/design @univerjs/engine-render
npm install @univerjs/sheets @univerjs/sheets-ui
npm install @univerjs-pro/sheets-live-share @univerjs-pro/sheets-live-share-ui
```

```typescript
import { Univer } from '@univerjs/core';
import { UniverSheetsLiveSharePlugin } from '@univerjs-pro/sheets-live-share';
import { UniverSheetsLiveShareUIPlugin } from '@univerjs-pro/sheets-live-share-ui';

const univer = new Univer();

// Register live share plugins
univer.registerPlugin(UniverSheetsLiveSharePlugin, {
  license: 'your-pro-license',
});
univer.registerPlugin(UniverSheetsLiveShareUIPlugin);
```

## API Reference

### Enums

#### LiveShareStatus

```typescript
enum LiveShareStatus {
  IDLE = 'idle',
  FOLLOWING = 'following',
  PRESENTING = 'presenting',
}
```

### univerAPI Methods

#### getLiveShareStatus()
Mendapatkan status live share saat ini.

```typescript
getLiveShareStatus(): LiveShareStatus
```

**Returns**: `LiveShareStatus` - Current status

**Example**:
```typescript
const status = univerAPI.getLiveShareStatus();
console.log('Live share status:', status);
```

#### startPresenting()
Mulai presenting mode.

```typescript
startPresenting(): Promise<boolean>
```

**Returns**: `Promise<boolean>` - True jika berhasil

**Example**:
```typescript
const started = await univerAPI.startPresenting();
if (started) {
  console.log('Presenting started');
}
```

#### stopPresenting()
Stop presenting mode.

```typescript
stopPresenting(): Promise<boolean>
```

**Returns**: `Promise<boolean>` - True jika berhasil

**Example**:
```typescript
await univerAPI.stopPresenting();
```

#### startFollowing()
Mulai following mode (follow presenter).

```typescript
startFollowing(presenterId: string): Promise<boolean>
```

**Parameters**:
- `presenterId`: `string` - ID dari presenter yang akan difollow

**Returns**: `Promise<boolean>` - True jika berhasil

**Example**:
```typescript
await univerAPI.startFollowing('user-123');
```

#### stopFollowing()
Stop following mode.

```typescript
stopFollowing(): Promise<boolean>
```

**Returns**: `Promise<boolean>` - True jika berhasil

**Example**:
```typescript
await univerAPI.stopFollowing();
```


## Contoh Penggunaan

### 1. Start Presenting

```typescript
import { univerAPI } from '@univerjs/presets';

// Start presenting to followers
const started = await univerAPI.startPresenting();

if (started) {
  console.log('Now presenting - followers will see your view');
}
```

### 2. Stop Presenting

```typescript
// Stop presenting
await univerAPI.stopPresenting();
console.log('Presenting stopped');
```

### 3. Follow a Presenter

```typescript
// Follow another user's view
const presenterId = 'user-123';
await univerAPI.startFollowing(presenterId);

console.log('Following presenter:', presenterId);
```

### 4. Stop Following

```typescript
// Stop following
await univerAPI.stopFollowing();
console.log('Stopped following');
```

### 5. Check Current Status

```typescript
import { LiveShareStatus } from '@univerjs-pro/sheets-live-share';

const status = univerAPI.getLiveShareStatus();

switch (status) {
  case LiveShareStatus.IDLE:
    console.log('Not in live share mode');
    break;
  case LiveShareStatus.FOLLOWING:
    console.log('Currently following someone');
    break;
  case LiveShareStatus.PRESENTING:
    console.log('Currently presenting');
    break;
}
```

### 6. Toggle Present Mode

```typescript
// Toggle presenting on/off
const status = univerAPI.getLiveShareStatus();

if (status === LiveShareStatus.PRESENTING) {
  await univerAPI.stopPresenting();
} else {
  await univerAPI.startPresenting();
}
```

### 7. Present Button Component

```typescript
function PresentButton() {
  const [isPresenting, setIsPresenting] = useState(false);

  const handleToggle = async () => {
    if (isPresenting) {
      await univerAPI.stopPresenting();
      setIsPresenting(false);
    } else {
      await univerAPI.startPresenting();
      setIsPresenting(true);
    }
  };

  return (
    <button onClick={handleToggle}>
      {isPresenting ? 'Stop Presenting' : 'Start Presenting'}
    </button>
  );
}
```

### 8. Follow Button Component

```typescript
function FollowButton({ presenterId }: { presenterId: string }) {
  const [isFollowing, setIsFollowing] = useState(false);

  const handleToggle = async () => {
    if (isFollowing) {
      await univerAPI.stopFollowing();
      setIsFollowing(false);
    } else {
      await univerAPI.startFollowing(presenterId);
      setIsFollowing(true);
    }
  };

  return (
    <button onClick={handleToggle}>
      {isFollowing ? 'Stop Following' : 'Follow'}
    </button>
  );
}
```

### 9. Status Indicator

```typescript
function LiveShareStatus() {
  const [status, setStatus] = useState(univerAPI.getLiveShareStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(univerAPI.getLiveShareStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="status-indicator">
      {status === LiveShareStatus.PRESENTING && '📡 Presenting'}
      {status === LiveShareStatus.FOLLOWING && '👁️ Following'}
      {status === LiveShareStatus.IDLE && '⚪ Idle'}
    </div>
  );
}
```

### 10. Complete Live Share Panel

```typescript
function LiveSharePanel({ users }: { users: User[] }) {
  const [status, setStatus] = useState(univerAPI.getLiveShareStatus());

  const handleStartPresent = async () => {
    await univerAPI.startPresenting();
    setStatus(LiveShareStatus.PRESENTING);
  };

  const handleStopPresent = async () => {
    await univerAPI.stopPresenting();
    setStatus(LiveShareStatus.IDLE);
  };

  const handleFollow = async (userId: string) => {
    await univerAPI.startFollowing(userId);
    setStatus(LiveShareStatus.FOLLOWING);
  };

  const handleStopFollow = async () => {
    await univerAPI.stopFollowing();
    setStatus(LiveShareStatus.IDLE);
  };

  return (
    <div className="live-share-panel">
      <h3>Live Share</h3>
      
      <div className="present-section">
        {status !== LiveShareStatus.PRESENTING ? (
          <button onClick={handleStartPresent}>Start Presenting</button>
        ) : (
          <button onClick={handleStopPresent}>Stop Presenting</button>
        )}
      </div>

      <div className="follow-section">
        <h4>Available Presenters:</h4>
        {users.map(user => (
          <div key={user.id}>
            <span>{user.name}</span>
            {status === LiveShareStatus.FOLLOWING ? (
              <button onClick={handleStopFollow}>Unfollow</button>
            ) : (
              <button onClick={() => handleFollow(user.id)}>Follow</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Best Practices

### Do's ✅

1. **Provide Clear UI Indicators**
```typescript
// Good - Show status clearly
{status === LiveShareStatus.PRESENTING && (
  <div className="presenting-badge">📡 Presenting</div>
)}
```

2. **Allow Easy Toggle**
```typescript
// Good - Easy to start/stop
<button onClick={togglePresenting}>
  {isPresenting ? 'Stop' : 'Start'} Presenting
</button>
```

3. **Handle Errors Gracefully**
```typescript
// Good - Error handling
try {
  await univerAPI.startPresenting();
} catch (error) {
  console.error('Failed to start presenting:', error);
  showErrorMessage('Could not start presenting');
}
```

### Don'ts ❌

1. **Jangan Force Follow tanpa Permission**
```typescript
// Bad - No user consent
await univerAPI.startFollowing(userId);

// Good - Ask first
if (confirm(`Follow ${userName}?`)) {
  await univerAPI.startFollowing(userId);
}
```

2. **Jangan Lupa Stop saat Unmount**
```typescript
// Good - Cleanup
useEffect(() => {
  return () => {
    if (status === LiveShareStatus.PRESENTING) {
      univerAPI.stopPresenting();
    }
  };
}, [status]);
```

## Troubleshooting

### Live Share Tidak Bekerja

**Solusi**:
```typescript
// 1. Verify license
univerAPI.registerPlugin(UniverSheetsLiveSharePlugin, {
  license: process.env.UNIVER_PRO_LICENSE,
});

// 2. Check collaboration plugin
// Live Share requires collaboration to be enabled
```

### View Tidak Sync

**Solusi**:
```typescript
// 1. Verify following correct presenter
const status = univerAPI.getLiveShareStatus();
console.log('Status:', status);

// 2. Try stop and restart
await univerAPI.stopFollowing();
await univerAPI.startFollowing(presenterId);
```

## Referensi

### Official Documentation
- [Univer Live Share Guide](https://docs.univer.ai/guides/sheets/features/live-share)
- [Facade API Reference](https://reference.univer.ai/)

### Related Documentation
- [Collaboration](./collaboration.md) - Real-time collaboration

---

**Last Updated**: 2024
**Univer Version**: Latest
**Plugin**: @univerjs-pro/sheets-live-share, @univerjs-pro/sheets-live-share-ui
**License**: Pro Feature (License Required)
