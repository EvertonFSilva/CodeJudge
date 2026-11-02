using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using Microsoft.Web.WebView2.Core;
using CodeJudgeDesktop.Services;

namespace CodeJudgeDesktop
{
    public partial class MainWindow : Window
    {
        private readonly BackendSupervisor _supervisor = new BackendSupervisor();
        private bool _isInitialized;
        private bool _hasLoadedOnce;

        public MainWindow()
        {
            InitializeComponent();
            Loaded += MainWindow_Loaded;
            Closing += MainWindow_Closing;
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
                    "CodeJudge - Erro",
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

            var env = await CoreWebView2Environment.CreateAsync(null, userDataDir);
            await MainWebView.EnsureCoreWebView2Async(env);

            var settings = MainWebView.CoreWebView2.Settings;
            settings.IsStatusBarEnabled = false;
            settings.AreDefaultContextMenusEnabled = true;
            settings.AreDevToolsEnabled = false;
            settings.IsZoomControlEnabled = false;
            settings.AreBrowserAcceleratorKeysEnabled = false;

            MainWebView.CoreWebView2.AddHostObjectToScript("moodleAuth", new MoodleAuthBridge());

            string fetchInterceptorScript = @"
            (function() {
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
                            const bridge = window.chrome.webview.hostObjects.moodleAuth;
                            const result = await bridge.Login(bodyStr);
                            return new Response(result, {
                                status: 200,
                                statusText: 'OK',
                                headers: { 'Content-Type': 'application/json' }
                            });
                        } catch (err) {
                            return new Response(JSON.stringify({ success: false, message: 'Falha no login desktop: ' + err }), {
                                status: 200,
                                statusText: 'OK',
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                    }

                    if (urlStr.includes('/auth/profile')) {
                        try {
                            const bridge = window.chrome.webview.hostObjects.moodleAuth;
                            const result = await bridge.GetProfile();
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
                            const bridge = window.chrome.webview.hostObjects.moodleAuth;
                            await bridge.Logout();
                            return new Response(JSON.stringify({ success: true }), {
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

            await MainWebView.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(fetchInterceptorScript);

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

                    string jsonResult = await MoodleAuthService.HandleLoginAsync(body);
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
                    string jsonResult = JsonSerializer.Serialize(new { success = true });
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

            string devDist = Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "..", "CodeJudgeWeb", "dist"));
            if (Directory.Exists(devDist) && File.Exists(Path.Combine(devDist, "index.html")))
            {
                return devDist;
            }

            return localWww;
        }

        private void OnBackendStatusChanged(bool isOnline, string message)
        {
            Dispatcher.Invoke(() =>
            {
                if (isOnline && _hasLoadedOnce && MainWebView.CoreWebView2 != null)
                {
                    MainWebView.CoreWebView2.ExecuteScriptAsync(
                        "window.dispatchEvent(new CustomEvent('backend-status-change', { detail: { online: true } }));"
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
