// ========== CHAT DO CLIENTE (Minhas Conversas) ==========

document.addEventListener('DOMContentLoaded', function () {
    let conversasCliente = [];
    let conversaSelecionada = null;

    const btnMinasConversas = document.getElementById('btnMinasConversas');
    const modalConversas = document.getElementById('modalConversas');
    const fecharConversas = document.getElementById('fecharConversas');
    const listaConversas = document.getElementById('listaConversas');

    const modalChat = document.getElementById('modalChat');
    const fecharChat = document.getElementById('fecharChat');
    const chatMensagens = document.getElementById('chatMensagens');
    const formEnviarMensagem = document.getElementById('formEnviarMensagem');
    const chatIdConversa = document.getElementById('chatIdConversa');
    const chatInputMensagem = document.getElementById('chatInputMensagem');

    if (!btnMinasConversas || !modalConversas) return; // Página não tem os elementos

    // Abrir modal de conversas
    btnMinasConversas.addEventListener('click', async () => {
        await carregarConversas();
        modalConversas.classList.add('ativo');
    });

    // Fechar modal de conversas
    if (fecharConversas) {
        fecharConversas.addEventListener('click', () => {
            modalConversas.classList.remove('ativo');
        });
    }

    if (modalConversas) {
        window.addEventListener('click', (e) => {
            if (e.target === modalConversas) {
                modalConversas.classList.remove('ativo');
            }
        });
    }

    // Fechar modal de chat
    if (fecharChat) {
        fecharChat.addEventListener('click', () => {
            modalChat.classList.remove('ativo');
        });
    }

    if (modalChat) {
        window.addEventListener('click', (e) => {
            if (e.target === modalChat) {
                modalChat.classList.remove('ativo');
            }
        });
    }

    // Enviar mensagem no chat
    if (formEnviarMensagem) {
        formEnviarMensagem.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const chamadoId = parseInt(chatIdConversa.value);
            const conteudo = chatInputMensagem.value.trim();

            if (!conteudo || !chamadoId) {
                if (typeof toastErro === 'function') {
                    toastErro('Preencha a mensagem');
                }
                return;
            }

            try {
                // Chamada à rota de chat (sem /api prefix)
                const baseUrl = API_BASE.replace('/api', '');
                const response = await fetch(`${baseUrl}/chat/${chamadoId}/mensagens`, {
                    method: 'POST',
                    headers: apiHeaders(true),
                    body: JSON.stringify({ conteudo })
                });

                if (!response.ok) {
                    const txt = await response.text().catch(() => '');
                    throw new Error(txt || `HTTP ${response.status}`);
                }

                if (typeof toastSucesso === 'function') {
                    toastSucesso('Mensagem enviada!');
                }

                chatInputMensagem.value = '';

                // Recarregar mensagens
                await carregarMensagensConversa(chamadoId);

            } catch (error) {
                console.error('Erro ao enviar mensagem:', error);
                if (typeof toastErro === 'function') {
                    toastErro('Erro ao enviar mensagem. Tente novamente.');
                }
            }
        });
    }

    // Carregar conversas do usuário
    async function carregarConversas() {
        try {
            // Conversas do chat são endpoints do blueprint /chat (sem /api prefix)
            const baseUrl = API_BASE.replace('/api', '');
            const response = await fetch(`${baseUrl}/chat/conversas`, {
                headers: apiHeaders(true)
            });

            if (!response.ok) {
                const txt = await response.text().catch(() => '');
                throw new Error(txt || `Erro ao carregar conversas (${response.status})`);
            }

            const data = await response.json();
            const items = data?.conversas || [];

            // Normaliza o formato esperado pela renderização atual
            conversasCliente = items.map(c => ({
                id: c.chamado_id,
                titulo: c.titulo,
                descricao: c.descricao,
                status: c.status_conversa,
                data: c.data_thread,
            }));

            renderizarConversas();

        } catch (error) {
            console.error('Erro ao carregar conversas:', error);
            if (listaConversas) {
                listaConversas.innerHTML = '<div class="erro"><p>Erro ao carregar conversas. Tente novamente.</p></div>';
            }
        }
    }


    // Renderizar lista de conversas
    function renderizarConversas() {
        if (!listaConversas) return;

        if (!conversasCliente || conversasCliente.length === 0) {
            listaConversas.innerHTML = `
                <div class="sem-conversas">
                    <i class="bi bi-chat-dots"></i>
                    <p>Nenhuma conversa encontrada.</p>
                </div>`;
            return;
        }

        let html = '';
        conversasCliente.forEach(conv => {
            html += `
                <div class="conversa-item" data-conversa-id="${conv.id}">
                    <div class="conversa-info">
                        <strong>${conv.titulo}</strong>
                        <p>${conv.descricao.substring(0, 60)}...</p>
                        <small>
                            Status: <span class="status-badge ${conv.status}">${conv.status}</span> |
                            ${new Date(conv.data).toLocaleDateString('pt-BR')}
                        </small>
                    </div>
                    <div class="conversa-acoes">
                        <button class="btn-abrir-conversa" onclick="abrirConversa(${conv.id})">
                            <i class="bi bi-chat-fill"></i> Abrir
                        </button>
                    </div>
                </div>
            `;
        });
        listaConversas.innerHTML = html;
    }

    // Carregar mensagens de uma conversa
    async function carregarMensagensConversa(chamadoId) {
        try {
            const baseUrl = API_BASE.replace('/api', '');
            const response = await fetch(`${baseUrl}/chat/${chamadoId}/mensagens`, {
                headers: apiHeaders(true)
            });

            if (!response.ok) {
                throw new Error(`Erro ao carregar mensagens`);
            }

            const data = await response.json();
            renderizarMensagens(data.mensagens || []);

        } catch (error) {
            console.error('Erro ao carregar mensagens:', error);
            if (chatMensagens) {
                chatMensagens.innerHTML = '<div class="erro"><p>Erro ao carregar mensagens</p></div>';
            }
        }
    }

    // Renderizar mensagens no chat
    function renderizarMensagens(mensagens) {
        if (!chatMensagens) return;

        if (!mensagens || mensagens.length === 0) {
            chatMensagens.innerHTML = '<div class="sem-mensagens"><p>Sem mensagens ainda</p></div>';
            return;
        }

        let html = '';
        mensagens.forEach(msg => {
            const isAdmin = msg.autor_tipo === 'admin';
            const dataStr = new Date(msg.data).toLocaleString('pt-BR');

            html += `
                <div class="mensagem-chat ${isAdmin ? 'admin' : 'user'}">
                    <div class="msg-bubble">
                        <p>${msg.conteudo}</p>
                        <small class="msg-data">${dataStr}</small>
                    </div>
                </div>
            `;
        });
        chatMensagens.innerHTML = html;
        chatMensagens.scrollTop = chatMensagens.scrollHeight;
    }

    // Funções globais
    window.abrirConversa = async function(chamadoId) {
        if (!chamadoId) return;

        // Encontrar conversa
        const conversa = conversasCliente.find(c => c.id === chamadoId);
        if (!conversa) return;

        // Atualizar campo oculto
        chatIdConversa.value = chamadoId;

        // Atualizar título
        const chatTitulo = document.getElementById('chatTitulo');
        if (chatTitulo) {
            chatTitulo.textContent = conversa.titulo;
        }

        // Carregar mensagens
        await carregarMensagensConversa(chamadoId);

        // Fechar modal de conversas e abrir modal de chat
        if (modalConversas) modalConversas.classList.remove('ativo');
        if (modalChat) modalChat.classList.add('ativo');

        // Focar no input
        setTimeout(() => {
            if (chatInputMensagem) chatInputMensagem.focus();
        }, 100);
    };
});
