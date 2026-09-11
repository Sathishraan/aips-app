export interface CircularItem {
    id: string;
    title: string;
    description: string;
    file_path: string;
    publish_date: string;
    is_active: string;
    created_at: string;
    updated_at: string;
}

export interface CircularResponse {
    circulars: CircularItem[];
}
