# Testing Guide - Student Communication Module

## Quick Test Scenarios

### Scenario 1: Fresh Student Login (Empty Chat List)

**Steps:**
1. Login as a student who has never received messages
2. Navigate to Communication module
3. **Expected Result**: 
   - ✅ Chat list is empty
   - ✅ Shows "No conversations yet" message
   - ✅ No "Start Chat" button (students can't initiate)

**Pass Criteria:**
- [ ] Chat list is completely empty
- [ ] Empty state message is displayed
- [ ] No auto-discovered group chats appear

---

### Scenario 2: Staff Sends Group Message

**Setup:**
- Student: Class 10, Section A
- Staff: Logged in with permission to send messages

**Steps:**
1. **As Staff:**
   - Navigate to Communication → New Communication
   - Select "Group"
   - Select Class: "10"
   - Select Section: "A"
   - Type message: "Test group message"
   - Send

2. **As Student (Class 10-A):**
   - Check Communication screen
   - **Expected Result**:
     - ✅ Group chat appears: "Class 10 - A"
     - ✅ Last message shows: "Test group message"
     - ✅ Timestamp is current
     - ✅ Group icon (👥) is displayed

3. **As Different Student (Class 10-B):**
   - Check Communication screen
   - **Expected Result**:
     - ✅ Chat list remains empty
     - ✅ Message does NOT appear (wrong section)

**Pass Criteria:**
- [ ] Message appears for correct class/section students
- [ ] Message does NOT appear for other students
- [ ] Group chat is properly labeled
- [ ] Message content is correct

---

### Scenario 3: Staff Sends Individual Message

**Setup:**
- Student: ID S12345
- Staff: Logged in

**Steps:**
1. **As Staff:**
   - Navigate to Communication → New Communication
   - Select "Individual"
   - Select Class and Section to see student list
   - Select specific student (S12345)
   - Type message: "Test individual message"
   - Send

2. **As Student S12345:**
   - Check Communication screen
   - **Expected Result**:
     - ✅ Individual chat appears: "Staff Member"
     - ✅ Last message shows: "Test individual message"
     - ✅ Timestamp is current
     - ✅ User icon is displayed

3. **As Different Student (S12346):**
   - Check Communication screen
   - **Expected Result**:
     - ✅ Chat list remains empty
     - ✅ Message does NOT appear

**Pass Criteria:**
- [ ] Message appears only for targeted student
- [ ] Message does NOT appear for other students
- [ ] Individual chat is properly labeled
- [ ] Message content is correct

---

### Scenario 4: Multiple Messages (Chat Persistence)

**Steps:**
1. Staff sends first group message to Class 10-A
2. Student S12345 (Class 10-A) sees chat appear
3. Staff sends second message to same group
4. **Expected Result**:
   - ✅ Same chat is updated (not duplicated)
   - ✅ Last message shows the new message
   - ✅ Timestamp is updated
   - ✅ Chat remains at top of list

**Pass Criteria:**
- [ ] No duplicate chats created
- [ ] Messages accumulate in same chat
- [ ] Chat list order updates correctly

---

### Scenario 5: Mixed Messages (Group + Individual)

**Steps:**
1. Staff sends group message to Class 10-A
2. Staff sends individual message to student S12345 (who is in Class 10-A)
3. **As Student S12345:**
   - Check Communication screen
   - **Expected Result**:
     - ✅ Two separate chats appear:
       1. "Class 10 - A" (group chat)
       2. "Staff Member" (individual chat)
     - ✅ Both show correct last messages
     - ✅ Both are properly labeled

**Pass Criteria:**
- [ ] Both chats appear separately
- [ ] Group and individual chats are distinct
- [ ] Messages are in correct chats
- [ ] No message mixing between chats

---

### Scenario 6: App Restart (Cache Persistence)

**Steps:**
1. Staff sends message to student
2. Student sees message in chat list
3. Student closes app completely
4. Student reopens app and navigates to Communication
5. **Expected Result**:
   - ✅ Chat still appears in list
   - ✅ Messages are still visible
   - ✅ No data loss

**Pass Criteria:**
- [ ] Chats persist after app restart
- [ ] Messages remain in cache
- [ ] No need to re-fetch from server

---

### Scenario 7: Real-time Updates (Socket Connection)

**Setup:**
- Student app is open on Communication screen
- Staff app is ready to send

**Steps:**
1. Student is viewing empty chat list
2. Staff sends group message
3. **Expected Result**:
   - ✅ Chat appears immediately (within 1-2 seconds)
   - ✅ No manual refresh needed
   - ✅ Smooth animation/transition

**Pass Criteria:**
- [ ] Message appears in real-time
- [ ] No page refresh required
- [ ] Socket connection is active

---

## Console Log Verification

When testing, check browser/device console for these logs:

### Student Side (Expected Logs):
```
🔌 Socket connecting with token...
Socket connected
📬 [GlobalListener] Received message: {...}
💾 [GlobalListener] Adding message to cache for chatId: group_10_A
✅ [GlobalListener] Message cached successfully
```

### Staff Side (Expected Logs):
```
🚀 [Chat] sendMessage invoked. GROUP To: 10
📦 [Chat] Sending Payload: {...}
✅ [Chat] REST API Success: {...}
🔌 [Chat] Emitting via Socket. Role: staff
✅ [Chat] Socket event emitted
```

### Backend Server (Expected Logs):
```
📨 New Message Received: { message, type, class_id, section_id }
📢 Broadcasting group message to Class 10 - A
```

---

## Troubleshooting

### Issue: Chat list is empty even after staff sends message

**Check:**
1. Is WebSocket connected? Look for "Socket connected" log
2. Is message being received? Look for "📬 [GlobalListener] Received message"
3. Is message being filtered out? Look for "⏭️ [GlobalListener] ... skipping"
4. Check student's class/section matches the message target

**Solution:**
- Verify socket connection in `useSocket` hook
- Check message payload has correct `classId` and `sectionId`
- Ensure student profile has correct class/section data

---

### Issue: Messages appear for wrong students

**Check:**
1. Is filtering logic working? Check console logs
2. Are `classId` and `receiverId` correct in message payload?

**Solution:**
- Review `handleIncomingMessage` filtering logic
- Verify backend is sending correct `classId`/`receiverId`

---

### Issue: Duplicate chats appearing

**Check:**
1. Is `chatId` consistent across messages?
2. Is `addChat` being called multiple times?

**Solution:**
- Ensure `chatId` format is consistent: `group_{classId}_{sectionId}`
- Check `useChatCache` deduplication logic

---

## Performance Checks

- [ ] App loads quickly with empty chat list
- [ ] Message appears within 2 seconds of sending
- [ ] No lag when opening Communication screen
- [ ] Smooth scrolling in chat list
- [ ] No memory leaks (check after 10+ messages)

---

## Security Checks

- [ ] Students cannot see messages for other classes
- [ ] Students cannot see messages for other students
- [ ] Students cannot initiate new chats (no "New Chat" button)
- [ ] Message filtering happens on client side
- [ ] No sensitive data exposed in console logs (in production)
