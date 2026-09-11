# Quick Copy-Paste cURL Commands for Homework Create API

## 🚀 STEP 1: Get Token (Copy and run this first)

```bash
curl -X POST "https://tigerservers.in/aips/api/login" \
  -F "username=YOUR_USERNAME" \
  -F "password=YOUR_PASSWORD"
```

**Copy the token from the response and use it below**

---

## 📝 STEP 2: Create Homework (Replace YOUR_TOKEN_HERE)

### Simple Single Subject
```bash
curl -X POST "https://tigerservers.in/aips/api/homework/create" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=Mathematics Homework" \
  -F "class_id=10" \
  -F "section_id=A" \
  -F "submission_date=2026-02-25" \
  -F "status=1" \
  -F "homework_date=2026-02-17" \
  -F "teacher_id=1" \
  -F "submission_methods[0]=mobile_app" \
  -F "subject_ids[0]=MATHS" \
  -F "descriptions[MATHS]=Complete Chapter 5 exercises"
```

### Multiple Subjects
```bash
curl -X POST "https://tigerservers.in/aips/api/homework/create" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=Daily Homework" \
  -F "class_id=10" \
  -F "section_id=A" \
  -F "submission_date=2026-02-25" \
  -F "status=1" \
  -F "homework_date=2026-02-17" \
  -F "teacher_id=1" \
  -F "submission_methods[0]=whatsapp" \
  -F "submission_methods[1]=mobile_app" \
  -F "subject_ids[0]=MATHS" \
  -F "subject_ids[1]=ENGLISH" \
  -F "subject_ids[2]=SCIENCE" \
  -F "descriptions[MATHS]=Solve Exercise 5.1" \
  -F "descriptions[ENGLISH]=Read Chapter 3" \
  -F "descriptions[SCIENCE]=Complete lab worksheet"
```

---

## 🔄 One-Command Test (Linux/Mac with jq)

```bash
TOKEN=$(curl -s -X POST "https://tigerservers.in/aips/api/login" -F "username=YOUR_USERNAME" -F "password=YOUR_PASSWORD" | jq -r '.token') && curl -X POST "https://tigerservers.in/aips/api/homework/create" -H "Authorization: Bearer $TOKEN" -F "title=Test Homework" -F "class_id=10" -F "section_id=A" -F "submission_date=2026-02-25" -F "status=1" -F "homework_date=$(date +%Y-%m-%d)" -F "teacher_id=1" -F "submission_methods[0]=mobile_app" -F "subject_ids[0]=MATHS" -F "descriptions[MATHS]=Test homework description"
```

---

## 📋 Field Reference

| Field | Example | Notes |
|-------|---------|-------|
| title | "Mathematics Homework" | Required |
| class_id | "10" | Required (1-12) |
| section_id | "A" | Required (A-E) |
| submission_date | "2026-02-25" | Required (YYYY-MM-DD) |
| status | "1" | Required (1=sent, 0=draft) |
| homework_date | "2026-02-17" | Required (YYYY-MM-DD) |
| teacher_id | "1" | Required |
| submission_methods[n] | "mobile_app" | whatsapp, email, mobile_app |
| subject_ids[n] | "MATHS" | MATHS, ENGLISH, SCIENCE, etc. |
| descriptions[SUBJECT] | "Complete exercises" | Description per subject |

---

## 🎯 Available Subjects
TAMIL, ENGLISH, MATHS, SCIENCE, SOCIAL, PHYSICS, CHEMISTRY, COMPUTER SCIENCE, BIOLOGY, ZOLOGY, BIO-BOTONY, BIO-ZOLOGY, ACCOUNTANTS, BUSSINESS MATHS, TEST
