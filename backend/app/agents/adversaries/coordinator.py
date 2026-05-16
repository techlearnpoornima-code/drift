from __future__ import annotations

from app.agents.adversaries.authority_spoofing import AuthoritySpoofingAgent
from app.agents.adversaries.base_adversary import AdversaryAgent
from app.agents.adversaries.camel_adversary import CamelAdversaryAgent
from app.agents.adversaries.concept_creep import ConceptCreepAgent
from app.agents.adversaries.context_butcher import ContextButcherAgent
from app.agents.adversaries.echo_chamber import EchoChamberAgent
from app.agents.adversaries.gaslighting import GaslightingAgent
from app.agents.adversaries.gish_gallop import GishGallopAgent
from app.agents.adversaries.incremental_commit import IncrementalCommitAgent
from app.agents.adversaries.oasis_channel import GroupChannel
from app.agents.adversaries.persona_break import PersonaBreakAgent
from app.agents.adversaries.temporal_sleight import TemporalSleightAgent
from app.config import Config


_SOC03_AGENT_COUNT = 3   # Echo Chamber: 3 distinct-role agents (Validator/Amplifier/Pressure)
_LS05_AGENT_COUNT = 2    # Gish Gallop: 2 agents covering non-overlapping claim slices

# Multi-agent strategies formatted as a named group chat in the consolidated message
_MULTI_AGENT_CODES = {"SOC-03", "LS-05"}

# Participant name pool — assigned per-agent at spawn, persist across rounds
_PARTICIPANT_NAMES = ["Alex", "Jordan", "Morgan", "Riley", "Casey", "Drew"]

# Execution order: factual manipulators first, social amplifiers second, infra last
_PRIORITY = ["SC-01", "SC-02", "AC-07", "AC-08", "TS-09",
             "SOC-04", "LS-05", "SOC-03", "LS-06"]


def _make_single_agent(code: str, config: Config) -> AdversaryAgent:
    _registry: dict[str, type[AdversaryAgent]] = {
        "SC-01": ConceptCreepAgent,
        "SC-02": ContextButcherAgent,
        "SOC-04": GaslightingAgent,
        "AC-07": AuthoritySpoofingAgent,
        "AC-08": IncrementalCommitAgent,
        "TS-09": TemporalSleightAgent,
        "LS-06": PersonaBreakAgent,
    }
    cls = _registry.get(code)
    if cls is None:
        raise ValueError(f"Unknown single-agent attack code: {code}")
    return cls(config=config)


class OASISCoordinator:
    """
    Coordination layer for adversary agents — runs inside the adversaries_respond
    LangGraph node.

    Single-agent attacks (SC-01, SC-02, SOC-04, AC-07, AC-08, TS-09, LS-06):
    invoked directly via AdversaryAgent.run_attack(); output appended to the
    consolidated round message.

    Multi-agent attacks (SOC-03 × 3, LS-05 × 2):
    Use CAMEL ChatAgent + GroupChannel for shared memory. Each agent reads the
    full group timeline (TARGET posts + all agent posts, across all rounds) before
    responding, then posts its own output to the channel. This gives:
    - Within-round coordination: agent N+1 sees agent N's current-round output
    - Cross-round memory: all agents see the complete group history, not just
      their own individual CAMEL history
    """

    def __init__(self, strategies: list[str], config: Config | None = None) -> None:
        self._cfg = config or Config()
        self._agents: dict[str, list[AdversaryAgent | CamelAdversaryAgent]] = {}
        self._names: dict[str, list[str]] = {}
        self._channels: dict[str, GroupChannel] = {}
        self._name_counter = 0
        self._init_pool(strategies)

    def _next_names(self, count: int) -> list[str]:
        names = []
        for _ in range(count):
            names.append(_PARTICIPANT_NAMES[self._name_counter % len(_PARTICIPANT_NAMES)])
            self._name_counter += 1
        return names

    def _init_pool(self, strategies: list[str]) -> None:
        for code in strategies:
            self._spawn(code)

    def _spawn(self, code: str) -> None:
        if code == "SOC-03":
            channel = GroupChannel("SOC-03")
            self._channels[code] = channel
            names = self._next_names(_SOC03_AGENT_COUNT)
            self._agents[code] = [
                EchoChamberAgent(role_index=i, name=names[i], channel=channel, config=self._cfg)
                for i in range(_SOC03_AGENT_COUNT)
            ]
            self._names[code] = names

        elif code == "LS-05":
            channel = GroupChannel("LS-05")
            self._channels[code] = channel
            names = self._next_names(_LS05_AGENT_COUNT)
            self._agents[code] = [
                GishGallopAgent(role_index=i, name=names[i], channel=channel, config=self._cfg)
                for i in range(_LS05_AGENT_COUNT)
            ]
            self._names[code] = names

        else:
            self._agents[code] = [_make_single_agent(code, self._cfg)]

    def add_strategy(self, code: str) -> None:
        """Activate a new attack strategy mid-simulation (adaptive escalation)."""
        if code not in self._agents:
            self._spawn(code)

    def run_round(
        self,
        target_response: str,
        round_num: int,
        seed_text: str = "",
    ) -> tuple[str, list[str], list[str]]:
        """
        Run all active adversaries for one round.

        For OASIS multi-agent strategies (SOC-03, LS-05): post the target
        response to the group channel first so agents see it in their context,
        then run agents in sequence so each sees prior agents' current outputs.

        Returns:
            consolidated_message: full adversarial message delivered to the target.
            raw_outputs: one string per agent invocation (for claim registry).
            output_codes: attack code per output (aligned with raw_outputs).
        """
        # Round 1 only: post seed document into all CAMEL channels as DOMAIN_BRIEF
        # so every agent has the domain vocabulary permanently in their history.
        if round_num == 1 and seed_text.strip():
            for code, channel in self._channels.items():
                if self._agents.get(code):
                    channel.post("DOMAIN_BRIEF", seed_text.strip()[:3000], 0)

        # Post target response to group channels before agents run
        for code, channel in self._channels.items():
            if self._agents.get(code):
                channel.post_target(target_response, round_num)

        outputs: list[str] = []
        codes: list[str] = []
        segments: list[tuple[bool, str, str]] = []  # (is_multi, label, text)

        # Single-agent outputs accumulated so SOC-03/LS-05 can amplify specific claims
        single_agent_outputs: list[str] = []
        # Round 1 seed prefix for single-agent adversaries (same domain grounding)
        seed_prefix = f"[Domain brief — the subject you are attacking]\n{seed_text.strip()[:3000]}\n\n" if round_num == 1 and seed_text.strip() else ""

        for code in _PRIORITY:
            agents = self._agents.get(code)
            if not agents:
                continue

            if code in _MULTI_AGENT_CODES and single_agent_outputs:
                channel = self._channels.get(code)
                if channel:
                    channel.post("OTHER_ADVERSARIES", single_agent_outputs[-1], round_num)

            is_multi = code in _MULTI_AGENT_CODES
            names = self._names.get(code, [])

            for i, agent in enumerate(agents):
                if isinstance(agent, CamelAdversaryAgent):
                    # CAMEL agents read the GroupChannel themselves
                    output = agent.run_attack(
                        target_response=target_response,
                        round_num=round_num,
                        seed_text=seed_text,
                    )
                else:
                    prior_ctx = "\n\n".join(single_agent_outputs)
                    # On round 1, prepend domain brief so attacks are domain-specific
                    effective_target = seed_prefix + target_response if seed_prefix else target_response
                    output = agent.run_attack(
                        target_response=effective_target,
                        round_num=round_num,
                        prior_adversary_context=prior_ctx,
                    )
                    single_agent_outputs.append(output)

                outputs.append(output)
                codes.append(code)
                label = names[i] if is_multi and i < len(names) else ""
                segments.append((is_multi, label, output))

        # Multi-agent turns → "[Name]: message" / single-agent → plain
        parts: list[str] = []
        for is_multi, label, text in segments:
            parts.append(f"[{label}]: {text}" if is_multi else text)
        consolidated = "\n\n".join(parts) if parts else ""
        return consolidated, list(outputs), list(codes)

    @property
    def active_strategies(self) -> list[str]:
        return list(self._agents.keys())
