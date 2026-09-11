export interface LeaveItem {
    id: string;
    stud_id: string;
    fromDate: string;
    toDate: string;
    fromTime?: string | null;
    ToTime?: string | null;
    totalDays: string;
    reason: string;
    attachment: string;
    appliedOn: string | null;
    approvedBy: string | null;
    approved: string; // "0" Pending, "1" Approved, "2" Rejected, "3" Revoked
    approvedOn: string | null;
    sts: string;
    created_at: string;
    updated_at: string;
    approver_name?: string;
    attachmentFullUrl?: string;
}

export interface LeaveRequestPayload {
    from_date: string;
    to_date: string;
    reason?: string;
    attachment?: any;
}
