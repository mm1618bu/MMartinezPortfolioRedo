"""Environment configuration for Python API"""

import os
from enum import Enum
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(str, Enum):
    """Environment types"""

    DEVELOPMENT = "development"
    PRODUCTION = "production"
    TEST = "test"


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Environment
    python_env: Environment = Environment.DEVELOPMENT

    # Server configuration
    python_host: str = "0.0.0.0"
    python_port: int = 8000

    # CORS configuration
    python_cors_origins: str = "http://localhost:5173,http://localhost:3000,http://localhost:3001"

    # Logging
    log_level: str = "INFO"

    # Database (example - uncomment when needed)
    # database_url: str = ""

    # API Keys (example - uncomment when needed)
    # api_key: str = ""

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins into a list"""
        return [origin.strip() for origin in self.python_cors_origins.split(",")]

    @property
    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.python_env == Environment.DEVELOPMENT

    @property
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.python_env == Environment.PRODUCTION

    @property
    def is_test(self) -> bool:
        """Check if running in test mode"""
        return self.python_env == Environment.TEST


# Create global settings instance
settings = Settings()
