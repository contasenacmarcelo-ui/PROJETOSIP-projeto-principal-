// ================= SISTEMA DE TOAST =================

function criarToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

function mostrarToast(mensagem, tipo = 'sucesso', duracao = 4000) {
    const container = criarToastContainer();

    // Criar elemento toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;

    // Ícone baseado no tipo
    const icones = {
        sucesso: 'bi-check-circle-fill',
        erro: 'bi-x-circle-fill',
        aviso: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill'
    };

    const icone = icones[tipo] || icones.sucesso;

    toast.innerHTML = `
        <span class="toast-icon"><i class="bi ${icone}"></i></span>
        <span class="toast-mensagem">${mensagem}</span>
        <button class="toast-fechar" onclick="fecharToast(this.parentElement)">&times;</button>
        <div class="toast-progresso" style="animation-duration: ${duracao}ms;"></div>
    `;

    container.appendChild(toast);

    // Forçar reflow para animar
    void toast.offsetWidth;

    // Ativar animação de entrada
    requestAnimationFrame(() => {
        toast.classList.add('ativo');
    });

    // Auto-remover após a duração
    const timeout = setTimeout(() => {
        fecharToast(toast);
    }, duracao);

    // Pausar ao passar o mouse
    toast.addEventListener('mouseenter', () => {
        clearTimeout(timeout);
        const progresso = toast.querySelector('.toast-progresso');
        if (progresso) progresso.style.animationPlayState = 'paused';
    });

    toast.addEventListener('mouseleave', () => {
        const progresso = toast.querySelector('.toast-progresso');
        if (progresso) progresso.style.animationPlayState = 'running';
        setTimeout(() => fecharToast(toast), duracao / 2);
    });
}

function fecharToast(toast) {
    if (!toast || toast.classList.contains('saindo')) return;

    toast.classList.remove('ativo');
    toast.classList.add('saindo');

    setTimeout(() => {
        if (toast.parentElement) {
            toast.parentElement.removeChild(toast);
        }
    }, 400);
}

// Atalhos convenientes
function toastSucesso(mensagem, duracao) {
    mostrarToast(mensagem, 'sucesso', duracao);
}

function toastErro(mensagem, duracao) {
    mostrarToast(mensagem, 'erro', duracao);
}

function toastAviso(mensagem, duracao) {
    mostrarToast(mensagem, 'aviso', duracao);
}

function toastInfo(mensagem, duracao) {
    mostrarToast(mensagem, 'info', duracao);
}
