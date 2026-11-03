using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace CodeJudgeDesktop.Services
{
    public static class MoodleAuthService
    {
        private const string LoginUrl = "https://ead2.iff.edu.br/login/index.php";
        private const string ProfileUrl = "https://ead2.iff.edu.br/user/profile.php";
        private const string UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36";

        private static object? _cachedProfile;

        private static string GetSessionFilePath()
        {
            string dir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "CodeJudge"
            );
            Directory.CreateDirectory(dir);
            return Path.Combine(dir, "session_profile.json");
        }

        private static string ExtractCookieHeader(HttpResponseMessage response)
        {
            if (!response.Headers.TryGetValues("Set-Cookie", out var setCookies))
            {
                return "";
            }

            var parts = new List<string>();
            foreach (var raw in setCookies)
            {
                if (string.IsNullOrWhiteSpace(raw)) continue;
                string firstPart = raw.Split(';')[0].Trim();
                if (!string.IsNullOrWhiteSpace(firstPart))
                {
                    parts.Add(firstPart);
                }
            }
            return string.Join("; ", parts);
        }

        public static async Task<string> HandleLoginAsync(string requestJson)
        {
            string username = "";
            string password = "";
            try
            {
                using var doc = JsonDocument.Parse(requestJson);
                if (doc.RootElement.TryGetProperty("username", out var u))
                    username = (u.GetString() ?? "").Trim();
                if (doc.RootElement.TryGetProperty("password", out var p))
                    password = p.GetString() ?? "";
            }
            catch
            {
                return JsonSerializer.Serialize(new { success = false, message = "Dados de login inválidos." });
            }

            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                return JsonSerializer.Serialize(new { success = false, message = "Por favor, preencha o CPF e a senha institucional." });
            }

            try
            {
                using var handler = new HttpClientHandler
                {
                    AllowAutoRedirect = false,
                    UseCookies = false
                };

                using var client = new HttpClient(handler)
                {
                    Timeout = TimeSpan.FromSeconds(18)
                };

                var getReq = new HttpRequestMessage(HttpMethod.Get, LoginUrl);
                getReq.Headers.TryAddWithoutValidation("User-Agent", UserAgent);
                getReq.Headers.TryAddWithoutValidation("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");

                var getResp = await client.SendAsync(getReq).ConfigureAwait(false);
                if (!getResp.IsSuccessStatusCode)
                {
                    return JsonSerializer.Serialize(new { success = false, message = "Não foi possível conectar ao Moodle IFF." });
                }

                string getHtml = await getResp.Content.ReadAsStringAsync().ConfigureAwait(false);
                var tokenMatch = Regex.Match(getHtml, @"name=[""']logintoken[""']\s+value=[""']([^""']+)[""']", RegexOptions.IgnoreCase);
                if (!tokenMatch.Success)
                {
                    tokenMatch = Regex.Match(getHtml, @"value=[""']([^""']+)[""']\s+name=[""']logintoken[""']", RegexOptions.IgnoreCase);
                }

                if (!tokenMatch.Success)
                {
                    return JsonSerializer.Serialize(new { success = false, message = "Falha ao obter token de login do Moodle IFF." });
                }

                string loginToken = tokenMatch.Groups[1].Value;
                string cookieHeader = ExtractCookieHeader(getResp);

                var postReq = new HttpRequestMessage(HttpMethod.Post, LoginUrl);
                postReq.Headers.TryAddWithoutValidation("Origin", "https://ead2.iff.edu.br");
                postReq.Headers.TryAddWithoutValidation("Referer", LoginUrl);
                postReq.Headers.TryAddWithoutValidation("User-Agent", UserAgent);
                if (!string.IsNullOrEmpty(cookieHeader))
                {
                    postReq.Headers.TryAddWithoutValidation("Cookie", cookieHeader);
                }

                postReq.Content = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("logintoken", loginToken),
                    new KeyValuePair<string, string>("username", username),
                    new KeyValuePair<string, string>("password", password)
                });

                var postResp = await client.SendAsync(postReq).ConfigureAwait(false);
                string redirectLocation = postResp.Headers.Location?.ToString() ?? "";

                if (redirectLocation.Contains("loginredirect=1", StringComparison.OrdinalIgnoreCase))
                {
                    return JsonSerializer.Serialize(new { success = false, message = "Usuário ou senha inválidos no Moodle IFF." });
                }

                string postCookieHeader = ExtractCookieHeader(postResp);
                if (string.IsNullOrEmpty(postCookieHeader) || !postCookieHeader.Contains("MoodleSession=", StringComparison.OrdinalIgnoreCase))
                {
                    return JsonSerializer.Serialize(new { success = false, message = "Usuário ou senha inválidos no Moodle IFF." });
                }

                var profileReq = new HttpRequestMessage(HttpMethod.Get, ProfileUrl);
                profileReq.Headers.TryAddWithoutValidation("User-Agent", UserAgent);
                profileReq.Headers.TryAddWithoutValidation("Referer", LoginUrl);
                profileReq.Headers.TryAddWithoutValidation("Cookie", postCookieHeader);

                var profileResp = await client.SendAsync(profileReq).ConfigureAwait(false);
                if (profileResp.StatusCode != HttpStatusCode.OK)
                {
                    return JsonSerializer.Serialize(new { success = false, message = "Usuário ou senha inválidos no Moodle IFF." });
                }

                string profileHtml = await profileResp.Content.ReadAsStringAsync().ConfigureAwait(false);
                if (!profileHtml.Contains("card-profile", StringComparison.OrdinalIgnoreCase))
                {
                    return JsonSerializer.Serialize(new { success = false, message = "Usuário ou senha inválidos no Moodle IFF." });
                }

                var profileObj = ParseMoodleProfile(profileHtml, username);
                if (profileObj == null)
                {
                    return JsonSerializer.Serialize(new { success = false, message = "Usuário ou senha inválidos no Moodle IFF." });
                }

                _cachedProfile = profileObj;
                try
                {
                    File.WriteAllText(GetSessionFilePath(), JsonSerializer.Serialize(profileObj), Encoding.UTF8);
                }
                catch
                {
                }

                string authToken = "token_" + Guid.NewGuid().ToString("N");

                var result = new
                {
                    success = true,
                    message = "Login realizado com sucesso via Moodle IFF.",
                    token = authToken,
                    authToken = authToken,
                    profile = profileObj
                };

                return JsonSerializer.Serialize(result);
            }
            catch (TaskCanceledException)
            {
                return JsonSerializer.Serialize(new
                {
                    success = false,
                    message = "Tempo limite esgotado ao conectar ao Moodle IFF. Verifique sua conexão com a internet."
                });
            }
            catch (Exception ex)
            {
                return JsonSerializer.Serialize(new
                {
                    success = false,
                    message = $"Erro na comunicação com o Moodle IFF: {ex.Message}"
                });
            }
        }

        private static Dictionary<string, object>? ParseMoodleProfile(string html, string fallbackUsername)
        {
            var cardMatch = Regex.Match(html, @"<div[^>]*class=[""'][^""']*card-profile[^""']*[""'][^>]*>([\s\S]*?)<\/div>", RegexOptions.IgnoreCase);
            string searchScope = cardMatch.Success ? cardMatch.Groups[1].Value : html;

            var nameMatch = Regex.Match(searchScope, @"<h3[^>]*>([\s\S]*?)<\/h3>", RegexOptions.IgnoreCase);
            if (!nameMatch.Success)
            {
                nameMatch = Regex.Match(html, @"<h3[^>]*>([\s\S]*?)<\/h3>", RegexOptions.IgnoreCase);
            }

            string name = "";
            if (nameMatch.Success)
            {
                string rawName = WebUtility.HtmlDecode(Regex.Replace(nameMatch.Groups[1].Value, @"<[^>]+>", "")).Trim();
                int bracketIdx = rawName.IndexOf(" [", StringComparison.Ordinal);
                if (bracketIdx > 0) rawName = rawName.Substring(0, bracketIdx).Trim();
                name = rawName;
            }

            if (string.IsNullOrWhiteSpace(name) || name.Equals(fallbackUsername, StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            string email = "";
            var emailMatch = Regex.Match(html, @"href=[""']mailto:([^""']+)[""']", RegexOptions.IgnoreCase);
            if (emailMatch.Success)
            {
                email = WebUtility.HtmlDecode(emailMatch.Groups[1].Value).Trim();
            }

            var details = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            var dlMatches = Regex.Matches(html, @"<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>", RegexOptions.IgnoreCase);
            foreach (Match m in dlMatches)
            {
                string dt = WebUtility.HtmlDecode(Regex.Replace(m.Groups[1].Value, @"<[^>]+>", "")).Trim().ToLowerInvariant().Replace(":", "");
                string dd = WebUtility.HtmlDecode(Regex.Replace(m.Groups[2].Value, @"<[^>]+>", "")).Trim();
                if (!string.IsNullOrWhiteSpace(dt) && !string.IsNullOrWhiteSpace(dd))
                {
                    details[dt] = dd;
                }
            }

            string city = "";
            foreach (var kv in details)
            {
                if (kv.Key.Contains("cidade") || kv.Key.Contains("munic"))
                {
                    city = kv.Value;
                    break;
                }
            }

            string country = "Brasil";
            foreach (var kv in details)
            {
                if (kv.Key.Contains("país") || kv.Key.Contains("pais"))
                {
                    country = kv.Value;
                    break;
                }
            }

            string campus = "Instituto Federal Fluminense (IFF)";
            foreach (var kv in details)
            {
                if (kv.Key.Contains("campus") || kv.Key.Contains("institui"))
                {
                    campus = kv.Value;
                    break;
                }
            }

            string firstAccess = "";
            string lastAccess = "";
            foreach (var kv in details)
            {
                if (kv.Key.Contains("primeiro acesso")) firstAccess = kv.Value;
                if (kv.Key.Contains("ltimo acesso") || kv.Key.Contains("ultimo acesso")) lastAccess = kv.Value;
            }

            var courses = new List<string>();
            var courseMatches = Regex.Matches(html, @"course\/view\.php\?id=\d+[^>]*>([\s\S]*?)<\/a>", RegexOptions.IgnoreCase);
            foreach (Match cm in courseMatches)
            {
                string cTitle = WebUtility.HtmlDecode(Regex.Replace(cm.Groups[1].Value, @"<[^>]+>", "")).Trim();
                if (!string.IsNullOrWhiteSpace(cTitle) && !courses.Contains(cTitle))
                {
                    courses.Add(cTitle);
                }
            }

            return new Dictionary<string, object>
            {
                ["name"] = name,
                ["email"] = email,
                ["username"] = fallbackUsername,
                ["city"] = city,
                ["country"] = country,
                ["campus"] = campus,
                ["firstAccess"] = string.IsNullOrWhiteSpace(firstAccess) ? "Registrado" : firstAccess,
                ["lastAccess"] = string.IsNullOrWhiteSpace(lastAccess) ? "Agora" : lastAccess,
                ["profileUrl"] = ProfileUrl,
                ["courses"] = courses.ToArray()
            };
        }

        public static string HandleProfileAsync()
        {
            if (_cachedProfile != null)
            {
                return JsonSerializer.Serialize(new { success = true, profile = _cachedProfile });
            }

            try
            {
                string path = GetSessionFilePath();
                if (File.Exists(path))
                {
                    string raw = File.ReadAllText(path, Encoding.UTF8);
                    using var doc = JsonDocument.Parse(raw);
                    return JsonSerializer.Serialize(new { success = true, profile = doc.RootElement.Clone() });
                }
            }
            catch
            {
            }

            return JsonSerializer.Serialize(new { success = false, message = "Sessão não encontrada." });
        }

        public static string HandleLogout()
        {
            _cachedProfile = null;
            try
            {
                string path = GetSessionFilePath();
                if (File.Exists(path))
                {
                    File.Delete(path);
                }
            }
            catch
            {
            }
            return JsonSerializer.Serialize(new { success = true, message = "Sessão encerrada com sucesso." });
        }
    }
}
