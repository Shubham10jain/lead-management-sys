"""Manage attorney accounts. There's no self-service registration or password-reset
flow by design (this is an invite-only internal tool) — this CLI is the only way to
create, list, remove, or change the password of an attorney account.

Usage:
    python -m scripts.manage_attorneys add <email> <password> <full_name>
    python -m scripts.manage_attorneys passwd <email> <new_password>
    python -m scripts.manage_attorneys remove <email>
    python -m scripts.manage_attorneys list
"""

import argparse
import sys

from app.core.security import hash_password
from app.database import SessionLocal
from app.models.user import User, UserRole


def add(email: str, password: str, full_name: str) -> None:
    email = email.strip().lower()
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == email).first():
            print(f"A user with email {email} already exists.", file=sys.stderr)
            sys.exit(1)

        user = User(
            email=email,
            full_name=full_name,
            hashed_password=hash_password(password),
            role=UserRole.ATTORNEY,
        )
        db.add(user)
        db.commit()
        print(f"Created attorney: {email}")
    finally:
        db.close()


def passwd(email: str, new_password: str) -> None:
    email = email.strip().lower()
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            print(f"No user found with email {email}.", file=sys.stderr)
            sys.exit(1)

        user.hashed_password = hash_password(new_password)
        db.commit()
        print(f"Updated password for: {email}")
    finally:
        db.close()


def remove(email: str) -> None:
    email = email.strip().lower()
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            print(f"No user found with email {email}.", file=sys.stderr)
            sys.exit(1)

        db.delete(user)
        db.commit()
        print(f"Removed attorney: {email}")
    finally:
        db.close()


def list_attorneys() -> None:
    db = SessionLocal()
    try:
        users = (
            db.query(User)
            .filter(User.role == UserRole.ATTORNEY)
            .order_by(User.created_at)
            .all()
        )
        if not users:
            print("No attorney accounts yet. Create one with: add <email> <password> <full_name>")
            return
        for user in users:
            print(f"{user.email}  ({user.full_name})  created {user.created_at}")
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Manage attorney accounts")
    subparsers = parser.add_subparsers(dest="command", required=True)

    add_parser = subparsers.add_parser("add", help="Create a new attorney account")
    add_parser.add_argument("email")
    add_parser.add_argument("password")
    add_parser.add_argument("full_name")

    passwd_parser = subparsers.add_parser("passwd", help="Change an attorney's password")
    passwd_parser.add_argument("email")
    passwd_parser.add_argument("new_password")

    remove_parser = subparsers.add_parser("remove", help="Delete an attorney account")
    remove_parser.add_argument("email")

    subparsers.add_parser("list", help="List all attorney accounts")

    args = parser.parse_args()

    if args.command == "add":
        add(args.email, args.password, args.full_name)
    elif args.command == "passwd":
        passwd(args.email, args.new_password)
    elif args.command == "remove":
        remove(args.email)
    elif args.command == "list":
        list_attorneys()


if __name__ == "__main__":
    main()
