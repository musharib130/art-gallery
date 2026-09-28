from fastapi import APIRouter
from sqlalchemy import exists, or_, select

from app.api.deps import CurrentUser, DbSession, OptionalUser
from app.api.params import Limit, Offset
from app.models import ArtistFollow, Artwork, ArtworkSave, Gallery, GalleryFollow
from app.schemas.artwork import ArtworkOut
from app.schemas.common import Page
from app.services.artworks import artwork_select, serialize_artwork
from app.services.pagination import paginate

router = APIRouter(tags=["feed"])


@router.get("/feed")
def feed(
    db: DbSession, viewer: OptionalUser, limit: Limit = 20, offset: Offset = 0
) -> Page[ArtworkOut]:
    """Newest artworks. Logged-in users who follow anyone see only followed
    artists and galleries; everyone else sees all artworks."""
    stmt = artwork_select(viewer)
    if viewer is not None:
        follows_something = db.scalar(
            select(
                exists().where(ArtistFollow.follower_id == viewer.id)
                | exists().where(GalleryFollow.follower_id == viewer.id)
            )
        )
        if follows_something:
            followed_artists = select(ArtistFollow.artist_id).where(
                ArtistFollow.follower_id == viewer.id
            )
            followed_galleries = select(GalleryFollow.gallery_id).where(
                GalleryFollow.follower_id == viewer.id
            )
            stmt = stmt.join(Artwork.gallery).where(
                or_(
                    Gallery.owner_id.in_(followed_artists),
                    Artwork.gallery_id.in_(followed_galleries),
                )
            )
    stmt = stmt.order_by(Artwork.created_at.desc(), Artwork.id)
    return paginate(db, stmt, limit, offset, lambda row: serialize_artwork(row, viewer))


@router.get("/explore")
def explore(
    db: DbSession, viewer: OptionalUser, limit: Limit = 20, offset: Offset = 0
) -> Page[ArtworkOut]:
    """All artworks, newest first, regardless of follows."""
    stmt = artwork_select(viewer).order_by(Artwork.created_at.desc(), Artwork.id)
    return paginate(db, stmt, limit, offset, lambda row: serialize_artwork(row, viewer))


@router.get("/me/saved")
def saved_artworks(
    db: DbSession, user: CurrentUser, limit: Limit = 20, offset: Offset = 0
) -> Page[ArtworkOut]:
    stmt = (
        artwork_select(user)
        .join(ArtworkSave, ArtworkSave.artwork_id == Artwork.id)
        .where(ArtworkSave.user_id == user.id)
        .order_by(ArtworkSave.created_at.desc(), Artwork.id)
    )
    return paginate(db, stmt, limit, offset, lambda row: serialize_artwork(row, user))
