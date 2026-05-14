# TODO_ML_ADMIN_STEP1

## Objetivo
Fazer o botão **Testar Modelo** na `public/pages/admia.html` executar **ML real** via `POST /api/ml/*` com um modal simples de input.

## Metas do Step 1
- [ ] Atualizar `public/js/admia.js`
  - [ ] Substituir `testarModelo(arquivo)` para usar `POST /api/ml/*` baseado no modelo selecionado
  - [ ] Criar modal (usando `modal-mensagem` se preferir) para coletar input mínimo por modelo
  - [ ] Renderizar resposta do backend no `#ml-container`
- [ ] Garantir compatibilidade
  - [ ] `window.testarModelo` continua existindo
  - [ ] Nenhuma alteração em clientes/pedidos/suporte
- [x] Varredura
  - [x] search por `admin/ml/exemplos` e `admin/relatorio/ml` para confirmar que continuam existindo como fallback


