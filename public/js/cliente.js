// Perfil do Cliente — menu suspenso com dados do usuário logado
// + Notificações + Dashboard Estatísticas

document.addEventListener('DOMContentLoaded', function () {
    // ========== PERFIL ==========
    const btnProfile = document.getElementById("btn-profile");
    const menu = document.getElementById("menu");
    const closeMenu = document.getElementById("close-menu");

    let pedidosServer = [];
    let chamadosServer = [];
    let notificacoesServer = [];

    const token = getToken();
    if (!token) {
        window.location.href = '/public/pages/login.html';
        return;
    }

    if (btnProfile && menu) {
        btnProfile.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            let user = null;
            try {
                user = JSON.parse(localStorage.getItem('loggedInUser'));
            } catch (e) {
                console.error('Erro lendo loggedInUser:', e);
            }

            if (!user) {
                try {
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    if (users && users.length > 0) {
                        user = users[0];
                    }
                } catch (e) {
                    console.error('Erro lendo users:', e);
                }
            }

            const menuName = document.getElementById('menu-name');
            const perfilName = document.getElementById('perfil-name');
            const perfilEmail = document.getElementById('perfil-email');

            if (user) {
                if (menuName) menuName.innerHTML = '<b>' + (user.nome || user.name || '--') + '</b>';
                if (perfilName) perfilName.textContent = user.nome || user.name || '--';
                if (perfilEmail) perfilEmail.textContent = user.email || '--';
            } else {
                if (menuName) menuName.innerHTML = '<b>--</b>';
                if (perfilName) perfilName.textContent = '--';
                if (perfilEmail) perfilEmail.textContent = '--';
            }

            menu.classList.toggle("hidden");
        });
    }

    document.addEventListener("click", () => {
        if (menu) menu.classList.add("hidden");
    });

    if (menu) {
        menu.addEventListener("click", (e) => {
            e.stopPropagation();
        });
    }

    if (closeMenu) {
        closeMenu.addEventListener("click", () => {
            if (menu) menu.classList.add("hidden");
        });
    }

    // ========== NOTIFICAÇÕES ==========
    const btnNotificacao = document.getElementById('btn-notificacao');
    const dropdownNotificacao = document.getElementById('notificacaoDropdown');
    const badgeNotificacao = document.getElementById('notificacaoBadge');
    const listaNotificacao = document.getElementById('notificacaoLista');
    const btnMarcarTodas = document.getElementById('marcarTodasLidas');

    async function fetchPedidos() {
        if (!getToken()) return;

        try {
            const response = await apiFetch('/pedidos');
            if (response.ok) {
                pedidosServer = await response.json();
                atualizarDashboard();
            }
        } catch (error) {
            console.error('Erro ao buscar pedidos:', error);
        }
    }

    async function fetchSuportes() {
        if (!getToken()) return;

        try {
            const response = await apiFetch('/chamados');
            if (response.ok) {
                chamadosServer = await response.json();
                atualizarDashboard();
            }
        } catch (error) {
            console.error('Erro ao buscar chamados:', error);
        }
    }

    async function fetchNotificacoes() {
        if (!getToken()) return;

        try {
            const response = await apiFetch('/notificacoes');
            if (response.ok) {
                notificacoesServer = await response.json();
                atualizarBadge();
                renderizarNotificacoes();
            }
        } catch (error) {
            console.error('Erro ao buscar notificações:', error);
        }
    }

    async function marcarNotificacaoLida(id) {
        if (!getToken()) return;

        try {
            const response = await apiFetch(`/notificacoes/${id}/lido`, {
                method: 'PUT',
                contentType: false
            });
            if (response.ok) {
                await fetchNotificacoes();
            }
        } catch (error) {
            console.error('Erro ao marcar notificação como lida:', error);
        }
    }

    async function criarNotificacao(titulo, tipo) {
        // Atualiza as notificações vindas do servidor após criar um pedido ou chamado.
        await fetchNotificacoes();
        atualizarBadge();
        renderizarNotificacoes();
    }

    function atualizarBadge() {
        const naoLidas = notificacoesServer.filter(n => !n.lida).length;
        if (badgeNotificacao) {
            badgeNotificacao.textContent = naoLidas;
            badgeNotificacao.style.display = naoLidas > 0 ? 'flex' : 'none';
        }
    }

    function renderizarNotificacoes() {
        if (!listaNotificacao) return;
        const notificacoes = notificacoesServer;

        if (notificacoes.length === 0) {
            listaNotificacao.innerHTML = '<div class="notificacao-vazia"><i class="bi bi-bell-slash"></i><p>Sem notificações</p></div>';
            return;
        }

        const icones = {
            sucesso: 'bi-check-circle-fill',
            info: 'bi-info-circle-fill',
            aviso: 'bi-exclamation-triangle-fill',
            pedido: 'bi-clipboard-check',
            suporte: 'bi-headset'
        };

        let html = '';
        notificacoes.forEach(n => {
            const icone = icones[n.tipo] || icones.info;
            html += `
                <div class="notificacao-item ${n.lida ? 'lida' : ''}" data-id="${n.id}">
                    <i class="bi ${icone}"></i>
                    <div class="notificacao-conteudo">
                        <p class="notificacao-titulo">${n.mensagem || n.titulo}</p>
                        <span class="notificacao-tempo">${n.data || ''}</span>
                    </div>
                </div>
            `;
        });
        listaNotificacao.innerHTML = html;

        listaNotificacao.querySelectorAll('.notificacao-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.getAttribute('data-id'));
                marcarNotificacaoLida(id);
            });
        });
    }

    // abrir/fechar dropdown
    if (btnNotificacao && dropdownNotificacao) {
        btnNotificacao.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownNotificacao.classList.toggle('hidden');
            renderizarNotificacoes();
        });

        document.addEventListener('click', (e) => {
            if (!dropdownNotificacao.contains(e.target) && !btnNotificacao.contains(e.target)) {
                dropdownNotificacao.classList.add('hidden');
            }
        });
    }

    // marcar todas como lidas
    if (btnMarcarTodas) {
        btnMarcarTodas.addEventListener('click', async () => {
            const promises = notificacoesServer
                .filter(n => !n.lida)
                .map(n => marcarNotificacaoLida(n.id));
            await Promise.all(promises);
            await fetchNotificacoes();
        });
    }

    async function carregarDadosServidor() {
        await Promise.all([
            fetchPedidos(),
            fetchSuportes(),
            fetchNotificacoes()
        ]);
    }

    carregarDadosServidor();

    // ========== DASHBOARD ESTATÍSTICAS ==========
    function atualizarDashboard() {
        const pedidos = pedidosServer.length;
        const suportes = chamadosServer.length;
        const nots = notificacoesServer.length;
        const orcamentos = pedidos;

        const elPedidos = document.getElementById('statPedidos');
        const elOrcamentos = document.getElementById('statOrcamentos');
        const elSuportes = document.getElementById('statSuportes');
        const elNotificacoes = document.getElementById('statNotificacoes');

        if (elPedidos) elPedidos.textContent = pedidos;
        if (elOrcamentos) elOrcamentos.textContent = orcamentos;
        if (elSuportes) elSuportes.textContent = suportes;
        if (elNotificacoes) elNotificacoes.textContent = nots;
    }

    atualizarDashboard();

    // ========== LOCALSTORAGE HELPERS ==========
    function getOrcamentos() {
        const dados = localStorage.getItem('sip_orcamentos');
        return dados ? JSON.parse(dados) : [];
    }

    function salvarOrcamento(orcamento) {
        const orcamentos = getOrcamentos();
        orcamentos.push(orcamento);
        localStorage.setItem('sip_orcamentos', JSON.stringify(orcamentos));
    }

    function getSuportes() {
        const dados = localStorage.getItem('sip_suportes');
        return dados ? JSON.parse(dados) : [];
    }

    function salvarSuporte(suporte) {
        const suportes = getSuportes();
        suportes.push(suporte);
        localStorage.setItem('sip_suportes', JSON.stringify(suportes));
    }

    // ========== MODAL VER DETALHES ==========
    const btnVerDetalhes = document.getElementById('btnVerDetalhes');
    const modalDetalhes = document.getElementById('modalDetalhes');
    const fecharDetalhes = document.getElementById('fecharDetalhes');
    const listaPedidos = document.getElementById('listaPedidos');

    if (btnVerDetalhes && modalDetalhes) {
        btnVerDetalhes.addEventListener('click', () => {
            renderizarPedidos();
            modalDetalhes.classList.add('ativo');
        });
    }

    if (fecharDetalhes && modalDetalhes) {
        fecharDetalhes.addEventListener('click', () => {
            modalDetalhes.classList.remove('ativo');
        });
    }

    if (modalDetalhes) {
        window.addEventListener('click', (e) => {
            if (e.target === modalDetalhes) modalDetalhes.classList.remove('ativo');
        });
    }

    function renderizarPedidos() {
        const pedidos = pedidosServer;
        if (pedidos.length === 0) {
            listaPedidos.innerHTML = `
                <div class="sem-pedidos">
                    <i class="bi bi-clipboard-x"></i>
                    <p>Nenhum pedido encontrado.</p>
                </div>`;
            return;
        }

        let html = '';
        pedidos.slice().reverse().forEach(p => {
            html += `
                <div class="pedido-item">
                    <strong>${p.tipo_servico || 'Sem título'}</strong><br>
                    Tipo: ${p.tipo_servico || '-'}<br>
                    Prazo: ${p.prazo || '-'}<br>
                    Enviado: ${p.data_criacao ? new Date(p.data_criacao).toLocaleDateString('pt-BR') : '-'}<br>
                    <span class="pedido-status status-pendente">${p.status || 'Pendente'}</span>
                </div>
            `;
        });
        listaPedidos.innerHTML = html;
    }

    // ========== MODAL NOVO PEDIDO ==========
    const btnNovoPedido = document.getElementById('btnNovoPedido');
    const modalNovoPedido = document.getElementById('modalNovoPedido');
    const fecharNovoPedido = document.getElementById('fecharNovoPedido');
    const formNovoPedido = document.getElementById('formNovoPedido');
    const sucessoPedido = document.getElementById('sucessoPedido');

    if (btnNovoPedido && modalNovoPedido) {
        btnNovoPedido.addEventListener('click', () => {
            modalNovoPedido.classList.add('ativo');
        });
    }

    if (fecharNovoPedido && modalNovoPedido) {
        fecharNovoPedido.addEventListener('click', () => {
            modalNovoPedido.classList.remove('ativo');
            limparFormNovoPedido();
        });
    }

    if (modalNovoPedido) {
        window.addEventListener('click', (e) => {
            if (e.target === modalNovoPedido) {
                modalNovoPedido.classList.remove('ativo');
                limparFormNovoPedido();
            }
        });
    }

    if (formNovoPedido) {
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('pedidoPrazo').min = hoje;

        formNovoPedido.addEventListener('submit', (e) => {
            e.preventDefault();
            limparErrosNovoPedido();

            const titulo = document.getElementById('pedidoTitulo').value.trim();
            const descricao = document.getElementById('pedidoDescricao').value.trim();
            const tipo = document.getElementById('pedidoTipo').value;
            const prazo = document.getElementById('pedidoPrazo').value;

            let valido = true;

            if (titulo === '') {
                mostrarErroCliente('erro-pedido-titulo', 'Título obrigatório');
                valido = false;
            }

            if (descricao.length < 10) {
                mostrarErroCliente('erro-pedido-descricao', 'Mínimo de 10 caracteres');
                valido = false;
            }

            if (tipo === '') {
                mostrarErroCliente('erro-pedido-tipo', 'Selecione um tipo');
                valido = false;
            }

            if (prazo === '') {
                mostrarErroCliente('erro-pedido-prazo', 'Selecione uma data');
                valido = false;
            } else if (prazo < hoje) {
                mostrarErroCliente('erro-pedido-prazo', 'Data inválida (passado)');
                valido = false;
            }

            if (!valido) return;

            const pedido = {
                tipo_servico: tipo,
                descricao: descricao,
                prazo: prazo
            };

            const headers = apiHeaders(true);

            // ENVIAR PARA O SERVIDOR
            fetch(`${API_BASE}/pedidos`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(pedido)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro: ${response.status}`);
                }
                return response.json();
            })
            .then(async data => {
                console.log('Pedido enviado com sucesso:', data);
                criarNotificacao(`Novo pedido enviado: "${titulo}"`, 'pedido');
                await fetchPedidos();
                await fetchNotificacoes();
                atualizarDashboard();
                
                if (typeof toastSucesso === 'function') {
                    toastSucesso('Pedido enviado com sucesso!');
                }

                setTimeout(() => {
                    modalNovoPedido.classList.remove('ativo');
                    limparFormNovoPedido();
                }, 1500);
            })
            .catch(error => {
                console.error('Erro ao enviar pedido:', error);
                if (typeof toastErro === 'function') {
                    toastErro('Erro ao enviar pedido. Tente novamente.');
                }
            });
        });
    }

    function limparErrosNovoPedido() {
        document.querySelectorAll('#modalNovoPedido .erro-cliente').forEach(el => {
            el.classList.remove('show');
            el.textContent = '';
        });
        document.querySelectorAll('#modalNovoPedido .input-erro').forEach(el => {
            el.classList.remove('input-erro');
        });
    }

    function limparFormNovoPedido() {
        if (formNovoPedido) {
            formNovoPedido.reset();
            formNovoPedido.style.display = 'block';
        }
        if (sucessoPedido) sucessoPedido.style.display = 'none';
        limparErrosNovoPedido();
    }

    // ========== MODAL SUPORTE ==========
    const btnObterSuporte = document.getElementById('btnObterSuporte');
    const modalSuporte = document.getElementById('modalSuporte');
    const fecharSuporte = document.getElementById('fecharSuporte');
    const formSuporte = document.getElementById('formSuporte');
    const sucessoSuporte = document.getElementById('sucessoSuporte');

    if (btnObterSuporte && modalSuporte) {
        btnObterSuporte.addEventListener('click', () => {
            modalSuporte.classList.add('ativo');
        });
    }

    if (fecharSuporte && modalSuporte) {
        fecharSuporte.addEventListener('click', () => {
            modalSuporte.classList.remove('ativo');
            limparFormSuporte();
        });
    }

    if (modalSuporte) {
        window.addEventListener('click', (e) => {
            if (e.target === modalSuporte) {
                modalSuporte.classList.remove('ativo');
                limparFormSuporte();
            }
        });
    }

    if (formSuporte) {
        formSuporte.addEventListener('submit', (e) => {
            e.preventDefault();
            limparErrosSuporte();

            const assunto = document.getElementById('suporteAssunto').value.trim();
            const mensagem = document.getElementById('suporteMensagem').value.trim();

            let valido = true;

            if (assunto === '') {
                mostrarErroCliente('erro-suporte-assunto', 'Assunto obrigatório');
                valido = false;
            }

            if (mensagem.length < 10) {
                mostrarErroCliente('erro-suporte-mensagem', 'Mínimo de 10 caracteres');
                valido = false;
            }

            if (!valido) return;

            const chamado = {
                titulo: assunto,
                descricao: mensagem
            };

            const headers = apiHeaders(true);

            // ENVIAR PARA O SERVIDOR
            fetch(`${API_BASE}/suporte`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(chamado)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro: ${response.status}`);
                }
                return response.json();
            })
            .then(async data => {
                console.log('Chamado enviado com sucesso:', data);
                criarNotificacao(`Chamado de suporte aberto: "${assunto}"`, 'suporte');
                await fetchSuportes();
                await fetchNotificacoes();
                atualizarDashboard();

                if (typeof toastSucesso === 'function') {
                    toastSucesso('Chamado aberto com sucesso! Entraremos em contato em breve.');
                }

                setTimeout(() => {
                    modalSuporte.classList.remove('ativo');
                    limparFormSuporte();
                }, 1500);
            })
            .catch(error => {
                console.error('Erro ao enviar chamado:', error);
                if (typeof toastErro === 'function') {
                    toastErro('Erro ao enviar chamado. Tente novamente.');
                }
            });
        });
    }

    function limparErrosSuporte() {
        document.querySelectorAll('#modalSuporte .erro-cliente').forEach(el => {
            el.classList.remove('show');
            el.textContent = '';
        });
    }

    function limparFormSuporte() {
        if (formSuporte) {
            formSuporte.reset();
            formSuporte.style.display = 'block';
        }
        if (sucessoSuporte) sucessoSuporte.style.display = 'none';
        limparErrosSuporte();
    }
});

// --- UTILS ---
function mostrarErroCliente(id, msg) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = msg;
        el.classList.add('show');
    }
}

// Logout
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('loggedInUser');
    window.location.href = '/public/pages/login.html';
}

