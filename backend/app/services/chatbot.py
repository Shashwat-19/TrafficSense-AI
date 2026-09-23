"""
TrafficSense AI — Chatbot service.

Integrates the chatbot from the original app.py with the TrafficSense
backend, using AWS Bedrock Converse API with tool calling to access
existing traffic services.
"""

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

import boto3
from botocore.exceptions import (
    BotoCoreError,
    ClientError,
    NoCredentialsError,
)

from app.core.config import settings
from app.services.chatbot_tools import TOOL_CONFIG, execute_tool

logger = logging.getLogger("trafficsense.chatbot")

# ── System prompt ──────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are TrafficSense AI, an intelligent traffic monitoring, prediction, and road-safety assistant for Bangalore, India.

You have access to REAL-TIME tools that provide actual traffic data. Always use these tools to answer traffic-related questions — never invent traffic information.

Your capabilities:
- Current traffic conditions on Bangalore roads (speeds, congestion levels, delays)
- Traffic incident reports (accidents, road closures, construction)
- Weather conditions and their impact on traffic
- Traffic predictions (15, 30, or 60 minutes ahead) using ML models
- Route planning with alternatives and congestion avoidance
- Traffic analytics (trends, bottlenecks, congestion distribution)
- Active traffic alerts and warnings

Road safety guidance:
- Traffic rules and safe driving practices
- Road sign meanings and safety tips
- Defensive driving advice
- Pedestrian and cyclist safety

IMPORTANT RULES:
1. Use tools to get real data before answering traffic questions. Do NOT guess or hallucinate traffic conditions.
2. If data is unavailable, clearly say so.
3. Never encourage dangerous or reckless driving.
4. Never encourage breaking traffic laws.
5. For emergencies, advise contacting local emergency services.
6. Be concise, practical, and prioritize human safety.
7. If a question is completely unrelated to traffic, transportation, or road safety, politely redirect.
8. When mentioning specific roads or locations, be specific about Bangalore geography.
9. When providing predictions, mention the confidence level.
10. Mention whether data is from live sources or demo mode when relevant."""


# ── Conversation store ─────────────────────────────────────────────────────

class ConversationStore:
    """In-memory conversation storage with sliding window."""

    def __init__(self, max_messages: int = 20):
        self._conversations: dict[str, list[dict]] = {}
        self._max_messages = max_messages

    def get_messages(self, conversation_id: str) -> list[dict]:
        return self._conversations.get(conversation_id, [])

    def add_message(self, conversation_id: str, role: str, content: str) -> None:
        if conversation_id not in self._conversations:
            self._conversations[conversation_id] = []
        self._conversations[conversation_id].append({
            "role": role,
            "content": [{"text": content}],
        })
        # Prune to keep only the last N messages
        if len(self._conversations[conversation_id]) > self._max_messages:
            self._conversations[conversation_id] = (
                self._conversations[conversation_id][-self._max_messages:]
            )

    def add_raw_messages(self, conversation_id: str, messages: list[dict]) -> None:
        """Add raw Bedrock-format messages (used for tool-use turns)."""
        if conversation_id not in self._conversations:
            self._conversations[conversation_id] = []
        self._conversations[conversation_id].extend(messages)
        if len(self._conversations[conversation_id]) > self._max_messages:
            self._conversations[conversation_id] = (
                self._conversations[conversation_id][-self._max_messages:]
            )

    def clear(self, conversation_id: str) -> None:
        self._conversations.pop(conversation_id, None)

    def exists(self, conversation_id: str) -> bool:
        return conversation_id in self._conversations


# ── Bedrock client ─────────────────────────────────────────────────────────

def _create_bedrock_client():
    """Create a boto3 Bedrock Runtime client."""
    kwargs: dict[str, Any] = {"region_name": settings.AWS_REGION}
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
    return boto3.client("bedrock-runtime", **kwargs)


# ── Chatbot service ────────────────────────────────────────────────────────

class ChatbotService:
    """Manages conversations with the TrafficSense AI chatbot."""

    def __init__(self):
        self._store = ConversationStore(
            max_messages=settings.CHATBOT_MAX_HISTORY
        )
        self._client = None

    @property
    def client(self):
        if self._client is None:
            self._client = _create_bedrock_client()
        return self._client

    async def chat(
        self,
        message: str,
        conversation_id: str | None = None,
    ) -> dict:
        """
        Process a chat message and return a structured response.

        Parameters
        ----------
        message         : the user's message
        conversation_id : optional ID to continue a conversation

        Returns
        -------
        dict with keys: response, conversation_id, sources, tools_used, actions, timestamp
        """
        request_start = datetime.now(tz=timezone.utc)

        # Generate or reuse conversation ID
        if not conversation_id:
            conversation_id = str(uuid.uuid4())

        # Add user message to history
        self._store.add_message(conversation_id, "user", message)

        # Build messages for Bedrock
        messages = self._store.get_messages(conversation_id)

        tools_used: list[str] = []
        all_actions: list[dict] = []
        sources: list[str] = []

        try:
            response_text = await self._converse_with_tools(
                messages=messages,
                conversation_id=conversation_id,
                tools_used=tools_used,
                actions=all_actions,
                sources=sources,
            )
        except NoCredentialsError:
            logger.error("AWS credentials not configured")
            response_text = (
                "⚠️ The AI service is not configured. Please set up AWS credentials "
                "and ensure Amazon Bedrock access is enabled."
            )
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "Unknown")
            logger.error("Bedrock API error: %s — %s", error_code, e)
            if error_code == "ThrottlingException":
                response_text = (
                    "⚠️ The AI service is currently rate-limited. "
                    "Please try again in a moment."
                )
            elif error_code == "AccessDeniedException":
                response_text = (
                    "⚠️ Access to the AI model is denied. Please check your "
                    "AWS permissions and Bedrock model access."
                )
            else:
                response_text = (
                    "⚠️ An error occurred with the AI service. "
                    "Please try again later."
                )
        except BotoCoreError as e:
            logger.error("BotoCore error: %s", e)
            response_text = (
                "⚠️ Unable to connect to the AI service. "
                "Please check your network and AWS configuration."
            )
        except Exception as e:
            logger.error("Unexpected chatbot error: %s", e, exc_info=True)
            response_text = (
                "⚠️ An unexpected error occurred. Please try again."
            )

        # Store assistant response
        self._store.add_message(conversation_id, "assistant", response_text)

        latency_ms = (
            datetime.now(tz=timezone.utc) - request_start
        ).total_seconds() * 1000

        logger.info(
            "Chat response: conversation_id=%s, tools_used=%s, "
            "latency_ms=%.0f, status=ok",
            conversation_id,
            tools_used,
            latency_ms,
        )

        return {
            "response": response_text,
            "conversation_id": conversation_id,
            "sources": sources,
            "tools_used": tools_used,
            "actions": all_actions,
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
        }

    async def _converse_with_tools(
        self,
        messages: list[dict],
        conversation_id: str,
        tools_used: list[str],
        actions: list[dict],
        sources: list[str],
        max_tool_rounds: int = 5,
    ) -> str:
        """
        Call Bedrock Converse API with tool-use loop.

        If the model requests tool calls, execute them and continue
        the conversation until the model produces a final text response.
        """
        working_messages = [m for m in messages]  # shallow copy

        for round_num in range(max_tool_rounds):
            response = self.client.converse(
                modelId=settings.BEDROCK_MODEL_ID,
                system=[{"text": SYSTEM_PROMPT}],
                messages=working_messages,
                toolConfig=TOOL_CONFIG,
            )

            stop_reason = response.get("stopReason", "")
            output_message = response.get("output", {}).get("message", {})
            content_blocks = output_message.get("content", [])

            # Check if the model wants to use tools
            if stop_reason == "tool_use":
                # Add the assistant's response (with tool use request) to messages
                working_messages.append(output_message)

                # Process each tool use block
                tool_results = []
                for block in content_blocks:
                    if "toolUse" in block:
                        tool_use = block["toolUse"]
                        tool_name = tool_use["name"]
                        tool_input = tool_use.get("input", {})
                        tool_use_id = tool_use["toolUseId"]

                        tools_used.append(tool_name)
                        sources.append(tool_name)

                        # Execute the tool
                        result_text, tool_actions = execute_tool(
                            tool_name, tool_input
                        )
                        actions.extend(tool_actions)

                        tool_results.append({
                            "toolResult": {
                                "toolUseId": tool_use_id,
                                "content": [{"text": result_text}],
                            }
                        })

                # Add tool results as a user message
                working_messages.append({
                    "role": "user",
                    "content": tool_results,
                })

                # Store the tool exchange in conversation history
                self._store.add_raw_messages(
                    conversation_id,
                    [output_message, {"role": "user", "content": tool_results}],
                )

            else:
                # Model produced a final text response
                text_parts = []
                for block in content_blocks:
                    if "text" in block:
                        text_parts.append(block["text"])

                return "\n".join(text_parts) if text_parts else "I couldn't generate a response. Please try again."

        return "I needed too many steps to answer. Please simplify your question."

    def clear_conversation(self, conversation_id: str) -> bool:
        """Clear a conversation's history."""
        if self._store.exists(conversation_id):
            self._store.clear(conversation_id)
            return True
        return False
