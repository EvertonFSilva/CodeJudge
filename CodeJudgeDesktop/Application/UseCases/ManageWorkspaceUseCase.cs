using System.Windows;
using CodeJudgeDesktop.Domain.Interfaces;

namespace CodeJudgeDesktop.Application.UseCases
{
    public sealed class ManageWorkspaceUseCase
    {
        private readonly IFileWorkspaceGateway _workspaceGateway;

        public ManageWorkspaceUseCase(IFileWorkspaceGateway workspaceGateway)
        {
            _workspaceGateway = workspaceGateway;
        }

        public string OpenFile(Window owner, string filterType)
        {
            return _workspaceGateway.OpenDocumentJson(owner, filterType);
        }

        public string SaveFile(Window owner, string suggestedFileName, string content)
        {
            return _workspaceGateway.SaveDocumentJson(owner, suggestedFileName, content);
        }
    }
}
