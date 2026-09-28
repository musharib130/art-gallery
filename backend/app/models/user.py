import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.gallery import Gallery


class UserRole(enum.StrEnum):
    """Stored as the Postgres enum type `user_role`. New roles need a migration."""

    ARTIST = "artist"
    REGULAR = "regular"


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    username: Mapped[str] = mapped_column(String(50), unique=True)
    display_name: Mapped[str] = mapped_column(String(100))
    bio: Mapped[str | None] = mapped_column(Text)
    avatar_url: Mapped[str | None] = mapped_column(String(2048))
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", values_callable=lambda e: [m.value for m in e]),
        default=UserRole.REGULAR,
        server_default=UserRole.REGULAR.value,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(default=True, server_default="true")

    galleries: Mapped[list["Gallery"]] = relationship(back_populates="owner")
