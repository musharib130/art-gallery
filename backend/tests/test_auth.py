from tests.conftest import auth


def test_signup_creates_regular_user(client):
    res = client.post(
        "/auth/signup",
        json={
            "email": "New@Example.com",
            "password": "password123",
            "username": "newbie",
            "display_name": "New Bie",
        },
    )
    assert res.status_code == 201
    body = res.json()
    assert body["user"]["role"] == "regular"
    assert body["user"]["email"] == "new@example.com"

    me = client.get("/auth/me", headers=auth(body["access_token"]))
    assert me.json()["username"] == "newbie"


def test_signup_ignores_role_field(client):
    res = client.post(
        "/auth/signup",
        json={
            "email": "sneaky@example.com",
            "password": "password123",
            "username": "sneaky",
            "display_name": "Sneaky",
            "role": "artist",
        },
    )
    assert res.json()["user"]["role"] == "regular"


def test_signup_rejects_duplicates_and_bad_input(client):
    payload = {
        "email": "dup@example.com",
        "password": "password123",
        "username": "dup",
        "display_name": "Dup",
    }
    assert client.post("/auth/signup", json=payload).status_code == 201
    assert client.post("/auth/signup", json=payload).status_code == 409
    short = {**payload, "email": "x@example.com", "username": "x_user", "password": "short"}
    assert client.post("/auth/signup", json=short).status_code == 422


def test_login(client, make_user):
    make_user("alice")
    ok = client.post("/auth/login", json={"email": "alice@example.com", "password": "password123"})
    assert ok.status_code == 200
    bad = client.post("/auth/login", json={"email": "alice@example.com", "password": "wrong-pass"})
    assert bad.status_code == 401


def test_bad_token_rejected(client):
    assert client.get("/auth/me", headers=auth("garbage")).status_code == 401
    assert client.get("/auth/me").status_code == 401


def test_update_profile(client, make_user):
    headers = make_user("bob")
    res = client.patch("/auth/me", json={"bio": "Hello"}, headers=headers)
    assert res.json()["bio"] == "Hello"
