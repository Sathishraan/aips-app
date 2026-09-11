# API Testing Cheat Sheet - 3RD Section A

## 🔑 Authentication Headers (REQUIRED)
```
Authorization: Bearer YOUR_TOKEN
X-Authorization: Bearer YOUR_TOKEN
auth: YOUR_TOKEN
```

---

## 🚀 Quick Commands

### 1. Send "Hello guys" Message
```bash
curl -X POST http://tigerservers.in:7001/api/communication/sendMessage \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Authorization: Bearer TOKEN" \
  -H "auth: TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello guys","type":"group","class_id":"3RD","section_id":"Section A","token":"TOKEN","auth":"TOKEN"}'
```

### 2. Get Group Messages
```bash
curl "http://tigerservers.in:7001/api/communication/getGroupMessages?classId=3RD&sectionId=Section%20A" \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Authorization: Bearer TOKEN" \
  -H "auth: TOKEN"
```

### 3. Get Students List
```bash
curl "https://tigerservers.in/aips/api/communication/students/3RD/Section%20A" \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Authorization: Bearer TOKEN" \
  -H "auth: TOKEN"
```

---

## 💻 Automated Scripts

### Windows (PowerShell)
```powershell
# Send message
.\send_group_message.ps1 -Token "YOUR_TOKEN"

# Get messages
.\test_group_messages.ps1 -Token "YOUR_TOKEN"
```

### Linux/Mac (Bash)
```bash
# Send message
./send_group_message.sh "YOUR_TOKEN" "Hello guys"

# Get messages
./test_group_messages.sh "YOUR_TOKEN"
```

---

## 📋 PowerShell One-Liners

### Send Message
```powershell
$t="TOKEN";$h=@{Authorization="Bearer $t";"X-Authorization"="Bearer $t";auth=$t;"Content-Type"="application/json"};$b=@{message="Hello guys";type="group";class_id="3RD";section_id="Section A";token=$t;auth=$t}|ConvertTo-Json;Invoke-RestMethod -Uri "http://tigerservers.in:7001/api/communication/sendMessage" -Method Post -Headers $h -Body $b
```

### Get Messages
```powershell
$t="TOKEN";$h=@{Authorization="Bearer $t";"X-Authorization"="Bearer $t";auth=$t};Invoke-RestMethod -Uri "http://tigerservers.in:7001/api/communication/getGroupMessages?classId=3RD&sectionId=Section A" -Headers $h
```

---

## ✅ Expected Responses

### Send Message Success
```json
{
  "status": "success",
  "message": "Message sent successfully"
}
```

### Get Messages Success
```json
{
  "data": [
    {
      "id": 1,
      "message": "Hello guys",
      "sender_name": "Teacher",
      "classId": "3RD",
      "sectionId": "Section A"
    }
  ]
}
```

---

## ❌ Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Invalid/expired token | Log in again |
| 400 Bad Request | Missing fields | Check payload |
| 500 Server Error | Backend issue | Check server logs |
| 404 Not Found | Wrong endpoint | Verify URL |

---

## 🔧 Get Your Token

### From App Logs
1. Log into app
2. Look for: `🔑 [nodeApi] Token attached: YOUR_TOKEN...`
3. Copy full token

### From API
```bash
curl -X POST https://tigerservers.in/aips/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"USER","password":"PASS"}'
```

---

## 📁 Available Files

| File | Purpose |
|------|---------|
| `send_group_message.ps1` | Send message (Windows) |
| `send_group_message.sh` | Send message (Linux/Mac) |
| `test_group_messages.ps1` | Get messages (Windows) |
| `test_group_messages.sh` | Get messages (Linux/Mac) |
| `API_HEADERS_REFERENCE.md` | Complete header guide |
| `SEND_MESSAGE_GUIDE.md` | Send message documentation |
| `API_TESTING_GUIDE.md` | Complete API guide |

---

## 🎯 Quick Start

1. Get token from app logs
2. Replace `TOKEN` in commands above
3. Run the command
4. Check response

**Or use the scripts:**
```powershell
.\send_group_message.ps1 -Token "YOUR_TOKEN"
```

---

## ⚠️ Important Notes

- **Always use ALL THREE auth headers**
- URL encode spaces: "Section A" → "Section%20A"
- Use double quotes in JSON
- Token format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Check token expiration at https://jwt.io

---

## 🔍 Verify Everything Works

```bash
# 1. Test server is running
curl http://tigerservers.in:7001/

# 2. Send test message
curl -X POST http://tigerservers.in:7001/api/communication/sendMessage \
  -H "Authorization: Bearer TOKEN" -H "X-Authorization: Bearer TOKEN" -H "auth: TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Test","type":"group","class_id":"3RD","section_id":"Section A","token":"TOKEN","auth":"TOKEN"}'

# 3. Verify message sent
curl "http://tigerservers.in:7001/api/communication/getGroupMessages?classId=3RD&sectionId=Section%20A" \
  -H "Authorization: Bearer TOKEN" -H "X-Authorization: Bearer TOKEN" -H "auth: TOKEN"
```

All three should return 200 OK ✅
