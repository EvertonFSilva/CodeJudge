namespace CodeJudgeDesktop.Domain.Entities
{
    public sealed class StudentProfile
    {
        public string Username { get; set; } = "";
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public string Campus { get; set; } = "Instituto Federal Fluminense (IFF)";
        public string AvatarUrl { get; set; } = "";
    }
}
