const fs = require('fs');
const path = require('path');

const baseDir = 'C:/Users/sales/Documents/Node-microservice';

// 1. Update src/config/env.js
const envPath = path.join(baseDir, 'src/config/env.js');
let envCode = fs.readFileSync(envPath, 'utf8');
if (!envCode.includes('dotenv/config')) {
    envCode = 'import "dotenv/config";\n' + envCode;
    fs.writeFileSync(envPath, envCode, 'utf8');
    console.log('✅ Updated src/config/env.js');
}

// 2. Update src/services/message.service.js
const msgServicePath = path.join(baseDir, 'src/services/message.service.js');
const newMsgServiceCode = `import pool from "../config/db.js";

const messageService = {
    getIdentityAliases: async (identityId) => {
        const aliases = new Set();
        if (identityId === null || identityId === undefined || identityId === '') return [];

        const idStr = String(identityId).trim();
        aliases.add(idStr);

        try {
            // 1. Check login table (maps user_id <-> mapId <-> user_name)
            const [logins] = await pool.query(
                \`SELECT user_id, mapId, user_name, user_type FROM login WHERE user_id = ? OR mapId = ? OR user_name = ?\`,
                [idStr, idStr, idStr]
            );
            const mapIds = [];
            logins.forEach((l) => {
                if (l.user_id != null && l.user_id !== '') aliases.add(String(l.user_id).trim());
                if (l.mapId != null && l.mapId !== '') {
                    aliases.add(String(l.mapId).trim());
                    mapIds.push(l.mapId);
                }
                if (l.user_name != null && l.user_name !== '') aliases.add(String(l.user_name).trim());
            });

            // 2. Check employee_details table
            const empConditions = ['emp_id = ?', 'emp_no = ?', 'employee_work_id = ?'];
            const empParams = [idStr, idStr, idStr];
            if (mapIds.length > 0) {
                empConditions.push(\`emp_id IN (\${mapIds.map(() => '?').join(',')})\`);
                empParams.push(...mapIds);
            }
            const [employees] = await pool.query(
                \`SELECT emp_id, emp_no, employee_work_id FROM employee_details WHERE \${empConditions.join(' OR ')}\`,
                empParams
            );
            employees.forEach((employee) => {
                if (employee.emp_id != null && employee.emp_id !== '') aliases.add(String(employee.emp_id).trim());
                if (employee.emp_no != null && employee.emp_no !== '') aliases.add(String(employee.emp_no).trim());
                if (employee.employee_work_id != null && employee.employee_work_id !== '') aliases.add(String(employee.employee_work_id).trim());
            });

            // 3. Check student_details table
            const stuConditions = ['stud_id = ?', 'stud_no = ?', 'admission_no = ?'];
            const stuParams = [idStr, idStr, idStr];
            if (mapIds.length > 0) {
                stuConditions.push(\`stud_id IN (\${mapIds.map(() => '?').join(',')})\`);
                stuParams.push(...mapIds);
            }
            const [students] = await pool.query(
                \`SELECT stud_id, stud_no, admission_no FROM student_details WHERE \${stuConditions.join(' OR ')}\`,
                stuParams
            );
            students.forEach((student) => {
                if (student.stud_id != null && student.stud_id !== '') aliases.add(String(student.stud_id).trim());
                if (student.stud_no != null && student.stud_no !== '') aliases.add(String(student.stud_no).trim());
                if (student.admission_no != null && student.admission_no !== '') aliases.add(String(student.admission_no).trim());
            });
        } catch (err) {
            console.error('[MSG_SERVICE] Error in getIdentityAliases:', err);
        }

        return [...aliases].filter(Boolean);
    },

    /**
     * Save message to MySQL database
     */
    saveMessageToDB: async (chatData) => {
        let { message, sender_id, sender_role, sender_name, receiver_id, chatId, type, class_id, section_id, attachment, voiceNote } = chatData;
        let parentId = chatId;

        // Normalize type - handle numeric types (1=individual, 2=group)
        if (type === 2 || type === '2') type = 'group';
        else if (type === 1 || type === '1') type = 'individual';

        const isAttachment = (attachment || voiceNote) ? 1 : 0;

        console.log(\`📨 [MSG_SERVICE] saveMessageToDB - Type: \${type}, Sender: \${sender_id} (\${sender_name}), Receiver: \${receiver_id}, Class: \${class_id}, Att: \${!!attachment}, Voice: \${!!voiceNote}\`);

        try {
            // 1. DEDUPLICATION (1 second window)
            if (!isAttachment) {
                const [existing] = await pool.query(
                    \`SELECT id FROM communication_message 
                     WHERE senderId = ? AND receiverId = ? AND message = ? 
                     AND (created_at > (NOW() - INTERVAL 1 SECOND) OR dateTime > (NOW() - INTERVAL 1 SECOND))
                     LIMIT 1\`,
                    [sender_id, receiver_id || 0, message]
                );
                if (existing.length > 0) {
                    console.log(\`⚠️ [MSG_SERVICE] Duplicate message detected, skipping.\`);
                    return { id: existing[0].id, parentId: 0, duplicate: true };
                }
            }

            // 2. Find or Create Communication (Thread)
            if (!parentId) {
                if (type === 'group') {
                    console.log(\`🔍 [MSG_SERVICE] Looking for group thread: Class=\${class_id}, Section=\${section_id || 'all'}\`);

                    const [rows] = await pool.query(
                        \`SELECT id FROM communication WHERE class = ? AND section = ? AND msgType = 2 LIMIT 1\`,
                        [class_id, section_id]
                    );

                    if (rows.length > 0) {
                        parentId = rows[0].id;
                        console.log(\`✅ [MSG_SERVICE] Found existing group thread: \${parentId}\`);
                    } else {
                        console.log(\`➕ [MSG_SERVICE] Creating new group thread for: Class=\${class_id}, Section=\${section_id}\`);
                        const [result] = await pool.query(
                            \`INSERT INTO communication (user1, user2, msgType, class, section, sts, created_at, updated_at) 
                             VALUES (0, 0, 2, ?, ?, 1, NOW(), NOW())\`,
                            [class_id, section_id]
                        );
                        parentId = result.insertId;
                    }
                } else {
                    console.log(\`🔍 [MSG_SERVICE] Looking for individual thread: \${sender_id} <-> \${receiver_id}\`);
                    const senderAliases = await messageService.getIdentityAliases(sender_id);
                    const receiverAliases = await messageService.getIdentityAliases(receiver_id);
                    const pairConditions = [];
                    const pairParams = [];
                    senderAliases.forEach((senderAlias) => {
                        receiverAliases.forEach((receiverAlias) => {
                            pairConditions.push('(user1 = ? AND user2 = ?)', '(user1 = ? AND user2 = ?)');
                            pairParams.push(senderAlias, receiverAlias, receiverAlias, senderAlias);
                        });
                    });
                    const [rows] = await pool.query(
                        \`SELECT id FROM communication 
                         WHERE msgType = 1 AND (\${pairConditions.join(' OR ')}) LIMIT 1\`,
                        pairParams
                    );

                    if (rows.length > 0) {
                        parentId = rows[0].id;
                        console.log(\`✅ [MSG_SERVICE] Found existing thread: \${parentId}\`);
                    } else {
                        console.log(\`➕ [MSG_SERVICE] Creating new thread between \${sender_id} and \${receiver_id}\`);
                        const [result] = await pool.query(
                            \`INSERT INTO communication (user1, user2, msgType, sts, created_at, updated_at) 
                             VALUES (?, ?, 1, 1, NOW(), NOW())\`,
                            [sender_id, receiver_id]
                        );
                        parentId = result.insertId;
                        console.log(\`✅ [MSG_SERVICE] Created new thread with ID: \${parentId}\`);
                    }
                }
            }

            // 3. Insert into communication_message
            const [messageResult] = await pool.query(
                \`INSERT INTO communication_message 
                 (parentId, senderId, receiverId, isAttachment, attachment, voice_note, message, dateTime, status, created_at, updated_at, senderRole, senderName) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'sent', NOW(), NOW(), ?, ?)\`,
                [
                    parentId,
                    sender_id,
                    receiver_id || 0,
                    isAttachment,
                    attachment || null,
                    voiceNote || null,
                    message || "",
                    sender_role || "staff",
                    sender_name || "Unknown"
                ]
            );

            console.log(\`✅ [MSG_SERVICE] Message inserted with ID: \${messageResult.insertId}\`);

            return {
                id: messageResult.insertId,
                parentId: parentId,
                status: "sent"
            };

        } catch (error) {
            console.error("Database Error:", error);
            throw error;
        }
    },

    /**
     * Fetch messages for a specific conversation from CI4 DB
     */
    getMessagesFromDB: async (senderId, receiverId, chatId) => {
        let parentId = chatId;

        try {
            if (!parentId && senderId && receiverId) {
                const senderAliases = await messageService.getIdentityAliases(senderId);
                const receiverAliases = await messageService.getIdentityAliases(receiverId);
                const pairConditions = [];
                const pairParams = [];
                senderAliases.forEach((senderAlias) => {
                    receiverAliases.forEach((receiverAlias) => {
                        pairConditions.push('(user1 = ? AND user2 = ?)', '(user1 = ? AND user2 = ?)');
                        pairParams.push(senderAlias, receiverAlias, receiverAlias, senderAlias);
                    });
                });
                const [commRows] = await pool.query(
                    \`SELECT id FROM communication 
                     WHERE msgType = 1 AND (\${pairConditions.join(' OR ')}) LIMIT 1\`,
                    pairParams
                );

                if (commRows.length > 0) {
                    parentId = commRows[0].id;
                }
            }

            if (!parentId) {
                console.log(\`ℹ️ [MSG_SERVICE] No parentId found for users \${senderId} <-> \${receiverId}.\`);
                return [];
            }

            console.log(\`🔍 [MSG_SERVICE] Fetching messages for parentId: \${parentId}\`);
            const [messages] = await pool.query(
                \`SELECT cm.*,
                    COALESCE(
                        CASE
                            WHEN cm.senderName IS NOT NULL AND cm.senderName != '' AND NOT (cm.senderName REGEXP '^[Ee][Mm][Pp][0-9]+$')
                                THEN cm.senderName
                            ELSE NULL
                        END,
                        CASE
                            WHEN LOWER(COALESCE(cm.senderRole, '')) IN ('student', '2')
                                THEN CONCAT(s.stud_firstname, ' ', COALESCE(s.stud_lastname, ''))
                            WHEN LOWER(COALESCE(cm.senderRole, '')) IN ('staff', 'employee', 'admin', '1')
                                THEN e.emp_name
                            ELSE COALESCE(e.emp_name, CONCAT(s.stud_firstname, ' ', COALESCE(s.stud_lastname, '')))
                        END,
                        l.name
                    ) as sender_name,
                    COALESCE(
                        CASE
                            WHEN LOWER(COALESCE(cm.senderRole, '')) IN ('student', '2')
                                THEN re.emp_name
                            WHEN LOWER(COALESCE(cm.senderRole, '')) IN ('staff', 'employee', 'admin', '1')
                                THEN CONCAT(rs.stud_firstname, ' ', COALESCE(rs.stud_lastname, ''))
                            ELSE COALESCE(CONCAT(rs.stud_firstname, ' ', COALESCE(rs.stud_lastname, '')), re.emp_name)
                        END,
                        rl.name
                    ) as receiver_name
                 FROM communication_message cm
                 LEFT JOIN employee_details e ON (cm.senderId = e.emp_id OR cm.senderId = e.emp_no)
                 LEFT JOIN student_details s ON (cm.senderId = s.stud_id OR cm.senderId = s.stud_no)
                 LEFT JOIN login l ON (cm.senderId = l.user_id OR cm.senderId = l.user_name)
                 LEFT JOIN employee_details re ON (cm.receiverId = re.emp_id OR cm.receiverId = re.emp_no)
                 LEFT JOIN student_details rs ON (cm.receiverId = rs.stud_id OR cm.receiverId = rs.stud_no)
                 LEFT JOIN login rl ON (cm.receiverId = rl.user_id OR cm.receiverId = rl.user_name)
                 WHERE cm.parentId = ? 
                 ORDER BY cm.id ASC\`,
                [parentId]
            );
            console.log(\`✅ [MSG_SERVICE] Found \${messages.length} messages.\`);
            return messages;

        } catch (error) {
            console.error("Database Error:", error);
            throw error;
        }
    },

    resolveSenderIdentity: async (user, role) => {
        const normalizedRole = String(role || user?.role || user?.user_type || '').toLowerCase();
        const isStudentSender = normalizedRole === 'student' || normalizedRole === '2';
        const candidates = isStudentSender
            ? [user.stud_id, user.studentId, user.mapId, user.map_id, user.id, user.user_id, user.stud_no, user.studentNumber, user.username, user.user_name]
            : [user.emp_id, user.employeeId, user.mapId, user.map_id, user.id, user.user_id, user.emp_no, user.employeeNo, user.username, user.user_name];
        const uniqueCandidates = [...new Set(candidates.filter((value) => value !== null && value !== undefined && value !== ''))];

        for (const candidate of uniqueCandidates) {
            const name = await messageService.getSenderName(candidate, isStudentSender ? 'student' : 'staff', true);
            if (name !== 'Unknown' && !/^EMP\d+$/i.test(name.trim())) {
                const primaryId = user.emp_id || user.stud_id || user.mapId || user.map_id || candidate;
                return { id: primaryId, name };
            }
        }

        // Try lookup via login table
        if (user.user_name || user.username || user.user_id || user.id) {
            const loginQueryId = user.user_name || user.username || user.user_id || user.id;
            const name = await messageService.getSenderName(loginQueryId, isStudentSender ? 'student' : 'staff', false);
            if (name !== 'Unknown' && !/^EMP\d+$/i.test(name.trim())) {
                const primaryId = user.emp_id || user.stud_id || user.mapId || user.map_id || uniqueCandidates[0];
                return { id: primaryId, name };
            }
        }

        const fallbackName = user.name || user.emp_name || (user.firstName ? \`\${user.firstName} \${user.lastName || ''}\`.trim() : null);
        const resolvedName = (fallbackName && !/^EMP\d+$/i.test(fallbackName.trim()))
            ? fallbackName.trim()
            : (isStudentSender ? 'Student' : 'Staff');

        return {
            id: user.emp_id || user.stud_id || user.mapId || user.map_id || uniqueCandidates[0],
            name: resolvedName
        };
    },

    getSenderName: async (senderId, role, strictRole = false) => {
        try {
            if (!senderId) return "Unknown";
            const sId = String(senderId).trim();
            const normalizedRole = String(role || '').toLowerCase();
            const isStudentSender = normalizedRole === 'student' || normalizedRole === '2';

            // 1. If staff/employee sender:
            if (!isStudentSender) {
                // Check employee_details directly
                const [staff] = await pool.query(
                    \`SELECT emp_name FROM employee_details WHERE emp_id = ? OR emp_no = ? OR employee_work_id = ? LIMIT 1\`,
                    [sId, sId, sId]
                );
                if (staff.length > 0 && staff[0].emp_name) return staff[0].emp_name.trim();

                // Check via login table mapping
                const [loginStaff] = await pool.query(
                    \`SELECT e.emp_name, l.name FROM login l 
                     LEFT JOIN employee_details e ON l.mapId = e.emp_id 
                     WHERE (l.user_id = ? OR l.user_name = ?) AND (l.user_type = 1 OR l.user_type IS NULL)
                     LIMIT 1\`,
                    [sId, sId]
                );
                if (loginStaff.length > 0) {
                    const name = loginStaff[0].emp_name || loginStaff[0].name;
                    if (name && !/^EMP\d+$/i.test(name.trim())) return name.trim();
                }
            } else {
                // 2. If student sender:
                const [student] = await pool.query(
                    \`SELECT stud_firstname, stud_lastname FROM student_details WHERE stud_id = ? OR stud_no = ? OR admission_no = ? LIMIT 1\`,
                    [sId, sId, sId]
                );
                if (student.length > 0) {
                    const fullName = \`\${student[0].stud_firstname} \${student[0].stud_lastname || ''}\`.trim();
                    if (fullName) return fullName;
                }

                // Check via login table mapping
                const [loginStudent] = await pool.query(
                    \`SELECT s.stud_firstname, s.stud_lastname, l.name FROM login l 
                     LEFT JOIN student_details s ON l.mapId = s.stud_id 
                     WHERE (l.user_id = ? OR l.user_name = ?) AND l.user_type = 2
                     LIMIT 1\`,
                    [sId, sId]
                );
                if (loginStudent.length > 0) {
                    const fullName = \`\${loginStudent[0].stud_firstname || ''} \${loginStudent[0].stud_lastname || ''}\`.trim() || loginStudent[0].name;
                    if (fullName) return fullName.trim();
                }
            }

            if (strictRole) return "Unknown";

            // Fallback: search both tables without role constraint
            const [fallbackStaff] = await pool.query(
                \`SELECT emp_name FROM employee_details WHERE emp_id = ? OR emp_no = ? OR employee_work_id = ? LIMIT 1\`,
                [sId, sId, sId]
            );
            if (fallbackStaff.length > 0 && fallbackStaff[0].emp_name) return fallbackStaff[0].emp_name.trim();

            const [fallbackStudent] = await pool.query(
                \`SELECT stud_firstname, stud_lastname FROM student_details WHERE stud_id = ? OR stud_no = ? OR admission_no = ? LIMIT 1\`,
                [sId, sId, sId]
            );
            if (fallbackStudent.length > 0) {
                const fullName = \`\${fallbackStudent[0].stud_firstname} \${fallbackStudent[0].stud_lastname || ''}\`.trim();
                if (fullName) return fullName;
            }

            return "Unknown";
        } catch (error) {
            console.error("Error fetching sender name:", error);
            return "Unknown";
        }
    },

    /**
     * Fetch group messages from MySQL database
     */
    getGroupMessagesFromDB: async (classId, sectionId) => {
        console.log(\`🔍 [MSG_SERVICE] getGroupMessagesFromDB - Class: \${classId}, Section: \${sectionId || 'all'}\`);
        try {
            // Find the parent communication thread for this group
            const [commRows] = await pool.query(
                \`SELECT id FROM communication WHERE class = ? AND section = ? AND msgType = 2 LIMIT 1\`,
                [classId, sectionId]
            );

            if (commRows.length === 0) {
                const groupIdentifier = \`G_\${classId}_\${sectionId || 'all'}\`;
                console.log(\`ℹ️ [MSG_SERVICE] No group thread found for: \${groupIdentifier}\`);
                return [];
            }

            const parentId = commRows[0].id;
            console.log(\`🔍 [MSG_SERVICE] Fetching messages for group parentId: \${parentId}\`);

            const [messages] = await pool.query(
                \`SELECT cm.*,
                    COALESCE(
                        CASE
                            WHEN cm.senderName IS NOT NULL AND cm.senderName != '' AND NOT (cm.senderName REGEXP '^[Ee][Mm][Pp][0-9]+$')
                                THEN cm.senderName
                            ELSE NULL
                        END,
                        CASE
                            WHEN LOWER(COALESCE(cm.senderRole, '')) IN ('student', '2')
                                THEN CONCAT(s.stud_firstname, ' ', COALESCE(s.stud_lastname, ''))
                            WHEN LOWER(COALESCE(cm.senderRole, '')) IN ('staff', 'employee', 'admin', '1')
                                THEN e.emp_name
                            ELSE COALESCE(e.emp_name, CONCAT(s.stud_firstname, ' ', COALESCE(s.stud_lastname, '')))
                        END,
                        l.name
                    ) as sender_name
                 FROM communication_message cm
                 LEFT JOIN employee_details e ON (cm.senderId = e.emp_id OR cm.senderId = e.emp_no)
                 LEFT JOIN student_details s ON (cm.senderId = s.stud_id OR cm.senderId = s.stud_no)
                 LEFT JOIN login l ON (cm.senderId = l.user_id OR cm.senderId = l.user_name)
                 WHERE cm.parentId = ? 
                 ORDER BY cm.id ASC\`,
                [parentId]
            );

            console.log(\`✅ [MSG_SERVICE] Found \${messages.length} group messages.\`);
            return messages;

        } catch (error) {
            console.error("❌ [MSG_SERVICE] Database Error in getGroupMessagesFromDB:", error);
            throw error;
        }
    },

    /**
     * Fetch ALL individual messages for a user (across all threads)
     */
    getAllIndividualMessagesForUser: async (userId) => {
        console.log(\`🔍 [MSG_SERVICE] getAllIndividualMessagesForUser - UserID: \${userId}\`);
        try {
            const identityAliases = await messageService.getIdentityAliases(userId);
            const placeholders = identityAliases.map(() => '?').join(', ');
            const [messages] = await pool.query(
                \`SELECT cm.*,
                    COALESCE(
                        CASE
                            WHEN cm.senderName IS NOT NULL AND cm.senderName != '' AND NOT (cm.senderName REGEXP '^[Ee][Mm][Pp][0-9]+$')
                                THEN cm.senderName
                            ELSE NULL
                        END,
                        CASE
                            WHEN LOWER(COALESCE(cm.senderRole, '')) IN ('student', '2')
                                THEN CONCAT(s.stud_firstname, ' ', COALESCE(s.stud_lastname, ''))
                            WHEN LOWER(COALESCE(cm.senderRole, '')) IN ('staff', 'employee', 'admin', '1')
                                THEN e.emp_name
                            ELSE COALESCE(e.emp_name, CONCAT(s.stud_firstname, ' ', COALESCE(s.stud_lastname, '')))
                        END,
                        l.name
                    ) as sender_name,
                    COALESCE(
                        CASE
                            WHEN LOWER(COALESCE(cm.senderRole, '')) IN ('student', '2')
                                THEN re.emp_name
                            WHEN LOWER(COALESCE(cm.senderRole, '')) IN ('staff', 'employee', 'admin', '1')
                                THEN CONCAT(rs.stud_firstname, ' ', COALESCE(rs.stud_lastname, ''))
                            ELSE COALESCE(CONCAT(rs.stud_firstname, ' ', COALESCE(rs.stud_lastname, '')), re.emp_name)
                        END,
                        rl.name
                    ) as receiver_name
                 FROM communication_message cm
                 JOIN communication c ON cm.parentId = c.id
                 LEFT JOIN employee_details e ON (cm.senderId = e.emp_id OR cm.senderId = e.emp_no)
                 LEFT JOIN student_details s ON (cm.senderId = s.stud_id OR cm.senderId = s.stud_no)
                 LEFT JOIN login l ON (cm.senderId = l.user_id OR cm.senderId = l.user_name)
                 LEFT JOIN employee_details re ON (cm.receiverId = re.emp_id OR cm.receiverId = re.emp_no)
                 LEFT JOIN student_details rs ON (cm.receiverId = rs.stud_id OR cm.receiverId = rs.stud_no)
                 LEFT JOIN login rl ON (cm.receiverId = rl.user_id OR cm.receiverId = rl.user_name)
                 WHERE (cm.senderId IN (\${placeholders}) OR cm.receiverId IN (\${placeholders}))
                 AND c.msgType = 1
                 ORDER BY cm.id ASC\`,
                [...identityAliases, ...identityAliases]
            );
            console.log(\`✅ [MSG_SERVICE] Found \${messages.length} total individual messages.\`);
            return messages;
        } catch (error) {
            console.error("❌ [MSG_SERVICE] Database Error in getAllIndividualMessagesForUser:", error);
            throw error;
        }
    },

    /**
     * Update status of a specific message
     */
    updateMessageStatus: async (messageId, status) => {
        try {
            console.log(\`🔄 [MSG_SERVICE] Updating status of msg \${messageId} to \${status}\`);
            const column = status === 'read' ? 'read_at' : (status === 'delivered' ? 'delivered_at' : null);

            let query = \`UPDATE communication_message SET status = ?\`;
            const params = [status];

            if (column) {
                query += \`, \${column} = NOW()\`;
            }

            query += \` WHERE id = ?\`;
            params.push(messageId);

            await pool.query(query, params);
            return true;
        } catch (error) {
            if (error.message.includes('Unknown column')) {
                console.warn(\`⚠️ [MSG_SERVICE] Cannot update status to \${status}: Database columns missing.\`);
                return false;
            }
            console.error("❌ [MSG_SERVICE] Error in updateMessageStatus:", error);
            return false;
        }
    },

    /**
     * Mark all messages in a thread as read
     */
    markMessagesAsRead: async (chatId, receiverId) => {
        try {
            console.log(\`📖 [MSG_SERVICE] Marking messages as read in thread \${chatId} for receiver \${receiverId}\`);
            const identityAliases = await messageService.getIdentityAliases(receiverId);
            const placeholders = identityAliases.map(() => '?').join(', ');
            await pool.query(
                \`UPDATE communication_message 
                 SET status = 'read', read_at = NOW() 
                 WHERE parentId = ? AND receiverId IN (\${placeholders}) AND status != 'read'\`,
                [chatId, ...identityAliases]
            );
            return true;
        } catch (error) {
            if (error.message.includes('Unknown column')) return false;
            console.error("❌ [MSG_SERVICE] Error in markMessagesAsRead:", error);
            return false;
        }
    },

    /**
     * Mark messages as delivered when receiver is detected online
     */
    markMessagesAsDelivered: async (receiverId) => {
        try {
            console.log(\`📬 [MSG_SERVICE] Marking pending messages as delivered for user \${receiverId}\`);
            const identityAliases = await messageService.getIdentityAliases(receiverId);
            const placeholders = identityAliases.map(() => '?').join(', ');

            try {
                const [senders] = await pool.query(
                    \`SELECT DISTINCT senderId FROM communication_message 
                     WHERE receiverId IN (\${placeholders}) AND status = 'sent'\`,
                    identityAliases
                );

                await pool.query(
                    \`UPDATE communication_message 
                     SET status = 'delivered', delivered_at = NOW() 
                     WHERE receiverId IN (\${placeholders}) AND status = 'sent'\`,
                    identityAliases
                );

                return senders.map(s => s.senderId);
            } catch (innerErr) {
                if (innerErr.message.includes('Unknown column')) {
                    return [];
                }
                throw innerErr;
            }
        } catch (error) {
            console.error("❌ [MSG_SERVICE] Error in markMessagesAsDelivered:", error);
            return [];
        }
    }
};

export default messageService;
`;
fs.writeFileSync(msgServicePath, newMsgServiceCode, 'utf8');
console.log('✅ Updated src/services/message.service.js');

// 3. Update src/controllers/communication.controller.js
const commCtrlPath = path.join(baseDir, 'src/controllers/communication.controller.js');
let commCtrlCode = fs.readFileSync(commCtrlPath, 'utf8');

// Update sendMessage logging and payload
const oldCtrlSend = `            const senderIdentity = await messageService.resolveSenderIdentity(req.user, normalizedSenderRole);
            const senderId = senderIdentity.id;
            const senderName = senderIdentity.name;`;

const newCtrlSend = `            const senderIdentity = await messageService.resolveSenderIdentity(req.user, normalizedSenderRole);
            const senderId = senderIdentity.id;
            const senderName = senderIdentity.name;
            const receiverName = finalReceiverId 
                ? await messageService.getSenderName(finalReceiverId, normalizedSenderRole === 'staff' ? 'student' : 'staff')
                : 'Group';

            console.log(
                \`💬 [CHAT LOG] SENDER -> ID: \${senderId} | Name: "\${senderName}" | Role: \${normalizedSenderRole}  ===>  RECEIVER -> ID: \${finalReceiverId || 'GROUP'} | Name: "\${receiverName}" | Type: \${finalType === 2 ? 'GROUP' : 'INDIVIDUAL'}\`
            );`;

if (commCtrlCode.includes(oldCtrlSend)) {
    commCtrlCode = commCtrlCode.replace(oldCtrlSend, newCtrlSend);
}

// Update socketPayload to include receiverName, isStaff, sender_id, receiver_id
const oldPayload = `                const socketPayload = {
                    id: result.id,
                    clientId: clientId || null,
                    fromId: senderId,
                    senderId: senderId,
                    senderRole: normalizedSenderRole,
                    receiverId: finalReceiverId,
                    senderName: senderName,`;

const newPayload = `                const socketPayload = {
                    id: result.id,
                    clientId: clientId || null,
                    fromId: senderId,
                    senderId: senderId,
                    sender_id: senderId,
                    senderRole: normalizedSenderRole,
                    receiverId: finalReceiverId,
                    receiver_id: finalReceiverId,
                    senderName: senderName,
                    receiverName: receiverName,
                    isStaff: normalizedSenderRole === 'staff',`;

if (commCtrlCode.includes(oldPayload)) {
    commCtrlCode = commCtrlCode.replace(oldPayload, newPayload);
}

fs.writeFileSync(commCtrlPath, commCtrlCode, 'utf8');
console.log('✅ Updated src/controllers/communication.controller.js');

// 4. Update src/sockets/chat.socket.js
const socketPath = path.join(baseDir, 'src/sockets/chat.socket.js');
let socketCode = fs.readFileSync(socketPath, 'utf8');

const oldSocketLog = `    console.log(\`\\ndY\` [USER INFO] ID=\${effectiveId}, UserID=\${userId}, MapID=\${mapId}, Role=\${role}, Type=\${userType}\`);`;
const newSocketLog = `    (async () => {
        const userName = await messageService.getSenderName(effectiveId, role);
        console.log(\`👤 [SOCKET USER CONNECTED] ID=\${effectiveId} | Name="\${userName}" | UserID=\${userId} | MapID=\${mapId} | Role=\${role}\`);
    })();`;

if (socketCode.includes(oldSocketLog) || socketCode.includes('[USER INFO]')) {
    socketCode = socketCode.replace(/console\.log\(\`.*?\[USER INFO\].*?\`\);/, newSocketLog);
}

fs.writeFileSync(socketPath, socketCode, 'utf8');
console.log('✅ Updated src/sockets/chat.socket.js');
