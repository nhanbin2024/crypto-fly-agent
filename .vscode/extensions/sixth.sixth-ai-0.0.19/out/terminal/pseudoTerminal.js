"use strict";
/*import * as vscode from 'vscode';
import * as pty from 'node-pty';

class CommandProcessingPseudoterminal implements vscode.Pseudoterminal {
    private writeEmitter = new vscode.EventEmitter<string>();
    onDidWrite: vscode.Event<string> = this.writeEmitter.event;

    private closeEmitter = new vscode.EventEmitter<void>();
    onDidClose?: vscode.Event<void> = this.closeEmitter.event;

    private commandBuffer = ''; // Buffer for user-typed commands
    private terminalProcess: pty.IPty | null = null;

    open(): void {
        this.writeEmitter.fire('Welcome to the Custom Terminal!\r\nType a command and press Enter to execute.\r\n');
    }

    close(): void {
        if (this.terminalProcess) {
            this.terminalProcess.kill();
        }
        this.closeEmitter.fire();
    }

    handleInput(data: string): void {
        if (data === '\r') { // Enter key pressed
            const command = this.commandBuffer.trim();
            this.commandBuffer = ''; // Clear the buffer

            if (command) {
                this.writeEmitter.fire(`\r\nExecuting: ${command}\r\n`);
                this.executeCommand(command);
            } else {
                this.writeEmitter.fire('\r\n'); // Blank line
            }
        } else if (data === '\u0003') { // Ctrl+C
            this.writeEmitter.fire('^C\r\n');
            this.commandBuffer = ''; // Clear the buffer
            if (this.terminalProcess) {
                this.terminalProcess.kill();
            }
        } else {
            if (this.terminalProcess) {
                // If a process is running, forward input to it directly
                this.terminalProcess.write(data);
            } else {
                // Otherwise, add typed character to the buffer and echo back
                this.commandBuffer += data;
                this.writeEmitter.fire(data);
            }
        }
    }

    private executeCommand(command: string): void {
        // Start a new process using node-pty
        this.terminalProcess = pty.spawn(command, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: process.cwd(),
            env: process.env,
        });

        // Forward process output to the terminal
        this.terminalProcess.onData((data) => {
            this.writeEmitter.fire(data);
        });

        // Handle process exit
        this.terminalProcess.onExit(({ exitCode }) => {
            this.writeEmitter.fire(`\r\nProcess exited with code: ${exitCode}\r\n`);
            this.terminalProcess = null; // Reset terminal process
        });
    }
}


*/ 
//# sourceMappingURL=pseudoTerminal.js.map