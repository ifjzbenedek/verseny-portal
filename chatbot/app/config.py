from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    jwt_secret: str = "change-me-in-prod-this-must-be-at-least-32-bytes-long-secret-key-xx"
    gemini_api_key: str = ""
    monolith_base_url: str = "http://host.docker.internal:8081"
    gemini_model: str = "gemini-2.5-flash"
    cors_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
