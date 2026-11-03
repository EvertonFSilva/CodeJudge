using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Windows;
using Microsoft.Win32;
using CodeJudgeDesktop.Domain.Interfaces;

namespace CodeJudgeDesktop.Infrastructure.Storage
{
    public sealed class WindowsFileWorkspaceGateway : IFileWorkspaceGateway
    {
        public string OpenDocumentJson(Window owner, string filterType)
        {
            try
            {
                string resultJson = JsonSerializer.Serialize(new { success = false, canceled = true });
                owner.Dispatcher.Invoke(() =>
                {
                    var dlg = new OpenFileDialog
                    {
                        Title = "Abrir Arquivo no CodeJudge",
                        Filter = filterType == "txt"
                            ? "Arquivos de Texto (*.txt)|*.txt|Todos os Arquivos (*.*)|*.*"
                            : "Código-Fonte (*.java;*.py;*.c;*.cpp;*.h;*.hpp)|*.java;*.py;*.c;*.cpp;*.h;*.hpp|Arquivos de Texto (*.txt;*.md)|*.txt;*.md|Todos os Arquivos (*.*)|*.*"
                    };

                    if (dlg.ShowDialog(owner) == true)
                    {
                        string content = File.ReadAllText(dlg.FileName, Encoding.UTF8);
                        string fileName = Path.GetFileName(dlg.FileName);
                        resultJson = JsonSerializer.Serialize(new
                        {
                            success = true,
                            fileName,
                            filePath = dlg.FileName,
                            content
                        });
                    }
                });
                return resultJson;
            }
            catch (Exception ex)
            {
                return JsonSerializer.Serialize(new { success = false, message = ex.Message });
            }
        }

        public string SaveDocumentJson(Window owner, string suggestedFileName, string content)
        {
            try
            {
                string resultJson = JsonSerializer.Serialize(new { success = false, canceled = true });
                owner.Dispatcher.Invoke(() =>
                {
                    var dlg = new SaveFileDialog
                    {
                        Title = "Salvar Arquivo",
                        FileName = string.IsNullOrWhiteSpace(suggestedFileName) ? "Main.java" : suggestedFileName,
                        Filter = "Java (*.java)|*.java|Python (*.py)|*.py|C (*.c)|*.c|C++ (*.cpp)|*.cpp|Markdown (*.md)|*.md|Texto (*.txt)|*.txt|Todos os Arquivos (*.*)|*.*"
                    };

                    if (dlg.ShowDialog(owner) == true)
                    {
                        File.WriteAllText(dlg.FileName, content ?? "", Encoding.UTF8);
                        resultJson = JsonSerializer.Serialize(new
                        {
                            success = true,
                            fileName = Path.GetFileName(dlg.FileName),
                            filePath = dlg.FileName
                        });
                    }
                });
                return resultJson;
            }
            catch (Exception ex)
            {
                return JsonSerializer.Serialize(new { success = false, message = ex.Message });
            }
        }
    }
}
