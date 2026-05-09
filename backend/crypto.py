from cryptography.fernet import Fernet
import os
import base64


def get_encryption_key():
    key = os.getenv('ENCRYPTION_KEY', 'default-encryption-key-change-in-production-32-chars')
    return base64.urlsafe_b64encode(key.encode()[:32])


def get_cipher():
    return Fernet(get_encryption_key())


def encrypt_value(value: str) -> str:
    return get_cipher().encrypt(value.encode()).decode()


def decrypt_value(token: str) -> str:
    return get_cipher().decrypt(token.encode()).decode()
