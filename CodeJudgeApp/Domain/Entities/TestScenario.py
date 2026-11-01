from dataclasses import dataclass

@dataclass(slots=True)
class TestScenario:
    input: str = ""
    expected: str = ""
