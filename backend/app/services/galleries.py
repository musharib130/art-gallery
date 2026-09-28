import uuid

from sqlalchemy import Select, exists, false, func, select
from sqlalchemy.orm import Session, joinedload

from app.models import Artwork, Gallery, GalleryFollow, User
from app.schemas.gallery import GalleryOut
from app.schemas.user import UserPublic


def gallery_select(viewer: User | None) -> Select:
    artwork_count = (
        select(func.count())
        .where(Artwork.gallery_id == Gallery.id)
        .correlate(Gallery)
        .scalar_subquery()
    )
    follower_count = (
        select(func.count())
        .where(GalleryFollow.gallery_id == Gallery.id)
        .correlate(Gallery)
        .scalar_subquery()
    )
    if viewer is None:
        followed = false()
    else:
        followed = (
            exists()
            .where(GalleryFollow.gallery_id == Gallery.id, GalleryFollow.follower_id == viewer.id)
            .correlate(Gallery)
        )
    return select(
        Gallery,
        artwork_count.label("artwork_count"),
        follower_count.label("follower_count"),
        followed.label("is_followed"),
    ).options(joinedload(Gallery.owner))


def serialize_gallery(row) -> GalleryOut:
    gallery: Gallery = row.Gallery
    return GalleryOut(
        id=gallery.id,
        title=gallery.title,
        description=gallery.description,
        cover_image_url=gallery.cover_image_url,
        owner=UserPublic.model_validate(gallery.owner),
        artwork_count=row.artwork_count,
        follower_count=row.follower_count,
        is_followed=row.is_followed,
        created_at=gallery.created_at,
        updated_at=gallery.updated_at,
    )


def get_gallery_out(db: Session, gallery_id: uuid.UUID, viewer: User | None) -> GalleryOut | None:
    row = db.execute(gallery_select(viewer).where(Gallery.id == gallery_id)).first()
    return serialize_gallery(row) if row else None
