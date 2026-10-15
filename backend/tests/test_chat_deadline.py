"""Chat limits: one overall deadline across the tool loop, and one turn at a time per conversation."""

import asyncio
import time

from app.core.config import settings
from app.services import chatbot


def _answer(text="ok"):
    return {"stopReason": "end_turn", "output": {"message": {"role": "assistant", "content": [{"text": text}]}}}


class _SlowBedrock:
    def converse(self, **kwargs):
        time.sleep(0.5)
        return _answer()


class _RecordingBedrock:
    """Slow enough that a second request overlaps the first; records the roles it was sent."""

    def __init__(self):
        self.sent_roles = []

    def converse(self, **kwargs):
        self.sent_roles.append([m["role"] for m in kwargs["messages"]])
        time.sleep(0.1)
        return _answer()


def test_overall_deadline_returns_a_timeout_message(monkeypatch):
    monkeypatch.setattr(settings, "CHATBOT_REQUEST_TIMEOUT", 0.1)
    service = chatbot.ChatbotService()
    service._client = _SlowBedrock()

    async def scenario():
        started = time.monotonic()  # timed inside: asyncio.run also waits for the leftover worker thread
        return await service.chat("hi", conversation_id="c1"), time.monotonic() - started

    result, elapsed = asyncio.run(scenario())

    assert elapsed < 0.4
    assert "too long" in result["response"]
    assert [m["role"] for m in service._store.get_messages("c1")] == ["user", "assistant"]


def test_same_conversation_turns_do_not_interleave():
    service = chatbot.ChatbotService()
    service._client = _RecordingBedrock()

    async def scenario():
        await asyncio.gather(
            service.chat("one", conversation_id="c1"),
            service.chat("two", conversation_id="c1"),
        )

    asyncio.run(scenario())

    assert service._client.sent_roles == [["user"], ["user", "assistant", "user"]]


def test_different_conversations_stay_concurrent():
    service = chatbot.ChatbotService()
    service._client = _RecordingBedrock()

    async def scenario():
        started = time.monotonic()
        await asyncio.gather(
            service.chat("one", conversation_id="a"),
            service.chat("two", conversation_id="b"),
        )
        return time.monotonic() - started

    assert asyncio.run(scenario()) < 0.19  # two 0.1s calls overlapped, not queued
