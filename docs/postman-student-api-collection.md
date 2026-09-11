# AIPS Student API - Postman Collection
## Aadhithya International Public Schools - Student Data API Testing

Base URL: `https://tigerservers.in/aips/`

---

## 🔐 Authentication

### 1. Student Login
**Method:** POST  
**Endpoint:** `api/login`  
**Body Type:** form-data

```bash
curl --location 'https://tigerservers.in/aips/api/login' \
--form 'username="STUDENT_USERNAME"' \
--form 'password="STUDENT_PASSWORD"' \
--form 'academic_year="2024-2025"' \
--form 'device_type="1"' \
--form 'firebase_token="OPTIONAL_FCM_TOKEN"' \
--form 'device="OPTIONAL_DEVICE_ID"'
```

**Postman Setup:**
- Method: POST
- URL: `https://tigerservers.in/aips/api/login`
- Body → form-data:
  - `username`: student123
  - `password`: password123
  - `academic_year`: 2024-2025
  - `device_type`: 1 (Android) or 2 (iOS)
  - `firebase_token`: (optional)
  - `device`: (optional)

**Expected Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "stud_id": "123",
      "stud_firstname": "John",
      "stud_lastname": "Doe",
      "stud_class": "10",
      "stud_section": "A"
    }
  }
}
```

**⚠️ Important:** Copy the `token` value from the response and use it in all subsequent requests!

---

## 👤 Student Profile

### 2. Get Student Details
**Method:** GET  
**Endpoint:** `api/user/details`  
**Authentication:** Required

```bash
curl --location 'https://tigerservers.in/aips/api/user/details?token=YOUR_AUTH_TOKEN&auth=YOUR_AUTH_TOKEN' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer YOUR_AUTH_TOKEN' \
--header 'X-Authorization: Bearer YOUR_AUTH_TOKEN' \
--header 'auth: YOUR_AUTH_TOKEN'
```

**Postman Setup:**
- Method: GET
- URL: `https://tigerservers.in/aips/api/user/details?token={{token}}&auth={{token}}`
- Headers:
  - `Accept`: application/json
  - `Authorization`: Bearer {{token}}
  - `X-Authorization`: Bearer {{token}}
  - `auth`: {{token}}

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "stud_id": "123",
    "stud_no": "STU2024001",
    "admission_no": "ADM001",
    "stud_firstname": "John",
    "stud_lastname": "Doe",
    "stud_gender": "Male",
    "stud_dob": "2010-05-15",
    "stud_bloodgroup": "O+",
    "stud_class": "10",
    "stud_section": "A",
    "stud_phoneno_first": "+919876543210",
    "stud_email": "john.doe@example.com",
    "stud_address_first": "123 Main Street",
    "stud_city": "Chennai",
    "stud_state": "Tamil Nadu",
    "stud_pincode": "600056",
    "father_name": "Robert Doe",
    "father_mobileno": "+919876543211",
    "father_emailid": "robert@example.com",
    "mother_name": "Jane Doe",
    "mother_mobileno": "+919876543212",
    "mother_emailid": "jane@example.com",
    "stud_photo": "uploads/students/student_123.jpg"
  }
}
```

---

### 3. Update Student Profile Photo
**Method:** POST  
**Endpoint:** `api/profile/update/photo`  
**Authentication:** Required  
**Body Type:** form-data

```bash
curl --location 'https://tigerservers.in/aips/api/profile/update/photo?token=YOUR_AUTH_TOKEN&auth=YOUR_AUTH_TOKEN' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer YOUR_AUTH_TOKEN' \
--header 'X-Authorization: Bearer YOUR_AUTH_TOKEN' \
--header 'auth: YOUR_AUTH_TOKEN' \
--form 'profile_image=@"/path/to/student_photo.jpg"'
```

**Postman Setup:**
- Method: POST
- URL: `https://tigerservers.in/aips/api/profile/update/photo?token={{token}}&auth={{token}}`
- Headers:
  - `Accept`: application/json
  - `Authorization`: Bearer {{token}}
  - `X-Authorization`: Bearer {{token}}
  - `auth`: {{token}}
- Body → form-data:
  - `profile_image`: [Select File]

---

## 📚 Student Homework

### 4. Get Homework List
**Method:** GET  
**Endpoint:** `api/student/homework/list`  
**Authentication:** Required

```bash
curl --location 'https://tigerservers.in/aips/api/student/homework/list?token=YOUR_AUTH_TOKEN&auth=YOUR_AUTH_TOKEN' \
--header 'Accept: application/json' \
--header 'X-Authorization: Bearer YOUR_AUTH_TOKEN' \
--header 'auth: YOUR_AUTH_TOKEN'
```

**Postman Setup:**
- Method: GET
- URL: `https://tigerservers.in/aips/api/student/homework/list?token={{token}}&auth={{token}}`
- Headers:
  - `Accept`: application/json
  - `X-Authorization`: Bearer {{token}}
  - `auth`: {{token}}

**Expected Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "1",
      "title": "Chapter 5 Mathematics Exercise",
      "class_id": "10",
      "section_id": "A",
      "submission_date": "2026-02-20",
      "subjects": ["Mathematics", "Science"],
      "descriptions": {
        "Mathematics": "Complete exercises 1-10",
        "Science": "Write a report on photosynthesis"
      },
      "status": "1",
      "created_at": "2026-02-17"
    }
  ]
}
```

---

### 5. Get Homework Details
**Method:** GET  
**Endpoint:** `api/student/homework/{id}`  
**Authentication:** Required

```bash
curl --location 'https://tigerservers.in/aips/api/student/homework/1?token=YOUR_AUTH_TOKEN&auth=YOUR_AUTH_TOKEN' \
--header 'Accept: application/json' \
--header 'X-Authorization: Bearer YOUR_AUTH_TOKEN' \
--header 'auth: YOUR_AUTH_TOKEN'
```

**Postman Setup:**
- Method: GET
- URL: `https://tigerservers.in/aips/api/student/homework/1?token={{token}}&auth={{token}}`
- Headers:
  - `Accept`: application/json
  - `X-Authorization`: Bearer {{token}}
  - `auth`: {{token}}

---

## 💰 Student Fees

### 6. Get Fee Details
**Method:** GET  
**Endpoint:** `api/student/fees`  
**Authentication:** Required

```bash
curl --location 'https://tigerservers.in/aips/api/student/fees?token=YOUR_AUTH_TOKEN&auth=YOUR_AUTH_TOKEN' \
--header 'Accept: application/json' \
--header 'X-Authorization: Bearer YOUR_AUTH_TOKEN' \
--header 'auth: YOUR_AUTH_TOKEN'
```

**Postman Setup:**
- Method: GET
- URL: `https://tigerservers.in/aips/api/student/fees?token={{token}}&auth={{token}}`
- Headers:
  - `Accept`: application/json
  - `X-Authorization`: Bearer {{token}}
  - `auth`: {{token}}

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "total_fees": 50000,
    "paid_amount": 30000,
    "pending_amount": 20000,
    "due_date": "2026-03-31",
    "payment_history": [
      {
        "date": "2026-01-15",
        "amount": 15000,
        "receipt_no": "REC001"
      },
      {
        "date": "2026-02-10",
        "amount": 15000,
        "receipt_no": "REC002"
      }
    ]
  }
}
```

---

## 📅 Student Attendance

### 7. Get Attendance Records
**Method:** GET  
**Endpoint:** `api/student/attendance`  
**Authentication:** Required

```bash
curl --location 'https://tigerservers.in/aips/api/student/attendance?token=YOUR_AUTH_TOKEN&auth=YOUR_AUTH_TOKEN' \
--header 'Accept: application/json' \
--header 'X-Authorization: Bearer YOUR_AUTH_TOKEN' \
--header 'auth: YOUR_AUTH_TOKEN'
```

**Postman Setup:**
- Method: GET
- URL: `https://tigerservers.in/aips/api/student/attendance?token={{token}}&auth={{token}}`
- Headers:
  - `Accept`: application/json
  - `X-Authorization`: Bearer {{token}}
  - `auth`: {{token}}

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "total_days": 200,
    "present_days": 185,
    "absent_days": 15,
    "attendance_percentage": 92.5,
    "records": [
      {
        "date": "2026-02-17",
        "status": "Present"
      },
      {
        "date": "2026-02-16",
        "status": "Present"
      }
    ]
  }
}
```

---

### 8. Get Attendance by Month
**Method:** GET  
**Endpoint:** `api/student/attendance/month`  
**Authentication:** Required

```bash
curl --location 'https://tigerservers.in/aips/api/student/attendance/month?month=2&year=2026&token=YOUR_AUTH_TOKEN&auth=YOUR_AUTH_TOKEN' \
--header 'Accept: application/json' \
--header 'X-Authorization: Bearer YOUR_AUTH_TOKEN' \
--header 'auth: YOUR_AUTH_TOKEN'
```

**Postman Setup:**
- Method: GET
- URL: `https://tigerservers.in/aips/api/student/attendance/month?month=2&year=2026&token={{token}}&auth={{token}}`
- Headers:
  - `Accept`: application/json
  - `X-Authorization`: Bearer {{token}}
  - `auth`: {{token}}

---

## 📖 Student Timetable

### 9. Get Timetable
**Method:** GET  
**Endpoint:** `api/student/timetable`  
**Authentication:** Required

```bash
curl --location 'https://tigerservers.in/aips/api/student/timetable?token=YOUR_AUTH_TOKEN&auth=YOUR_AUTH_TOKEN' \
--header 'Accept: application/json' \
--header 'X-Authorization: Bearer YOUR_AUTH_TOKEN' \
--header 'auth: YOUR_AUTH_TOKEN'
```

**Postman Setup:**
- Method: GET
- URL: `https://tigerservers.in/aips/api/student/timetable?token={{token}}&auth={{token}}`
- Headers:
  - `Accept`: application/json
  - `X-Authorization`: Bearer {{token}}
  - `auth`: {{token}}

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "Monday": [
      {
        "period": "1",
        "time": "08:00 - 08:45",
        "subject": "Mathematics",
        "teacher": "Mr. Kumar"
      },
      {
        "period": "2",
        "time": "08:45 - 09:30",
        "subject": "English",
        "teacher": "Mrs. Sharma"
      }
    ],
    "Tuesday": [...]
  }
}
```

---

## 📊 Student Exam Results

### 10. Get Exam Results
**Method:** GET  
**Endpoint:** `api/student/results`  
**Authentication:** Required

```bash
curl --location 'https://tigerservers.in/aips/api/student/results?token=YOUR_AUTH_TOKEN&auth=YOUR_AUTH_TOKEN' \
--header 'Accept: application/json' \
--header 'X-Authorization: Bearer YOUR_AUTH_TOKEN' \
--header 'auth: YOUR_AUTH_TOKEN'
```

**Postman Setup:**
- Method: GET
- URL: `https://tigerservers.in/aips/api/student/results?token={{token}}&auth={{token}}`
- Headers:
  - `Accept`: application/json
  - `X-Authorization`: Bearer {{token}}
  - `auth`: {{token}}

---

## 📱 Student Notifications

### 11. Get Notifications
**Method:** GET  
**Endpoint:** `api/student/notifications`  
**Authentication:** Required

```bash
curl --location 'https://tigerservers.in/aips/api/student/notifications?token=YOUR_AUTH_TOKEN&auth=YOUR_AUTH_TOKEN' \
--header 'Accept: application/json' \
--header 'X-Authorization: Bearer YOUR_AUTH_TOKEN' \
--header 'auth: YOUR_AUTH_TOKEN'
```

**Postman Setup:**
- Method: GET
- URL: `https://tigerservers.in/aips/api/student/notifications?token={{token}}&auth={{token}}`
- Headers:
  - `Accept`: application/json
  - `X-Authorization`: Bearer {{token}}
  - `auth`: {{token}}

---

## 🔧 Postman Environment Variables

Create an environment in Postman with these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `https://tigerservers.in/aips/` | `https://tigerservers.in/aips/` |
| `token` | (empty) | (paste token after login) |
| `student_id` | (empty) | (paste after login) |

### How to Set Token Automatically:

Add this to the **Tests** tab of the Login request:

```javascript
// Parse response
var jsonData = pm.response.json();

// Set token as environment variable
if (jsonData.status === "success" && jsonData.data.token) {
    pm.environment.set("token", jsonData.data.token);
    console.log("Token saved:", jsonData.data.token);
    
    // Also save student ID if available
    if (jsonData.data.user && jsonData.data.user.stud_id) {
        pm.environment.set("student_id", jsonData.data.user.stud_id);
        console.log("Student ID saved:", jsonData.data.user.stud_id);
    }
}
```

---

## 📝 Testing Workflow

1. **Login** → Get token
2. **Set token** in environment variable (or use the script above)
3. **Test endpoints** using `{{token}}` variable
4. **Verify responses** match expected format

---

## 🚨 Common Issues & Solutions

### Issue 1: 401 Unauthorized
**Solution:** Token expired or invalid. Login again to get a new token.

### Issue 2: Network Error
**Solution:** Check if the server is accessible. Try opening `https://tigerservers.in/aips/` in browser.

### Issue 3: Missing Headers
**Solution:** Ensure all required headers are present:
- `Accept: application/json`
- `Authorization: Bearer {token}`
- `X-Authorization: Bearer {token}`
- `auth: {token}`

### Issue 4: Token in URL and Headers
**Solution:** The API requires the token in BOTH URL parameters AND headers for maximum compatibility.

---

## 📞 Contact Information

**School:** Aadhithya International Public Schools  
**Address:** No 6, 2nd Main Road, Royal Garden, Goparasanallur Village, Kattuppakkam, Chennai 600 056  
**Phone:** +91 99406 22669, +91 99406 22557  
**Email:** info@aadhithyapublicschools.com

---

## 🔗 Quick Import to Postman

You can import this collection by:
1. Open Postman
2. Click **Import**
3. Select **Raw Text**
4. Paste the cURL commands
5. Click **Import**

Or create a new collection manually using the endpoints above.

---

**Last Updated:** February 17, 2026  
**API Version:** 1.0  
**Documentation:** For internal testing use
