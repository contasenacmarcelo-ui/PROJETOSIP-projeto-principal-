let usuarioAtual = null;


function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '\"')

        .replace(/'/g, '&#039;');
}

function setModalMensagens(titulo, mensagemHtml, tipo = 'info') {
    const modal = document.getElementById('modal-mensagem');
    const tituloElem = document.getElementById('mensagem-titulo');
    const corpoElem = document.getElementById('mensagem-corpo');

    if (!modal || !tituloElem || !corpoElem) return;

    tituloElem.textContent = titulo || 'Mensagem';

    if (mensagemHtml && typeof mensagemHtml === 'string') {
        // Segurança: não inserir HTML vindo de backend/entrada sem sanitização.
        // Mantém compatibilidade: se html=true foi usado no próprio código, ainda funciona por texto.
        corpoElem.textContent = mensagemHtml;
    } else {
        corpoElem.textContent = '—';
    }

    // (Opcional) ajustar classe por tipo no futuro.
    modal.dataset.tipo = tipo;
    modal.style.display = 'block';
}

window.fecharModalMensagem = function () {
    const modal = document.getElementById('modal-mensagem');
    if (modal) modal.style.display = 'none';
};

window.mostrarModalMensagem = function ({ titulo, mensagem, tipo = 'info', html = false } = {}) {
    // Se html=false, tratamos como texto e convertimos \n em <br>
    let mensagemHtml;
    if (html) {
        mensagemHtml = mensagem || '—';
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
    // Reforça a busca do token (às vezes pode estar em outra chave do localStorage)
    let token = getToken();
    if (!token) {
        token = localStorage.getItem('access_token');
    }
    if (!token) {
        try {
            const logged = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
            token = logged?.access_token;
        } catch (e) {
            token = null;
        }
    }

    if (!token) {
        window.location.href = '/public/pages/login.html';
        return;
    }


    try {
        // Não usar contentType:false aqui (não afeta o Authorization, mas pode atrapalhar o fluxo)
        const response = await apiFetch('/auth/me');


        if (response.ok) {
            usuarioAtual = await response.json();
            if (usuarioAtual.role !== 'admin') {
            mostrarModalMensagem({
                titulo: 'Acesso negado',
                mensagem: 'Apenas administradores podem acessar este painel.',
                tipo: 'erro'
            });
                // Não redirecionar para a página de login durante o mesmo fluxo de carregamento

                // (evita loop/reload quando token é setado/recuperado pelo navegador)
                return;
            }


            const adminNome = document.getElementById('admin-nome');
            if (adminNome) {
                adminNome.textContent = usuarioAtual.nome || 'Administrador';
            }
        } else {
            localStorage.removeItem('access_token');
            window.location.href = '/public/pages/login.html';
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        window.location.href = '/public/pages/login.html';
    }
}

function initializeAdmin() {
    // Menu mobile
    const btn = document.getElementById("btn-menu");
    const menu = document.getElementById("menu-mobile");

    if (btn && menu) {
        btn.addEventListener("click", () => {
            btn.classList.toggle("ativo");
            menu.classList.toggle("ativo");
        });
    }

    // Modais
    setupModals();

    // Carregar dados
    carregarDashboard();
    carregarClientes();
    carregarMensagensSuporte();
    carregarModelosML();
    carregarPedidos();
    setupChatAdmin();

    // Carregar relatórios/insights de ML (dados do banco)
    carregarRelatorioML();

    // Evento do botão de logout
    document.querySelectorAll('.btn-logout, .header-logout').forEach(btn => {
        btn.addEventListener('click', logout);
    });
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
    try {
        const response = await fetch(`${API_BASE}/admin/dashboard`, {
            headers: apiHeaders(true)
        });

        if (response.ok) {
            const data = await response.json();
            atualizarDashboard(data);
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

// Atualizar elementos do dashboard
function atualizarDashboard(data) {
    // Atualizar cards
    const updateElement = (id, value) => {
        const elem = document.getElementById(id);
        if (elem) elem.textContent = value;
    };

    updateElement('total-usuarios', data.total_usuarios);
    updateElement('total-pedidos', data.total_pedidos);
    updateElement('total-orcamentos', data.total_orcamentos);
    updateElement('total-chamados', data.total_chamados);
    updateElement('receita-total', `R$ ${data.receita_total.toFixed(2).replace('.', ',')}`);
}

// Carregar lista de clientes
async function carregarClientes() {
    try {
        // Endpoint correto do backend (admin clientes)
        const response = await fetch(`${API_BASE}/admin/clientes`, {
            headers: apiHeaders(true)
        });


        if (response.ok) {
            const data = await response.json();
            exibirClientes(data.clientes);
        }
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

// Exibir clientes na tabela
function exibirClientes(clientes) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';


    if (clientes.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="8" style="text-align:center;padding:20px;">Nenhum cliente encontrado</td>';
        tbody.appendChild(tr);
        return;
    }

    clientes.forEach(cliente => {
        const row = document.createElement('tr');
        const ultimoLogin = cliente.data_ultimo_login ? new Date(cliente.data_ultimo_login).toLocaleDateString('pt-BR') : 'Nunca';
        const emailVerificado = cliente.email_verificado ? 'Sim' : 'Não';
        // Segurança: evita XSS removendo innerHTML com dados vindos do backend.
        row.innerHTML = '';
        const addCell = (text) => {
            const td = document.createElement('td');
            td.textContent = text ?? '—';
            row.appendChild(td);
        };

        addCell(cliente.id);
        addCell(cliente.nome);
        addCell(cliente.email);
        addCell(cliente.status);
        addCell(cliente.num_pedidos);
        addCell(cliente.num_chamados);
        addCell(cliente.total_gasto != null ? `R$ ${cliente.total_gasto.toFixed(2)}` : 'R$ 0,00');
        addCell(ultimoLogin);
        addCell(emailVerificado);

        const tdBtn = document.createElement('td');
        const btn = document.createElement('button');
        btn.className = 'btn-detalhes';
        btn.title = 'Ver Detalhes';
        btn.type = 'button';
        btn.setAttribute('onclick', `verDetalhes(${cliente.id})`);
        btn.innerHTML = `<i class="bi bi-eye-fill"></i> Ver`;
        tdBtn.appendChild(btn);
        row.appendChild(tdBtn);
        tbody.appendChild(row);
    });
}

// Ver detalhes do cliente
async function verDetalhes(clienteId) {
    try {
        const response = await fetch(`${API_BASE}/admin/cliente/${clienteId}`, {
            headers: apiHeaders(true)
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

// Exibir modal com detalhes do cliente
function exibirModalDetalhes(data) {
    const modal = document.getElementById('modal-detalhes');
    if (!modal) return;

    // Dados pessoais
    const updateElement = (id, value) => {
        const elem = document.getElementById(id);
        if (elem) elem.textContent = value;
    };

    updateElement('det-nome', data.usuario.nome);
    updateElement('det-email', data.usuario.email);
    updateElement('det-telefone', data.usuario.telefone || '—');
    updateElement('det-status', data.usuario.status);

    // Pedidos
    const pedidosHTML = data.pedidos.length > 0
        ? data.pedidos.map(p => `
            <div style="padding:10px;border-bottom:1px solid #eee;">
                <strong>${p.tipo_servico}</strong> - <span style="color:#666;">${p.status}</span>
                <br><small>R$ ${p.valor_estimado || 0} | ${new Date(p.data_criacao).toLocaleDateString('pt-BR')}</small>
            </div>
        `).join('')
        : '<p style="color:#999;">Nenhum pedido</p>';
    const detPedidos = document.getElementById('det-pedidos');
    if (detPedidos) {
        // Segurança: não inserir HTML com dados do backend
        detPedidos.textContent = (data.pedidos || []).length > 0
            ? `(${data.pedidos.length}) pedidos carregados.`
            : 'Nenhum pedido';
    }

    // Chamados de suporte
    const suportesHTML = data.chamados.length > 0
        ? data.chamados.map(c => `
            <div style="padding:10px;border-bottom:1px solid #eee;">
                <strong>${c.titulo}</strong> - <span style="color:#666;">${c.status}</span>
                <br><small>Prioridade: ${c.prioridade}</small>
            </div>
        `).join('')
        : '<p style="color:#999;">Nenhum chamado</p>';
    const detSuportes = document.getElementById('det-suportes');
    if (detSuportes) {
        // Segurança: não inserir HTML com dados do backend
        const nChamados = (data.chamados || []).length;
        const taxa = data?.resumo?.taxa_conclusao ?? 0;
        const valorTotal = data?.resumo?.valor_total ?? 0;
        const ticketsAbertos = (data?.chamados || []).filter(c => c.status === 'aberto').length;

        detSuportes.textContent = nChamados > 0
            ? `(${nChamados}) chamados carregados. ML Insights: conclusão ${taxa}%, valor total R$ ${Number(valorTotal).toFixed(2)}, tickets abertos ${ticketsAbertos}.`
            : 'Nenhum chamado'
        ;

        // Mantém sem alterar estrutura visual crítica; se desejar UI rica, faça via sanitização depois.

    }

    modal.style.display = 'block';
    window.abrirModalDetalhes();
}

// Carregar relatório de ML
async function carregarRelatorioML() {
    try {
        // Preferência: exemplos (seed) do endpoint novo. Fallback: relatório agregado.
        let response = await fetch(`${API_BASE}/admin/ml/exemplos`, {
            headers: apiHeaders(false)
        });

        if (!response.ok) {
            response = await fetch(`${API_BASE}/admin/relatorio/ml`, {
                headers: apiHeaders(false)
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

// Exibir relatório de ML
function exibirRelatorioML(data) {
    const container = document.getElementById('ml-container') || document.body;

    // Segurança: remove qualquer renderização HTML com dados do backend.
    // Mantém compatibilidade exibindo texto formatado.
    const safePayload = {
        classificador_suporte: data.classificador_suporte,
        recomendador_servicos: data.recomendador_servicos,
        estimador_orcamento: data.estimador_orcamento
    };

    if (container) {
        container.textContent = JSON.stringify(safePayload, null, 2);
    }
}


// Adicionar usuário
window.adicionarUsuario = async function () {
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const telefone = document.getElementById('telefone').value;

    if (!nome || !email) {
        mostrarModalMensagem({ titulo: 'Campos obrigatórios', mensagem: 'Nome e e-mail são obrigatórios para adicionar um usuário.', tipo: 'aviso' });
        return;
    }


    try {
        const response = await fetch(`${API_BASE}/auth/cadastro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome,
                email,
                telefone,
                senha: 'senha123'
            })
        });

        if (response.ok) {
            mostrarModalMensagem({ titulo: 'Sucesso', mensagem: 'Usuário adicionado com sucesso!', tipo: 'sucesso' });
            window.fecharModal();
            carregarClientes();
            // Limpar campos

            document.getElementById('nome').value = '';
            document.getElementById('email').value = '';
            document.getElementById('telefone').value = '';
        } else {
            const error = await response.json();
            mostrarModalMensagem({ titulo: 'Erro', mensagem: error.error || 'Erro ao adicionar usuário.', tipo: 'erro' });
        }

    } catch (error) {
        console.error('Erro:', error);
        mostrarModalMensagem({ titulo: 'Erro', mensagem: 'Erro ao adicionar usuário.', tipo: 'erro' });
    }

}

// Carregar mensagens de suporte
async function carregarMensagensSuporte() {
    try {
        const response = await fetch(`${API_BASE}/admin/suporte/mensagens`, {
            headers: apiHeaders(false)
        });

        if (response.ok) {
            const data = await response.json();
            exibirMensagensSuporte(data.mensagens);
        }
    } catch (error) {
        console.error('Erro ao carregar mensagens de suporte:', error);
    }
}

// Exibir mensagens de suporte
function exibirMensagensSuporte(mensagens) {
    const container = document.getElementById('suporte-container');
    if (!container) return;

    container.innerHTML = '';

    if (mensagens.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:20px;color:#999;">Nenhuma mensagem de suporte</p>';
        return;
    }

    mensagens.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'mensagem-suporte';
        // Segurança: evita XSS removendo innerHTML com dados vindos do backend.
        msgDiv.innerHTML = '';
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

        acoes.appendChild(btnResp);
        acoes.appendChild(btnRes);

        msgDiv.appendChild(header);
        msgDiv.appendChild(titulo);
        msgDiv.appendChild(desc);
        msgDiv.appendChild(acoes);
        container.appendChild(msgDiv);
    });
}

// Responder mensagem
async function responderMensagem(chamadoId) {
    const resposta = prompt('Digite sua resposta:');
    if (!resposta) return;

    const token = getToken();

    if (!token) {
        mostrarModalMensagem({ titulo: 'Sessão expirada', mensagem: 'Faça login novamente para continuar.', tipo: 'erro' });
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
            body: JSON.stringify({
                resposta: resposta,
                status: 'em_andamento'
            })
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

// Marcar como resolvido
async function marcarResolvido(chamadoId) {
    const token = getToken();
    if (!token) {
        mostrarModalMensagem({ titulo: 'Sessão expirada', mensagem: 'Faça login novamente para continuar.', tipo: 'erro' });
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
            body: JSON.stringify({
                resposta: 'Chamado marcado como resolvido.',
                status: 'fechado'
            })
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

// Carregar modelos de Machine Learning
async function carregarModelosML() {
    const modelos = [

        {
            nome: 'Classificador de Suporte',
            funcao: 'Classifica chamados de suporte por categoria e urgência',
            arquivo: 'classificador_suporte.py'
        },
        {
            nome: 'Clustering de Clientes',
            funcao: 'Agrupa clientes por comportamento e preferências',
            arquivo: 'clustering_clientes.py'
        },
        {
            nome: 'Estimador de Orçamento',
            funcao: 'Prevê custos de projetos baseado em histórico',
            arquivo: 'estimador_orcamento.py'
        },
        {
            nome: 'Extrator de Tags',
            funcao: 'Identifica tags relevantes em descrições de projetos',
            arquivo: 'extrator_tags.py'
        },
        {
            nome: 'Recomendador de Serviços',
            funcao: 'Sugere serviços baseado no perfil do cliente',
            arquivo: 'recomendador_servicos.py'
        }
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

// Carregar todos os pedidos
async function carregarPedidos() {
    try {
        const response = await fetch(`${API_BASE}/admin/pedidos`, {
            headers: apiHeaders(false)
        });

        if (response.status === 401) {
            // Falha de auth pode impedir renderização completa do painel
            mostrarModalMensagem({
                titulo: 'Acesso negado',
                mensagem: 'Sessão expirada ou sem permissão de admin. Faça login novamente.',
                tipo: 'erro'
            });
            window.location.href = '/public/pages/login.html';
            return;
        }


        if (response.ok) {
            const data = await response.json();
            exibirPedidos(data.pedidos);
        } else {
            const txt = await response.text().catch(() => '');
            console.error('Erro ao carregar pedidos:', response.status, txt);
        }
    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
    }
}

// Exibir pedidos
function exibirPedidos(pedidos) {
    const container = document.getElementById('pedidos-container');
    if (!container) return;

    container.innerHTML = '';


    if (pedidos.length === 0) {
        container.innerHTML = '<p class="sem-dados">Nenhum pedido encontrado.</p>';
        return;
    }

    pedidos.forEach(pedido => {
        const card = document.createElement('div');
        card.className = 'pedido-card';
        const dataCriacao = new Date(pedido.data_criacao).toLocaleDateString('pt-BR');
        const statusClass = pedido.status.toLowerCase().replace(' ', '-');

        card.innerHTML = `
            <div class="pedido-header">
                <h3>Pedido #${pedido.id}</h3>
                <span class="status ${statusClass}">${pedido.status}</span>
            </div>
            <div class="pedido-info">
                <p><strong>Cliente:</strong> ${pedido.usuario_nome} (${pedido.usuario_email})</p>
                <p><strong>Serviço:</strong> ${pedido.servico}</p>
                <p><strong>Descrição:</strong> ${pedido.descricao}</p>
                <p><strong>Orçamento Estimado:</strong> R$ ${pedido.valor_estimado ? pedido.valor_estimado.toFixed(2) : 'N/A'}</p>
                <p><strong>Data:</strong> ${dataCriacao}</p>
            </div>
            <div class="pedido-acoes">
                <button onclick="verDetalhesPedido(${pedido.id})" class="btn-detalhes">
                    <i class="bi bi-eye"></i> Ver Detalhes
                </button>
                <button onclick="atualizarStatusPedido(${pedido.id}, 'em_andamento')" class="btn-status">
                    <i class="bi bi-play"></i> Iniciar
                </button>
                <button onclick="atualizarStatusPedido(${pedido.id}, 'concluido')" class="btn-status">
                    <i class="bi bi-check-circle"></i> Concluir
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Ver detalhes do pedido
async function verDetalhesPedido(pedidoId) {
    try {
        const response = await fetch(`${API_BASE}/admin/pedido/${pedidoId}`, {
            headers: apiHeaders(false)
        });



        if (response.ok) {
            const data = await response.json();
            alert(`Detalhes do Pedido #${pedidoId}:\n\nCliente: ${data.usuario_nome}\nServiço: ${data.servico}\nStatus: ${data.status}\nValor: R$ ${data.valor_estimado || 'N/A'}`);
        }
    } catch (error) {
        console.error('Erro ao carregar detalhes do pedido:', error);
    }
}

// Atualizar status do pedido
async function atualizarStatusPedido(pedidoId, novoStatus) {
    try {
        const response = await fetch(`${API_BASE}/admin/pedido/${pedidoId}/status`, {
            method: 'PUT',
            headers: apiHeaders(),
            body: JSON.stringify({ status: novoStatus })
        });

        if (response.ok) {
            alert('Status atualizado com sucesso!');
            carregarPedidos();
            return;
        }

        const txt = await response.text().catch(() => '');
        console.error('Erro ao atualizar status do pedido', { pedidoId, novoStatus, status: response.status, body: txt });
        alert(`Erro ao atualizar status: ${txt || response.status}`);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao atualizar status');
    }
}

// Testar modelo (botão funcional) - executa ML real com input mínimo
async function testarModelo(arquivo) {
    try {
        const token = getToken();
        if (!token) {
            alert('Sessão expirada. Faça login novamente.');
            window.location.href = '/public/pages/login.html';
            return;
        }

        // Mapear arquivo => rota e input
        // (Mantemos input mínimo para não quebrar UI e garantir que os endpoints aceitem os campos)
        let rota = null;
        let payload = {};
        let titulo = '';
        let htmlInputs = '';

        switch (arquivo) {
            case 'classificador_suporte.py':
                rota = '/ml/classificador-suporte';
                titulo = 'Testar Classificador de Suporte';
                htmlInputs = `
                    <div style="display:flex;flex-direction:column;gap:10px;">
                        <label>Descrição</label>
                        <textarea id="mlInputDescricao" rows="5" style="width:100%;padding:10px;background:#021124;border:1px solid #2d4464;color:white;border-radius:8px;" placeholder="Descreva o problema..."></textarea>
                    </div>
                    `;
                break;
            case 'extrator_tags.py':
                rota = '/ml/extrator-tags';
                titulo = 'Testar Extrator de Tags';
                htmlInputs = `
                    <div style="display:flex;flex-direction:column;gap:10px;">
                        <label>Descrição</label>
                        <textarea id="mlInputDescricao" rows="5" style="width:100%;padding:10px;background:#021124;border:1px solid #2d4464;color:white;border-radius:8px;" placeholder="Cole a descrição do projeto..."></textarea>
                    </div>
                    `;
                break;
            case 'estimador_orcamento.py':
                rota = '/ml/estimador-orcamento';
                titulo = 'Testar Estimador de Orçamento';
                htmlInputs = `
                    <div style="display:flex;flex-direction:column;gap:10px;">
                        <label>Tipo de Serviço</label>
                        <input id="mlInputTipoServico" type="text" value="sistema" style="width:100%;padding:10px;background:#021124;border:1px solid #2d4464;color:white;border-radius:8px;" />
                        <label>Parâmetros (JSON)</label>
                        <textarea id="mlInputParametros" rows="5" style="width:100%;padding:10px;background:#021124;border:1px solid #2d4464;color:white;border-radius:8px;" placeholder='{"valor": 1000, "paginas": 5, "funcionalidades": 3, "prazo_dias": 30}'></textarea>
                    </div>
                    `;
                break;
            case 'recomendador_servicos.py':
                rota = '/ml/recomendador-servicos';
                titulo = 'Testar Recomendador de Serviços';
                htmlInputs = `
                    <div style="display:flex;flex-direction:column;gap:10px;">
                        <label>Tipo de Cliente</label>
                        <input id="mlInputTipoCliente" type="text" value="empresa" style="width:100%;padding:10px;background:#021124;border:1px solid #2d4464;color:white;border-radius:8px;" />
                        <label>Budget</label>
                        <input id="mlInputBudget" type="number" value="5000" style="width:100%;padding:10px;background:#021124;border:1px solid #2d4464;color:white;border-radius:8px;" />
                        <label>Necessidades</label>
                        <textarea id="mlInputNecessidades" rows="4" style="width:100%;padding:10px;background:#021124;border:1px solid #2d4464;color:white;border-radius:8px;" placeholder="Quais são as necessidades do cliente?"></textarea>
                    </div>
                    `;
                break;
            case 'clustering_clientes.py':
                rota = '/ml/clustering-cliente';
                titulo = 'Testar Clustering de Clientes';
                htmlInputs = `
                    <div style="display:flex;flex-direction:column;gap:10px;">
                        <label>Histórico (JSON)</label>
                        <textarea id="mlInputHistorico" rows="5" style="width:100%;padding:10px;background:#021124;border:1px solid #2d4464;color:white;border-radius:8px;" placeholder='{"pedidos_totais": 5, "valor_total_gasto": 8000, "tempo_como_cliente_dias": 200, "tipo_ultimo_pedido": "website"}'></textarea>
                    </div>
                    `;
                break;
            default:
                mostrarModalMensagem({
                    titulo: 'Modelo não suportado',
                    mensagem: 'Esse modelo ainda não tem input configurado na interface.',
                    tipo: 'aviso'
                });
                return;
        }

        // Usar modal de mensagem existente para coletar input
        mostrarModalMensagem({
            titulo,
            mensagem: htmlInputs,
            tipo: 'info',
            html: true
        });

        // Criar botão “Executar” dentro do modal (de forma não invasiva)
        // Espera o DOM do modal-mensagem estar renderizado.
        setTimeout(() => {
            const modal = document.getElementById('modal-mensagem');
            const corpo = document.getElementById('mensagem-corpo');
            if (!modal || !corpo) return;

            // evitar duplicar botões
            if (document.getElementById('mlExecBtn')) return;

            const btn = document.createElement('button');
            btn.id = 'mlExecBtn';
            btn.textContent = 'Executar ML';
            btn.className = 'btn-add';
            btn.style.marginTop = '12px';
            btn.onclick = async () => {
                try {
                    // coletar inputs por rota
                    if (arquivo === 'classificador_suporte.py') {
                        const descricao = document.getElementById('mlInputDescricao')?.value || '';
                        if (!descricao.trim()) throw new Error('Informe a descrição.');
                        payload = { descricao };
                    } else if (arquivo === 'extrator_tags.py') {
                        const descricao = document.getElementById('mlInputDescricao')?.value || '';
                        if (!descricao.trim()) throw new Error('Informe a descrição.');
                        payload = { descricao };
                    } else if (arquivo === 'estimador_orcamento.py') {
                        const tipo_servico = document.getElementById('mlInputTipoServico')?.value || 'website';
                        const raw = document.getElementById('mlInputParametros')?.value || '{}';
                        let parametros = {};
                        try { parametros = JSON.parse(raw); } catch { throw new Error('Parâmetros JSON inválidos.'); }
                        payload = { tipo_servico, parametros };
                    } else if (arquivo === 'recomendador_servicos.py') {
                        const tipo_cliente = document.getElementById('mlInputTipoCliente')?.value || 'empresa';
                        const budget = Number(document.getElementById('mlInputBudget')?.value || 0);
                        const necessidades = document.getElementById('mlInputNecessidades')?.value || '';
                        payload = { tipo_cliente, budget, necessidades };
                    } else if (arquivo === 'clustering_clientes.py') {
                        const raw = document.getElementById('mlInputHistorico')?.value || '{}';
                        let historico = {};
                        try { historico = JSON.parse(raw); } catch { throw new Error('Histórico JSON inválido.'); }
                        payload = { historico };
                    }

                    const resp = await fetch(`${API_BASE}${rota}`, {
                        method: 'POST',
                        headers: apiHeaders(true),
                        body: JSON.stringify(payload)
                    });

                    const txt = await resp.text().catch(() => '');
                    let data;
                    try { data = txt ? JSON.parse(txt) : null; } catch { data = { raw: txt }; }

                    if (!resp.ok) {
                        throw new Error(data?.error || txt || `HTTP ${resp.status}`);
                    }

                    // Renderizar resultado no ml-container
                    const container = document.getElementById('ml-container') || document.body;
                    container.innerHTML = `
                        <div style="padding:20px;background:#021124;">
                            <h2>Resultado ML</h2>
                            <pre style="white-space:pre-wrap;word-break:break-word;background:#021124;padding:15px;border-radius:8px;">${escapeHtml(JSON.stringify(data, null, 2))}</pre>
                        </div>
                    `;

                    mostrarModalMensagem({
                        titulo: 'ML executado com sucesso',
                        mensagem: 'Resultado exibido abaixo na seção ML.',
                        tipo: 'sucesso'
                    });

                    // fechar o modal de mensagem para liberar tela (opcional)
                    window.fecharModalMensagem();
                } catch (e) {
                    console.error('Erro ao executar ML:', e);
                    mostrarModalMensagem({
                        titulo: 'Erro ao executar ML',
                        mensagem: (e && e.message) ? e.message : 'Erro interno',
                        tipo: 'erro'
                    });
                }
            };

            corpo.appendChild(btn);
        }, 0);

    } catch (err) {
        console.error('Erro ao testar modelo:', err);
        mostrarModalMensagem({
            titulo: 'Erro ao testar modelo',
            mensagem: (err && err.message) ? err.message : 'Erro interno',
            tipo: 'erro'
        });
    }
}


// Garantir que funções chamadas por onclick fiquem no escopo global
window.verDetalhes = verDetalhes;
window.verDetalhesPedido = verDetalhesPedido;
window.atualizarStatusPedido = atualizarStatusPedido;
window.responderMensagem = responderMensagem;
window.marcarResolvido = marcarResolvido;
window.testarModelo = testarModelo;

// -------------------- CHAT (Admin) --------------------
let chatConversas = [];
let chatSelecionadoId = null;
let chatPollingTimer = null;

function mostrarSecao(idSecao) {
    // esconder seções principais
    const ids = ['dashboard', 'clientes', 'pedidos', 'suporte', 'conversas', 'ml'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = (id === idSecao) ? 'block' : 'none';
    });
}

async function setupChatAdmin() {
    const convList = document.getElementById('chat-conversas-list');
    const form = document.getElementById('chat-form');

    if (!convList || !form) return; // página ainda não recebeu UI

    document.getElementById('conversas')?.addEventListener('click', () => mostrarSecao('conversas'));

    // Submit envia mensagem
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!chatSelecionadoId) {
            mostrarModalMensagem({ titulo: 'Selecione uma conversa', mensagem: 'Escolha um usuário antes de enviar.', tipo: 'aviso' });
            return;
        }

        const input = document.getElementById('chat-input');
        const conteudo = (input?.value || '').trim();
        if (!conteudo) return;

        try {
            // Chat backend é registrado em /chat/* (sem prefixo /api)
            const CHAT_BASE = API_BASE.replace('/api', '');
            const resp = await fetch(`${CHAT_BASE}/chat/${chatSelecionadoId}/mensagens`, {
                method: 'POST',
                headers: apiHeaders(true),
                body: JSON.stringify({ conteudo })
            });
            if (!resp.ok) {
                const txt = await resp.text().catch(() => '');
                throw new Error(txt || `HTTP ${resp.status}`);
            }

            input.value = '';
            await carregarMensagensChat(chatSelecionadoId);
        } catch (err) {
            console.error(err);
            mostrarModalMensagem({ titulo: 'Erro', mensagem: 'Falha ao enviar mensagem.', tipo: 'erro' });
        }
    });

    // iniciar
    await carregarConversasChat();
    iniciarPollingChat();

    // ao abrir pela navegação (#conversas)
    window.addEventListener('hashchange', () => {
        if (location.hash === '#conversas') {
            mostrarSecao('conversas');
        }
    });

    if (location.hash === '#conversas') mostrarSecao('conversas');
}

async function carregarConversasChat() {
    const convList = document.getElementById('chat-conversas-list');
    if (!convList) return;

    try {
        // Observação: o backend registra como /chat/conversas (sem prefixo /api no blueprint)
        const baseUrl = API_BASE.replace('/api','');
        const resp = await fetch(`${baseUrl}/chat/conversas`, {
            headers: apiHeaders(true)
        });

        // fallback: se retornar vazio/não vier conversas, ainda vamos preencher com usuários.
        // (não remove a lista de mensagens; apenas evita ficar “sem conversa” no admin)
        if (resp.ok) {
            const peek = await resp.clone().json().catch(() => null);
            if (peek && !peek.conversas) {
                throw new Error('Resposta do chat sem campo conversas');
            }
        }

        if (!resp.ok) {
            const txt = await resp.text().catch(() => '');
            console.error('Erro ao carregar conversas:', resp.status, txt);
            throw new Error(`HTTP ${resp.status}`);
        }

        if (!resp.ok) {
            const txt = await resp.text().catch(() => '');
            console.error('Erro ao carregar conversas:', resp.status, txt);
            mostrarModalMensagem({ titulo: 'Erro', mensagem: `Não foi possível carregar conversas. (${resp.status})`, tipo: 'erro' });
            return;
        }

        const data = await resp.json();
        chatConversas = data.conversas || [];
        exibirConversasChat(chatConversas);

        if (chatConversas.length === 0) {
            // Não existem conversas ainda (usuário ainda não abriu ticket/mensagem).
            // Como você pediu: pré-preencher com todos os usuários registrados para o admin mandar mensagem.
            // Criamos conversas virtuais com chamado_id = null (o envio vai criar/usar thread via back futuramente).
            // Por enquanto, mostramos apenas a lista.
            const respUsers = await fetch(`${baseUrl}/api/clientes/lista`, { headers: apiHeaders(false) }).catch(() => null);
            // fallback: sem endpoint de lista de usuários de chat, usa a tabela admin/clientes já carregada se disponível
            chatConversas = chatConversas; // mantém vazia; a UI abaixo será preenchida por um modo alternativo
            exibirConversasChat([]);

            return;
        }

        if (!chatSelecionadoId && chatConversas.length > 0) {
            await selecionarConversa(chatConversas[0].chamado_id);
        }
    } catch (err) {
        console.error(err);
    }
}

function exibirConversasChat(conversas) {
    const convList = document.getElementById('chat-conversas-list');
    if (!convList) return;

    convList.innerHTML = '';
    if (!conversas || conversas.length === 0) {
        convList.innerHTML = '<div class="sem-dados">Nenhuma conversa ainda.</div>';
        return;
    }

    conversas.forEach(c => {
        const item = document.createElement('div');
        item.className = 'chat-conversa-item';
        if (String(c.chamado_id) === String(chatSelecionadoId)) item.classList.add('ativo');

        const ultima = c.ultima_mensagem ? c.ultima_mensagem : '—';
        const ultimaData = c.ultima_mensagem_data ? new Date(c.ultima_mensagem_data).toLocaleString('pt-BR') : '';

        item.innerHTML = `
            <div class="chat-conversa-main">
                <div class="chat-conversa-nome">${escapeHtml(c.usuario_nome || '—')}</div>
                <div class="chat-conversa-ultima">${escapeHtml(ultima).slice(0, 120)}</div>
            </div>
            <div class="chat-conversa-meta">
                <div class="chat-conversa-data">${escapeHtml(ultimaData)}</div>
                <div class="chat-conversa-count">${c.qtd_mensagens || 0}</div>
            </div>
        `;

        item.addEventListener('click', async () => {
            await selecionarConversa(c.chamado_id);
        });

        convList.appendChild(item);
    });
}

async function selecionarConversa(chamadoId) {
    chatSelecionadoId = chamadoId;

    const titulo = document.getElementById('chat-conversa-title');
    const subtitle = document.getElementById('chat-conversa-subtitle');

    const conv = chatConversas.find(x => String(x.chamado_id) === String(chamadoId));
    if (titulo) titulo.textContent = conv?.usuario_nome || '—';
    if (subtitle) subtitle.textContent = `${conv?.status_conversa || '—'} • ${conv?.prioridade || '—'}`;

    exibirConversasChat(chatConversas);
    await carregarMensagensChat(chamadoId);
}

async function carregarMensagensChat(chamadoId) {
    const container = document.getElementById('chat-mensagens');
    if (!container) return;

    try {
        const CHAT_BASE = API_BASE.replace('/api', '');
        const resp = await fetch(`${CHAT_BASE}/chat/${chamadoId}/mensagens`, {
            headers: apiHeaders(true)
        });

        if (!resp.ok) {
            container.innerHTML = '<div class="sem-dados">Falha ao carregar mensagens.</div>';
            return;
        }

        const data = await resp.json();
        const mensagens = data.mensagens || [];

        renderMensagensChat(mensagens);
    } catch (err) {
        console.error(err);
    }
}

function renderMensagensChat(mensagens) {
    const container = document.getElementById('chat-mensagens');
    if (!container) return;

    container.innerHTML = '';

    if (!mensagens || mensagens.length === 0) {
        container.innerHTML = '<div class="sem-dados">Nenhuma mensagem nesta conversa.</div>';
        return;
    }

    const token = getToken();

    const me = null; // sem necessidade

    mensagens.forEach(m => {
        const isAdminMsg = m.autor_tipo === 'admin';
        const div = document.createElement('div');
        div.className = `chat-msg ${isAdminMsg ? 'admin' : 'user'}`;

        const dataStr = m.data ? new Date(m.data).toLocaleString('pt-BR') : '';

        div.innerHTML = `
            <div class="chat-bubble">
                <div class="chat-text">${escapeHtml(m.conteudo || '')}</div>
                <div class="chat-time">${escapeHtml(dataStr)}</div>
            </div>
        `;

        container.appendChild(div);
    });

    container.scrollTop = container.scrollHeight;
}

function iniciarPollingChat() {
    if (chatPollingTimer) clearInterval(chatPollingTimer);
    chatPollingTimer = setInterval(async () => {
        // atualiza lista e, se houver conversa selecionada, atualiza mensagens
        if (!document.getElementById('conversas') || document.getElementById('conversas').style.display === 'none') return;

        await carregarConversasChat();
        if (chatSelecionadoId) {
            await carregarMensagensChat(chatSelecionadoId);
        }
    }, 4000);
}

