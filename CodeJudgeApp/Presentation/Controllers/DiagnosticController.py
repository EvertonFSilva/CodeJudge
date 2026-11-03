from Application.UseCases.DiagnoseErrorUseCase import DiagnoseErrorUseCase
from Presentation.Schemas.Requests.DiagnosticRequest import DiagnosticRequest
from Presentation.Schemas.Responses.DiagnosticResponse import DiagnosticResponse

class DiagnosticController:
    def __init__(self, diagnoseErrorUseCase: DiagnoseErrorUseCase):
        self.diagnoseErrorUseCase = diagnoseErrorUseCase

    def diagnose(self, request: DiagnosticRequest) -> DiagnosticResponse:
        errorType = (request.errorType or "compilation").lower()
        if errorType == "execution":
            feedback = self.diagnoseErrorUseCase.diagnoseExecutionError(
                statement=request.statement or "",
                language=request.language,
                code=request.code,
                errorMessage=request.logs or "",
                apiKey=request.apiKey,
                engine=request.engine,
                model=request.model
            )
        elif errorType in ("logic", "mismatch", "logicmismatch"):
            feedback = self.diagnoseErrorUseCase.diagnoseLogicMismatch(
                statement=request.statement or "",
                language=request.language,
                code=request.code,
                mismatchDetails=request.logs or "",
                apiKey=request.apiKey,
                engine=request.engine,
                model=request.model
            )
        else:
            feedback = self.diagnoseErrorUseCase.diagnoseCompilationError(
                statement=request.statement or "",
                language=request.language,
                code=request.code,
                logs=request.logs or "",
                apiKey=request.apiKey,
                engine=request.engine,
                model=request.model
            )

        return DiagnosticResponse(
            success=True,
            feedback=feedback
        )
