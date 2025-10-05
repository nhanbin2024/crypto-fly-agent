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
exports.ChatHistoryManager = void 0;
const level_1 = require("level");
const uuid_1 = require("uuid");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const promises_1 = require("fs/promises");
const vscode = __importStar(require("vscode"));
class ChatHistoryManager {
    constructor() {
        this.isInitialized = false;
        this.initializationPromise = null;
        const dbPath = path.join(os.homedir(), '.sixth_vsc', 'chat-level');
        this.db = new level_1.Level(dbPath, {
            valueEncoding: 'json',
            createIfMissing: true,
            errorIfExists: false,
            cacheSize: 8 * 1024 * 1024,
            writeBufferSize: 4 * 1024 * 1024,
            maxOpenFiles: 1000
        });
        this.initializeDatabase();
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async initializeDatabase() {
        try {
            const dbDir = path.dirname(this.db.location);
            await (0, promises_1.mkdir)(dbDir, { recursive: true, mode: 0o755 });
            await this.db.open();
            this.isInitialized = true;
        }
        catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }
    static async getInstance() {
        if (!ChatHistoryManager.instance) {
            ChatHistoryManager.instance = new ChatHistoryManager();
        }
        if (!ChatHistoryManager.instance.isInitialized) {
            try {
                await ChatHistoryManager.instance.initializationPromise;
            }
            catch (error) {
                console.error('Failed to initialize ChatHistoryManager:', error);
                // Create new initialization promise if previous one failed
                ChatHistoryManager.instance.initializationPromise = ChatHistoryManager.instance.initializeDatabase();
                await ChatHistoryManager.instance.initializationPromise;
            }
        }
        return ChatHistoryManager.instance;
    }
    // Add cleanup method
    async cleanup() {
        if (this.isInitialized && this.db) {
            try {
                await this.db.close();
                this.isInitialized = false;
                this.initializationPromise = null;
            }
            catch (error) {
                console.error('Error during database cleanup:', error);
                throw error;
            }
        }
    }
    async ensureInitialized() {
        if (!this.isInitialized) {
            if (this.initializationPromise) {
                await this.initializationPromise;
            }
            else {
                this.initializationPromise = this.initializeDatabase();
                await this.initializationPromise;
            }
        }
    }
    /**
     * Clears all data from the database while maintaining the database connection.
     * This is safer than deleting the database file as it preserves the database structure.
     */
    async clearDb() {
        try {
            await this.ensureInitialized();
            // Collect all keys to delete
            const keysToDelete = [];
            for await (const [key] of this.db.iterator()) {
                keysToDelete.push(key);
            }
            // If there are no keys, return early
            if (keysToDelete.length === 0) {
                return;
            }
            // Create a batch operation to delete all keys
            const batch = keysToDelete.map(key => ({
                type: 'del',
                key
            }));
            // Execute the batch deletion
            await this.db.batch(batch);
            vscode.window.showInformationMessage('Chat history cleared successfully.');
        }
        catch (error) {
            console.error('Error clearing database:', error);
            vscode.window.showErrorMessage('Failed to clear chat history: ' + (error instanceof Error ? error.message : String(error)));
            throw error;
        }
    }
    // Helper methods for key generation
    chatKey(chatId) {
        return `chat:${chatId}`;
    }
    threadKey(threadId) {
        return `thread:${threadId}`;
    }
    messageKey(messageId) {
        return `message:${messageId}`;
    }
    async getAllMessagesForChat(chatId) {
        await this.ensureInitialized();
        const messages = [];
        try {
            for await (const [key, value] of this.db.iterator({
                gte: 'message:',
                lte: 'message:\xff'
            })) {
                const message = JSON.parse(value);
                if (message.chat_id === chatId) {
                    messages.push({
                        ...message,
                        timestamp: new Date(message.timestamp)
                    });
                }
            }
        }
        catch (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
        return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    async createChat(title) {
        await this.ensureInitialized();
        const chatId = (0, uuid_1.v4)();
        const threadId = chatId;
        const now = new Date();
        const chat = {
            id: chatId,
            title,
            last_message: null,
            last_updated: now,
            thread_id: threadId
        };
        const thread = {
            id: threadId,
            chat_id: chatId,
            messages: []
        };
        try {
            await this.db.batch([
                { type: 'put', key: this.chatKey(chatId), value: JSON.stringify(chat) },
                { type: 'put', key: this.threadKey(threadId), value: JSON.stringify(thread) }
            ]);
            return chatId;
        }
        catch (error) {
            console.error('Error creating chat:', error);
            throw error;
        }
    }
    async getChatThread(chatId) {
        await this.ensureInitialized();
        try {
            const chat = JSON.parse(await this.db.get(this.chatKey(chatId)));
            const messages = await this.getAllMessagesForChat(chatId);
            return {
                id: chat.thread_id,
                chat_id: chatId,
                messages: messages
            };
        }
        catch (error) {
            if (error.code === 'LEVEL_NOT_FOUND') {
                return null;
            }
            throw error;
        }
    }
    async updateChatTitle(chatId, newTitle) {
        await this.ensureInitialized();
        try {
            const chat = JSON.parse(await this.db.get(this.chatKey(chatId)));
            chat.title = newTitle;
            chat.last_updated = new Date();
            await this.db.put(this.chatKey(chatId), JSON.stringify(chat));
        }
        catch (error) {
            console.error('Error updating chat title:', error);
            throw error;
        }
    }
    async saveMessage(message) {
        await this.ensureInitialized();
        try {
            await this.db.batch([
                {
                    type: 'put',
                    key: this.messageKey(message.id),
                    value: JSON.stringify({
                        ...message,
                        timestamp: message.timestamp.toISOString()
                    })
                }
            ]);
        }
        catch (error) {
            console.error('Error saving message:', error);
            throw error;
        }
    }
    async updateMessageContent(messageId, newContent) {
        await this.ensureInitialized();
        try {
            const message = JSON.parse(await this.db.get(this.messageKey(messageId)));
            message.content = newContent;
            await this.db.put(this.messageKey(messageId), JSON.stringify(message));
        }
        catch (error) {
            console.error('Error updating message:', error);
            throw error;
        }
    }
    async deleteMessage(messageId) {
        await this.ensureInitialized();
        try {
            await this.db.del(this.messageKey(messageId));
        }
        catch (error) {
            console.error('Error deleting message:', error);
            throw error;
        }
    }
    async deleteAllChats() {
        await this.ensureInitialized();
        const batch = [];
        try {
            for await (const [key] of this.db.iterator()) {
                batch.push({ type: 'del', key });
            }
            await this.db.batch(batch);
        }
        catch (error) {
            console.error('Error deleting all chats:', error);
            throw error;
        }
    }
    async updateChatLastMessage(chatId, message) {
        await this.ensureInitialized();
        try {
            const chat = JSON.parse(await this.db.get(this.chatKey(chatId)));
            chat.last_message = message;
            chat.last_updated = new Date();
            await this.db.put(this.chatKey(chatId), JSON.stringify(chat));
        }
        catch (error) {
            console.error('Error updating chat last message:', error);
            throw error;
        }
    }
    async getChat(chatId) {
        await this.ensureInitialized();
        try {
            const chat = JSON.parse(await this.db.get(this.chatKey(chatId)));
            return {
                ...chat,
                last_updated: new Date(chat.last_updated),
                last_message: chat.last_message ? {
                    ...chat.last_message,
                    timestamp: new Date(chat.last_message.timestamp)
                } : null
            };
        }
        catch (error) {
            if (error.code === 'LEVEL_NOT_FOUND') {
                return null;
            }
            throw error;
        }
    }
    async getChatHistory(limit = 20, offset = 0) {
        await this.ensureInitialized();
        const chats = [];
        try {
            for await (const [key, value] of this.db.iterator({
                gte: 'chat:',
                lte: 'chat:\xff'
            })) {
                const chat = JSON.parse(value);
                chats.push({
                    ...chat,
                    last_updated: new Date(chat.last_updated),
                    last_message: chat.last_message ? {
                        ...chat.last_message,
                        timestamp: new Date(chat.last_message.timestamp)
                    } : null
                });
            }
        }
        catch (error) {
            console.error('Error fetching chat history:', error);
            return [];
        }
        return chats
            .sort((a, b) => b.last_updated.getTime() - a.last_updated.getTime())
            .slice(offset, offset + limit);
    }
    async searchChats(searchTerm) {
        await this.ensureInitialized();
        const chats = [];
        const searchTermLower = searchTerm.toLowerCase();
        try {
            // Search in chat titles
            for await (const [key, value] of this.db.iterator({
                gte: 'chat:',
                lte: 'chat:\xff'
            })) {
                const chat = JSON.parse(value);
                if (chat.title.toLowerCase().includes(searchTermLower) ||
                    (chat.last_message &&
                        chat.last_message.content.toLowerCase().includes(searchTermLower))) {
                    chats.push({
                        ...chat,
                        last_updated: new Date(chat.last_updated),
                        last_message: chat.last_message ? {
                            ...chat.last_message,
                            timestamp: new Date(chat.last_message.timestamp)
                        } : null
                    });
                }
            }
        }
        catch (error) {
            console.error('Error searching chats:', error);
            return [];
        }
        return chats.sort((a, b) => b.last_updated.getTime() - a.last_updated.getTime());
    }
    async close() {
        if (this.isInitialized && this.db) {
            try {
                await this.db.close();
                this.isInitialized = false;
                this.initializationPromise = null;
            }
            catch (error) {
                console.error('Error closing database:', error);
                throw error;
            }
        }
    }
    async messageExists(messageId) {
        await this.ensureInitialized();
        try {
            await this.db.get(this.messageKey(messageId));
            return true;
        }
        catch (error) {
            if (error.code === 'LEVEL_NOT_FOUND') {
                return false;
            }
            throw error;
        }
    }
}
exports.ChatHistoryManager = ChatHistoryManager;
//# sourceMappingURL=chatHistoryManager.js.map