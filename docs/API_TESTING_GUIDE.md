# API Testing Guide - Group Messages for 3RD Section A

## Prerequisites

You need:
1. **Valid authentication token** (get from login)
2. **API endpoints**:
   - PHP Backend: `https://tigerservers.in/aips/`
   - Node.js Backend: `http://tigerservers.in:7001/`

## Step 1: Get Authentication Token

### Option A: Login via API (Recommended)

```bash
curl -X POST https://tigerservers.in/aips/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "YOUR_USERNAME",
    "password": "YOUR_PASSWORD"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "emp_id": "123",
    "emp_name": "John Doe",
    ...
  }
}
```

**Save the token** from the response. You'll use it in the next steps.

### Option B: Get Token from App Logs

1. Open the app and log in
2. Check the console logs for:
   ```
   🔑 [nodeApi] Token attached: YOUR_TOKEN_HERE...
   ```
3. Copy the full token

---

## Step 2: Test Group Messages API

### Test 1: Get Group Messages for 3RD Section A

```bash
curl -X GET "http://tigerservers.in:7001/api/communication/getGroupMessages?classId=3RD&sectionId=Section%20A" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "X-Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "auth: YOUR_TOKEN_HERE" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json"
```

**Replace `YOUR_TOKEN_HERE`** with your actual token.

**Expected Success Response:**
```json
{
  "data": [
    {
      "id": 1,
      "message": "Hello class!",
      "senderId": "123",
      "sender_name": "Teacher Name",
      "classId": "3RD",
      "sectionId": "Section A",
      "type": "group",
      "created_at": "2026-02-16T10:30:00Z"
    }
  ]
}
```

**Expected Error Responses:**

**401 Unauthorized:**
```json
{
  "error": "Invalid or expired token"
}
```
→ Token is invalid, expired, or not sent correctly

**404 Not Found:**
```
Cannot GET /api/communication/getGroupMessages
```
→ Endpoint doesn't exist on the server

**500 Internal Server Error:**
```json
{
  "error": "Database error"
}
```
→ Server-side issue (check Node.js logs)

---

## Step 3: Test with Different Formats

### Test with URL-encoded section (recommended)
```bash
curl -X GET "http://tigerservers.in:7001/api/communication/getGroupMessages?classId=3RD&sectionId=Section%20A" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "auth: YOUR_TOKEN"
```

### Test with plain section name
```bash
curl -X GET "http://tigerservers.in:7001/api/communication/getGroupMessages?classId=3RD&sectionId=A" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "auth: YOUR_TOKEN"
```

### Test with "all" sections
```bash
curl -X GET "http://tigerservers.in:7001/api/communication/getGroupMessages?classId=3RD&sectionId=all" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "auth: YOUR_TOKEN"
```

---

## Step 4: Test Students List API (from earlier fix)

```bash
curl -X GET "https://tigerservers.in/aips/api/communication/students/3RD/Section%20A" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "auth: YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "data": [
    {
      "stud_id": "456",
      "stud_no": "2024001",
      "stud_firstname": "John",
      "stud_lastname": "Doe",
      "stud_class": "3RD",
      "stud_section": "Section A"
    }
  ]
}
```

---

## Step 5: PowerShell Testing (Windows)

If `curl` doesn't work, use PowerShell:

### Get Group Messages
```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
    "X-Authorization" = "Bearer $token"
    "auth" = $token
    "Accept" = "application/json"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://tigerservers.in:7001/api/communication/getGroupMessages?classId=3RD&sectionId=Section A" -Headers $headers -Method Get
```

### Get Students List
```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
    "auth" = $token
}

Invoke-RestMethod -Uri "https://tigerservers.in/aips/api/communication/students/3RD/Section A" -Headers $headers -Method Get
```

---

## Step 6: Verify Token Format

### Check Token Structure
A valid JWT token has 3 parts separated by dots:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE2MDk0NTkyMDB9.signature_here
```

### Decode Token (for debugging)
Visit: https://jwt.io/

Paste your token to see:
- **Header**: Algorithm and token type
- **Payload**: User ID, expiration, etc.
- **Signature**: Verification (needs secret key)

**Check expiration:**
```json
{
  "userId": "123",
  "iat": 1609459200,  // Issued at
  "exp": 1609545600   // Expires at
}
```

If `exp` (expiration) is in the past, token is expired.

---

## Step 7: Common Issues & Solutions

### Issue 1: "Invalid or expired token"
**Causes:**
- Token is expired
- Token format is wrong
- Secret key mismatch between PHP and Node.js
- Token not in database

**Solutions:**
1. Get a fresh token (log in again)
2. Check token expiration with jwt.io
3. Verify secret keys match on both backends
4. Check if token exists in database

### Issue 2: "Cannot GET /api/communication/getGroupMessages"
**Cause:** Endpoint doesn't exist

**Solution:** Check Node.js server routes. Should have:
```javascript
router.get('/api/communication/getGroupMessages', authenticateToken, getGroupMessages);
```

### Issue 3: CORS Error (in browser)
**Cause:** Cross-Origin Request Blocked

**Solution:** Add CORS headers on Node.js server:
```javascript
app.use(cors({
  origin: '*',
  credentials: true
}));
```

### Issue 4: Connection Refused
**Cause:** Server is not running

**Solution:**
1. Check if Node.js server is running on port 7001
2. Verify firewall allows connections
3. Test with: `curl http://tigerservers.in:7001/`

---

## Step 8: Complete Test Script

Save this as `test_api.sh` (Linux/Mac) or `test_api.ps1` (Windows):

### Bash Script (test_api.sh)
```bash
#!/bin/bash

# Configuration
TOKEN="YOUR_TOKEN_HERE"
NODE_URL="http://tigerservers.in:7001"
PHP_URL="https://tigerservers.in/aips"

echo "=== Testing Group Messages API ==="
curl -X GET "$NODE_URL/api/communication/getGroupMessages?classId=3RD&sectionId=Section%20A" \
  -H "Authorization: Bearer $TOKEN" \
  -H "auth: $TOKEN" \
  -H "Accept: application/json"

echo -e "\n\n=== Testing Students List API ==="
curl -X GET "$PHP_URL/api/communication/students/3RD/Section%20A" \
  -H "Authorization: Bearer $TOKEN" \
  -H "auth: $TOKEN"

echo -e "\n\nTests complete!"
```

### PowerShell Script (test_api.ps1)
```powershell
# Configuration
$token = "YOUR_TOKEN_HERE"
$nodeUrl = "http://tigerservers.in:7001"
$phpUrl = "https://tigerservers.in/aips"

$headers = @{
    "Authorization" = "Bearer $token"
    "auth" = $token
    "Accept" = "application/json"
}

Write-Host "=== Testing Group Messages API ===" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$nodeUrl/api/communication/getGroupMessages?classId=3RD&sectionId=Section A" -Headers $headers -Method Get
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n=== Testing Students List API ===" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$phpUrl/api/communication/students/3RD/Section A" -Headers $headers -Method Get
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`nTests complete!" -ForegroundColor Green
```

---

## Quick Reference

### Get Token
```bash
curl -X POST https://tigerservers.in/aips/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"YOUR_USER","password":"YOUR_PASS"}'
```

### Test Group Messages
```bash
curl "http://tigerservers.in:7001/api/communication/getGroupMessages?classId=3RD&sectionId=Section%20A" \
  -H "Authorization: Bearer TOKEN" \
  -H "auth: TOKEN"
```

### Test Students List
```bash
curl "https://tigerservers.in/aips/api/communication/students/3RD/Section%20A" \
  -H "Authorization: Bearer TOKEN" \
  -H "auth: TOKEN"
```

---

## Expected App Flow

1. **User logs in** → Gets token from PHP backend
2. **Token stored** → SecureStore saves it
3. **App makes request** → Token attached to headers automatically
4. **Node.js validates** → Checks token signature and expiration
5. **Returns data** → Group messages or error

---

## Monitoring & Debugging

### Check App Logs
Look for these messages:
```
🔑 [nodeApi] Token attached: abc123...
📡 [DEBUG-FRONTEND] Fetching from api/communication/getGroupMessages
📥 [DEBUG-FRONTEND] Response received: {...}
```

### Check Server Logs
On the Node.js server, you should see:
```
[Auth] Token validated for user: 123
[DB] Fetching group messages for class: 3RD, section: Section A
[Response] Returning 5 messages
```

---

## Need Help?

If tests fail, check:
1. ✅ Token is valid (not expired)
2. ✅ Server is running on port 7001
3. ✅ Endpoints exist on the server
4. ✅ Database has data for 3RD Section A
5. ✅ CORS is configured (if testing from browser)
6. ✅ Firewall allows connections

Share the error message and response for further debugging!
