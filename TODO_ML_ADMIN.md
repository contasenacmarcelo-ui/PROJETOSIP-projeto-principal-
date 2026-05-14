# TODO - ML admin (admia.html) - Testar modelos com input

## Objetivo
Fazer o admin conseguir clicar em **Testar Modelo** na página **public/pages/admia.html** e o front chamar os endpoints reais de ML (`POST /api/ml/*`), exibindo resultado sem quebrar clientes/pedidos/suporte.

## Passos
- [ ] Atualizar `public/js/admia.js`
  - [ ] Alterar `testarModelo(arquivo)` para:
    - [ ] abrir modal com input por tipo de modelo
    - [ ] coletar valores (ex: `descricao`, `tipo_servico`, `parametros JSON`, `historico JSON` etc.)
    - [ ] chamar endpoint real `POST ${API_BASE}/ml/<rota>` apropriado
    - [ ] renderizar resultado em `#ml-container` (ou modal existente de mensagem)
- [ ] Atualizar `public/pages/admia.html` (se necessário)
  - [ ] Incluir um modal simples para input de ML (padrão).
- [ ] (Somente se necessário) atualizar `public/css/admia.css` para estilo do modal.
- [ ] Varredura de impacto (após implementar)
  - [ ] Rodar search por `testarModelo`/`exibirRelatorioML`/`ml-container` para garantir que não há chamadas antigas quebradas
  - [ ] Validar que `initializeAdmin()` continua chamando `carregarClientes`, `carregarPedidos`, `carregarMensagensSuporte` sem exceções
  - [ ] Validar que `window.testarModelo` continua no escopo global para o onclick

