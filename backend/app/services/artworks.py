import uuid

from sqlalchemy import Select, exists, false, func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models import Artwork, ArtworkImage, ArtworkLike, ArtworkSave, Comment, Gallery, User
from app.schemas.artwork import ArtworkOut
from app.schemas.gallery import GalleryRef
from app.schemas.user import UserPublic


def artwork_select(viewer: User | None) -> Select:
    """Artworks with like/comment counts and the viewer's liked/saved flags."""
    like_count = (
        select(func.count())
        .where(ArtworkLike.artwork_id == Artwork.id)
        .correlate(Artwork)
        .scalar_subquery()
    )
    comment_count = (
        select(func.count())
        .where(Comment.artwork_id == Artwork.id)
        .correlate(Artwork)
        .scalar_subquery()
    )
    if viewer is None:
        liked = saved = false()
    else:
        # Explicit correlate: callers may join ArtworkSave/ArtworkLike in the outer query.
        liked = (
            exists()
            .where(ArtworkLike.artwork_id == Artwork.id, ArtworkLike.user_id == viewer.id)
            .correlate(Artwork)
        )
        saved = (
            exists()
            .where(ArtworkSave.artwork_id == Artwork.id, ArtworkSave.user_id == viewer.id)
            .correlate(Artwork)
        )
    return select(
        Artwork,
        like_count.label("like_count"),
        comment_count.label("comment_count"),
        liked.label("liked_by_me"),
        saved.label("saved_by_me"),
    ).options(
        selectinload(Artwork.images),
        joinedload(Artwork.gallery).joinedload(Gallery.owner),
    )


def serialize_artwork(row, viewer: User | None) -> ArtworkOut:
    artwork: Artwork = row.Artwork
    owner = artwork.gallery.owner
    is_owner = viewer is not None and viewer.id == owner.id
    return ArtworkOut(
        id=artwork.id,
        title=artwork.title,
        description=artwork.description,
        is_for_sale=artwork.is_for_sale,
        # The stored price survives toggling; only the owner sees it while hidden.
        price_cents=artwork.price_cents if artwork.is_for_sale or is_owner else None,
        images=artwork.images,
        gallery=GalleryRef(id=artwork.gallery.id, title=artwork.gallery.title),
        artist=UserPublic.model_validate(owner),
        like_count=row.like_count,
        comment_count=row.comment_count,
        liked_by_me=row.liked_by_me,
        saved_by_me=row.saved_by_me,
        created_at=artwork.created_at,
        updated_at=artwork.updated_at,
    )


def get_artwork_out(db: Session, artwork_id: uuid.UUID, viewer: User | None) -> ArtworkOut | None:
    row = db.execute(artwork_select(viewer).where(Artwork.id == artwork_id)).unique().first()
    return serialize_artwork(row, viewer) if row else None


def replace_images(db: Session, artwork: Artwork, urls: list[str], primary_index: int) -> None:
    """Swap in a new ordered image list. Flush between steps so position/primary
    unique constraints never see old and new rows at once."""
    artwork.images.clear()
    db.flush()
    artwork.images.extend(
        ArtworkImage(url=url, position=i, is_primary=i == primary_index)
        for i, url in enumerate(urls)
    )
    db.flush()
