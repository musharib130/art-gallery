import pytest

from app.models import UserRole

GALLERY = {
    "title": "Blue Period",
    "description": "Early works",
    "cover_image_url": "http://x/c.png",
}


def artwork_payload(**overrides):
    return {
        "title": "Sky",
        "description": "Oil on canvas",
        "images": ["http://x/1.png", "http://x/2.png"],
        "primary_index": 1,
        **overrides,
    }


@pytest.fixture
def artist(make_user):
    return make_user("painter", UserRole.ARTIST)


@pytest.fixture
def gallery(client, artist):
    return client.post("/galleries", json=GALLERY, headers=artist).json()


def test_only_artists_create_galleries(client, make_user, artist):
    regular = make_user("viewer")
    assert client.post("/galleries", json=GALLERY, headers=regular).status_code == 403
    assert client.post("/galleries", json=GALLERY).status_code == 401
    res = client.post("/galleries", json=GALLERY, headers=artist)
    assert res.status_code == 201
    assert res.json()["owner"]["username"] == "painter"


def test_visitors_can_browse(client, gallery, artist):
    client.post(f"/galleries/{gallery['id']}/artworks", json=artwork_payload(), headers=artist)
    assert client.get("/galleries").json()["items"][0]["id"] == gallery["id"]
    assert client.get(f"/galleries/{gallery['id']}").status_code == 200
    assert len(client.get(f"/galleries/{gallery['id']}/artworks").json()["items"]) == 1
    assert len(client.get("/feed").json()["items"]) == 1
    assert client.get("/users/painter").json()["gallery_count"] == 1
    assert client.get("/artists").json()["items"][0]["username"] == "painter"


def test_only_owner_edits_gallery(client, make_user, gallery):
    other = make_user("rival", UserRole.ARTIST)
    res = client.patch(f"/galleries/{gallery['id']}", json={"title": "Mine"}, headers=other)
    assert res.status_code == 403


def test_delete_gallery_blocked_while_it_has_artworks(client, gallery, artist):
    created = client.post(
        f"/galleries/{gallery['id']}/artworks", json=artwork_payload(), headers=artist
    ).json()
    assert client.delete(f"/galleries/{gallery['id']}", headers=artist).status_code == 409
    assert client.delete(f"/artworks/{created['id']}", headers=artist).status_code == 204
    assert client.delete(f"/galleries/{gallery['id']}", headers=artist).status_code == 204


def test_artwork_images_and_primary(client, gallery, artist):
    res = client.post(
        f"/galleries/{gallery['id']}/artworks", json=artwork_payload(), headers=artist
    )
    assert res.status_code == 201
    images = res.json()["images"]
    assert [i["position"] for i in images] == [0, 1]
    assert [i["is_primary"] for i in images] == [False, True]


@pytest.mark.parametrize(
    "images,primary",
    [([], 0), ([f"http://x/{i}.png" for i in range(6)], 0), (["http://x/1.png"], 1)],
)
def test_artwork_image_limits(client, gallery, artist, images, primary):
    res = client.post(
        f"/galleries/{gallery['id']}/artworks",
        json=artwork_payload(images=images, primary_index=primary),
        headers=artist,
    )
    assert res.status_code == 422


def test_replace_images(client, gallery, artist):
    art = client.post(
        f"/galleries/{gallery['id']}/artworks", json=artwork_payload(), headers=artist
    ).json()
    urls = [f"http://x/n{i}.png" for i in range(5)]
    res = client.put(
        f"/artworks/{art['id']}/images", json={"images": urls, "primary_index": 3}, headers=artist
    )
    assert res.status_code == 200
    images = res.json()["images"]
    assert [i["url"] for i in images] == urls
    assert [i["is_primary"] for i in images] == [False, False, False, True, False]


def test_for_sale_requires_price(client, gallery, artist):
    res = client.post(
        f"/galleries/{gallery['id']}/artworks",
        json=artwork_payload(is_for_sale=True),
        headers=artist,
    )
    assert res.status_code == 422

    art = client.post(
        f"/galleries/{gallery['id']}/artworks", json=artwork_payload(), headers=artist
    ).json()
    res = client.patch(f"/artworks/{art['id']}", json={"is_for_sale": True}, headers=artist)
    assert res.status_code == 422


def test_price_hidden_when_not_for_sale_and_restored(client, make_user, gallery, artist):
    visitor = make_user("buyer")
    art = client.post(
        f"/galleries/{gallery['id']}/artworks",
        json=artwork_payload(is_for_sale=True, price_cents=125000),
        headers=artist,
    ).json()
    assert client.get(f"/artworks/{art['id']}").json()["price_cents"] == 125000

    client.patch(f"/artworks/{art['id']}", json={"is_for_sale": False}, headers=artist)
    assert client.get(f"/artworks/{art['id']}").json()["price_cents"] is None
    assert client.get(f"/artworks/{art['id']}", headers=visitor).json()["price_cents"] is None
    # The owner still sees the stored price while it is hidden.
    assert client.get(f"/artworks/{art['id']}", headers=artist).json()["price_cents"] == 125000

    client.patch(f"/artworks/{art['id']}", json={"is_for_sale": True}, headers=artist)
    assert client.get(f"/artworks/{art['id']}").json()["price_cents"] == 125000


def test_only_owner_edits_artwork(client, make_user, gallery, artist):
    other = make_user("rival", UserRole.ARTIST)
    art = client.post(
        f"/galleries/{gallery['id']}/artworks", json=artwork_payload(), headers=artist
    ).json()
    assert (
        client.patch(f"/artworks/{art['id']}", json={"title": "x"}, headers=other).status_code
        == 403
    )
    assert client.delete(f"/artworks/{art['id']}", headers=other).status_code == 403
