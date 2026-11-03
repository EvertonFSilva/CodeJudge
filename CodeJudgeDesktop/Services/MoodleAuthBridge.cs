using System.Runtime.InteropServices;
using System.Threading.Tasks;

namespace CodeJudgeDesktop.Services
{
    [ComVisible(true)]
    [ClassInterface(ClassInterfaceType.AutoDual)]
    public class MoodleAuthBridge
    {
        public string Login(string json)
        {
            return Task.Run(() => MoodleAuthService.HandleLoginAsync(json)).GetAwaiter().GetResult();
        }

        public string GetProfile()
        {
            return MoodleAuthService.HandleProfileAsync();
        }

        public string Logout()
        {
            return MoodleAuthService.HandleLogout();
        }
    }
}
