import uuid
from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Should be a mapping with at least one known activity
    assert isinstance(data, dict)
    assert len(data) > 0


def test_signup_and_unregister_flow():
    # pick an existing activity name
    activity_name = next(iter(activities.keys()))
    test_email = f"testuser+{uuid.uuid4().hex}@example.com"

    # ensure the email is not already registered
    resp = client.get("/activities")
    assert resp.status_code == 200
    assert test_email not in resp.json()[activity_name]["participants"]

    # signup
    signup_resp = client.post(f"/activities/{activity_name}/signup", data={"email": test_email})
    assert signup_resp.status_code == 200
    assert "Signed up" in signup_resp.json().get("message", "")

    # verify participant appears
    resp_after = client.get("/activities")
    assert test_email in resp_after.json()[activity_name]["participants"]

    # unregister
    unreg_resp = client.post(f"/activities/{activity_name}/unregister", data={"email": test_email})
    assert unreg_resp.status_code == 200
    assert "Unregistered" in unreg_resp.json().get("message", "")

    # verify participant removed
    resp_final = client.get("/activities")
    assert test_email not in resp_final.json()[activity_name]["participants"]


def test_unregister_nonexistent_returns_404():
    activity_name = next(iter(activities.keys()))
    fake_email = f"noone+{uuid.uuid4().hex}@example.com"
    resp = client.post(f"/activities/{activity_name}/unregister", data={"email": fake_email})
    assert resp.status_code == 404


def test_signup_duplicate_returns_400():
    activity_name = next(iter(activities.keys()))
    # use an existing participant (if any) otherwise create one first
    existing_list = activities[activity_name].get("participants", [])
    if not existing_list:
        # create a participant
        client.post(f"/activities/{activity_name}/signup", data={"email": "dup@example.com"})
        existing = "dup@example.com"
    else:
        existing = existing_list[0]

    resp = client.post(f"/activities/{activity_name}/signup", data={"email": existing})
    assert resp.status_code == 400
