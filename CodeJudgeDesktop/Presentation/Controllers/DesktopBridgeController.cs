using System;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using CodeJudgeDesktop.Application.UseCases;

namespace CodeJudgeDesktop.Presentation.Controllers
{
    public sealed class DesktopBridgeController
    {
        private readonly Window _window;
        private readonly AuthenticateStudentUseCase _authUseCase;
        private readonly ManageWorkspaceUseCase _workspaceUseCase;
        private bool _isFullscreen;
        private WindowState _previousState = WindowState.Normal;

        public DesktopBridgeController(
            Window window,
            AuthenticateStudentUseCase authUseCase,
            ManageWorkspaceUseCase workspaceUseCase)
        {
            _window = window;
            _authUseCase = authUseCase;
            _workspaceUseCase = workspaceUseCase;
        }

        public async Task<string> HandleActionAsync(string action, string payload)
        {
            switch (action)
            {
                case "auth-login":
                    return await Task.Run(() => _authUseCase.LoginAsync(payload)).ConfigureAwait(false);

                case "auth-profile":
                    return _authUseCase.GetProfile();

                case "auth-logout":
                    return _authUseCase.Logout();

                case "file-open":
                    {
                        string filterType = "code";
                        try
                        {
                            using var pDoc = JsonDocument.Parse(payload);
                            if (pDoc.RootElement.TryGetProperty("filterType", out var ft))
                            {
                                filterType = ft.GetString() ?? "code";
                            }
                        }
                        catch { }
                        return _workspaceUseCase.OpenFile(_window, filterType);
                    }

                case "file-save":
                    {
                        string fileName = "Main.java";
                        string content = "";
                        using var pDoc = JsonDocument.Parse(payload);
                        if (pDoc.RootElement.TryGetProperty("fileName", out var fn)) fileName = fn.GetString() ?? "Main.java";
                        if (pDoc.RootElement.TryGetProperty("content", out var ct)) content = ct.GetString() ?? "";
                        return _workspaceUseCase.SaveFile(_window, fileName, content);
                    }

                case "window-minimize":
                    _window.Dispatcher.Invoke(() =>
                    {
                        _window.WindowState = WindowState.Minimized;
                    });
                    return JsonSerializer.Serialize(new { success = true, state = "minimized" });

                case "window-maximize":
                    {
                        string stateStr = "normal";
                        _window.Dispatcher.Invoke(() =>
                        {
                            if (_isFullscreen)
                            {
                                _isFullscreen = false;
                                _window.WindowStyle = WindowStyle.SingleBorderWindow;
                                _window.WindowState = WindowState.Normal;
                                stateStr = "normal";
                            }
                            else if (_window.WindowState == WindowState.Maximized)
                            {
                                _window.WindowState = WindowState.Normal;
                                stateStr = "normal";
                            }
                            else
                            {
                                _window.WindowState = WindowState.Maximized;
                                stateStr = "maximized";
                            }
                        });
                        return JsonSerializer.Serialize(new { success = true, state = stateStr });
                    }

                case "window-fullscreen":
                    {
                        string stateStr = "normal";
                        _window.Dispatcher.Invoke(() =>
                        {
                            if (!_isFullscreen)
                            {
                                _previousState = _window.WindowState;
                                _isFullscreen = true;
                                _window.WindowState = WindowState.Normal;
                                _window.WindowStyle = WindowStyle.None;
                                _window.WindowState = WindowState.Maximized;
                                stateStr = "fullscreen";
                            }
                            else
                            {
                                _isFullscreen = false;
                                _window.WindowStyle = WindowStyle.SingleBorderWindow;
                                _window.WindowState = _previousState == WindowState.Minimized ? WindowState.Normal : _previousState;
                                stateStr = _window.WindowState == WindowState.Maximized ? "maximized" : "normal";
                            }
                        });
                        return JsonSerializer.Serialize(new { success = true, state = stateStr });
                    }

                case "window-close":
                    _window.Dispatcher.Invoke(() =>
                    {
                        _window.Close();
                    });
                    return JsonSerializer.Serialize(new { success = true });

                default:
                    return JsonSerializer.Serialize(new { success = false, message = "Ação desconhecida." });
            }
        }
    }
}
