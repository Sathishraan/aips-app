export interface ResultTerm {
  term_id: number;
  term_name: string;
}

export interface ResultDetail {
  subject_name: string;
  marks_obtained: number;
  total_marks: number;
  grade: string;
  percentage: number;
  result_status: string;
}

export interface ResultListResponse {
  status: boolean;
  message: string;
  data: ResultTerm[];
}

export interface ResultDetailsResponse {
  status: boolean;
  message: string;
  data: ResultDetail[];
}
