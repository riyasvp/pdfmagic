import requests, os

url = "http://192.168.0.135:3001/api/pdf/from-word"
file_path = os.path.abspath("test.docx")
files = {"files": open(file_path, "rb")}
resp = requests.post(url, files=files)
print("Status:", resp.status_code)
print("Response:", resp.text)
