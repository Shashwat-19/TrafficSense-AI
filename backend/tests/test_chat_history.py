"""Regression: a chat request cancelled midway must not leave consecutive user turns (Bedrock rejects them)."""

import asyncio
import time

from app.services import chatbot


class _SlowThenFastBedrock:
    """First call is slow enough to be cancelled; later calls answer. Records the roles it was sent."""

    def __init__(self):
        self.calls = 0
        self.sent_roles = []

    def converse(self, **kwargs):
        self.calls += 1
        self.sent_roles.append([m["role"] for m in kwargs["messages"]])
        if self.calls == 1:
            time.sleep(0.3)
        return {
            "stopReason": "end_turn",
            "output": {"message": {"role": "assistant", "content": [{"text": "ok"}]}},
        }


def test_cancelled_chat_leaves_alternating_history():
    service = chatbot.ChatbotService()
    service._client = _SlowThenFastBedrock()

    async def scenario():
        await service.chat("first", conversation_id="c1")  # call 1 is slow but completes: baseline turn
        service._client.calls = 0  # make the next call the slow one
        try:
            await asyncio.wait_for(service.chat("cancelled", conversation_id="c1"), timeout=0.05)
        except asyncio.TimeoutError:
            pass
        await service.chat("second", conversation_id="c1")

    asyncio.run(scenario())

    last_sent = service._client.sent_roles[-1]
    assert all(a != b for a, b in zip(last_sent, last_sent[1:])), last_sent
    assert last_sent == ["user", "assistant", "user"]
