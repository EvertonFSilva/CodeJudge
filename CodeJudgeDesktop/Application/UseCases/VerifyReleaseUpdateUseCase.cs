using System.Threading.Tasks;
using System.Windows;
using CodeJudgeDesktop.Domain.Interfaces;

namespace CodeJudgeDesktop.Application.UseCases
{
    public sealed class VerifyReleaseUpdateUseCase
    {
        private readonly IUpdateGateway _updateGateway;

        public VerifyReleaseUpdateUseCase(IUpdateGateway updateGateway)
        {
            _updateGateway = updateGateway;
        }

        public Task ExecuteAsync(Window parentWindow)
        {
            return _updateGateway.VerifyMandatoryUpdatesAsync(parentWindow);
        }
    }
}
