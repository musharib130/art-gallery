import uuid
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    SmallInteger,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, CreatedAtMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.artwork import Artwork

MAX_ARTWORK_IMAGES = 5


class ArtworkImage(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    """Up to 5 per artwork (positions 0-4), exactly one primary.

    "At least one image" is enforced in the API.
    """

    __tablename__ = "artwork_images"
    __table_args__ = (
        UniqueConstraint("artwork_id", "position"),
        CheckConstraint(
            f"position >= 0 AND position < {MAX_ARTWORK_IMAGES}", name="position_range"
        ),
        Index(
            "uq_artwork_images_one_primary",
            "artwork_id",
            unique=True,
            postgresql_where=text("is_primary"),
        ),
    )

    # Indexed via the (artwork_id, position) unique constraint.
    artwork_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("artworks.id", ondelete="CASCADE"))
    url: Mapped[str] = mapped_column(String(2048))
    position: Mapped[int] = mapped_column(SmallInteger)
    is_primary: Mapped[bool] = mapped_column(default=False, server_default="false")

    artwork: Mapped["Artwork"] = relationship(back_populates="images")
