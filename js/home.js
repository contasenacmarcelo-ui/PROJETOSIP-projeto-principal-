 const texto = "Transforme suas ideias em sites!";
        const elemento = document.getElementById("titulo");

        let i = 0;

        function digitar() {
            if (i < texto.length) {
                elemento.innerHTML += texto.charAt(i);
                i++;
                setTimeout(digitar, 50); // velocidade
            }
        }

        digitar();

        const btn = document.getElementById("btn-menu");
        const menu = document.getElementById("menu-mobile");

        btn.addEventListener("click", () => {
            btn.classList.toggle("ativo");
            menu.classList.toggle("ativo");
        });

        // fechar ao clicar fora
        document.addEventListener("click", (e) => {
            if (!menu.contains(e.target) && !btn.contains(e.target)) {
                menu.classList.remove("ativo");
                btn.classList.remove("ativo");
            }
        });