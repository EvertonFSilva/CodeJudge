using System;
using CodeJudgeDesktop.Domain.Interfaces;

namespace CodeJudgeDesktop.Application.UseCases
{
    public sealed class SuperviseBackendUseCase : IDisposable
    {
        private readonly IBackendRuntime _backendRuntime;

        public SuperviseBackendUseCase(IBackendRuntime backendRuntime)
        {
            _backendRuntime = backendRuntime;
        }

        public event Action<bool, string>? StatusChanged
        {
            add => _backendRuntime.StatusChanged += value;
            remove => _backendRuntime.StatusChanged -= value;
        }

        public void Start()
        {
            _backendRuntime.StartMonitoring();
        }

        public void Dispose()
        {
            _backendRuntime.Dispose();
        }
    }
}
