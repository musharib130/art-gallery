import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import delete, exists, select
from sqlalchemy.dialects.postgresql import insert

from app.api.deps import CurrentArtist, CurrentUser, DbSession, OptionalUser
from app.api.params import Limit, Offset
from app.models import Artwork, Gallery, GalleryFollow, User
from app.schemas.artwork import ArtworkCreate, ArtworkOut
from app.schemas.common import Page
from app.schemas.gallery import GalleryCreate, GalleryOut, GalleryUpdate
from app.services.artworks import (
    artwork_select,
    get_artwork_out,
    replace_images,
    serialize_artwork,
)
from app.services.galleries import gallery_select, get_gallery_out, serialize_gallery
from app.services.pagination import paginate

router = APIRouter(prefix="/galleries", tags=["galleries"])


def get_gallery_or_404(db: DbSession, gallery_id: uuid.UUID) -> Gallery:
    gallery = db.get(Gallery, gallery_id)
    if gallery is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Gallery not found")
    return gallery


def get_owned_gallery(db: DbSession, gallery_id: uuid.UUID, user: User) -> Gallery:
    gallery = get_gallery_or_404(db, gallery_id)
    if gallery.owner_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not own this gallery")
    return gallery


@router.get("")
def list_galleries(
    db: DbSession, viewer: OptionalUser, limit: Limit = 20, offset: Offset = 0
) -> Page[GalleryOut]:
    stmt = gallery_select(viewer).order_by(Gallery.created_at.desc(), Gallery.id)
    return paginate(db, stmt, limit, offset, serialize_gallery)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_gallery(body: GalleryCreate, db: DbSession, artist: CurrentArtist) -> GalleryOut:
    gallery = Gallery(owner_id=artist.id, **body.model_dump())
    db.add(gallery)
    db.commit()
    return get_gallery_out(db, gallery.id, artist)


@router.get("/{gallery_id}")
def get_gallery(gallery_id: uuid.UUID, db: DbSession, viewer: OptionalUser) -> GalleryOut:
    gallery = get_gallery_out(db, gallery_id, viewer)
    if gallery is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Gallery not found")
    return gallery


@router.patch("/{gallery_id}")
def update_gallery(
    gallery_id: uuid.UUID, body: GalleryUpdate, db: DbSession, artist: CurrentArtist
) -> GalleryOut:
    gallery = get_owned_gallery(db, gallery_id, artist)
    for field, value in body.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(gallery, field, value)
    db.commit()
    return get_gallery_out(db, gallery.id, artist)


@router.delete("/{gallery_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gallery(gallery_id: uuid.UUID, db: DbSession, artist: CurrentArtist) -> None:
    gallery = get_owned_gallery(db, gallery_id, artist)
    if db.scalar(select(exists().where(Artwork.gallery_id == gallery.id))):
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Move or delete this gallery's artworks first"
        )
    db.delete(gallery)
    db.commit()


@router.get("/{gallery_id}/artworks")
def list_gallery_artworks(
    gallery_id: uuid.UUID,
    db: DbSession,
    viewer: OptionalUser,
    limit: Limit = 20,
    offset: Offset = 0,
) -> Page[ArtworkOut]:
    get_gallery_or_404(db, gallery_id)
    stmt = (
        artwork_select(viewer)
        .where(Artwork.gallery_id == gallery_id)
        .order_by(Artwork.created_at.desc(), Artwork.id)
    )
    return paginate(db, stmt, limit, offset, lambda row: serialize_artwork(row, viewer))


@router.post("/{gallery_id}/artworks", status_code=status.HTTP_201_CREATED)
def create_artwork(
    gallery_id: uuid.UUID, body: ArtworkCreate, db: DbSession, artist: CurrentArtist
) -> ArtworkOut:
    gallery = get_owned_gallery(db, gallery_id, artist)
    artwork = Artwork(
        gallery_id=gallery.id,
        title=body.title,
        description=body.description,
        is_for_sale=body.is_for_sale,
        price_cents=body.price_cents,
    )
    db.add(artwork)
    db.flush()
    replace_images(db, artwork, body.images, body.primary_index)
    db.commit()
    return get_artwork_out(db, artwork.id, artist)


@router.put("/{gallery_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
def follow_gallery(gallery_id: uuid.UUID, db: DbSession, user: CurrentUser) -> None:
    get_gallery_or_404(db, gallery_id)
    db.execute(
        insert(GalleryFollow)
        .values(follower_id=user.id, gallery_id=gallery_id)
        .on_conflict_do_nothing()
    )
    db.commit()


@router.delete("/{gallery_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_gallery(gallery_id: uuid.UUID, db: DbSession, user: CurrentUser) -> None:
    db.execute(
        delete(GalleryFollow).where(
            GalleryFollow.follower_id == user.id, GalleryFollow.gallery_id == gallery_id
        )
    )
    db.commit()
