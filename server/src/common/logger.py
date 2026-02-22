import functools
import sys
import time
from typing import Any, Callable

from fastapi import HTTPException
from loguru import logger

# Configure Loguru format for better coloring
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    colorize=True,
)

def log_execution(func: Callable[..., Any]) -> Callable[..., Any]:
    """
    A decorator that logs execution time, inputs, outputs, and automatically 
    catches/logs exceptions, converting generic Python errors into FastAPI 500 HTTPExceptions.
    """
    @functools.wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        logger.debug(f"Executing: <cyan>{func.__name__}</cyan> | args={args[1:]} kwargs={kwargs}")
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            logger.success(f"Completed <cyan>{func.__name__}</cyan> in <yellow>{execution_time:.4f}s</yellow>")
            return result
        except HTTPException:
            # Let FastAPI HTTP exceptions pass through normally
            raise
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Failed <cyan>{func.__name__}</cyan> after <yellow>{execution_time:.4f}s</yellow>")
            logger.exception(e)  # Prints beautiful colored traceback automatically
            raise HTTPException(status_code=500, detail="An internal server error occurred.")
            
    return wrapper
