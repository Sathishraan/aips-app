# Send Message API - Quick Guide

## 🚀 Quick Test - Send "Hello guys" to 3RD Section A

### Windows (PowerShell)
```powershell
.\send_group_message.ps1 -Token "YOUR_TOKEN_HERE"
```

Or with custom message:
```powershell
.\send_group_message.ps1 -Token "YOUR_TOKEN_HERE" -Message "Hello guys" -ClassId "3RD" -SectionId "Section A"
```

### Linux/Mac (Bash)
```bash
chmod +x send_group_message.sh
./send_group_message.sh "YOUR_TOKEN_HERE" "Hello guys"
```

---

## 📝 Manual API Call

### Using curl
```bash
curl -X POST http://tigerservers.in:7001/api/communication/sendMessage \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "auth: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello guys",
    "type": "group",
    "class_id": "3RD",
    "section_id": "Section A",
    "token": "YOUR_TOKEN",
    "auth": "YOUR_TOKEN"
  }'
```

### Using PowerShell
```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
    "auth" = $token
    "Content-Type" = "application/json"
}
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

## ✅ Expected Success Response

```json
{
  "status": "success",
  "message": "Message sent successfully",
  "data": {
    "id": 123,
    "message": "Hello guys",
    "senderId": "456",
    "type": "group",
    "classId": "3RD",
    "sectionId": "Section A",
    "created_at": "2026-02-16T13:30:00Z"
  }
}
```

---

## ❌ Common Errors

### 401 Unauthorized
```json
{"error": "Invalid or expired token"}
```
**Fix**: Get a fresh token (log in again)

### 400 Bad Request
```json
{"error": "Message is required"}
```
**Fix**: Ensure all required fields are present:
- `message` (required)
- `type` = "group" (required)
- `class_id` (required)
- `section_id` (optional, defaults to "all")

### 500 Internal Server Error
```json
{"error": "Failed to send message"}
```
**Fix**: Check server logs for database or socket errors

---

## 📋 Required Fields

### For Group Messages
```json
{
  "message": "Your message text",
  "type": "group",
  "class_id": "3RD",
  "section_id": "Section A",  // Optional, use "all" for entire class
  "token": "YOUR_TOKEN",
  "auth": "YOUR_TOKEN"
}
```

### For Individual Messages
```json
{
  "message": "Your message text",
  "type": "individual",
  "receiverId": "STUDENT_ID",
  "token": "YOUR_TOKEN",
  "auth": "YOUR_TOKEN"
}
```

---

## 🧪 Complete Test Flow

### Step 1: Send Message
```bash
curl -X POST http://tigerservers.in:7001/api/communication/sendMessage \
  -H "auth: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello guys","type":"group","class_id":"3RD","section_id":"Section A","token":"YOUR_TOKEN","auth":"YOUR_TOKEN"}'
```

### Step 2: Verify Message Sent
```bash
curl "http://tigerservers.in:7001/api/communication/getGroupMessages?classId=3RD&sectionId=Section%20A" \
  -H "auth: YOUR_TOKEN"
```

### Step 3: Check in App
1. Open app as a student in 3RD Section A
2. Go to Communication
3. Should see "Hello guys" message

---

## 🎯 Test Different Scenarios

### Send to Entire Class (All Sections)
```json
{
  "message": "Hello everyone!",
  "type": "group",
  "class_id": "3RD",
  "section_id": "all"
}
```

### Send to Specific Section
```json
{
  "message": "Hello Section A!",
  "type": "group",
  "class_id": "3RD",
  "section_id": "Section A"
}
```

### Send to Individual Student
```json
{
  "message": "Hello John!",
  "type": "individual",
  "receiverId": "123"
}
```

---

## 🔍 Debugging

### Check if Message Reached Server
Look for in server logs:
```
[POST] /api/communication/sendMessage
[Auth] Token validated for user: 456
[Message] Sending to group: 3RD - Section A
[Socket] Broadcasting to room: G_3RD_Section A
[DB] Message saved with ID: 123
```

### Check if Message Reached Clients
Look for in app logs:
```
📨 [Socket] New group message received
📥 [Cache] Adding message to group: G_3RD_Section A
🔔 [Notification] Showing notification for new message
```

### Verify Socket Connection
```bash
# Check if socket server is running
curl http://tigerservers.in:7001/socket.io/
```

Should return socket.io info, not 404.

---

## 📊 Testing Checklist

- [ ] Token is valid (not expired)
- [ ] Server is running on port 7001
- [ ] Message payload is correct JSON
- [ ] Required fields are present
- [ ] Class and section exist in database
- [ ] Socket server is running
- [ ] Students are in the group room
- [ ] App is connected to socket

---

## 🚀 Quick Commands

### Send Message
```bash
# Replace TOKEN and MESSAGE
curl -X POST http://tigerservers.in:7001/api/communication/sendMessage \
  -H "auth: TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"MESSAGE","type":"group","class_id":"3RD","section_id":"Section A","token":"TOKEN","auth":"TOKEN"}'
```

### Get Messages
```bash
curl "http://tigerservers.in:7001/api/communication/getGroupMessages?classId=3RD&sectionId=Section%20A" \
  -H "auth: TOKEN"
```

### Test Server
```bash
curl http://tigerservers.in:7001/
```

---

## 📁 Available Scripts

1. **`send_group_message.ps1`** - PowerShell script (Windows)
2. **`send_group_message.sh`** - Bash script (Linux/Mac)
3. **`test_group_messages.ps1`** - Full test suite (Windows)
4. **`test_group_messages.sh`** - Full test suite (Linux/Mac)

---

## 💡 Tips

1. **Get Token**: Log into app and check console for token
2. **URL Encoding**: "Section A" becomes "Section%20A" in URLs
3. **JSON Format**: Use double quotes for JSON, not single quotes
4. **Verify**: Always check if message appears in getGroupMessages
5. **Socket**: Message delivery depends on socket connection

---

## 🆘 Need Help?

If message doesn't send:
1. Check token is valid (use jwt.io)
2. Verify server is running (curl the endpoint)
3. Check payload format (valid JSON)
4. Review server logs for errors
5. Test with the provided scripts first
6. Check app logs for socket connection status

The scripts will automatically:
- Send the message
- Verify it was sent
- Fetch recent messages
- Show detailed error messages if something fails
