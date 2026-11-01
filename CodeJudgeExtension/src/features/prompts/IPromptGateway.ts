export interface IPromptGateway {
  loadAll(): Promise<any>;
  loadSingle(category: string, promptKey: string): Promise<any>;
}
