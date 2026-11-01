from Application.UseCases.HealthUseCase import HealthUseCase
from Presentation.Schemas.Responses.HealthResponse import HealthResponse

class HealthController:
    def __init__(self, healthUseCase: HealthUseCase):
        self.healthUseCase = healthUseCase

    def check(self) -> HealthResponse:
        data = self.healthUseCase.check()
        return HealthResponse(
            status=data["status"],
            compilers=data["compilers"],
            ai=data["ai"]
        )
