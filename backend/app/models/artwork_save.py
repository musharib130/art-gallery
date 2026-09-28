import uuid

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, CreatedAtMixin


class ArtworkSave(CreatedAtMixin, Base):
    __tablename__ = "artwork_saves"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    artwork_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("artworks.id", ondelete="CASCADE"), primary_key=True, index=True
    )
