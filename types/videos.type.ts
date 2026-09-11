export interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail?: string;
  created_at?: string;
}

export interface VideoResponse {
  status: string;
  message: string;
  videos: Video[];
}
