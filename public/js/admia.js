let usuarioAtual = null;

// Verificar autenticação ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    await verificarAutenticacao();
    if (usuarioAtual) {
        initializeAdmin();
    }
});

// Verificar se é admin
async function verificarAutenticacao() {
    const token = getToken();
    if (!token) {
        window.location.href = '/public/pages/login.html';
        return;
    }

    try {
        const response = await apiFetch('/auth/me', { contentType: false });

        if (response.ok) {
            usuarioAtual = await response.json();
            if (usuarioAtual.role !== 'admin') {
                alert('Acesso negado! Apenas administradores.');
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

    // Evento do botão de logout
    document.querySelectorAll('.btn-logout, .header-logout').forEach(btn => {
        btn.addEventListener('click', logout);
    });
}

function setupModals() {
    const modal = document.getElementById("modal");
    const modalDetalhes = document.getElementById("modal-detalhes");

    window.abrirModal = function() {
        if (modal) modal.style.display = "block";
        setTimeout(() => {
            const nomeInput = document.getElementById("nome");
            if (nomeInput) nomeInput.focus();
        }, 100);
    };

    window.fecharModal = function() {
        if (modal) modal.style.display = "none";
    };

    window.abrirModalDetalhes = function() {
        if (modalDetalhes) modalDetalhes.style.display = "block";
    };

    window.fecharModalDetalhes = function() {
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
            headers: apiHeaders(false)
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
        const response = await fetch(`${API_BASE}/admin/clientes`, {
            headers: apiHeaders(false)
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
        row.innerHTML = `
            <td>${cliente.id}</td>
            <td>${cliente.nome}</td>
            <td>${cliente.email}</td>
            <td>${cliente.status}</td>
            <td>${cliente.num_pedidos}</td>
            <td>${cliente.num_chamados}</td>
            <td>R$ ${cliente.total_gasto.toFixed(2)}</td>
            <td>${ultimoLogin}</td>
            <td>${emailVerificado}</td>
            <td>
                <button onclick="verDetalhes(${cliente.id})" class="btn-detalhes" title="Ver Detalhes">
                    <i class="bi bi-eye-fill"></i> Ver
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Ver detalhes do cliente
async function verDetalhes(clienteId) {
    try {
        const response = await fetch(`${API_BASE}/admin/cliente/${clienteId}`, {
            headers: apiHeaders(false)
        });

        if (response.ok) {
            const data = await response.json();
            exibirModalDetalhes(data);
        }
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        alert('Erro ao carregar detalhes do cliente');
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
    if (detPedidos) detPedidos.innerHTML = pedidosHTML;

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
        detSuportes.innerHTML = suportesHTML;
        // Adicionar ML Insights
        const mlHTML = `
            <div style="background:#f0f4f8;padding:15px;border-radius:8px;margin-top:15px;">
                <h4>ML Insights</h4>
                <p><strong>Taxa de Conclusão:</strong> ${data.resumo.taxa_conclusao}%</p>
                <p><strong>Valor Total:</strong> R$ ${data.resumo.valor_total.toFixed(2)}</p>
                <p><strong>Tickets Abertos:</strong> ${data.chamados.filter(c => c.status === 'aberto').length}</p>
            </div>
        `;
        detSuportes.innerHTML += mlHTML;
    }

    modal.style.display = 'block';
    window.abrirModalDetalhes();
}

// Carregar relatório de ML
async function carregarRelatorioML() {
    try {
        const response = await fetch(`${API_BASE}/admin/relatorio/ml`, {
            headers: apiHeaders(false)
        });

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
    const container = document.getElementById('ml-report-container') || document.body;
    
    const htmlContent = `
        <div style="padding:20px;background:#fff;">
            <h2>Relatório de Machine Learning</h2>
            
            <section style="margin:20px 0;padding:15px;background:#f9f9f9;border-radius:8px;">
                <h3>Classificador de Suporte</h3>
                <ul>
                    ${data.classificador_suporte.categorias.map(c => 
                        `<li>${c.categoria}: ${c.count} chamados</li>`
                    ).join('')}
                </ul>
            </section>

            <section style="margin:20px 0;padding:15px;background:#f9f9f9;border-radius:8px;">
                <h3>Recomendador de Serviços</h3>
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="background:#e0e0e0;">
                            <th style="padding:10px;text-align:left;">Tipo de Serviço</th>
                            <th style="padding:10px;text-align:left;">Solicitações</th>
                            <th style="padding:10px;text-align:left;">Valor Médio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.recomendador_servicos.map(r => `
                            <tr style="border-bottom:1px solid #ddd;">
                                <td style="padding:10px;">${r.tipo}</td>
                                <td style="padding:10px;">${r.count}</td>
                                <td style="padding:10px;">R$ ${r.valor_medio.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </section>

            <section style="margin:20px 0;padding:15px;background:#f9f9f9;border-radius:8px;">
                <h3>Estimador de Orçamento</h3>
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="background:#e0e0e0;">
                            <th style="padding:10px;text-align:left;">Tipo</th>
                            <th style="padding:10px;text-align:left;">Valor Médio</th>
                            <th style="padding:10px;text-align:left;">Solicitações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.estimador_orcamento.map(e => `
                            <tr style="border-bottom:1px solid #ddd;">
                                <td style="padding:10px;">${e.tipo}</td>
                                <td style="padding:10px;">R$ ${e.valor_medio.toFixed(2)}</td>
                                <td style="padding:10px;">${e.count}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </section>
        </div>
    `;

    if (document.getElementById('ml-report-container')) {
        document.getElementById('ml-report-container').innerHTML = htmlContent;
    } else {
        alert(htmlContent);
    }
}

// Adicionar usuário
window.adicionarUsuario = async function() {
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const telefone = document.getElementById('telefone').value;

    if (!nome || !email) {
        alert('Nome e email são obrigatórios');
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
            alert('Usuário adicionado com sucesso');
            window.fecharModal();
            carregarClientes();
            // Limpar campos
            document.getElementById('nome').value = '';
            document.getElementById('email').value = '';
            document.getElementById('telefone').value = '';
        } else {
            const error = await response.json();
            alert(error.error || 'Erro ao adicionar usuário');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao adicionar usuário');
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
        msgDiv.innerHTML = `
            <div class="mensagem-header">
                <strong>${msg.nome}</strong> (${msg.email})
                <span class="status ${msg.status}">${msg.status}</span>
            </div>
            <div class="mensagem-titulo">${msg.titulo}</div>
            <div class="mensagem-descricao">${msg.descricao}</div>
            <div class="mensagem-acoes">
                <button onclick="responderMensagem(${msg.id})" class="btn-responder">Responder</button>
                <button onclick="marcarResolvido(${msg.id})" class="btn-resolver">Marcar Resolvido</button>
            </div>
        `;
        container.appendChild(msgDiv);
    });
}

// Responder mensagem
async function responderMensagem(chamadoId) {
    const resposta = prompt('Digite sua resposta:');
    if (!resposta) return;

    const token = getToken();
    if (!token) {
        alert('Sessão expirada. Faça login novamente.');
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
            alert('Resposta enviada com sucesso!');
            carregarMensagensSuporte();
        } else {
            alert('Erro ao enviar resposta');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao enviar resposta');
    }
}

// Marcar como resolvido
async function marcarResolvido(chamadoId) {
    const token = getToken();
    if (!token) {
        alert('Sessão expirada. Faça login novamente.');
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
            alert('Chamado marcado como resolvido!');
            carregarMensagensSuporte();
        } else {
            alert('Erro ao marcar como resolvido');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao marcar como resolvido');
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

        if (response.ok) {
            const data = await response.json();
            exibirPedidos(data.pedidos);
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
        } else {
            alert('Erro ao atualizar status');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao atualizar status');
    }
}

// Testar modelo (placeholder)
function testarModelo(arquivo) {
    alert(`Teste do modelo ${arquivo} não implementado ainda.`);
}


