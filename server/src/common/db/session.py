from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine("sqllite:///mlcore_db")

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()