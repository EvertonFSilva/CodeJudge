using System;
using System.Diagnostics;
using System.Reflection;
using System.Runtime.CompilerServices;

namespace CodeJudgeDesktop.Infrastructure.Security
{
    public static class RuntimeShield
    {
        [MethodImpl(MethodImplOptions.NoInlining)]
        public static bool VerifyRuntimeIntegrity()
        {
            try
            {
                var asm = Assembly.GetExecutingAssembly();
                if (asm == null || string.IsNullOrEmpty(asm.FullName))
                {
                    return false;
                }

                if (Debugger.IsLogging())
                {
                    return false;
                }

                string checkHost = CryptoVault.GetVirtualHost();
                return !string.IsNullOrEmpty(checkHost);
            }
            catch
            {
                return false;
            }
        }
    }
}
