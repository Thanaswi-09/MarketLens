from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/marketlens"
    MARKET_API_KEY: str = ""
    MARKET_API_PROVIDER: str = "alpha_vantage"
    SECRET_KEY: str = "dev-secret-key"
    DATA_FRESH_MINUTES: int = 5
    DATA_DELAYED_MINUTES: int = 15
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
