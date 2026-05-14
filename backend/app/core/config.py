# pydantic_settings: .env dosyasındaki değerleri okuyup Python objesine çeviren kütüphanedir. Bu sayede uygulama içinde konfigürasyon değerlerine kolayca erişebiliriz.
from pydantic_setttings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"  #JWT şifreleme algoritması
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env" 

settings = Settings()