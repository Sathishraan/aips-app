# Quick Reference - Student API Testing

## 📥 Import to Postman

### Method 1: Import JSON Collection
1. Open Postman
2. Click **Import** button (top left)
3. Select **File** tab
4. Choose `AIPS-Student-API.postman_collection.json`
5. Click **Import**

### Method 2: Import Individual cURL Commands
See `postman-student-api-collection.md` for individual cURL commands

---

## 🔑 Quick Start (3 Steps)

### Step 1: Login
```bash
POST https://tigerservers.in/aips/api/login
Body (form-data):
- username: student123
- password: password123
- academic_year: 2024-2025
- device_type: 1
```

### Step 2: Copy Token
From response, copy the `token` value:
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Step 3: Use Token
Replace `YOUR_AUTH_TOKEN` in all requests with your actual token.

---

## 📋 All Endpoints at a Glance

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 1 | `/api/login` | POST | Student login |
| 2 | `/api/user/details` | GET | Get student profile |
| 3 | `/api/profile/update/photo` | POST | Update profile photo |
| 4 | `/api/student/homework/list` | GET | Get homework list |
| 5 | `/api/student/homework/{id}` | GET | Get homework details |
| 6 | `/api/student/fees` | GET | Get fee details |
| 7 | `/api/student/attendance` | GET | Get attendance |
| 8 | `/api/student/attendance/month` | GET | Get monthly attendance |
| 9 | `/api/student/timetable` | GET | Get timetable |
| 10 | `/api/student/results` | GET | Get exam results |
| 11 | `/api/student/notifications` | GET | Get notifications |

---

## 🎯 Common Headers (Copy-Paste Ready)

```
Accept: application/json
Authorization: Bearer YOUR_TOKEN_HERE
X-Authorization: Bearer YOUR_TOKEN_HERE
auth: YOUR_TOKEN_HERE
```

---

## 🔧 Environment Variables Setup

In Postman, create environment with:

| Variable | Value |
|----------|-------|
| `base_url` | `https://tigerservers.in/aips/` |
| `token` | (auto-filled after login) |
| `student_id` | (auto-filled after login) |

---

## ✅ Auto-Save Token Script

Add this to Login request → Tests tab:

```javascript
var jsonData = pm.response.json();
if (jsonData.status === "success" && jsonData.data.token) {
    pm.environment.set("token", jsonData.data.token);
    console.log("✅ Token saved!");
}
```

---

## 📱 Sample Test Data

### Student Login Credentials
```
Username: student123
Password: password123
Academic Year: 2024-2025
```

### Sample Student Data
```json
{
  "stud_id": "123",
  "stud_firstname": "John",
  "stud_lastname": "Doe",
  "stud_class": "10",
  "stud_section": "A",
  "stud_phoneno_first": "+919876543210"
}
```

---

## 🚨 Troubleshooting

### Error: 401 Unauthorized
- **Cause:** Invalid or expired token
- **Fix:** Login again to get new token

### Error: Network Error
- **Cause:** Server not reachable
- **Fix:** Check internet connection, verify base URL

### Error: Missing Headers
- **Cause:** Required headers not sent
- **Fix:** Ensure all 4 headers are present (Accept, Authorization, X-Authorization, auth)

---

## 📞 Support

**School:** Aadhithya International Public Schools  
**Email:** info@aadhithyapublicschools.com  
**Phone:** +91 99406 22669

---

**Files Created:**
1. ✅ `postman-student-api-collection.md` - Full documentation
2. ✅ `AIPS-Student-API.postman_collection.json` - Import file
3. ✅ `QUICK-REFERENCE.md` - This file
