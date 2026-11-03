using System;
using System.Security.Cryptography;
using System.Text;

namespace CodeJudgeDesktop.Infrastructure.Security
{
    public static class CryptoVault
    {
        private static readonly byte[] MaskedKeySeed = new byte[]
        {
            0x19, 0x10, 0x05, 0x13, 0x1C, 0x1C, 0x05, 0x0E, 0x19, 0x19,
            0x05, 0x1B, 0x1F, 0x09, 0x68, 0x6F, 0x6C, 0x05, 0x0C, 0x1B,
            0x0F, 0x16, 0x0E, 0x05, 0x11, 0x1F, 0x03, 0x05, 0x68, 0x6A,
            0x68, 0x6C, 0x05, 0x1F, 0x0C, 0x1F, 0x08, 0x0E, 0x15, 0x14
        };

        private static readonly byte[] MaskedIvSeed = new byte[]
        {
            0x19, 0x10, 0x05, 0x13, 0x1C, 0x1C, 0x05, 0x13, 0x0C, 0x05,
            0x09, 0x1F, 0x1F, 0x1E, 0x05, 0x68, 0x6A, 0x68, 0x6C
        };

        private const string CipherMoodleBaseUrl = "6Rw9cUga/+v2VTQtcOcvhOU3rJwSLhGn7HGXT6lPo0Y=";
        private const string CipherMoodleLoginUrl = "6Rw9cUga/+v2VTQtcOcvhFDFmSp0rNOCZzupLBSJ9NBru+M3ZKU0AQ47zt5bI1er";
        private const string CipherMoodleDashboardUrl = "6Rw9cUga/+v2VTQtcOcvhK4rqUGXxg6/GiRw4fHgvxg=";
        private const string CipherHealthEndpoint = "I7E+Q3rU2YpmjURCE+shY4xqxCGGl9nLK/g0nivEGMU=";
        private const string CipherVersionEndpoint = "0daV14w+kfa8AvE+VV0tl3sOEkygFyb4yxn2hK/K3+aNG6s/kza+eQK4CkGClbvB8ITPI3Lq35+KFK7AT5FudD6a65pqy1jD4L/ROwuBXkE=";
        private const string CipherReleasesUrl = "0UupQhX48AXlor+hXyBhvbxHC0kkf5BhnTtOj0arTBkVj3xkpTzu5jF/aYqfGXNpSHvrosvlB2Po4fd5KVjIqQ==";
        private const string CipherVirtualHost = "Va8Rex5RnTa2g9JePINyU6X8B4pIPeve0mbKRgAp99U=";

        public static string GetMoodleBaseUrl() => Decrypt(CipherMoodleBaseUrl);
        public static string GetMoodleLoginUrl() => Decrypt(CipherMoodleLoginUrl);
        public static string GetMoodleDashboardUrl() => Decrypt(CipherMoodleDashboardUrl);
        public static string GetHealthEndpoint() => Decrypt(CipherHealthEndpoint);
        public static string GetVersionEndpoint() => Decrypt(CipherVersionEndpoint);
        public static string GetReleasesUrl() => Decrypt(CipherReleasesUrl);
        public static string GetVirtualHost() => Decrypt(CipherVirtualHost);

        public static string Encrypt(string plainText)
        {
            if (string.IsNullOrEmpty(plainText)) return "";
            using var aes = CreateConfiguredAes();
            using var encryptor = aes.CreateEncryptor();
            byte[] plainBytes = Encoding.UTF8.GetBytes(plainText);
            byte[] cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);
            return Convert.ToBase64String(cipherBytes);
        }

        public static string Decrypt(string cipherBase64)
        {
            if (string.IsNullOrEmpty(cipherBase64)) return "";
            using var aes = CreateConfiguredAes();
            using var decryptor = aes.CreateDecryptor();
            byte[] cipherBytes = Convert.FromBase64String(cipherBase64);
            byte[] plainBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);
            return Encoding.UTF8.GetString(plainBytes);
        }

        private static Aes CreateConfiguredAes()
        {
            byte[] unmaskedKey = Unmask(MaskedKeySeed, 0x5A);
            byte[] unmaskedIv = Unmask(MaskedIvSeed, 0x5A);

            using var sha = SHA256.Create();
            using var md5 = MD5.Create();

            var aes = Aes.Create();
            aes.Key = sha.ComputeHash(unmaskedKey);
            aes.IV = md5.ComputeHash(unmaskedIv);
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            CryptographicOperations.ZeroMemory(unmaskedKey);
            CryptographicOperations.ZeroMemory(unmaskedIv);

            return aes;
        }

        private static byte[] Unmask(byte[] data, byte mask)
        {
            byte[] result = new byte[data.Length];
            for (int i = 0; i < data.Length; i++)
            {
                result[i] = (byte)(data[i] ^ mask);
            }
            return result;
        }
    }
}
