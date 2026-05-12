# TODO - ML modal com dados do banco + seed (5 exemplos por modelo)

## Plano aprovado / A confirmar
- [ ] Criar tabela/modelo para persistir exemplos e outputs de ML (5 por modelo)
- [ ] Implementar seed idempotente (cria 5 exemplos por tipo de ML usando as funções em backend/ml_models)
- [ ] Criar endpoint GET para retornar exemplos persistidos (e executar seed se vazio)
- [ ] Atualizar public/js/admia.js para que “Testar Modelo”/modal ML carregue exemplos do banco e renderize no modal
- [ ] Criar testes automatizados (via pytest ou script existente test_verificacoes.py) garantindo:
  - [ ] seed cria 5 exemplos por modelo
  - [ ] endpoint GET retorna estrutura esperada
  - [ ] dados persistem e são usados no modal
- [ ] Rodar testes e/ou script de verificação e confirmar que não quebra endpoints existentes

