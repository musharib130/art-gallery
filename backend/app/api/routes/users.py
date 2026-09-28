from fastapi import APIRouter, HTTPException, status
from sqlalchemy import delete, exists, false, func, select
from sqlalchemy.dialects.postgresql import insert

from app.api.deps import CurrentUser, DbSession, OptionalUser
from app.api.params import Limit, Offset
from app.models import ArtistFollow, Gallery, User, UserRole
from app.schemas.common import Page
from app.schemas.gallery import GalleryOut
from app.schemas.user import ArtistProfile, UserPublic
from app.services.galleries import gallery_select, serialize_gallery
from app.services.pagination import paginate

router = APIRouter(prefix="/users", tags=["users"])


def get_user_or_404(db: DbSession, username: str) -> User:
    user = db.scalar(select(User).where(User.username == username, User.is_active))
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return user


def profile_select(viewer: User | None):
    follower_count = (
        select(func.count())
        .where(ArtistFollow.artist_id == User.id)
        .correlate(User)
        .scalar_subquery()
    )
    gallery_count = (
        select(func.count()).where(Gallery.owner_id == User.id).correlate(User).scalar_subquery()
    )
    if viewer is None:
        followed = false()
    else:
        followed = (
            exists()
            .where(ArtistFollow.artist_id == User.id, ArtistFollow.follower_id == viewer.id)
            .correlate(User)
        )
    return select(
        User,
        follower_count.label("follower_count"),
        gallery_count.label("gallery_count"),
        followed.label("is_followed"),
    ).where(User.is_active)


def serialize_profile(row) -> ArtistProfile:
    return ArtistProfile(
        **UserPublic.model_validate(row.User).model_dump(),
        follower_count=row.follower_count,
        gallery_count=row.gallery_count,
        is_followed=row.is_followed,
    )


artists_router = APIRouter(prefix="/artists", tags=["users"])


@artists_router.get("")
def list_artists(
    db: DbSession, viewer: OptionalUser, limit: Limit = 20, offset: Offset = 0
) -> Page[ArtistProfile]:
    stmt = (
        profile_select(viewer)
        .where(User.role == UserRole.ARTIST)
        .order_by(User.display_name, User.id)
    )
    return paginate(db, stmt, limit, offset, serialize_profile)


@router.get("/{username}")
def get_profile(username: str, db: DbSession, viewer: OptionalUser) -> ArtistProfile:
    row = db.execute(profile_select(viewer).where(User.username == username)).first()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return serialize_profile(row)


@router.get("/{username}/galleries")
def list_user_galleries(
    username: str, db: DbSession, viewer: OptionalUser, limit: Limit = 20, offset: Offset = 0
) -> Page[GalleryOut]:
    user = get_user_or_404(db, username)
    stmt = (
        gallery_select(viewer)
        .where(Gallery.owner_id == user.id)
        .order_by(Gallery.created_at.desc(), Gallery.id)
    )
    return paginate(db, stmt, limit, offset, serialize_gallery)


@router.put("/{username}/follow", status_code=status.HTTP_204_NO_CONTENT)
def follow_artist(username: str, db: DbSession, user: CurrentUser) -> None:
    artist = get_user_or_404(db, username)
    if artist.role != UserRole.ARTIST:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only artists can be followed")
    if artist.id == user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot follow yourself")
    db.execute(
        insert(ArtistFollow)
        .values(follower_id=user.id, artist_id=artist.id)
        .on_conflict_do_nothing()
    )
    db.commit()


@router.delete("/{username}/follow", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_artist(username: str, db: DbSession, user: CurrentUser) -> None:
    artist = get_user_or_404(db, username)
    db.execute(
        delete(ArtistFollow).where(
            ArtistFollow.follower_id == user.id, ArtistFollow.artist_id == artist.id
        )
    )
    db.commit()
