# Quick Fix Reference - Communication Error

## 🚨 Problem
Staff can't select students in Communication module - API returns 500 error.

## ✅ Frontend Fix (DONE)
- App won't crash anymore
- Shows user-friendly error message
- Better error logging

## ❌ Backend Fix (REQUIRED)

### Create This PHP Endpoint:
**URL**: `/aips/api/communication/students/{class}/{section}`  
**Method**: GET  
**Example**: `api/communication/students/3RD/Section%20A`

### Quick PHP Code:
```php
<?php
$class = urldecode($_GET['class']);
$section = urldecode($_GET['section']);

$query = "SELECT stud_id, stud_no, stud_firstname, stud_lastname, 
          stud_class, stud_section, stud_photo 
          FROM students 
          WHERE stud_class = ? AND stud_section = ? AND stud_status = '1'
          ORDER BY stud_firstname";

$stmt = $conn->prepare($query);
$stmt->bind_param("ss", $class, $section);
$stmt->execute();
$result = $stmt->get_result();

$students = [];
while ($row = $result->fetch_assoc()) {
    $students[] = $row;
}

header('Content-Type: application/json');
echo json_encode(['data' => $students]);
?>
```

### Response Format:
```json
{
  "data": [
    {
      "stud_id": "123",
      "stud_no": "2024001",
      "stud_firstname": "John",
      "stud_lastname": "Doe",
      "stud_class": "3RD",
      "stud_section": "Section A"
    }
  ]
}
```

## 📝 Full Documentation
See `BACKEND_API_FIX_REQUIRED.md` for complete details.

## 🧪 Test After Backend Fix
1. Login as staff
2. Go to Communication → New Message
3. Select Individual → Choose Class → Choose Section
4. Click "Select Student"
5. Should see list of students ✅
