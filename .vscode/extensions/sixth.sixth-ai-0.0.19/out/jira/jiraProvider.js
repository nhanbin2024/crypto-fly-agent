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
exports.JiraViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const projectUtils_1 = require("../utils/projectUtils");
const extension_1 = require("../extension");
const axios_1 = __importDefault(require("axios"));
const treeNode_1 = require("../sidebars/treeNode");
const socket_1 = require("../utils/socket");
const fileIndex_1 = require("../utils/fileIndex");
const fileUtils_1 = require("../utils/fileUtils");
const authPanel_1 = require("../auth/authPanel");
const genUtils_1 = require("../utils/genUtils");
const axiosInstance_1 = require("../utils/axiosInstance");
const api = (0, axiosInstance_1.createAxiosInstance)();
var jiraPanel;
var jiraWebViewDisposed = false;
class JiraViewProvider {
    constructor(context) {
        this.context = context;
        this._extensionUri = context.extensionUri;
    }
    async resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        this.getCurrentOnboardingStep();
        webviewView.webview.onDidReceiveMessage(async (data) => {
            if (data["command"] === "log_event") {
                console.log("JIRAPROVIDER from here ", data["value"]);
            }
            if (data["command"] === "show_jira_enterprise") {
                const panel = vscode.window.createWebviewPanel('centeredInput', 'Update your billing Info', vscode.ViewColumn.Active, // Show in the active editor column
                {
                    enableScripts: true,
                });
                panel.webview.html = fs.readFileSync(__dirname + "/enterprise.html", 'utf-8');
                panel.webview.onDidReceiveMessage((message) => {
                    if (message["command"] === "upgrade_to_jira_enterprise") {
                        this.createBilling(150);
                    }
                });
            }
            if (data["command"] === "showJirabilling") {
                this.createBilling(5);
            }
            if (data["command"] === "update_issue_status") {
                const parsedData = data["value"];
                this.updateIssue(parsedData["issue_id"], parsedData["new_status_id"]);
            }
            if (data["command"] === "reload_jira_sprint") {
                this.getCurrentOnboardingStep();
            }
            if (data["command"] === "sprint_selected") {
                if (jiraPanel === undefined) {
                    this.activateJiraPanel();
                }
                else if (jiraWebViewDisposed) {
                    this.activateJiraPanel();
                }
                try {
                    jiraPanel.active;
                }
                catch (e) {
                    this.activateJiraPanel();
                    jiraWebViewDisposed = false;
                }
                var webview = jiraPanel.webview;
                var html = fs.readFileSync(__dirname + "/description.html", 'utf-8');
                webview.html = html;
                webview.postMessage({
                    command: "show_loader",
                    value: "show_loader"
                });
                this.loadIsssueDescription(data["value"]);
            }
            if (data["command"] === "redirectToAtlassianAuthPage") {
                const url = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=tAnXRLfk05lYdqesHPk9xHNJywLLP8NX&scope=read%3Ajira-work%20manage%3Ajira-project%20manage%3Ajira-configuration%20manage%3Ajira-webhook%20manage%3Ajira-data-provider%20write%3Ajira-work%20read%3Ajira-user%20offline_access&redirect_uri=https%3A%2F%2Fbackend.withsix.co%2Fjira%2Fredirect&state=${(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, "")}&response_type=code&prompt=consent`;
                vscode.env.openExternal(vscode.Uri.parse(url));
            }
            if (data['command'] === "submitDomain") {
                this.handleAuthDone(data["value"]);
            }
            if (data['command'] === "submit_project_key") {
                this.submitProjectKey(data["value"]);
            }
        });
    }
    createBilling(pricing) {
        const panel = vscode.window.createWebviewPanel('centeredInput', 'Update your billing Info', vscode.ViewColumn.Active, // Show in the active editor column
        {
            enableScripts: true,
        });
        panel.webview.html = (0, authPanel_1.createBillingPanel)(pricing);
        panel.webview.onDidReceiveMessage((message) => {
            if (message.command == "show_info_message") {
                vscode.window.showInformationMessage(message.value);
            }
            if (message.command === "billing_submit") {
                vscode.window.showInformationMessage("Updating your billing info");
                (0, authPanel_1.initPaymentForUser)((0, extension_1.getExtensionContext)(), message.value["id"], (message) => {
                    vscode.window.showInformationMessage("Thanks for adding your card, your account has been upgraded. You can start enjoying premium features such as syncing with your Jira Board, ChatGPT and many more!");
                    this._view?.webview.postMessage({
                        command: "update_tier",
                        value: "standard"
                    });
                    api.post("https://backend.withsix.co/vs-code/log_user_requested_next_feature", {
                        "email": (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, "anonymous"),
                        "feature": "ENTERPRISE_NEW_JIRA_REQUESTED_FEATURE_SUBSCRIBED"
                    }).then(response => {
                    });
                    (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, "true");
                    panel.dispose();
                }, (message) => {
                });
            }
            if (message.command === "error") {
                vscode.window.showInformationMessage(message.value);
            }
        });
        api.post("https://backend.withsix.co/vs-code/log_user_requested_next_feature", {
            "email": (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, "anonymous"),
            "feature": "ENTERPRISE_NEW_JIRA_REQUESTED_FEATURE"
        }).then(response => {
        });
    }
    updateIssue(issueId, newStatus) {
        const headers = {
            'Authorization': `Bearer ${(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.JWT, "")}`,
            'Content-Type': 'application/json'
        };
        api.get(`https://backend.withsix.co/jira/get_all_issue_transitions?user_id=${(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, "")}&issue_id=${issueId}`, { headers })
            .then(response => {
            var transitions = response.data;
            var transitionId = transitions["transitions"].filter((column) => column.name === newStatus)[0].id;
            const body = {
                "user_id": (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, ""),
                "issue_id": issueId,
                "new_status_id": transitionId
            };
            api.patch("https://backend.withsix.co/jira/update_issue_status", body, { headers }).then(response => {
                const data = response.data;
            }).catch(error => {
            });
        }).catch((error) => {
        });
    }
    getCurrentOnboardingStep() {
        if ((0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, null)) {
            if ((0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.ADDED_BILLING, "false") === "true") {
                var html = "";
                const authenticated = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.JIRA_AUTHENTICATED, "");
                const projectKey = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.CURRENT_SELECTED_PROJEcT, "");
                if (authenticated !== "true") {
                    if (this._view) {
                        this._view.webview.html = fs.readFileSync(__dirname + "/auth.html", 'utf-8');
                    }
                }
                else if (projectKey === null || projectKey === "") {
                    this.getAllJiraProjects();
                }
                else {
                    this.LoadDashboardTasks();
                }
            }
            else {
                if (this._view) {
                    this._view.webview.html = fs.readFileSync(__dirname + "/onboarding.html", 'utf-8');
                }
            }
        }
        else {
            if (this._view) {
                this._view.webview.html = "<p> Signup or Login first to access this feature 🥲<p>";
            }
        }
    }
    activateJiraPanel() {
        jiraPanel = vscode.window.createWebviewPanel('centeredInput', 'Issue description', vscode.ViewColumn.Beside, // Show in the active editor column
        {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        jiraPanel.webview.onDidReceiveMessage(async (message) => {
            if (message["command"] === "log_event") {
                console.log("JIRAPROVIDER ", message["value"]);
            }
            if (message.command === "add_code_immediately") {
                const data = message.value;
                (0, fileUtils_1.insertMultilineSnippet)(data["code"], parseInt(data["line"]), data["needs"]);
            }
            if (message.command === "create_file_for_code") {
                const selectedFolder = await (0, fileUtils_1.selectFolder)();
                const data = message.value;
                if (selectedFolder) {
                    (0, fileUtils_1.createFileInDirectory)(selectedFolder, data["fileName"], data["code"]);
                    vscode.window.showInformationMessage(`Created ${data["fileName"]} file in ${selectedFolder} folder`);
                }
                else {
                    vscode.window.showWarningMessage('No folder selected.');
                }
            }
            if (message["command"] === "implementJiraSprint") {
                var value = message["value"];
                var issue = value["issue"];
                if (this._jiraSocket) {
                    this._jiraSocket.sendMessage(JSON.stringify({
                        apikey: (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, ""),
                        vscode_version: "0.1.31",
                        id: value["id"],
                        user_prompt: ` 
                        JIRA SPRINT:
                            - subject: ${issue["fields"]["summary"]}
                            - description: ${issue["fields"]["description"]}
                        `,
                        prompt_type: "JIRA",
                        project_path: (0, fileIndex_1.getProjectPath)()
                    }));
                }
                else {
                    this._jiraSocket = new socket_1.WebSocketClient(`${genUtils_1.socketBaseUrl}/standard_user_wss`, (connected) => {
                        if (this._jiraSocket)
                            this._jiraSocket.sendMessage(JSON.stringify({
                                apikey: (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, ""),
                                vscode_version: "0.1.31",
                                id: value["id"],
                                user_prompt: ` 
                            JIRA SPRINT:
                                - subject: ${issue["fields"]["summary"]}
                                - description: ${issue["fields"]["description"]}
                            `,
                                prompt_type: "JIRA",
                                project_path: (0, fileIndex_1.getProjectPath)()
                            }));
                    });
                    this._jiraSocket.setMessageCallback((json) => {
                        jiraPanel.webview.postMessage({
                            command: "fill_text",
                            value: json
                        });
                    });
                }
                api.post("https://backend.withsix.co/vs-code/log_chat_usuage", {
                    "log_type": (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.EMAIL, "anonymous"),
                    "apikey": (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, ""),
                    "question": `JIRA_USAGE ${JSON.stringify(message.value["user_prompt"])}`
                }).then(response => {
                });
            }
        });
        jiraWebViewDisposed = false;
    }
    LoadDashboardTasks() {
        const headers = {
            'Authorization': `Bearer ${(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.JWT, "")}`,
            'Content-Type': 'application/json'
        };
        var raw_html = fs.readFileSync(__dirname + "/dashboard.html", 'utf-8');
        if (this._view) {
            this._view.webview.html = raw_html;
        }
        api.get(`https://backend.withsix.co/jira/get_user_jira_project_issues?user_id=${(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, "")}`, { headers }).then(response => {
            const issues = response.data.issues;
            if (issues) {
                if (issues.length) {
                    const allCates = [];
                    issues.forEach((issue) => {
                        var found = allCates.filter(cur => cur["name"] === issue.fields.status.name);
                        if (found.length === 0) {
                            const json = {
                                "name": issue.fields.status.name,
                                "id": issue.fields.status.id
                            };
                            allCates.push(json);
                        }
                    });
                    this._view?.webview.postMessage({
                        command: "display_sprints",
                        value: {
                            allCategories: allCates,
                            issues: issues
                        }
                    });
                }
                else {
                    this.LoadDashboardTasks();
                }
            }
            else {
                this.LoadDashboardTasks();
            }
        }).catch(error => {
        });
    }
    submitProjectKey(key) {
        const data = {
            "project_key": key
        };
        const headers = {
            'Authorization': `Bearer ${(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.JWT, "")}`,
            'Content-Type': 'application/json'
        };
        api.post("https://backend.withsix.co/jira/add_user_jira_project_key", data, { headers })
            .then(response => {
            (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), projectUtils_1.CURRENT_SELECTED_PROJEcT, key);
            this.LoadDashboardTasks();
        });
    }
    handleAuthDone(domain) {
        api.get(`https://${domain}.atlassian.net/_edge/tenant_info`)
            .then(response => {
            const cloudId = response.data["cloudId"];
            const jiraDomain = `https://${domain}.atlassian.net`;
            const userId = (0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, "");
            const headers = {
                'Authorization': `Bearer ${(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.JWT, "")}`,
                'Content-Type': 'application/json'
            };
            const data = {
                "user_id": userId,
                "domain": jiraDomain,
                "cloud_id": cloudId
            };
            api.post("https://backend.withsix.co/jira/add_user_jira_domain", data, { headers })
                .then(response => {
                (0, projectUtils_1.saveDataToCache)((0, extension_1.getExtensionContext)(), projectUtils_1.JIRA_AUTHENTICATED, "true");
                this.getAllJiraProjects();
            });
        });
    }
    postMessage(command, value) {
        this._view?.webview.postMessage({
            command: command,
            value: value
        });
    }
    getAllJiraProjects() {
        const headers = {
            'Authorization': `Bearer ${(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.JWT, "")}`,
            'Content-Type': 'application/json'
        };
        api.get("https://backend.withsix.co/jira/get_all_user_jira_projects", { headers })
            .then(response => {
            const arrays = response.data;
            if (!Array.isArray(arrays) || arrays.length < 1) {
                api.get("https://backend.withsix.co/jira/get_all_user_jira_projects", { headers })
                    .then(response => {
                    const arrays = response.data;
                    try {
                        var rawHtml = fs.readFileSync(__dirname + "/choose_project.html", 'utf-8');
                        var html = (0, treeNode_1.fillTemplate)(rawHtml, JSON.stringify(arrays), "REPLACE_THIS");
                        if (this._view) {
                            this._view.webview.html = html;
                            this._view.webview.postMessage('stop_loader');
                        }
                    }
                    catch (e) {
                        this.getAllJiraProjects();
                    }
                }).catch(error => {
                    vscode.window.showErrorMessage("Failed to load your jira dashboard, please try again");
                });
            }
            var rawHtml = fs.readFileSync(__dirname + "/choose_project.html", 'utf-8');
            var html = (0, treeNode_1.fillTemplate)(rawHtml, JSON.stringify(arrays), "REPLACE_THIS");
            if (this._view) {
                this._view.webview.html = html;
            }
        });
    }
    loadIsssueDescription(issue) {
        const headers = {
            'Authorization': `Bearer ${(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.JWT, "")}`,
            'Content-Type': 'application/json'
        };
        axios_1.default
            .get(`https://backend.withsix.co/jira/get_user_jira_issue?user_id=${(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, "")}&issue_id=${issue.id}`, { headers })
            .then(response => {
            const issue_details = response.data;
            jiraPanel.webview.postMessage({
                command: "display_detail",
                value: issue_details
            });
        }).catch(error => {
            axios_1.default
                .get(`https://backend.withsix.co/jira/get_user_jira_issue?user_id=${(0, projectUtils_1.getDataFromCache)((0, extension_1.getExtensionContext)(), projectUtils_1.APIKEY, "")}&issue_id=${issue.id}`, { headers })
                .then(response => {
                const issue_details = response.data;
                jiraPanel.webview.postMessage({
                    command: "display_detail",
                    value: issue_details
                });
            }).catch(error => {
                vscode.window.showErrorMessage("Failed to load jira sprint details, please try again");
            });
        });
    }
}
exports.JiraViewProvider = JiraViewProvider;
JiraViewProvider.viewType = 'sixth-jira-container';
//# sourceMappingURL=jiraProvider.js.map