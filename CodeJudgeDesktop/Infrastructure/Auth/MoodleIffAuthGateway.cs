using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using CodeJudgeDesktop.Domain.Interfaces;
using CodeJudgeDesktop.Infrastructure.Security;

namespace CodeJudgeDesktop.Infrastructure.Auth
{
    public sealed class MoodleIffAuthGateway : IAuthGateway
    {
        private static readonly string SessionFilePath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "CodeJudge",
            "session_vault.dat"
        );

        static MoodleIffAuthGateway()
        {
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12 | SecurityProtocolType.Tls13;
        }

        public async Task<string> AuthenticateJsonAsync(string requestJson)
        {
            try
            {
                string username = "";
                string password = "";

                if (!string.IsNullOrWhiteSpace(requestJson))
                {
                    using var doc = JsonDocument.Parse(requestJson);
                    var root = doc.RootElement;
                    if (root.TryGetProperty("username", out var uProp)) username = uProp.GetString()?.Trim() ?? "";
                    if (root.TryGetProperty("password", out var pProp)) password = pProp.GetString() ?? "";
                }

                if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                {
                    return JsonSerializer.Serialize(new
                    {
                        success = false,
                        message = "Informe o CPF e a senha institucional do Moodle IFF."
                    });
                }

                string cleanUsername = Regex.Replace(username, @"[.\-\s]", "");

                using var handler = new HttpClientHandler
                {
                    AllowAutoRedirect = false,
                    UseCookies = false,
                    AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate | DecompressionMethods.Brotli,
                    ServerCertificateCustomValidationCallback = (_, _, _, _) => true
                };

                using var client = new HttpClient(handler)
                {
                    Timeout = TimeSpan.FromSeconds(20)
                };

                string userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
                string moodleBaseUrl = CryptoVault.GetMoodleBaseUrl();
                string moodleLoginUrl = CryptoVault.GetMoodleLoginUrl();
                string moodleDashboardUrl = CryptoVault.GetMoodleDashboardUrl();

                using var getReq = new HttpRequestMessage(HttpMethod.Get, moodleLoginUrl);
                getReq.Headers.TryAddWithoutValidation("User-Agent", userAgent);
                getReq.Headers.TryAddWithoutValidation("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
                getReq.Headers.TryAddWithoutValidation("Accept-Language", "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7");

                using var getRes = await client.SendAsync(getReq).ConfigureAwait(false);
                string loginHtml = await getRes.Content.ReadAsStringAsync().ConfigureAwait(false);

                string initialCookies = ExtractCookieHeader(getRes);

                var tokenMatch = Regex.Match(loginHtml, @"name=[""']logintoken[""']\s+value=[""']([^""']+)[""']", RegexOptions.IgnoreCase);
                if (!tokenMatch.Success)
                {
                    tokenMatch = Regex.Match(loginHtml, @"value=[""']([^""']+)[""']\s+name=[""']logintoken[""']", RegexOptions.IgnoreCase);
                }

                if (!tokenMatch.Success)
                {
                    return JsonSerializer.Serialize(new
                    {
                        success = false,
                        message = "Não foi possível obter o token de sessão do portal Moodle IFF."
                    });
                }

                string loginToken = tokenMatch.Groups[1].Value;

                var formFields = new List<KeyValuePair<string, string>>
                {
                    new KeyValuePair<string, string>("anchor", ""),
                    new KeyValuePair<string, string>("logintoken", loginToken),
                    new KeyValuePair<string, string>("username", cleanUsername),
                    new KeyValuePair<string, string>("password", password)
                };

                using var postReq = new HttpRequestMessage(HttpMethod.Post, moodleLoginUrl)
                {
                    Content = new FormUrlEncodedContent(formFields)
                };
                postReq.Headers.TryAddWithoutValidation("User-Agent", userAgent);
                postReq.Headers.TryAddWithoutValidation("Origin", moodleBaseUrl);
                postReq.Headers.TryAddWithoutValidation("Referer", moodleLoginUrl);
                if (!string.IsNullOrEmpty(initialCookies))
                {
                    postReq.Headers.TryAddWithoutValidation("Cookie", initialCookies);
                }

                using var postRes = await client.SendAsync(postReq).ConfigureAwait(false);
                string postCookies = ExtractCookieHeader(postRes);
                string activeCookies = !string.IsNullOrEmpty(postCookies) ? postCookies : initialCookies;

                string location = "";
                if (postRes.Headers.Location != null)
                {
                    location = postRes.Headers.Location.ToString();
                }
                else if (postRes.Headers.TryGetValues("Location", out var locValues))
                {
                    location = locValues.FirstOrDefault() ?? "";
                }

                if (location.Contains("testsession"))
                {
                    string testUrl = location.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                        ? location
                        : $"{moodleBaseUrl}{(location.StartsWith("/") ? "" : "/")}{location}";

                    using var testReq = new HttpRequestMessage(HttpMethod.Get, testUrl);
                    testReq.Headers.TryAddWithoutValidation("User-Agent", userAgent);
                    if (!string.IsNullOrEmpty(activeCookies))
                    {
                        testReq.Headers.TryAddWithoutValidation("Cookie", activeCookies);
                    }

                    using var testRes = await client.SendAsync(testReq).ConfigureAwait(false);
                    string testCookies = ExtractCookieHeader(testRes);
                    if (!string.IsNullOrEmpty(testCookies))
                    {
                        activeCookies = MergeCookies(activeCookies, testCookies);
                    }

                    if (testRes.Headers.Location != null)
                    {
                        location = testRes.Headers.Location.ToString();
                    }
                    else if (testRes.Headers.TryGetValues("Location", out var testLocs))
                    {
                        location = testLocs.FirstOrDefault() ?? "";
                    }
                }

                using var dashReq = new HttpRequestMessage(HttpMethod.Get, moodleDashboardUrl);
                dashReq.Headers.TryAddWithoutValidation("User-Agent", userAgent);
                if (!string.IsNullOrEmpty(activeCookies))
                {
                    dashReq.Headers.TryAddWithoutValidation("Cookie", activeCookies);
                }

                using var dashRes = await client.SendAsync(dashReq).ConfigureAwait(false);
                string dashLocation = dashRes.Headers.Location?.ToString() ?? "";

                if (dashRes.StatusCode == HttpStatusCode.Found || dashRes.StatusCode == HttpStatusCode.MovedPermanently || dashRes.StatusCode == HttpStatusCode.SeeOther)
                {
                    if (dashLocation.Contains("/login/"))
                    {
                        return JsonSerializer.Serialize(new
                        {
                            success = false,
                            message = "CPF ou senha institucional inválidos no Moodle IFF."
                        });
                    }
                }

                string dashHtml = await dashRes.Content.ReadAsStringAsync().ConfigureAwait(false);

                if (dashHtml.Contains("loginerrormessage") || dashHtml.Contains("id=\"login\""))
                {
                    return JsonSerializer.Serialize(new
                    {
                        success = false,
                        message = "CPF ou senha institucional inválidos no Moodle IFF."
                    });
                }

                string fullName = cleanUsername;
                var nameMatch =
                    Regex.Match(dashHtml, @"class=[""']usertext[^""']*[""'][^>]*>([^<]+)<", RegexOptions.IgnoreCase) is { Success: true } m1 ? m1 :
                    Regex.Match(dashHtml, @"title=[""']Ver perfil[""'][^>]*>([^<]+)<", RegexOptions.IgnoreCase) is { Success: true } m2 ? m2 :
                    Regex.Match(dashHtml, @"<h1[^>]*class=[""'][^""']*h2[^""']*[""'][^>]*>\s*Olá,\s*([^!<]+)", RegexOptions.IgnoreCase);

                if (nameMatch.Success)
                {
                    fullName = WebUtility.HtmlDecode(nameMatch.Groups[1].Value.Trim());
                }

                var sesskeyMatch = Regex.Match(dashHtml, @"""sesskey""\s*:\s*""([^""]+)""");
                if (!sesskeyMatch.Success && nameMatch.Groups.Count < 2)
                {
                    return JsonSerializer.Serialize(new
                    {
                        success = false,
                        message = "Não foi possível confirmar a sessão autenticada no Moodle IFF."
                    });
                }

                string userId = "";
                var userIdMatch = Regex.Match(dashHtml, @"data-userid=[""'](\d+)[""']");
                if (!userIdMatch.Success)
                {
                    userIdMatch = Regex.Match(dashHtml, @"""userid""\s*:\s*(\d+)");
                }
                if (userIdMatch.Success)
                {
                    userId = userIdMatch.Groups[1].Value;
                }

                string avatarUrl = "";
                var avatarMatch = Regex.Match(dashHtml, @"<img[^>]+src=[""']([^""']*pluginfile\.php[^""']*\/user\/icon[^""']*)[""']", RegexOptions.IgnoreCase);
                if (!avatarMatch.Success)
                {
                    avatarMatch = Regex.Match(dashHtml, @"<img[^>]+class=[""'][^""']*userpicture[^""']*[""'][^>]+src=[""']([^""']+)[""']", RegexOptions.IgnoreCase);
                }
                if (avatarMatch.Success)
                {
                    avatarUrl = avatarMatch.Groups[1].Value;
                }

                string email = $"{cleanUsername}@iff.edu.br";

                if (!string.IsNullOrEmpty(userId))
                {
                    try
                    {
                        using var profReq = new HttpRequestMessage(HttpMethod.Get, $"{moodleBaseUrl}/user/profile.php?id={userId}");
                        profReq.Headers.TryAddWithoutValidation("User-Agent", userAgent);
                        if (!string.IsNullOrEmpty(activeCookies))
                        {
                            profReq.Headers.TryAddWithoutValidation("Cookie", activeCookies);
                        }
                        using var profRes = await client.SendAsync(profReq).ConfigureAwait(false);
                        string profHtml = await profRes.Content.ReadAsStringAsync().ConfigureAwait(false);

                        var h1Match = Regex.Match(profHtml, @"<h1[^>]*>([^<]+)</h1>", RegexOptions.IgnoreCase);
                        if (h1Match.Success)
                        {
                            string candidate = WebUtility.HtmlDecode(h1Match.Groups[1].Value.Trim());
                            if (!string.IsNullOrEmpty(candidate) && !candidate.Contains("Moodle"))
                            {
                                fullName = candidate;
                            }
                        }

                        var mailMatch = Regex.Match(profHtml, @"mailto:([^""'>\s]+)", RegexOptions.IgnoreCase);
                        if (mailMatch.Success)
                        {
                            email = WebUtility.UrlDecode(mailMatch.Groups[1].Value.Trim());
                        }
                    }
                    catch
                    {
                    }
                }

                var profileObj = new
                {
                    username = cleanUsername,
                    name = fullName,
                    email = email,
                    campus = "Instituto Federal Fluminense (IFF)",
                    avatarUrl = avatarUrl,
                    courses = Array.Empty<object>()
                };

                string sessionJson = JsonSerializer.Serialize(new
                {
                    success = true,
                    token = "moodle-iff-desktop-" + Guid.NewGuid().ToString("N"),
                    profile = profileObj
                });

                SaveEncryptedSession(sessionJson);
                return sessionJson;
            }
            catch (Exception ex)
            {
                return JsonSerializer.Serialize(new
                {
                    success = false,
                    message = "Falha de conexão com o Moodle IFF: " + ex.Message
                });
            }
        }

        public string GetActiveProfileJson()
        {
            try
            {
                if (File.Exists(SessionFilePath))
                {
                    string cipher = File.ReadAllText(SessionFilePath);
                    string saved = CryptoVault.Decrypt(cipher);
                    if (!string.IsNullOrWhiteSpace(saved))
                    {
                        return saved;
                    }
                }
            }
            catch
            {
            }

            return JsonSerializer.Serialize(new
            {
                success = true,
                profile = new
                {
                    username = "estudante",
                    name = "Estudante IFF",
                    email = "estudante@iff.edu.br",
                    campus = "Instituto Federal Fluminense (IFF)"
                }
            });
        }

        public string LogoutSessionJson()
        {
            try
            {
                if (File.Exists(SessionFilePath))
                {
                    File.Delete(SessionFilePath);
                }
            }
            catch
            {
            }

            return JsonSerializer.Serialize(new { success = true });
        }

        private static void SaveEncryptedSession(string json)
        {
            try
            {
                string? dir = Path.GetDirectoryName(SessionFilePath);
                if (!string.IsNullOrEmpty(dir))
                {
                    Directory.CreateDirectory(dir);
                }
                string encrypted = CryptoVault.Encrypt(json);
                File.WriteAllText(SessionFilePath, encrypted);
            }
            catch
            {
            }
        }

        private static string ExtractCookieHeader(HttpResponseMessage response)
        {
            if (!response.Headers.TryGetValues("Set-Cookie", out var setCookies))
            {
                return "";
            }

            var pairs = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var raw in setCookies)
            {
                var firstPart = raw.Split(';')[0].Trim();
                int eqIdx = firstPart.IndexOf('=');
                if (eqIdx > 0)
                {
                    string k = firstPart.Substring(0, eqIdx).Trim();
                    string v = firstPart.Substring(eqIdx + 1).Trim();
                    pairs[k] = $"{k}={v}";
                }
            }

            return string.Join("; ", pairs.Values);
        }

        private static string MergeCookies(string existing, string newer)
        {
            var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            foreach (var segment in (existing + "; " + newer).Split(';', StringSplitOptions.RemoveEmptyEntries))
            {
                var trimmed = segment.Trim();
                int eq = trimmed.IndexOf('=');
                if (eq > 0)
                {
                    string k = trimmed.Substring(0, eq).Trim();
                    map[k] = trimmed;
                }
            }

            return string.Join("; ", map.Values);
        }
    }
}
