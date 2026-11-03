using System.Runtime.InteropServices;
using System.Threading.Tasks;
using CodeJudgeDesktop.Application.UseCases;

namespace CodeJudgeDesktop.Presentation.Bridges
{
    [ComVisible(true)]
    public sealed class MoodleComBridge
    {
        private readonly AuthenticateStudentUseCase _authUseCase;

        public MoodleComBridge(AuthenticateStudentUseCase authUseCase)
        {
            _authUseCase = authUseCase;
        }

        public string Login(string jsonBody)
        {
            return Task.Run(async () => await _authUseCase.LoginAsync(jsonBody).ConfigureAwait(false))
                .GetAwaiter()
                .GetResult();
        }

        public string GetProfile()
        {
            return _authUseCase.GetProfile();
        }

        public string Logout()
        {
            return _authUseCase.Logout();
        }
    }
}
