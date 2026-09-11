# Class and Section Options Update

## ✅ Changes Completed

Updated the class and section options in the Staff Homework module to match the new requirements.

---

## 📋 Updated Values

### Classes (Before → After)

**Before:**
```typescript
ClassType = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'
CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
```

**After:**
```typescript
ClassType = 'PREKG' | 'LKG' | 'UKG' | '1ST' | '2ND' | '3RD' | '4TH' | '5TH' | '6TH' | '7TH' | '8TH' | '9TH' | '10TH' | '11TH' | '12TH'
CLASSES = ['PREKG', 'LKG', 'UKG', '1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH', '10TH', '11TH', '12TH']
```

### Sections (Before → After)

**Before:**
```typescript
SectionType = 'A' | 'B' | 'C' | 'D' | 'E'
SECTIONS = ['A', 'B', 'C', 'D', 'E']
```

**After:**
```typescript
SectionType = 'Section A' | 'Section B' | 'Section C' | 'Section D'
SECTIONS = ['Section A', 'Section B', 'Section C', 'Section D']
```

---

## 📝 Files Modified

### 1. `types/staffHomework.type.ts`
- ✅ Updated `ClassType` to include pre-primary classes
- ✅ Updated `SectionType` to use full section names
- ✅ Updated `CLASSES` array with new values
- ✅ Updated `SECTIONS` array with new values

### 2. `screens/modules/StaffHomework/StaffHomework.tsx`
- ✅ Updated class dropdown to display values as-is (no extra "Class" prefix)
- ✅ Updated section dropdown to display values as-is (no extra "Section" prefix)

---

## 🎯 New Class Options (15 total)

1. **PREKG** - Pre-Kindergarten
2. **LKG** - Lower Kindergarten
3. **UKG** - Upper Kindergarten
4. **1ST** - 1st Grade
5. **2ND** - 2nd Grade
6. **3RD** - 3rd Grade
7. **4TH** - 4th Grade
8. **5TH** - 5th Grade
9. **6TH** - 6th Grade
10. **7TH** - 7th Grade
11. **8TH** - 8th Grade
12. **9TH** - 9th Grade
13. **10TH** - 10th Grade
14. **11TH** - 11th Grade
15. **12TH** - 12th Grade

---

## 🎯 New Section Options (4 total)

1. **Section A**
2. **Section B**
3. **Section C**
4. **Section D**

---

## 🔄 Impact on API

When creating homework, the API will now receive:

### Example Request
```json
{
  "class_id": "PREKG",      // Instead of "1"
  "section_id": "Section A" // Instead of "A"
}
```

### Updated cURL Example
```bash
curl -X POST "https://tigerservers.in/aips/api/homework/create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Homework for Pre-KG" \
  -F "class_id=PREKG" \
  -F "section_id=Section A" \
  -F "submission_date=2026-02-25" \
  -F "status=1" \
  -F "homework_date=2026-02-17" \
  -F "teacher_id=1" \
  -F "submission_methods[0]=mobile_app" \
  -F "subject_ids[0]=ENGLISH" \
  -F "descriptions[ENGLISH]=Complete the worksheet"
```

---

## 📱 UI Changes

### Class Dropdown
**Before:**
- Class 1
- Class 2
- Class 3
- ...

**After:**
- PREKG
- LKG
- UKG
- 1ST
- 2ND
- 3RD
- ...

### Section Dropdown
**Before:**
- Section A
- Section B
- Section C
- Section D
- Section E

**After:**
- Section A
- Section B
- Section C
- Section D

---

## ⚠️ Backend Compatibility

**Important:** Make sure your backend API is updated to handle these new values:

### Database Schema
Ensure your database columns can store these values:
- `class_id` column should accept strings like "PREKG", "LKG", "1ST", etc.
- `section_id` column should accept strings like "Section A", "Section B", etc.

### Backend Validation
Update your backend validation to accept:
```php
// PHP Example
public $class = array(
    "PREKG", "LKG", "UKG", 
    "1ST", "2ND", "3RD", "4TH", "5TH", "6TH", 
    "7TH", "8TH", "9TH", "10TH", "11TH", "12TH"
);

public $section = array(
    "Section A", "Section B", "Section C", "Section D"
);
```

---

## ✅ Testing Checklist

- [ ] Open Staff Homework → Create tab
- [ ] Click on Class dropdown
- [ ] Verify all 15 classes appear (PREKG to 12TH)
- [ ] Select a class (e.g., PREKG)
- [ ] Click on Section dropdown
- [ ] Verify all 4 sections appear (Section A to Section D)
- [ ] Select a section (e.g., Section A)
- [ ] Create a test homework
- [ ] Verify API receives correct class_id and section_id values
- [ ] Check database to ensure values are stored correctly

---

## 🎉 Status: Complete

All changes have been successfully applied. The app is now ready to use the new class and section options!
