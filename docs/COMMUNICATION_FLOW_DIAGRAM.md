# Communication Flow Diagram

## Student Login - Empty Chat List Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     STUDENT LOGIN                                │
│                                                                   │
│  1. Student logs in                                              │
│  2. CommunicationScreen loads                                    │
│  3. Reads chat cache (empty initially)                           │
│  4. Shows "No conversations yet" message                         │
│                                                                   │
│  ✅ Chat list is EMPTY until staff messages                      │
└─────────────────────────────────────────────────────────────────┘
```

## Staff Sends Group Message Flow

```
┌──────────────────┐
│  STAFF DEVICE    │
│                  │
│  1. Select Class │
│  2. Select Section│
│  3. Type Message │
│  4. Send         │
└────────┬─────────┘
         │
         │ HTTP POST /api/communication/sendMessage
         │ { message, type: "group", class_id, section_id }
         ▼
┌────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER                               │
│                                                                  │
│  1. Receives message                                            │
│  2. Identifies as group message (has class_id)                  │
│  3. Creates message payload:                                    │
│     - type: "group"                                             │
│     - classId: "10"                                             │
│     - sectionId: "A"                                            │
│     - groupId: "G_10_A"                                         │
│     - message, timestamp, senderName, etc.                      │
│  4. Broadcasts via WebSocket:                                   │
│     - io.emit("receive_message", payload)                       │
│     - io.emit("group_message", payload)                         │
└────────┬───────────────────────────────────────────────────────┘
         │
         │ WebSocket Broadcast
         │
    ┌────┴────┬────────┬────────┬────────┐
    ▼         ▼        ▼        ▼        ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│Student 1│ │Student 2│ │Student 3│ │Student 4│
│Class 10A│ │Class 10A│ │Class 10B│ │Class 9A │
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
     │           │           │           │
     │ Filter    │ Filter    │ Filter    │ Filter
     │ ✅ Match  │ ✅ Match  │ ❌ Skip   │ ❌ Skip
     │           │           │           │
     ▼           ▼           
┌─────────────────────────────────────────────────────────────────┐
│         GLOBAL MESSAGE LISTENER (Student 1 & 2)                 │
│                                                                  │
│  1. Receives message via socket                                 │
│  2. Checks: Is this for my class? (classId === "10")           │
│  3. Checks: Is this for my section? (sectionId === "A")        │
│  4. ✅ Match! Process message                                   │
│  5. Create chat entry:                                          │
│     - chatId: "group_10_A"                                      │
│     - chatName: "Class 10 - A"                                  │
│     - type: "group"                                             │
│  6. Add message to cache                                        │
│  7. Add chat to chat list                                       │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              STUDENT'S CHAT LIST SCREEN                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 👥 Class 10 - A                              2:30 PM   │    │
│  │ Hello students, homework is due tomorrow              │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ✅ Group chat now appears!                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Staff Sends Individual Message Flow

```
┌──────────────────┐
│  STAFF DEVICE    │
│                  │
│  1. Select Student│
│  2. Type Message │
│  3. Send         │
└────────┬─────────┘
         │
         │ HTTP POST /api/communication/sendMessage
         │ { message, type: "individual", receiverId: "S12345" }
         ▼
┌────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER                               │
│                                                                  │
│  1. Receives message                                            │
│  2. Identifies as individual message (has receiverId)           │
│  3. Creates message payload:                                    │
│     - type: "individual"                                        │
│     - receiverId: "S12345"                                      │
│     - message, timestamp, senderName, senderId, etc.            │
│  4. Broadcasts via WebSocket:                                   │
│     - io.emit("receive_message", payload)                       │
│     - io.emit("staff_message", payload)                         │
└────────┬───────────────────────────────────────────────────────┘
         │
         │ WebSocket Broadcast
         │
    ┌────┴────┬────────┬────────┬────────┐
    ▼         ▼        ▼        ▼        ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│Student  │ │Student  │ │Student  │ │Student  │
│S12345   │ │S12346   │ │S12347   │ │S12348   │
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
     │           │           │           │
     │ Filter    │ Filter    │ Filter    │ Filter
     │ ✅ Match  │ ❌ Skip   │ ❌ Skip   │ ❌ Skip
     │           
     ▼           
┌─────────────────────────────────────────────────────────────────┐
│         GLOBAL MESSAGE LISTENER (Student S12345)                │
│                                                                  │
│  1. Receives message via socket                                 │
│  2. Checks: Is this for me? (receiverId === "S12345")          │
│  3. ✅ Match! Process message                                   │
│  4. Create chat entry:                                          │
│     - chatId: "staff_001" (sender's ID)                         │
│     - chatName: "Staff Member"                                  │
│     - type: "individual"                                        │
│  5. Add message to cache                                        │
│  6. Add chat to chat list                                       │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              STUDENT'S CHAT LIST SCREEN                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 👤 Staff Member                          2:35 PM       │    │
│  │ Please submit your assignment by Friday               │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ✅ Individual chat now appears!                                │
└─────────────────────────────────────────────────────────────────┘
```

## Key Points

### Message Filtering
- **Client-side filtering** ensures students only see relevant messages
- **Group messages**: Filtered by `classId` and `sectionId`
- **Individual messages**: Filtered by `receiverId`
- Messages not matching the filter are silently ignored

### Chat Creation
- Chats are created **automatically** when first message arrives
- **Group chats**: Use format `group_{classId}_{sectionId}`
- **Individual chats**: Use staff member's ID as chatId
- Chat metadata includes all necessary info for navigation

### Real-time Updates
- WebSocket ensures instant message delivery
- No polling or manual refresh needed
- Messages appear immediately in chat list
- Works even when app is in background (if socket connected)

### Offline Support
- Messages are cached locally using `expo-secure-store`
- Students can view message history offline
- Cache persists across app restarts
