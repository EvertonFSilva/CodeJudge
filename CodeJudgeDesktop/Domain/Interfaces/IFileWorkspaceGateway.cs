using System.Windows;

namespace CodeJudgeDesktop.Domain.Interfaces
{
    public interface IFileWorkspaceGateway
    {
        string OpenDocumentJson(Window owner, string filterType);
        string SaveDocumentJson(Window owner, string suggestedFileName, string content);
    }
}
