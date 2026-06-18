#!/usr/bin/env python3
"""clear_db_only.py

Limpa o banco SQLite apagando todas as tabelas e recriando a estrutura,
MAS NÃO executa seeds de usuários/admin.

Uso:
  python clear_db_only.py

Observação importante:
- Isso só vai permanecer entre redeploys se o arquivo database.db for persistido
  (ex.: Volume no Render). Caso contrário, o banco será recriado no próximo build.
"""

from backend.database import create_app
from backend.models import db


def main():
    app = create_app()
    with app.app_context():
        print("⚠️  Dropando todas as tabelas...")
        db.drop_all()
        print("✅ Tabelas removidas.")
        print("🛠️  Criando tabelas (estrutura)...")
        db.create_all()
        print("✅ Estrutura recriada. Nenhum seed foi executado.")


if __name__ == "__main__":
    main()
