import uuid
from datetime import datetime

from pydantic import BaseModel, Field, model_validator

from app.models import MAX_ARTWORK_IMAGES
from app.schemas.common import ORMModel
from app.schemas.gallery import GalleryRef, ImageUrl, Title
from app.schemas.user import UserPublic


class ImagesIn(BaseModel):
    """The full, ordered image list for an artwork (1 to 5), plus which one is primary."""

    images: list[ImageUrl] = Field(min_length=1, max_length=MAX_ARTWORK_IMAGES)
    primary_index: int = Field(default=0, ge=0)

    @model_validator(mode="after")
    def primary_in_range(self):
        if self.primary_index >= len(self.images):
            raise ValueError("primary_index must point at one of the images")
        return self


class ArtworkCreate(ImagesIn):
    title: Title
    description: str = Field(max_length=5000)
    is_for_sale: bool = False
    price_cents: int | None = Field(default=None, gt=0, le=2_000_000_000)

    @model_validator(mode="after")
    def for_sale_requires_price(self):
        if self.is_for_sale and self.price_cents is None:
            raise ValueError("price_cents is required when the artwork is for sale")
        return self


class ArtworkUpdate(BaseModel):
    """Toggling is_for_sale keeps the stored price; send price_cents to change it."""

    title: Title | None = None
    description: str | None = Field(default=None, max_length=5000)
    is_for_sale: bool | None = None
    price_cents: int | None = Field(default=None, gt=0, le=2_000_000_000)


class ArtworkImageOut(ORMModel):
    id: uuid.UUID
    url: str
    position: int
    is_primary: bool


class ArtworkOut(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    is_for_sale: bool
    # Null when not for sale, except for the owning artist.
    price_cents: int | None
    images: list[ArtworkImageOut]
    gallery: GalleryRef
    artist: UserPublic
    like_count: int
    comment_count: int
    liked_by_me: bool
    saved_by_me: bool
    created_at: datetime
    updated_at: datetime
