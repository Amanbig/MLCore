from typing import Union

import bcrypt


class PasswordHasher:
    """
    Password hashing utility using bcrypt algorithm.
    Provides secure password hashing and verification.
    """

    def __init__(self, rounds: int = 12):
        """
        Initialize password hasher.

        Args:
            rounds: Number of bcrypt rounds (default: 12, range: 4-31)
                   Higher = more secure but slower
        """
        self.rounds = rounds

    def hash_password(self, password: str) -> str:
        """
        Hash a plain text password using bcrypt.

        Args:
            password: Plain text password to hash

        Returns:
            Hashed password as string (bcrypt format)

        Example:
            >>> hasher = PasswordHasher()
            >>> hashed = hasher.hash_password("mySecurePass123")
            >>> print(hashed)
            '$2b$12$...'
        """
        # Convert password to bytes
        password_bytes = password.encode("utf-8")

        # Generate salt and hash password
        salt = bcrypt.gensalt(rounds=self.rounds)
        hashed = bcrypt.hashpw(password_bytes, salt)

        # Return as string
        return hashed.decode("utf-8")

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verify a plain text password against a hashed password.

        Args:
            plain_password: Plain text password to verify
            hashed_password: Bcrypt hashed password from database

        Returns:
            True if password matches, False otherwise

        Example:
            >>> hasher = PasswordHasher()
            >>> hashed = hasher.hash_password("mypass")
            >>> hasher.verify_password("mypass", hashed)
            True
            >>> hasher.verify_password("wrongpass", hashed)
            False
        """
        try:
            password_bytes = plain_password.encode("utf-8")
            hashed_bytes = hashed_password.encode("utf-8")

            # bcrypt.checkpw returns True/False
            return bcrypt.checkpw(password_bytes, hashed_bytes)
        except Exception:
            # If any error occurs (invalid hash format, etc.), return False
            return False


# Global instance with default settings
password_hasher = PasswordHasher()


# Convenience functions for direct import
def hash_password(password: str) -> str:
    """Hash a password using default settings."""
    return password_hasher.hash_password(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return password_hasher.verify_password(plain_password, hashed_password)
