# Backend API Fix Required

## Problem
When staff members try to access the Communication module and select a class and section, the app makes an API call to:
```
GET https://tigerservers.in/aips/api/communication/students/{class}/{section}
```

This endpoint is currently returning a **500 Internal Server Error**, which prevents staff from selecting students to send messages to.

## Error Details
- **Endpoint**: `api/communication/students/{class}/{section}`
- **Method**: GET
- **Example Call**: `api/communication/students/3RD/Section%20A`
- **Current Response**: 500 Internal Server Error
- **Expected Response**: JSON array of students

## Required Backend Fix

You need to create or fix the PHP endpoint at:
```
/aips/api/communication/students/{class}/{section}
```

### Expected Response Format
The endpoint should return a JSON response with an array of students:

```json
{
  "data": [
    {
      "stud_id": "123",
      "stud_no": "2024001",
      "stud_firstname": "John",
      "stud_lastname": "Doe",
      "stud_class": "3RD",
      "stud_section": "Section A",
      "stud_photo": "uploads/students/john.jpg"
    },
    {
      "stud_id": "124",
      "stud_no": "2024002",
      "stud_firstname": "Jane",
      "stud_lastname": "Smith",
      "stud_class": "3RD",
      "stud_section": "Section A",
      "stud_photo": "uploads/students/jane.jpg"
    }
  ]
}
```

Or simply an array:
```json
[
  {
    "stud_id": "123",
    "stud_no": "2024001",
    "stud_firstname": "John",
    "stud_lastname": "Doe",
    ...
  }
]
```

### Required Fields
At minimum, each student object should include:
- `stud_id` - Student's unique ID (used for chat identification)
- `stud_no` - Student's roll number
- `stud_firstname` - Student's first name
- `stud_lastname` - Student's last name
- `stud_class` - Student's class
- `stud_section` - Student's section
- `stud_photo` (optional) - Path to student's photo

### Sample PHP Implementation

Create a file at `/aips/api/communication/students.php` or add to your existing communication controller:

```php
<?php
// Get class and section from URL parameters
$class = $_GET['class'] ?? null;
$section = $_GET['section'] ?? null;

if (!$class || !$section) {
    http_response_code(400);
    echo json_encode(['error' => 'Class and section are required']);
    exit;
}

// Decode URL-encoded values
$class = urldecode($class);
$section = urldecode($section);

// Query database for students in this class/section
// Adjust table and column names to match your database schema
$query = "SELECT 
    stud_id,
    stud_no,
    stud_firstname,
    stud_lastname,
    stud_class,
    stud_section,
    stud_photo,
    stud_phoneno_first,
    stud_email
FROM students 
WHERE stud_class = ? 
AND stud_section = ?
AND stud_status = '1'
ORDER BY stud_firstname ASC";

$stmt = $conn->prepare($query);
$stmt->bind_param("ss", $class, $section);
$stmt->execute();
$result = $stmt->get_result();

$students = [];
while ($row = $result->fetch_assoc()) {
    $students[] = $row;
}

// Return JSON response
header('Content-Type: application/json');
echo json_encode(['data' => $students]);
?>
```

### Alternative: Use Existing Endpoint

If you already have an endpoint that returns students by class/section, you can:
1. Tell me the endpoint URL
2. I'll update the frontend to use that endpoint instead

## Frontend Changes Made

I've already made the following changes to handle this error gracefully:

1. **Updated API endpoint** in `hooks/useStudentData.ts`:
   - Changed from `api/students/list/{class}/{section}` 
   - To `api/communication/students/{class}/{section}`

2. **Added error handling**:
   - The app no longer crashes when the API fails
   - Returns empty array instead of throwing error
   - Shows user-friendly error message

3. **Improved user experience**:
   - Shows "Unable to load students. Please check your connection or contact support." when API fails
   - Shows "No students found for this class/section" when no students are returned

## Testing the Fix

After implementing the backend endpoint, test it by:

1. Opening the app as a staff member
2. Navigate to Communication → New Message
3. Select "Individual" tab
4. Select a Class (e.g., "3RD")
5. Select a Section (e.g., "Section A")
6. Click "Select Student" dropdown

You should see a list of students. If you see the error message, check:
- Backend endpoint is accessible
- Database query is working
- Response format matches expected structure
- No PHP errors in server logs

## Current Status

✅ **Frontend**: Fixed with error handling and better UX
❌ **Backend**: Needs to be implemented/fixed

The app will work once the backend endpoint is created and returns the correct data format.
