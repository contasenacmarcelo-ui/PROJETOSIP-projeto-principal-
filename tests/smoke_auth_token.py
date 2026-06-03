import json
import time
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:5000"


def http_json(method, path, payload, timeout=15):
    url = BASE + path
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "application/json")
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            elapsed_ms = (time.time() - start) * 1000
            return {
                "ok": True,
                "status": resp.status,
                "elapsed_ms": elapsed_ms,
                "body": json.loads(body) if body else None,
            }
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace") if hasattr(e, "read") else ""
        return {
            "ok": False,
            "status": e.code,
            "elapsed_ms": (time.time() - start) * 1000,
            "body": body,
        }


def main():
    # Seed banco (sem auth)
    seed = http_json("GET", "/api/admin/seed", payload={})

    # Try login with seed admin credentials if seed worked
    login = http_json(
        "POST",
        "/api/auth/login",
        payload={"email": "admin_seed@example.com", "senha": "senha123"},
    )

    print(json.dumps({"seed": seed, "login": login}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
