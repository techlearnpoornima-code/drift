from __future__ import annotations

from camel.storages.key_value_storages.in_memory import InMemoryKeyValueStorage


class GroupChannel:
    """
    Shared conversation timeline for a group of OASIS adversary agents.

    Backed by CAMEL's InMemoryKeyValueStorage. All agents in the group post
    to and read from the same channel, giving each agent full visibility of
    what every other group member said — across rounds and within rounds.

    Timeline entry: { "round": int, "speaker": str, "message": str }
    """

    _TARGET_SPEAKER = "TARGET"

    def __init__(self, strategy_code: str) -> None:
        self._storage = InMemoryKeyValueStorage()
        self._strategy_code = strategy_code

    def post(self, speaker: str, message: str, round_num: int) -> None:
        self._storage.save([{
            "round": round_num,
            "speaker": speaker,
            "message": message,
        }])

    def post_target(self, message: str, round_num: int) -> None:
        self.post(self._TARGET_SPEAKER, message, round_num)

    def get_history(self, window: int | None = 14) -> str:
        """Return formatted conversation history, newest `window` entries."""
        records = self._storage.load()
        if window is not None:
            records = records[-window:]
        if not records:
            return ""
        return "\n".join(
            f"[Round {r['round']}] {r['speaker']}: {r['message'][:300]}"
            for r in records
        )

    def clear(self) -> None:
        self._storage.clear()

    @property
    def strategy_code(self) -> str:
        return self._strategy_code
