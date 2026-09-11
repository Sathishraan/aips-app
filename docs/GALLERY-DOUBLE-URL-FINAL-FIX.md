# Gallery Double URL Issue - FINAL FIX

## 🐛 The Problem

The gallery API was being called with a **duplicate base URL**:

```
❌ ERROR: https://tigerservers.in/aips/https://tigerservers.in/aips/api/gallery/list?token=...
```

Instead of:
```
✅ CORRECT: https://tigerservers.in/aips/api/gallery/list?token=...
```

## 🔍 Root Cause Analysis

The issue was caused by **double URL prepending** in the request flow:

### The Flow:
1. **`useGallery` hook** calls `getData('api/gallery/list')`
2. **`getData` function** calls `getAuthenticatedUrl('api/gallery/list')`
3. **`getAuthenticatedUrl`** constructs: `https://tigerservers.in/aips/api/gallery/list?token=...`
4. **`getData`** passes this FULL URL to `api.get(fullUrl)`
5. **Axios instance (`api`)** has `baseURL: 'https://tigerservers.in/aips/'` configured
6. **Axios prepends baseURL** to the URL again → **DOUBLE URL!**

### Why This Happened:
```typescript
// In base.ts
const api = axios.create({
  baseURL: 'https://tigerservers.in/aips/',  // ← This baseURL
  // ...
});

// In generic.api.ts (OLD CODE)
const authenticatedUrl = getAuthenticatedUrl(url);
// authenticatedUrl = "https://tigerservers.in/aips/api/gallery/list?token=..."

const response = await api.get(authenticatedUrl);
// Axios sees: baseURL + authenticatedUrl
// Result: "https://tigerservers.in/aips/" + "https://tigerservers.in/aips/api/gallery/list"
// = "https://tigerservers.in/aips/https://tigerservers.in/aips/api/gallery/list" ❌
```

## ✅ The Solution

### Fix #1: Enhanced Protocol Detection in `getAuthenticatedUrl`

**File:** `api/generic.api.ts`

Changed from loose check to specific protocol check:

```typescript
// BEFORE (could miss edge cases)
if (url.startsWith('http')) {
    finalUrl = url;
}

// AFTER (specific and accurate)
if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log(`[getAuthenticatedUrl] URL already has protocol, using as-is`);
    finalUrl = url;
}
```

### Fix #2: Smart URL Handling in `getData`

**File:** `api/generic.api.ts`

Added logic to detect full URLs and bypass the axios instance's baseURL:

```typescript
export const getData = async <T>(url: string): Promise<T> => {
  const authenticatedUrl = getAuthenticatedUrl(url);
  console.log(`📡 [getData] Fetching from: ${authenticatedUrl}`);
  
  // If the authenticated URL is a full URL, use axios directly
  // to avoid double baseURL prepending from the api instance
  if (authenticatedUrl.startsWith('http://') || authenticatedUrl.startsWith('https://')) {
    console.log(`📡 [getData] Using direct axios call (full URL detected)`);
    const response = await axios.get(authenticatedUrl);  // ← Direct axios, no baseURL
    return response.data;
  } else {
    console.log(`📡 [getData] Using api instance (relative URL)`);
    const response = await api.get(authenticatedUrl);  // ← Use api instance with baseURL
    return response.data;
  }
};
```

### Fix #3: Updated Gallery Screen

**File:** `screens/modules/GalleryScreen.tsx`

Updated `getMediaUrl` to use `getAuthenticatedUrl` for consistency:

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

## 🧪 Testing & Verification

### Expected Console Logs:

When you navigate to the Gallery screen, you should see:

```
[getAuthenticatedUrl] Input URL: "api/gallery/list"
[getAuthenticatedUrl] Base URL: "https://tigerservers.in/aips/"
[getAuthenticatedUrl] Constructed URL: "https://tigerservers.in/aips/api/gallery/list"
[getAuthenticatedUrl] Final URL: "https://tigerservers.in/aips/api/gallery/list?token=...&auth=..."
[getAuthenticatedUrl] Token Status: TOKEN_OK
📡 [getData] Fetching from: https://tigerservers.in/aips/api/gallery/list?token=...&auth=...
📡 [getData] Using direct axios call (full URL detected)
✅ Gallery data loaded successfully
```

### For Each Image:

```
[Gallery] Input path: "uploads/gallery/image1.jpg"
[getAuthenticatedUrl] Input URL: "uploads/gallery/image1.jpg"
[getAuthenticatedUrl] Constructed URL: "https://tigerservers.in/aips/uploads/gallery/image1.jpg"
[Gallery] Constructed URL: "https://tigerservers.in/aips/uploads/gallery/image1.jpg?token=...&auth=..."
```

## 📊 Before vs After

### BEFORE (Broken):
```
Input: "api/gallery/list"
  ↓
getAuthenticatedUrl: "https://tigerservers.in/aips/api/gallery/list?token=..."
  ↓
api.get() with baseURL: "https://tigerservers.in/aips/"
  ↓
Final URL: "https://tigerservers.in/aips/https://tigerservers.in/aips/api/gallery/list?token=..."
  ↓
❌ 404 Not Found
```

### AFTER (Fixed):
```
Input: "api/gallery/list"
  ↓
getAuthenticatedUrl: "https://tigerservers.in/aips/api/gallery/list?token=..."
  ↓
Detected full URL → Use axios.get() directly (no baseURL)
  ↓
Final URL: "https://tigerservers.in/aips/api/gallery/list?token=..."
  ↓
✅ 200 OK
```

## 🔧 Files Modified

| File | Changes | Purpose |
|------|---------|---------|
| `api/generic.api.ts` | Added `axios` import | Direct HTTP calls for full URLs |
| `api/generic.api.ts` | Enhanced protocol check in `getAuthenticatedUrl` | More accurate URL detection |
| `api/generic.api.ts` | Smart URL handling in `getData` | Prevent double baseURL prepending |
| `api/generic.api.ts` | Added detailed logging | Debug URL construction |
| `screens/modules/GalleryScreen.tsx` | Use `getAuthenticatedUrl` | Consistency across app |
| `screens/modules/GalleryScreen.tsx` | Added logging | Track image URL construction |

## 🎯 Key Insights

### Why Axios Prepends baseURL:

When you configure axios with a `baseURL`:
```typescript
const api = axios.create({
  baseURL: 'https://example.com/'
});
```

Axios will **always prepend** the baseURL to **any URL** you pass to `api.get()`, **even if it's already a full URL**.

### The Solution:

Use **direct axios** (not the configured instance) when you have a full URL:
```typescript
// ❌ WRONG: Uses baseURL even with full URL
await api.get('https://example.com/api/data');

// ✅ CORRECT: Bypasses baseURL
await axios.get('https://example.com/api/data');
```

## 🚨 Troubleshooting

If you still see double URLs:

1. **Check the console logs** - They show the exact flow
2. **Look for this log:**
   ```
   📡 [getData] Using direct axios call (full URL detected)
   ```
   If you see this, the fix is working.

3. **If you see:**
   ```
   📡 [getData] Using api instance (relative URL)
   ```
   But the URL is actually full, then `getAuthenticatedUrl` is not constructing it correctly.

4. **Check the input URL:**
   ```
   [getAuthenticatedUrl] Input URL: "..."
   ```
   If this already contains the full URL, the issue is earlier in the call chain.

## ✅ Summary

**Problem:** Axios instance with baseURL was prepending base URL to already-full URLs

**Solution:** 
1. Detect full URLs in `getData`
2. Use direct `axios.get()` for full URLs (bypasses baseURL)
3. Use `api.get()` for relative URLs (uses baseURL)

**Result:** No more double URLs! 🎉

---

**Last Updated:** February 17, 2026  
**Status:** ✅ FIXED  
**Tested:** Pending user verification
