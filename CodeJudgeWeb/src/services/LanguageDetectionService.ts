import { LanguageItem } from "../types/codejudge";

export class LanguageDetectionService {
  private static defaultLanguages: LanguageItem[] = [
    { key: "java", name: "Java", sourceExtension: ".java", targetExtension: ".class", needsCompilation: true },
    { key: "python", name: "Python", sourceExtension: ".py", targetExtension: ".py", needsCompilation: false },
    { key: "c", name: "C", sourceExtension: ".c", targetExtension: ".exe", needsCompilation: true },
    { key: "cpp", name: "C++", sourceExtension: ".cpp", targetExtension: ".exe", needsCompilation: true }
  ];

  static detectFromFileName(fileName: string, availableLanguages: LanguageItem[] = []): LanguageItem | null {
    if (!fileName) return null;
    const lower = fileName.toLowerCase().trim();
    const languages = availableLanguages.length > 0 ? availableLanguages : this.defaultLanguages;

    for (const lang of languages) {
      const ext = lang.sourceExtension.toLowerCase();
      if (lower.endsWith(ext)) {
        return lang;
      }
    }

    if (lower.endsWith(".h")) {
      return languages.find((l) => l.key === "c") || null;
    }
    if (lower.endsWith(".cc") || lower.endsWith(".cxx") || lower.endsWith(".hpp")) {
      return languages.find((l) => l.key === "cpp") || null;
    }

    return null;
  }

  static detectFromCode(code: string, availableLanguages: LanguageItem[] = []): LanguageItem {
    const languages = availableLanguages.length > 0 ? availableLanguages : this.defaultLanguages;
    const trimmed = code.trim();

    if (!trimmed) {
      return languages.find((l) => l.key === "java") || languages[0];
    }

    // Java check
    if (
      trimmed.includes("public class") ||
      trimmed.includes("System.out.print") ||
      trimmed.includes("public static void main") ||
      trimmed.includes("import java.")
    ) {
      const java = languages.find((l) => l.key === "java");
      if (java) return java;
    }

    // C++ check
    if (
      trimmed.includes("#include <iostream>") ||
      trimmed.includes("std::cout") ||
      trimmed.includes("std::cin") ||
      trimmed.includes("using namespace std;") ||
      trimmed.includes("cout <<") ||
      trimmed.includes("cin >>")
    ) {
      const cpp = languages.find((l) => l.key === "cpp");
      if (cpp) return cpp;
    }

    // C check
    if (
      trimmed.includes("#include <stdio.h>") ||
      trimmed.includes("#include <stdlib.h>") ||
      trimmed.includes("printf(") ||
      trimmed.includes("scanf(")
    ) {
      const c = languages.find((l) => l.key === "c");
      if (c) return c;
    }

    // Python check
    if (
      trimmed.includes("def ") ||
      trimmed.includes("import ") ||
      trimmed.includes("print(") ||
      trimmed.includes("input(") ||
      trimmed.includes("if __name__ == '__main__':") ||
      trimmed.includes("if __name__ == \"__main__\":") ||
      trimmed.includes("elif ")
    ) {
      const py = languages.find((l) => l.key === "python");
      if (py) return py;
    }

    // Fallback: search main entrypoint pattern
    if (trimmed.includes("int main") || trimmed.includes("void main")) {
      return languages.find((l) => l.key === "c") || languages[0];
    }

    return languages[0];
  }
}
