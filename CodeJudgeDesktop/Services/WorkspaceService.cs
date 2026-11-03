using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Windows;
using Microsoft.Win32;

namespace CodeJudgeDesktop.Services
{
    public static class WorkspaceService
    {
        private static string? LocateExamplesDirectory()
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string[] candidates = new[]
            {
                Path.Combine(baseDir, "backend", "Examples"),
                Path.GetFullPath(Path.Combine(baseDir, "..", "CodeJudgeApp", "Examples")),
                Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "..", "CodeJudgeApp", "Examples")),
                @"C:\Users\evert\OneDrive\Desktop\CodeJudge\CodeJudgeApp\Examples"
            };

            foreach (var path in candidates)
            {
                if (Directory.Exists(path))
                {
                    return path;
                }
            }
            return null;
        }

        public static string GetExamplesCatalogJson()
        {
            try
            {
                string? examplesDir = LocateExamplesDirectory();
                if (string.IsNullOrEmpty(examplesDir) || !Directory.Exists(examplesDir))
                {
                    return JsonSerializer.Serialize(new { success = true, examples = Array.Empty<object>() });
                }

                var folders = Directory.GetDirectories(examplesDir)
                    .OrderBy(d => Path.GetFileName(d))
                    .ToArray();

                var list = new List<object>();
                foreach (var folder in folders)
                {
                    string folderName = Path.GetFileName(folder);
                    string statementPath = Path.Combine(folder, "Enunciado.md");
                    string title = folderName.Replace("_", " ");
                    string statement = "";

                    if (File.Exists(statementPath))
                    {
                        statement = File.ReadAllText(statementPath, Encoding.UTF8);
                        var firstLine = statement.Split('\n').FirstOrDefault(l => l.TrimStart().StartsWith("#"));
                        if (!string.IsNullOrWhiteSpace(firstLine))
                        {
                            title = firstLine.TrimStart('#', ' ').Replace("Problema:", "").Trim();
                        }
                    }

                    var files = Directory.GetFiles(folder)
                        .Select(f => Path.GetFileName(f))
                        .Where(f => f.EndsWith(".java", StringComparison.OrdinalIgnoreCase) ||
                                    f.EndsWith(".py", StringComparison.OrdinalIgnoreCase) ||
                                    f.EndsWith(".c", StringComparison.OrdinalIgnoreCase) ||
                                    f.EndsWith(".cpp", StringComparison.OrdinalIgnoreCase))
                        .OrderBy(f => f)
                        .ToArray();

                    list.Add(new
                    {
                        id = folderName,
                        name = folderName,
                        title,
                        files
                    });
                }

                return JsonSerializer.Serialize(new { success = true, examples = list });
            }
            catch (Exception ex)
            {
                return JsonSerializer.Serialize(new { success = false, message = ex.Message, examples = Array.Empty<object>() });
            }
        }

        public static string LoadExampleJson(string folderId, string preferredFile)
        {
            try
            {
                string? examplesDir = LocateExamplesDirectory();
                if (string.IsNullOrEmpty(examplesDir))
                {
                    return JsonSerializer.Serialize(new { success = false, message = "Diretório de exemplos não encontrado." });
                }

                string folderPath = Path.Combine(examplesDir, folderId);
                if (!Directory.Exists(folderPath))
                {
                    return JsonSerializer.Serialize(new { success = false, message = "Exemplo não encontrado." });
                }

                string targetFile = string.IsNullOrWhiteSpace(preferredFile) ? "Main.java" : preferredFile;
                string codeFilePath = Path.Combine(folderPath, targetFile);
                if (!File.Exists(codeFilePath))
                {
                    var anySource = Directory.GetFiles(folderPath)
                        .FirstOrDefault(f => f.EndsWith(".java") || f.EndsWith(".py") || f.EndsWith(".c") || f.EndsWith(".cpp"));
                    if (anySource == null)
                    {
                        return JsonSerializer.Serialize(new { success = false, message = "Arquivo de código não encontrado no exemplo." });
                    }
                    codeFilePath = anySource;
                    targetFile = Path.GetFileName(anySource);
                }

                string code = File.ReadAllText(codeFilePath, Encoding.UTF8);
                string statementPath = Path.Combine(folderPath, "Enunciado.md");
                string inputsPath = Path.Combine(folderPath, "inputs.txt");
                string outputsPath = Path.Combine(folderPath, "outputs.txt");

                string statement = File.Exists(statementPath) ? File.ReadAllText(statementPath, Encoding.UTF8) : "";
                string inputs = File.Exists(inputsPath) ? File.ReadAllText(inputsPath, Encoding.UTF8) : "";
                string outputs = File.Exists(outputsPath) ? File.ReadAllText(outputsPath, Encoding.UTF8) : "";

                var allSourceFiles = new Dictionary<string, string>();
                foreach (var srcFile in Directory.GetFiles(folderPath))
                {
                    string fn = Path.GetFileName(srcFile);
                    if (fn.EndsWith(".java", StringComparison.OrdinalIgnoreCase) ||
                        fn.EndsWith(".py", StringComparison.OrdinalIgnoreCase) ||
                        fn.EndsWith(".c", StringComparison.OrdinalIgnoreCase) ||
                        fn.EndsWith(".cpp", StringComparison.OrdinalIgnoreCase))
                    {
                        allSourceFiles[fn] = File.ReadAllText(srcFile, Encoding.UTF8);
                    }
                }

                return JsonSerializer.Serialize(new
                {
                    success = true,
                    folder = folderId,
                    fileName = targetFile,
                    code,
                    statement,
                    inputs,
                    outputs,
                    allFiles = allSourceFiles
                });
            }
            catch (Exception ex)
            {
                return JsonSerializer.Serialize(new { success = false, message = ex.Message });
            }
        }

        public static string OpenFileFromDisk(Window owner, string filterType)
        {
            try
            {
                var dlg = new OpenFileDialog
                {
                    Title = filterType == "txt" ? "Selecionar Arquivo de Teste (.txt)" : "Abrir Arquivo de Código - CodeJudge IDE",
                    Filter = filterType == "txt"
                        ? "Arquivos de Texto (*.txt)|*.txt|Todos os Arquivos (*.*)|*.*"
                        : "Arquivos de Código (*.java;*.py;*.c;*.cpp;*.h;*.hpp)|*.java;*.py;*.c;*.cpp;*.h;*.hpp|Arquivos de Texto (*.txt)|*.txt|Todos os Arquivos (*.*)|*.*"
                };

                if (dlg.ShowDialog(owner) == true)
                {
                    string content = File.ReadAllText(dlg.FileName, Encoding.UTF8);
                    return JsonSerializer.Serialize(new
                    {
                        success = true,
                        fileName = Path.GetFileName(dlg.FileName),
                        fullPath = dlg.FileName,
                        content
                    });
                }

                return JsonSerializer.Serialize(new { success = false, cancelled = true });
            }
            catch (Exception ex)
            {
                return JsonSerializer.Serialize(new { success = false, message = ex.Message });
            }
        }

        public static string SaveFileToDisk(Window owner, string suggestedFileName, string content)
        {
            try
            {
                string ext = Path.GetExtension(suggestedFileName).ToLowerInvariant();
                string filter = ext switch
                {
                    ".md" => "Relatório Markdown (*.md)|*.md|Todos os Arquivos (*.*)|*.*",
                    ".java" => "Código Java (*.java)|*.java|Todos os Arquivos (*.*)|*.*",
                    ".py" => "Script Python (*.py)|*.py|Todos os Arquivos (*.*)|*.*",
                    ".c" => "Código C (*.c)|*.c|Todos os Arquivos (*.*)|*.*",
                    ".cpp" => "Código C++ (*.cpp)|*.cpp|Todos os Arquivos (*.*)|*.*",
                    _ => "Todos os Arquivos (*.*)|*.*"
                };

                var dlg = new SaveFileDialog
                {
                    Title = "Salvar Arquivo - CodeJudge IDE",
                    FileName = string.IsNullOrWhiteSpace(suggestedFileName) ? "Main.java" : suggestedFileName,
                    Filter = filter
                };

                if (dlg.ShowDialog(owner) == true)
                {
                    File.WriteAllText(dlg.FileName, content, Encoding.UTF8);
                    return JsonSerializer.Serialize(new
                    {
                        success = true,
                        fileName = Path.GetFileName(dlg.FileName),
                        fullPath = dlg.FileName
                    });
                }

                return JsonSerializer.Serialize(new { success = false, cancelled = true });
            }
            catch (Exception ex)
            {
                return JsonSerializer.Serialize(new { success = false, message = ex.Message });
            }
        }
    }
}
