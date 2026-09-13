from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(settings.database_url, echo=False)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# ترقيات خفيفة يدوية (بدون Alembic) لإضافة أعمدة جديدة لجداول SQLite قائمة مسبقًا.
_COLUMN_MIGRATIONS = [
    ("positions", "peak_price", "ALTER TABLE positions ADD COLUMN peak_price FLOAT DEFAULT 0.0"),
    ("strategy_config", "trailing_profit_pct",
     "ALTER TABLE strategy_config ADD COLUMN trailing_profit_pct FLOAT DEFAULT 3.0"),
]


async def _apply_column_migrations(conn) -> None:
    for table, column, ddl in _COLUMN_MIGRATIONS:
        result = await conn.execute(text(f"PRAGMA table_info({table})"))
        existing_columns = {row[1] for row in result.fetchall()}
        if column not in existing_columns:
            await conn.execute(text(ddl))


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await _apply_column_migrations(conn)


async def get_session() -> AsyncSession:
    async with SessionLocal() as session:
        yield session
