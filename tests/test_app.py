import pytest
from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)

# Helper to reset activities for test isolation
def reset_activities():
    for activity in activities.values():
        activity["participants"] = activity["participants"][:2]

@pytest.fixture(autouse=True)
def run_before_tests():
    reset_activities()


def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    assert "Soccer Team" in response.json()


def test_signup_for_activity_success():
    email = "newstudent@mergington.edu"
    response = client.post(f"/activities/Soccer Team/signup?email={email}")
    assert response.status_code == 200
    assert email in activities["Soccer Team"]["participants"]


def test_signup_for_activity_already_signed_up():
    email = activities["Soccer Team"]["participants"][0]
    response = client.post(f"/activities/Soccer Team/signup?email={email}")
    assert response.status_code == 400
    assert response.json()["detail"] == "Student is already signed up"


def test_signup_for_activity_not_found():
    response = client.post("/activities/Unknown/signup?email=test@mergington.edu")
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_signup_for_activity_full():
    # Fill up Soccer Team
    activity = activities["Soccer Team"]
    activity["participants"] = [f"student{i}@mergington.edu" for i in range(activity["max_participants"])]
    response = client.post("/activities/Soccer Team/signup?email=overflow@mergington.edu")
    assert response.status_code == 400
    assert response.json()["detail"] == "Activity is full"


def test_unregister_participant_success():
    email = activities["Soccer Team"]["participants"][0]
    response = client.post(f"/activities/Soccer Team/unregister", json={"email": email})
    assert response.status_code == 200
    assert email not in activities["Soccer Team"]["participants"]


def test_unregister_participant_not_found():
    response = client.post(f"/activities/Soccer Team/unregister", json={"email": "notfound@mergington.edu"})
    assert response.status_code == 400
    assert response.json()["detail"] == "Student is not registered"


def test_unregister_activity_not_found():
    response = client.post(f"/activities/Unknown/unregister", json={"email": "someone@mergington.edu"})
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"
