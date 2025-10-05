"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateChatHistoryHtml = generateChatHistoryHtml;
const timeUtils_1 = require("../utils/timeUtils");
function generateChatHistoryHtml(chats) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            :root {
                /* Core colors from theme */
                --editor-background: #1E1E1E;
                --editor-foreground: #D4D4D4;
                --button-background: #007ACC;
                --button-foreground: #FFFFFF;
                --input-background: #3C3C3C;
                --input-foreground: #9399B2; 
                --panel-background: #252526;
                
                /* Token colors */
                --token-string: #CE9178;
                --token-variable: #9CDCFE;
                --token-class: #4EC9B0;
                --token-keyword: #569CD6;
            }

            body {
                margin: 0;
                padding: 0;
                font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: var(--editor-background);
                color: var(--editor-foreground);
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }

            .header {
                padding: 12px 16px;
                border-bottom: 0.75px solid rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: var(--editor-background);
            }

            .header h2 {
                margin: 0;
                font-size: 11.25px;
                font-weight: 600;
                color: var(--editor-foreground);
            }

            .close-button {
                background: none;
                border: none;
                color: var(--editor-foreground);
                cursor: pointer;
                padding: 4px 8px;
                font-size: 14px;
                opacity: 0.7;
                transition: opacity 0.2s;
            }

            .close-button:hover {
                opacity: 1;
            }

            .search-container {
                padding: 12px 16px;
                position: sticky;
                top: 0;
                background: var(--editor-background);
                z-index: 1;
                border-bottom: 0.75px solid rgba(255, 255, 255, 0.1);
            }

            .search-input {
                width: 100%;
                padding: 6px 7.5px;
                border-radius: 3px;
                border: 0.75px solid rgba(255, 255, 255, 0.1);
                background: var(--editor-background);
                color: var(--input-foreground);
                font-family: 'Poppins', sans-serif;
                font-size: 11.25px;
                line-height: 20px;
            }

            .search-input::placeholder {
                color: var(--input-foreground);
                opacity: 0.6;
            }

            .chat-list {
                overflow-y: auto;
                height: calc(100vh - 120px);
            }

            .chat-item {
                padding: 12px 16px;
                border-bottom: 0.75px solid rgba(255, 255, 255, 0.1);
                cursor: pointer;
                transition: background 0.2s;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .chat-item:hover {
                background: rgba(255, 255, 255, 0.05);
            }

            .chat-title {
                font-size: 11.25px;
                font-weight: 600;
                color: var(--input-foreground);
                margin-bottom: 2px;
            }

            .chat-preview {
                font-size: 10.5px;
                color: var(--input-foreground);
                margin-bottom: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 90%;
                opacity: 0.8;
            }

            .chat-time {
                font-size: 9px;
                color: var(--input-foreground);
                opacity: 0.6;
            }

            /* Scrollbar styling */
            ::-webkit-scrollbar {
                width: 4px;
            }

            ::-webkit-scrollbar-track {
                background: transparent;
            }

            ::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
            }

            ::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h2>CHAT HISTORY</h2>
            <button class="close-button" onclick="closeHistory()">×</button>
        </div>
        <div class="search-container">
            <input type="text" 
                   class="search-input" 
                   placeholder="Search in chat history..." 
                   oninput="filterChats(this.value)">
        </div>
        <div class="chat-list">
            ${chats.map((chat) => `
                <div class="chat-item" onclick="loadChat('${chat.id}')">
                    <div class="chat-title">${chat.title.toString()}</div>
                    <div class="chat-preview">${truncateText(chat.last_message?.content.toString() || 'No messages', 100)}</div>
                    <div class="chat-time">${(0, timeUtils_1.formatTimeAgo)(new Date(chat.last_message?.timestamp))}</div>
                </div>
            `).join('')}
        </div>

        <script>
            const vscode = acquireVsCodeApi();

            try{
       

            // Parse theme colors passed from the extension
            const themeColors = THEME_COLORS_JSON;

            vscode.postMessage({
                command: 'log_event',
                value: ""
            });

            // Enhanced function to apply theme colors
            function applyThemeColors() {
                const root = document.documentElement;
                
                // Core editor colors
                root.style.setProperty('--editor-background', themeColors['editor.background']);
                root.style.setProperty('--editor-foreground', themeColors['editor.foreground']);
                
                // Token colors for syntax highlighting
                root.style.setProperty('--token-string', themeColors['token.string'] || '#CE9178');
                root.style.setProperty('--token-variable', themeColors['token.variable'] || '#9CDCFE');
                root.style.setProperty('--token-class', themeColors['token.class'] || '#4EC9B0');
                root.style.setProperty('--token-keyword', themeColors['token.keyword'] || '#569CD6');
                
                // Button colors
                root.style.setProperty('--button-background', themeColors['button.background']);
                root.style.setProperty('--button-foreground', themeColors['button.foreground']);
                
                // Input colors
                root.style.setProperty('--input-background', themeColors['input.background']);

                var inputForeground = root.style.getPropertyValue('--input-foreground');
                var editorBackground = root.style.getPropertyValue('--editor-background');
                if(isLightColor(inputForeground)&&isLightColor(editorBackground)){
                    root.style.setProperty('--input-foreground', '#9399B2');
                }else{
                    root.style.setProperty('--input-foreground', themeColors['input.foreground']);
                }

                if(!isLightColor(inputForeground)&&!isLightColor(editorBackground)){
                    root.style.setProperty('--input-foreground', '#9399B2');
                }else{
                    root.style.setProperty('--input-foreground', themeColors['input.foreground']);
                }
                vscode.postMessage({
                    command: 'log_event',
                    value: ""
                });
                // Panel colors
                root.style.setProperty('--panel-background', themeColors['panel.background']);

            }

            function isLightColor(hexColor){
                // Remove the # if present
                hexColor = hexColor.replace('#', '');
                
                // Convert hex to RGB
                const r = parseInt(hexColor.substr(0, 2), 16);
                const g = parseInt(hexColor.substr(2, 2), 16);
                const b = parseInt(hexColor.substr(4, 2), 16);
                
                // Calculate relative luminance using the formula
                // Luminance = (0.299 * R + 0.587 * G + 0.114 * B) / 255
                const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                
                // Consider the color light if luminance is greater than 0.5
                return luminance > 0.5;
            }

            applyThemeColors()
        }catch(e){
            vscode.postMessage({
                command: 'log_event',
                value:""
            });
        }

            function loadChat(chatId) {
                vscode.postMessage({
                    command: 'load_chat',
                    value: chatId
                });
            }

            function closeHistory() {
                vscode.postMessage({
                    command: 'close_history'
                });
            }

            function filterChats(searchTerm) {
                vscode.postMessage({
                    command: 'filter_chats',
                    value: searchTerm
                });
            }
        </script>
    </body>
    </html>
    `;
}
function truncateText(text, maxLength) {
    if (!text)
        return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
//# sourceMappingURL=chatHistoryView.js.map