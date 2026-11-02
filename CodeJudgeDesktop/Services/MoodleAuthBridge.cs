using System.Runtime.InteropServices;
using System.Text.Json;
using System.Threading.Tasks;

namespace CodeJudgeDesktop.Services
{
    [ComVisible(true)]
    [ClassInterface(ClassInterfaceType.AutoDual)]
    public class MoodleAuthBridge
    {
        public string Login(string json)
        {
            return MoodleAuthService.HandleLoginAsync(json).GetAwaiter().GetResult();
        }

        public string GetProfile()
        {
            return MoodleAuthService.HandleProfileAsync();
        }

        public string Logout()
        {
            return JsonSerializer.Serialize(new { success = true });
        }
    }
}
