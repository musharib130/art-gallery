from fastapi import APIRouter, HTTPException, status
from sqlalchemy import or_, select

from app.api.deps import CurrentUser, DbSession
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User, UserRole
from app.schemas.user import LoginIn, ProfileUpdate, SignupIn, TokenOut, UserMe

router = APIRouter(prefix="/auth", tags=["auth"])


def token_for(user: User) -> TokenOut:
    return TokenOut(access_token=create_access_token(user.id), user=UserMe.model_validate(user))


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(body: SignupIn, db: DbSession) -> TokenOut:
    """Public signup only ever creates regular users."""
    taken = db.scalar(
        select(User).where(or_(User.email == body.email, User.username == body.username))
    )
    if taken:
        field = "email" if taken.email == body.email else "username"
        raise HTTPException(status.HTTP_409_CONFLICT, f"That {field} is already taken")
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        username=body.username,
        display_name=body.display_name,
        role=UserRole.REGULAR,
    )
    db.add(user)
    db.commit()
    return token_for(user)


@router.post("/login")
def login(body: LoginIn, db: DbSession) -> TokenOut:
    user = db.scalar(select(User).where(User.email == body.email))
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account is disabled")
    return token_for(user)


@router.get("/me")
def me(user: CurrentUser) -> UserMe:
    return UserMe.model_validate(user)


@router.patch("/me")
def update_me(body: ProfileUpdate, user: CurrentUser, db: DbSession) -> UserMe:
    for field, value in body.model_dump(exclude_unset=True).items():
        if field == "display_name" and value is None:
            continue
        setattr(user, field, value)
    db.commit()
    return UserMe.model_validate(user)
