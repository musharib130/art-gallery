import uuid
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints

from app.schemas.user import UserPublic

Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
ImageUrl = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2048)]


class GalleryCreate(BaseModel):
    title: Title
    description: str = Field(max_length=5000)
    cover_image_url: ImageUrl


class GalleryUpdate(BaseModel):
    title: Title | None = None
    description: str | None = Field(default=None, max_length=5000)
    cover_image_url: ImageUrl | None = None


class GalleryOut(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    cover_image_url: str
    owner: UserPublic
    artwork_count: int
    follower_count: int
    is_followed: bool
    created_at: datetime
    updated_at: datetime


class GalleryRef(BaseModel):
    id: uuid.UUID
    title: str
