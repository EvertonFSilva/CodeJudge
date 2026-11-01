import { LanguageDefinition } from './LanguageDefinition';

export interface ApiLanguageInput {
  key: string;
  name: string;
  sourceExtension: string;
  targetExtension?: string;
  needsCompilation?: boolean;
}

export class LanguageRegistry {
  private readonly languages: Map<string, LanguageDefinition> = new Map();

  constructor() {}

  public register(def: LanguageDefinition): void {
    this.languages.set(def.id.toLowerCase(), def);
  }

  public updateFromApi(apiLanguages: ApiLanguageInput[]): void {
    for (const lang of apiLanguages) {
      const ext = lang.sourceExtension.startsWith('.')
        ? lang.sourceExtension.toLowerCase()
        : `.${lang.sourceExtension.toLowerCase()}`;
      
      const extensions: string[] = [ext];

      if (lang.key.toLowerCase() === 'c' && !extensions.includes('.h')) {
        extensions.push('.h');
      }
      if (lang.key.toLowerCase() === 'cpp') {
        ['.cc', '.cxx', '.hpp', '.h'].forEach(e => {
          if (!extensions.includes(e)) {
            extensions.push(e);
          }
        });
      }

      this.register({
        id: lang.key,
        name: lang.name,
        extensions,
        compiler: lang.needsCompilation ? lang.key : undefined
      });
    }
  }

  public getById(id: string): LanguageDefinition | undefined {
    if (!id) {
      return undefined;
    }
    const lower = id.toLowerCase().trim();
    const direct = this.languages.get(lower);
    if (direct) {
      return direct;
    }

    for (const def of this.languages.values()) {
      if (def.name.toLowerCase() === lower) {
        return def;
      }
      if (def.id === 'cpp' && (lower === 'c++' || lower === 'cpp')) {
        return def;
      }
      if (def.id === 'python' && (lower === 'py' || lower === 'python3' || lower === 'python')) {
        return def;
      }
    }
    return undefined;
  }

  public getByFileName(fileName: string): LanguageDefinition | undefined {
    if (!fileName) {
      return undefined;
    }
    const lower = fileName.toLowerCase().trim();
    for (const def of this.languages.values()) {
      for (const ext of def.extensions) {
        if (lower.endsWith(ext.toLowerCase())) {
          return def;
        }
      }
    }
    return undefined;
  }

  public isSupported(idOrFileName: string): boolean {
    return Boolean(this.getById(idOrFileName) || this.getByFileName(idOrFileName));
  }

  public getAll(): LanguageDefinition[] {
    return Array.from(this.languages.values());
  }

  public getFormattedSupportedList(): string {
    return this.getAll()
      .map(l => `${l.name} (${l.extensions.join(', ')})`)
      .join(', ');
  }
}
