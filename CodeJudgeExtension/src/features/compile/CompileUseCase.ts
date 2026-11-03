import { ICompileGateway, CompileRequest, CompileResponse } from './ICompileGateway';
import { ILogger } from '../../core/logger/ILogger';
import { BaseStageUseCase } from '../common/BaseStageUseCase';

export class CompileUseCase extends BaseStageUseCase<CompileRequest> {
  constructor(
    private readonly gateway: ICompileGateway,
    logger: ILogger
  ) {
    super('compile', logger);
  }

  protected invokeGateway(request: CompileRequest): Promise<CompileResponse> {
    return this.gateway.compile(request);
  }
}
