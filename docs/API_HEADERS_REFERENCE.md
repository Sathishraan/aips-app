# Complete API Headers Reference

## 🔑 Required Authentication Headers

When making API calls to the Node.js backend, you **MUST** include all three authentication headers:

```
Authorization: Bearer YOUR_TOKEN
X-Authorization: Bearer YOUR_TOKEN
auth: YOUR_TOKEN
```

### Why Three Headers?

The app sends all three headers to ensure compatibility:
- **`Authorization`** - Standard OAuth/JWT header
- **`X-Authorization`** - Custom header for additional validation
- **`auth`** - Legacy/backup authentication header

**Important**: Always include ALL THREE headers in your API requests!

---

## 📝 Complete curl Example

### Send Group Message
```bash
curl -X POST http://tigerservers.in:7001/api/communication/sendMessage \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Authorization: Bearer YOUR_TOKEN" \
  -H "auth: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "message": "Hello guys",
    "type": "group",
    "class_id": "3RD",
    "section_id": "Section A",
    "token": "YOUR_TOKEN",
    "auth": "YOUR_TOKEN"
  }'
```

### Get Group Messages
```bash
curl -X GET "http://tigerservers.in:7001/api/communication/getGroupMessages?classId=3RD&sectionId=Section%20A" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Authorization: Bearer YOUR_TOKEN" \
  -H "auth: YOUR_TOKEN" \
  -H "Accept: application/json"
```

### Get Students List
```bash
curl -X GET "https://tigerservers.in/aips/api/communication/students/3RD/Section%20A" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Authorization: Bearer YOUR_TOKEN" \
  -H "auth: YOUR_TOKEN"
```

---

## 💻 PowerShell Example

```powershell
$token = "YOUR_TOKEN_HERE"

# Prepare headers with ALL THREE auth headers
$headers = @{
    "Authorization" = "Bearer $token"
    "X-Authorization" = "Bearer $token"
    "auth" = $token
    "Accept" = "application/json"
    "Content-Type" = "application/json"
}

# Send message
$body = @{
    message = "Hello guys"
    type = "group"
    class_id = "3RD"
    section_id = "Section A"
    token = $token
    auth = $token
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://tigerservers.in:7001/api/communication/sendMessage" `
  -Method Post -Headers $headers -Body $body
```

---

## 🐍 Python Example

```python
import requests
import json

TOKEN = "YOUR_TOKEN_HERE"

# Headers with all three auth headers
headers = {
    "Authorization": f"Bearer {TOKEN}",
    "X-Authorization": f"Bearer {TOKEN}",
    "auth": TOKEN,
    "Accept": "application/json",
    "Content-Type": "application/json"
}

# Send message
payload = {
    "message": "Hello guys",
    "type": "group",
    "class_id": "3RD",
    "section_id": "Section A",
    "token": TOKEN,
    "auth": TOKEN
}

response = requests.post(
    "http://tigerservers.in:7001/api/communication/sendMessage",
    headers=headers,
    json=payload
)

print(response.json())
```

---

## 🌐 JavaScript/Node.js Example

```javascript
const axios = require('axios');

const TOKEN = 'YOUR_TOKEN_HERE';

// Headers with all three auth headers
const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'X-Authorization': `Bearer ${TOKEN}`,
  'auth': TOKEN,
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

// Send message
const payload = {
  message: 'Hello guys',
  type: 'group',
  class_id: '3RD',
  section_id: 'Section A',
  token: TOKEN,
  auth: TOKEN
};

axios.post('http://tigerservers.in:7001/api/communication/sendMessage', payload, { headers })
  .then(response => console.log(response.data))
  .catch(error => console.error(error.response.data));
```

---

## 📋 Header Checklist

Before making any API request, ensure you have:

- [ ] `Authorization: Bearer YOUR_TOKEN`
- [ ] `X-Authorization: Bearer YOUR_TOKEN`
- [ ] `auth: YOUR_TOKEN`
- [ ] `Content-Type: application/json` (for POST/PUT)
- [ ] `Accept: application/json`

---

## ⚠️ Common Mistakes

### ❌ Missing X-Authorization
```bash
# WRONG - Missing X-Authorization
curl -X POST http://tigerservers.in:7001/api/communication/sendMessage \
  -H "Authorization: Bearer TOKEN" \
  -H "auth: TOKEN"  # Missing X-Authorization!
```

### ✅ Correct - All Three Headers
```bash
# CORRECT - All three auth headers
curl -X POST http://tigerservers.in:7001/api/communication/sendMessage \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Authorization: Bearer TOKEN" \
  -H "auth: TOKEN"
```

---

## 🔍 How the App Sends Headers

From `api/base.ts` (lines 59-62):
```typescript
if (authToken) {
  config.headers.Authorization = `Bearer ${authToken}`;
  config.headers['X-Authorization'] = `Bearer ${authToken}`;
  config.headers['auth'] = authToken;
}
```

The app automatically adds all three headers to every request!

---

## 🧪 Testing Headers

### Test if Server Accepts Headers
```bash
# Send a test request and check response
curl -v -X GET "http://tigerservers.in:7001/api/communication/getGroupMessages?classId=3RD&sectionId=A" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Authorization: Bearer YOUR_TOKEN" \
  -H "auth: YOUR_TOKEN"
```

Look for:
- **200 OK** - Headers accepted ✅
- **401 Unauthorized** - Token invalid or headers missing ❌

### Verify Headers in Request
Add `-v` (verbose) flag to curl to see headers being sent:
```bash
curl -v -X GET "http://tigerservers.in:7001/api/communication/getGroupMessages?classId=3RD&sectionId=A" \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Authorization: Bearer TOKEN" \
  -H "auth: TOKEN"
```

You should see:
```
> GET /api/communication/getGroupMessages?classId=3RD&sectionId=A HTTP/1.1
> Authorization: Bearer eyJhbG...
> X-Authorization: Bearer eyJhbG...
> auth: eyJhbG...
```

---

## 📖 Quick Reference

### All Endpoints with Complete Headers

#### 1. Send Group Message
```bash
curl -X POST http://tigerservers.in:7001/api/communication/sendMessage \
  -H "Authorization: Bearer TOKEN" -H "X-Authorization: Bearer TOKEN" -H "auth: TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","type":"group","class_id":"3RD","section_id":"Section A","token":"TOKEN","auth":"TOKEN"}'
```

#### 2. Get Group Messages
```bash
curl "http://tigerservers.in:7001/api/communication/getGroupMessages?classId=3RD&sectionId=Section%20A" \
  -H "Authorization: Bearer TOKEN" -H "X-Authorization: Bearer TOKEN" -H "auth: TOKEN"
```

#### 3. Get Students List
```bash
curl "https://tigerservers.in/aips/api/communication/students/3RD/Section%20A" \
  -H "Authorization: Bearer TOKEN" -H "X-Authorization: Bearer TOKEN" -H "auth: TOKEN"
```

#### 4. Get Individual Messages
```bash
curl "http://tigerservers.in:7001/api/communication/getMessages?senderId=123&receiverId=456" \
  -H "Authorization: Bearer TOKEN" -H "X-Authorization: Bearer TOKEN" -H "auth: TOKEN"
```

---

## 🎯 Remember

**Always include ALL THREE authentication headers:**
1. `Authorization: Bearer YOUR_TOKEN`
2. `X-Authorization: Bearer YOUR_TOKEN`
3. `auth: YOUR_TOKEN`

This ensures maximum compatibility with the backend authentication system!

---

## 📁 Related Files

- `send_group_message.ps1` - Already includes all three headers ✅
- `send_group_message.sh` - Already includes all three headers ✅
- `test_group_messages.ps1` - Already includes all three headers ✅
- `test_group_messages.sh` - Already includes all three headers ✅
- `api/base.ts` - Source code showing how app sends headers

All provided scripts already use the correct headers!
