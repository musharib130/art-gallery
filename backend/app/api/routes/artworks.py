import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import joinedload

from app.api.deps import CurrentArtist, CurrentUser, DbSession, OptionalUser
from app.api.params import Limit, Offset
from app.models import Artwork, ArtworkLike, ArtworkSave, Comment, Gallery, User
from app.schemas.artwork import ArtworkOut, ArtworkUpdate, ImagesIn
from app.schemas.comment import CommentIn, CommentOut
from app.schemas.common import Page
from app.services.artworks import get_artwork_out, replace_images
from app.services.pagination import paginate

router = APIRouter(prefix="/artworks", tags=["artworks"])


def get_artwork_or_404(db: DbSession, artwork_id: uuid.UUID) -> Artwork:
    artwork = db.get(Artwork, artwork_id, options=[joinedload(Artwork.gallery)])
    if artwork is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Artwork not found")
    return artwork


def get_owned_artwork(db: DbSession, artwork_id: uuid.UUID, user: User) -> Artwork:
    artwork = get_artwork_or_404(db, artwork_id)
    if artwork.gallery.owner_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not own this artwork")
    return artwork


@router.get("/{artwork_id}")
def get_artwork(artwork_id: uuid.UUID, db: DbSession, viewer: OptionalUser) -> ArtworkOut:
    artwork = get_artwork_out(db, artwork_id, viewer)
    if artwork is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Artwork not found")
    return artwork


@router.patch("/{artwork_id}")
def update_artwork(
    artwork_id: uuid.UUID, body: ArtworkUpdate, db: DbSession, artist: CurrentArtist
) -> ArtworkOut:
    artwork = get_owned_artwork(db, artwork_id, artist)
    for field, value in body.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(artwork, field, value)
    if artwork.is_for_sale and artwork.price_cents is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "Set a price before marking this artwork for sale",
        )
    db.commit()
    return get_artwork_out(db, artwork.id, artist)


@router.put("/{artwork_id}/images")
def set_artwork_images(
    artwork_id: uuid.UUID, body: ImagesIn, db: DbSession, artist: CurrentArtist
) -> ArtworkOut:
    """Replace the whole image list; use it to add, remove, reorder or change primary."""
    artwork = get_owned_artwork(db, artwork_id, artist)
    replace_images(db, artwork, body.images, body.primary_index)
    db.commit()
    return get_artwork_out(db, artwork.id, artist)


@router.delete("/{artwork_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_artwork(artwork_id: uuid.UUID, db: DbSession, artist: CurrentArtist) -> None:
    artwork = get_owned_artwork(db, artwork_id, artist)
    db.delete(artwork)
    db.commit()


@router.put("/{artwork_id}/like", status_code=status.HTTP_204_NO_CONTENT)
def like_artwork(artwork_id: uuid.UUID, db: DbSession, user: CurrentUser) -> None:
    get_artwork_or_404(db, artwork_id)
    db.execute(
        insert(ArtworkLike).values(user_id=user.id, artwork_id=artwork_id).on_conflict_do_nothing()
    )
    db.commit()


@router.delete("/{artwork_id}/like", status_code=status.HTTP_204_NO_CONTENT)
def unlike_artwork(artwork_id: uuid.UUID, db: DbSession, user: CurrentUser) -> None:
    db.execute(
        delete(ArtworkLike).where(
            ArtworkLike.user_id == user.id, ArtworkLike.artwork_id == artwork_id
        )
    )
    db.commit()


@router.put("/{artwork_id}/save", status_code=status.HTTP_204_NO_CONTENT)
def save_artwork(artwork_id: uuid.UUID, db: DbSession, user: CurrentUser) -> None:
    get_artwork_or_404(db, artwork_id)
    db.execute(
        insert(ArtworkSave).values(user_id=user.id, artwork_id=artwork_id).on_conflict_do_nothing()
    )
    db.commit()


@router.delete("/{artwork_id}/save", status_code=status.HTTP_204_NO_CONTENT)
def unsave_artwork(artwork_id: uuid.UUID, db: DbSession, user: CurrentUser) -> None:
    db.execute(
        delete(ArtworkSave).where(
            ArtworkSave.user_id == user.id, ArtworkSave.artwork_id == artwork_id
        )
    )
    db.commit()


@router.get("/{artwork_id}/comments")
def list_comments(
    artwork_id: uuid.UUID, db: DbSession, limit: Limit = 50, offset: Offset = 0
) -> Page[CommentOut]:
    get_artwork_or_404(db, artwork_id)
    stmt = (
        select(Comment)
        .options(joinedload(Comment.author))
        .where(Comment.artwork_id == artwork_id)
        .order_by(Comment.created_at, Comment.id)
    )
    return paginate(db, stmt, limit, offset, lambda row: CommentOut.model_validate(row.Comment))


@router.post("/{artwork_id}/comments", status_code=status.HTTP_201_CREATED)
def create_comment(
    artwork_id: uuid.UUID, body: CommentIn, db: DbSession, user: CurrentUser
) -> CommentOut:
    get_artwork_or_404(db, artwork_id)
    comment = Comment(artwork_id=artwork_id, user_id=user.id, body=body.body)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return CommentOut.model_validate(comment)


# Kept here so every artwork-related route lives together.
comments_router = APIRouter(prefix="/comments", tags=["comments"])


def get_comment_or_404(db: DbSession, comment_id: uuid.UUID) -> Comment:
    comment = db.get(Comment, comment_id)
    if comment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Comment not found")
    return comment


@comments_router.patch("/{comment_id}")
def update_comment(
    comment_id: uuid.UUID, body: CommentIn, db: DbSession, user: CurrentUser
) -> CommentOut:
    comment = get_comment_or_404(db, comment_id)
    if comment.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only edit your own comments")
    comment.body = body.body
    db.commit()
    db.refresh(comment)
    return CommentOut.model_validate(comment)


@comments_router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(comment_id: uuid.UUID, db: DbSession, user: CurrentUser) -> None:
    """Authors can delete their comments; artists can delete comments on their artworks."""
    comment = get_comment_or_404(db, comment_id)
    artwork_owner_id = db.scalar(
        select(Gallery.owner_id).join(Artwork).where(Artwork.id == comment.artwork_id)
    )
    if user.id not in (comment.user_id, artwork_owner_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You cannot delete this comment")
    db.delete(comment)
    db.commit()
