using System;
using System.Diagnostics;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using CodeJudgeDesktop.Domain.Interfaces;
using CodeJudgeDesktop.Infrastructure.Security;

namespace CodeJudgeDesktop.Infrastructure.Updates
{
    public sealed class GitHubUpdateGateway : IUpdateGateway
    {
        public const string CurrentVersion = "2.0.0";
        private static readonly HttpClient HttpInstance = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };

        public async Task VerifyMandatoryUpdatesAsync(Window parentWindow)
        {
            try
            {
                string versionUrl = CryptoVault.GetVersionEndpoint();
                string fallbackReleases = CryptoVault.GetReleasesUrl();

                var response = await HttpInstance.GetStringAsync(versionUrl).ConfigureAwait(false);
                using var doc = JsonDocument.Parse(response);
                var root = doc.RootElement;

                string remoteVersion = root.GetProperty("version").GetString() ?? "";
                string downloadUrl = root.TryGetProperty("downloadUrl", out var dl)
                    ? dl.GetString() ?? fallbackReleases
                    : fallbackReleases;

                bool mandatory = root.TryGetProperty("mandatory", out var m) && m.GetBoolean();

                if (IsNewerVersion(remoteVersion, CurrentVersion))
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
                            System.Windows.Application.Current.Shutdown();
                        }
                        else if (mandatory)
                        {
                            MessageBox.Show(
                                "O CodeJudge não pode continuar na versão desatualizada.\nA aplicação será finalizada.",
                                "Acesso Bloqueado",
                                MessageBoxButton.OK,
                                MessageBoxImage.Error
                            );
                            System.Windows.Application.Current.Shutdown();
                        }
                    });
                }
            }
            catch
            {
            }
        }

        private static bool IsNewerVersion(string vRemote, string vCurrent)
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
