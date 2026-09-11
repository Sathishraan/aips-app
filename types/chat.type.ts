export interface ClassItem {
    class_id: string;
    class_name: string;
}

export interface SectionItem {
    section_id: string;
    section_name: string;
}

export interface StudentItem {
    stud_id: string;
    stud_no: string;
    stud_firstname: string;
    stud_lastname: string;
    stud_photo?: string;
    student_name?: string; // Sometimes flattened by frontend
}

export interface ChatMessage {
    id: number | string;
    parentId: number | string;
    senderId: string;
    receiverId: string;
    message: string;
    content?: string;
    isAttachment?: number | boolean;
    attachment?: string;
    voice_note?: string;
    voiceNote?: string;
    sender_id?: string;
    receiver_id?: string;
    senderName?: string;
    sender_name?: string;
    receiverName?: string;
    receiver_name?: string;
    student_name?: string;
    created_at?: string;
    updated_at?: string;
    timestamp?: string;
    dateTime?: string;
    is_read?: number | boolean;
    isRead?: boolean;
    seen?: boolean;
    is_delivered?: number | boolean;
    isDelivered?: boolean;
    delivered?: boolean;
}
