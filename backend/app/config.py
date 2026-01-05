from pydantic_settings import BaseSettings
from typing import List
import json

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/poc"
    GPTZERO_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    CORS_ORIGINS: str = '["http://localhost:3000"]'
    
    @property
    def cors_origins_list(self) -> List[str]:
        return json.loads(self.CORS_ORIGINS)
    
    class Config:
        env_file = ".env"

settings = Settings()
