"""
Central config. Loads from environment variables / .env file.
Never commit real API keys — use .env locally (gitignored).
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "LoneWolf FinTech - AI Wealth Advisor"

    # LLM provider config (fill in .env, not here)
    anthropic_api_key: str = ""
    llm_model: str = "claude-sonnet-4-6"

    # Database (if/when needed for storing anonymized profiles)
    database_url: str = "sqlite:///./lonewolf.db"

    class Config:
        env_file = ".env"


settings = Settings()
