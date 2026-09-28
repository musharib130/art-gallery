import uuid
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.artwork_image import ArtworkImage
    from app.models.gallery import Gallery


class Artwork(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Price is USD cents. It is kept when is_for_sale is false; the API hides it."""

    __tablename__ = "artworks"
    __table_args__ = (
        CheckConstraint(
            "NOT is_for_sale OR price_cents IS NOT NULL", name="for_sale_requires_price"
        ),
        CheckConstraint("price_cents IS NULL OR price_cents > 0", name="price_positive"),
    )

    # RESTRICT: a gallery that still has artworks cannot be deleted.
    gallery_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("galleries.id", ondelete="RESTRICT"), index=True
    )
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    is_for_sale: Mapped[bool] = mapped_column(default=False, server_default="false")
    price_cents: Mapped[int | None] = mapped_column(Integer)

    gallery: Mapped["Gallery"] = relationship(back_populates="artworks")
    images: Mapped[list["ArtworkImage"]] = relationship(
        back_populates="artwork",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ArtworkImage.position",
    )
