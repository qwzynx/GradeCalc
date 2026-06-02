export interface Assignment {
  id?: string;
  course_id: string;
  name: string;
  mark?: number | null;
  weight?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Course {
  id?: string;
  user_id?: string;
  name: string;
  prof_name?: string;
  credits?: number;
  mark?: number;
  in_progress?: boolean;
  year: number;
  semester: string;
  category?: string;
}

export interface BackendMetrics {
  final_average: number;
  remaining_weight: number;
  get_fifty: number | string;
  target_required_score: number | string;
  is_target_invalid?: boolean;
  yorku_gpa: number;
  yorku_letter: string;
  higher_target_score: number | string;
  lower_target_score: number | string;
}
