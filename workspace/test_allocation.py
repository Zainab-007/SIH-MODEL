#!/usr/bin/env python3

import requests
import json

# Test the allocation functionality
BASE_URL = "http://127.0.0.1:5000"

def test_allocation():
    print("Testing allocation functionality...")
    
    # First, let's check if we can get students and internships
    try:
        # Test students endpoint
        students_response = requests.get(f"{BASE_URL}/get_students", 
                                       cookies={'session': 'test'})
        print(f"Students endpoint status: {students_response.status_code}")
        if students_response.status_code == 200:
            students_data = students_response.json()
            print(f"Students found: {len(students_data.get('students', []))}")
        else:
            print(f"Students endpoint error: {students_response.text}")
            
        # Test internships endpoint  
        internships_response = requests.get(f"{BASE_URL}/get_internships",
                                          cookies={'session': 'test'})
        print(f"Internships endpoint status: {internships_response.status_code}")
        if internships_response.status_code == 200:
            internships_data = internships_response.json()
            print(f"Internships found: {len(internships_data.get('internships', []))}")
        else:
            print(f"Internships endpoint error: {internships_response.text}")
            
        # Test allocation endpoint
        allocation_response = requests.post(f"{BASE_URL}/run_allocation",
                                          json={},
                                          cookies={'session': 'test'})
        print(f"Allocation endpoint status: {allocation_response.status_code}")
        print(f"Allocation response: {allocation_response.text}")
        
    except Exception as e:
        print(f"Error testing allocation: {e}")

if __name__ == "__main__":
    test_allocation()
