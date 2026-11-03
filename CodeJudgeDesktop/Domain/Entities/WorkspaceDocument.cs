namespace CodeJudgeDesktop.Domain.Entities
{
    public sealed class WorkspaceDocument
    {
        public bool Success { get; set; }
        public string FileName { get; set; } = "";
        public string FilePath { get; set; } = "";
        public string Content { get; set; } = "";
        public string Message { get; set; } = "";
    }
}
