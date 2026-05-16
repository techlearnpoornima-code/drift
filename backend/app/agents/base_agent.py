from __future__ import annotations

from openai import OpenAI
from openai.types.chat import ChatCompletion

from app.config import Config


class BaseAgent:
    """Shared OpenAI-SDK wrapper for all DRIFT agents."""

    def __init__(
        self,
        system_prompt: str,
        config: Config | None = None,
        *,
        temperature: float = 0.7,
        use_boost: bool = False,
    ) -> None:
        cfg = config or Config()
        api_key = (cfg.LLM_BOOST_API_KEY or cfg.LLM_API_KEY) if use_boost else cfg.LLM_API_KEY
        base_url = (cfg.LLM_BOOST_BASE_URL or cfg.LLM_BASE_URL) if use_boost else cfg.LLM_BASE_URL
        model = (
            (cfg.LLM_BOOST_MODEL_NAME or cfg.LLM_MODEL_NAME) if use_boost else cfg.LLM_MODEL_NAME
        )

        self._client = OpenAI(api_key=api_key, base_url=base_url)
        self._model = model
        self._system_prompt = system_prompt
        self._temperature = temperature
        self._history: list[dict[str, str]] = []

    def chat(self, user_message: str) -> str:
        self._history.append({"role": "user", "content": user_message})
        messages = [{"role": "system", "content": self._system_prompt}] + self._history

        response: ChatCompletion = self._client.chat.completions.create(
            model=self._model,
            messages=messages,  # type: ignore[arg-type]
            temperature=self._temperature,
            timeout=120,
        )
        reply = response.choices[0].message.content or ""
        self._history.append({"role": "assistant", "content": reply})
        return reply

    def reset_history(self) -> None:
        self._history.clear()

    @property
    def system_prompt(self) -> str:
        return self._system_prompt
