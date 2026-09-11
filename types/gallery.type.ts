export interface GalleryItem {
    id: string;
    title: string;
    description: string;
    image_path: string;
    event_date: string;
    is_active: string;
    created_at: string;
    updated_at: string;
    class_id?: string;
    section_id?: string;
    gallery_class?: string;
    gallery_section?: string;
}

export interface GalleryResponse {
    gallery: GalleryItem[];
    meta?: {
        student_id?: number;
        class_id?: string;
        section_id?: string;
        count?: number;
    };
}
