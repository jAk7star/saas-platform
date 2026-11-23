"""Database engine and session helpers for the isolated 'ai' schema."""

import os
from collections.abc import Generator

from sqlalchemy import MetaData, create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/saas_db",
)

AI_METADATA = MetaData(schema="ai")


class Base(DeclarativeBase):
    """Base declarative class bound to the 'ai' PostgreSQL schema."""

    metadata = AI_METADATA


engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_tenant_session(tenant_id: str) -> Generator[Session, None, None]:
    """Yield a SQLAlchemy session scoped to the given tenant via PostgreSQL RLS."""
    db = SessionLocal()
    try:
        db.execute(
            text("SELECT set_config('app.current_tenant_id', :tid, true)"),
            {"tid": tenant_id},
        )
        yield db
    finally:
        db.close()
