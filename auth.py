"""
Authentication Module
Handles user registration, login, password hashing, JWT tokens
"""

from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import jwt
import os
import logging
from dotenv import load_dotenv
from database import User, SessionLocal, AuditLog

load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY environment variable is required for security. "
        "Please set it in your .env file or environment."
    )
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# ============================================================
# PASSWORD UTILITIES
# ============================================================

def hash_password(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

# ============================================================
# JWT TOKEN UTILITIES
# ============================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    """Decode a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token attempt: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error decoding token: {str(e)}", exc_info=True)
        return None

# ============================================================
# USER MANAGEMENT
# ============================================================

def create_user(email: str, username: str, full_name: str, password: str) -> Optional[User]:
    """Create a new user"""
    db = SessionLocal()
    try:
        # Check if user exists
        if db.query(User).filter((User.email == email) | (User.username == username)).first():
            logger.info(f"User registration attempt with existing email/username: {email}, {username}")
            return None
        
        # Create user
        hashed_password = hash_password(password)
        user = User(
            email=email,
            username=username,
            full_name=full_name,
            password_hash=hashed_password
        )
        db.add(user)
        db.commit()
        
        # Log audit
        audit = AuditLog(
            user_id=user.id,
            action="USER_REGISTERED",
            details=f"User {username} registered"
        )
        db.add(audit)
        db.commit()
        logger.info(f"User registered successfully: {username} ({email})")
        return user
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating user {username}: {str(e)}", exc_info=True)
        return None
    finally:
        db.close()

def authenticate_user(username_or_email: str, password: str) -> Optional[User]:
    """Authenticate a user and return user if valid"""
    db = SessionLocal()
    try:
        user = db.query(User).filter(
            (User.username == username_or_email) | (User.email == username_or_email)
        ).first()
        
        if not user:
            logger.info(f"Login attempt for non-existent user: {username_or_email}")
            return None
        
        if not verify_password(password, user.password_hash):
            logger.warning(f"Failed login attempt for user: {user.username}")
            return None
        
        # Log audit
        audit = AuditLog(
            user_id=user.id,
            action="LOGIN",
            details=f"User {user.username} logged in"
        )
        db.add(audit)
        db.commit()
        logger.info(f"User logged in successfully: {user.username}")
        return user
    except Exception as e:
        logger.error(f"Error authenticating user {username_or_email}: {str(e)}", exc_info=True)
        return None
    finally:
        db.close()

def get_user_by_id(user_id: int) -> Optional[User]:
    """Get user by ID"""
    db = SessionLocal()
    try:
        return db.query(User).filter(User.id == user_id).first()
    finally:
        db.close()
