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
exports.runCommand = runCommand;
exports.runCommand2 = runCommand2;
exports.sendControlC = sendControlC;
const child_process_1 = require("child_process");
const vscode = __importStar(require("vscode"));
const readline = require('readline');
const events_1 = require("events");
var child = (0, child_process_1.spawn)(`bash`, {
    cwd: getRootProjectDirectory(),
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe'],
});
if (child.pid) {
    monitorProcessEvents(child.pid);
}
var curPid = 0;
function runCommand(cmd, callback) {
    if (cmd.toLowerCase().includes("sudo")) {
        cmd = cmd.replace("sudo", `sudo -S `);
    }
    if (child) {
        // Handle 'close' event to ensure no further writes after stream end
        child.stdin?.addListener("close", (e) => {
        });
        child.stdin?.write(`${cmd}\n`, (err) => {
            callback("display", "info", "");
        });
        if (child.pid) {
            curPid = child.pid;
        }
        if (child.stdout !== null) {
            child.stdout.on('data', (data) => {
                callback("display", "info", data.toString());
            });
        }
        if (child.stderr !== null) {
            child.stderr.on('data', (data) => {
                callback("display", "error", data.toString());
            });
        }
        child.on('close', (code) => {
            callback("close", "close", "");
        });
        child.on('exit', (code, signal) => {
        });
    }
}
function monitorProcessEvents(pid) {
    // Create a new EventEmitter to track events
    const eventEmitter = new events_1.EventEmitter();
    try {
        // Spawn a child process to interact with the given PID
        const childProcess = (0, child_process_1.spawn)('ps', ['-p', pid.toString(), '-o', 'pid,ppid,comm']);
        // Listen to stdout of the child process
        childProcess.stdout.on('data', (data) => {
            const processInfo = data.toString().split('\n')[1].trim().split(/\s+/);
            const [pidFound] = processInfo;
            if (parseInt(pidFound) === pid) {
                // If the PID matches, start listening to events of this process
                const targetProcess = (0, child_process_1.spawn)('node', ['process_monitor.js', pid.toString()]);
                // Forward all events emitted by the target process
                targetProcess.stdout.on('data', (eventData) => {
                    const event = eventData.toString().trim();
                    eventEmitter.emit('processEvent', event);
                });
                // Handle errors from the target process
                targetProcess.stderr.on('data', (error) => {
                    eventEmitter.emit('error', error.toString());
                });
                // When the target process exits
                targetProcess.on('exit', (code) => {
                    eventEmitter.emit('processExit', `Process exited with code ${code}`);
                });
            }
        });
        // Handle errors from the child process
        childProcess.stderr.on('data', (error) => {
            eventEmitter.emit('error', error.toString());
        });
    }
    catch (error) {
        // eventEmitter.emit('error', error.toString());
    }
    return eventEmitter;
}
function runCommand2(cmd, callback) {
}
function sendControlC() {
    try {
        // Send SIGINT signal to the current process
        if (curPid !== null) {
            process.kill(curPid, 'SIGINT');
            child = (0, child_process_1.spawn)(`bash`, {
                cwd: getRootProjectDirectory(),
                windowsHide: true,
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true
            });
        }
        //process.
    }
    catch (error) {
    }
}
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        const context = this;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}
function getRootProjectDirectory() {
    // Check if there are workspace folders open
    if (vscode.workspace.workspaceFolders) {
        // Get the first workspace folder (assuming single-root workspace)
        const rootFolder = vscode.workspace.workspaceFolders[0];
        // Return the path of the root workspace folder
        if (rootFolder) {
            return rootFolder.uri.fsPath;
        }
    }
    // Return undefined if no workspace folders are open
    return undefined;
}
//# sourceMappingURL=terminal.js.map