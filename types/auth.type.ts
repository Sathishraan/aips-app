export interface LoginRequest {
    username: string;
    password: string;
    academic_year?: string;
    firebase_token?: string;
    device_type?: string;
    device?: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    token: string;
}

export interface LoginResponse {
    status: number;
    msg: string;
    data: User;
}
