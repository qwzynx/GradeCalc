from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from pydantic import BaseModel

class CourseCreate(BaseModel):
    user_id: str
    name: str
    prof_name: Optional[str] = None
    credits: Optional[float] = None
    mark: Optional[float] = None
    in_progress: Optional[bool] = True
    year: int
    semester: str
    category: Optional[str] = None

class CourseUpdate(BaseModel):
    name: Optional[str] = None
    prof_name: Optional[str] = None
    credits: Optional[float] = None
    mark: Optional[float] = None
    in_progress: Optional[bool] = None
    year: Optional[int] = None
    semester: Optional[str] = None
    category: Optional[str] = None

class AssignmentCreate(BaseModel):
    course_id: str
    name: str
    mark: Optional[float] = None
    weight: Optional[float] = None

class AssignmentUpdate(BaseModel):
    name: Optional[str] = None
    mark: Optional[float] = None
    weight: Optional[float] = None

class CalculationRequest(BaseModel):
    assignments: list = []
    target_grade: float = 0.0
    
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from calculations import calculate_grades

load_dotenv()

app = FastAPI(title="Grade Calculator API")

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://192.168.2.30:3000",
    "http://192.168.2.30:3001"
    # Add your production frontend URL here later
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Intialization
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Grade Calculator API. FastAPI backend is running!"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
# NOTE: We will build out endpoints for courses, assignments, and grades here.

@app.post("/api/calculate")
def calculate_grade_metrics(req: CalculationRequest):
    """Calculates grading metrics using calculations.py"""
    return calculate_grades(req.assignments, req.target_grade)

# --- COURSES ENDPOINTS ---

@app.post("/api/courses")
def create_course(course: CourseCreate):
    """Create a new course."""
    response = supabase.table("courses").insert(course.model_dump()).execute()
    return response.data

@app.get("/api/courses")
def get_user_courses(user_id: str):
    """Get all courses for a specific user. (e.g., /api/courses?user_id=123)"""
    response = supabase.table("courses").select("*").eq("user_id", user_id).execute()
    return response.data

@app.get("/api/courses/{course_id}")
def get_course(course_id: str):
    """Get a specific course by its ID."""
    response = supabase.table("courses").select("*").eq("id", course_id).execute()
    return response.data

@app.put("/api/courses/{course_id}")
def update_course(course_id: str, course: CourseUpdate):
    """Update a specific course."""
    # exclude_unset=True ensures we only update fields that were provided in the request
    update_data = course.model_dump(exclude_unset=True)
    response = supabase.table("courses").update(update_data).eq("id", course_id).execute()
    return response.data

@app.delete("/api/courses/{course_id}")
def delete_course(course_id: str):
    """Delete a specific course."""
    response = supabase.table("courses").delete().eq("id", course_id).execute()
    return response.data

# --- ASSIGNMENTS ENDPOINTS ---

@app.post("/api/assignments")
def create_assignment(assignment: AssignmentCreate):
    """Create a new assignment."""
    response = supabase.table("assignments").insert(assignment.model_dump()).execute()
    return response.data

@app.get("/api/courses/{course_id}/assignments")
def get_course_assignments(course_id: str):
    """Get all assignments for a specific course."""
    response = supabase.table("assignments").select("*").eq("course_id", course_id).execute()
    return response.data

@app.get("/api/assignments/{assignment_id}")
def get_assignment(assignment_id: str):
    """Get a specific assignment by its ID."""
    response = supabase.table("assignments").select("*").eq("id", assignment_id).execute()
    return response.data

@app.put("/api/assignments/{assignment_id}")
def update_assignment(assignment_id: str, assignment: AssignmentUpdate):
    """Update a specific assignment."""
    update_data = assignment.model_dump(exclude_unset=True)
    response = supabase.table("assignments").update(update_data).eq("id", assignment_id).execute()
    return response.data

@app.delete("/api/assignments/{assignment_id}")
def delete_assignment(assignment_id: str):
    """Delete a specific assignment."""
    response = supabase.table("assignments").delete().eq("id", assignment_id).execute()
    return response.data

