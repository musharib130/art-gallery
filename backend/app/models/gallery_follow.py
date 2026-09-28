import uuid

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, CreatedAtMixin


class GalleryFollow(CreatedAtMixin, Base):
    __tablename__ = "gallery_follows"

    follower_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    gallery_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("galleries.id", ondelete="CASCADE"), primary_key=True, index=True
    )
