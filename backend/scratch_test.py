# import sys
# import os
# from fastapi.testclient import TestClient

# # Add current dir to path
# sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# try:
#     from app.main import app
#     print("Successfully imported app.")
    
#     with TestClient(app) as client:
#         print("TestClient initialized, startup events triggered.")
        
#         # Test Root
#         response = client.get("/")
#         print(f"GET / response: {response.status_code}")
#         print(response.json())
#         assert response.status_code == 200
        
#         # Test OCR (without file, should fail 422, but proves endpoint is there)
#         print("Testing OCR route signature...")
#         res_ocr = client.post("/api/ocr")
#         print(f"POST /api/ocr status (expected 422 Unprocessable Entity due to missing file): {res_ocr.status_code}")
#         assert res_ocr.status_code == 422
        
#         print("\nAll basic tests passed! The backend boots up perfectly with lazy loading.")
import google.generativeai as genai

genai.configure(api_key="YOUR_API_KEY_HERE")

model = genai.GenerativeModel("gemini-3.1-flash-lite")

response = model.generate_content("Say Hello")

print(response.text)