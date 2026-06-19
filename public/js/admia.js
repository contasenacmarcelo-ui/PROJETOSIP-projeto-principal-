let usuarioAtual = null;

// Função auxiliar centralizada para capturar o token de qualquer lugar possível
function obterTokenValido() {
    let token = typeof getToken === 'function' ? getToken() : null;
    if (!token) token = localStorage.getItem('access_token');
    if (!token) token = localStorage.getItem('token');
    if (!token) {
        try {
            const logged = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
            token = logged?.access_token || logged?.token;
        } catch (e) {
            token = null;
        }
    }
    return token;
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/\"/g, '"')
        .replace(/'/g, '&#039;');
}

function setModalMensagens(titulo, mensagemHtml, tipo = 'info') {
    const modal = document.getElementById('modal-mensagem');
    const tituloElem = document.getElementById('mensagem-titulo');
    const corpoElem = document.getElementById('mensagem-corpo');

    if (!modal || !tituloElem || !corpoElem) return;

    tituloElem.textContent = titulo || 'Mensagem';

    if (mensagemHtml && typeof mensagemHtml === 'string') {
        corpoElem.textContent = mensagemHtml;
    } else {
        corpoElem.textContent = '—';
    }

    modal.dataset.tipo = tipo;
    modal.style.display = 'block';
}

window.fecharModalMensagem = function () {
    const modal = document.getElementById('modal-mensagem');
    if (modal) modal.style.display = 'none';
};

window.mostrarModalMensagem = function ({ titulo, mensagem, tipo = 'info', html = false } = {}) {
    let mensagemHtml;
    if (html) {
        mensagemHtml = mensagem ?? '—';
    } else {
        mensagemHtml = escapeHtml(mensagem || '—').replace(/\n/g, '<br>');
    }
    setModalMensagens(titulo, mensagemHtml, tipo);
};

// Verificar autenticação ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    await verificarAutenticacao();
    if (usuarioAtual) {
        initializeAdmin();
    }
});

// Verificar se é admin
async function verificarAutenticacao() {
    const token = obterTokenValido();

    if (!token) {
        window.location.href = '/public/pages/login.html';
        return;
    }

    try {
        // Garante o envio do token no cabeçalho de verificação
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            usuarioAtual = await response.json();
            if (usuarioAtual.role !== 'admin') {
                mostrarModalMensagem({
                    titulo: 'Acesso negado',
                    mensagem: 'Apenas administradores podem acessar este painel.',
                    tipo: 'erro'
                });
                return;
            }

            const adminNome = document.getElementById('admin-nome');
            if (adminNome) {
                adminNome.textContent = usuarioAtual.nome || 'Administrador';
            }
        } else {
            localStorage.removeItem('access_token');
            localStorage.removeItem('token');
            window.location.href = '/public/pages/login.html';
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        window.location.href = '/public/pages/login.html';
    }
}

function initializeAdmin() {
    const btn = document.getElementById("btn-menu");
    const menu = document.getElementById("menu-mobile");

    if (btn && menu) {
        btn.addEventListener("click", () => {
            btn.classList.toggle("ativo");
            menu.classList.toggle("ativo");
        });
    }

    setupModals();

    // ======= Alternar seções pelo hash (ex: #conversas) =======
    if (typeof setupSectionsByHash === 'function') {
        setupSectionsByHash();
    } else {
        // fallback: define função em runtime caso não exista (evita ReferenceError)
        window.setupSectionsByHash = window.setupSectionsByHash || function () {
            const secoes = Array.from(document.querySelectorAll('section.section'));
            if (!secoes.length) return;

            const setSection = (ativoId) => {
                secoes.forEach(sec => {
                    if (!sec || !sec.id) return;
                    sec.style.display = (sec.id === ativoId) ? 'block' : 'none';
                });
            };

            const hash = (window.location.hash || '').replace('#', '').trim();
            setSection(hash || 'dashboard');

            window.addEventListener('hashchange', () => {
                const h = (window.location.hash || '').replace('#', '').trim();
                setSection(h || 'dashboard');
            });
        };
        window.setupSectionsByHash();
    }


    carregarDashboard();
    carregarClientes();
    carregarMensagensSuporte();
    carregarModelosML();
    carregarPedidos();
    if (typeof setupChatAdmin === 'function') {
        setupChatAdmin();
    }

    carregarRelatorioML();

    document.querySelectorAll('.btn-logout, .header-logout').forEach(btn => {
        btn.addEventListener('click', logout);
    });
}


// ======= CHAT ADMIN =======
// Corrige: ReferenceError: setupChatAdmin is not defined
// Implementação mínima baseada em expectativa comum de UI e rotas existentes.
function setupChatAdmin() {
    const token = obterTokenValido();
    if (!token) return;

    // Se a página não tiver os elementos esperados, não quebra o resto.
    const chatContainer = document.getElementById('chat-admin-container') || document.getElementById('chat-container');
    const inputMsg = document.getElementById('chat-admin-input') || document.getElementById('chat-input');
    const btnSend = document.getElementById('chat-admin-send') || document.getElementById('chat-send');
    const listaConversas = document.getElementById('chat-admin-conversas') || document.getElementById('chat-conversas');
    const listaMensagens = document.getElementById('chat-admin-mensagens') || document.getElementById('chat-mensagens');

    if (!chatContainer || !inputMsg || !btnSend) {
        // UI não carregada nesta página/página sem chat
        return;
    }

    // Estado simples
    let activeConversaId = null;

    // Tenta carregar conversas
    async function carregarConversas() {
        if (!listaConversas) return;
        try {
            const resp = await fetch(`${API_BASE}/admin/chat/conversas`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!resp.ok) return;
            const data = await resp.json();
            const conversas = Array.isArray(data) ? data : (data.conversas || []);

            listaConversas.innerHTML = '';
            conversas.forEach(c => {
                const id = c.id ?? c.conversa_id ?? c.usuario_id ?? null;
                if (id === null) return;
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'conversa-btn';
                btn.textContent = c.nome ?? c.titulo ?? `Conversa ${id}`;
                btn.addEventListener('click', () => selecionarConversa(id));
                listaConversas.appendChild(btn);
            });
        } catch (e) {
            console.error('Erro ao carregar conversas (admin):', e);
        }
    }

    async function selecionarConversa(conversaId) {
        activeConversaId = conversaId;
        if (listaMensagens) listaMensagens.innerHTML = '';
        await carregarMensagens();
    }

    async function carregarMensagens() {
        if (!listaMensagens || activeConversaId === null) return;
        try {
            const resp = await fetch(`${API_BASE}/admin/chat/${activeConversaId}/mensagens`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!resp.ok) return;
            const data = await resp.json();
            const mensagens = Array.isArray(data) ? data : (data.mensagens || data || []);

            listaMensagens.innerHTML = '';
            mensagens.forEach(m => {
                const div = document.createElement('div');
                div.className = `mensagem ${m.de_admin ? 'de-admin' : 'de-cliente'}`.trim();
                div.innerHTML = `<span class="mensagem-texto"></span>`;
                div.querySelector('.mensagem-texto').textContent = m.texto ?? m.mensagem ?? '';
                listaMensagens.appendChild(div);
            });
        } catch (e) {
            console.error('Erro ao carregar mensagens (admin):', e);
        }
    }

    btnSend.addEventListener('click', async () => {
        const texto = (inputMsg.value || '').trim();
        if (!texto) return;
        if (activeConversaId === null) {
            // Se não há conversa selecionada, tenta enviar sem id (pode existir endpoint que resolva)
            // Mantém silencioso para não quebrar UI.
        }

        try {
            const payload = { texto };
            if (activeConversaId !== null) payload.conversa_id = activeConversaId;

            const resp = await fetch(`${API_BASE}/admin/chat/mensagens`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) return;
            inputMsg.value = '';
            await carregarMensagens();
        } catch (e) {
            console.error('Erro ao enviar mensagem (admin):', e);
        }
    });

    // Auto: se não existir UI de conversas, tenta definir conversa via dataset da página
    const conversaPreset = chatContainer?.dataset?.conversaId || chatContainer?.dataset?.conversa_id;
    if (conversaPreset) {
        activeConversaId = conversaPreset;
        carregarMensagens();
    }

    carregarConversas();
}

function setupModals() {
    const modal = document.getElementById("modal");
    const modalDetalhes = document.getElementById("modal-detalhes");



    window.abrirModal = function () {
        if (modal) modal.style.display = "block";
        setTimeout(() => {
            const nomeInput = document.getElementById("nome");
            if (nomeInput) nomeInput.focus();
        }, 100);
    };

    window.fecharModal = function () {
        if (modal) modal.style.display = "none";
    };

    window.abrirModalDetalhes = function () {
        if (modalDetalhes) modalDetalhes.style.display = "block";
    };

    window.fecharModalDetalhes = function () {
        if (modalDetalhes) modalDetalhes.style.display = "none";
    };

    window.addEventListener("click", (e) => {
        if (e.target === modal) fecharModal();
        if (e.target === modalDetalhes) fecharModalDetalhes();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            fecharModal();
            fecharModalDetalhes();
        }
    });
}

// Carregar dashboard com estatísticas
async function carregarDashboard() {
    const token = obterTokenValido();
    try {
        const response = await fetch(`${API_BASE}/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            atualizarDashboard(data);
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function atualizarDashboard(data) {
    const updateElement = (id, value) => {
        const elem = document.getElementById(id);
        if (elem) elem.textContent = value;
    };

    updateElement('total-usuarios', data.total_usuarios);
    updateElement('total-pedidos', data.total_pedidos);
    updateElement('total-orcamentos', data.total_orcamentos);
    updateElement('total-chamados', data.total_chamados);
    updateElement('receita-total', `R$ ${(data.receita_total || 0).toFixed(2).replace('.', ',')}`);

    // evita render de paginação quebrada em caso de re-entrada
    const pag = document.getElementById('clientes-paginacao');
    if (pag) pag.innerHTML = '';
}

// Carregar lista de clientes
// Configuração da paginação do painel de clientes
const CLIENTES_POR_PAGINA = 8;
let clientesCache = [];
let paginaClientesAtual = 1;

async function carregarClientes() {
    const token = obterTokenValido();
    try {
        const response = await fetch(`${API_BASE}/admin/clientes`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const clientes = Array.isArray(data) ? data : (data?.clientes || []);
            console.log('[ADM] /admin/clientes payload:', data);

            clientesCache = Array.isArray(clientes) ? clientes : [];
            paginaClientesAtual = 1;
            exibirClientesPaginados();
        }
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

function exibirClientesPaginados() {
    const tbody = document.getElementById('tabela-body') || document.querySelector('table tbody');
    const pag = document.getElementById('clientes-paginacao');

    // Alguns builds/carregamentos podem não renderizar #clientes-paginacao.
    // Neste caso, tentamos o contêiner via seletor legado (id alternativo), evitando que a paginação “sumir”.
    if (!pag) {
        return; // fallback: sem paginação
    }

    if (!tbody) return;


    tbody.innerHTML = '';

    const total = clientesCache.length;
    const totalPaginas = Math.max(1, Math.ceil(total / CLIENTES_POR_PAGINA));

    if (paginaClientesAtual > totalPaginas) paginaClientesAtual = totalPaginas;
    if (paginaClientesAtual < 1) paginaClientesAtual = 1;

    const inicio = (paginaClientesAtual - 1) * CLIENTES_POR_PAGINA;
    const fim = inicio + CLIENTES_POR_PAGINA;
    const paginaClientes = clientesCache.slice(inicio, fim);

    if (total === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="8" style="text-align:center;padding:20px;">Nenhum cliente encontrado</td>`;
        tbody.appendChild(tr);
        pag.innerHTML = '';
        return;
    }

    // Render da página
    paginaClientes.forEach((cliente) => {
        try {
            const row = document.createElement('tr');
            row.innerHTML = '';

            const id = cliente?.id ?? '—';
            const nome = cliente?.nome ?? 'Sem Nome';
            const status = cliente?.status ?? 'inativo';
            const numPedidos = cliente?.num_pedidos ?? 0;
            const numChamados = cliente?.num_chamados ?? 0;

            const totalGasto = (cliente?.total_gasto != null && cliente?.total_gasto !== '')
                ? Number(cliente.total_gasto)
                : 0;

            const ultimoLogin = cliente?.data_ultimo_login
                ? (() => {
                    const d = new Date(cliente.data_ultimo_login);
                    return isNaN(d.getTime()) ? 'Nunca' : d.toLocaleDateString('pt-BR');
                })()
                : 'Nunca';

            const emailVerificado = cliente?.email_verificado === true || cliente?.email_verificado === 'true' || cliente?.email_verificado === 1 || cliente?.email_verificado === '1'
                ? 'Sim'
                : 'Não';

            const addCell = (text) => {
                const td = document.createElement('td');
                td.textContent = text ?? '—';
                row.appendChild(td);
            };

            addCell(id);
            addCell(nome);
            addCell(status);
            addCell(numPedidos);
            addCell(numChamados);
            addCell(`R$ ${(isFinite(totalGasto) ? totalGasto : 0).toFixed(2).replace('.', ',')}`);
            addCell(ultimoLogin);
            addCell(emailVerificado);

            const tdBtn = document.createElement('td');

            const btnDetalhes = document.createElement('button');
            btnDetalhes.className = 'btn-detalhes';
            btnDetalhes.title = 'Ver Detalhes';
            btnDetalhes.type = 'button';
            btnDetalhes.setAttribute('onclick', `verDetalhes(${id})`);
            btnDetalhes.innerHTML = `<i class="bi bi-eye-fill"></i> Ver`;
            tdBtn.appendChild(btnDetalhes);

            const btnApagar = document.createElement('button');
            btnApagar.className = 'btn-apagar';
            btnApagar.title = 'Apagar usuário';
            btnApagar.type = 'button';
            btnApagar.setAttribute('onclick', `apagarCliente(${id})`);
            btnApagar.innerHTML = '<i class="bi bi-trash"></i> Apagar';
            tdBtn.appendChild(btnApagar);

            row.appendChild(tdBtn);
            tbody.appendChild(row);
        } catch (err) {
            console.error('Erro ao renderizar cliente:', err, cliente);
        }
    });

    // Controles de paginação
    const createBtn = (label, enabled, onClick) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = label;
        btn.disabled = !enabled;
        if (enabled) btn.addEventListener('click', onClick);
        return btn;
    };

    pag.innerHTML = '';

    // Use uma estrutura simples, independente do CSS atual
    const wrap = document.createElement('div');
    wrap.className = 'clientes-paginacao-wrap';
    wrap.style.display = 'flex';
    wrap.style.gap = '10px';
    wrap.style.alignItems = 'center';
    wrap.style.justifyContent = 'flex-end';
    wrap.style.marginTop = '14px';

    const btnPrev = createBtn('Anterior', paginaClientesAtual > 1, () => {
        paginaClientesAtual -= 1;
        exibirClientesPaginados();
    });

    const btnNext = createBtn('Próxima', paginaClientesAtual < totalPaginas, () => {
        paginaClientesAtual += 1;
        exibirClientesPaginados();
    });

    const info = document.createElement('span');
    info.textContent = `Página ${paginaClientesAtual} de ${totalPaginas}`;
    info.style.color = 'rgba(255,255,255,0.75)';

    wrap.appendChild(btnPrev);
    wrap.appendChild(info);
    wrap.appendChild(btnNext);

    pag.appendChild(wrap);
}


async function apagarCliente(clienteId) {
    if (!confirm('Tem certeza que deseja apagar este cliente? Esta ação não pode ser desfeita.')) return;

    const token = obterTokenValido();
    if (!token) {
        mostrarModalMensagem({ titulo: 'Sessão expirada', mensagem: 'Faça login novamente para continuar.', tipo: 'erro' });
        window.location.href = '/public/pages/login.html';
        return;
    }

    try {
        const resp = await fetch(`${API_BASE}/admin/clientes/${clienteId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const txt = await resp.text().catch(() => '');
        let data = null;
        try { data = txt ? JSON.parse(txt) : null; } catch { data = null; }

        if (!resp.ok) {
            throw new Error(data?.error || txt || `HTTP ${resp.status}`);
        }

        mostrarModalMensagem({ titulo: 'Sucesso', mensagem: 'Cliente apagado com sucesso.', tipo: 'sucesso' });
        carregarClientes();
        carregarDashboard();
    } catch (e) {
        console.error('Erro ao apagar cliente:', e);
        mostrarModalMensagem({ titulo: 'Erro', mensagem: e?.message || 'Erro ao apagar cliente.', tipo: 'erro' });
    }
}

async function verDetalhes(clienteId) {
    const token = obterTokenValido();
    try {
        const response = await fetch(`${API_BASE}/admin/cliente/${clienteId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            exibirModalDetalhes(data);
        }
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        mostrarModalMensagem({ titulo: 'Erro', mensagem: 'Erro ao carregar detalhes do cliente.', tipo: 'erro' });
    }
}

function exibirModalDetalhes(data) {
    const modal = document.getElementById('modal-detalhes');
    if (!modal) return;

    const updateElement = (id, value) => {
        const elem = document.getElementById(id);
        if (elem) elem.textContent = value;
    };

    const usuario = data?.usuario || {};

    // Alguns endpoints retornam `usuario` aninhado, outros retornam campos diretamente.
    // Aqui aceitamos ambos formatos para evitar mostrar apenas '--'.
    const nome = usuario?.nome ?? data?.nome ?? '—';
    const email = usuario?.email ?? data?.email ?? '—';
    const telefone = usuario?.telefone ?? data?.telefone ?? '—';
    const status = usuario?.status ?? data?.status ?? '—';

    updateElement('det-nome', nome);
    updateElement('det-email', email);
    updateElement('det-telefone', telefone || '—');
    updateElement('det-status', status);



    const detPedidos = document.getElementById('det-pedidos');
    if (detPedidos) {
        detPedidos.textContent = (data.pedidos || []).length > 0
            ? `(${data.pedidos.length}) pedidos carregados.`
            : 'Nenhum pedido';
    }

    const detSuportes = document.getElementById('det-suportes');
    if (detSuportes) {
        const nChamados = (data.chamados || []).length;
        const taxa = data?.resumo?.taxa_conclusao ?? 0;
        const valorTotal = data?.resumo?.valor_total ?? 0;
        const ticketsAbertos = (data?.chamados || []).filter(c => c.status === 'aberto').length;

        detSuportes.textContent = nChamados > 0
            ? `(${nChamados}) chamados carregados. ML Insights: conclusão ${taxa}%, valor total R$ ${Number(valorTotal).toFixed(2)}, tickets abertos ${ticketsAbertos}.`
            : 'Nenhum chamado';
    }

    modal.style.display = 'block';
    window.abrirModalDetalhes();
}

async function carregarRelatorioML() {
    const token = obterTokenValido();
    try {
        let response = await fetch(`${API_BASE}/admin/ml/exemplos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            response = await fetch(`${API_BASE}/admin/relatorio/ml`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }

        if (!response.ok) {
            response = await fetch(`${API_BASE}/ml-executivo/dados`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }

        if (response.ok) {
            const data = await response.json();
            exibirRelatorioML(data);
        }
    } catch (error) {
        console.error('Erro ao carregar relatório ML:', error);
    }
}

function exibirRelatorioML(data) {
    const container = document.getElementById('ml-container') || document.body;
    const safePayload = {
        classificador_suporte: data.classificador_suporte,
        recomendador_servicos: data.recomendador_servicos,
        estimador_orcamento: data.estimador_orcamento
    };

    if (container) {
        container.textContent = JSON.stringify(safePayload, null, 2);
    }
}

window.adicionarUsuario = async function () {
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const telefone = document.getElementById('telefone').value;

    if (!nome || !email) {
        mostrarModalMensagem({ titulo: 'Campos obrigatórios', mensagem: 'Nome e e-mail são obrigatórios.', tipo: 'aviso' });
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/cadastro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, telefone, senha: 'senha123' })
        });

        if (response.ok) {
            mostrarModalMensagem({ titulo: 'Sucesso', mensagem: 'Usuário adicionado com sucesso!', tipo: 'sucesso' });
            window.fecharModal();
            carregarClientes();
            document.getElementById('nome').value = '';
            document.getElementById('email').value = '';
            document.getElementById('telefone').value = '';
        } else {
            const error = await response.json();
            mostrarModalMensagem({ titulo: 'Erro', mensagem: error.error || 'Erro ao adicionar usuário.', tipo: 'erro' });
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarModalMensagem({ titulo: 'Erro', message: 'Erro ao adicionar usuário.', tipo: 'erro' });
    }
};

async function carregarMensagensSuporte() {
    const token = obterTokenValido();
    try {
        const response = await fetch(`${API_BASE}/admin/suporte/mensagens`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            exibirMensagensSuporte(data.mensagens);
        }
    } catch (error) {
        console.error('Erro ao carregar mensagens de suporte:', error);
    }
}

function exibirMensagensSuporte(mensagens) {
    const container = document.getElementById('suporte-container');
    if (!container) return;

    container.innerHTML = '';
    if (!mensagens || mensagens.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:20px;color:#999;">Nenhuma mensagem de suporte</p>';
        return;
    }

    mensagens.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'mensagem-suporte';
        
        const header = document.createElement('div');
        header.className = 'mensagem-header';
        header.innerHTML = `<strong></strong> (<span></span>)<span class="status"></span>`;
        header.querySelector('strong').textContent = msg.nome ?? '—';
        header.querySelector('span').textContent = msg.email ?? '—';
        const statusEl = header.querySelector('.status');
        statusEl.textContent = msg.status ?? '—';
        statusEl.className = `status ${msg.status || ''}`.trim();

        const titulo = document.createElement('div');
        titulo.className = 'mensagem-titulo';
        titulo.textContent = msg.titulo ?? '—';

        const desc = document.createElement('div');
        desc.className = 'mensagem-descricao';
        desc.textContent = msg.descricao ?? '—';

        const acoes = document.createElement('div');
        acoes.className = 'mensagem-acoes';
        
        const btnResp = document.createElement('button');
        btnResp.className = 'btn-responder';
        btnResp.type = 'button';
        btnResp.setAttribute('onclick', `responderMensagem(${msg.id})`);
        btnResp.textContent = 'Responder';
        
        const btnRes = document.createElement('button');
        btnRes.className = 'btn-resolver';
        btnRes.type = 'button';
        btnRes.setAttribute('onclick', `marcarResolvido(${msg.id})`);
        btnRes.textContent = 'Marcar Resolvido';

        const btnApagar = document.createElement('button');
        btnApagar.className = 'btn-apagar';
        btnApagar.type = 'button';
        const chamadoId = (msg && (msg.chamado_id ?? msg.id)) != null ? (msg.chamado_id ?? msg.id) : null;
        if (chamadoId !== null) {
            btnApagar.setAttribute('onclick', `apagarChamadoSuporte(${chamadoId})`);
            btnApagar.innerHTML = '<i class="bi bi-trash"></i> Apagar';
        }

        acoes.appendChild(btnResp);
        acoes.appendChild(btnRes);
        if (chamadoId !== null) acoes.appendChild(btnApagar);

        msgDiv.appendChild(header);
        msgDiv.appendChild(titulo);
        msgDiv.appendChild(desc);
        msgDiv.appendChild(acoes);
        container.appendChild(msgDiv);
    });
}

async function responderMensagem(chamadoId) {
    const resposta = prompt('Digite sua resposta:');
    if (!resposta) return;

    const token = obterTokenValido();
    if (!token) {
        mostrarModalMensagem({ titulo: 'Sessão expirada', mensagem: 'Faça login novamente.', tipo: 'erro' });
        window.location.href = '/public/pages/login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/suporte/${chamadoId}/responder`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ resposta: resposta, status: 'em_andamento' })
        });

        if (response.ok) {
            mostrarModalMensagem({ titulo: 'Sucesso', mensagem: 'Resposta enviada com sucesso!', tipo: 'sucesso' });
            carregarMensagensSuporte();
        } else {
            mostrarModalMensagem({ titulo: 'Erro', mensagem: 'Erro ao enviar resposta.', tipo: 'erro' });
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarModalMensagem({ titulo: 'Erro', mensagem: 'Erro ao enviar resposta.', tipo: 'erro' });
    }
}

async function marcarResolvido(chamadoId) {
    const token = obterTokenValido();
    if (!token) {
        mostrarModalMensagem({ titulo: 'Sessão expirada', mensagem: 'Faça login novamente.', tipo: 'erro' });
        window.location.href = '/public/pages/login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/suporte/${chamadoId}/responder`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ resposta: 'Chamado marcado como resolvido.', status: 'fechado' })
        });

        if (response.ok) {
            mostrarModalMensagem({ titulo: 'Sucesso', mensagem: 'Chamado marcado como resolvido!', tipo: 'sucesso' });
            carregarMensagensSuporte();
        } else {
            mostrarModalMensagem({ titulo: 'Erro', mensagem: 'Erro ao marcar como resolvido.', tipo: 'erro' });
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarModalMensagem({ titulo: 'Erro', mensagem: 'Erro ao marcar como resolvido.', tipo: 'erro' });
    }
}

async function apagarChamadoSuporte(chamadoId) {
    if (!confirm('Tem certeza que deseja apagar esta mensagem?')) return;

    const token = obterTokenValido();
    if (!token) {
        mostrarModalMensagem({ titulo: 'Sessão expirada', mensagem: 'Faça login novamente.', tipo: 'erro' });
        window.location.href = '/public/pages/login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/suporte/${chamadoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            mostrarModalMensagem({ titulo: 'Sucesso', mensagem: 'Chamado apagado com sucesso.', tipo: 'sucesso' });
            carregarMensagensSuporte();
        } else {
            const txt = await response.text().catch(() => '');
            mostrarModalMensagem({ titulo: 'Erro', mensagem: txt || 'Erro ao apagar chamado.', tipo: 'erro' });
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarModalMensagem({ titulo: 'Erro', mensagem: 'Erro ao apagar chamado.', tipo: 'erro' });
    }
}

async function carregarModelosML() {
    const modelos = [
        { nome: 'Classificador de Suporte', funcao: 'Classifica chamados de suporte por categoria e urgência', arquivo: 'classificador_suporte.py' },
        { nome: 'Clustering de Clientes', funcao: 'Agrupa clientes por comportamento e preferências', arquivo: 'clustering_clientes.py' },
        { nome: 'Estimador de Orçamento', funcao: 'Prevê custos de projetos baseado em histórico', arquivo: 'estimador_orcamento.py' },
        { nome: 'Extrator de Tags', funcao: 'Identifica tags relevantes em descrições de projetos', arquivo: 'extrator_tags.py' },
        { nome: 'Recomendador de Serviços', funcao: 'Sugere serviços baseado no perfil do cliente', arquivo: 'recomendador_servicos.py' }
    ];

    const container = document.getElementById('ml-container');
    if (!container) return;

    container.innerHTML = '';
    modelos.forEach(modelo => {
        const card = document.createElement('div');
        card.className = 'ml-card';
        card.innerHTML = `
            <h3>${modelo.nome}</h3>
            <p><strong>Função:</strong> ${modelo.funcao}</p>
            <p><strong>Arquivo:</strong> ${modelo.arquivo}</p>
            <button onclick="testarModelo('${modelo.arquivo}')" class="btn-testar">
                <i class="bi bi-play-circle"></i> Testar Modelo
            </button>
        `;
        container.appendChild(card);
    });
}

async function carregarPedidos() {
    const token = obterTokenValido();
    try {
        const response = await fetch(`${API_BASE}/admin/pedidos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });


        if (response.status === 401) {
            mostrarModalMensagem({ titulo: 'Acesso negado', mensagem: 'Sessão expirada. Faça login novamente.', tipo: 'erro' });
            window.location.href = '/public/pages/login.html';
            return;
        }

        if (response.ok) {
            const data = await response.json();
            console.log('[DEBUG pedidos]', data); // linha temporária
            exibirPedidos(data.pedidos);
        }
    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
    }
}

function apagarPedido(pedidoId) {
    if (!confirm('Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.')) return;

    const token = obterTokenValido();
    if (!token) {
        mostrarModalMensagem({ titulo: 'Sessão expirada', mensagem: 'Faça login novamente para continuar.', tipo: 'erro' });
        window.location.href = '/public/pages/login.html';
        return;
    }

    fetch(`${API_BASE}/admin/pedidos/${pedidoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(async (resp) => {
            const txt = await resp.text().catch(() => '');
            let data = null;
            try { data = txt ? JSON.parse(txt) : null; } catch { data = null; }
            if (!resp.ok) {
                throw new Error(data?.erro || data?.error || data?.message || txt || `HTTP ${resp.status}`);
            }
            mostrarModalMensagem({ titulo: 'Sucesso', mensagem: 'Pedido excluído com sucesso.', tipo: 'sucesso' });
            await carregarPedidos();
            await carregarDashboard();
        })
        .catch((err) => {
            console.error('Erro ao excluir pedido:', err);
            mostrarModalMensagem({ titulo: 'Erro', mensagem: err?.message || 'Erro ao excluir pedido.', tipo: 'erro' });
        });
}

function exibirPedidos(pedidos) {

    if (!pedidos || !Array.isArray(pedidos) || pedidos.length === 0) {
        const container = document.getElementById('pedidos-container');
        if (container) {
            container.innerHTML = '<p style="color:#888;padding:1rem;">Nenhum pedido encontrado.</p>';
        }
        return;
    }

    const container = document.getElementById('pedidos-container');
    if (!container) return;


    container.innerHTML = '';
    const safePedidos = Array.isArray(pedidos) ? pedidos : [];

    if (safePedidos.length === 0) {
        container.innerHTML = '<p class="sem-dados">Nenhum pedido encontrado.</p>';
        return;
    }

    safePedidos.forEach((pedido) => {
        try {
            const card = document.createElement('div');
            card.className = 'pedido-card';

            const dataCriacao = pedido?.data_criacao ? new Date(pedido.data_criacao).toLocaleDateString('pt-BR') : '—';
            const statusClass = (pedido?.status || '').toLowerCase().replace(' ', '-');

            const header = document.createElement('div');
            header.className = 'pedido-header';

            const h3 = document.createElement('h3');
            h3.textContent = `Pedido #${pedido?.id ?? '—'}`;

            const statusSpan = document.createElement('span');
            statusSpan.className = `status ${statusClass}`.trim();
            statusSpan.textContent = pedido?.status ?? '—';

            header.appendChild(h3);
            header.appendChild(statusSpan);

            const info = document.createElement('div');
            info.className = 'pedido-info';

            const pCliente = document.createElement('p');
            pCliente.innerHTML = '<strong>Cliente:</strong> ';
            const clienteObj = pedido?.cliente || null;
            const clienteNome = clienteObj?.nome ?? pedido?.usuario_nome ?? 'Não Informado';
            const clienteEmail = clienteObj?.email ?? pedido?.usuario_email ?? '';
            const clienteTxt = clienteEmail ? `${clienteNome} (${clienteEmail})` : `${clienteNome}`;
            pCliente.appendChild(document.createTextNode(clienteTxt));

            const pServico = document.createElement('p');
            pServico.innerHTML = '<strong>Serviço:</strong> ';
            pServico.appendChild(document.createTextNode(pedido?.servico ?? '—'));

            const pDescricao = document.createElement('p');
            pDescricao.innerHTML = '<strong>Descrição:</strong> ';
            pDescricao.appendChild(document.createTextNode(pedido?.descricao ?? '—'));

            const pValor = document.createElement('p');
            pValor.innerHTML = '<strong>Orçamento Estimado:</strong> ';
            const valorTxt = pedido?.valor_estimado != null && pedido?.valor_estimado !== ''
                ? `R$ ${Number(pedido.valor_estimado).toFixed(2)}`
                : 'R$ N/A';
            pValor.appendChild(document.createTextNode(valorTxt));

            const pData = document.createElement('p');
            pData.innerHTML = '<strong>Data:</strong> ';
            pData.appendChild(document.createTextNode(dataCriacao));

            info.appendChild(pCliente);
            info.appendChild(pServico);
            info.appendChild(pDescricao);
            info.appendChild(pValor);
            info.appendChild(pData);

            // Botão exclusivo por pedido (com confirm nativo)
            const btnApagar = document.createElement('button');
            btnApagar.className = 'btn-apagar';
            btnApagar.type = 'button';
            btnApagar.title = 'Apagar pedido';
            btnApagar.innerHTML = '<i class="bi bi-trash"></i> Excluir';
            btnApagar.setAttribute('onclick', `apagarPedido(${pedido?.id ?? 'null'})`);

            card.appendChild(header);
            card.appendChild(info);
            card.appendChild(btnApagar);
            container.appendChild(card);

        } catch (e) {
            console.error(e);
        }
    });
}

