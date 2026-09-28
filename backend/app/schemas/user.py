import uuid
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints

from app.models import UserRole
from app.schemas.common import ORMModel

Username = Annotated[str, StringConstraints(strip_whitespace=True, pattern=r"^[a-zA-Z0-9_]{3,30}$")]
Email = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True, to_lower=True, max_length=320, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    ),
]
DisplayName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class UserPublic(ORMModel):
    id: uuid.UUID
    username: str
    display_name: str
    bio: str | None
    avatar_url: str | None
    role: UserRole
    created_at: datetime


class UserMe(UserPublic):
    email: str


class ArtistProfile(UserPublic):
    follower_count: int
    gallery_count: int
    is_followed: bool


class SignupIn(BaseModel):
    email: Email
    password: str = Field(min_length=8, max_length=128)
    username: Username
    display_name: DisplayName


class LoginIn(BaseModel):
    email: Email
    password: str


class ProfileUpdate(BaseModel):
    display_name: DisplayName | None = None
    bio: str | None = Field(default=None, max_length=2000)
    avatar_url: str | None = Field(default=None, max_length=2048)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserMe
