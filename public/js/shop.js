// ================= MENU MOBILE =================
const btnMenu = document.getElementById("btn-menu");
const menu = document.getElementById("menu-mobile");

btnMenu.addEventListener("click", () => {
    btnMenu.classList.toggle("ativo");
    menu.classList.toggle("ativo");
});

document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !btnMenu.contains(e.target)) {
        menu.classList.remove("ativo");
        btnMenu.classList.remove("ativo");
    }
});


// ================= MODAL =================
const abrirModal = document.getElementById("abrirModal");
const modal = document.getElementById("modalOrcamento");
const fecharModal = document.getElementById("fecharModal");

abrirModal.addEventListener("click", () => {
    modal.classList.add("ativo");
});

fecharModal.addEventListener("click", () => {
    modal.classList.remove("ativo");
});


// ================= LOCALSTORAGE =================
function getOrcamentos() {
    const dados = localStorage.getItem('sip_orcamentos');
    return dados ? JSON.parse(dados) : [];
}

function salvarOrcamento(orcamento) {
    const orcamentos = getOrcamentos();
    orcamentos.push(orcamento);
    localStorage.setItem('sip_orcamentos', JSON.stringify(orcamentos));
}


// ================= VALIDAÇÃO =================
const btnEnviar = document.getElementById("btnEnviar");

const titulo = document.getElementById("titulo");
const descricao = document.getElementById("descricao");
const tipo = document.getElementById("tipo");
const prazo = document.getElementById("prazo");

const erroTitulo = document.getElementById("erro-titulo");
const erroDescricao = document.getElementById("erro-descricao");
const erroTipo = document.getElementById("erro-tipo");
const erroPrazo = document.getElementById("erro-prazo");

const erroGeral = document.querySelector(".modal-erro-geral");


// DATA MÍNIMA = HOJE
const hoje = new Date().toISOString().split("T")[0];
prazo.min = hoje;


// CLICK ENVIAR
btnEnviar.addEventListener("click", () => {

    let valido = true;

    limparErros();

    // TITULO
    if (titulo.value.trim() === "") {
        erroTitulo.textContent = "Título obrigatório";
        titulo.classList.add("input-erro");
        valido = false;
    }

    // DESCRIÇÃO
    if (descricao.value.trim().length < 10) {
        erroDescricao.textContent = "Mínimo de 10 caracteres";
        descricao.classList.add("input-erro");
        valido = false;
    }

    // TIPO
    if (tipo.value === "") {
        erroTipo.textContent = "Selecione um tipo";
        tipo.classList.add("input-erro");
        valido = false;
    }

    // PRAZO
    if (prazo.value === "") {
        erroPrazo.textContent = "Selecione uma data";
        prazo.classList.add("input-erro");
        valido = false;
    } else if (prazo.value < hoje) {
        erroPrazo.textContent = "Data inválida (passado)";
        prazo.classList.add("input-erro");
        valido = false;
    }

    // ERRO GERAL BONITO
    if (!valido) {
        if (typeof toastErro === 'function') {
            toastErro('Preencha corretamente os campos!');
        }
        return;
    }

    // CRIAR OBJETO PARA ENVIAR AO SERVIDOR
    const orcamento = {
        tipo: tipo.value,
        parametros: JSON.stringify({
            titulo: titulo.value.trim(),
            descricao: descricao.value.trim(),
            prazo: prazo.value
        })
    };

    // Obter token se existir
    const token = localStorage.getItem('access_token');
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // ENVIAR PARA O SERVIDOR
fetch('/api/orcamentos',
        method: 'POST',
        headers: headers,
        body: JSON.stringify(orcamento)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Orçamento enviado para o servidor:', data);

        // SUCESSO
        if (typeof toastSucesso === 'function') {
            toastSucesso('Solicitação enviada com sucesso!');
        }

        setTimeout(() => {
            modal.classList.remove("ativo");
            limparCampos();
        }, 1500);
    })
    .catch(error => {
        console.error('Erro ao enviar orçamento:', error);
        if (typeof toastErro === 'function') {
            toastErro('Erro ao enviar solicitação. Tente novamente.');
        }
    });
});


// LIMPAR ERROS
function limparErros() {
    erroTitulo.textContent = "";
    erroDescricao.textContent = "";
    erroTipo.textContent = "";
    erroPrazo.textContent = "";

    erroGeral.classList.remove("ativo");
    erroGeral.style.background = "#ef4444";

    document.querySelectorAll(".input-erro").forEach(el => {
        el.classList.remove("input-erro");
    });
}


// LIMPAR CAMPOS
function limparCampos() {
    titulo.value = "";
    descricao.value = "";
    tipo.value = "";
    prazo.value = "";
}


// ================= UX PRO =================

// remove erro ao digitar
[titulo, descricao, tipo, prazo].forEach(input => {
    input.addEventListener("input", () => {
        input.classList.remove("input-erro");
        erroGeral.classList.remove("ativo");
    });
});
