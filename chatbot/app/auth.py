from dataclasses import dataclass

import jwt
from fastapi import Header, HTTPException, status

from .config import settings


@dataclass
class CurrentUser:
    email: str
    role: str
    token: str


def get_current_user(authorization: str = Header(...)) -> CurrentUser:
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing Bearer token")
    token = authorization[7:].strip()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256", "HS384", "HS512"])
    except jwt.PyJWTError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid token: {e}")

    email = payload.get("sub")
    role = payload.get("role")
    if not email or not role:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token missing claims")
    return CurrentUser(email=email, role=role, token=token)
