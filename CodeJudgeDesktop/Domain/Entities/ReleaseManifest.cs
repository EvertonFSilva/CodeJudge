namespace CodeJudgeDesktop.Domain.Entities
{
    public sealed class ReleaseManifest
    {
        public string Version { get; set; } = "";
        public string Name { get; set; } = "";
        public string MinRequiredVersion { get; set; } = "";
        public string DownloadUrl { get; set; } = "";
        public bool Mandatory { get; set; } = true;
    }
}
