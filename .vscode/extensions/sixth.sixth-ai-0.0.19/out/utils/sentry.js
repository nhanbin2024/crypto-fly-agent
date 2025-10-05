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
exports.initializeSentry = initializeSentry;
exports.captureException = captureException;
exports.captureMessage = captureMessage;
exports.startTransaction = startTransaction;
const Sentry = __importStar(require("@sentry/node"));
const projectUtils_1 = require("./projectUtils");
const extension_1 = require("../extension");
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path")); // Import path module
function initializeSentry() {
    const context = (0, extension_1.getExtensionContext)(); // Get context once for efficiency and path access
    if (!context) {
        console.error("Sentry Init Error: Extension context not available.");
        return; // Cannot initialize without context
    }
    const extensionPath = context.extensionPath; // Get the base path of your extension
    // Initialize Sentry ONLY ONCE
    Sentry.init({
        dsn: "https://9663da754e60d3576607a3827e169bf5@o4508759656693760.ingest.us.sentry.io/4508759677337600", // Your DSN
        environment: process.env.NODE_ENV || (vscode.env.sessionId ? 'production' : 'development'), // Combine environment logic
        tracesSampleRate: 1.0, // Or your desired rate for performance tracing
        // enableTracing: true, // Only if you actively use Sentry performance monitoring
        autoSessionTracking: true, // Keep if you want session data
        // Remove all default integrations that might capture globally
        // defaultIntegrations: false, // More explicit way to disable defaults
        integrations: [
        // Add back specific integrations if needed, e.g., Http for outgoing requests
        // new Sentry.Integrations.Http({ tracing: true })
        // Consider adding linked errors if you chain errors:
        // new Sentry.Integrations.LinkedErrors()
        ],
        // Filter errors before they are sent
        beforeSend(event, hint) {
            // --- User Context ---
            // Note: getExtensionContext() is called outside beforeSend now
            const apiKey = (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.APIKEY, null);
            const email = (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.EMAIL, null);
            event.user = {
                email: email,
                id: apiKey // Assuming apiKey is a suitable unique ID
            };
            // --- Extension Context ---
            event.tags = {
                ...event.tags,
                apiKeyPresent: !!apiKey,
                vscodeVersion: vscode.version,
                extensionVersion: context.extension.packageJSON.version,
                machineId: vscode.env.machineId,
            };
            event.extra = {
                ...event.extra,
                nodeVersion: process.version,
                platform: process.platform
            };
            // --- Stack Trace Filtering ---
            try {
                const exception = event.exception?.values?.[0];
                if (exception?.stacktrace?.frames) {
                    const frames = exception.stacktrace.frames;
                    // Check if at least one frame originates from within our extension's directory
                    const isFromOurExtension = frames.some(frame => {
                        if (frame.filename) {
                            // Normalize path separators and handle potential 'file://' URIs
                            const framePath = frame.filename.startsWith('file://')
                                ? vscode.Uri.parse(frame.filename).fsPath
                                : frame.filename;
                            // Check if the frame's path starts with the extension's path
                            // Using path.relative helps handle different path formats (C:\ vs /)
                            // If relative path starts with '..', it's outside the extension path.
                            return !path.relative(extensionPath, framePath).startsWith('..');
                        }
                        return false; // Frame has no filename
                    });
                    if (!isFromOurExtension) {
                        // console.log("Sentry: Discarding event - not from this extension.", event.event_id);
                        return null; // Discard the event
                    }
                }
                else if (hint?.originalException) {
                    // Fallback for events without structured stacktrace (e.g., captureMessage with Error object)
                    // This is less precise
                    const error = hint.originalException;
                    if (error?.stack && !error.stack.includes(path.basename(extensionPath))) {
                        // Very basic check: if stack doesn't even contain the extension's folder name (less reliable)
                        // console.log("Sentry: Discarding event based on basic stack check.", event.event_id);
                        // return null; // Be cautious with this fallback, might filter too much
                    }
                }
            }
            catch (e) {
                console.error("Sentry beforeSend filter error:", e);
                // Don't block the event if the filter itself fails
            }
            // If it passed the filter (or filter failed), send the event
            return event;
        }
    });
    // Optional: Add global tags/context once after init
    Sentry.configureScope(scope => {
        scope.setTag("vscodeVersion", vscode.version);
        scope.setTag("extensionVersion", context.extension.packageJSON.version);
        scope.setExtra("machineId", vscode.env.machineId);
        // Add any other context that is static for the extension's lifetime
    });
    console.log("Sentry initialized for manual capture with filtering.");
}
// Comment out or remove the global error handlers function 
// function setupGlobalErrorHandlers() {
//     // Handle uncaught exceptions
//     process.on('uncaughtException', (error: Error) => {
//         Sentry.captureException(error, {
//             level: 'fatal',
//             tags: { type: 'uncaughtException' }
//         });
//     });
//     // Handle unhandled promise rejections
//     process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
//         Sentry.captureException(reason, {
//             level: 'error',
//             tags: { type: 'unhandledRejection' }
//         });
//     });
//     // Handle VS Code specific errors
//     if (typeof window !== 'undefined') {
//         window.addEventListener('error', (event) => {
//             Sentry.captureException(event.error, {
//                 level: 'error',
//                 tags: { type: 'windowError' }
//             });
//         });
//     }
// }
// This function remains your primary way to report errors *from your code*
function captureException(error, context) {
    Sentry.withScope((scope) => {
        // Add file and line number if available from the error stack
        if (error.stack) {
            const stackLines = error.stack.split('\n');
            // Attempt to get a meaningful location, often the second line
            if (stackLines.length > 1) {
                // Extract relevant part, avoid full path if too long or sensitive
                const match = stackLines[1].match(/at .*\((.*):(\d+):(\d+)\)|at (.*):(\d+):(\d+)/);
                if (match) {
                    const filePath = match[1] || match[4];
                    const line = match[2] || match[5];
                    const col = match[3] || match[6];
                    // Maybe just use the filename?
                    scope.setTag('errorLocation', `${path.basename(filePath)}:${line}:${col}`);
                }
                else {
                    scope.setTag('errorLocation', stackLines[1].trim().substring(0, 150)); // Fallback
                }
            }
        }
        // Add VS Code specific context relevant at the time of the error
        try {
            if (vscode.window.activeTextEditor) {
                scope.setExtra('activeFile', path.basename(vscode.window.activeTextEditor.document.fileName)); // Use basename
                scope.setExtra('activeLangId', vscode.window.activeTextEditor.document.languageId);
            }
            if (vscode.window.state.focused) {
                scope.setExtra('vsCodeWindowFocused', true);
            }
        }
        catch (e) {
            // Ignore errors getting VSCode context
        }
        // Add custom context provided at the call site
        if (context) {
            Object.entries(context).forEach(([key, value]) => {
                scope.setExtra(key, value);
            });
        }
        // Capture the exception
        Sentry.captureException(error);
    });
}
// Capture message remains largely the same
function captureMessage(message, level = 'info', context) {
    Sentry.withScope((scope) => {
        if (context) {
            Object.entries(context).forEach(([key, value]) => {
                scope.setExtra(key, value);
            });
        }
        Sentry.captureMessage(message, level);
    });
}
// Performance monitoring functions (if used)
function startTransaction(name, op) {
    return Sentry.startTransaction({ name, op });
}
//# sourceMappingURL=sentry.js.map