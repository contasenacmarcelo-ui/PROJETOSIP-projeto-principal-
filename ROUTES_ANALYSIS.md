# Análise de Rotas (Flask) — SIP

Baseado nos decorators `@<blueprint>.route(...)` e nos `register_blueprint` em `backend/app.py`.

> **Prefixos importantes (de `backend/app.py`)**
- `auth_bp` → **/api/auth**
- `usuarios_bp`, `pedidos_bp`, `orcamentos_bp`, `suporte_bp`, `contato_bp`, `notificacoes_bp`, `ml_batch_bp` → **/api**
- `ml_bp` (ML) → **/api/ml**
- `admin_bp` → **/api/admin**
- `ml_dashboard_bp` → blueprint define **/api/ml-executivo** internamente
- `chat_bp` → blueprint define paths com **/chat/...** (sem prefix no register)

---

## 1) Rotas de Health / Static
- **GET /** → retorna `{"message":"SIP Backend API","status":"running"}`
- **GET /public/<path:filename>** → serve arquivos do diretório `public/`

---

## 2) Auth (`backend/routes/auth.py`) — prefix `/api/auth`
| Método | Rota final | Proteção |
|---|---|---|
| GET | **/api/auth/me** | JWT (`@jwt_required`) |
| POST | **/api/auth/cadastro** | pública |
| POST | **/api/auth/login** | pública |
| POST | **/api/auth/logout** | JWT (`@jwt_required`) |
| POST | **/api/auth/refresh** | JWT refresh (`@jwt_required(refresh=True)`) |

---

## 3) Usuários (`backend/routes/usuarios.py`) — prefix `/api`
| Método | Rota final | Proteção |
|---|---|---|
| GET | **/api/usuarios** | JWT + admin (`@jwt_required` + `@require_admin`) |
| GET | **/api/usuarios/<int:user_id>** | JWT (usuário só vê seu perfil) |
| PUT | **/api/usuarios/<int:user_id>** | JWT (usuário só atualiza seu perfil) |
| GET | **/api/usuarios/<int:user_id>/cluster** | JWT (usuário só acessa seu cluster) |

---

## 4) Pedidos (`backend/routes/pedidos.py`) — prefix `/api`
| Método | Rota final | Proteção |
|---|---|---|
| GET | **/api/pedidos** | JWT |
| POST | **/api/pedidos** | JWT |
| GET | **/api/pedidos/<int:pedido_id>** | JWT |
| PUT | **/api/pedidos/<int:pedido_id>** | JWT |
| DELETE | **/api/pedidos/<int:pedido_id>** | JWT |

---

## 5) Orçamentos (`backend/routes/orcamentos.py`) — prefix `/api`
| Método | Rota final | Proteção |
|---|---|---|
| GET | **/api/orcamentos** | JWT |
| POST | **/api/orcamentos** | JWT |
| GET | **/api/orcamentos/<int:orcamento_id>** | JWT |
| POST | **/api/orcamentos/<int:orcamento_id>/aprovar** | JWT |

---

## 6) Suporte (`backend/routes/suporte.py`) — prefix `/api`
| Método | Rota final | Proteção |
|---|---|---|
| GET | **/api/chamados** | JWT (cliente: filtra por `usuario_id` do JWT) |
| POST | **/api/chamados** | JWT |
| POST | **/api/suporte** | JWT (alias de `create_chamado`) |
| PUT | **/api/chamados/<int:chamado_id>** | JWT (cliente: dono) |
| PUT | **/api/chamados/<int:chamado_id>/classificar** | JWT (cliente: dono; admin: qualquer) |

---

## 7) Contato (`backend/routes/contato.py`) — prefix `/api`
| Método | Rota final | Proteção |
|---|---|---|
| POST | **/api/contato** | pública |
| GET | **/api/contato** | JWT + admin (`@require_admin`) |
| PUT | **/api/contato/<int:id>** | JWT |

---

## 8) Notificações (`backend/routes/notificacoes.py`) — prefix `/api`
| Método | Rota final | Proteção |
|---|---|---|
| GET | **/api/notificacoes** | JWT |
| PUT | **/api/notificacoes/<int:id>/lido** | JWT |
| DELETE | **/api/notificacoes/<int:id>** | JWT |

---

## 9) ML (API) (`backend/routes/ml.py`) — prefix `/api/ml`
| Método | Rota final | Proteção |
|---|---|---|
| POST | **/api/ml/classificador-suporte** | JWT |
| POST | **/api/ml/recomendador-servicos** | JWT |
| POST | **/api/ml/estimador-orcamento** | JWT |
| POST | **/api/ml/detector-anomalias** | JWT |
| POST | **/api/ml/clustering-cliente** | JWT |
| POST | **/api/ml/extrator-tags** | JWT |
| GET | **/api/ml/status** | pública |

---

## 10) ML Dashboard (Executivo) (`backend/routes/ml_dashboard.py`) — blueprint define `url_prefix="/api/ml-executivo"`
| Método | Rota final | Proteção |
|---|---|---|
| GET | **/api/ml-executivo/status** | pública |
| GET | **/api/ml-executivo/dados** | JWT |
| POST | **/api/ml-executivo/processar** | JWT + admin (`@require_admin`) |

---

## 11) ML Batch (`backend/routes/ml_batch.py`) — prefix `/api` (register)
| Método | Rota final | Proteção |
|---|---|---|
| POST | **/api/admin/ml/sync** | JWT + admin |
| GET | **/api/admin/ml/preview** | JWT + admin |

---

## 12) Chat (`backend/routes/chat.py`) — sem prefix externo; paths começam com `/chat/...`
| Método | Rota final | Proteção |
|---|---|---|
| GET | **/chat/conversas** | JWT |
| GET | **/chat/<int:chamado_id>/mensagens** | JWT |
| POST | **/chat/<int:chamado_id>/mensagens** | JWT |

---

## 13) Admin (`backend/routes/admin.py`) — prefix `/api/admin`
### Dashboard & Usuário/Cliente
| Método | Rota final | Proteção |
|---|---|---|
| GET | **/api/admin/dashboard** | JWT + admin |
| GET | **/api/admin/admin/dashboard** | JWT + admin *(rota redundante/duplicada)* |
| GET/POST | **/api/admin/clientes** | JWT + admin |
| GET | **/api/admin/clientes/<int:usuario_id>** | JWT + admin |
| DELETE | **/api/admin/clientes/<int:usuario_id>** | JWT + admin |

### Pedidos (admin)
| Método | Rota final | Proteção |
|---|---|---|
| GET | **/api/admin/pedidos** | JWT + admin |
| GET/DELETE | **/api/admin/pedido/<int:pedido_id>** | JWT + admin *(mesma rota, muda método)* |
| PUT | **/api/admin/pedido/<int:pedido_id>/status** | JWT + admin |
| DELETE | **/api/admin/pedidos/<int:pedido_id>** | JWT + admin |

### Suporte (admin)
| Método | Rota final | Proteção |
|---|---|---|
| DELETE | **/api/admin/suporte/<int:mensagem_id>** | JWT + admin |
| GET | **/api/admin/suporte/mensagens** | JWT + admin |
| POST | **/api/admin/suporte/<int:chamado_id>/responder** | JWT + admin |

### Seed & utilidades
| Método | Rota final | Proteção |
|---|---|---|
| GET | **/api/admin/seed** | pública *(no arquivo, sem jwt_required)* |
| GET/POST | **/api/admin/fix-status** | pública *(no arquivo, sem jwt_required)* |

### ML admin
| Método | Rota final | Proteção |
|---|---|---|
| GET | **/api/admin/ml/exemplos** | JWT + admin |
| GET | **/api/admin/relatorio/ml** | JWT + admin |

---

# Observações rápidas (potenciais pontos de atenção)
1. **`/api/admin/dashboard` vs `/api/admin/admin/dashboard`**: há duas rotas mapeadas para o mesmo handler.
2. **ML Dashboard**: no `app.register_blueprint(ml_dashboard_bp)` não há `url_prefix`, então o prefix real vem do `Blueprint(..., url_prefix="/api/ml-executivo")`.
3. **Chat**: `chat_bp` é registrado sem `url_prefix` no app; as rotas reais começam em `/chat/...` definidos no arquivo.
4. **Rotas do Admin com Seed/Fix**: `/api/admin/seed` e `/api/admin/fix-status` não exigem JWT (conforme arquivo `admin.py`).

---

# Próximo passo recomendado (automatização)
- Rodar `pytest` para confirmar que as rotas esperadas (principalmente as usadas nos smoke tests) batem com as URLs finais acima.

