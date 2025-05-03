from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings

# Password Hashing Context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = settings.ALGORITHM

# Initialize Fernet for encryption/decryption
try:
    fernet = Fernet(settings.SETTINGS_ENCRYPTION_KEY.encode())
except ValueError as e:
    raise ValueError(f"Invalid SETTINGS_ENCRYPTION_KEY: {e}. Ensure it is a valid Fernet key.") from e

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# JWT Token Handling
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None 

# --- Encryption/Decryption Functions ---

def encrypt_data(data: str) -> str:
    """Encrypts a string using the configured Fernet key."""
    if not data:
        return ""
    return fernet.encrypt(data.encode()).decode()

def decrypt_data(encrypted_data: str) -> Optional[str]:
    """Decrypts a string using the configured Fernet key."""
    if not encrypted_data:
        return None
    try:
        return fernet.decrypt(encrypted_data.encode()).decode()
    except InvalidToken:
        # Handle cases where the data is corrupted or not encrypted with the current key
        print("Error: Failed to decrypt data. Token might be invalid or corrupted.")
        return None # Or raise an exception, depending on desired behavior
    except Exception as e:
        print(f"An unexpected error occurred during decryption: {e}")
        return None 