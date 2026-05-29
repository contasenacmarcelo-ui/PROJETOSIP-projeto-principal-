"""Debug: Verificar se o blueprint chat_bp está registrado corretamente"""

from backend.database import create_app

app = create_app()

print("=" * 80)
print("BLUEPRINTS REGISTRADOS NO FLASK")
print("=" * 80)

print(f"\nTotal de blueprints: {len(app.blueprints)}")
print("\nListagem de blueprints:")
for name, bp in app.blueprints.items():
    print(f"\n  {name}:")
    print(f"    - url_prefix: {bp.url_prefix}")

print("\n" + "=" * 80)
print("TODAS AS ROTAS REGISTRADAS")
print("=" * 80 + "\n")

for rule in app.url_map.iter_rules():
    methods = sorted(rule.methods - {'OPTIONS', 'HEAD'})
    print(f"{str(rule.rule):60} {str(methods):30}")

print("\n" + "=" * 80)
print(f"Procurando por /chat*:")
print("=" * 80 + "\n")
for rule in app.url_map.iter_rules():
    if '/chat' in rule.rule:
        methods = sorted(rule.methods - {'OPTIONS', 'HEAD'})
        print(f"{rule.rule:60} {methods}")
