import pytest

from app.models import UserRole

GALLERY = {"title": "G", "description": "d", "cover_image_url": "http://x/c.png"}
ARTWORK = {"title": "A", "description": "d", "images": ["http://x/1.png"]}


@pytest.fixture
def setup(client, make_user):
    artist = make_user("painter", UserRole.ARTIST)
    fan = make_user("fan")
    gallery = client.post("/galleries", json=GALLERY, headers=artist).json()
    art = client.post(f"/galleries/{gallery['id']}/artworks", json=ARTWORK, headers=artist).json()
    return artist, fan, gallery, art


def test_like_and_save_are_idempotent(client, setup):
    _, fan, _, art = setup
    for _ in range(2):
        assert client.put(f"/artworks/{art['id']}/like", headers=fan).status_code == 204
        assert client.put(f"/artworks/{art['id']}/save", headers=fan).status_code == 204
    got = client.get(f"/artworks/{art['id']}", headers=fan).json()
    assert got["like_count"] == 1
    assert got["liked_by_me"] and got["saved_by_me"]
    assert [a["id"] for a in client.get("/me/saved", headers=fan).json()["items"]] == [art["id"]]

    client.delete(f"/artworks/{art['id']}/like", headers=fan)
    client.delete(f"/artworks/{art['id']}/save", headers=fan)
    got = client.get(f"/artworks/{art['id']}", headers=fan).json()
    assert got["like_count"] == 0 and not got["liked_by_me"] and not got["saved_by_me"]


def test_visitors_cannot_engage(client, setup):
    _, _, gallery, art = setup
    assert client.put(f"/artworks/{art['id']}/like").status_code == 401
    assert client.post(f"/artworks/{art['id']}/comments", json={"body": "hi"}).status_code == 401
    assert client.put(f"/galleries/{gallery['id']}/follow").status_code == 401


def test_comments_permissions(client, make_user, setup):
    artist, fan, _, art = setup
    stranger = make_user("stranger")
    c = client.post(f"/artworks/{art['id']}/comments", json={"body": "Lovely"}, headers=fan)
    assert c.status_code == 201
    comment = c.json()
    assert comment["author"]["username"] == "fan"

    patch = client.patch(f"/comments/{comment['id']}", json={"body": "x"}, headers=stranger)
    assert patch.status_code == 403
    edited = client.patch(f"/comments/{comment['id']}", json={"body": "Stunning"}, headers=fan)
    assert edited.json()["body"] == "Stunning"
    assert client.delete(f"/comments/{comment['id']}", headers=stranger).status_code == 403
    # The artist can moderate comments on their own artwork.
    assert client.delete(f"/comments/{comment['id']}", headers=artist).status_code == 204
    assert client.get(f"/artworks/{art['id']}/comments").json()["items"] == []


def test_follow_rules(client, make_user, setup):
    artist, fan, gallery, _ = setup
    make_user("plain")
    assert client.put("/users/painter/follow", headers=fan).status_code == 204
    assert client.put("/users/painter/follow", headers=fan).status_code == 204
    assert client.get("/users/painter", headers=fan).json()["follower_count"] == 1
    assert client.put("/users/plain/follow", headers=fan).status_code == 400
    assert client.put("/users/painter/follow", headers=artist).status_code == 400

    assert client.put(f"/galleries/{gallery['id']}/follow", headers=fan).status_code == 204
    got = client.get(f"/galleries/{gallery['id']}", headers=fan).json()
    assert got["follower_count"] == 1 and got["is_followed"]


def test_feed_uses_follows(client, make_user, setup):
    _, fan, _, art = setup
    other = make_user("sculptor", UserRole.ARTIST)
    og = client.post("/galleries", json=GALLERY, headers=other).json()
    other_art = client.post(f"/galleries/{og['id']}/artworks", json=ARTWORK, headers=other).json()

    # Following nobody: everything, newest first.
    ids = [a["id"] for a in client.get("/feed", headers=fan).json()["items"]]
    assert ids == [other_art["id"], art["id"]]

    client.put("/users/painter/follow", headers=fan)
    ids = [a["id"] for a in client.get("/feed", headers=fan).json()["items"]]
    assert ids == [art["id"]]

    client.put(f"/galleries/{og['id']}/follow", headers=fan)
    ids = [a["id"] for a in client.get("/feed", headers=fan).json()["items"]]
    assert ids == [other_art["id"], art["id"]]

    assert len(client.get("/explore", headers=fan).json()["items"]) == 2


def test_pagination(client, setup):
    artist, _, gallery, _ = setup
    for _ in range(3):
        client.post(f"/galleries/{gallery['id']}/artworks", json=ARTWORK, headers=artist)
    page = client.get("/feed?limit=2").json()
    assert len(page["items"]) == 2 and page["has_more"]
    page = client.get("/feed?limit=2&offset=2").json()
    assert len(page["items"]) == 2 and not page["has_more"]


def test_upload(client, make_user, png_bytes):
    headers = make_user("uploader")
    res = client.post(
        "/uploads", files={"file": ("a.png", png_bytes, "image/png")}, headers=headers
    )
    assert res.status_code == 201
    assert res.json()["url"].endswith(".png")
    bad = client.post("/uploads", files={"file": ("a.png", b"nope", "image/png")}, headers=headers)
    assert bad.status_code == 400
    assert client.post("/uploads", files={"file": ("a.png", png_bytes)}).status_code == 401
