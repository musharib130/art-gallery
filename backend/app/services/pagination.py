from collections.abc import Callable, Sequence
from typing import Any, TypeVar

from sqlalchemy import Select
from sqlalchemy.orm import Session

from app.schemas.common import Page

T = TypeVar("T")


def paginate(
    db: Session, stmt: Select, limit: int, offset: int, serialize: Callable[[Any], T]
) -> Page[T]:
    """Fetch one extra row to know whether another page exists."""
    rows: Sequence[Any] = db.execute(stmt.limit(limit + 1).offset(offset)).unique().all()
    return Page[T](
        items=[serialize(row) for row in rows[:limit]],
        limit=limit,
        offset=offset,
        has_more=len(rows) > limit,
    )
