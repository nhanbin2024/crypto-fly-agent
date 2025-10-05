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
exports.inlineChatProvider = void 0;
const vscode = __importStar(require("vscode"));
const fileUtils_1 = require("../utils/fileUtils");
const extension_1 = require("../extension");
const projectUtils_1 = require("../utils/projectUtils");
const socket_1 = require("../utils/socket");
const genUtils_1 = require("../utils/genUtils");
const diff_1 = require("diff");
class inlineChatProvider {
    constructor(subscriber, startLine) {
        this.subcriber = false;
        this.oldCode = '';
        this.oldRange = new vscode.Selection(0, 0, 0, 0); // Empty selection at the beginning of the document
        this.startLine = 0;
        this.endLine = 0;
        this.seenIndentationMistake = false;
        //private diffLines: DiffLine[] = [];
        this.oldLinesCopy = [];
        this.deletionBuffer = [];
        this.insertedInCurrentBlock = 0;
        this.linesQueue = []; // Queue to store incoming lines
        this.processingQueue = false; // Flag to indicate if the queue is being processed
        this.lastUpdatedCode = '';
        this.showCodelens = false;
        this.addedLinesOffset = 0;
        this.deletedLinesOffset = 0;
        this.stopQueueProcessing = false;
        this.diffCounter = 0;
        this.subcriber = subscriber;
        // Initialize decoration types
        this.addedDecoratorType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(0,255,0,0.3)', // Green for added lines
            isWholeLine: true,
        });
        this.removedDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255,0,0,0.3)', // Red for removed lines
            isWholeLine: true,
        });
        this.currentLineIndex = startLine;
        this.initSocketConnection(subscriber);
    }
    async processLinesQueue() {
        if (this.processingQueue || this.linesQueue.length === 0) {
            return;
        }
        this.processingQueue = true;
        try {
            while (this.linesQueue.length > 0) {
                if (this.stopQueueProcessing) {
                    this.processingQueue = false;
                    return; // Exit the loop immediately
                }
                const newLine = this.linesQueue.shift(); // Get the next line from the queue
                console.time("why handler?");
                await this.handleStreamData(newLine);
                console.timeEnd("why handler?");
            }
        }
        finally {
            this.processingQueue = false;
        }
    }
    async handleStreamData(newLine) {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !this.oldRange) {
            return;
        }
        if (this.stopQueueProcessing) {
            this.processingQueue = false;
            return; // Exit the loop immediately
        }
        for await (const diffLine of this.showInlineDiffForSelectedRangeV2(newLine, this.showCodelens)) {
            if (this.stopQueueProcessing || this.diffCounter >= 2) {
                this.stopQueueProcessing = true; // Stop further processing
                return;
            }
            switch (diffLine.type) {
                case "same":
                    await this.insertDeletionBuffer();
                    this.incrementCurrentLineIndex();
                    break;
                case "old":
                    // Add to deletion buffer and delete the line for now
                    this.deletionBuffer.push(diffLine.line);
                    await this.deleteLinesAt(this.currentLineIndex);
                    this.deletedLinesOffset++;
                    this.diffCounter++; // Increment diffCounter
                    break;
                case "new":
                    await this.insertLineAboveIndex(this.currentLineIndex, diffLine.line);
                    this.incrementCurrentLineIndex();
                    this.insertedInCurrentBlock++;
                    this.addedLinesOffset++;
                    this.diffCounter++; // Increment diffCounter
                    break;
            }
        }
        /*if(this.showCodelens){
            console.log("called??")
            // Clear deletion buffer
            await this.insertDeletionBuffer();
            
            //i will call my myres diffing function later
            await this.reapplyWithMeyersDiff();

        }*/
    }
    async highlightLine(index) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        if (index > this.oldRange.end.line) {
            return;
        }
        const line = editor.document.lineAt(index);
        const range = new vscode.Range(line.range.start, line.range.end);
        editor.setDecorations(this.removedDecorationType, [range]);
    }
    async reapplyWithMeyersDiff() {
        console.log("worked?");
        const editor = vscode.window.activeTextEditor;
        if (!editor || !this.oldRange) {
            return;
        }
        // Diff is messed up without this delay.
        await new Promise((resolve) => setTimeout(resolve, 100));
        // First, we reset the original diff by rejecting all pending diff blocks
        // const blocks = this.editorToVerticalDiffCodeLens.get(this.fileUri) ?? [];
        // for (const block of blocks.reverse()) {
        //   await this.acceptRejectBlock(
        //     false,
        //     block.start,
        //     block.numGreen,
        //     block.numRed,
        //     true,
        //   );
        // }
        this.clearDecorations();
        //this.showCodelens=false;
        const document = editor.document;
        const selectedRange = editor.selection;
        // Then, get our old/new file content based on the original lines
        const oldFileContent = this.oldCode;
        const newFileContent = this.lastUpdatedCode;
        const diffs = (0, diff_1.diffLines)(oldFileContent, newFileContent);
        const myersDiffLines = diffs.map((diff) => diff.value).join("");
        const addedRanges = [];
        const removedRanges = [];
        //editor.setDecorations(this.removedDecorationType, []);
        this.startLine = this.oldRange.start.line;
        const edit = new vscode.WorkspaceEdit();
        let endCharacter = 0;
        // Create a new range that encompasses the entire streamed diff
        /*const updatedRange = new vscode.Selection(
            this.oldRange.start.line,
            this.oldRange.start.character,
            streamedDiffEndLine,
            endCharacter
        );*/
        // Lastly, we apply decorations
        let lineOffset = this.oldRange.start.line;
        for (const diff of diffs) {
            const lines = diff.value.split('\n');
            if (diff.added) {
                lines.forEach((line, i) => {
                    if (line.trim() !== '') {
                        addedRanges.push(new vscode.Range(lineOffset + i, 0, lineOffset + i, line.length));
                    }
                });
            }
            else if (diff.removed) {
                lines.forEach((line, i) => {
                    if (line.trim() !== '') {
                        removedRanges.push(new vscode.Range(lineOffset + i, 0, lineOffset + i, line.length));
                    }
                });
            }
            // Adjust line offset
            lineOffset += lines.length - 1;
        }
        // Then, we insert our diff lines
        edit.replace(document.uri, selectedRange, myersDiffLines);
        await vscode.workspace.applyEdit(edit);
        const newSelectionRange = editor.selection;
        console.log(newSelectionRange.start, newSelectionRange.end, selectedRange.start, selectedRange.end);
        editor.setDecorations(this.addedDecoratorType, addedRanges);
        editor.setDecorations(this.removedDecorationType, removedRanges);
        fileUtils_1.codeLensRanges.set(document.uri.toString(), [
            {
                range: new vscode.Range(newSelectionRange.start, newSelectionRange.end),
                oldCode: this.oldCode // Store the original text that was diffed
            }
        ]);
    }
    clearDecorations() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !this.oldRange) {
            return;
        }
        editor.setDecorations(this.addedDecoratorType, []);
        editor.setDecorations(this.removedDecorationType, []);
    }
    async insertDeletionBuffer() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        // Don't remove trailing whitespace line
        const totalDeletedContent = this.deletionBuffer.join("\n");
        if (totalDeletedContent === "" &&
            this.currentLineIndex >= this.oldRange.end.line + this.linesQueue.length &&
            this.insertedInCurrentBlock === 0) {
            return;
        }
        if (this.deletionBuffer.length || this.insertedInCurrentBlock > 0) {
            // const blocks = this.editorToVerticalDiffCodeLens.get(this.fileUri) || [];
            // blocks.push({
            //   start: this.currentLineIndex - this.insertedInCurrentBlock,
            //   numRed: this.deletionBuffer.length,
            //   numGreen: this.insertedInCurrentBlock,
            // });
            // this.editorToVerticalDiffCodeLens.set(this.fileUri, blocks);
        }
        if (this.deletionBuffer.length === 0) {
            this.insertedInCurrentBlock = 0;
            return;
        }
        // Insert the block of deleted lines
        await this.insertTextAboveLine(this.currentLineIndex - this.insertedInCurrentBlock, totalDeletedContent);
        // Apply decorations for removed lines
        const removedRange = new vscode.Range(this.currentLineIndex - this.insertedInCurrentBlock, 0, this.currentLineIndex - this.insertedInCurrentBlock + this.deletionBuffer.length - 1, Number.MAX_SAFE_INTEGER);
        editor.setDecorations(this.removedDecorationType, [removedRange]);
        // Update line index, clear buffer
        for (let i = 0; i < this.deletionBuffer.length; i++) {
            this.incrementCurrentLineIndex();
        }
        this.deletionBuffer = [];
        this.insertedInCurrentBlock = 0;
        this.deletedLinesOffset = 0;
    }
    async insertTextAboveLine(index, text) {
        console.time(`the start:insertLineAboveIndex${index}`);
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        console.time(`editor await itself:insertLineAboveIndex${index}`);
        await editor.edit((editBuilder) => {
            const lineCount = editor.document.lineCount;
            if (index >= lineCount) {
                // Append to end of file
                editBuilder.insert(new vscode.Position(lineCount, editor.document.lineAt(lineCount - 1).text.length), `\n${text}`);
            }
            else {
                console.time(`insertLineAboveIndex${index}`);
                editBuilder.insert(new vscode.Position(index, 0), `${text}\n`);
                console.timeEnd(`insertLineAboveIndex${index}`);
            }
        }, {
            undoStopAfter: false,
            undoStopBefore: false,
        });
        console.timeEnd(`editor await itself:insertLineAboveIndex${index}`);
        console.timeEnd(`the start:insertLineAboveIndex${index}`);
    }
    async deleteLinesAt(index) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const startLine = new vscode.Position(index, 0);
        await editor.edit((editBuilder) => {
            editBuilder.delete(new vscode.Range(startLine, startLine.translate(1)));
        }, {
            undoStopAfter: false,
            undoStopBefore: false,
        });
    }
    async insertLineAboveIndex(index, line) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        console.time(`let's see edit speed:${index}`);
        await this.insertTextAboveLine(index, line);
        console.timeEnd(`let's see edit speed:${index}`);
        const addedRange = new vscode.Range(index, 0, index, line.length);
        editor.setDecorations(this.addedDecoratorType, [addedRange]);
    }
    incrementCurrentLineIndex() {
        this.currentLineIndex++;
    }
    async *showInlineDiffForSelectedRangeV2(newLine, loadCodeLens = false) {
        /*
        This version uses levenshtein edit distance algorithm instead of myres algorithm for diffing
        since it's more compatible and efficient with streaming response from an llm
        */
        //console.log(`TRACKER 1:new line:${newLine}`); 
        const startTime = performance.now();
        const { matchIndex, isPerfectMatch, newDiffedLine } = (0, fileUtils_1.matchLine)(newLine, this.oldLinesCopy, this.seenIndentationMistake);
        // End timer and log the result
        const endTime = performance.now();
        const elapsedTime = endTime - startTime;
        console.log(`matchLine took ${elapsedTime.toFixed(2)} milliseconds`);
        console.log(`what's left in queue?: ${this.linesQueue}`);
        //console.log(`TRACKER 2:new diffed line:${newDiffedLine}:matched indexed:${matchIndex}`);
        if (!this.seenIndentationMistake && newLine !== newDiffedLine) {
            this.seenIndentationMistake = true;
        }
        let type;
        let isLineRemoval = false;
        const isNewLine = matchIndex === -1;
        if (isNewLine) {
            type = "new";
        }
        else {
            // Insert all deleted lines before match
            for (let i = 0; i < matchIndex; i++) {
                yield { type: 'old', line: this.oldLinesCopy.shift() };
            }
            type = isPerfectMatch ? "same" : "old";
        }
        switch (type) {
            case "new":
                yield { type, line: newDiffedLine };
                break;
            case "same":
                yield { type, line: this.oldLinesCopy.shift() };
                break;
            case "old":
                yield { type, line: this.oldLinesCopy.shift() };
                if (this.oldLinesCopy[0] !== newLine) {
                    yield { type: "new", line: newDiffedLine };
                }
                else {
                    isLineRemoval = true;
                }
                break;
            default:
                console.error(`Error streaming diff, unrecognized diff type: ${type}`);
        }
        if (loadCodeLens && this.oldLinesCopy.length > 0) {
            for (const oldLine of this.oldLinesCopy) {
                yield { type: "old", line: oldLine };
            }
        }
        /*if(!loadCodeLens&& this.oldLinesCopy.length === 0){
          yield { type: "new", line: newLine };
        }*/
    }
    initSocketConnection(subscriber) {
        if (subscriber) {
            this.wss = new socket_1.WebSocketClient(`${genUtils_1.socketBaseUrl}/inline_chat_v2`, (connected) => {
                if (connected) {
                    vscode.window.showInformationMessage("Inline chat activated!,processing your edit.");
                }
                else {
                    if (this.wss.shouldReconnect) {
                        vscode.window.showErrorMessage("Failed to connect to the inline chat server.");
                    }
                    else {
                        vscode.window.showInformationMessage("your edit is done,please accept or reject the edit using the codelens.");
                    }
                }
            });
            this.wss.setMessageCallback(async (json) => {
                try {
                    if (json["thread_id"] && json["thread_id"] !== null && json["thread_id"] !== undefined) {
                        this.threadId = json["thread_id"];
                    }
                    if (json['type'] === 'LOG') {
                        if (json['value'] === 'PAYMENT_NEEDED') {
                            vscode.window.showErrorMessage(json['message']);
                        }
                        else if (json['value'] === 'COMPLETED') {
                            console.time("completed why?");
                            this.linesQueue = [];
                            this.stopQueueProcessing = true;
                            await this.reapplyWithMeyersDiff();
                            this.wss.forceClose();
                            console.timeEnd("completed why?");
                        }
                        else {
                            console.log("Unhandled LOG message:", json);
                        }
                    }
                    else if (json["message"] && json["message"]['value']) {
                        let cleanedNewCode = json["message"]['value'].startsWith("```") && this.lastUpdatedCode.length === 0 ? '' : (0, fileUtils_1.cleanCodeSnippetWithoutTrim)(json["message"]['value']);
                        if (json['DONE']) {
                            this.showCodelens = true;
                            cleanedNewCode = json["message"]['value'].replace("```", "");
                        }
                        this.lastUpdatedCode = this.lastUpdatedCode + '\n' + cleanedNewCode;
                        console.log("lemme see oh", this.lastUpdatedCode);
                        await this.highlightLine(this.startLine);
                        this.startLine += 1;
                        //this.linesQueue.push(cleanedNewCode);
                        // Process the queue
                        //await this.processLinesQueue();
                    }
                }
                catch (error) {
                    console.error("Error processing message:", error);
                }
            });
        }
    }
    startEdit(selectedCode, neededContext, prompt, selectedRange) {
        this.oldCode = selectedCode;
        this.oldLinesCopy = selectedCode.split('\n');
        this.oldRange = selectedRange;
        this.startLine = selectedRange.start.line;
        this.endLine = selectedRange.end.line;
        this.seenIndentationMistake = false; // Reset indentation mistake flag
        this.linesQueue = [];
        this.addedLinesOffset = 0;
        this.deletedLinesOffset = 0;
        this.diffCounter = 0;
        const editReq = {
            'code': selectedCode,
            'context': neededContext,
            'email': (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, ""),
            'user_id': (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, ""),
            'user_prompt': prompt
        };
        this.wss.sendMessage(JSON.stringify(editReq));
    }
}
exports.inlineChatProvider = inlineChatProvider;
//# sourceMappingURL=inlineChat.js.map