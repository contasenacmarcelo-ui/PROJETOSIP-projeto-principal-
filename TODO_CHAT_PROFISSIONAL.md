# TODO - Chat Profissional (Admin + Usuário)

## 1) Análise e modelagem (feito / já coletado)
- [x] Identificar que não existe tabela/modelo real de chat.
- [x] Confirmar que o “suporte” hoje é apenas ticket (ChamadoSuporte) sem histórico de mensagens.
- [x] Confirmar que o front/admin não tem sidebar e fluxo de mensagens.

## 2) Banco de dados
- [ ] Criar modelo `MensagemSuporte` para armazenar mensagens (autor: usuário ou admin).
- [ ] Adaptar seed/recreate_db (se necessário) para garantir consistência.

## 3) Backend (APIs)
- [ ] Criar rota para usuário enviar mensagem dentro do ticket/thread.
- [ ] Criar rota para admin listar “conversas” (todos os usuários com mensagens/tickets).
- [ ] Criar rota para admin listar histórico de mensagens de um ticket.
- [ ] Criar rota para admin responder e persistir mensagem.
- [ ] Garantir permissões: admin vê tudo; usuário vê somente threads dele.

## 4) Front-end (Admin)
- [ ] Inserir ícone/entrada “Mensagens/Conversa” no sidebar da `admia.html`.
- [ ] Implementar layout: sidebar com lista de conversas (usuários) e painel de mensagens.
- [ ] Criar chamadas JS para carregar conversas e mensagens.
- [ ] Implementar polling (sem WebSocket inicialmente) para atualização automática.

## 5) Front-end (Usuário)
- [ ] Garantir que existe UI de suporte/chat para o usuário.
- [ ] Se não existir, criar tela simples para ver e enviar mensagens ao admin.
- [ ] Validar fluxo: usuário vê somente suas conversas.

## 6) Deploy Railway
- [ ] Ajustar config para production (debug desativado, host/port via env).
- [ ] Revisar CORS, variáveis de ambiente e conexão com banco.
- [ ] Garantir que requirements/pacotes estejam corretos.

## 7) Testes / Validação
- [ ] Rodar testes existentes.
- [ ] Criar testes mínimos para rotas de chat (listar conversas, enviar mensagem, listar histórico).

