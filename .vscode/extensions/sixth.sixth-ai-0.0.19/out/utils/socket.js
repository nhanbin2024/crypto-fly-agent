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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternetConnectionMonitor = exports.WebSocketManager = exports.WebSocketClient = void 0;
const ws_1 = __importDefault(require("ws"));
const vscode = __importStar(require("vscode"));
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const url = __importStar(require("url"));
class WebSocketClient {
    constructor(url, onReconnect) {
        this.url = url;
        this.ws = null;
        this.messageCallback = null;
        this.onReconnect = null;
        this.messageQueue = [];
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 50;
        this.reconnectTimeout = null;
        this.heartbeatInterval = null;
        this.pingTimeout = null;
        this.pingInterval = null;
        this.shouldReconnect = true;
        this.onReconnect = onReconnect;
        this.connect();
    }
    // Get VSCode's HTTP proxy settings
    getProxySettings() {
        const httpSettings = vscode.workspace.getConfiguration('http');
        const proxyUrl = httpSettings.get('proxy');
        const proxyStrictSSL = httpSettings.get('proxyStrictSSL') ?? true;
        const headers = {
            'User-Agent': 'VSCode-Extension'
        };
        let agent = undefined;
        // If we need to create an agent with specific settings
        if (proxyUrl || !proxyStrictSSL) {
            // Determine if we're using HTTPS
            const isHttps = this.url.startsWith('wss:');
            // Agent options
            const agentOptions = {
                rejectUnauthorized: proxyStrictSSL
            };
            // Create appropriate agent
            if (isHttps) {
                agent = new https.Agent(agentOptions);
            }
            else {
                agent = new http.Agent();
            }
            // Handle proxy authentication if needed
            if (proxyUrl) {
                const parsedProxyUrl = new url.URL(proxyUrl);
                if (parsedProxyUrl.username && parsedProxyUrl.password) {
                    const auth = `${parsedProxyUrl.username}:${parsedProxyUrl.password}`;
                    const encodedAuth = Buffer.from(auth).toString('base64');
                    headers['Proxy-Authorization'] = `Basic ${encodedAuth}`;
                }
                // Log proxy usage for debugging
                console.log(`Using proxy: ${proxyUrl} for WebSocket connection`);
            }
        }
        return { agent, headers };
    }
    connect() {
        try {
            // Get proxy configuration and create agent if needed
            const { agent, headers } = this.getProxySettings();
            // WebSocket connection options with SSH compatibility
            const wsOptions = {
                rejectUnauthorized: vscode.workspace.getConfiguration('http').get('proxyStrictSSL') ?? true,
                headers,
                handshakeTimeout: 10000
            };
            // Add agent if we have one
            if (agent) {
                wsOptions.agent = agent;
            }
            // Log connection attempt
            console.log(`Connecting to WebSocket: ${this.url}`);
            console.log('Connection options:', JSON.stringify({
                rejectUnauthorized: wsOptions.rejectUnauthorized,
                hasAgent: !!wsOptions.agent,
                hasHeaders: Object.keys(wsOptions.headers || {}).length > 0
            }));
            this.ws = new ws_1.default(this.url, wsOptions);
            this.ws.on('open', () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.onReconnect?.(true);
                this.processMessageQueue();
                this.setupPing();
            });
            this.ws.on('message', (data) => {
                try {
                    const parsedData = JSON.parse(data.toString());
                    this.messageCallback?.(parsedData);
                }
                catch (error) {
                    console.error('Error parsing message:', error);
                }
            });
            this.ws.on('close', (code, reason) => {
                console.log(`WebSocket closed with code ${code} and reason: ${reason}`);
                this.handleDisconnect(`Connection closed (${code})`);
            });
            this.ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.handleDisconnect(`Connection error: ${error.message}`);
            });
            this.ws.on('ping', () => {
                if (this.ws) {
                    this.ws.pong();
                }
                this.resetPingTimeout();
            });
            this.ws.on('pong', () => {
                this.resetPingTimeout();
            });
            this.ws.on('unexpected-response', (request, response) => {
                console.error(`Unexpected WebSocket response: ${response.statusCode} ${response.statusMessage}`);
                // Check if this is a proxy-related issue
                if (response.statusCode === 407) {
                    console.error('Proxy authentication required');
                }
            });
        }
        catch (error) {
            console.error('Connection error:', error);
            this.handleDisconnect(`Failed to connect: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // The rest of your WebSocketClient implementation remains the same
    setupPing() {
        let lastMessageTime = Date.now();
        if (this.ws) {
            this.ws.on('message', () => {
                lastMessageTime = Date.now();
            });
        }
        this.pingInterval = setInterval(() => {
            const idleTime = Date.now() - lastMessageTime;
            if (idleTime > 30000 && this.ws && this.ws.readyState === ws_1.default.OPEN) {
                this.ws.ping();
            }
        }, 600000000);
    }
    resetPingTimeout() {
        if (this.pingTimeout)
            clearTimeout(this.pingTimeout);
        this.pingTimeout = setTimeout(() => {
            console.log('Ping timeout - reconnecting');
            this.handleDisconnect('Ping timeout');
        }, 600000000);
    }
    handleDisconnect(reason) {
        console.log(`WebSocket disconnected: ${reason}`);
        this.isConnected = false;
        this.onReconnect?.(false);
        if (this.ws) {
            this.ws.removeAllListeners();
            this.ws = null;
        }
        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 30000);
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
            }
            this.reconnectTimeout = setTimeout(() => {
                console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                this.connect();
            }, delay);
        }
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
        }
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
    }
    processMessageQueue() {
        while (this.messageQueue.length > 0 && this.isConnected && this.ws && this.ws.readyState === ws_1.default.OPEN) {
            const message = this.messageQueue.shift();
            if (message && this.ws) {
                this.ws.send(message);
            }
        }
    }
    sendMessage(message) {
        if (this.isConnected && this.ws && this.ws.readyState === ws_1.default.OPEN) {
            this.ws.send(message);
        }
        else {
            console.log('Message queued for later delivery');
            this.messageQueue.push(message);
            if (!this.isConnected) {
                this.connect();
            }
        }
    }
    setMessageCallback(callback) {
        this.messageCallback = callback;
    }
    close(disableReconnect = true) {
        this.shouldReconnect = !disableReconnect;
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        if (this.ws) {
            this.ws.removeAllListeners();
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
        }
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
    }
    forceClose() {
        this.shouldReconnect = false;
        this.close(true);
    }
    reconnect() {
        this.shouldReconnect = true;
        this.reconnectAttempts = 0;
        this.connect();
    }
    getConnectionStatus() {
        return this.isConnected;
    }
}
exports.WebSocketClient = WebSocketClient;
// Keep WebSocketManager for backward compatibility
class WebSocketManager {
    constructor(url, onReconnectCallBack, type = "gptListener") {
        this.client = new WebSocketClient(url, (connected) => {
            if (connected && type === "chat") {
                onReconnectCallBack(this.client);
            }
        });
    }
    send(message) {
        this.client.sendMessage(message);
    }
    close() {
        this.client.close();
    }
}
exports.WebSocketManager = WebSocketManager;
// Modified InternetConnectionMonitor to work better with SSH environments
class InternetConnectionMonitor {
    constructor(onConnect) {
        this.checkInterval = 5000; // Check every 5 seconds
        this.url = 'https://www.google.com';
        this.lastConnected = false;
        this.checkConnection = async () => {
            try {
                // Get VSCode's HTTP proxy settings for fetch
                const httpSettings = vscode.workspace.getConfiguration('http');
                const proxyUrl = httpSettings.get('proxy');
                const proxyStrictSSL = httpSettings.get('proxyStrictSSL') ?? true;
                const options = {
                    method: 'HEAD',
                    cache: 'no-store',
                };
                // Set up agent for proper SSL handling
                if (!proxyStrictSSL) {
                    console.log('SSL verification disabled for connectivity check');
                    // Note: In browser environments, we can't easily bypass SSL verification
                    // This is handled differently in Node.js vs browser environments
                }
                const response = await fetch(this.url, options);
                const connected = response.ok;
                // Only notify if state changes to reduce noise
                if (connected !== this.lastConnected) {
                    this.lastConnected = connected;
                    if (this.onConnect) {
                        this.onConnect(connected);
                    }
                    console.log(`Internet connection status changed: ${connected ? 'Connected' : 'Disconnected'}`);
                }
            }
            catch (error) {
                console.log(`Connection check failed: ${error instanceof Error ? error.message : String(error)}`);
                if (this.lastConnected) {
                    this.lastConnected = false;
                    if (this.onConnect) {
                        this.onConnect(false);
                    }
                }
            }
        };
        this.onConnect = onConnect;
        this.init();
    }
    init() {
        this.checkConnection(); // Initial check
        this.intervalId = setInterval(this.checkConnection, this.checkInterval);
    }
    stopMonitoring() {
        if (this.intervalId !== undefined) {
            clearInterval(this.intervalId);
            this.intervalId = undefined; // Set to undefined after clearing
        }
    }
}
exports.InternetConnectionMonitor = InternetConnectionMonitor;
//# sourceMappingURL=socket.js.map