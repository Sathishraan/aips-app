export interface Admin {
    adminId: string;
    name: string;
    email: string;
    mobile: string;
    role: "Super Admin" | "Admin" | "Principal";
    photo: string | null;
}
