from __future__ import annotations

from camel.agents import ChatAgent
from camel.models import ModelFactory
from camel.types import ModelPlatformType

from app.agents.adversaries.oasis_channel import GroupChannel
from app.config import Config


class CamelAdversaryAgent:
    """
    Base class for multi-agent OASIS adversaries (SOC-03, LS-05).

    Uses CAMEL ChatAgent backed by ModelFactory so the agent maintains its
    own internal conversation history across rounds. Additionally subscribes
    to a GroupChannel — a shared CAMEL InMemoryKeyValueStorage timeline that
    all agents in the group post to and read from.

    Memory flow per round:
      1. Coordinator posts [TARGET] to channel.
      2. Agent N reads full channel history (TARGET + all prior agent turns).
      3. Agent N calls ChatAgent.step() — CAMEL appends to its own history.
      4. Agent N posts its response to the channel.
      5. Agent N+1 now sees Agent N's response when it reads the channel.

    Cross-round: every agent sees the full group timeline, not just its own
    history — so Alex in round 3 knows Jordan escalated in round 2.
    """

    ATTACK_CODE: str = ""

    def __init__(
        self,
        system_prompt: str,
        name: str,
        channel: GroupChannel,
        config: Config | None = None,
    ) -> None:
        cfg = config or Config()
        api_key = cfg.LLM_BOOST_API_KEY or cfg.LLM_API_KEY
        base_url = cfg.LLM_BOOST_BASE_URL or cfg.LLM_BASE_URL
        model_name = cfg.LLM_BOOST_MODEL_NAME or cfg.LLM_MODEL_NAME

        model = ModelFactory.create(
            model_platform=ModelPlatformType.OPENAI_COMPATIBLE_MODEL,
            model_type=model_name,
            api_key=api_key,
            url=base_url,
            model_config_dict={"temperature": 0.9},
        )
        self._agent = ChatAgent(
            system_message=system_prompt,
            model=model,
            message_window_size=12,
        )
        self._name = name
        self._channel = channel

    def run_attack(
        self,
        target_response: str,
        round_num: int,
        prior_adversary_context: str = "",
        seed_text: str = "",
    ) -> str:
        # seed_text deliberately ignored — the target's round-1 summary already
        # captures the domain. Adversaries learn from what the target reveals,
        # not from the raw document.
        parts: list[str] = []

        group_history = self._channel.get_history(window=14)
        if group_history:
            parts.append(f"[Group conversation history]\n{group_history}")

        parts.append(f"[Round {round_num}] Target says:\n{target_response}")

        response = self._agent.step("\n\n".join(parts))

        if response.terminated or not response.msgs:
            return ""

        output: str = response.msgs[0].content
        self._channel.post(self._name, output, round_num)
        return output

    @property
    def name(self) -> str:
        return self._name
