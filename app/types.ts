export interface Assignment {
  id?: string;
  course_id: string;
  name: string;
  mark?: number | null;
  weight?: number;
  eclass_item_name?: string | null;
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
  eclass_course_id?: string | null;
}

export interface EclassPlanItem {
  eclass_item_name: string;
  action: "update" | "create";
  assignment_id: string | null;
  assignment_name?: string | null;
  new_mark: number | null;
  old_mark?: number | null;
  weight?: number | null;
  warning?: string | null;
}

export interface EclassSuggestedCourse {
  name: string;
  prof_name?: string | null;
  semester: string;
  year: number;
  credits?: number | null;
  category?: string | null;
}

export interface EclassPlanCourse {
  eclass_course_id: string;
  eclass_course_name: string;
  app_course_id: string | null;
  app_course_name?: string | null;
  confidence?: "high" | "medium" | "low";
  items: EclassPlanItem[];
  // Populated when app_course_id is null — an AI-drafted new course the user
  // can review/edit and opt into creating, instead of importing it separately.
  suggested_course?: EclassSuggestedCourse | null;
}

export interface EclassSyncPlan {
  courses: EclassPlanCourse[];
  warnings: string[];
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
