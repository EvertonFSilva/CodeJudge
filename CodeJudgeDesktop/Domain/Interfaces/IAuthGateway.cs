using System.Threading.Tasks;

namespace CodeJudgeDesktop.Domain.Interfaces
{
    public interface IAuthGateway
    {
        Task<string> AuthenticateJsonAsync(string requestJson);
        string GetActiveProfileJson();
        string LogoutSessionJson();
    }
}
