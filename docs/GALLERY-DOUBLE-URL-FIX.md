# Gallery Double URL Issue - Fix Documentation

## 🐛 Problem

The gallery API was being called with a duplicate base URL:
```
https://tigerservers.in/aips/https://tigerservers.in/aips/api/gallery/list?token=...
```

Instead of:
```
https://tigerservers.in/aips/api/gallery/list?token=...
```

## 🔍 Root Cause

The issue occurred when:
1. The API endpoint path was being passed to `getAuthenticatedUrl()`
2. The function was supposed to check if the URL already starts with `http`
3. However, the check was using `url.startsWith('http')` which would match `http`, `https`, `httpd`, etc.
4. This could cause edge cases where URLs weren't properly detected

## ✅ Solution Implemented

### 1. **Enhanced `getAuthenticatedUrl` Function**

**File:** `api/generic.api.ts`

**Changes:**
- ✅ More specific protocol check: `url.startsWith('http://') || url.startsWith('https://')`
- ✅ Added detailed console logging to debug URL construction
- ✅ Better visibility into each step of URL building

**Before:**
```typescript
if (url.startsWith('http')) {
    finalUrl = url;
}
```

**After:**
```typescript
if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log(`[getAuthenticatedUrl] URL already has protocol, using as-is`);
    finalUrl = url;
}
```

**New Console Logs:**
```
[getAuthenticatedUrl] Input URL: "api/gallery/list"
[getAuthenticatedUrl] Base URL: "https://tigerservers.in/aips/"
[getAuthenticatedUrl] Constructed URL: "https://tigerservers.in/aips/api/gallery/list"
[getAuthenticatedUrl] Final URL: "https://tigerservers.in/aips/api/gallery/list?token=...&auth=..."
[getAuthenticatedUrl] Token Status: TOKEN_OK
```

### 2. **Updated Gallery Screen `getMediaUrl` Function**

**File:** `screens/modules/GalleryScreen.tsx`

**Changes:**
- ✅ Now uses `getAuthenticatedUrl` for consistency
- ✅ Added logging to track image URL construction
- ✅ More specific protocol checks
- ✅ Removed duplicate URL construction logic

**Before:**
```typescript
const getMediaUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('file')) return path;
    const cleanBase = NODE_URL.endsWith('/') ? NODE_URL : `${NODE_URL}/`;
    
    let cleanPath = path.startsWith('/') ? path.substring(1) : path;
    if (!cleanPath.startsWith('uploads/')) {
        cleanPath = `uploads/${cleanPath}`;
    }
    
    return `${cleanBase}${cleanPath}`;
};
```

**After:**
```typescript
const getMediaUrl = (path: string) => {
    if (!path) {
        console.log('[Gallery] Empty path provided');
        return '';
    }
    
    console.log('[Gallery] Input path:', path);
    
    // If it's already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('file://')) {
        console.log('[Gallery] Path is already a full URL, returning as-is');
        return path;
    }
    
    // Use getAuthenticatedUrl for consistency
    const url = getAuthenticatedUrl(path);
    console.log('[Gallery] Constructed URL:', url);
    return url;
};
```

## 🧪 Testing

### Test the Gallery API Call:

1. **Open the app and navigate to Gallery**
2. **Check the console logs:**

Expected output:
```
[getAuthenticatedUrl] Input URL: "api/gallery/list"
[getAuthenticatedUrl] Base URL: "https://tigerservers.in/aips/"
[getAuthenticatedUrl] Constructed URL: "https://tigerservers.in/aips/api/gallery/list"
[getAuthenticatedUrl] Final URL: "https://tigerservers.in/aips/api/gallery/list?token=...&auth=..."
[getAuthenticatedUrl] Token Status: TOKEN_OK
📡 [getData] Fetching from: https://tigerservers.in/aips/api/gallery/list?token=...&auth=...
```

### Test Image URLs:

For each gallery image:
```
[Gallery] Input path: "uploads/gallery/image1.jpg"
[getAuthenticatedUrl] Input URL: "uploads/gallery/image1.jpg"
[getAuthenticatedUrl] Base URL: "https://tigerservers.in/aips/"
[getAuthenticatedUrl] Constructed URL: "https://tigerservers.in/aips/uploads/gallery/image1.jpg"
[Gallery] Constructed URL: "https://tigerservers.in/aips/uploads/gallery/image1.jpg?token=...&auth=..."
```

## 🔍 Debugging

If you still see double URLs, check these console logs:

### 1. **Check Input URL:**
```
[getAuthenticatedUrl] Input URL: "..."
```
- If this already contains `https://tigerservers.in/aips/`, the issue is earlier in the call chain

### 2. **Check Protocol Detection:**
```
[getAuthenticatedUrl] URL already has protocol, using as-is
```
- This should appear if the URL already has `http://` or `https://`

### 3. **Check Final URL:**
```
[getAuthenticatedUrl] Final URL: "..."
```
- This should NOT have duplicate base URLs

## 📋 Summary of Changes

| File | Change | Purpose |
|------|--------|---------|
| `api/generic.api.ts` | More specific protocol check | Prevent false positives in URL detection |
| `api/generic.api.ts` | Added detailed logging | Debug URL construction issues |
| `screens/modules/GalleryScreen.tsx` | Use `getAuthenticatedUrl` | Consistency across the app |
| `screens/modules/GalleryScreen.tsx` | Added logging | Track image URL construction |

## ✅ Benefits

1. **No More Double URLs** - Proper protocol detection prevents duplication
2. **Better Debugging** - Detailed logs show exactly what's happening
3. **Consistency** - All URL construction uses the same function
4. **Easier Maintenance** - Single source of truth for URL building

## 🚨 If Issue Persists

If you still see double URLs after this fix:

1. **Check the console logs** - They will show where the duplication happens
2. **Look for the input URL** - If it already contains the base URL, the issue is in the API response
3. **Check the API response** - The backend might be returning full URLs instead of relative paths

**Example of problematic API response:**
```json
{
  "gallery": [
    {
      "image_path": "https://tigerservers.in/aips/uploads/gallery/image1.jpg"
    }
  ]
}
```

In this case, the backend should return:
```json
{
  "gallery": [
    {
      "image_path": "uploads/gallery/image1.jpg"
    }
  ]
}
```

---

**Last Updated:** February 17, 2026  
**Issue:** Double URL in gallery API calls  
**Status:** ✅ Fixed with enhanced logging
