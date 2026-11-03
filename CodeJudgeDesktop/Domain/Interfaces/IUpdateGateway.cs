using System.Threading.Tasks;
using System.Windows;

namespace CodeJudgeDesktop.Domain.Interfaces
{
    public interface IUpdateGateway
    {
        Task VerifyMandatoryUpdatesAsync(Window parentWindow);
    }
}
