# Homework Create API - cURL Test Commands

## API Endpoint
**URL:** `https://tigerservers.in/aips/api/homework/create`  
**Method:** POST  
**Content-Type:** multipart/form-data  
**Authentication:** Required (Bearer token)

---

## 🔑 Get Authentication Token First

Before creating homework, you need to get an authentication token by logging in:

```bash
curl -X POST "https://tigerservers.in/aips/api/login" \
  -F "username=YOUR_USERNAME" \
  -F "password=YOUR_PASSWORD"
```

**Response will contain:**
```json
{
  "token": "your_auth_token_here",
  "user": {...}
}
```

**Copy the token** and use it in the homework create request below.

---

## 📝 Basic Homework Create (Single Subject, No Images)

```bash
curl -X POST "https://tigerservers.in/aips/api/homework/create" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=Mathematics Chapter 5 Exercise" \
  -F "class_id=10" \
  -F "section_id=A" \
  -F "submission_date=2026-02-20" \
  -F "status=1" \
  -F "homework_date=2026-02-17" \
  -F "teacher_id=1" \
  -F "submission_methods[0]=whatsapp" \
  -F "submission_methods[1]=mobile_app" \
  -F "subject_ids[0]=MATHS" \
  -F "descriptions[MATHS]=Complete exercises 5.1 to 5.5 from the textbook"
```

---

## 📚 Multiple Subjects (No Images)

```bash
curl -X POST "https://tigerservers.in/aips/api/homework/create" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=Daily Homework - Feb 17" \
  -F "class_id=8" \
  -F "section_id=B" \
  -F "submission_date=2026-02-18" \
  -F "status=1" \
  -F "homework_date=2026-02-17" \
  -F "teacher_id=1" \
  -F "submission_methods[0]=whatsapp" \
  -F "submission_methods[1]=email" \
  -F "submission_methods[2]=mobile_app" \
  -F "subject_ids[0]=ENGLISH" \
  -F "subject_ids[1]=MATHS" \
  -F "subject_ids[2]=SCIENCE" \
  -F "descriptions[ENGLISH]=Read Chapter 3 and write a summary" \
  -F "descriptions[MATHS]=Solve problems from Exercise 4.2" \
  -F "descriptions[SCIENCE]=Complete the lab worksheet"
```

---

## 🖼️ With Image Attachments

```bash
curl -X POST "https://tigerservers.in/aips/api/homework/create" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=Science Project Assignment" \
  -F "class_id=9" \
  -F "section_id=A" \
  -F "submission_date=2026-02-25" \
  -F "status=1" \
  -F "homework_date=2026-02-17" \
  -F "teacher_id=1" \
  -F "submission_methods[0]=mobile_app" \
  -F "subject_ids[0]=SCIENCE" \
  -F "descriptions[SCIENCE]=Complete the project as shown in the attached images" \
  -F "images[SCIENCE][0]=@/path/to/image1.jpg" \
  -F "images[SCIENCE][1]=@/path/to/image2.jpg"
```

**Note:** Replace `/path/to/image1.jpg` with actual file paths on your system.

---

## 🧪 Test with All Fields

```bash
curl -X POST "https://tigerservers.in/aips/api/homework/create" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=Complete Weekly Assignment" \
  -F "class_id=12" \
  -F "section_id=A" \
  -F "submission_date=2026-02-24" \
  -F "status=1" \
  -F "homework_date=2026-02-17" \
  -F "teacher_id=1" \
  -F "submission_methods[0]=whatsapp" \
  -F "submission_methods[1]=email" \
  -F "submission_methods[2]=mobile_app" \
  -F "subject_ids[0]=PHYSICS" \
  -F "subject_ids[1]=CHEMISTRY" \
  -F "subject_ids[2]=MATHS" \
  -F "descriptions[PHYSICS]=Solve numerical problems from Chapter 7" \
  -F "descriptions[CHEMISTRY]=Write chemical equations for reactions 1-20" \
  -F "descriptions[MATHS]=Complete calculus exercises" \
  -F "images[PHYSICS][0]=@/path/to/physics_worksheet.jpg" \
  -F "images[CHEMISTRY][0]=@/path/to/chem_diagram.jpg" \
  -F "images[MATHS][0]=@/path/to/math_problems.jpg"
```

---

## 📋 Field Descriptions

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `title` | string | ✅ Yes | Homework title | "Mathematics Chapter 5" |
| `class_id` | string | ✅ Yes | Class number | "10", "11", "12" |
| `section_id` | string | ✅ Yes | Section letter | "A", "B", "C" |
| `submission_date` | string | ✅ Yes | Due date (YYYY-MM-DD) | "2026-02-20" |
| `status` | string | ✅ Yes | Status (1=sent, 0=draft) | "1" |
| `homework_date` | string | ✅ Yes | Assignment date (YYYY-MM-DD) | "2026-02-17" |
| `teacher_id` | string | ✅ Yes | Teacher ID | "1" |
| `submission_methods[n]` | array | ✅ Yes | How to submit | "whatsapp", "email", "mobile_app" |
| `subject_ids[n]` | array | ✅ Yes | Subject names | "MATHS", "ENGLISH", "SCIENCE" |
| `descriptions[SUBJECT]` | string | ✅ Yes | Homework description per subject | "Complete exercises 5.1 to 5.5" |
| `images[SUBJECT][n]` | file | ❌ No | Image attachments per subject | @/path/to/image.jpg |

---

## 🎯 Available Subjects

Based on your app configuration:
- TAMIL
- ENGLISH
- MATHS
- SCIENCE
- SOCIAL
- PHYSICS
- CHEMISTRY
- COMPUTER SCIENCE
- BIOLOGY
- ZOLOGY
- BIO-BOTONY
- BIO-ZOLOGY
- ACCOUNTANTS
- BUSSINESS MATHS
- TEST

---

## 📤 Submission Methods

Valid values:
- `whatsapp` - WhatsApp submission
- `email` - Email submission
- `mobile_app` - Mobile app submission

**Note:** At least one submission method is required.

---

## ✅ Expected Success Response

```json
{
  "success": true,
  "message": "Homework created successfully",
  "data": {
    "homeworkId": "123",
    "title": "Mathematics Chapter 5 Exercise",
    "class": "10",
    "section": "A",
    "subjects": ["MATHS"],
    "submissionDate": "2026-02-20",
    "createdAt": "2026-02-17T12:30:00Z"
  }
}
```

---

## ❌ Error Responses

### Missing Required Fields
```json
{
  "success": false,
  "message": "Title is required",
  "errors": ["Title is required"]
}
```

### Invalid Token
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### Validation Error
```json
{
  "success": false,
  "message": "At least one submission method is required",
  "errors": ["At least one submission method is required"]
}
```

---

## 🔍 Testing Tips

### 1. Test Authentication First
```bash
# Save token to variable (Linux/Mac)
TOKEN=$(curl -s -X POST "https://tigerservers.in/aips/api/login" \
  -F "username=YOUR_USERNAME" \
  -F "password=YOUR_PASSWORD" | jq -r '.token')

# Use token in homework create
curl -X POST "https://tigerservers.in/aips/api/homework/create" \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Test Homework" \
  ...
```

### 2. Windows PowerShell
```powershell
# Get token
$response = Invoke-RestMethod -Uri "https://tigerservers.in/aips/api/login" -Method POST -Form @{
    username = "YOUR_USERNAME"
    password = "YOUR_PASSWORD"
}
$token = $response.token

# Create homework
Invoke-RestMethod -Uri "https://tigerservers.in/aips/api/homework/create" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" } `
  -Form @{
    title = "Test Homework"
    class_id = "10"
    section_id = "A"
    submission_date = "2026-02-20"
    status = "1"
    homework_date = "2026-02-17"
    teacher_id = "1"
    "submission_methods[0]" = "whatsapp"
    "subject_ids[0]" = "MATHS"
    "descriptions[MATHS]" = "Test description"
  }
```

### 3. Check Response
Always check the response for errors:
```bash
curl -X POST "..." -v  # Add -v for verbose output
```

### 4. Validate Date Format
Dates must be in `YYYY-MM-DD` format:
- ✅ Correct: `2026-02-20`
- ❌ Wrong: `20/02/2026`, `02-20-2026`

---

## 🐛 Common Issues

1. **401 Unauthorized**
   - Token is missing or invalid
   - Token has expired
   - Solution: Login again to get a fresh token

2. **400 Bad Request**
   - Missing required fields
   - Invalid field format
   - Solution: Check all required fields are present

3. **500 Internal Server Error**
   - Server-side error
   - Solution: Check server logs or contact backend team

4. **Image Upload Fails**
   - File path is incorrect
   - File is too large (>5MB)
   - Solution: Use correct path with `@` prefix, compress images

---

## 📝 Quick Copy-Paste Template

Replace `YOUR_TOKEN_HERE` with your actual token:

```bash
curl -X POST "https://tigerservers.in/aips/api/homework/create" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=YOUR_TITLE" \
  -F "class_id=YOUR_CLASS" \
  -F "section_id=YOUR_SECTION" \
  -F "submission_date=YYYY-MM-DD" \
  -F "status=1" \
  -F "homework_date=$(date +%Y-%m-%d)" \
  -F "teacher_id=1" \
  -F "submission_methods[0]=mobile_app" \
  -F "subject_ids[0]=YOUR_SUBJECT" \
  -F "descriptions[YOUR_SUBJECT]=YOUR_DESCRIPTION"
```

---

**Happy Testing! 🚀**
