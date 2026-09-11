# Group Messages API - Analysis & Documentation

## Overview
This document provides a comprehensive analysis of the Group Messages API, including endpoint details, data flow, usage examples, and integration guide.

---

## API Endpoint

### GET `/api/communication/getGroupMessages`

**Purpose**: Fetch all messages for a specific group (class/section combination)

**Method**: `GET`

**Base URL**: `http://your-server:3001` (or your configured NODE_URL)

**Full URL**: `http://your-server:3001/api/communication/getGroupMessages`

---

## Request Parameters

### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `classId` | string | ✅ Yes | The class identifier | `"10"`, `"9"`, `"12"` |
| `sectionId` | string | ❌ No | The section identifier (defaults to "all") | `"A"`, `"B"`, `"C"` |

### Example Requests

**Fetch messages for Class 10, Section A:**
```http
GET /api/communication/getGroupMessages?classId=10&sectionId=A
```

**Fetch messages for Class 9, All Sections:**
```http
GET /api/communication/getGroupMessages?classId=9&sectionId=all
```

**Fetch messages for Class 12 (section defaults to "all"):**
```http
GET /api/communication/getGroupMessages?classId=12
```

---

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "message": "Welcome to the group chat!",
      "content": "Welcome to the group chat!",
      "senderId": "staff_001",
      "sender_name": "Mr. Teacher",
      "receiverId": "G_10_A",
      "type": "group",
      "isGroup": true,
      "classId": "10",
      "sectionId": "A",
      "groupId": "G_10_A",
      "created_at": "2026-02-08T05:57:09.000Z",
      "isAttachment": false
    },
    {
      "id": "2",
      "message": "Homework due tomorrow",
      "content": "Homework due tomorrow",
      "senderId": "staff_002",
      "sender_name": "Ms. Smith",
      "receiverId": "G_10_A",
      "type": "group",
      "isGroup": true,
      "classId": "10",
      "sectionId": "A",
      "groupId": "G_10_A",
      "created_at": "2026-02-09T03:30:00.000Z",
      "isAttachment": false
    }
  ],
  "groupId": "G_10_A",
  "classId": "10",
  "sectionId": "A"
}
```

### Error Response (400 Bad Request)

```json
{
  "success": false,
  "message": "classId is required"
}
```

---

## Message Object Structure

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique message identifier |
| `message` | string | The message content/text |
| `content` | string | Duplicate of message (for compatibility) |
| `senderId` | string | ID of the staff member who sent the message |
| `sender_name` | string | Display name of the sender |
| `receiverId` | string | Group identifier (format: `G_{classId}_{sectionId}`) |
| `type` | string | Message type (always "group" for group messages) |
| `isGroup` | boolean | Flag indicating this is a group message (always true) |
| `classId` | string | The class this message belongs to |
| `sectionId` | string | The section this message belongs to |
| `groupId` | string | Group identifier (same as receiverId) |
| `created_at` | string (ISO 8601) | Timestamp when message was created |
| `isAttachment` | boolean | Whether message contains an attachment |

---

## Frontend Hook: `useGroupMessages`

### Import

```typescript
import { useGroupMessages } from '../hooks/useStudentData';
```

### Signature

```typescript
useGroupMessages(classId?: string, sectionId?: string): UseQueryResult<ChatMessage[]>
```

### Parameters

- **classId** (optional): The class ID to fetch messages for
- **sectionId** (optional): The section ID (defaults to "all" if not provided)

### Return Value

Returns a TanStack Query result object with:

| Property | Type | Description |
|----------|------|-------------|
| `data` | `ChatMessage[]` | Array of group messages |
| `isLoading` | boolean | True while fetching data |
| `isError` | boolean | True if fetch failed |
| `error` | Error | Error object if fetch failed |
| `refetch` | function | Function to manually refetch data |
| `isFetching` | boolean | True while refetching |

### Usage Examples

#### Example 1: Basic Usage

```typescript
import { useGroupMessages } from '../hooks/useStudentData';

function GroupChatScreen() {
  const { data: messages, isLoading, error } = useGroupMessages("10", "A");

  if (isLoading) return <Text>Loading messages...</Text>;
  if (error) return <Text>Error loading messages</Text>;

  return (
    <FlatList
      data={messages}
      renderItem={({ item }) => (
        <MessageBubble message={item} />
      )}
    />
  );
}
```

#### Example 2: With Student's Class

```typescript
import { useUser, isStudent } from '../hooks/useUser';
import { useGroupMessages } from '../hooks/useStudentData';

function StudentGroupChat() {
  const { user } = useUser();
  const student = isStudent(user) ? user : null;

  const { 
    data: messages, 
    isLoading, 
    refetch 
  } = useGroupMessages(
    student?.class, 
    student?.section
  );

  return (
    <View>
      <TouchableOpacity onPress={() => refetch()}>
        <Text>Refresh</Text>
      </TouchableOpacity>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <MessageList messages={messages} />
      )}
    </View>
  );
}
```

#### Example 3: With Error Handling

```typescript
function GroupChat({ classId, sectionId }) {
  const { 
    data: messages = [], 
    isLoading, 
    isError,
    error,
    refetch 
  } = useGroupMessages(classId, sectionId);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text>Loading group messages...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Icon name="alert-circle" size={60} color="#ef4444" />
        <Text style={styles.errorText}>
          Failed to load messages
        </Text>
        <Text style={styles.errorDetail}>
          {error?.message || 'Unknown error'}
        </Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => refetch()}
        >
          <Text>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (messages.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No messages yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MessageItem message={item} />}
    />
  );
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT APP                               │
│                                                              │
│  1. Student opens Communication module                      │
│  2. useGroupMessages hook is called with:                   │
│     - classId: "10"                                         │
│     - sectionId: "A"                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP GET Request
                     │ /api/communication/getGroupMessages?classId=10&sectionId=A
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND SERVER                             │
│                                                              │
│  1. Receives request                                        │
│  2. Validates classId parameter                             │
│  3. Constructs groupId: "G_10_A"                            │
│  4. Queries database for messages where:                    │
│     - receiverId = "G_10_A"                                 │
│     - OR (classId = "10" AND sectionId = "A")              │
│  5. Returns message array                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ JSON Response
                     │ { success: true, data: [...], groupId: "G_10_A" }
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT APP                               │
│                                                              │
│  1. Hook receives response                                  │
│  2. Maps data to ChatMessage format                         │
│  3. Updates component state                                 │
│  4. Renders messages in UI                                  │
│  5. Caches for 30 seconds (staleTime)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Hook Features

### 1. **Automatic Caching**
- Messages are cached for 30 seconds (`staleTime: 30000`)
- Reduces unnecessary API calls
- Improves performance

### 2. **Smart Refetching**
- Automatically refetches when window gains focus
- Ensures messages are always up-to-date
- Can be manually triggered with `refetch()`

### 3. **Conditional Fetching**
- Only fetches if `classId` is provided
- Prevents unnecessary API calls
- Saves bandwidth and server resources

### 4. **Error Handling**
- Catches and logs errors
- Returns error state to component
- Allows for graceful error UI

### 5. **Type Safety**
- Fully typed with TypeScript
- Returns `ChatMessage[]` type
- Compile-time error checking

---

## Integration with Existing Code

### ChatScreen Integration

```typescript
// In ChatScreen.tsx
import { useGroupMessages } from '../../hooks/useStudentData';

const ChatScreen = ({ route }) => {
  const { data } = route.params;
  const isGroup = data?.type === 'group';

  // Use group messages hook for group chats
  const { 
    data: groupMessages, 
    isLoading: isLoadingGroup 
  } = useGroupMessages(
    isGroup ? data?.classId : undefined,
    isGroup ? data?.sectionId : undefined
  );

  // Use individual messages hook for individual chats
  const { 
    data: individualMessages, 
    isLoading: isLoadingIndividual 
  } = useMessages(
    !isGroup ? userId : undefined,
    !isGroup ? data?.stud_no : undefined
  );

  const messages = isGroup ? groupMessages : individualMessages;
  const isLoading = isGroup ? isLoadingGroup : isLoadingIndividual;

  // Rest of component...
};
```

---

## Console Logs for Debugging

The hook includes comprehensive console logging:

### Successful Fetch
```
📥 [useGroupMessages] Fetching messages for: { classId: "10", sectionId: "A" }
✅ [useGroupMessages] Received: { success: true, data: [...], groupId: "G_10_A" }
```

### Skipped Fetch (No classId)
```
⏭️ [useGroupMessages] Skipping: classId is required
```

### Error
```
📥 [useGroupMessages] Fetching messages for: { classId: "10", sectionId: "A" }
❌ [useGroupMessages] Error: AxiosError: Network Error
```

---

## Testing Guide

### Test Case 1: Fetch Messages for Specific Class/Section

**Setup:**
- Student: Class 10, Section A
- Staff has sent 3 messages to Class 10-A

**Steps:**
1. Login as student
2. Navigate to Communication
3. Open group chat for Class 10-A

**Expected:**
- Hook fetches messages with `classId=10&sectionId=A`
- Returns array of 3 messages
- Messages display in chat screen

**Console Logs:**
```
📥 [useGroupMessages] Fetching messages for: { classId: "10", sectionId: "A" }
✅ [useGroupMessages] Received: { success: true, data: [3 messages], groupId: "G_10_A" }
```

### Test Case 2: No Messages Available

**Setup:**
- Student: Class 9, Section B
- No messages sent to this group yet

**Steps:**
1. Login as student
2. Navigate to Communication
3. Check if group chat appears

**Expected:**
- Hook fetches successfully
- Returns empty array `[]`
- UI shows "No messages yet"

### Test Case 3: Network Error

**Setup:**
- Backend server is offline

**Steps:**
1. Stop backend server
2. Login as student
3. Try to open group chat

**Expected:**
- Hook catches error
- `isError` is true
- Error UI is displayed
- Retry button allows refetch

---

## Performance Considerations

### 1. **Caching Strategy**
- 30-second cache reduces API calls
- Balance between freshness and performance
- Adjust `staleTime` based on needs

### 2. **Pagination** (Future Enhancement)
```typescript
// Future implementation
export const useGroupMessages = (
  classId?: string, 
  sectionId?: string,
  page: number = 1,
  limit: number = 50
) => {
  // Add pagination params
};
```

### 3. **Infinite Scroll** (Future Enhancement)
```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

export const useInfiniteGroupMessages = (classId, sectionId) => {
  return useInfiniteQuery({
    queryKey: ['groupMessages', classId, sectionId],
    queryFn: ({ pageParam = 1 }) => fetchGroupMessages(classId, sectionId, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
};
```

---

## Security Considerations

### Current Implementation (Mock Data)
⚠️ **Warning**: Current implementation returns mock data for demonstration

### Production Implementation Checklist

- [ ] Add authentication middleware
- [ ] Verify student belongs to requested class/section
- [ ] Implement database queries
- [ ] Add rate limiting
- [ ] Sanitize input parameters
- [ ] Add SQL injection protection
- [ ] Implement proper error handling
- [ ] Add logging for audit trail

### Example Secure Implementation

```javascript
app.get("/api/communication/getGroupMessages", authenticateToken, async (req, res) => {
  const { classId, sectionId } = req.query;
  const userId = req.user.id; // From auth token

  // Verify user has access to this group
  const hasAccess = await verifyGroupAccess(userId, classId, sectionId);
  if (!hasAccess) {
    return res.status(403).json({ 
      success: false, 
      message: "Access denied" 
    });
  }

  // Fetch from database
  const messages = await db.query(
    'SELECT * FROM messages WHERE classId = ? AND sectionId = ? ORDER BY created_at DESC',
    [classId, sectionId || 'all']
  );

  res.json({ success: true, data: messages });
});
```

---

## Summary

### ✅ What We Built

1. **Backend API Endpoint**
   - GET `/api/communication/getGroupMessages`
   - Accepts `classId` and `sectionId` parameters
   - Returns array of group messages

2. **Frontend Hook**
   - `useGroupMessages(classId, sectionId)`
   - Automatic caching and refetching
   - Type-safe with TypeScript
   - Comprehensive error handling

3. **Documentation**
   - Complete API specification
   - Usage examples
   - Integration guide
   - Testing scenarios

### 🎯 Key Features

- ✅ Fetch group messages by class/section
- ✅ Automatic caching (30 seconds)
- ✅ Refetch on window focus
- ✅ Conditional fetching
- ✅ Error handling
- ✅ TypeScript support
- ✅ Console logging for debugging

### 📝 Next Steps

1. Replace mock data with real database queries
2. Add authentication and authorization
3. Implement pagination for large message lists
4. Add message filtering (by date, sender, etc.)
5. Implement real-time updates via WebSocket
6. Add message search functionality
