"""Admin commands. Artists cannot sign up, so they are created here.

uv run python -m app.cli create-artist --email a@b.com --username jane --display-name "Jane"
"""

import argparse
import getpass
import sys

from sqlalchemy import or_, select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import User, UserRole
from app.schemas.user import SignupIn


def create_artist(args: argparse.Namespace) -> int:
    password = args.password or getpass.getpass("Password (min 8 chars): ")
    data = SignupIn(
        email=args.email,
        password=password,
        username=args.username,
        display_name=args.display_name,
    )
    with SessionLocal() as db:
        taken = db.scalar(
            select(User).where(or_(User.email == data.email, User.username == data.username))
        )
        if taken:
            print("A user with that email or username already exists.", file=sys.stderr)
            return 1
        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            username=data.username,
            display_name=data.display_name,
            role=UserRole.ARTIST,
        )
        db.add(user)
        db.commit()
        print(f"Created artist {user.username} ({user.id})")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(prog="app.cli")
    commands = parser.add_subparsers(dest="command", required=True)

    artist = commands.add_parser("create-artist", help="Create an artist account")
    artist.add_argument("--email", required=True)
    artist.add_argument("--username", required=True)
    artist.add_argument("--display-name", required=True)
    artist.add_argument("--password", help="Prompted for if omitted")
    artist.set_defaults(func=create_artist)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
