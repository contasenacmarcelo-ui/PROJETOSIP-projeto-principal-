// cliente.js — abre uma "telinha" preta com nome e e-mail do usuário
(function () {
    const btnProfile = document.getElementById('btn-profile');
    const modal = document.getElementById('profileModal');
    const closeBtn = document.getElementById('profileClose');
    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');

    function abrirModal() {
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

        if (user) {
            nameEl.textContent = user.name || '--';
            emailEl.textContent = user.email || '--';
        } else {
            nameEl.textContent = '--';
            emailEl.textContent = '--';
        }

        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
    }

    function fecharModal() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
    }

    if (btnProfile) {
        btnProfile.addEventListener('click', function (e) {
            e.preventDefault();
            abrirModal();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function (e) {
            e.preventDefault();
            fecharModal();
        });
    }

    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) fecharModal();
        });
    }
})();

const btn = document.getElementById("btn-profile");
const menu = document.getElementById("menu");

btn.addEventListener("click", (e) => {
    e.stopPropagation(); // evita conflito
    menu.classList.toggle("hidden");
});

// fechar clicando fora
document.addEventListener("click", () => {
    menu.classList.add("hidden");
});

// impedir que clique dentro feche
menu.addEventListener("click", (e) => {
    e.stopPropagation();
});

const closeBtn = document.getElementById("close-menu");

closeBtn.addEventListener("click", () => {
    menu.classList.add("hidden");
});

// ================= MODAIS CLIENTE =================

// --- LOCALSTORAGE HELPERS ---
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

// --- MODAL VER DETALHES ---
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
        listaPedidos.innerHTML = '<p class="sem-pedidos">Nenhum pedido encontrado.</p>';
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

// --- MODAL NOVO PEDIDO ---
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
    // Data mínima = hoje
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

        const orcamento = {
            id: Date.now(),
            titulo: titulo,
            descricao: descricao,
            tipo: tipo,
            prazo: prazo,
            dataEnvio: new Date().toLocaleString('pt-BR'),
            status: 'Pendente'
        };

        salvarOrcamento(orcamento);
        console.log('Pedido salvo:', orcamento);

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

// --- MODAL SUPORTE ---
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

        const suporte = {
            id: Date.now(),
            assunto: assunto,
            mensagem: mensagem,
            dataEnvio: new Date().toLocaleString('pt-BR'),
            status: 'Aberto'
        };

        salvarSuporte(suporte);
        console.log('Suporte salvo:', suporte);

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

// --- UTILS ---
function mostrarErroCliente(id, msg) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = msg;
        el.classList.add('show');
    }
}
