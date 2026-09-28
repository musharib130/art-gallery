import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.artwork import Artwork
    from app.models.user import User


class Gallery(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Owned by an artist (enforced in the API, not the DB)."""

    __tablename__ = "galleries"

    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), index=True
    )
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    cover_image_url: Mapped[str] = mapped_column(String(2048))

    owner: Mapped["User"] = relationship(back_populates="galleries")
    artworks: Mapped[list["Artwork"]] = relationship(back_populates="gallery")
