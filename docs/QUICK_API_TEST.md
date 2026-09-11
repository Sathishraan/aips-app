# Quick API Test Commands - 3RD Section A

## 🔑 Step 1: Get Your Token

### From App Logs
1. Open the app and log in
2. Look for this in console:
   ```
   🔑 [nodeApi] Token attached: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Copy the full token after "Token attached: "

### Or Login via API
```bash
curl -X POST https://tigerservers.in/aips/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"YOUR_USERNAME","password":"YOUR_PASSWORD"}'
```

---

## 🧪 Step 2: Test the APIs

### Windows (PowerShell)

#### Quick Test
```powershell
.\test_group_messages.ps1 -Token "YOUR_TOKEN_HERE"
```

#### Manual Test - Group Messages
```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
    "auth" = $token
}
Invoke-RestMethod -Uri "http://tigerservers.in:7001/api/communication/getGroupMessages?classId=3RD&sectionId=Section A" -Headers $headers
```

#### Manual Test - Students List
```powershell
Invoke-RestMethod -Uri "https://tigerservers.in/aips/api/communication/students/3RD/Section A" -Headers $headers
```

---

### Linux/Mac (Bash)

#### Quick Test
```bash
chmod +x test_group_messages.sh
./test_group_messages.sh "YOUR_TOKEN_HERE"
```

#### Manual Test - Group Messages
```bash
TOKEN="YOUR_TOKEN_HERE"
curl "http://tigerservers.in:7001/api/communication/getGroupMessages?classId=3RD&sectionId=Section%20A" \
  -H "Authorization: Bearer $TOKEN" \
  -H "auth: $TOKEN"
```

#### Manual Test - Students List
```bash
curl "https://tigerservers.in/aips/api/communication/students/3RD/Section%20A" \
  -H "Authorization: Bearer $TOKEN" \
  -H "auth: $TOKEN"
```

---

## ✅ Expected Success Response

### Group Messages
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

### Students List
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

## ❌ Common Errors

### 401 Unauthorized
```json
{"error": "Invalid or expired token"}
```
**Fix**: Get a fresh token (log in again)

### 404 Not Found
```
Cannot GET /api/communication/getGroupMessages
```
**Fix**: Endpoint doesn't exist - check Node.js server routes

### 500 Internal Server Error
```json
{"error": "Database error"}
```
**Fix**: Check server logs and database connection

---

## 🎯 One-Line Tests

Replace `TOKEN` with your actual token:

### Test Group Messages
```bash
curl "http://tigerservers.in:7001/api/communication/getGroupMessages?classId=3RD&sectionId=Section%20A" -H "auth: TOKEN"
```

### Test Students List
```bash
curl "https://tigerservers.in/aips/api/communication/students/3RD/Section%20A" -H "auth: TOKEN"
```

### Test Server Health
```bash
curl http://tigerservers.in:7001/
```

---

## 📋 Files Available

1. **`test_group_messages.ps1`** - PowerShell script (Windows)
2. **`test_group_messages.sh`** - Bash script (Linux/Mac)
3. **`API_TESTING_GUIDE.md`** - Complete testing documentation

---

## 🔍 Debugging

### Check Token is Valid
Visit https://jwt.io/ and paste your token to see:
- Expiration time
- User ID
- Token structure

### Check App Logs
Look for:
```
🔑 [nodeApi] Token attached: abc123...  ← Good!
⚠️ [nodeApi] NO AUTH TOKEN AVAILABLE!  ← Bad - need to log in
🚫 [nodeApi] 401 Unauthorized          ← Token invalid/expired
```

### Check Server Logs
On Node.js server (port 7001), look for:
- Token validation messages
- Database query logs
- Error messages

---

## 🚀 Quick Start

1. **Get token** from app logs or login API
2. **Run test script**:
   - Windows: `.\test_group_messages.ps1 -Token "YOUR_TOKEN"`
   - Linux/Mac: `./test_group_messages.sh "YOUR_TOKEN"`
3. **Check results** - should see ✅ or ❌ with error details
4. **If errors**, check the error message and follow the fix suggestions

---

## 📞 Need Help?

If tests fail:
1. Check token is not expired (use jwt.io)
2. Verify servers are running (ports 7001 and 443)
3. Check app logs for token status
4. Review server logs for errors
5. See `AUTH_ERROR_FIX.md` for detailed troubleshooting
