"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAxiosInstance = createAxiosInstance;
exports.createAuthAxiosInstance = createAuthAxiosInstance;
exports.createAutoCompleteAxiosInstance = createAutoCompleteAxiosInstance;
const axios_1 = __importDefault(require("axios"));
const vscode_1 = __importDefault(require("vscode"));
const https_1 = __importDefault(require("https"));
const url_1 = __importDefault(require("url"));
// Function to create a properly configured axios instance
function createAxiosInstance() {
    // Get VSCode's HTTP proxy settings
    const httpSettings = vscode_1.default.workspace.getConfiguration('http');
    const proxyUrl = httpSettings.get('proxy');
    // Debug info
    console.log('VSCode proxy settings:', proxyUrl);
    // Define the config with proper typing
    const axiosConfig = {
        baseURL: 'https://trysixth.com',
        timeout: 10000, // 10 seconds
    };
    // If proxy is configured in VSCode settings
    if (proxyUrl) {
        const parsedUrl = new url_1.default.URL(proxyUrl);
        axiosConfig.proxy = {
            host: parsedUrl.hostname,
            port: parseInt(parsedUrl.port),
            protocol: parsedUrl.protocol.replace(':', '')
        };
        console.log('Using proxy configuration:', axiosConfig.proxy);
    }
    // In some SSH environments, you might need to disable strict SSL
    if (vscode_1.default.workspace.getConfiguration('http').get('proxyStrictSSL') === false) {
        axiosConfig.httpsAgent = new https_1.default.Agent({
            rejectUnauthorized: false
        });
        console.log('SSL verification disabled');
    }
    return axios_1.default.create(axiosConfig);
}
// Function to create a properly configured axios instance
function createAuthAxiosInstance() {
    // Get VSCode's HTTP proxy settings
    const httpSettings = vscode_1.default.workspace.getConfiguration('http');
    const proxyUrl = httpSettings.get('proxy');
    // Debug info
    console.log('VSCode proxy settings:', proxyUrl);
    // Define the config with proper typing
    const axiosConfig = {
        baseURL: 'https://backend.withsix.co',
        timeout: 10000, // 10 seconds
    };
    // If proxy is configured in VSCode settings
    if (proxyUrl) {
        const parsedUrl = new url_1.default.URL(proxyUrl);
        axiosConfig.proxy = {
            host: parsedUrl.hostname,
            port: parseInt(parsedUrl.port),
            protocol: parsedUrl.protocol.replace(':', '')
        };
        console.log('Using proxy configuration:', axiosConfig.proxy);
    }
    // In some SSH environments, you might need to disable strict SSL
    if (vscode_1.default.workspace.getConfiguration('http').get('proxyStrictSSL') === false) {
        axiosConfig.httpsAgent = new https_1.default.Agent({
            rejectUnauthorized: false
        });
        console.log('SSL verification disabled');
    }
    return axios_1.default.create(axiosConfig);
}
// Function to create a properly configured axios instance
function createAutoCompleteAxiosInstance() {
    // Get VSCode's HTTP proxy settings
    const httpSettings = vscode_1.default.workspace.getConfiguration('http');
    const proxyUrl = httpSettings.get('proxy');
    // Debug info
    console.log('VSCode proxy settings:', proxyUrl);
    // Define the config with proper typing
    const axiosConfig = {
        baseURL: 'https://autocomplete.trysixth.com',
        timeout: 10000, // 10 seconds
    };
    // If proxy is configured in VSCode settings
    if (proxyUrl) {
        const parsedUrl = new url_1.default.URL(proxyUrl);
        axiosConfig.proxy = {
            host: parsedUrl.hostname,
            port: parseInt(parsedUrl.port),
            protocol: parsedUrl.protocol.replace(':', '')
        };
        console.log('Using proxy configuration:', axiosConfig.proxy);
    }
    // In some SSH environments, you might need to disable strict SSL
    if (vscode_1.default.workspace.getConfiguration('http').get('proxyStrictSSL') === false) {
        axiosConfig.httpsAgent = new https_1.default.Agent({
            rejectUnauthorized: false
        });
        console.log('SSL verification disabled');
    }
    return axios_1.default.create(axiosConfig);
}
//# sourceMappingURL=axiosInstance.js.map