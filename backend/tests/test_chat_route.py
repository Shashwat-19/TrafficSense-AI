"""Regression tests: chat tools stay off the event loop, route fallbacks use the short cache."""

import asyncio
import threading

import httpx

from app.core.config import settings
from app.models.schemas import RouteRequest
from app.services import chatbot, route
from app.services.route import RouteService


class _FakeBedrock:
    """First call asks for a tool, second call answers."""

    def __init__(self):
        self.calls = 0

    def converse(self, **kwargs):
        self.calls += 1
        if self.calls == 1:
            return {
                "stopReason": "tool_use",
                "output": {"message": {"role": "assistant", "content": [
                    {"toolUse": {"toolUseId": "t1", "name": "get_weather", "input": {}}},
                ]}},
            }
        return {
            "stopReason": "end_turn",
            "output": {"message": {"role": "assistant", "content": [{"text": "done"}]}},
        }


def test_chat_tools_run_in_worker_thread(monkeypatch):
    seen = []

    def fake_execute_tool(name, tool_input):
        seen.append(threading.current_thread())
        return "ok", []

    monkeypatch.setattr(chatbot, "execute_tool", fake_execute_tool)
    service = chatbot.ChatbotService()
    service._client = _FakeBedrock()

    result = asyncio.run(service.chat("weather?"))

    assert result["response"] == "done"
    assert result["tools_used"] == ["get_weather"]
    assert seen and seen[0] is not threading.main_thread()


def test_failed_live_route_is_cached_briefly(monkeypatch):
    attempts = []

    class _Boom:
        def __init__(self, *a, **k):
            attempts.append(1)
            raise httpx.ConnectError("down")

    monkeypatch.setattr(settings, "TOMTOM_API_KEY", "test-key")
    monkeypatch.setattr(httpx, "Client", _Boom)
    route._route_cache.clear()
    route._route_fallback_cache.clear()
    req = RouteRequest(origin_lat=12.93, origin_lng=77.62, destination_lat=12.97, destination_lng=77.75)

    first = RouteService().get_routes(req)
    second = RouteService().get_routes(req)

    assert first[1] == second[1] == "demo"
    assert len(attempts) == 1  # second call served from the fallback cache
    assert len(route._route_cache) == 0  # not the long-lived live cache
    route._route_fallback_cache.clear()
