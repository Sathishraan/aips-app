# Staff Homework - API Subject Integration

## Overview
Updated the Staff Homework module to fetch subjects dynamically from the API endpoint `api/subject/list` instead of using hardcoded values.

## Changes Made

### 1. Hook Updates (`hooks/useStaffHomework.ts`)

#### Added API Endpoint
```typescript
const API = {
    // ... existing endpoints
    SUBJECTS: 'api/subject/list'
};
```

#### Created `useSubjectList` Hook
- **Purpose**: Fetch subjects from the API
- **Endpoint**: `api/subject/list`
- **Caching**: 30 minutes stale time
- **Error Handling**: Returns empty array on error instead of throwing
- **Response Parsing**: Handles multiple response formats:
  - Direct array: `['TAMIL', 'ENGLISH', ...]`
  - Nested in data: `{ data: [...] }`
  - Nested in subjects: `{ subjects: [...] }`
  - Object format: `[{ name: 'TAMIL' }, ...]`

### 2. Component Updates (`screens/modules/StaffHomework/StaffHomework.tsx`)

#### Import Changes
- Added `useSubjectList` to imports from `useStaffHomework` hook

#### State Management
- Added `useSubjectList()` hook call to fetch subjects
- Created `availableSubjects` variable that:
  - Uses API subjects when available
  - Falls back to hardcoded `AVAILABLE_SUBJECTS` if API fails or returns empty
- Updated `filteredSubjects` to use `availableSubjects`

#### UI Enhancements
Added three states for subject selection:
1. **Loading State**: Shows spinner with "Loading subjects..." message
2. **Loaded State**: Displays subject chips as before
3. **Empty State**: Shows appropriate message:
   - "No subjects found matching your search" (when searching)
   - "No subjects available" (when no subjects exist)

#### New Styles Added
```typescript
subjectsLoadingContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  gap: 10,
}
subjectsLoadingText: {
  fontSize: 14,
  color: '#6B7280',
}
noSubjectsText: {
  fontSize: 14,
  color: '#9CA3AF',
  textAlign: 'center',
  padding: 20,
  fontStyle: 'italic',
}
```

## API Response Format

The hook expects one of these formats:

### Format 1: Direct Array
```json
["TAMIL", "ENGLISH", "MATHS", "SCIENCE"]
```

### Format 2: Nested in Data
```json
{
  "data": ["TAMIL", "ENGLISH", "MATHS", "SCIENCE"]
}
```

### Format 3: Nested in Subjects
```json
{
  "subjects": ["TAMIL", "ENGLISH", "MATHS", "SCIENCE"]
}
```

### Format 4: Object Array
```json
[
  { "name": "TAMIL" },
  { "subject_name": "ENGLISH" },
  { "title": "MATHS" }
]
```

## Fallback Behavior

If the API:
- Fails to respond
- Returns an error
- Returns an empty array
- Returns invalid data

The component will automatically fall back to the hardcoded `AVAILABLE_SUBJECTS` array defined in `types/staffHomework.type.ts`.

## Type Safety

All subjects are properly typed as `SubjectType` to maintain type safety throughout the component. The API response is cast to `SubjectType[]` when available.

## Testing Checklist

- [ ] Verify API endpoint `api/subject/list` is accessible
- [ ] Check that subjects load correctly on component mount
- [ ] Verify loading indicator appears during fetch
- [ ] Test fallback to hardcoded subjects when API fails
- [ ] Verify search functionality works with API subjects
- [ ] Test subject selection and homework creation with API subjects
- [ ] Check console logs for API response format

## Console Logs

The implementation includes detailed logging:
- `📡 [useSubjectList] Fetching from: <url>` - API call initiated
- `📥 [useSubjectList] Response received:` - Raw API response
- `✅ [useSubjectList] Parsed X subjects:` - Successfully parsed subjects
- `❌ [useSubjectList] Fetch failed:` - Error occurred

## Future Enhancements

1. Add refresh button to manually reload subjects
2. Implement subject caching in AsyncStorage
3. Add ability to add custom subjects
4. Sync selected subjects with user preferences
