"""Importing this package registers every model on Base.metadata."""

from app.models.artist_follow import ArtistFollow
from app.models.artwork import Artwork
from app.models.artwork_image import MAX_ARTWORK_IMAGES, ArtworkImage
from app.models.artwork_like import ArtworkLike
from app.models.artwork_save import ArtworkSave
from app.models.comment import Comment
from app.models.gallery import Gallery
from app.models.gallery_follow import GalleryFollow
from app.models.user import User, UserRole

__all__ = [
    "MAX_ARTWORK_IMAGES",
    "ArtistFollow",
    "Artwork",
    "ArtworkImage",
    "ArtworkLike",
    "ArtworkSave",
    "Comment",
    "Gallery",
    "GalleryFollow",
    "User",
    "UserRole",
]
