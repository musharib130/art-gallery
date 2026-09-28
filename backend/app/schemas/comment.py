import uuid
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, StringConstraints

from app.schemas.common import ORMModel
from app.schemas.user import UserPublic

CommentBody = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)
]


class CommentIn(BaseModel):
    body: CommentBody


class CommentOut(ORMModel):
    id: uuid.UUID
    artwork_id: uuid.UUID
    body: str
    author: UserPublic
    created_at: datetime
    updated_at: datetime
