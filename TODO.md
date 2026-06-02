# TODO - Ajustes de Endpoints Admin (Sem Quebras)

- [x] Identificar prefixo real do Blueprint `admin_bp` (url_prefix='/api' em `backend/app.py`).
- [x] Corrigir rotas em `backend/routes/admin.py` removendo duplicação de `/admin/...` dentro do blueprint.
- [ ] Adicionar endpoints mock (200 + JSON estável) para:
  - [ ] GET/POST (se aplicável) `/api/admin/ml/exemplos`
  - [ ] GET/POST (se aplicável) `/api/admin/relatorio/ml`
- [ ] Aplicar isolamento defensivo (getattr) nas rotas de listagem:
  - [ ] `get_clientes`
  - [ ] `get_mensagens_suporte`

- [ ] Verificar/garantir import de todos os modelos necessários no topo do arquivo.
- [ ] Revisar o arquivo `backend/routes/admin.py` completo e entregar consolidado.

