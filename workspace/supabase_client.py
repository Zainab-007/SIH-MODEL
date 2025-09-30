import os
import requests
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()

# HTTP-based Supabase client using REST API
class HttpSupabaseTable:
    def __init__(self, table_name, base_url, headers):
        self.table_name = table_name
        self.base_url = base_url
        self.headers = headers
    
    def select(self, columns="*", count=None):
        try:
            url = f"{self.base_url}/rest/v1/{self.table_name}"
            params = {"select": columns}
            if count == "exact":
                self.headers["Prefer"] = "count=exact"
            
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            response_count = None
            if count == "exact":
                response_count = int(response.headers.get("Content-Range", "0").split("/")[-1])
            
            return HttpSupabaseResponse(data, response_count)
        except Exception as e:
            print(f"Error fetching from {self.table_name}: {e}")
            return HttpSupabaseResponse([], 0)
    
    def insert(self, data):
        try:
            url = f"{self.base_url}/rest/v1/{self.table_name}"
            response = requests.post(url, headers=self.headers, json=data)
            response.raise_for_status()
            return HttpSupabaseResponse(response.json() if response.content else [], None)
        except Exception as e:
            print(f"Error inserting into {self.table_name}: {e}")
            return HttpSupabaseResponse([], None)
    
    def delete(self):
        return HttpSupabaseDeleteQuery(self.table_name, self.base_url, self.headers)

class HttpSupabaseDeleteQuery:
    def __init__(self, table_name, base_url, headers):
        self.table_name = table_name
        self.base_url = base_url
        self.headers = headers
        self.conditions = []
    
    def neq(self, column, value):
        self.conditions.append(f"{column}=neq.{value}")
        return self
    
    def execute(self):
        try:
            url = f"{self.base_url}/rest/v1/{self.table_name}"
            if self.conditions:
                url += "?" + "&".join(self.conditions)
            response = requests.delete(url, headers=self.headers)
            response.raise_for_status()
            return HttpSupabaseResponse([], None)
        except Exception as e:
            print(f"Error deleting from {self.table_name}: {e}")
            return HttpSupabaseResponse([], None)

class HttpSupabaseResponse:
    def __init__(self, data, count=None):
        self.data = data
        self.count = count
    
    def execute(self):
        return self

class HttpSupabaseClient:
    def __init__(self, base_url, headers):
        self.base_url = base_url
        self.headers = headers
    
    def table(self, table_name):
        return HttpSupabaseTable(table_name, self.base_url, self.headers.copy())

# Mock Supabase client for testing purposes
class MockSupabaseTable:
    def __init__(self, table_name):
        self.table_name = table_name
        self.mock_data = self._get_mock_data()
    
    def _get_mock_data(self):
        if self.table_name == "students":
            return [
                {"id": 1, "name": "John Doe", "email": "john@example.com", "category": "GEN"},
                {"id": 2, "name": "Jane Smith", "email": "jane@example.com", "category": "SC"},
                {"id": 3, "name": "Bob Johnson", "email": "bob@example.com", "category": "OBC"}
            ]
        elif self.table_name == "internships":
            return [
                {"id": 1, "org_name": "Tech Corp", "company": "Tech Corp", "sector": "Technology", "seats": 10, "location": "Mumbai"},
                {"id": 2, "org_name": "Finance Ltd", "company": "Finance Ltd", "sector": "Finance", "seats": 5, "location": "Delhi"},
                {"id": 3, "org_name": "Healthcare Inc", "company": "Healthcare Inc", "sector": "Healthcare", "seats": 8, "location": "Bangalore"}
            ]
        elif self.table_name == "allocations":
            return [
                {"id": 1, "student_id": 1, "internship_id": 1, "score": 85.5, "allocation_type": "primary", "reason": "Skills match", "students": {"name": "John Doe"}, "internships": {"org_name": "Tech Corp", "company": "Tech Corp", "sector": "Technology", "location": "Mumbai"}},
                {"id": 2, "student_id": 2, "internship_id": 2, "score": 78.2, "allocation_type": "primary", "reason": "Good fit", "students": {"name": "Jane Smith"}, "internships": {"org_name": "Finance Ltd", "company": "Finance Ltd", "sector": "Finance", "location": "Delhi"}},
                {"id": 3, "student_id": 3, "internship_id": 3, "score": 92.1, "allocation_type": "primary", "reason": "Excellent match", "students": {"name": "Bob Johnson"}, "internships": {"org_name": "Healthcare Inc", "company": "Healthcare Inc", "sector": "Healthcare", "location": "Bangalore"}}
            ]
        return []
    
    def select(self, columns="*", count=None):
        return MockSupabaseResponse(self.mock_data, len(self.mock_data) if count == "exact" else None)
    
    def insert(self, data):
        print(f"Mock insert into {self.table_name}: {data}")
        return MockSupabaseResponse([], None)
    
    def delete(self):
        return MockSupabaseDeleteQuery()

class MockSupabaseDeleteQuery:
    def neq(self, column, value):
        return self
    
    def execute(self):
        print("Mock delete executed")
        return MockSupabaseResponse([], None)

class MockSupabaseResponse:
    def __init__(self, data, count=None):
        self.data = data
        self.count = count
    
    def execute(self):
        return self

class MockSupabaseClient:
    def table(self, table_name):
        return MockSupabaseTable(table_name)

@lru_cache(maxsize=1)
def get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_KEY")
        or os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")
    )
    
    if url and key:
        headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        print(f"Using HTTP Supabase client for {url}")
        return HttpSupabaseClient(url, headers)
    
    # Fallback to mock client
    print("Using mock Supabase client - no credentials found")
    return MockSupabaseClient()
