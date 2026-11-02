using System;
using System.Diagnostics;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;

namespace CodeJudgeDesktop.Services
{
    public class VersionInfo
    {
        public string Version { get; set; } = "";
        public string Name { get; set; } = "";
        public string MinRequiredVersion { get; set; } = "";
        public string DownloadUrl { get; set; } = "https://github.com/EvertonFSilva/CodeJudge/releases/latest";
        public bool Mandatory { get; set; } = true;
    }

    public static class UpdateChecker
    {
        public const string CurrentVersion = "2.0.0";
        private const string VersionUrl = "https://raw.githubusercontent.com/EvertonFSilva/CodeJudge/main/version.json";
        private static readonly HttpClient _http = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };

        public static async Task CheckForMandatoryUpdatesAsync(Window parentWindow)
        {
            try
            {
                var response = await _http.GetStringAsync(VersionUrl);
                using var doc = JsonDocument.Parse(response);
                var root = doc.RootElement;

                string remoteVersion = root.GetProperty("version").GetString() ?? "";
                string downloadUrl = root.TryGetProperty("downloadUrl", out var dl)
                    ? dl.GetString() ?? "https://github.com/EvertonFSilva/CodeJudge/releases/latest"
                    : "https://github.com/EvertonFSilva/CodeJudge/releases/latest";

                bool mandatory = root.TryGetProperty("mandatory", out var m) && m.GetBoolean();

                if (IsNewer(remoteVersion, CurrentVersion))
                {
                    parentWindow.Dispatcher.Invoke(() =>
                    {
                        var result = MessageBox.Show(
                            $"Uma nova versão do CodeJudge (v{remoteVersion}) está disponível no GitHub!\n\n" +
                            "Esta atualização é obrigatória para continuar utilizando a ferramenta.\n\n" +
                            "Deseja abrir a página de download no GitHub agora?",
                            "CodeJudge - Atualização Disponível",
                            MessageBoxButton.YesNo,
                            MessageBoxImage.Information
                        );

                        if (result == MessageBoxResult.Yes)
                        {
                            try
                            {
                                Process.Start(new ProcessStartInfo
                                {
                                    FileName = downloadUrl,
                                    UseShellExecute = true
                                });
                            }
                            catch { }
                            Application.Current.Shutdown();
                        }
                        else if (mandatory)
                        {
                            MessageBox.Show(
                                "O CodeJudge não pode continuar na versão desatualizada.\nA aplicação será finalizada.",
                                "Acesso Bloqueado",
                                MessageBoxButton.OK,
                                MessageBoxImage.Error
                            );
                            Application.Current.Shutdown();
                        }
                    });
                }
            }
            catch
            {
            }
        }

        private static bool IsNewer(string vRemote, string vCurrent)
        {
            if (string.IsNullOrWhiteSpace(vRemote)) return false;

            var rParts = vRemote.TrimStart('v').Split('.');
            var cParts = vCurrent.TrimStart('v').Split('.');

            int max = Math.Max(rParts.Length, cParts.Length);
            for (int i = 0; i < max; i++)
            {
                int r = i < rParts.Length && int.TryParse(rParts[i], out int rVal) ? rVal : 0;
                int c = i < cParts.Length && int.TryParse(cParts[i], out int cVal) ? cVal : 0;
                if (r > c) return true;
                if (r < c) return false;
            }
            return false;
        }
    }
}
