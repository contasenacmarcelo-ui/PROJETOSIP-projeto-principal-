/* Página dedicada aos modelos de ML (para não mexer na lógica do admia.js) */

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
        corpoElem.innerHTML = mensagemHtml;
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
        mensagemHtml = mensagem || '—';
    } else {
        mensagemHtml = escapeHtml(mensagem || '—').replace(/\n/g, '<br>');
    }
    setModalMensagens(titulo, mensagemHtml, tipo);
};

async function verificarAutenticacao() {
    let token = getToken();
    if (!token) token = localStorage.getItem('access_token');
    if (!token) {
        try {
            const logged = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
            token = logged?.access_token;
        } catch {
            token = null;
        }
    }

    if (!token) {
        window.location.href = '/public/pages/login.html';
        return false;
    }

    try {
        const response = await apiFetch('/auth/me');
        if (!response.ok) {
            localStorage.removeItem('access_token');
            window.location.href = '/public/pages/login.html';
            return false;
        }
        usuarioAtual = await response.json();
        if (usuarioAtual.role !== 'admin') {
            mostrarModalMensagem({
                titulo: 'Acesso negado',
                mensagem: 'Apenas administradores podem acessar este painel.',
                tipo: 'erro'
            });
            return false;
        }
        return true;
    } catch (e) {
        console.error('Erro ao verificar autenticação:', e);
        window.location.href = '/public/pages/login.html';
        return false;
    }
}

function getMlConfig() {
    return [
        {
            arquivo: 'classificador_suporte.py',
            titulo: 'Classificador de Suporte',
            icone: 'bi bi-headset',
            explicacao: 'Classifica chamados de suporte em categoria e prioridade com base na descrição.',
            rota: '/ml/classificador-suporte',
            inputs: () => `
                <label>Descrição</label>
                <textarea id="mlInputDescricao" rows="5" style="width:100%;padding:10px;background:#021124;border:1px solid #2d4464;color:white;border-radius:8px;" placeholder="Descreva o problema..."></textarea>
            `,
            montarPayload: () => {
                const descricao = document.getElementById('mlInputDescricao')?.value || '';
                if (!descricao.trim()) throw new Error('Informe a descrição.');
                return { descricao };
            }
        },
        {
            arquivo: 'extrator_tags.py',
            titulo: 'Extrator de Tags',
            icone: 'bi bi-tags',
            explicacao: 'Extrai tags e tecnologias relevantes a partir de descrições de projetos.',
            rota: '/ml/extrator-tags',
            inputs: () => `
                <label>Descrição</label>
                <textarea id="mlInputDescricao" rows="5" style="width:100%;padding:10px;background:#021124;border:1px solid #2d4464;color:white;border-radius:8px;" placeholder="Cole a descrição do projeto..."></textarea>
            `,
            montarPayload: () => {
                const descricao = document.getElementById('mlInputDescricao')?.value || '';
                if (!descricao.trim()) throw new Error('Informe a descrição.');
                return { descricao };
            }
        },
        {
            arquivo: 'estimador_orcamento.py',
            titulo: 'Estimador de Orçamento',
            icone: 'bi bi-cash-coin',
            explicacao: 'Estima custos de projetos com base no tipo do serviço e parâmetros.',
            rota: '/ml/estimador-orcamento',
            inputs: () => `
                <label>Tipo de Serviço</label>
                <input id="mlInputTipoServico" type="text" value="sistema" style="width:100%;padding:10px;background:#021124;border:1px solid #2d4464;color:white;border-radius:8px;" />
                <label style="margin-top:10px;">Parâmetros (JSON)</label>
                <textarea id="mlInputParametros" rows="5" style="width:100%;padding:10px;background:#021124;border:1px solid #2d4464;color:white;border-radius:8px;" placeholder='{"valor":1000,"paginas":5}'></textarea>
            `,
            montarPayload: () => {
                const tipo_servico = document.getElementById('mlInputTipoServico')?.value || 'website';
                const raw = document.getElementById('mlInputParametros')?.value || '{}';
                let parametros = {};
                try { parametros = JSON.parse(raw); } catch { throw new Error('Parâmetros JSON inválidos.'); }
                return { tipo_servico, parametros };
            }
        },
        {
            arquivo: 'recomendador_servicos.py',
            titulo: 'Recomendador de Serviços',
            icone: 'bi bi-lightbulb',
            explicacao: 'Sugere serviços com base no perfil do cliente, budget e necessidades.',
            rota: '/ml/recomendador-servicos',
            inputs: () => `
                <label>Tipo de Cliente</label>
                <input id="mlInputTipoCliente" type="text" value="empresa" style="width:100%;padding:10px;background:#021124;border:1px solid #2d4464;color:white;border-radius:8px;" />
                <label style="margin-top:10px;">Budget</label>
                <input id="mlInputBudget" type="number" value="5000" style="width:100%;padding:10px;background:#021124;border:1px solid #2d4464;color:white;border-radius:8px;" />
                <label style="margin-top:10px;">Necessidades</label>
                <textarea id="mlInputNecessidades" rows="4" style="width:100%;padding:10px;background:#021124;border:1px solid #2d4464;color:white;border-radius:8px;" placeholder="Quais são as necessidades?"></textarea>
            `,
            montarPayload: () => {
                const tipo_cliente = document.getElementById('mlInputTipoCliente')?.value || 'empresa';
                const budget = Number(document.getElementById('mlInputBudget')?.value || 0);
                const necessidades = document.getElementById('mlInputNecessidades')?.value || '';
                return { tipo_cliente, budget, necessidades };
            }
        },
        {
            arquivo: 'clustering_clientes.py',
            titulo: 'Clustering de Clientes',
            icone: 'bi bi-diagram-3',
            explicacao: 'Agrupa clientes em clusters com base no histórico informado.',
            rota: '/ml/clustering-cliente',
            inputs: () => `
                <label>Histórico (JSON)</label>
                <textarea id="mlInputHistorico" rows="5" style="width:100%;padding:10px;background:#021124;border:1px solid #2d4464;color:white;border-radius:8px;" placeholder='{"pedidos_totais":5,"valor_total_gasto":8000}'></textarea>
            `,
            montarPayload: () => {
                const raw = document.getElementById('mlInputHistorico')?.value || '{}';
                let historico = {};
                try { historico = JSON.parse(raw); } catch { throw new Error('Histórico JSON inválido.'); }
                return { historico };
            }
        }
    ];
}

window.logout = function () {
    localStorage.removeItem('access_token');
    localStorage.removeItem('loggedInUser');
    window.location.href = '/public/pages/login.html';
};

async function executarMl(config) {
    try {
        const payload = config.montarPayload();

        const resp = await fetch(`${API_BASE}${config.rota}`, {
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

        const container = document.getElementById('ml-container');
        if (container) {
            container.innerHTML = `
                <div class="cards-row" style="grid-column: 1 / -1; padding: 0;">
                    <div style="padding:20px;background:style="padding:20px;background:#fff; border-radius:18px;"; border-radius:18px;">
                        <h2>Resultado ML</h2>
                        <pre style="white-space:pre-wrap;word-break:break-word;background:#021124;padding:15px;border-radius:8px;">${escapeHtml(JSON.stringify(data, null, 2))}</pre>
                    </div>
                </div>
            `;
        }

        mostrarModalMensagem({
            titulo: 'ML executado',
            mensagem: 'Resultado exibido na seção abaixo.',
            tipo: 'sucesso'
        });
        window.fecharModalMensagem();
    } catch (e) {
        console.error('Erro ao executar ML:', e);
        mostrarModalMensagem({
            titulo: 'Erro ao executar ML',
            mensagem: (e && e.message) ? e.message : 'Erro interno',
            tipo: 'erro'
        });
    }
}

function renderMlCards() {
    const container = document.getElementById('ml-cards');
    if (!container) return;

    const modelos = getMlConfig();

    container.innerHTML = '';

    modelos.forEach((m) => {
        const card = document.createElement('div');
        card.className = 'ml-card';
        card.innerHTML = `
            <h3><i class="${m.icone}"></i> ${m.titulo}</h3>
            <p>${m.explicacao}</p>
            <button class="btn-testar btn-add" type="button" onclick="window.__runMl('${m.arquivo}')">
                <i class="bi bi-play-circle"></i> Testar
            </button>
        `;
        container.appendChild(card);
    });
}

window.__runMl = function (arquivo) {
    const modelos = getMlConfig();
    const cfg = modelos.find(x => x.arquivo === arquivo);
    if (!cfg) return;

    const mensagemHtml = `
        <div style="display:flex;flex-direction:column;gap:12px;">
            ${cfg.inputs()}
            <button class="btn-add" type="button" onclick="window.__confirmRun('${arquivo}')" style="margin-top:12px;">
                Executar ML
            </button>
        </div>
    `;

    mostrarModalMensagem({
        titulo: cfg.titulo,
        mensagem: mensagemHtml,
        tipo: 'info',
        html: true
    });
};

window.__confirmRun = function (arquivo) {
    const modelos = getMlConfig();
    const cfg = modelos.find(x => x.arquivo === arquivo);
    if (!cfg) return;
    executarMl(cfg);
};

async function main() {
    const ok = await verificarAutenticacao();
    if (!ok) return;

    renderMlCards();

    // Container inicial vazio, mas não quebramos nada.
    const container = document.getElementById('ml-container');
    if (container) container.innerHTML = '';
}

document.addEventListener('DOMContentLoaded', main);

