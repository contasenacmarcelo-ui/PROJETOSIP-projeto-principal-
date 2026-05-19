# TODO (ML usando dados do banco + seed para testes)

- [ ] 1) Criar script de seed `create_seed_data.py` para popular `backend/database.db` com dados fictícios (idempotente).
- [ ] 2) Ajustar `backend/routes/ml.py` para passar `user_id`/contexto para os modelos quando possível (JWT identity).
- [ ] 3) Ajustar modelos ML para priorizar dados do banco (pedidos/orçamentos/chamados) e só depois usar request.
- [ ] 4) Ajustar modelos para não quebrar quando tabelas estiverem vazias (fallback seguro).
- [ ] 5) Rodar smoke test: inicializar DB, executar seed, subir servidor e chamar endpoints.


