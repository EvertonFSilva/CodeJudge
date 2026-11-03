using System;
using System.Threading.Tasks;

namespace CodeJudgeDesktop.Domain.Interfaces
{
    public interface IBackendRuntime : IDisposable
    {
        event Action<bool, string>? StatusChanged;
        bool IsOnline { get; }
        string StatusMessage { get; }
        void StartMonitoring();
        Task<bool> CheckHealthAsync();
        Task<bool> TryStartBackendAsync();
        void StopBackend();
    }
}
