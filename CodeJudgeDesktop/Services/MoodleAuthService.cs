using System;
using System.Collections.Generic;
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

        public static async Task<string> HandleLoginAsync(string requestJson)
        {
            string username = "";
            string password = "";
            try
            {
                using var doc = JsonDocument.Parse(requestJson);
                if (doc.RootElement.TryGetProperty("username", out var u))
                    username = u.GetString() ?? "";
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
                var cookieContainer = new CookieContainer();
                var handler = new HttpClientHandler
                {
                    CookieContainer = cookieContainer,
                    AllowAutoRedirect = false,
                    UseCookies = true
                };

                using var client = new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(25) };
                client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36");
                client.DefaultRequestHeaders.Add("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");

                var getResp = await client.GetAsync(LoginUrl);
                if (!getResp.IsSuccessStatusCode)
                {
                    return JsonSerializer.Serialize(new { success = false, message = "Não foi possível conectar ao Moodle IFF." });
                }

                string getHtml = await getResp.Content.ReadAsStringAsync();
                var tokenMatch = Regex.Match(getHtml, @"name=""logintoken""\s+value=""([^""]+)""");
                if (!tokenMatch.Success)
                {
                    tokenMatch = Regex.Match(getHtml, @"value=""([^""]+)""\s+name=""logintoken""");
                }

                if (!tokenMatch.Success)
                {
                    return JsonSerializer.Serialize(new { success = false, message = "Falha ao obter token de login do Moodle IFF." });
                }

                string loginToken = tokenMatch.Groups[1].Value;

                var postReq = new HttpRequestMessage(HttpMethod.Post, LoginUrl);
                postReq.Headers.Add("Origin", "https://ead2.iff.edu.br");
                postReq.Headers.Add("Referer", LoginUrl);
                postReq.Content = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("logintoken", loginToken),
                    new KeyValuePair<string, string>("username", username),
                    new KeyValuePair<string, string>("password", password)
                });

                var postResp = await client.SendAsync(postReq);
                string redirectLocation = postResp.Headers.Location?.ToString() ?? "";

                if (redirectLocation.Contains("loginredirect=1"))
                {
                    return JsonSerializer.Serialize(new { success = false, message = "Usuário ou senha inválidos no Moodle IFF." });
                }

                var profileReq = new HttpRequestMessage(HttpMethod.Get, ProfileUrl);
                profileReq.Headers.Add("Referer", LoginUrl);

                var profileResp = await client.SendAsync(profileReq);
                string profileHtml = await profileResp.Content.ReadAsStringAsync();

                if (!profileHtml.Contains("card-profile") && !profileHtml.Contains("userprofile"))
                {
                    return JsonSerializer.Serialize(new { success = false, message = "Usuário ou senha inválidos no Moodle IFF." });
                }

                var profileObj = ParseMoodleProfile(profileHtml, username);
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
            catch (Exception ex)
            {
                return JsonSerializer.Serialize(new
                {
                    success = false,
                    message = $"Erro na comunicação com o Moodle IFF: {ex.Message}"
                });
            }
        }

        private static object ParseMoodleProfile(string html, string fallbackUsername)
        {
            string name = fallbackUsername;
            var nameMatch = Regex.Match(html, @"<h3[^>]*>(.*?)<\/h3>", RegexOptions.Singleline | RegexOptions.IgnoreCase);
            if (nameMatch.Success)
            {
                string rawName = Regex.Replace(nameMatch.Groups[1].Value, @"<[^>]+>", "").Trim();
                int bracketIdx = rawName.IndexOf('[');
                if (bracketIdx > 0) rawName = rawName.Substring(0, bracketIdx).Trim();
                if (!string.IsNullOrWhiteSpace(rawName)) name = rawName;
            }

            string email = "";
            var emailMatch = Regex.Match(html, @"href=""mailto:([^""]+)""", RegexOptions.IgnoreCase);
            if (emailMatch.Success)
            {
                email = emailMatch.Groups[1].Value.Trim();
            }

            string city = "";
            var cityMatch = Regex.Match(html, @"(?:Cidade|Município)[^<]*<\/dt>\s*<dd[^>]*>(.*?)<\/dd>", RegexOptions.Singleline | RegexOptions.IgnoreCase);
            if (cityMatch.Success)
            {
                city = Regex.Replace(cityMatch.Groups[1].Value, @"<[^>]+>", "").Trim();
            }

            string country = "Brasil";
            string campus = "Instituto Federal Fluminense (IFF)";
            var campusMatch = Regex.Match(html, @"(?:Instituição|Campus)[^<]*<\/dt>\s*<dd[^>]*>(.*?)<\/dd>", RegexOptions.Singleline | RegexOptions.IgnoreCase);
            if (campusMatch.Success)
            {
                string rawCampus = Regex.Replace(campusMatch.Groups[1].Value, @"<[^>]+>", "").Trim();
                if (!string.IsNullOrWhiteSpace(rawCampus)) campus = rawCampus;
            }

            var courses = new List<string>();
            var courseMatches = Regex.Matches(html, @"course/view\.php\?id=\d+[^>]*>(.*?)<\/a>", RegexOptions.Singleline | RegexOptions.IgnoreCase);
            foreach (Match cm in courseMatches)
            {
                string cTitle = Regex.Replace(cm.Groups[1].Value, @"<[^>]+>", "").Trim();
                if (!string.IsNullOrWhiteSpace(cTitle) && !courses.Contains(cTitle))
                {
                    courses.Add(cTitle);
                }
            }

            return new
            {
                name,
                email,
                username = fallbackUsername,
                city,
                country,
                campus,
                firstAccess = "Registrado",
                lastAccess = "Agora",
                profileUrl = ProfileUrl,
                courses = courses.ToArray()
            };
        }

        public static string HandleProfileAsync()
        {
            var fallback = new
            {
                name = "Estudante (IFF)",
                email = "aluno@iff.edu.br",
                city = "Campos dos Goytacazes",
                country = "Brasil",
                campus = "Instituto Federal Fluminense (IFF)",
                firstAccess = "Registrado",
                lastAccess = "Agora",
                profileUrl = ProfileUrl,
                courses = Array.Empty<string>()
            };
            return JsonSerializer.Serialize(new { success = true, profile = fallback });
        }
    }
}
