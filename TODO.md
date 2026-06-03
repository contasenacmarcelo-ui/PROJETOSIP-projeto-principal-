# TODO - Ajustes Admin/Chat/Seed (Rotas Flask)

- [x] Diagnosticar causa do 404 generalizado no admin: prefixo de rotas duplicado.
- [x] Corrigir `backend/routes/admin.py` removendo prefixos duplicados `/admin/` e alinhando exatamente com os endpoints usados pelo `public/js/admia.js`.
- [x] Garantir alinhamento de rotas para:
  - [x] GET `/api/admin/dashboard`
  - [x] GET `/api/admin/clientes`
  - [x] GET `/api/admin/pedidos`
  - [x] DELETE `/api/admin/pedido/<int:pedido_id>`
- [x] Corrigir erro HTTP 500 em `/chat/conversas` no `backend/routes/chat.py`.
- [x] Implementar fallback seguro em `/chat/conversas` retornando `{"conversas": []}` com status 200 em caso de falha/DB vazio.
- [x] Implementar seed automático via `GET /api/admin/seed` no `backend/routes/admin.py`.


