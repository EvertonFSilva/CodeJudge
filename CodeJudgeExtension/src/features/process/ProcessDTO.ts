import { TestCaseInput, TestCaseResult } from '../../core/entities/TestCase';
import { MoodleUserProfile } from '../auth/MoodleAuthUseCase';

export type ProcessStage = 'compile' | 'execute' | 'analyze' | 'optimize';
export type StageStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface StageProgress {
  stage: ProcessStage;
  status: StageStatus;
  title: string;
  message?: string;
  durationMs?: number;
}

export interface ProcessConfig {
  compile: boolean;
  execute: boolean;
  analyze: boolean;
  optimize: boolean;
}

export interface RunProcessRequest {
  statement?: string;
  config: ProcessConfig;
  tests?: TestCaseInput[];
  apiKey?: string;
  engine?: string;
  model?: string;
  studentProfile?: MoodleUserProfile;
}

export interface ProcessResult {
  allSucceeded: boolean;
  stoppedEarly: boolean;
  markdown: string;
  filePath: string;
  testResults?: TestCaseResult[];
  successRate?: number;
  stagesCompleted: StageProgress[];
}
