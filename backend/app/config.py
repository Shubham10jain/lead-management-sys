from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "SJ Attorney's"
    database_url: str = "postgresql://sj_leads_user:changeme@localhost:5433/sj_leads"
    jwt_secret: str = "your-secret-key"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    reset_token_expire_minutes: int = 60
    emailjs_service_id: str = ""
    emailjs_public_key: str = ""
    emailjs_private_key: str = ""
    emailjs_prospect_template_id: str = ""
    emailjs_attorney_template_id: str = ""
    emailjs_reset_password_template_id: str = ""
    frontend_url: str = "http://localhost:3001"
    upload_dir: str = "./uploads"
    max_upload_mb: int = 10
    cors_origins: str = "http://localhost:3001"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> str:
        if isinstance(value, list):
            return ",".join(value)
        return value

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
