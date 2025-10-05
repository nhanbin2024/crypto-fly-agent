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
exports.getCustomTextComponents = exports.areAllComponentsValid = exports.onManageTextComonentAction = void 0;
const ActionEnum_1 = require("../enum/ActionEnum");
const string_1 = require("../helpers/string");
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const constants_1 = require("../utils/constants");
const array_1 = require("../helpers/array");
const onManageTextComonentAction = async (action) => {
    switch (action) {
        case ActionEnum_1.ActionEnum.Add:
            return await onAddAction();
        case ActionEnum_1.ActionEnum.Remove:
            return await onRemoveAction();
    }
};
exports.onManageTextComonentAction = onManageTextComonentAction;
const onAddAction = async () => {
    // Add custom text components
    const existingComponents = (0, exports.getCustomTextComponents)();
    const userInput = await vscode.window.showInputBox({
        title: 'Add Custom Text Components to suppress warnings for',
        placeHolder: 'Eg: MyText, StyledText, CustomText',
        validateInput(value) {
            if (!value) {
                return 'You must enter at least one custom text component';
            }
            const components = value.trim().endsWith(',')
                ? value.trim().slice(0, -1).split(',')
                : value.trim().split(',');
            for (const component of components) {
                const trimmed = component.trim();
                if (!trimmed) {
                    return 'Component name cannot be empty';
                }
                if ((0, string_1.startsWithLowerCaseAlphabet)(trimmed)) {
                    return `Component name can only start with a capital alphabet or '_' or '$'`;
                }
                if (trimmed.includes(' ')) {
                    return `Component name cannot contain white spaces`;
                }
                if ((0, string_1.containsInvalidCharForComponent)(trimmed)) {
                    return `Component name can only contain alphabets, numbers, '_' and '$'`;
                }
                if (existingComponents.includes(trimmed)) {
                    return `Component "${trimmed}" already exists`;
                }
            }
            return null;
        },
        prompt: 'Enter your custom text components separated by a comma.',
        valueSelection: [0, 0],
    });
    if (userInput === undefined) {
        // User cancelled the input
        return false;
    }
    const customTextComponents = userInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    // Get the workspace folder for the current workspace
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open.');
        return false;
    }
    // Create .vscode directory if it doesn't exist
    const vscodeDirectory = path.join(workspaceFolder.uri.fsPath, constants_1.VSCodeDirs.vscode);
    if (!fs.existsSync(vscodeDirectory)) {
        fs.mkdirSync(vscodeDirectory);
    }
    // Create settings.json file if it doesn't exist
    const settingsJsonPath = path.join(vscodeDirectory, constants_1.VSCodeDirs.settingsJson);
    if (!fs.existsSync(settingsJsonPath)) {
        fs.writeFileSync(settingsJsonPath, '{}');
    }
    // Read settings.json file
    const settingsJson = fs.readFileSync(settingsJsonPath, 'utf8');
    const settings = JSON.parse(settingsJson);
    // Add custom text components to settings.json
    settings[constants_1.extensionSettings.customTextComponents] = (0, array_1.uniquedArray)([
        ...customTextComponents,
        ...existingComponents.filter((c) => c !== constants_1.DEFAULT_TEXT_COMPONENT),
    ]);
    // Write settings.json file
    fs.writeFileSync(settingsJsonPath, JSON.stringify(settings, null, 2));
    vscode.window.showInformationMessage('Successfully Added, You will no longer see warnings for these components.');
    return true;
};
const onRemoveAction = async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open.');
        return false;
    }
    const settingsJsonPath = path.join(workspaceFolder.uri.fsPath, constants_1.VSCodeDirs.vscode, constants_1.VSCodeDirs.settingsJson);
    if (!fs.existsSync(settingsJsonPath)) {
        vscode.window.showErrorMessage('No custom text components to remove.');
        return false;
    }
    const settingsJson = fs.readFileSync(settingsJsonPath, 'utf8');
    const settings = JSON.parse(settingsJson);
    const customTextComponents = settings[constants_1.extensionSettings.customTextComponents] || [];
    if (customTextComponents.length === 0 ||
        (customTextComponents.length === 1 &&
            customTextComponents[0] === constants_1.DEFAULT_TEXT_COMPONENT)) {
        vscode.window.showErrorMessage('No custom text components to remove.');
        return false;
    }
    const customTextComponentArray = (0, array_1.uniquedArray)((0, array_1.onlyStringArray)(customTextComponents)).filter((c) => c !== constants_1.DEFAULT_TEXT_COMPONENT);
    const componentToRemove = await vscode.window.showQuickPick(customTextComponentArray, {
        placeHolder: 'Select all the components that you want to remove',
        canPickMany: true,
        title: 'Remove Custom Text Components',
    });
    if (!componentToRemove) {
        // User cancelled component selection
        return false;
    }
    const updatedComponents = customTextComponentArray.filter((component) => !componentToRemove.includes(component));
    settings[constants_1.extensionSettings.customTextComponents] = updatedComponents;
    fs.writeFileSync(settingsJsonPath, JSON.stringify(settings, null, 2));
    vscode.window.showInformationMessage(`Removed "${componentToRemove}", You'll now see warnings for this component.`);
    return true;
};
const areAllComponentsValid = (components) => {
    for (const component of components) {
        if (!(0, string_1.startsWithCapitalAlphabet)(component)) {
            return false;
        }
    }
    return true;
};
exports.areAllComponentsValid = areAllComponentsValid;
const getCustomTextComponents = () => {
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return [constants_1.DEFAULT_TEXT_COMPONENT];
        }
        const settingsJsonPath = path.join(workspaceFolder.uri.fsPath, constants_1.VSCodeDirs.vscode, constants_1.VSCodeDirs.settingsJson);
        if (!fs.existsSync(settingsJsonPath)) {
            return [constants_1.DEFAULT_TEXT_COMPONENT];
        }
        const settingsJson = fs.readFileSync(settingsJsonPath, 'utf8');
        const settings = JSON.parse(settingsJson);
        const customTextComponents = settings[constants_1.extensionSettings.customTextComponents];
        if (!customTextComponents || !Array.isArray(customTextComponents)) {
            return [constants_1.DEFAULT_TEXT_COMPONENT];
        }
        const customTextComponentsArray = (0, array_1.uniquedArray)((0, array_1.onlyStringArray)(customTextComponents)).filter((c) => c !== constants_1.DEFAULT_TEXT_COMPONENT);
        if (!(0, exports.areAllComponentsValid)(customTextComponentsArray)) {
            return [constants_1.DEFAULT_TEXT_COMPONENT];
        }
        return [...customTextComponents, constants_1.DEFAULT_TEXT_COMPONENT];
    }
    catch (error) {
        return [constants_1.DEFAULT_TEXT_COMPONENT];
    }
};
exports.getCustomTextComponents = getCustomTextComponents;
//# sourceMappingURL=manageTextComponent.js.map