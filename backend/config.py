import os
from dotenv import load_dotenv

load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))
project_root = os.path.abspath(os.path.join(basedir, '..'))

def default_db_path():
    return os.path.join(project_root, 'database.db')

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', f"sqlite:///{default_db_path()}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY', 'default-encryption-key-change-in-production-32-chars')
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hora
    JWT_REFRESH_TOKEN_EXPIRES = 86400  # 24 horas