import * as vscode from 'vscode';
import { MoodleAuthUseCase, MoodleLoginResult, MoodleUserProfile } from '../../features/auth/MoodleAuthUseCase';

const STORAGE_KEY = 'codejudge.moodleUserProfile';

export class AuthController {
  constructor(
    private readonly authUseCase: MoodleAuthUseCase,
    private readonly globalState: vscode.Memento
  ) {}

  public getSavedProfile(): MoodleUserProfile | undefined {
    return this.globalState.get<MoodleUserProfile>(STORAGE_KEY);
  }

  public async login(username: string, password: string): Promise<MoodleLoginResult> {
    const result = await this.authUseCase.authenticate(username, password);
    if (result.success && result.profile) {
      await this.globalState.update(STORAGE_KEY, result.profile);
    }
    return result;
  }

  public async updateCourse(course: string): Promise<MoodleUserProfile | undefined> {
    const current = this.getSavedProfile();
    if (!current) return undefined;
    const updated: MoodleUserProfile = {
      ...current,
      course
    };
    await this.globalState.update(STORAGE_KEY, updated);
    return updated;
  }

  public async logout(): Promise<void> {
    await this.globalState.update(STORAGE_KEY, undefined);
  }
}
