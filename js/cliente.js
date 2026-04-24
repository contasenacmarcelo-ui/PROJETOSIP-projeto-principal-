// Perfil do Cliente — menu suspenso com dados do usuário logado
// + Notificações + Dashboard Estatísticas

document.addEventListener('DOMContentLoaded', function () {
    // ========== PERFIL ==========
    const btnProfile = document.getElementById("btn-profile");
    const menu = document.getElementById("menu");
    const closeMenu = document.getElementById("close-menu");

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
                if (menuName) menuName.innerHTML = '<b>' + (user.name || '--') + '</b>';
                if (perfilName) perfilName.textContent = user.name || '--';
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

    function getNotificacoes() {
        const dados = localStorage.getItem('sip_notificacoes');
        return dados ? JSON.parse(dados) : [];
    }

    function salvarNotificacoes(notificacoes) {
        localStorage.setItem('sip_notificacoes', JSON.stringify(notificacoes));
    }

    function criarNotificacao(titulo, tipo) {
        const notificacoes = getNotificacoes();
        const nova = {
            id: Date.now(),
            titulo: titulo,
            tipo: tipo || 'info',
            lida: false,
            data: new Date().toLocaleString('pt-BR')
        };
        notificacoes.unshift(nova);
        salvarNotificacoes(notificacoes);
        atualizarBadge();
        renderizarNotificacoes();
    }

    function atualizarBadge() {
        const naoLidas = getNotificacoes().filter(n => !n.lida).length;
        if (badgeNotificacao) {
            badgeNotificacao.textContent = naoLidas;
            badgeNotificacao.style.display = naoLidas > 0 ? 'flex' : 'none';
        }
    }

    function renderizarNotificacoes() {
        if (!listaNotificacao) return;
        const notificacoes = getNotificacoes();

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
                        <p class="notificacao-titulo">${n.titulo}</p>
                        <span class="notificacao-tempo">${n.data}</span>
                    </div>
                </div>
            `;
        });
        listaNotificacao.innerHTML = html;

        // clicar em uma notificação marca como lida
        listaNotificacao.querySelectorAll('.notificacao-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.getAttribute('data-id'));
                const nots = getNotificacoes();
                const not = nots.find(n => n.id === id);
                if (not) {
                    not.lida = true;
                    salvarNotificacoes(nots);
                    atualizarBadge();
                    renderizarNotificacoes();
                }
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
        btnMarcarTodas.addEventListener('click', () => {
            const nots = getNotificacoes();
            nots.forEach(n => n.lida = true);
            salvarNotificacoes(nots);
            atualizarBadge();
            renderizarNotificacoes();
        });
    }

    // notificações iniciais (apenas se ainda não existirem)
    function criarNotificacoesIniciais() {
        const nots = getNotificacoes();
        if (nots.length === 0) {
            const iniciais = [
                { id: Date.now() - 3000, titulo: 'Bem-vindo ao Painel do Cliente!', tipo: 'info', lida: false, data: new Date().toLocaleString('pt-BR') },
                { id: Date.now() - 2000, titulo: 'Complete seu perfil para melhor atendimento.', tipo: 'aviso', lida: false, data: new Date().toLocaleString('pt-BR') },
                { id: Date.now() - 1000, titulo: 'Dica: você pode solicitar orçamentos diretamente pelo painel.', tipo: 'info', lida: true, data: new Date().toLocaleString('pt-BR') }
            ];
            salvarNotificacoes(iniciais);
        }
    }

    criarNotificacoesIniciais();
    atualizarBadge();

    // ========== DASHBOARD ESTATÍSTICAS ==========
    function atualizarDashboard() {
        const pedidos = getOrcamentos().length;
        const suportes = getSuportes().length;
        const nots = getNotificacoes().length;
        // orçamentos = pedidos (mesma base) ou pode separar depois
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
        const pedidos = getOrcamentos();
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
                    <strong>${p.titulo || 'Sem título'}</strong><br>
                    Tipo: ${p.tipo || '-'}<br>
                    Prazo: ${p.prazo || '-'}<br>
                    Enviado: ${p.dataEnvio || '-'}<br>
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

            const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');

            const orcamento = {
                id: Date.now(),
                titulo: titulo,
                descricao: descricao,
                tipo: tipo,
                prazo: prazo,
                dataEnvio: new Date().toLocaleString('pt-BR'),
                status: 'Pendente',
                userEmail: user.email || null
            };

            salvarOrcamento(orcamento);
            criarNotificacao(`Novo pedido enviado: "${titulo}"`, 'pedido');
            atualizarDashboard();
            
            if (typeof toastSucesso === 'function') {
                toastSucesso('Pedido enviado com sucesso!');
            }

            setTimeout(() => {
                modalNovoPedido.classList.remove('ativo');
                limparFormNovoPedido();
            }, 1500);
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

            const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');

            const suporte = {
                id: Date.now(),
                assunto: assunto,
                mensagem: mensagem,
                dataEnvio: new Date().toLocaleString('pt-BR'),
                status: 'Aberto',
                userEmail: user.email || null
            };

            salvarSuporte(suporte);
            criarNotificacao(`Chamado de suporte aberto: "${assunto}"`, 'suporte');
            atualizarDashboard();

            if (typeof toastSucesso === 'function') {
                toastSucesso('Chamado aberto com sucesso! Entraremos em contato em breve.');
            }

            setTimeout(() => {
                modalSuporte.classList.remove('ativo');
                limparFormSuporte();
            }, 1500);
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

