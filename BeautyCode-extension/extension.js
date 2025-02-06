const vscode = require('vscode');
const axios = require('axios');
const fs = require('fs');
const path = require('path')

function getWebviewContent() {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js"></script>
            <style>
                :root {
                    --primary-color: #2563eb;
                    --primary-hover: #1d4ed8;
                    --bg-color: #f8fafc;
                    --chat-bg: #ffffff;
                    --user-msg-bg: #f1f5f9;
                    --ai-msg-bg: #e0e7ff;
                    --text-primary: #1e293b;
                    --text-secondary: #475569;
                    --border-color: #e2e8f0;
                    --input-bg: #ffffff;
                    --button-hover: #1e40af;
                    --code-bg: #f8fafc;
                    --blockquote-bg: #f1f5f9;
                    --scrollbar-thumb: #cbd5e1;
                    --scrollbar-track: #f1f5f9;
                }
 
                body {
                    margin: 0;
                    padding: 16px;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    background-color: var(--bg-color);
                    color: var(--text-primary);
                    line-height: 1.6;
                }
 
                #chat-container {
                    height: calc(100vh - 140px);
                    overflow-y: auto;
                    margin-bottom: 16px;
                    padding: 16px;
                    background-color: var(--chat-bg);
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                }
 
                #chat-container::-webkit-scrollbar {
                    width: 8px;
                }
 
                #chat-container::-webkit-scrollbar-track {
                    background: var(--scrollbar-track);
                    border-radius: 4px;
                }
 
                #chat-container::-webkit-scrollbar-thumb {
                    background: var(--scrollbar-thumb);
                    border-radius: 4px;
                }
 
                .message {
                    margin: 16px 0;
                    padding: 16px;
                    border-radius: 12px;
                    box-shadow: 0 2px 4px rgb(0 0 0 / 0.05);
                    transition: transform 0.2s ease;
                }
 
                .message:hover {
                    transform: translateY(-1px);
                }
 
                .user-message {
                    background-color: var(--user-msg-bg);
                    border: 1px solid var(--border-color);
                    margin-left: 20%;
                }
 
                .ai-message {
                    background-color: var(--ai-msg-bg);
                    color: var(--text-primary);
                    margin-right: 20%;
                }
 
                #input-container {
                    position: fixed;
                    bottom: 16px;
                    left: 16px;
                    right: 16px;
                    display: flex;
                    gap: 12px;
                    background-color: var(--bg-color);
                    padding: 16px;
                    border-top: 1px solid var(--border-color);
                }
 
                #message-input {
                    flex-grow: 1;
                    padding: 12px 16px;
                    border: 2px solid var(--border-color);
                    border-radius: 8px;
                    background-color: var(--input-bg);
                    color: var(--text-primary);
                    font-size: 16px;
                    transition: border-color 0.2s ease;
                }
 
                #message-input:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 3px rgb(37 99 235 / 0.1);
                }
 
                button {
                    padding: 12px 24px;
                    background-color: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
 
                button:hover {
                    background-color: var(--button-hover);
                    transform: translateY(-1px);
                }
 
                button:active {
                    transform: translateY(0);
                }
 
                .markdown-content {
                    line-height: 1.7;
                }
                .markdown-content pre code {
                    color: black;
                }
                .markdown-content code {
                    background-color: var(--code-bg);
                    padding: 0.2em 0.4em;
                    border-radius: 4px;
                    font-family: 'Fira Code', monospace;
                    font-size: 0.9em;
                }
 
                .markdown-content pre {
                    background-color: var(--code-bg);
                    padding: 1.2em;
                    border-radius: 8px;
                    overflow-x: auto;
                    border: 1px solid var(--border-color);
                }
 
                .markdown-content pre code {
                    padding: 0;
                    background-color: transparent;
                }
 
                .markdown-content h1,
                .markdown-content h2,
                .markdown-content h3,
                .markdown-content h4 {
                    color: var(--text-primary);
                    margin-top: 1.5em;
                    margin-bottom: 0.75em;
                }
 
                .markdown-content blockquote {
                    background-color: var(--blockquote-bg);
                    border-left: 4px solid var(--primary-color);
                    margin: 1.5em 0;
                    padding: 1em;
                    border-radius: 0 8px 8px 0;
                }
            </style>
        </head>
        <body>
            <div id="chat-container"></div>
            <div id="input-container">
                <input type="text" id="message-input" placeholder="Type your message...">
                <button id="send-button">Send</button>
            </div>
 
            <script>
                const vscode = acquireVsCodeApi();
                const chatContainer = document.getElementById('chat-container');
                const messageInput = document.getElementById('message-input');
                const sendButton = document.getElementById('send-button');
 
                function addMessage(text, type) {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message ' + type + '-message';
 
                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'markdown-content';
 
                    if (type === 'ai') {
                        marked.setOptions({
                            gfm: true,
                            breaks: true,
                            sanitize: false
                        });
                        contentDiv.innerHTML = marked.parse(text);
                    } else {
                        contentDiv.textContent = text;
                    }
 
                    messageDiv.appendChild(contentDiv);
                    chatContainer.appendChild(messageDiv);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
 
                function sendMessage() {
                    const text = messageInput.value.trim();
                    if (text) {
                        addMessage(text, 'user');
                        vscode.postMessage({
                            command: 'sendMessage',
                            text: text
                        });
                        messageInput.value = '';
                    }
                }
 
                // Handle Enter key
                messageInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault(); // Prevent default to avoid newline
                        sendMessage();
                    }
                });
 
                // Handle button click
                sendButton.addEventListener('click', sendMessage);
 
                // Handle messages from extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'initialize':
                            addMessage(message.text, 'user');
                            break;
                        case 'receiveMessage':
                            addMessage(message.text, 'ai');
                            break;
                    }
                });
            </script>
        </body>
        </html>
    `;
}
 
class ChatPanel {
    static currentPanel;
    static viewType = 'chatbox';

    /**
     * Creates or shows the chat panel.
     * @param {vscode.ExtensionContext} extensionUri - The extension URI.
     */
    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        if (ChatPanel.currentPanel) {
            ChatPanel.currentPanel.panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel(ChatPanel.viewType, 'Chat', column || vscode.ViewColumn.Two, { enableScripts: true, retainContextWhenHidden: true });
        ChatPanel.currentPanel = new ChatPanel(panel, extensionUri);
    }

    /**
     * Constructs a new chat panel.
     * @param {vscode.WebviewPanel} panel - The webview panel.
     * @param {vscode.ExtensionContext} extensionUri - The extension URI.
     */
    constructor(panel, extensionUri) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.disposables = [];
        this.update();
        this.panel.webview.onDidReceiveMessage(message => {
            switch (message.type) {
                case 'message':
                    this.handleMessage(message.content);
                    break;
            }
        }, null, this.disposables);
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    }

    /**
     * Handles incoming messages.
     * @param {string} content - The message content.
     */
    async handleMessage(content) {
        const response = `Received: ${content}`;
        await this.panel.webview.postMessage({ type: 'response', content: response });
    }

    /**
     * Updates the webview content.
     */
    update() {
        this.panel.webview.html = getWebviewContent();
    }

    /**
     * Disposes of the chat panel.
     */
    dispose() {
        ChatPanel.currentPanel = undefined;
        this.panel.dispose();
        this.disposables.forEach(disposable => disposable.dispose());
    }
}


/**
 * Activates the extension.
 * @param {vscode.ExtensionContext} context - The extension context.
 */
function activate(context) {
    console.log('Extension "beautycode" is active!');

    const registerCommand = (name, callback) => context.subscriptions.push(vscode.commands.registerCommand(name, callback));

    registerCommand('beautycode.readAll', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const fullText = document.getText();
            const newDocument = await vscode.workspace.openTextDocument({ content: fullText, language: document.languageId });
            await vscode.window.showTextDocument(newDocument, { viewColumn: vscode.ViewColumn.Beside });
            vscode.window.showInformationMessage('Document content loaded in new editor');
        } else {
            vscode.window.showWarningMessage('No active editor found');
        }
    });

    registerCommand('beautycode.readSelection', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            const text = editor.document.getText(selection);
            if (text) {
                const newDocument = await vscode.workspace.openTextDocument({ content: `Selected Text:\n${'-'.repeat(20)}\n${text}`, language: editor.document.languageId });
                await vscode.window.showTextDocument(newDocument, { viewColumn: vscode.ViewColumn.Beside });
            } else {
                vscode.window.showWarningMessage('No text selected');
            }
        }
    });

    registerCommand('beautycode.readLine', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const line = editor.selection.active.line;
            const lineText = editor.document.lineAt(line).text;
            const newDocument = await vscode.workspace.openTextDocument({ content: `Line ${line + 1}:\n${'-'.repeat(20)}\n${lineText}`, language: editor.document.languageId });
            await vscode.window.showTextDocument(newDocument, { viewColumn: vscode.ViewColumn.Beside });
        }
    });

    registerCommand('beautycode.processDocument', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
            statusBarItem.text = "$(loading~spin) Calling API...";
            statusBarItem.show();
            const document = editor.document;
            const text = document.getText();
            try {
                const response = await axios.post("http://127.0.0.1:8000/beautycode/v1/code-format", { text, language: document.languageId });
                statusBarItem.dispose();
                let formattedResponse =  response.data.text;
                formattedResponse = formattedResponse.replace(/^```(python|java)\n/g, '');
                formattedResponse= formattedResponse.replace(/\n```$/g, '');
                formattedResponse = formattedResponse.replace(/```/g, '');
                const currentDir = path.dirname(document.fileName);
                const beautycodeFileName = document.languageId === 'java' ? 'beautycode.java' : 'beautycode.py';
                const beautycodeFilePath = path.join(currentDir, beautycodeFileName);
                fs.writeFileSync(beautycodeFilePath, formattedResponse);
                const resultDocument = await vscode.workspace.openTextDocument(beautycodeFilePath);
                await vscode.window.showTextDocument(resultDocument, { viewColumn: vscode.ViewColumn.Beside });
                vscode.window.showInformationMessage('API call successful!');
            } catch (error) {
                statusBarItem.dispose();
                vscode.window.showErrorMessage(`API Error: ${error.message}`);
            }
        }
    });

    registerCommand('beautycode.suggestions', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
            statusBarItem.text = "$(loading~spin) Calling API...";
            statusBarItem.show();
            const document = editor.document;
            const text = document.getText();
            try {
                const response = await axios.post("http://127.0.0.1:8000/beautycode/v1/code-suggest", { text, language: document.languageId });
                statusBarItem.dispose();
 
                const formattedResponse =  response.data.text;
 
   
                const resultDocument = await vscode.workspace.openTextDocument({
                    content: formattedResponse,
                    language: "markdown"
                });
 
                await vscode.window.showTextDocument(resultDocument, {
                    viewColumn: vscode.ViewColumn.Beside
                });
 
                vscode.window.showInformationMessage('API call successful!');
            } catch (error) {
                statusBarItem.dispose();
                vscode.window.showErrorMessage(`API Error: ${error.message}`);
            }
        }
    });

    let currentPanel;
    registerCommand('beautycode.startChat', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor found');
            return;
        }
        const selectedText = editor.document.getText(editor.selection);
        currentPanel = currentPanel || vscode.window.createWebviewPanel('aiChat', 'AI Chat', vscode.ViewColumn.Beside, { enableScripts: true, retainContextWhenHidden: true });
        currentPanel.onDidDispose(() => currentPanel = undefined, null, context.subscriptions);
        currentPanel.webview.html = getWebviewContent();
        currentPanel.webview.onDidReceiveMessage(async message => {
            if (message.command === 'sendMessage') {
                try {
                    const response = await axios.post("http://127.0.0.1:8000/beautycode/v1/chat-ai", { text: message.text });
                    currentPanel.webview.postMessage({ command: 'receiveMessage', text: response.data.text });
                } catch (error) {
                    vscode.window.showErrorMessage('Failed to get AI response');
                }
            }
        }, undefined, context.subscriptions);
        if (selectedText) {
            currentPanel.webview.postMessage({ command: 'initialize', text: selectedText });
        }
    });
    
    let calldocumentApi = vscode.commands.registerCommand('beautycode.createDocument', async () => {
        const editor = vscode.window.activeTextEditor;
       
        if (editor) {
            try {
           
                const statusBarItem = vscode.window.createStatusBarItem(
                    vscode.StatusBarAlignment.Left
                );
                statusBarItem.text = "$(loading~spin) Calling API...";
                statusBarItem.show();
 
                const document = editor.document;
                const text = document.getText();

                const response_suggest = await axios.post("http://127.0.0.1:8000/beautycode/v1/code-suggest", {
                    "text": text,
                    "language":document.languageId
                   
                });
 
                statusBarItem.dispose();
 
                let formattedResponse =  response_suggest.data.text;
               
 
                const currentDir = path.dirname(document.fileName);

                const beautycodeFilePath = path.join(currentDir, "beautycode.txt");
                fs.writeFileSync(beautycodeFilePath, formattedResponse);
                const margin = '-'.repeat(100)
                fs.appendFileSync(beautycodeFilePath,margin);
 
               
                const response = await axios.post("http://127.0.0.1:8000/beautycode/v1/code-format", {
                    "text": text,
                    "language":document.languageId
                });
 
                let formattedResponse2 =  response.data.text;
                fs.appendFileSync(beautycodeFilePath, formattedResponse2);
                fs.appendFileSync(beautycodeFilePath,margin);
                if(document.languageId==="python"){

                                const response_test = await axios.post("http://127.0.0.1:8000/beautycode/v1/analyze-code", {
                    "text": text,
                    "language":document.languageId
                });

                let formattedResponse1 =  response_test.data.text;
                fs.appendFileSync(beautycodeFilePath, formattedResponse1+'\n');
                fs.appendFileSync(beautycodeFilePath,margin+'\n');
                
                formattedResponse2 = formattedResponse2.replace(/^```(python|java)\n/g, '');
                formattedResponse2= formattedResponse2.replace(/\n```$/g, '');
                formattedResponse2= formattedResponse2.replace(/```/g, '');
                const response_test1 = await axios.post("http://127.0.0.1:8000/beautycode/v1/analyze-code", {
                    "text": formattedResponse2,
                    "language":document.languageId
                });

                let formattedResponse3 =  response_test1.data.text;
                fs.appendFileSync(beautycodeFilePath, formattedResponse3+'\n');
                fs.appendFileSync(beautycodeFilePath,margin+'\n');
            };
                const resultDocument = await vscode.workspace.openTextDocument(beautycodeFilePath);
 
                await vscode.window.showTextDocument(resultDocument, {
                    viewColumn: vscode.ViewColumn.Beside
                });
 
                vscode.window.showInformationMessage('API call successful!');
 
            } catch (error) {
                let errorMessage = 'API Error: ';
               
                if (axios.isAxiosError(error)) {
     
                    if (error.response) {
                       
                        errorMessage += `Server returned ${error.response.status}: ${error.response.data.message || error.response.statusText}`;
                    } else if (error.request) {
                     
                        errorMessage += 'No response received from server';
                    } else {
                     
                        errorMessage += error.message;
                    }
                } else {
               
                    errorMessage += error.message;
                }
               
                vscode.window.showErrorMessage(errorMessage);
            }
        }
    });  
}
 
 
function deactivate() {}
 
module.exports = {
    activate,
    deactivate
}