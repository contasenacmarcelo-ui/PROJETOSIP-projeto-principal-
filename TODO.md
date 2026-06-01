# TODO - Varredura, correções e exclusão no ADM

## Etapa 1 — Varredura e revisão de código
- [x] Revisar `public/js/admia.js` por riscos de XSS/innerHTML com dados do backend.
- [x] Revisar back-end (blueprints/rotas) por falhas e ausência de DELETE para admin.


## Etapa 2 — Ajustes no front-end (admia)
- [ ] Adicionar botões “Apagar” para Clientes na UI gerada pelo `admia.js`.
- [ ] Adicionar botões “Apagar” para Pedidos na UI gerada pelo `admia.js`.
- [ ] Adicionar botões “Apagar” para Mensagens de Suporte na UI gerada pelo `admia.js`.


## Etapa 3 — Rotas back-end e QA
- [x] Implementar rotas DELETE admin em `backend/routes/admin.py`.

- [x] Garantir que `backend/app.py` registra o blueprint admin.

- [ ] Validar status codes e efeitos no banco via smoke test (script/requests).


## Entrega
- [ ] Listar arquivos alterados, correções feitas e trechos de código principais.

