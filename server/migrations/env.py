# Import all models dynamically so metadata is populated
import importlib
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import create_engine, pool

# Import your app settings and Base
from src.common.config import settings
from src.common.db.base import Base

modules_path = Path(__file__).parent.parent / "src" / "modules"
if modules_path.exists():
    for module_dir in modules_path.iterdir():
        if module_dir.is_dir():
            store_dir = module_dir / "store"
            if store_dir.exists():
                for file in store_dir.glob("model*.py"):
                    if file.is_file() and not file.name.startswith("__"):
                        module_name = f"src.modules.{module_dir.name}.store.{file.stem}"
                        try:
                            importlib.import_module(module_name)
                        except Exception as e:
                            print(f"Failed to load model {module_name}: {e}")

# Alembic Config object
config = context.config

# Setup logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata for autogenerate
target_metadata = Base.metadata

# Get DB URL from settings
DATABASE_URL = settings.DATABASE_URL


# -----------------------------
# OFFLINE MIGRATIONS
# -----------------------------
def run_migrations_offline() -> None:
    """Run migrations without DB connection."""
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


# -----------------------------
# ONLINE MIGRATIONS
# -----------------------------
def run_migrations_online() -> None:
    """Run migrations with DB connection."""
    connectable = create_engine(
        DATABASE_URL,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,  # detects column type changes
        )

        with context.begin_transaction():
            context.run_migrations()


# -----------------------------
# ENTRYPOINT
# -----------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
