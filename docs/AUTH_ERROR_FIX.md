# Authentication Error Fix - 401 Unauthorized

## 🚨 Problem
The app is getting a 401 error when trying to fetch group messages:
```
ERROR  ❌ [DEBUG-FRONTEND] Fetch failed: 
{"message": "Request failed with status code 401", 
 "response": {"error": "Invalid or expired token"}}
```

Also noticed the app was calling the wrong port (7002 instead of 7001).

## ✅ Fixes Applied

### 1. Enhanced Authentication Logging
**File**: `api/base.ts`

Added comprehensive logging to help debug authentication issues:

```typescript
// Now logs when token is attached
🔑 [nodeApi] Token attached: abcdef1234567890...

// Warns when token is missing
⚠️ [nodeApi] NO AUTH TOKEN AVAILABLE!

// Logs 401 errors with details
🚫 [nodeApi] 401 Unauthorized - Token may be invalid or expired
🚫 [nodeApi] Error details: {
  url: "api/communication/getGroupMessages",
  message: "Invalid or expired token",
  token: "abcdef1234567890..." or "NO TOKEN"
}
```

### 2. Added Response Interceptor
Added a response interceptor to catch and log 401 authentication errors with detailed information.

## 🔍 Troubleshooting Steps

### Step 1: Restart the App
The `.env` file already has the correct port (7001), but the app needs to be restarted to pick up the change:

1. **Stop the current Expo server** (Ctrl+C in the terminal)
2. **Restart with**:
   ```bash
   npx expo start -c
   ```
3. **Reload the app** on your device/emulator

### Step 2: Check Token Status
After restarting, check the logs for:

**✅ Good - Token is present:**
```
🔑 [nodeApi] Token attached: abcdef1234567890...
```

**❌ Bad - No token:**
```
⚠️ [nodeApi] NO AUTH TOKEN AVAILABLE!
```

### Step 3: If Token is Missing
If you see "NO AUTH TOKEN AVAILABLE", the user needs to log in again:

1. **Clear app data** (or uninstall/reinstall the app)
2. **Log in again** with valid credentials
3. The token will be saved and used for future requests

### Step 4: If Token is Invalid/Expired
If you see the token but still get 401:

**Backend Issue** - The Node.js server is rejecting the token. Check:

1. **Token validation logic** on the server
2. **Token expiration settings** - tokens may be expiring too quickly
3. **Secret key mismatch** - ensure the same secret is used for signing and verifying

## 🔧 Backend Verification

### Check Node.js Server (Port 7001)

1. **Verify server is running**:
   ```bash
   curl http://tigerservers.in:7001/
   ```

2. **Test authentication endpoint**:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://tigerservers.in:7001/api/communication/getGroupMessages?classId=3RD&sectionId=A
   ```

3. **Check server logs** for authentication errors

### Common Backend Issues

1. **Token Expiration Too Short**
   - If tokens expire in 1 hour but users stay logged in longer
   - Solution: Increase token expiration or implement refresh tokens

2. **Secret Key Mismatch**
   - PHP backend and Node.js backend using different secrets
   - Solution: Ensure both use the same JWT secret

3. **Token Format Issues**
   - Server expects different token format
   - Solution: Check if server expects `Bearer` prefix or raw token

## 📋 Testing Checklist

After restarting the app, test:

- [ ] App connects to correct port (7001, not 7002)
- [ ] Token is logged when making requests
- [ ] No "NO AUTH TOKEN AVAILABLE" warnings
- [ ] Group messages load without 401 error
- [ ] Individual messages work
- [ ] Communication module works for staff

## 🔑 Token Flow

1. **Login** → PHP backend (`/aips/api/login`)
2. **Receive token** → Stored in SecureStore
3. **App restart** → Token loaded via `initAuth()`
4. **API calls** → Token attached to headers automatically
5. **Node.js validates** → Returns data or 401 if invalid

## 🚀 Next Steps

1. **Restart the Expo server** with `npx expo start -c`
2. **Check the logs** for token status
3. **If no token**: Log in again
4. **If 401 persists**: Check backend token validation
5. **Monitor logs** for detailed error information

## 📝 Files Modified

1. ✅ `api/base.ts` - Enhanced logging and error handling
2. ✅ `.env` - Already has correct port (7001)

## 🆘 If Issue Persists

If you still get 401 errors after:
- Restarting the app
- Logging in fresh
- Verifying token is attached

Then the issue is on the **Node.js backend** (port 7001):
- Token validation logic
- Token expiration settings
- Secret key configuration
- Database token verification

Share the **Node.js server logs** for further debugging.
