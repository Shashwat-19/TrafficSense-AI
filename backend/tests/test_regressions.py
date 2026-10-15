"""
TrafficSense AI — regression tests for behaviour that is already implemented.

All tests run offline. The production-mode check runs in a subprocess so that
APP_ENV is read fresh at import time without reloading modules in this process.
"""

import json
import os
import subprocess
import sys

import httpx
from cachetools import TTLCache

from app.services import traffic as traffic_mod
from app.services.chatbot import ConversationStore

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# ── Production mode hides API docs ─────────────────────────────────────────

def _app_doc_urls(app_env: str, debug: str) -> list:
    """Import app.main in a fresh interpreter and return [docs_url, redoc_url, DEBUG]."""
    code = (
        "import json\n"
        "from app.main import app\n"
        "from app.core.config import settings\n"
        "print(json.dumps([app.docs_url, app.redoc_url, settings.DEBUG]))\n"
    )
    env = {**os.environ, "APP_ENV": app_env, "DEBUG": debug}
    out = subprocess.run(
        [sys.executable, "-c", code],
        cwd=BACKEND_DIR, env=env, capture_output=True, text=True, check=True, timeout=120,
    ).stdout
    return json.loads(out.strip().splitlines()[-1])


def test_production_disables_docs_and_debug():
    docs_url, redoc_url, debug = _app_doc_urls("production", debug="true")
    assert docs_url is None
    assert redoc_url is None
    assert debug is False


def test_development_serves_docs():
    docs_url, redoc_url, _ = _app_doc_urls("development", debug="true")
    assert docs_url == "/docs"
    assert redoc_url == "/redoc"


# ── Chat history pruning never starts with an orphaned toolResult ──────────

def _text(role: str, text: str) -> dict:
    return {"role": role, "content": [{"text": text}]}


def test_prune_never_starts_with_orphaned_tool_result():
    store = ConversationStore(max_messages=4)
    tool_use = {"role": "assistant", "content": [
        {"toolUse": {"toolUseId": "t1", "name": "get_traffic", "input": {}}}]}
    tool_result = {"role": "user", "content": [
        {"toolResult": {"toolUseId": "t1", "content": [{"text": "ok"}]}}]}

    store.add_message("c", "user", "q0")
    # Six messages in one batch: the naive last-4 window would begin at the toolResult
    store.add_raw_messages("c", [
        tool_use,
        tool_result,
        _text("assistant", "a1"),
        _text("user", "q2"),
        _text("assistant", "a2"),
    ])

    msgs = store.get_messages("c")
    assert [m["content"][0].get("text") for m in msgs] == ["q2", "a2"]
    assert msgs[0]["role"] == "user"
    assert not any("toolResult" in b for b in msgs[0]["content"])


# ── Live TomTom failures are cached, not re-fetched on every request ───────

def test_tomtom_401_is_cached_and_not_refetched(monkeypatch):
    calls: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(str(request.url))
        return httpx.Response(401, json={"error": "unauthorized"})

    real_client = httpx.Client
    monkeypatch.setattr(
        httpx, "Client",
        lambda **kw: real_client(transport=httpx.MockTransport(handler), **kw),
    )
    monkeypatch.setattr(traffic_mod.settings, "TOMTOM_API_KEY", "offline-test-key")
    monkeypatch.setattr(traffic_mod, "_traffic_cache", TTLCache(maxsize=2, ttl=120))

    service = traffic_mod.TrafficService()

    _, mode = service.get_current_traffic()
    first_round = len(calls)
    assert first_round == len(traffic_mod.BANGALORE_SEGMENTS)
    assert mode == "demo"

    _, mode = service.get_current_traffic()
    assert len(calls) == first_round
    assert mode == "demo"
