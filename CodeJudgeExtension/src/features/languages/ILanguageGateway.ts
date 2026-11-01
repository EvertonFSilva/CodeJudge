export interface ApiLanguageItem {
  key: string;
  name: string;
  sourceExtension: string;
  targetExtension: string;
  needsCompilation: boolean;
}

export interface ILanguageGateway {
  fetchSupportedLanguages(): Promise<ApiLanguageItem[]>;
}
