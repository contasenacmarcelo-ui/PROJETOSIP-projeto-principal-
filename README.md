# SIP — Sistema Integrado de Projetos

Plataforma web completa para gestão de serviços de desenvolvimento de software, com painel administrativo, sistema de suporte, chat em tempo real e módulos de Machine Learning para apoio à decisão.

---

## Visão Geral

O SIP é uma aplicação full-stack construída com **Flask** no backend e **HTML/CSS/JS vanilla** no frontend. Ela permite que clientes solicitem orçamentos, acompanhem pedidos e abram chamados de suporte, enquanto administradores gerenciam tudo por meio de um painel dedicado com insights gerados por modelos de ML.

---

## Funcionalidades

- **Autenticação segura** com JWT, senhas em Argon2 e dados pessoais criptografados em repouso
- **Portal do cliente** — pedidos, orçamentos, chamados de suporte e notificações
- **Chat** entre clientes e administradores vinculado a chamados de suporte
- **Painel administrativo** — gestão de usuários, pedidos, suporte e relatórios
- **Módulos de ML** integrados à aplicação:
  - Classificador automático de chamados de suporte
  - Recomendador de serviços
  - Estimador de orçamento
  - Detector de anomalias
  - Clustering de clientes
  - Extrator de tags
- **Dashboard executivo de ML** com processamento em lote para administradores
- **Landing pages** de exemplo para os serviços oferecidos (corporativo, e-commerce, mobile, etc.)

---

## Stack

| Camada         | Tecnologia                                                                 |
|----------------|----------------------------------------------------------------------------|
| Backend        | Python 3.13 · Flask 3 · Flask-SQLAlchemy · Flask-JWT-Extended · Flask-CORS |
| Banco de dados | SQLite (padrão) · compatível com PostgreSQL via `DATABASE_URL`             |
| Segurança      | Argon2 (senhas) · cryptography (dados em repouso)                          |
| Frontend       | HTML · CSS · JavaScript (vanilla)                                          |
| Deploy         | Gunicorn · Procfile (Railway / qualquer PaaS)                              |
| Testes         | pytest · smoke tests de rotas                                              |

---

## Estrutura do Projeto

```
PROJETOSIP/
├── backend/
│   ├── app.py                  # Fábrica da aplicação Flask e registro de blueprints
│   ├── config.py               # Configurações via variáveis de ambiente
│   ├── database.py             # Inicialização do SQLAlchemy
│   ├── auth.py                 # JWT e helpers de autenticação
│   ├── crypto.py               # Funções de criptografia/descriptografia
│   ├── models.py               # Modelos ORM (Usuario, Pedido, Orcamento, etc.)
│   ├── models_chat_admin.py    # Modelos de chat admin
│   ├── utils.py                # Utilitários gerais
│   ├── requirements.txt        # Dependências Python
│   ├── ml_models/              # Módulos de Machine Learning
│   │   ├── classificador_suporte.py
│   │   ├── clustering_clientes.py
│   │   ├── detector_anomalias.py
│   │   ├── estimador_orcamento.py
│   │   ├── extrator_tags.py
│   │   └── recomendador_servicos.py
│   └── routes/                 # Blueprints Flask
│       ├── auth.py
│       ├── usuarios.py
│       ├── pedidos.py
│       ├── orcamentos.py
│       ├── suporte.py
│       ├── contato.py
│       ├── notificacoes.py
│       ├── chat.py
│       ├── chat_admin.py
│       ├── ml.py
│       ├── ml_batch.py
│       ├── ml_dashboard.py
│       └── admin.py
├── public/
│   ├── pages/                  # Páginas HTML (index, login, cliente, admin, etc.)
│   ├── css/                    # Folhas de estilo
│   ├── js/                     # Scripts frontend
│   └── assets/images/          # Imagens e ícones
├── tests/                      # Testes automatizados e smoke tests
├── instance/
│   └── database.db             # Banco SQLite (gerado automaticamente)
├── run.py                      # Ponto de entrada para desenvolvimento
├── create_admin.py             # Script para criar usuário administrador
├── create_seed_data.py         # Script para popular o banco com dados de exemplo
├── Procfile                    # Configuração para deploy (Gunicorn)
├── requirements.txt            # Dependências raiz
├── .env.example                # Exemplo de variáveis de ambiente
└── ROUTES_ANALYSIS.md          # Documentação completa das rotas da API
```

---

## Instalação e Execução Local

### Pré-requisitos

- Python 3.11+
- pip

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd PROJETOSIP
```

### 2. Crie e ative o ambiente virtual

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux / macOS
source .venv/bin/activate
```

### 3. Instale as dependências

```bash
pip install -r requirements.txt
```

### 4. Configure as variáveis de ambiente

Copie o arquivo de exemplo e edite com suas chaves:

```bash
cp .env.example .env
```

| Variável         | Descrição                                          |
|------------------|----------------------------------------------------|
| `SECRET_KEY`     | Chave secreta do Flask                             |
| `JWT_SECRET_KEY` | Chave para assinar tokens JWT                      |
| `ENCRYPTION_KEY` | Chave de 32+ caracteres para criptografia de dados |
| `DATABASE_URL`   | URI do banco (padrão: `sqlite:///database.db`)     |
| `DEBUG`          | `1` para desenvolvimento, `0` para produção        |

> ⚠️ **Nunca** use os valores padrão do `.env.example` em produção.

### 5. Inicialize o banco de dados

```bash
python create_admin.py        # Cria o usuário administrador inicial
python create_seed_data.py    # (Opcional) Popula com dados de exemplo
```

### 6. Inicie o servidor

```bash
python run.py
```

A API estará disponível em `http://localhost:5000`.

---

## Deploy (Railway / PaaS)

O projeto inclui um `Procfile` pronto para uso com Gunicorn:

```
web: gunicorn backend.app:app
```

Defina as variáveis de ambiente na plataforma de deploy e aponte `DATABASE_URL` para um banco persistente (ex.: PostgreSQL).

---

## API — Resumo das Rotas

A documentação completa está em [`ROUTES_ANALYSIS.md`](ROUTES_ANALYSIS.md). Abaixo um resumo:

| Prefixo               | Módulo                                   | Acesso        |
|-----------------------|------------------------------------------|---------------|
| `/api/auth`           | Autenticação (login, cadastro, refresh)  | Público / JWT |
| `/api/usuarios`       | Perfil de usuários                       | JWT           |
| `/api/pedidos`        | Pedidos de serviço                       | JWT           |
| `/api/orcamentos`     | Orçamentos                               | JWT           |
| `/api/chamados`       | Chamados de suporte                      | JWT           |
| `/api/contato`        | Formulário de contato                    | Público / JWT |
| `/api/notificacoes`   | Notificações do usuário                  | JWT           |
| `/chat/`              | Chat de suporte                          | JWT           |
| `/api/ml/`            | Modelos de ML individuais                | JWT           |
| `/api/ml-executivo/`  | Dashboard executivo de ML                | JWT / Admin   |
| `/api/admin/`         | Painel administrativo completo           | JWT + Admin   |

---

## Testes

```bash
# Smoke tests de rotas
python -m pytest tests/

# Ou testes individuais
python tests/smoke_all_routes.py
```

---

## Modelos de Dados Principais

| Modelo            | Tabela              | Descrição                                           |
|-------------------|---------------------|-----------------------------------------------------|
| `Usuario`         | `usuarios`          | Clientes e admins; e-mail e telefone criptografados |
| `Pedido`          | `pedidos`           | Solicitações de serviço com status e valor estimado |
| `Orcamento`       | `orcamentos`        | Orçamentos gerados com parâmetros em JSON           |
| `ChamadoSuporte`  | `chamados_suporte`  | Tickets de suporte classificados pelo ML            |
| `MensagemContato` | `mensagens_contato` | Formulário público de contato                       |
| `Notificacao`     | `notificacoes`      | Notificações in-app por usuário                     |

---

## Segurança

- Senhas armazenadas com **Argon2** (com fallback para Werkzeug para contas legadas)
- E-mail e telefone **criptografados em repouso** com chave simétrica (Fernet/cryptography)
- Autenticação por **JWT** com tokens de acesso (1h) e refresh (24h)
- Rotas administrativas protegidas por `@require_admin`

---

## Contribuição

1. Crie uma branch a partir de `main`: `git checkout -b feature/minha-feature`
2. Faça suas alterações e adicione testes quando aplicável
3. Abra um Pull Request descrevendo as mudanças

---

## Licença

Distribuído para uso interno. Consulte a equipe responsável para mais informações.
