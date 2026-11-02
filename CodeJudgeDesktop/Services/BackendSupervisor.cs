using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace CodeJudgeDesktop.Services
{
    public class BackendSupervisor : IDisposable
    {
        private static readonly HttpClient _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
        private Process? _backendProcess;
        private CancellationTokenSource? _monitorCts;
        private bool _isDisposed;

        public event Action<bool, string>? StatusChanged;

        public bool IsOnline { get; private set; }
        public string StatusMessage { get; private set; } = "Conectando ao servidor...";

        public void StartMonitoring()
        {
            _monitorCts?.Cancel();
            _monitorCts = new CancellationTokenSource();
            var token = _monitorCts.Token;

            _ = Task.Run(async () =>
            {
                while (!token.IsCancellationRequested && !_isDisposed)
                {
                    bool ok = await CheckHealthAsync();
                    if (!ok)
                    {
                        await TryStartBackendAsync();
                    }
                    await Task.Delay(2000, token).ContinueWith(_ => { });
                }
            }, token);
        }

        public async Task<bool> CheckHealthAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("http://127.0.0.1:8000/health");
                if (response.IsSuccessStatusCode)
                {
                    if (!IsOnline)
                    {
                        IsOnline = true;
                        StatusMessage = "Conectado";
                        StatusChanged?.Invoke(true, StatusMessage);
                    }
                    return true;
                }
            }
            catch
            {
            }

            if (IsOnline || StatusMessage != "Conectando ao servidor...")
            {
                IsOnline = false;
                StatusMessage = "Conectando ao servidor...";
                StatusChanged?.Invoke(false, StatusMessage);
            }

            return false;
        }

        public async Task<bool> TryStartBackendAsync()
        {
            if (IsOnline || (_backendProcess != null && !_backendProcess.HasExited))
            {
                return true;
            }

            string? mainPyPath = LocateMainPy();
            if (string.IsNullOrEmpty(mainPyPath) || !File.Exists(mainPyPath))
            {
                return false;
            }

            string? pythonExe = LocatePythonExe();
            if (string.IsNullOrEmpty(pythonExe))
            {
                return false;
            }

            try
            {
                string backendDir = Path.GetDirectoryName(mainPyPath)!;
                var psi = new ProcessStartInfo
                {
                    FileName = pythonExe,
                    Arguments = $"\"{mainPyPath}\"",
                    WorkingDirectory = backendDir,
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    RedirectStandardOutput = false,
                    RedirectStandardError = false
                };

                _backendProcess = Process.Start(psi);
                await Task.Delay(1500);
                return await CheckHealthAsync();
            }
            catch
            {
                return false;
            }
        }

        private static string? LocateMainPy()
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string[] candidates = new[]
            {
                Path.Combine(baseDir, "backend", "Main.py"),
                Path.GetFullPath(Path.Combine(baseDir, "..", "CodeJudgeApp", "Main.py")),
                Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "..", "CodeJudgeApp", "Main.py")),
                @"C:\Users\evert\OneDrive\Desktop\CodeJudge\CodeJudgeApp\Main.py"
            };

            foreach (var path in candidates)
            {
                if (File.Exists(path))
                {
                    return path;
                }
            }
            return null;
        }

        private static string? LocatePythonExe()
        {
            string[] candidates = new[] { "python", "python3", "py" };
            foreach (var cmd in candidates)
            {
                try
                {
                    var psi = new ProcessStartInfo
                    {
                        FileName = cmd,
                        Arguments = "--version",
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true
                    };
                    using var p = Process.Start(psi);
                    if (p != null)
                    {
                        p.WaitForExit(1500);
                        if (p.ExitCode == 0) return cmd;
                    }
                }
                catch
                {
                }
            }
            return null;
        }

        public void StopBackend()
        {
            try
            {
                if (_backendProcess != null && !_backendProcess.HasExited)
                {
                    _backendProcess.Kill(entireProcessTree: true);
                    _backendProcess.Dispose();
                    _backendProcess = null;
                }
            }
            catch
            {
            }
        }

        public void Dispose()
        {
            if (_isDisposed) return;
            _isDisposed = true;

            _monitorCts?.Cancel();
            _monitorCts?.Dispose();
            StopBackend();
        }
    }
}
