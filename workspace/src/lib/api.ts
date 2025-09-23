// API integration for Optima platform

const API_BASE_URL = 'http://localhost:5000'; // Update this to your backend URL

export interface Student {
  id?: number;
  name: string;
  marks: number;
  skills: string;
  category: 'GEN' | 'SC' | 'ST' | 'OBC' | 'EWS';
  location_pref: string;
  sector_pref: string;
}

export interface Internship {
  id?: number;
  org_name: string;
  sector: string;
  skills_required: string;
  seats: number;
  quota_json: Record<string, number>;
  location: string;
}

export interface AllocationResult {
  student_id: number;
  internship_id: number;
  score: number;
  allocation_type: string;
  reason: string;
  student_name?: string;
  org_name?: string;
  sector?: string;
}

// Add a new student
export async function addStudent(student: Student): Promise<{ data: Student }> {
  const response = await fetch(`${API_BASE_URL}/add_student`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(student),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add student');
  }

  return response.json();
}

// Add a new internship
export async function addInternship(internship: Internship): Promise<{ data: Internship }> {
  const response = await fetch(`${API_BASE_URL}/add_internship`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(internship),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add internship');
  }

  return response.json();
}

// Run allocation algorithm
export async function runAllocation(): Promise<{ data: AllocationResult[] }> {
  const response = await fetch(`${API_BASE_URL}/allocate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to run allocation');
  }

  return response.json();
}

// Get all students
export async function getStudents(): Promise<{ data: Student[] }> {
  const response = await fetch(`${API_BASE_URL}/get_students`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch students');
  }

  return response.json();
}

// Get all internships
export async function getInternships(): Promise<{ data: Internship[] }> {
  const response = await fetch(`${API_BASE_URL}/get_internships`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch internships');
  }

  return response.json();
}

// Health check
export async function healthCheck(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  
  if (!response.ok) {
    throw new Error('Backend is not responding');
  }

  return response.json();
}