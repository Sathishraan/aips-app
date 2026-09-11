# How to Get Your Token from Console

## 🎯 Quick Guide

After the latest update, your authentication token will be **automatically displayed** in the console when you log in or when the app starts!

---

## 📱 Method 1: From App Startup (Easiest)

1. **Open the app** (or reload it)
2. **Check the console** - you'll see:

```
================================================================================
🔐 TOKEN LOADED FROM STORAGE
================================================================================
Your authentication token:

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE2MDk0NTkyMDB9.signature_here

================================================================================
```

3. **Copy the token** (the long string between the lines)
4. **Use it in API tests**

---

## 🔑 Method 2: From Login

1. **Log into the app**
2. **Check the console** - you'll see:

```
================================================================================
🔑 AUTHENTICATION TOKEN SET
================================================================================
Copy this token for API testing:

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE2MDk0NTkyMDB9.signature_here

================================================================================
```

3. **Copy the token**
4. **Use it immediately** (it's fresh!)

---

## 💻 Where to Find the Console

### React Native / Expo
- **Metro Bundler Terminal** - The terminal where you ran `npx expo start`
- **Browser DevTools** - If using web
- **React Native Debugger** - If you have it installed
- **Expo DevTools** - Press `j` in Metro terminal to open

### Common Locations:
- **Windows**: PowerShell/CMD where Expo is running
- **Mac/Linux**: Terminal where Expo is running
- **VS Code**: Integrated terminal
- **Browser**: Press F12 → Console tab (if running on web)

---

## 🚀 Using the Token

Once you have the token, use it in the test scripts:

### Windows (PowerShell)
```powershell
.\send_group_message.ps1 -Token "YOUR_TOKEN_HERE"
```

### Linux/Mac (Bash)
```bash
./send_group_message.sh "YOUR_TOKEN_HERE"
```

### Manual curl
```bash
curl -X POST http://tigerservers.in:7001/api/communication/sendMessage \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "X-Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "auth: YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello guys",
    "type": "group",
    "class_id": "3RD",
    "section_id": "Section A",
    "token": "YOUR_TOKEN_HERE",
    "auth": "YOUR_TOKEN_HERE"
  }'
```

---

## 🔍 Troubleshooting

### "No token found in storage"
```
⚠️ No token found in storage - please log in
```
**Solution**: Log into the app first, then the token will be displayed.

### Token Not Showing
**Check:**
1. ✅ App is running in development mode
2. ✅ Console/terminal is visible
3. ✅ You've logged in successfully
4. ✅ Looking at the correct terminal (Metro Bundler)

### Token Appears Truncated
**Don't worry!** The full token is there. Just:
1. Click in the console
2. Select the entire token line
3. Copy it (Ctrl+C or Cmd+C)

---

## 📋 Token Format

A valid JWT token looks like this:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE2MDk0NTkyMDB9.signature_here
```

It has **three parts** separated by dots (`.`):
1. **Header** - `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
2. **Payload** - `eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE2MDk0NTkyMDB9`
3. **Signature** - `signature_here`

Make sure you copy **all three parts**!

---

## ⏰ Token Expiration

Tokens may expire after a certain time. If you get a 401 error:

1. **Log out** of the app
2. **Log in again**
3. **Copy the new token** from console
4. **Use the new token** in your tests

---

## 🎯 Quick Test

After copying your token:

### Test 1: Verify Token Works
```bash
curl "http://tigerservers.in:7001/api/communication/getGroupMessages?classId=3RD&sectionId=Section%20A" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Authorization: Bearer YOUR_TOKEN" \
  -H "auth: YOUR_TOKEN"
```

**Expected**: 200 OK with message data  
**If 401**: Token is invalid or expired - get a fresh one

### Test 2: Send Test Message
```powershell
.\send_group_message.ps1 -Token "YOUR_TOKEN"
```

**Expected**: ✅ MESSAGE SENT SUCCESSFULLY!

---

## 📸 Example Console Output

When you start the app, you'll see:

```
Starting Metro Bundler...
...
================================================================================
🔐 TOKEN LOADED FROM STORAGE
================================================================================
Your authentication token:

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE2MDk0NTkyMDB9.abc123xyz

================================================================================

🌐 [nodeApi] Request: GET http://tigerservers.in:7001/api/communication/getGroupMessages
🔑 [nodeApi] Token attached: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Just copy the token from the box!

---

## 💡 Pro Tips

1. **Save the token** in a text file for quick access
2. **Use environment variables** for repeated testing:
   ```powershell
   $env:TOKEN = "YOUR_TOKEN_HERE"
   .\send_group_message.ps1 -Token $env:TOKEN
   ```
3. **Check expiration** at https://jwt.io before testing
4. **Get a fresh token** if tests fail with 401

---

## 🔐 Security Note

**Never share your token publicly!** It gives full access to your account.

- ✅ Use for local testing
- ✅ Use in secure scripts
- ❌ Don't commit to git
- ❌ Don't share in screenshots
- ❌ Don't post in public forums

---

## 📁 Related Files

- `send_group_message.ps1` - Send message script
- `test_group_messages.ps1` - Get messages script
- `API_CHEAT_SHEET.md` - Quick command reference
- `API_HEADERS_REFERENCE.md` - Header documentation

---

## ✅ Summary

1. **Open/reload the app** → Token displays automatically
2. **Copy the token** from the console
3. **Use in test scripts** or curl commands
4. **If 401 error** → Get fresh token by logging in again

That's it! The token is now easy to find and copy. 🎉
