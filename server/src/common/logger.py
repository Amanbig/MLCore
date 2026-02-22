import functools
import time
from typing import Any, Callable
from loguru import logger

def log_execution(func: Callable[..., Any]) -> Callable[..., Any]:
    """
    A decorator that logs the execution time, inputs, and outputs of a function using Loguru.
    """
    @functools.wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        logger.info(f"Executing '{func.__name__}' with args={args}, kwargs={kwargs}")
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            logger.info(f"Successfully executed '{func.__name__}' in {execution_time:.4f}s. Result: {result}")
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Error executing '{func.__name__}' after {execution_time:.4f}s: {e}")
            raise
    return wrapper
