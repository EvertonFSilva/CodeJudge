"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VsCodeOutputLogger = void 0;
const vscode = __importStar(require("vscode"));
class VsCodeOutputLogger {
    channel;
    constructor(channelName = 'CodeJudge') {
        this.channel = vscode.window.createOutputChannel(channelName);
    }
    info(message, context) {
        this.write('INFO', message, context);
    }
    warn(message, context) {
        this.write('WARN', message, context);
    }
    error(message, error) {
        this.write('ERROR', message, error);
    }
    debug(message, context) {
        this.write('DEBUG', message, context);
    }
    stageStart(stageName, meta) {
        const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
        this.write('STAGE:START', `[${stageName.toUpperCase()}] Iniciando etapa${metaStr}`);
    }
    stageEnd(stageName, durationMs, success, details) {
        const status = success ? 'SUCESSO' : 'FALHA';
        const detailStr = details ? ` | ${typeof details === 'string' ? details : JSON.stringify(details)}` : '';
        this.write('STAGE:END', `[${stageName.toUpperCase()}] Finalizado em ${durationMs}ms - Status: ${status}${detailStr}`);
    }
    show() {
        this.channel.show(true);
    }
    write(level, message, extra) {
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        let line = `[${now}] [${level}] ${message}`;
        if (extra !== undefined) {
            if (extra instanceof Error) {
                line += `\n${extra.stack || extra.message}`;
            }
            else if (typeof extra === 'object') {
                try {
                    line += `\n${JSON.stringify(extra, null, 2)}`;
                }
                catch {
                    line += `\n${String(extra)}`;
                }
            }
            else {
                line += ` | ${String(extra)}`;
            }
        }
        this.channel.appendLine(line);
    }
}
exports.VsCodeOutputLogger = VsCodeOutputLogger;
//# sourceMappingURL=VsCodeOutputLogger.js.map