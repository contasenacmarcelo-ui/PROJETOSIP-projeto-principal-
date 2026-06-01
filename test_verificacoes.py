#!/usr/bin/env python3
"""
Script de verificações completas da API SIP
Testa todos os endpoints e funcionalidades automaticamente
"""

import requests
import json
import sys
import time
import colorama
from colorama import Fore, Style, Back

# Ensure Unicode output on Windows terminals
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

colorama.init(autoreset=True)

class VerificadorAPI:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.token = None
        self.testes_executados = 0
        self.testes_passaram = 0
        self.erros = []

    def log(self, mensagem, tipo="info"):
        """Log colorido"""
        cores = {
            "success": Fore.GREEN,
            "error": Fore.RED,
            "warning": Fore.YELLOW,
            "info": Fore.BLUE,
            "header": Fore.CYAN + Style.BRIGHT
        }
        cor = cores.get(tipo, Fore.WHITE)
        mensagem_safe = mensagem.encode('ascii', errors='ignore').decode('ascii')
        print(f"{cor}{mensagem_safe}{Style.RESET_ALL}")

    def testar_conexao(self):
        """Testa se o servidor está respondendo"""
        self.log("🔍 Testando conexão com o servidor...", "header")
        try:
            response = requests.get(f"{self.base_url}/", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if "SIP Backend API" in data.get("message", ""):
                    self.log("✅ Servidor respondendo corretamente", "success")
                    self.registrar_sucesso()
                    return True
                else:
                    self.log("❌ Resposta inesperada do servidor", "error")
                    self.registrar_erro("Resposta inesperada")
                    return False
            else:
                self.log(f"❌ Status code: {response.status_code}", "error")
                self.registrar_erro(f"Status code: {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            self.log(f"❌ Erro de conexão: {e}", "error")
            self.registrar_erro(f"Erro de conexão: {e}")
            return False

    def testar_cadastro(self):
        """Testa cadastro de usuário"""
        self.log("👤 Testando cadastro de usuário...", "header")
        try:
            dados = {
                "email": "teste@example.com",
                "nome": "Usuário Teste",
                "senha": "admin123",
                "telefone": "11999999999"
            }
            response = requests.post(f"{self.base_url}/api/auth/cadastro", json=dados, timeout=10)
            if response.status_code == 201:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.token = data["access_token"]
                    self.log("✅ Cadastro realizado com sucesso", "success")
                    self.registrar_sucesso()
                    return True
                else:
                    self.log("❌ Resposta de cadastro incompleta", "error")
                    self.registrar_erro("Resposta incompleta")
                    return False
            elif response.status_code == 400:
                # Usuário já existe, tentar login
                self.log("⚠️ Usuário já existe, tentando login...", "warning")
                return self.testar_login()
            else:
                self.log(f"❌ Erro no cadastro: {response.status_code}", "error")
                self.registrar_erro(f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Erro no cadastro: {e}", "error")
            self.registrar_erro(str(e))
            return False

    def testar_login(self):
        """Testa login de usuário"""
        self.log("🔐 Testando login...", "header")
        try:
            dados = {
                "email": "teste@example.com",
                "senha": "admin123"
            }
            response = requests.post(f"{self.base_url}/api/auth/login", json=dados, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.token = data["access_token"]
                    self.log("✅ Login realizado com sucesso", "success")
                    self.registrar_sucesso()
                    return True
                else:
                    self.log("❌ Resposta de login incompleta", "error")
                    self.registrar_erro("Resposta incompleta")
                    return False
            else:
                self.log(f"❌ Erro no login: {response.status_code}", "error")
                self.registrar_erro(f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Erro no login: {e}", "error")
            self.registrar_erro(str(e))
            return False

    def testar_crud_pedidos(self):
        """Testa CRUD completo de pedidos"""
        self.log("📋 Testando CRUD de pedidos...", "header")
        headers = {"Authorization": f"Bearer {self.token}"}

        # Criar pedido
        dados_pedido = {
            "tipo_servico": "website",
            "descricao": "Website para empresa de tecnologia"
        }
        try:
            response = requests.post(f"{self.base_url}/api/pedidos", json=dados_pedido, headers=headers, timeout=10)
            if response.status_code == 201:
                payload = response.json()
                pedido_data = payload.get("pedido") or payload
                pedido_id = pedido_data.get("id")
                self.log("✅ Pedido criado com sucesso", "success")
                self.registrar_sucesso()

                # Listar pedidos
                response = requests.get(f"{self.base_url}/api/pedidos", headers=headers, timeout=10)
                if response.status_code == 200:
                    self.log("✅ Pedidos listados com sucesso", "success")
                    self.registrar_sucesso()
                else:
                    self.log("❌ Erro ao listar pedidos", "error")
                    self.registrar_erro("Erro ao listar")

                # Obter pedido específico
                response = requests.get(f"{self.base_url}/api/pedidos/{pedido_id}", headers=headers, timeout=10)
                if response.status_code == 200:
                    self.log("✅ Pedido obtido com sucesso", "success")
                    self.registrar_sucesso()
                else:
                    self.log("❌ Erro ao obter pedido", "error")
                    self.registrar_erro("Erro ao obter")

                # Atualizar pedido
                dados_update = {"status": "em_andamento"}
                response = requests.put(f"{self.base_url}/api/pedidos/{pedido_id}", json=dados_update, headers=headers, timeout=10)
                if response.status_code == 200:
                    self.log("✅ Pedido atualizado com sucesso", "success")
                    self.registrar_sucesso()
                else:
                    self.log("❌ Erro ao atualizar pedido", "error")
                    self.registrar_erro("Erro ao atualizar")

                return True
            else:
                self.log(f"❌ Erro ao criar pedido: {response.status_code}", "error")
                self.registrar_erro(f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Erro no CRUD de pedidos: {e}", "error")
            self.registrar_erro(str(e))
            return False

    def testar_crud_orcamentos(self):
        """Testa CRUD de orçamentos"""
        self.log("💰 Testando CRUD de orçamentos...", "header")
        headers = {"Authorization": f"Bearer {self.token}"}

        # Criar orçamento
        dados_orcamento = {
            "tipo": "website",
            "parametros": json.dumps({"paginas": 5, "funcionalidades": 3}),
            "valor_estimado": 1500.00
        }
        try:
            response = requests.post(f"{self.base_url}/api/orcamentos", json=dados_orcamento, headers=headers, timeout=10)
            if response.status_code == 201:
                self.log("✅ Orçamento criado com sucesso", "success")
                self.registrar_sucesso()
                return True
            else:
                self.log(f"❌ Erro ao criar orçamento: {response.status_code}", "error")
                self.registrar_erro(f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Erro no CRUD de orçamentos: {e}", "error")
            self.registrar_erro(str(e))
            return False

    def testar_crud_suporte(self):
        """Testa CRUD de chamados de suporte"""
        self.log("🎫 Testando CRUD de suporte...", "header")
        headers = {"Authorization": f"Bearer {self.token}"}

        # Criar chamado
        dados_chamado = {
            "titulo": "Problema no login",
            "descricao": "Não consigo acessar minha conta"
        }
        try:
            response = requests.post(f"{self.base_url}/api/suporte", json=dados_chamado, headers=headers, timeout=10)
            if response.status_code == 201:
                self.log("✅ Chamado criado com sucesso", "success")
                self.registrar_sucesso()
                return True
            else:
                self.log(f"❌ Erro ao criar chamado: {response.status_code}", "error")
                self.registrar_erro(f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Erro no CRUD de suporte: {e}", "error")
            self.registrar_erro(str(e))
            return False

    def testar_contato(self):
        """Testa envio de mensagem de contato"""
        self.log("📧 Testando contato...", "header")
        dados_contato = {
            "email": "cliente@example.com",
            "nome": "Cliente Interessado",
            "mensagem": "Gostaria de informações sobre desenvolvimento web"
        }
        try:
            response = requests.post(f"{self.base_url}/api/contato", json=dados_contato, timeout=10)
            if response.status_code == 201:
                self.log("✅ Mensagem de contato enviada com sucesso", "success")
                self.registrar_sucesso()
                return True
            else:
                self.log(f"❌ Erro no contato: {response.status_code}", "error")
                self.registrar_erro(f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Erro no contato: {e}", "error")
            self.registrar_erro(str(e))
            return False

    def testar_notificacoes(self):
        """Testa sistema de notificações"""
        self.log("🔔 Testando notificações...", "header")
        headers = {"Authorization": f"Bearer {self.token}"}

        try:
            response = requests.get(f"{self.base_url}/api/notificacoes", headers=headers, timeout=10)
            if response.status_code == 200:
                self.log("✅ Notificações listadas com sucesso", "success")
                self.registrar_sucesso()
                return True
            else:
                self.log(f"❌ Erro nas notificações: {response.status_code}", "error")
                self.registrar_erro(f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Erro nas notificações: {e}", "error")
            self.registrar_erro(str(e))
            return False

    def testar_ml_classificador(self):
        """Testa classificador de suporte"""
        self.log("🤖 Testando classificador de suporte...", "header")
        headers = {"Authorization": f"Bearer {self.token}"}

        dados = {"descricao": "Não consigo fazer login no sistema"}
        try:
            response = requests.post(f"{self.base_url}/api/ml/classificador-suporte", json=dados, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "categoria" in data and "prioridade" in data:
                    self.log("✅ Classificador funcionando", "success")
                    self.registrar_sucesso()
                    return True
                else:
                    self.log("❌ Resposta incompleta do classificador", "error")
                    self.registrar_erro("Resposta incompleta")
                    return False
            else:
                self.log(f"❌ Erro no classificador: {response.status_code}", "error")
                self.registrar_erro(f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Erro no classificador: {e}", "error")
            self.registrar_erro(str(e))
            return False

    def testar_ml_recomendador(self):
        """Testa recomendador de serviços"""
        self.log("🤖 Testando recomendador de serviços...", "header")
        headers = {"Authorization": f"Bearer {self.token}"}

        dados = {
            "tipo_cliente": "startup",
            "budget": 3000,
            "necessidades": "website moderno e responsivo"
        }
        try:
            response = requests.post(f"{self.base_url}/api/ml/recomendador-servicos", json=dados, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "recomendacoes" in data:
                    self.log("✅ Recomendador funcionando", "success")
                    self.registrar_sucesso()
                    return True
                else:
                    self.log("❌ Resposta incompleta do recomendador", "error")
                    self.registrar_erro("Resposta incompleta")
                    return False
            else:
                self.log(f"❌ Erro no recomendador: {response.status_code}", "error")
                self.registrar_erro(f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Erro no recomendador: {e}", "error")
            self.registrar_erro(str(e))
            return False

    def testar_ml_estimador(self):
        """Testa estimador de orçamento"""
        self.log("🤖 Testando estimador de orçamento...", "header")
        headers = {"Authorization": f"Bearer {self.token}"}

        dados = {
            "tipo_servico": "website",
            "parametros": {"paginas": 5, "funcionalidades": 3, "prazo_dias": 30}
        }
        try:
            response = requests.post(f"{self.base_url}/api/ml/estimador-orcamento", json=dados, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "valor_estimado" in data:
                    self.log("✅ Estimador funcionando", "success")
                    self.registrar_sucesso()
                    return True
                else:
                    self.log("❌ Resposta incompleta do estimador", "error")
                    self.registrar_erro("Resposta incompleta")
                    return False
            else:
                self.log(f"❌ Erro no estimador: {response.status_code}", "error")
                self.registrar_erro(f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Erro no estimador: {e}", "error")
            self.registrar_erro(str(e))
            return False

    def testar_ml_status(self):
        """Testa status dos modelos ML"""
        self.log("🤖 Testando status dos modelos ML...", "header")
        try:
            response = requests.get(f"{self.base_url}/api/ml/status", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "modelos" in data and len(data["modelos"]) == 6:
                    self.log("✅ Status dos modelos OK", "success")
                    self.registrar_sucesso()
                    return True
                else:
                    self.log("❌ Status incompleto dos modelos", "error")
                    self.registrar_erro("Status incompleto")
                    return False
            else:
                self.log(f"❌ Erro no status ML: {response.status_code}", "error")
                self.registrar_erro(f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Erro no status ML: {e}", "error")
            self.registrar_erro(str(e))
            return False

    def registrar_sucesso(self):
        """Registra teste bem-sucedido"""
        self.testes_executados += 1
        self.testes_passaram += 1

    def registrar_erro(self, erro):
        """Registra erro"""
        self.testes_executados += 1
        self.erros.append(erro)

    def executar_todos_testes(self):
        """Executa todos os testes"""
        self.log("=" * 60, "header")
        self.log("🚀 INICIANDO VERIFICAÇÕES COMPLETAS DA API SIP", "header")
        self.log("=" * 60, "header")

        # Testes básicos
        if not self.testar_conexao():
            self.log("❌ Servidor não está respondendo. Abortando testes.", "error")
            return

        # Autenticação
        if not (self.testar_cadastro() or self.testar_login()):
            self.log("❌ Autenticação falhou. Abortando testes.", "error")
            return

        # CRUD operations
        self.testar_crud_pedidos()
        self.testar_crud_orcamentos()
        self.testar_crud_suporte()
        self.testar_contato()
        self.testar_notificacoes()

        # ML models
        self.testar_ml_classificador()
        self.testar_ml_recomendador()
        self.testar_ml_estimador()
        self.testar_ml_status()

        # Resultado final
        self.mostrar_relatorio()

    def mostrar_relatorio(self):
        """Mostra relatório final"""
        self.log("\n" + "=" * 60, "header")
        self.log("📊 RELATÓRIO FINAL DE VERIFICAÇÕES", "header")
        self.log("=" * 60, "header")

        taxa_sucesso = (self.testes_passaram / self.testes_executados * 100) if self.testes_executados > 0 else 0

        self.log(f"✅ Testes executados: {self.testes_executados}", "info")
        self.log(f"✅ Testes passaram: {self.testes_passaram}", "success")
        self.log(f"❌ Testes falharam: {len(self.erros)}", "error")

        if taxa_sucesso >= 90:
            self.log(f"📊 Taxa de sucesso: {taxa_sucesso:.1f}% - EXCELENTE!", "success")
        elif taxa_sucesso >= 75:
            self.log(f"📊 Taxa de sucesso: {taxa_sucesso:.1f}% - BOM", "warning")
        else:
            self.log(f"📊 Taxa de sucesso: {taxa_sucesso:.1f}% - PREOCUPANTE", "error")

        if self.erros:
            self.log("\n❌ Erros encontrados:", "error")
            for i, erro in enumerate(self.erros, 1):
                self.log(f"  {i}. {erro}", "error")

        self.log("\n" + "=" * 60, "header")

def main():
    verificador = VerificadorAPI()

    try:
        verificador.executar_todos_testes()
    except KeyboardInterrupt:
        verificador.log("\n⚠️ Testes interrompidos pelo usuário", "warning")
    except Exception as e:
        verificador.log(f"\n❌ Erro inesperado: {e}", "error")

if __name__ == "__main__":
    main()