using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Interop;
using Microsoft.Web.WebView2.Core;
using CodeJudgeDesktop.Services;

namespace CodeJudgeDesktop
{
    public partial class MainWindow : Window
    {
        [DllImport("dwmapi.dll", PreserveSig = true)]
        private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int attrValue, int attrSize);

        private readonly BackendSupervisor _supervisor = new BackendSupervisor();
        private bool _isInitialized;
        private bool _hasLoadedOnce;

        public MainWindow()
        {
            InitializeComponent();
            SourceInitialized += MainWindow_SourceInitialized;
            Loaded += MainWindow_Loaded;
            Closing += MainWindow_Closing;
        }

        private void MainWindow_SourceInitialized(object? sender, EventArgs e)
        {
            try
            {
                IntPtr hwnd = new WindowInteropHelper(this).Handle;
                if (hwnd != IntPtr.Zero)
                {
                    int useDarkMode = 1;
                    DwmSetWindowAttribute(hwnd, 20, ref useDarkMode, sizeof(int));
                    DwmSetWindowAttribute(hwnd, 19, ref useDarkMode, sizeof(int));
                }
            }
            catch
            {
            }
        }

        private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            if (_isInitialized) return;
            _isInitialized = true;

            _supervisor.StatusChanged += OnBackendStatusChanged;
            _supervisor.StartMonitoring();

            _ = UpdateChecker.CheckForMandatoryUpdatesAsync(this);

            try
            {
                await InitializeWebViewAsync();
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    $"Erro ao inicializar o ambiente desktop:\n\n{ex.Message}",
                    "CodeJudge",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error
                );
            }
        }

        private async Task InitializeWebViewAsync()
        {
            string userDataDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "CodeJudge",
                "WebView2Data"
            );
            Directory.CreateDirectory(userDataDir);

            try
            {
                string cacheDir = Path.Combine(userDataDir, "EBWebView", "Default", "Cache");
                if (Directory.Exists(cacheDir)) Directory.Delete(cacheDir, true);
                string codeCacheDir = Path.Combine(userDataDir, "EBWebView", "Default", "Code Cache");
                if (Directory.Exists(codeCacheDir)) Directory.Delete(codeCacheDir, true);
            }
            catch
            {
            }

            var env = await CoreWebView2Environment.CreateAsync(null, userDataDir);
            await MainWebView.EnsureCoreWebView2Async(env);

            var settings = MainWebView.CoreWebView2.Settings;
            settings.IsStatusBarEnabled = false;
            settings.AreDefaultContextMenusEnabled = true;
            settings.AreDevToolsEnabled = false;
            settings.IsZoomControlEnabled = false;
            settings.AreBrowserAcceleratorKeysEnabled = false;

            try
            {
                await MainWebView.CoreWebView2.CallDevToolsProtocolMethodAsync("Network.enable", "{}");
                await MainWebView.CoreWebView2.CallDevToolsProtocolMethodAsync("Network.setCacheDisabled", "{\"cacheDisabled\":true}");
            }
            catch
            {
            }

            MainWebView.CoreWebView2.AddHostObjectToScript("moodleAuth", new MoodleAuthBridge());
            MainWebView.CoreWebView2.WebMessageReceived += CoreWebView2_WebMessageReceived;

            string bridgeScript = @"
            (function() {
                const pendingMap = new Map();

                if (window.chrome && window.chrome.webview) {
                    window.chrome.webview.addEventListener('message', function(event) {
                        try {
                            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                            if (data && data.requestId && pendingMap.has(data.requestId)) {
                                const entry = pendingMap.get(data.requestId);
                                clearTimeout(entry.timer);
                                pendingMap.delete(data.requestId);
                                entry.resolve(data.payload);
                            }
                        } catch (e) {}
                    });
                }

                window.__cjNativeCall = function(action, payloadObj) {
                    return new Promise(function(resolve) {
                        if (!window.chrome || !window.chrome.webview) {
                            resolve(JSON.stringify({ success: false, message: 'Bridge nativo indisponível.' }));
                            return;
                        }
                        const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2);
                        const timer = setTimeout(function() {
                            if (pendingMap.has(requestId)) {
                                pendingMap.delete(requestId);
                                resolve(JSON.stringify({ success: false, message: 'Tempo limite esgotado na operação.' }));
                            }
                        }, 22000);

                        pendingMap.set(requestId, { resolve: resolve, timer: timer });
                        const rawPayload = typeof payloadObj === 'string' ? payloadObj : JSON.stringify(payloadObj || {});
                        window.chrome.webview.postMessage(JSON.stringify({
                            requestId: requestId,
                            action: action,
                            payload: rawPayload
                        }));
                    });
                };

                const origFetch = window.fetch;
                window.fetch = async function(resource, init) {
                    let urlStr = '';
                    if (typeof resource === 'string') {
                        urlStr = resource;
                    } else if (resource && resource.url) {
                        urlStr = resource.url;
                    }

                    if (urlStr.includes('/auth/login')) {
                        try {
                            let bodyStr = (init && init.body) ? (typeof init.body === 'string' ? init.body : JSON.stringify(init.body)) : '{}';
                            const result = await window.__cjNativeCall('auth-login', bodyStr);
                            return new Response(result, {
                                status: 200,
                                statusText: 'OK',
                                headers: { 'Content-Type': 'application/json' }
                            });
                        } catch (err) {
                            return new Response(JSON.stringify({ success: false, message: 'Falha ao autenticar: ' + err }), {
                                status: 200,
                                statusText: 'OK',
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                    }

                    if (urlStr.includes('/auth/profile')) {
                        try {
                            const result = await window.__cjNativeCall('auth-profile', '{}');
                            return new Response(result, {
                                status: 200,
                                statusText: 'OK',
                                headers: { 'Content-Type': 'application/json' }
                            });
                        } catch (err) {
                            return new Response(JSON.stringify({ success: false, message: 'Falha ao obter perfil' }), {
                                status: 200,
                                statusText: 'OK',
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                    }

                    if (urlStr.includes('/auth/logout')) {
                        try {
                            const result = await window.__cjNativeCall('auth-logout', '{}');
                            return new Response(result, {
                                status: 200,
                                statusText: 'OK',
                                headers: { 'Content-Type': 'application/json' }
                            });
                        } catch {
                            return new Response(JSON.stringify({ success: true }), {
                                status: 200,
                                statusText: 'OK',
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                    }

                    return origFetch.apply(this, arguments);
                };
            })();
            ";

            await MainWebView.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(bridgeScript);

            MainWebView.CoreWebView2.AddWebResourceRequestedFilter(
                "https://app.codejudge.local/auth/*",
                CoreWebView2WebResourceContext.All
            );
            MainWebView.CoreWebView2.AddWebResourceRequestedFilter(
                "https://app.codejudge.local/api/auth/*",
                CoreWebView2WebResourceContext.All
            );
            MainWebView.CoreWebView2.WebResourceRequested += CoreWebView2_WebResourceRequested;

            string wwwDir = ResolveWebDistDirectory();

            if (Directory.Exists(wwwDir) && File.Exists(Path.Combine(wwwDir, "index.html")))
            {
                MainWebView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                    "app.codejudge.local",
                    wwwDir,
                    CoreWebView2HostResourceAccessKind.Allow
                );

                MainWebView.NavigationCompleted += (s, args) =>
                {
                    _hasLoadedOnce = true;
                    LoadingOverlay.Visibility = Visibility.Collapsed;
                };

                MainWebView.CoreWebView2.Navigate("https://app.codejudge.local/index.html");
            }
        }

        private async void CoreWebView2_WebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            string requestId = "";
            string action = "";
            string payload = "";

            try
            {
                string rawMsg = e.TryGetWebMessageAsString();
                using var doc = JsonDocument.Parse(rawMsg);
                var root = doc.RootElement;
                if (root.TryGetProperty("requestId", out var rId)) requestId = rId.GetString() ?? "";
                if (root.TryGetProperty("action", out var act)) action = act.GetString() ?? "";
                if (root.TryGetProperty("payload", out var pld)) payload = pld.GetString() ?? "";
            }
            catch
            {
                return;
            }

            if (string.IsNullOrEmpty(requestId)) return;

            string responsePayload = "{}";

            try
            {
                switch (action)
                {
                    case "auth-login":
                        responsePayload = await Task.Run(() => MoodleAuthService.HandleLoginAsync(payload));
                        break;

                    case "auth-profile":
                        responsePayload = MoodleAuthService.HandleProfileAsync();
                        break;

                    case "auth-logout":
                        responsePayload = MoodleAuthService.HandleLogout();
                        break;

                    case "examples-list":
                        responsePayload = await Task.Run(() => WorkspaceService.GetExamplesCatalogJson());
                        break;

                    case "example-load":
                        {
                            string folder = "";
                            string fileName = "Main.java";
                            using var pDoc = JsonDocument.Parse(payload);
                            if (pDoc.RootElement.TryGetProperty("folder", out var fProp)) folder = fProp.GetString() ?? "";
                            if (pDoc.RootElement.TryGetProperty("fileName", out var fnProp)) fileName = fnProp.GetString() ?? "Main.java";
                            responsePayload = await Task.Run(() => WorkspaceService.LoadExampleJson(folder, fileName));
                        }
                        break;

                    case "file-open":
                        {
                            string filterType = "code";
                            try
                            {
                                using var pDoc = JsonDocument.Parse(payload);
                                if (pDoc.RootElement.TryGetProperty("filterType", out var ft)) filterType = ft.GetString() ?? "code";
                            }
                            catch { }
                            responsePayload = WorkspaceService.OpenFileFromDisk(this, filterType);
                        }
                        break;

                    case "file-save":
                        {
                            string fileName = "Main.java";
                            string content = "";
                            using var pDoc = JsonDocument.Parse(payload);
                            if (pDoc.RootElement.TryGetProperty("fileName", out var fn)) fileName = fn.GetString() ?? "Main.java";
                            if (pDoc.RootElement.TryGetProperty("content", out var ct)) content = ct.GetString() ?? "";
                            responsePayload = WorkspaceService.SaveFileToDisk(this, fileName, content);
                        }
                        break;

                    default:
                        responsePayload = JsonSerializer.Serialize(new { success = false, message = "Ação desconhecida." });
                        break;
                }
            }
            catch (Exception ex)
            {
                responsePayload = JsonSerializer.Serialize(new { success = false, message = ex.Message });
            }

            try
            {
                if (MainWebView.CoreWebView2 != null)
                {
                    string reply = JsonSerializer.Serialize(new
                    {
                        requestId,
                        payload = responsePayload
                    });
                    MainWebView.CoreWebView2.PostWebMessageAsString(reply);
                }
            }
            catch
            {
            }
        }

        private async void CoreWebView2_WebResourceRequested(object? sender, CoreWebView2WebResourceRequestedEventArgs e)
        {
            var uri = e.Request.Uri;
            var deferral = e.GetDeferral();

            try
            {
                if (uri.Contains("/auth/login"))
                {
                    string body = "";
                    if (e.Request.Content != null)
                    {
                        using var reader = new StreamReader(e.Request.Content, Encoding.UTF8, leaveOpen: true);
                        body = await reader.ReadToEndAsync();
                    }

                    string jsonResult = await Task.Run(() => MoodleAuthService.HandleLoginAsync(body));
                    var stream = new MemoryStream(Encoding.UTF8.GetBytes(jsonResult));

                    e.Response = MainWebView.CoreWebView2.Environment.CreateWebResourceResponse(
                        stream,
                        200,
                        "OK",
                        "Content-Type: application/json\nAccess-Control-Allow-Origin: *\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\nAccess-Control-Allow-Headers: *\n"
                    );
                    return;
                }

                if (uri.Contains("/auth/profile"))
                {
                    string jsonResult = MoodleAuthService.HandleProfileAsync();
                    var stream = new MemoryStream(Encoding.UTF8.GetBytes(jsonResult));

                    e.Response = MainWebView.CoreWebView2.Environment.CreateWebResourceResponse(
                        stream,
                        200,
                        "OK",
                        "Content-Type: application/json\nAccess-Control-Allow-Origin: *\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\nAccess-Control-Allow-Headers: *\n"
                    );
                    return;
                }

                if (uri.Contains("/auth/logout"))
                {
                    string jsonResult = MoodleAuthService.HandleLogout();
                    var stream = new MemoryStream(Encoding.UTF8.GetBytes(jsonResult));

                    e.Response = MainWebView.CoreWebView2.Environment.CreateWebResourceResponse(
                        stream,
                        200,
                        "OK",
                        "Content-Type: application/json\nAccess-Control-Allow-Origin: *\n"
                    );
                    return;
                }
            }
            catch (Exception ex)
            {
                string errJson = JsonSerializer.Serialize(new { success = false, message = ex.Message });
                var stream = new MemoryStream(Encoding.UTF8.GetBytes(errJson));
                e.Response = MainWebView.CoreWebView2.Environment.CreateWebResourceResponse(
                    stream,
                    200,
                    "OK",
                    "Content-Type: application/json\nAccess-Control-Allow-Origin: *\n"
                );
            }
            finally
            {
                deferral.Complete();
            }
        }

        private static string ResolveWebDistDirectory()
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string localWww = Path.Combine(baseDir, "www");
            if (Directory.Exists(localWww) && File.Exists(Path.Combine(localWww, "index.html")))
            {
                return localWww;
            }

            return localWww;
        }

        private void OnBackendStatusChanged(bool isOnline, string message)
        {
            Dispatcher.Invoke(() =>
            {
                if (_hasLoadedOnce && MainWebView.CoreWebView2 != null)
                {
                    string flag = isOnline ? "true" : "false";
                    MainWebView.CoreWebView2.ExecuteScriptAsync(
                        $"window.dispatchEvent(new CustomEvent('backend-status-change', {{ detail: {{ online: {flag} }} }}));"
                    );
                }
            });
        }

        private void MainWindow_Closing(object? sender, System.ComponentModel.CancelEventArgs e)
        {
            _supervisor.Dispose();
        }
    }
}
