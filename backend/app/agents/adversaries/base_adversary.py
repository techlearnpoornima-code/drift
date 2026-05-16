from __future__ import annotations

from app.agents.base_agent import BaseAgent
from app.config import Config


class AdversaryAgent(BaseAgent):
    """
    Base class for all adversary agents.

    Each subclass defines ATTACK_CODE and SYSTEM_PROMPT as class-level constants.
    The coordinator calls run_attack() every round.
    """

    ATTACK_CODE: str = ""

    def __init__(self, config: Config | None = None) -> None:
        super().__init__(
            system_prompt=self.__class__.SYSTEM_PROMPT,  # type: ignore[attr-defined]
            config=config,
            temperature=0.9,
            use_boost=True,
        )

    def run_attack(
        self,
        target_response: str,
        round_num: int,
        prior_adversary_context: str = "",
        seed_text: str = "",
    ) -> str:
        # seed_text deliberately ignored — the target's round-1 summary already
        # captures the domain. Adversaries learn from what the target reveals.
        parts = []
        parts.append(f"[Round {round_num}]\nTarget said:\n{target_response}")
        if prior_adversary_context:
            parts.append(f"Other adversaries this round:\n{prior_adversary_context}")
        return self.chat("\n\n".join(parts))
