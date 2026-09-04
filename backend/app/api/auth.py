from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import UserCreate, UserOut, Token

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEMO_USER_EMAIL = "demo@marketlens.app"
DEMO_USER_PASSWORD = "demo1234"


def get_or_create_demo_user(db: Session) -> User:
    user = db.query(User).filter(User.email == DEMO_USER_EMAIL).first()
    if not user:
        user = User(
            email=DEMO_USER_EMAIL,
            password_hash=pwd_context.hash(DEMO_USER_PASSWORD),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=payload.email, password_hash=pwd_context.hash(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(payload: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not pwd_context.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return Token(
        access_token=f"demo-token-{user.id}",
        user=UserOut.model_validate(user),
    )


@router.post("/demo", response_model=Token)
def demo_login(db: Session = Depends(get_db)):
    """One-click demo login — creates demo user if not exists."""
    user = get_or_create_demo_user(db)
    return Token(
        access_token=f"demo-token-{user.id}",
        user=UserOut.model_validate(user),
    )


@router.get("/demo-user", response_model=UserOut)
def get_demo_user(db: Session = Depends(get_db)):
    user = get_or_create_demo_user(db)
    return user
