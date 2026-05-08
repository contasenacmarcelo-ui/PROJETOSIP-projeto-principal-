const API_BASE = 'http://localhost:5000/api';
let token = localStorage.getItem('access_token');
let usuarioAtual = null;

// Verificar autenticação ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacao();
    initializeAdmin();
});

// Verificar se é admin
async function verificarAutenticacao() {
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            usuarioAtual = await response.json();
            if (usuarioAtual.role !== 'admin') {
                alert('Acesso negado! Apenas administradores.');
                window.location.href = 'index.html';
            }
        } else {
            localStorage.removeItem('access_token');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
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

    // Evento do botão de logout
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
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
            headers: { 'Authorization': `Bearer ${token}` }
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
    updateElement('receita-total', `R$ ${data.receita_total.toFixed(2)}`);
}

// Carregar lista de clientes
async function carregarClientes() {
    try {
        const response = await fetch(`${API_BASE}/admin/clientes`, {
            headers: { 'Authorization': `Bearer ${token}` }
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
        row.innerHTML = `
            <td>${cliente.id}</td>
            <td>${cliente.nome}</td>
            <td>${cliente.email}</td>
            <td>${cliente.status}</td>
            <td>${cliente.num_pedidos}</td>
            <td>${cliente.num_chamados}</td>
            <td>R$ ${cliente.valor_total_pedidos.toFixed(2)}</td>
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
            headers: { 'Authorization': `Bearer ${token}` }
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
            headers: { 'Authorization': `Bearer ${token}` }
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

// Logout
function logout() {
    localStorage.removeItem('access_token');
    window.location.href = 'login.html';
}


