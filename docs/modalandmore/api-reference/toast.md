---
title: Toast Notifications
excerpt: Slide-in notifications matching D365 native style
---

# Toast Notifications

Show success, error, warning, and info messages in the top-right corner.

## Methods

```javascript
uiLib.Toast.success(options);
uiLib.Toast.error(options);
uiLib.Toast.warn(options);
uiLib.Toast.info(options);
uiLib.Toast.default(options);
```

All methods accept either an options object or positional parameters.

## Options Object

```javascript
uiLib.Toast.success({
  title: 'Saved!',        // Required — toast title
  message: 'Record updated', // Optional — message body
  duration: 6000,          // Optional — auto-dismiss in ms (default: 6000, 0 = manual close)
  sound: true              // Optional — play notification sound
});
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | required | Toast title |
| `message` | string | `''` | Message body |
| `duration` | number | `6000` | Auto-dismiss time in ms (0 = manual close) |
| `sound` | boolean | `false` | Play notification sound |

## Shorthand Syntax

```javascript
uiLib.Toast.success('Title', 'Message', 5000);
uiLib.Toast.error('Error', 'Failed to save');
```

## Return Value

All toast methods return an instance with a `close()` method:

```javascript
const toast = uiLib.Toast.info({ title: 'Processing...', duration: 0 });
// ... later
toast.close(); // Programmatically dismiss
```

## Examples

```javascript
// Basic notifications
uiLib.Toast.success({ title: 'Saved', message: 'Record updated' });
uiLib.Toast.error({ title: 'Error', message: 'Failed to save' });
uiLib.Toast.warn({ title: 'Warning', message: 'Check required fields' });
uiLib.Toast.info({ title: 'Info', message: 'Processing your request...' });

// With sound
uiLib.Toast.success({ title: 'Done!', message: 'Export complete', sound: true });

// Persistent (manual close only)
const loading = uiLib.Toast.info({ title: 'Uploading...', duration: 0 });
await uploadFile();
loading.close();
uiLib.Toast.success({ title: 'Uploaded!' });
```
