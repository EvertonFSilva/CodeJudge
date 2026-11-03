using System.Threading.Tasks;
using CodeJudgeDesktop.Domain.Interfaces;

namespace CodeJudgeDesktop.Application.UseCases
{
    public sealed class AuthenticateStudentUseCase
    {
        private readonly IAuthGateway _authGateway;

        public AuthenticateStudentUseCase(IAuthGateway authGateway)
        {
            _authGateway = authGateway;
        }

        public Task<string> LoginAsync(string requestJson)
        {
            return _authGateway.AuthenticateJsonAsync(requestJson);
        }

        public string GetProfile()
        {
            return _authGateway.GetActiveProfileJson();
        }

        public string Logout()
        {
            return _authGateway.LogoutSessionJson();
        }
    }
}
