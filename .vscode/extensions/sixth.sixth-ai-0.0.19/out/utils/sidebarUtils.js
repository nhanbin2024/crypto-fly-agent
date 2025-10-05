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
exports.gptDiagnosticsToSideNav = gptDiagnosticsToSideNav;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
function gptDiagnosticsToSideNav(diags) {
    const workspace = vscode.workspace.workspaceFolders;
    const navigation = [];
    if (workspace) {
        const fileIcon = `<div style="marginRight:8px;"><svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 9V17.8C19 18.9201 19 19.4802 18.782 19.908C18.5903 20.2843 18.2843 20.5903 17.908 20.782C17.4802 21 16.9201 21 15.8 21H8.2C7.07989 21 6.51984 21 6.09202 20.782C5.71569 20.5903 5.40973 20.2843 5.21799 19.908C5 19.4802 5 18.9201 5 17.8V6.2C5 5.07989 5 4.51984 5.21799 4.09202C5.40973 3.71569 5.71569 3.40973 6.09202 3.21799C6.51984 3 7.0799 3 8.2 3H13M19 9L13 3M19 9H14C13.4477 9 13 8.55228 13 8V3" stroke="#8494A5" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
                    </svg></div>`;
        const codeIcon = `<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                         <path d="M7 8L3 11.6923L7 16M17 8L21 11.6923L17 16M14 4L10 20" stroke="#8494A5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>`;
        const groupedData = diags.reduce((acc, obj) => {
            const key = obj.fileName;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(obj);
            return acc;
        }, {});
        Object.keys(groupedData).forEach((key) => {
            const subNav = [];
            groupedData[key].forEach((item) => {
                subNav.push({
                    "name": `${item.funcName}`,
                    "icon": codeIcon,
                    "is_new": "",
                    "preview": "",
                    "normal_preview_icon": "",
                    "hover_preview_icon": "",
                    "is_tail": true,
                    onclick: `function onClick(){
                    vscode.postMessage({ command: 'fix_code', value: {
                        "funcName": ${item.funcName},
                        "fileName": ${item.fileName}
                    } });
                  }`,
                    fileName: item.fileName
                });
            });
            const nav_name = path.relative(workspace[0].uri.fsPath, key);
            if (!nav_name.endsWith("undefined")) {
                navigation.push({
                    nav_name: path.relative(workspace[0].uri.fsPath, key),
                    class_name: "fade_text",
                    sub_nav_for_nav: removeDuplicatesByKey(subNav, "name"),
                    is_tail: false,
                    icon: getFileIcon(nav_name),
                    open: `function ShowNav() {
                    const hidden_nav = document.getElementById("testnavistesting")
                    const hidden_nav_icon = document.getElementById("testnavistestingnav")
    
                    if (hidden_nav.style.display == "none") {
    
                        hidden_nav.style.display = "inline"
                        hidden_nav_icon.style.transform = 'rotate(180deg)'
    
                    }
                    else {
                        hidden_nav.style.display = "none"
                        hidden_nav_icon.style.transform = 'rotate(0deg)'
                    }
    
                }`,
                    "open_navIcon": `<svg width="24px" height="24px" fill="#8494A5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="0" fill="none" width="24" height="24"/>
                                    <g>
                                    <path d="M7 10l5 5 5-5"/>
                                    </g>
                                </svg>`,
                });
            }
        });
    }
    return navigation;
}
function removeDuplicatesByKey(arr, key) {
    const uniqueKeys = new Set();
    return arr.filter((obj) => {
        const keyValue = obj[key];
        if (!uniqueKeys.has(keyValue)) {
            uniqueKeys.add(keyValue);
            return true;
        }
        return false;
    });
}
function getFileIcon(fiileName) {
    if (fiileName.endsWith("go")) {
        return `<div style="marginRight:8px;"><?xml version="1.0" encoding="utf-8"?>
        <!-- Generator: Adobe Illustrator 22.1.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
        <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
             viewBox="0 0 254.5 225" style="enable-background:new 0 0 254.5 225; width: 24px; height: 24px" xml:space="preserve">
        <style type="text/css">
            .st0{fill:#2DBCAF;}
            .st1{fill:#5DC9E1;}
            .st2{fill:#FDDD00;}
            .st3{fill:#CE3262;}
            .st4{fill:#00ACD7;}
            .st5{fill:#FFFFFF;}
        </style>
        <g>
            <g>
                <g>
                    <g>
                        <path class="st4" d="M40.2,101.1c-0.4,0-0.5-0.2-0.3-0.5l2.1-2.7c0.2-0.3,0.7-0.5,1.1-0.5l35.7,0c0.4,0,0.5,0.3,0.3,0.6
                            l-1.7,2.6c-0.2,0.3-0.7,0.6-1,0.6L40.2,101.1z"/>
                    </g>
                </g>
            </g>
            <g>
                <g>
                    <g>
                        <path class="st4" d="M25.1,110.3c-0.4,0-0.5-0.2-0.3-0.5l2.1-2.7c0.2-0.3,0.7-0.5,1.1-0.5l45.6,0c0.4,0,0.6,0.3,0.5,0.6
                            l-0.8,2.4c-0.1,0.4-0.5,0.6-0.9,0.6L25.1,110.3z"/>
                    </g>
                </g>
            </g>
            <g>
                <g>
                    <g>
                        <path class="st4" d="M49.3,119.5c-0.4,0-0.5-0.3-0.3-0.6l1.4-2.5c0.2-0.3,0.6-0.6,1-0.6l20,0c0.4,0,0.6,0.3,0.6,0.7l-0.2,2.4
                            c0,0.4-0.4,0.7-0.7,0.7L49.3,119.5z"/>
                    </g>
                </g>
            </g>
            <g>
                <g id="CXHf1q_3_">
                    <g>
                        <g>
                            <path class="st4" d="M153.1,99.3c-6.3,1.6-10.6,2.8-16.8,4.4c-1.5,0.4-1.6,0.5-2.9-1c-1.5-1.7-2.6-2.8-4.7-3.8
                                c-6.3-3.1-12.4-2.2-18.1,1.5c-6.8,4.4-10.3,10.9-10.2,19c0.1,8,5.6,14.6,13.5,15.7c6.8,0.9,12.5-1.5,17-6.6
                                c0.9-1.1,1.7-2.3,2.7-3.7c-3.6,0-8.1,0-19.3,0c-2.1,0-2.6-1.3-1.9-3c1.3-3.1,3.7-8.3,5.1-10.9c0.3-0.6,1-1.6,2.5-1.6
                                c5.1,0,23.9,0,36.4,0c-0.2,2.7-0.2,5.4-0.6,8.1c-1.1,7.2-3.8,13.8-8.2,19.6c-7.2,9.5-16.6,15.4-28.5,17
                                c-9.8,1.3-18.9-0.6-26.9-6.6c-7.4-5.6-11.6-13-12.7-22.2c-1.3-10.9,1.9-20.7,8.5-29.3c7.1-9.3,16.5-15.2,28-17.3
                                c9.4-1.7,18.4-0.6,26.5,4.9c5.3,3.5,9.1,8.3,11.6,14.1C154.7,98.5,154.3,99,153.1,99.3z"/>
                        </g>
                        <g>
                            <path class="st4" d="M186.2,154.6c-9.1-0.2-17.4-2.8-24.4-8.8c-5.9-5.1-9.6-11.6-10.8-19.3c-1.8-11.3,1.3-21.3,8.1-30.2
                                c7.3-9.6,16.1-14.6,28-16.7c10.2-1.8,19.8-0.8,28.5,5.1c7.9,5.4,12.8,12.7,14.1,22.3c1.7,13.5-2.2,24.5-11.5,33.9
                                c-6.6,6.7-14.7,10.9-24,12.8C191.5,154.2,188.8,154.3,186.2,154.6z M210,114.2c-0.1-1.3-0.1-2.3-0.3-3.3
                                c-1.8-9.9-10.9-15.5-20.4-13.3c-9.3,2.1-15.3,8-17.5,17.4c-1.8,7.8,2,15.7,9.2,18.9c5.5,2.4,11,2.1,16.3-0.6
                                C205.2,129.2,209.5,122.8,210,114.2z"/>
                        </g>
                    </g>
                </g>
            </g>
        </g>
        </svg>
        </div>`;
    }
    else if (fiileName.endsWith("py")) {
        return `<div style="marginRight:8px;"><svg width="24px" height="24px" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M31.885 16c-8.124 0-7.617 3.523-7.617 3.523l.01 3.65h7.752v1.095H21.197S16 23.678 16 31.876c0 8.196 4.537 7.906 4.537 7.906h2.708v-3.804s-.146-4.537 4.465-4.537h7.688s4.32.07 4.32-4.175v-7.019S40.374 16 31.885 16zm-4.275 2.454c.771 0 1.395.624 1.395 1.395s-.624 1.395-1.395 1.395a1.393 1.393 0 0 1-1.395-1.395c0-.771.624-1.395 1.395-1.395z" fill="url(#a)"/><path d="M32.115 47.833c8.124 0 7.617-3.523 7.617-3.523l-.01-3.65H31.97v-1.095h10.832S48 40.155 48 31.958c0-8.197-4.537-7.906-4.537-7.906h-2.708v3.803s.146 4.537-4.465 4.537h-7.688s-4.32-.07-4.32 4.175v7.019s-.656 4.247 7.833 4.247zm4.275-2.454a1.393 1.393 0 0 1-1.395-1.395c0-.77.624-1.394 1.395-1.394s1.395.623 1.395 1.394c0 .772-.624 1.395-1.395 1.395z" fill="url(#b)"/><defs><linearGradient id="a" x1="19.075" y1="18.782" x2="34.898" y2="34.658" gradientUnits="userSpaceOnUse"><stop stop-color="#387EB8"/><stop offset="1" stop-color="#366994"/></linearGradient><linearGradient id="b" x1="28.809" y1="28.882" x2="45.803" y2="45.163" gradientUnits="userSpaceOnUse"><stop stop-color="#FFE052"/><stop offset="1" stop-color="#FFC331"/></linearGradient></defs></svg></div>`;
    }
    else if (fiileName.endsWith("js") || fiileName.endsWith("jsx")) {
        return `<div style="marginRight:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 1052 1052"><path fill="#f0db4f" d="M0 0h1052v1052H0z"/><path d="M965.9 801.1c-7.7-48-39-88.3-131.7-125.9-32.2-14.8-68.1-25.399-78.8-49.8-3.8-14.2-4.3-22.2-1.9-30.8 6.9-27.9 40.2-36.6 66.6-28.6 17 5.7 33.1 18.801 42.8 39.7 45.4-29.399 45.3-29.2 77-49.399-11.6-18-17.8-26.301-25.4-34-27.3-30.5-64.5-46.2-124-45-10.3 1.3-20.699 2.699-31 4-29.699 7.5-58 23.1-74.6 44-49.8 56.5-35.6 155.399 25 196.1 59.7 44.8 147.4 55 158.6 96.9 10.9 51.3-37.699 67.899-86 62-35.6-7.4-55.399-25.5-76.8-58.4-39.399 22.8-39.399 22.8-79.899 46.1 9.6 21 19.699 30.5 35.8 48.7 76.2 77.3 266.899 73.5 301.1-43.5 1.399-4.001 10.6-30.801 3.199-72.101zm-394-317.6h-98.4c0 85-.399 169.4-.399 254.4 0 54.1 2.8 103.7-6 118.9-14.4 29.899-51.7 26.2-68.7 20.399-17.3-8.5-26.1-20.6-36.3-37.699-2.8-4.9-4.9-8.7-5.601-9-26.699 16.3-53.3 32.699-80 49 13.301 27.3 32.9 51 58 66.399 37.5 22.5 87.9 29.4 140.601 17.3 34.3-10 63.899-30.699 79.399-62.199 22.4-41.3 17.6-91.3 17.4-146.6.5-90.2 0-180.4 0-270.9z" fill="#323330"/></svg></div>`;
    }
    else if (fiileName.endsWith("ts") || fiileName.endsWith("tsx")) {
        return `<div style="marginRight:8px;"><svg width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#0977ec" stroke="#0977ec">
        <g id="SVGRepo_bgCarrier" stroke-width="0"/>
        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
        <g id="SVGRepo_iconCarrier"> <title>language_typescript</title> <rect width="24" height="24" fill="none"/> <path d="M3,3H21V21H3V3M13.71,17.86a3.26,3.26,0,0,0,3.09,1.73c1.6,0,2.8-.83,2.8-2.36s-.81-2-2.25-2.66l-.42-.18c-.73-.31-1-.52-1-1a.74.74,0,0,1,.81-.73,1.16,1.16,0,0,1,1.09.73l1.31-.87a2.5,2.5,0,0,0-2.4-1.33,2.26,2.26,0,0,0-2.48,2.23c0,1.38.81,2,2,2.55l.42.18c.78.34,1.24.55,1.24,1.13s-.45.83-1.15.83a1.83,1.83,0,0,1-1.67-1l-1.38.8M13,11.25H8v1.5H9.5V20h1.75V12.75H13Z"/> </g>
        </svg></div>`;
    }
    else if (fiileName.endsWith("php") || fiileName.endsWith("php3") || fiileName.endsWith("php4") || fiileName.endsWith("php5")) {
        return `
        <div style="marginRight:8px;"><svg width="24px" height="24px" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="#8892BF"/>
        <path d="M14.4392 10H16.1192L15.6444 12.5242H17.154C17.9819 12.5419 18.5986 12.7269 19.0045 13.0793C19.4184 13.4316 19.5402 14.1014 19.3698 15.0881L18.5541 19.4889H16.8497L17.6288 15.2863C17.7099 14.8457 17.6856 14.533 17.5558 14.348C17.426 14.163 17.146 14.0705 16.7158 14.0705L15.3644 14.0573L14.3661 19.4889H12.6861L14.4392 10Z" fill="white"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M6.74092 12.5243H10.0036C10.9612 12.533 11.6552 12.8327 12.0854 13.4229C12.5156 14.0132 12.6576 14.8193 12.5115 15.8414C12.4548 16.3085 12.3289 16.7665 12.1341 17.2159C11.9474 17.6652 11.6878 18.0704 11.355 18.4317C10.9491 18.8898 10.5149 19.1805 10.0523 19.304C9.58969 19.4274 9.11076 19.489 8.61575 19.489H7.15484L6.69222 22H5L6.74092 12.5243ZM7.43485 17.9956L8.16287 14.0441H8.40879C8.49815 14.0441 8.5914 14.0396 8.6888 14.0309C9.33817 14.0221 9.87774 14.0882 10.308 14.2291C10.7462 14.37 10.8923 14.9031 10.7462 15.8282C10.5678 16.9296 10.2186 17.5727 9.69926 17.7577C9.1799 17.934 8.53053 18.0176 7.75138 18.0088H7.58094C7.53224 18.0088 7.48355 18.0043 7.43485 17.9956Z" fill="white"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M24.4365 12.5243H21.1738L19.4329 22H21.1251L21.5878 19.489H23.0487C23.5437 19.489 24.0226 19.4274 24.4852 19.304C24.9479 19.1805 25.382 18.8898 25.7879 18.4317C26.1207 18.0704 26.3803 17.6652 26.567 17.2159C26.7618 16.7665 26.8877 16.3085 26.9444 15.8414C27.0905 14.8193 26.9486 14.0132 26.5183 13.4229C26.0881 12.8327 25.3942 12.533 24.4365 12.5243ZM22.5958 14.0441L21.8678 17.9956C21.9165 18.0043 21.9652 18.0088 22.0139 18.0088H22.1843C22.9635 18.0176 23.6128 17.934 24.1322 17.7577C24.6515 17.5727 25.0007 16.9296 25.1792 15.8282C25.3253 14.9031 25.1792 14.37 24.7409 14.2291C24.3107 14.0882 23.7711 14.0221 23.1217 14.0309C23.0243 14.0396 22.9311 14.0441 22.8417 14.0441H22.5958Z" fill="white"/>
        </svg></div>`;
    }
    else {
        return `<div style="marginRight:8px;"><svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 9V17.8C19 18.9201 19 19.4802 18.782 19.908C18.5903 20.2843 18.2843 20.5903 17.908 20.782C17.4802 21 16.9201 21 15.8 21H8.2C7.07989 21 6.51984 21 6.09202 20.782C5.71569 20.5903 5.40973 20.2843 5.21799 19.908C5 19.4802 5 18.9201 5 17.8V6.2C5 5.07989 5 4.51984 5.21799 4.09202C5.40973 3.71569 5.71569 3.40973 6.09202 3.21799C6.51984 3 7.0799 3 8.2 3H13M19 9L13 3M19 9H14C13.4477 9 13 8.55228 13 8V3" stroke="#8494A5" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
                        </svg></div>`;
    }
}
function extractPath(absolutePath) {
    var res = "";
    try {
        const pathSegments = absolutePath.split(path.sep);
        // Extract the last two segments
        res = pathSegments.slice(-2).join(path.sep);
    }
    catch (e) {
    }
    return res;
}
//# sourceMappingURL=sidebarUtils.js.map