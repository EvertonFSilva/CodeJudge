using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using CodeJudgeDesktop.Domain.Interfaces;
using CodeJudgeDesktop.Infrastructure.Security;

namespace CodeJudgeDesktop.Infrastructure.Runtime
{
    public sealed class PythonBackendRuntime : IBackendRuntime
    {
        private static readonly HttpClient HttpClientInstance = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
        private Process? _backendProcess;
        private CancellationTokenSource? _monitorCts;
        private bool _isDisposed;
        private bool _isStarting;
        private DateTime _lastStartAttempt = DateTime.MinValue;
        private static string? _cachedPythonExe;
        private static string? _cachedMainPyPath;

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
                    bool ok = await CheckHealthAsync().ConfigureAwait(false);
                    if (!ok && !_isStarting)
                    {
                        var timeSinceLast = DateTime.UtcNow - _lastStartAttempt;
                        if (timeSinceLast.TotalSeconds >= 15)
                        {
                            _lastStartAttempt = DateTime.UtcNow;
                            await TryStartBackendAsync().ConfigureAwait(false);
                        }
                    }
                    await Task.Delay(4000, token).ContinueWith(_ => { }).ConfigureAwait(false);
                }
            }, token);
        }

        public async Task<bool> CheckHealthAsync()
        {
            try
            {
                string healthUrl = CryptoVault.GetHealthEndpoint();
                var response = await HttpClientInstance.GetAsync(healthUrl).ConfigureAwait(false);
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

            _isStarting = true;
            try
            {
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
                await Task.Delay(2000).ConfigureAwait(false);
                return await CheckHealthAsync().ConfigureAwait(false);
            }
            catch
            {
                return false;
            }
            finally
            {
                _isStarting = false;
            }
        }

        private static string? LocateMainPy()
        {
            if (_cachedMainPyPath != null && File.Exists(_cachedMainPyPath))
            {
                return _cachedMainPyPath;
            }

            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string[] candidates = new[]
            {
                Path.Combine(baseDir, "backend", "Main.py"),
                Path.GetFullPath(Path.Combine(baseDir, "..", "CodeJudgeApp", "Main.py")),
                Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "..", "CodeJudgeApp", "Main.py"))
            };

            foreach (var path in candidates)
            {
                if (File.Exists(path))
                {
                    _cachedMainPyPath = path;
                    return path;
                }
            }
            return null;
        }

        private static string? LocatePythonExe()
        {
            if (_cachedPythonExe != null)
            {
                return _cachedPythonExe;
            }

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
                        if (p.ExitCode == 0)
                        {
                            _cachedPythonExe = cmd;
                            return cmd;
                        }
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
