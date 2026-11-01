from typing import List
from Application.UseCases.ExecuteCodeUseCase import ExecuteCodeUseCase
from Domain.Entities.TestScenario import TestScenario
from Presentation.Schemas.Requests.ExecutionRequest import ExecutionRequest
from Presentation.Schemas.Responses.ExecutionResponse import ExecutionResponse

class ExecutionController:
    def __init__(self, executeCodeUseCase: ExecuteCodeUseCase):
        self.executeCodeUseCase = executeCodeUseCase

    def execute(self, request: ExecutionRequest) -> ExecutionResponse:
        scenarios: List[TestScenario] = []
        if request.tests:
            for item in request.tests:
                if isinstance(item, dict):
                    inVal = str(item.get("input", "")).strip()
                    expVal = str(item.get("expected", "")).strip()
                    if inVal or expVal:
                        scenarios.append(TestScenario(
                            input=str(item.get("input", "")),
                            expected=str(item.get("expected", ""))
                        ))

        report = self.executeCodeUseCase.execute(
            statement=request.statement or "",
            language=request.language,
            code=request.code,
            scenarios=scenarios
        )

        return ExecutionResponse(
            success=report.success,
            message=report.message,
            inputs=report.inputs,
            outputs=report.outputs,
            rate=report.rate,
            details=report.details,
            rawOutput=report.rawOutput,
            durationMs=report.durationMs
        )
