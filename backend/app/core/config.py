from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_JWT_SECRET: str
    SUPABASE_DB_URI: str = ""
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-pro"
    WEATHER_API_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()