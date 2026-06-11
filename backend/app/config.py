from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Map Diary API"
    debug: bool = True

    model_config = {"env_prefix": "MAP_DIARY_"}


settings = Settings()
