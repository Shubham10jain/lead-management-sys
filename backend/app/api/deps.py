from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, InvalidTokenError, NotAuthenticatedError
from app.core.security import decode_access_token
from app.database import get_db
from app.models.user import User, UserRole

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise NotAuthenticatedError()

    email = decode_access_token(credentials.credentials)
    if email is None:
        raise InvalidTokenError()

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise InvalidTokenError()

    return user


def require_attorney(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ATTORNEY:
        raise ForbiddenError()
    return current_user


def require_lead(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.LEAD:
        raise ForbiddenError()
    return current_user
