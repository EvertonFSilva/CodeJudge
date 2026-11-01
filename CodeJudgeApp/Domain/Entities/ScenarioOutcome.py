from dataclasses import dataclass

@dataclass(slots=True)
class ScenarioOutcome:
    input: str
    expected: str
    actual: str
    passed: bool
