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
exports.CheckpointManager = void 0;
const vscode = __importStar(require("vscode"));
class CheckpointManager {
    constructor(context) {
        this.context = context;
        this.checkpoints = new Map();
    }
    static getInstance(context) {
        if (!CheckpointManager.instance && context) {
            CheckpointManager.instance = new CheckpointManager(context);
        }
        return CheckpointManager.instance;
    }
    async createCheckpoint(checkpoint) {
        try {
            this.checkpoints.set(checkpoint.id, checkpoint);
            await this.saveCheckpoints();
        }
        catch (error) {
            console.error('Error creating checkpoint:', error);
            throw error;
        }
    }
    async deleteCheckpoint(id, thread_id) {
        try {
            if (this.checkpoints.has(id)) {
                const checkpoint = this.checkpoints.get(id);
                if (checkpoint && checkpoint.thread_id === thread_id) {
                    this.checkpoints.delete(id);
                    await this.saveCheckpoints();
                }
            }
        }
        catch (error) {
            console.error('Error deleting checkpoint:', error);
            throw error;
        }
    }
    async getCheckpoint(id, thread_id) {
        try {
            const checkpoint = this.checkpoints.get(id);
            if (checkpoint && checkpoint.thread_id === thread_id) {
                return checkpoint;
            }
            return undefined;
        }
        catch (error) {
            console.error('Error getting checkpoint:', error);
            throw error;
        }
    }
    async saveCheckpoints() {
        try {
            await this.context.globalState.update('checkpoints', Array.from(this.checkpoints.entries()));
        }
        catch (error) {
            console.error('Error saving checkpoints:', error);
            throw error;
        }
    }
    async loadCheckpoints() {
        try {
            const savedCheckpoints = this.context.globalState.get('checkpoints', []);
            this.checkpoints = new Map(savedCheckpoints);
        }
        catch (error) {
            console.error('Error loading checkpoints:', error);
            throw error;
        }
    }
    async applyCheckpoint(id, thread_id) {
        try {
            const checkpoint = await this.getCheckpoint(id, thread_id);
            if (!checkpoint) {
                throw new Error('Checkpoint not found');
            }
            if (checkpoint.modification_type === 'update') {
                // Read the file and update its content
                const edit = new vscode.WorkspaceEdit();
                const uri = vscode.Uri.file(checkpoint.full_file_path);
                const document = await vscode.workspace.openTextDocument(uri);
                const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
                edit.replace(uri, fullRange, checkpoint.checkpoint_content);
                await vscode.workspace.applyEdit(edit);
            }
            else if (checkpoint.modification_type === 'create') {
                // Delete the created file
                const edit = new vscode.WorkspaceEdit();
                const uri = vscode.Uri.file(checkpoint.full_file_path);
                edit.deleteFile(uri, { recursive: true, ignoreIfNotExists: true });
                await vscode.workspace.applyEdit(edit);
            }
            return true;
        }
        catch (error) {
            console.error('Error applying checkpoint:', error);
            vscode.window.showErrorMessage(`Failed to apply checkpoint: ${error}`);
            return false;
        }
    }
}
exports.CheckpointManager = CheckpointManager;
//# sourceMappingURL=checkpointManager.js.map