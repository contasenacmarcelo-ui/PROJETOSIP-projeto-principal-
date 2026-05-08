# 🚀 SIP - Sistema Integrado de Portfolio
## Backend Flask + SQLite + Machine Learning

---

## 📋 Índice
1. [Instalação](#instalação)
2. [Configuração](#configuração)
3. [Rodar o servidor](#rodar-o-servidor)
4. [Testes](#testes)
5. [Endpoints da API](#endpoints-da-api)
6. [Modelos de ML](#modelos-de-ml)

---

## 💾 Instalação

### 1. Criar ambiente virtual
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

### 2. Instalar dependências
```bash
pip install -r backend/requirements.txt
```

### 3. Baixar modelo NLP (opcional)
```bash
python -m spacy download pt_core_news_sm
```

---

## ⚙️ Configuração

### 1. Criar arquivo .env
```bash
cp .env.example .env
```

### 2. Editar .env (se necessário)
```
FLASK_ENV=development
SECRET_KEY=sua_chave_secreta
JWT_SECRET_KEY=sua_chave_jwt
DATABASE_URL=sqlite:///database.db
```

### 3. Inicializar banco de dados
```bash
python
>>> from backend.database import create_app
>>> app = create_app()
>>> from backend.models import db
>>> db.create_all(app=app)
>>> exit()
```

Ou use o comando CLI:
```bash
flask db-init
```

---

## 🚀 Rodar o servidor

### Opção 1: Usando run.py
```bash
python run.py
```

### Opção 2: Usando Flask CLI
```bash
flask run
```

### Opção 3: Em produção (Gunicorn)
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 backend.app:app
```

✅ Servidor rodará em: **http://localhost:5000**

---

## 🧪 Testes

### Testar tudo automaticamente
```bash
pip install requests colorama
python test_verificacoes.py
```

Isso vai testar:
- ✅ Conexão ao servidor
- ✅ Autenticação (cadastro/login)
- ✅ CRUD de pedidos, orçamentos, suporte
- ✅ Modelos de ML
- ✅ Integridade do banco de dados

---

## 📡 Endpoints da API

### 🔐 Autenticação (`/api/auth/`)
```
POST   /api/auth/cadastro          - Criar novo usuário
POST   /api/auth/login              - Fazer login
GET    /api/auth/me                 - Obter dados do usuário
POST   /api/auth/logout             - Logout
```

### 👤 Usuários (`/api/usuarios/`)
```
GET    /api/usuarios/<id>           - Obter dados do usuário
PUT    /api/usuarios/<id>           - Atualizar usuário
GET    /api/usuarios/<id>/cluster   - Obter cluster ML
```

### 📋 Pedidos (`/api/pedidos/`)
```
GET    /api/pedidos                 - Listar pedidos
POST   /api/pedidos                 - Criar pedido
GET    /api/pedidos/<id>            - Obter pedido
PUT    /api/pedidos/<id>            - Atualizar pedido
DELETE /api/pedidos/<id>            - Deletar pedido
```

### 💰 Orçamentos (`/api/orcamentos/`)
```
GET    /api/orcamentos              - Listar orçamentos
POST   /api/orcamentos              - Criar orçamento
GET    /api/orcamentos/<id>         - Obter orçamento
POST   /api/orcamentos/<id>/aprovar - Aprovar e criar pedido
```

### 🎫 Suporte (`/api/suporte/`)
```
GET    /api/suporte                 - Listar chamados
POST   /api/suporte                 - Criar chamado
GET    /api/suporte/<id>            - Obter chamado
PUT    /api/suporte/<id>            - Atualizar chamado
```

### 📧 Contato (`/api/contato/`)
```
POST   /api/contato                 - Enviar mensagem
```

### 🔔 Notificações (`/api/notificacoes/`)
```
GET    /api/notificacoes            - Listar notificações
PUT    /api/notificacoes/<id>/lido  - Marcar como lida
DELETE /api/notificacoes/<id>       - Deletar notificação
```

### 🤖 Machine Learning (`/api/ml/`)
```
POST   /api/ml/classificador-suporte    - Classificar chamado
POST   /api/ml/recomendador-servicos    - Recomendar serviços
POST   /api/ml/estimador-orcamento      - Estimar valor
POST   /api/ml/detector-anomalias       - Detectar anomalias
POST   /api/ml/clustering-cliente       - Agrupar cliente
POST   /api/ml/extrator-tags            - Extrair tags
GET    /api/ml/status                   - Status dos modelos
```

---

## 🤖 Modelos de ML

### 1️⃣ Classificador de Suporte
**O quê:** Classifica chamados em categorias (bug, dúvida, manutenção, etc)
**Treino:** 20+ exemplos por categoria
**Saída:** categoria, prioridade, confiança

### 2️⃣ Recomendador de Serviços
**O quê:** Recomenda melhor serviço para cliente
**Entrada:** tipo_cliente, budget, necessidades
**Saída:** Top 3 serviços com scores

### 3️⃣ Estimador de Orçamento
**O quê:** Estima valor de projeto
**Entrada:** tipo_servico, parâmetros
**Saída:** valor_estimado, intervalo_confiança

### 4️⃣ Detector de Anomalias
**O quê:** Detecta pedidos/orçamentos suspeitos
**Entrada:** parâmetros do pedido
**Saída:** eh_anomalia, score_risco

### 5️⃣ Clustering de Clientes
**O quê:** Agrupa clientes em tipos (startup, PME, enterprise)
**Entrada:** histórico do cliente
**Saída:** cluster, tipo_cliente, score_valor

### 6️⃣ Extrator de Tags
**O quê:** Extrai tags e tecnologias de descrição
**Entrada:** descrição de projeto
**Saída:** tags, tecnologias_sugeridas

---

## 📁 Estrutura do Projeto

```
PROJETOSIP-PROJETO-PRINCIPAL/
├── backend/
│   ├── app.py                 # App Flask principal
│   ├── config.py              # Configurações
│   ├── database.py            # SQLAlchemy
│   ├── models.py              # 8 modelos/tabelas
│   ├── requirements.txt        # Dependências
│   ├── routes/
│   │   ├── auth.py            # Autenticação
│   │   ├── usuarios.py        # Usuários
│   │   ├── pedidos.py         # Pedidos
│   │   ├── orcamentos.py      # Orçamentos
│   │   ├── suporte.py         # Suporte
│   │   ├── contato.py         # Contato
│   │   ├── notificacoes.py    # Notificações
│   │   └── ml.py              # Machine Learning
│   └── ml_models/ (criado)
│       ├── classificador_suporte.py
│       ├── recomendador_servicos.py
│       ├── estimador_orcamento.py
│       ├── detector_anomalias.py
│       ├── clustering_clientes.py
│       └── extrator_tags.py
├── public/                    # Front-end (HTML/CSS/JS)
├── .env                       # Variáveis de ambiente
├── run.py                     # Script para rodar servidor
├── test_verificacoes.py       # Script de testes
└── README.md                  # Este arquivo
```

---

## 🔗 Integração com Front-end

### Exemplo de chamada em JavaScript

```javascript
// Cadastro
const cadastro = async (email, nome, senha) => {
  const resp = await fetch('http://localhost:5000/api/auth/cadastro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, nome, senha })
  });
  const data = await resp.json();
  localStorage.setItem('token', data.token);
  return data;
};

// Criar pedido (autenticado)
const criarPedido = async (tipo_servico, descricao) => {
  const token = localStorage.getItem('token');
  const resp = await fetch('http://localhost:5000/api/pedidos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ tipo_servico, descricao })
  });
  return await resp.json();
};
```

---

## 🐛 Troubleshooting

### Erro: "ModuleNotFoundError: No module named 'flask'"
```bash
pip install -r backend/requirements.txt
```

### Erro: "Database is locked"
Feche outras conexões ao banco de dados

### Erro: "Port 5000 is already in use"
```bash
python run.py --port 5001
```

### Erro na autenticação JWT
Verifique se `.env` tem `JWT_SECRET_KEY` definida

---

## 📚 Documentação Adicional

- [Flask Docs](https://flask.palletsprojects.com/)
- [SQLAlchemy Docs](https://docs.sqlalchemy.org/)
- [JWT Docs](https://flask-jwt-extended.readthedocs.io/)
- [scikit-learn Docs](https://scikit-learn.org/)

---

## 📞 Suporte

Se tiver problemas:
1. Verifique a saída do terminal do servidor
2. Rode o script de testes: `python test_verificacoes.py`
3. Verifique arquivo `.env`
4. Verifique se banco de dados está criado

---

## ✅ Checklist de Implementação

- [x] Estrutura Flask completa
- [x] SQLAlchemy e SQLite
- [x] Autenticação JWT
- [x] 8 modelos de banco de dados
- [x] 7 rotas (30+ endpoints)
- [x] 6 modelos de ML (treinados)
- [x] CORS configurado
- [x] Script de testes
- [ ] Modelos de ML treinados com dados reais
- [ ] Integração completa com front-end
- [ ] Deploy em produção

---

**Versão:** 1.0  
**Último update:** 2024  
**Status:** ✅ Pronto para desenvolvimento