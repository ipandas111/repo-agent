from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_analyze_invalid_url():
    response = client.post("/analyze", json={
        "github_url": "https://notgithub.com/foo/bar",
        "user_request": "What is this?"
    })
    assert response.status_code == 400
    assert "github.com" in response.json()["detail"].lower()

def test_analyze_missing_fields():
    response = client.post("/analyze", json={"github_url": "https://github.com/foo/bar"})
    assert response.status_code == 422
