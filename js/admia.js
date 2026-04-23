    // ============================
    // MENU MOBILE
    // ============================
    const btn = document.getElementById("btn-menu");
    const menu = document.getElementById("menu-mobile");

    btn.addEventListener("click", () => {
        btn.classList.toggle("ativo");
        menu.classList.toggle("ativo");
    });

    document.addEventListener("click", (e) => {
        if (!menu.contains(e.target) && !btn.contains(e.target)) {
            menu.classList.remove("ativo");
            btn.classList.remove("ativo");
        }
    });

    // ============================
    // MODAL
    // ============================
    const modal = document.getElementById("modal");

    function abrirModal() {
        modal.style.display = "block";

        setTimeout(() => {
            document.getElementById("nome").focus();
        }, 100);
    }

    function fecharModal() {
        modal.style.display = "none";
    }

    // fechar clicando fora
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            fecharModal();
        }
    });

    // ESC fecha modal
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            fecharModal();
        }
    });

    // ENTER envia (só com modal aberto)
    document.addEventListener("keydown", (e) => {
        if (modal.style.display === "block" && e.key === "Enter") {
            e.preventDefault();
            adicionarUsuario();
        }
    });

    // ============================
    // LOCAL STORAGE + TABELA
    // ============================
    const tabelaBody = document.getElementById("tabela-body");

    const dadosPadrao = [
        { id: "001", nome: "Marcelo", status: "Ativo" },
        { id: "002", nome: "Ana", status: "Pendente" },
        { id: "003", nome: "Matheus", status: "Em aberto" }
    ];

    function carregarDados() {
        let dados = JSON.parse(localStorage.getItem("usuarios"));

        if (!dados) {
            localStorage.setItem("usuarios", JSON.stringify(dadosPadrao));
            dados = dadosPadrao;
        }

        return dados;
    }

    function salvarDados(dados) {
        localStorage.setItem("usuarios", JSON.stringify(dados));
    }

    function renderizarTabela() {
        const dados = carregarDados();
        tabelaBody.innerHTML = "";

        dados.forEach((user, index) => {
            const classeStatus =
                user.status === "Ativo" ? "on" :
                user.status === "Pendente" ? "pendente" : "open";

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${user.id}</td>
                <td>${user.nome}</td>
                <td><span class="${classeStatus}">${user.status}</span></td>
                <td>
                    <button class="btn-remove" onclick="removerUsuario(${index})">
                        <i class="bi bi-trash-fill"></i>
                    </button>
                </td>
            `;

            tabelaBody.appendChild(tr);
        });
    }

    function removerUsuario(index) {
        let dados = carregarDados();
        dados.splice(index, 1);
        salvarDados(dados);
        renderizarTabela();
    }

    function adicionarUsuario() {
        const nomeInput = document.getElementById("nome");
        const statusInput = document.getElementById("status");

        const nome = nomeInput.value;
        const status = statusInput.value;

        if (nome.trim() === "") {
            alert("Digite um nome!");
            return;
        }

        let dados = carregarDados();

        const novoId = String(dados.length + 1).padStart(3, "0");

        const novoUsuario = {
            id: novoId,
            nome: nome,
            status: status
        };

        dados.push(novoUsuario);
        salvarDados(dados);
        renderizarTabela();

        // limpar e fechar modal
        nomeInput.value = "";
        fecharModal();
    }

    // ============================
    // INICIAR
    // ============================
    renderizarTabela();