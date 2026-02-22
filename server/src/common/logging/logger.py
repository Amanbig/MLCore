import functools
import logging
import sys
import time
from collections.abc import Callable
from typing import Any

from fastapi import HTTPException
from loguru import logger

# Configure Loguru format for better coloring
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    colorize=True,
)


class InterceptHandler(logging.Handler):
    """
    Intercept standard logging messages toward Loguru sinks.
    """

    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = str(record.levelno)

        depth = 0
        frame = logging.currentframe().f_back
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


def setup_logging():
    """
    Replaces all standard library loggers (like Uvicorn and Alembic) with the InterceptHandler.
    """
    intercept_handler = InterceptHandler()
    logging.root.handlers = [intercept_handler]
    logging.root.setLevel(logging.INFO)

    for name in logging.root.manager.loggerDict.keys():
        target_logger = logging.getLogger(name)
        target_logger.handlers = [intercept_handler]
        target_logger.propagate = False

    # Force Uvicorn and Alembic specific channels just in case they haven't been instantiated yet
    for name in [
        "uvicorn",
        "uvicorn.access",
        "uvicorn.error",
        "alembic",
        "alembic.runtime.migration",
    ]:
        target_logger = logging.getLogger(name)
        target_logger.handlers = [intercept_handler]
        target_logger.propagate = False


def log_execution(func: Callable[..., Any]) -> Callable[..., Any]:
    """
    A decorator that logs execution time, inputs, outputs, and automatically
    catches/logs exceptions, converting generic Python errors into FastAPI 500 HTTPExceptions.
    """

    @functools.wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        logger.opt(colors=True).debug(
            "Executing: <cyan>{func}</cyan> | args={args} kwargs={kwargs}",
            func=func.__name__,
            args=args[1:],
            kwargs=kwargs,
        )
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            logger.opt(colors=True).success(
                "Completed <cyan>{func}</cyan> in <yellow>{time:.4f}s</yellow>",
                func=func.__name__,
                time=execution_time,
            )
            return result
        except HTTPException:
            # Let FastAPI HTTP exceptions pass through normally
            raise
        except Exception as e:
            execution_time = time.time() - start_time
            logger.opt(colors=True).error(
                "Failed <cyan>{func}</cyan> after <yellow>{time:.4f}s</yellow>",
                func=func.__name__,
                time=execution_time,
            )
            logger.exception(e)  # Prints beautiful colored traceback automatically
            raise HTTPException(status_code=500, detail="An internal server error occurred.") from e

    return wrapper
