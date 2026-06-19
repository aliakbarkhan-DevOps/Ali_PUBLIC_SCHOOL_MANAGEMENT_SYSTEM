import time
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = None
Base = declarative_base()

for i in range(5):
    try:
        db_url = settings.DATABASE_URL.replace("postgres://", "postgresql://", 1) if settings.DATABASE_URL else settings.DATABASE_URL
        engine = create_engine(db_url)
        with engine.connect() as conn:
            print("Connected to database successfully.")
            break
    except Exception as e:
        print(f"Database connection failed. Retry {i+1}/5. Error: {str(e)}")
        time.sleep(2)

if not engine:
    raise RuntimeError("Could not connect to database.")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
