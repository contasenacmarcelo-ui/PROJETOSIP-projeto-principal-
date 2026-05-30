        const menuBtnGlobal = document.getElementById("btn-menu");
        const menu = document.getElementById("menu-mobile");

        if (menuBtnGlobal && menu) {
            menuBtnGlobal.addEventListener("click", () => {
                menuBtnGlobal.classList.toggle("ativo");
                menu.classList.toggle("ativo");
            });

            // fechar ao clicar fora
            document.addEventListener("click", (e) => {
                if (!menu.contains(e.target) && !menuBtnGlobal.contains(e.target)) {
                    menu.classList.remove("ativo");
                    menuBtnGlobal.classList.remove("ativo");
                }
            });
        }
