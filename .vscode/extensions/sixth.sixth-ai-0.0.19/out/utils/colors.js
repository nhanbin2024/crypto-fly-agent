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
exports.getThemeName = getThemeName;
exports.getThemeColors = getThemeColors;
const vscode = __importStar(require("vscode"));
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs"));
const json5_1 = __importDefault(require("json5"));
const DarkModern = {
    "$schema": "vscode://schemas/color-theme",
    "name": "Default Dark Modern",
    "include": "./dark_plus.json",
    "colors": {
        "activityBar.activeBorder": "#0078D4",
        "activityBar.background": "#181818",
        "activityBar.border": "#2B2B2B",
        "activityBar.foreground": "#D7D7D7",
        "activityBar.inactiveForeground": "#868686",
        "activityBarBadge.background": "#0078D4",
        "activityBarBadge.foreground": "#FFFFFF",
        "badge.background": "#616161",
        "badge.foreground": "#F8F8F8",
        "button.background": "#0078D4",
        "button.border": "#FFFFFF12",
        "button.foreground": "#FFFFFF",
        "button.hoverBackground": "#026EC1",
        "button.secondaryBackground": "#313131",
        "button.secondaryForeground": "#CCCCCC",
        "button.secondaryHoverBackground": "#3C3C3C",
        "chat.slashCommandBackground": "#34414B",
        "chat.slashCommandForeground": "#40A6FF",
        "chat.editedFileForeground": "#E2C08D",
        "checkbox.background": "#313131",
        "checkbox.border": "#3C3C3C",
        "debugToolBar.background": "#181818",
        "descriptionForeground": "#9D9D9D",
        "dropdown.background": "#313131",
        "dropdown.border": "#3C3C3C",
        "dropdown.foreground": "#CCCCCC",
        "dropdown.listBackground": "#1F1F1F",
        "editor.background": "#1F1F1F",
        "editor.findMatchBackground": "#9E6A03",
        "editor.foreground": "#CCCCCC",
        "editorGroup.border": "#FFFFFF17",
        "editorGroupHeader.tabsBackground": "#181818",
        "editorGroupHeader.tabsBorder": "#2B2B2B",
        "editorGutter.addedBackground": "#2EA043",
        "editorGutter.deletedBackground": "#F85149",
        "editorGutter.modifiedBackground": "#0078D4",
        "editorLineNumber.activeForeground": "#CCCCCC",
        "editorLineNumber.foreground": "#6E7681",
        "editorOverviewRuler.border": "#010409",
        "editorWidget.background": "#202020",
        "errorForeground": "#F85149",
        "focusBorder": "#0078D4",
        "foreground": "#CCCCCC",
        "icon.foreground": "#CCCCCC",
        "input.background": "#313131",
        "input.border": "#3C3C3C",
        "input.foreground": "#CCCCCC",
        "input.placeholderForeground": "#989898",
        "inputOption.activeBackground": "#2489DB82",
        "inputOption.activeBorder": "#2488DB",
        "keybindingLabel.foreground": "#CCCCCC",
        "menu.background": "#1F1F1F",
        "menu.selectionBackground": "#0078d4",
        "notificationCenterHeader.background": "#1F1F1F",
        "notificationCenterHeader.foreground": "#CCCCCC",
        "notifications.background": "#1F1F1F",
        "notifications.border": "#2B2B2B",
        "notifications.foreground": "#CCCCCC",
        "panel.background": "#181818",
        "panel.border": "#2B2B2B",
        "panelInput.border": "#2B2B2B",
        "panelTitle.activeBorder": "#0078D4",
        "panelTitle.activeForeground": "#CCCCCC",
        "panelTitle.inactiveForeground": "#9D9D9D",
        "peekViewEditor.background": "#1F1F1F",
        "peekViewEditor.matchHighlightBackground": "#BB800966",
        "peekViewResult.background": "#1F1F1F",
        "peekViewResult.matchHighlightBackground": "#BB800966",
        "pickerGroup.border": "#3C3C3C",
        "progressBar.background": "#0078D4",
        "quickInput.background": "#222222",
        "quickInput.foreground": "#CCCCCC",
        "settings.dropdownBackground": "#313131",
        "settings.dropdownBorder": "#3C3C3C",
        "settings.headerForeground": "#FFFFFF",
        "settings.modifiedItemIndicator": "#BB800966",
        "sideBar.background": "#181818",
        "sideBar.border": "#2B2B2B",
        "sideBar.foreground": "#CCCCCC",
        "sideBarSectionHeader.background": "#181818",
        "sideBarSectionHeader.border": "#2B2B2B",
        "sideBarSectionHeader.foreground": "#CCCCCC",
        "sideBarTitle.foreground": "#CCCCCC",
        "statusBar.background": "#181818",
        "statusBar.border": "#2B2B2B",
        "statusBar.debuggingBackground": "#0078D4",
        "statusBar.debuggingForeground": "#FFFFFF",
        "statusBar.focusBorder": "#0078D4",
        "statusBar.foreground": "#CCCCCC",
        "statusBar.noFolderBackground": "#1F1F1F",
        "statusBarItem.focusBorder": "#0078D4",
        "statusBarItem.prominentBackground": "#6E768166",
        "statusBarItem.remoteBackground": "#0078D4",
        "statusBarItem.remoteForeground": "#FFFFFF",
        "tab.activeBackground": "#1F1F1F",
        "tab.activeBorder": "#1F1F1F",
        "tab.activeBorderTop": "#0078D4",
        "tab.activeForeground": "#FFFFFF",
        "tab.selectedBorderTop": "#6caddf",
        "tab.border": "#2B2B2B",
        "tab.hoverBackground": "#1F1F1F",
        "tab.inactiveBackground": "#181818",
        "tab.inactiveForeground": "#9D9D9D",
        "tab.unfocusedActiveBorder": "#1F1F1F",
        "tab.unfocusedActiveBorderTop": "#2B2B2B",
        "tab.unfocusedHoverBackground": "#1F1F1F",
        "terminal.foreground": "#CCCCCC",
        "terminal.tab.activeBorder": "#0078D4",
        "textBlockQuote.background": "#2B2B2B",
        "textBlockQuote.border": "#616161",
        "textCodeBlock.background": "#2B2B2B",
        "textLink.activeForeground": "#4daafc",
        "textLink.foreground": "#4daafc",
        "textPreformat.foreground": "#D0D0D0",
        "textPreformat.background": "#3C3C3C",
        "textSeparator.foreground": "#21262D",
        "titleBar.activeBackground": "#181818",
        "titleBar.activeForeground": "#CCCCCC",
        "titleBar.border": "#2B2B2B",
        "titleBar.inactiveBackground": "#1F1F1F",
        "titleBar.inactiveForeground": "#9D9D9D",
        "welcomePage.tileBackground": "#2B2B2B",
        "welcomePage.progress.foreground": "#0078D4",
        "widget.border": "#313131",
    },
    "tokenColors": [
        {
            "scope": [
                "meta.embedded",
                "source.groovy.embedded",
                "string meta.image.inline.markdown",
                "variable.legacy.builtin.python"
            ],
            "settings": {
                "foreground": "#D4D4D4"
            }
        },
        {
            "scope": "emphasis",
            "settings": {
                "fontStyle": "italic"
            }
        },
        {
            "scope": "strong",
            "settings": {
                "fontStyle": "bold"
            }
        },
        {
            "scope": "header",
            "settings": {
                "foreground": "#000080"
            }
        },
        {
            "scope": "comment",
            "settings": {
                "foreground": "#6A9955"
            }
        },
        {
            "scope": "constant.language",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": [
                "constant.numeric",
                "variable.other.enummember",
                "keyword.operator.plus.exponent",
                "keyword.operator.minus.exponent"
            ],
            "settings": {
                "foreground": "#b5cea8"
            }
        },
        {
            "scope": "constant.regexp",
            "settings": {
                "foreground": "#646695"
            }
        },
        {
            "scope": "entity.name.tag",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": [
                "entity.name.tag.css",
                "entity.name.tag.less"
            ],
            "settings": {
                "foreground": "#d7ba7d"
            }
        },
        {
            "scope": "entity.other.attribute-name",
            "settings": {
                "foreground": "#9cdcfe"
            }
        },
        {
            "scope": [
                "entity.other.attribute-name.class.css",
                "source.css entity.other.attribute-name.class",
                "entity.other.attribute-name.id.css",
                "entity.other.attribute-name.parent-selector.css",
                "entity.other.attribute-name.parent.less",
                "source.css entity.other.attribute-name.pseudo-class",
                "entity.other.attribute-name.pseudo-element.css",
                "source.css.less entity.other.attribute-name.id",
                "entity.other.attribute-name.scss"
            ],
            "settings": {
                "foreground": "#d7ba7d"
            }
        },
        {
            "scope": "invalid",
            "settings": {
                "foreground": "#f44747"
            }
        },
        {
            "scope": "markup.underline",
            "settings": {
                "fontStyle": "underline"
            }
        },
        {
            "scope": "markup.bold",
            "settings": {
                "fontStyle": "bold",
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "markup.heading",
            "settings": {
                "fontStyle": "bold",
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "markup.italic",
            "settings": {
                "fontStyle": "italic"
            }
        },
        {
            "scope": "markup.strikethrough",
            "settings": {
                "fontStyle": "strikethrough"
            }
        },
        {
            "scope": "markup.inserted",
            "settings": {
                "foreground": "#b5cea8"
            }
        },
        {
            "scope": "markup.deleted",
            "settings": {
                "foreground": "#ce9178"
            }
        },
        {
            "scope": "markup.changed",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "punctuation.definition.quote.begin.markdown",
            "settings": {
                "foreground": "#6A9955"
            }
        },
        {
            "scope": "punctuation.definition.list.begin.markdown",
            "settings": {
                "foreground": "#6796e6"
            }
        },
        {
            "scope": "markup.inline.raw",
            "settings": {
                "foreground": "#ce9178"
            }
        },
        {
            "name": "brackets of XML/HTML tags",
            "scope": "punctuation.definition.tag",
            "settings": {
                "foreground": "#808080"
            }
        },
        {
            "scope": [
                "meta.preprocessor",
                "entity.name.function.preprocessor"
            ],
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "meta.preprocessor.string",
            "settings": {
                "foreground": "#ce9178"
            }
        },
        {
            "scope": "meta.preprocessor.numeric",
            "settings": {
                "foreground": "#b5cea8"
            }
        },
        {
            "scope": "meta.structure.dictionary.key.python",
            "settings": {
                "foreground": "#9cdcfe"
            }
        },
        {
            "scope": "meta.diff.header",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "storage",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "storage.type",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": [
                "storage.modifier",
                "keyword.operator.noexcept"
            ],
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": [
                "string",
                "meta.embedded.assembly"
            ],
            "settings": {
                "foreground": "#ce9178"
            }
        },
        {
            "scope": "string.tag",
            "settings": {
                "foreground": "#ce9178"
            }
        },
        {
            "scope": "string.value",
            "settings": {
                "foreground": "#ce9178"
            }
        },
        {
            "scope": "string.regexp",
            "settings": {
                "foreground": "#d16969"
            }
        },
        {
            "name": "String interpolation",
            "scope": [
                "punctuation.definition.template-expression.begin",
                "punctuation.definition.template-expression.end",
                "punctuation.section.embedded"
            ],
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "name": "Reset JavaScript string interpolation expression",
            "scope": [
                "meta.template.expression"
            ],
            "settings": {
                "foreground": "#d4d4d4"
            }
        },
        {
            "scope": [
                "support.type.vendored.property-name",
                "support.type.property-name",
                "source.css variable",
                "source.coffee.embedded"
            ],
            "settings": {
                "foreground": "#9cdcfe"
            }
        },
        {
            "scope": "keyword",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "keyword.control",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "keyword.operator",
            "settings": {
                "foreground": "#d4d4d4"
            }
        },
        {
            "scope": [
                "keyword.operator.new",
                "keyword.operator.expression",
                "keyword.operator.cast",
                "keyword.operator.sizeof",
                "keyword.operator.alignof",
                "keyword.operator.typeid",
                "keyword.operator.alignas",
                "keyword.operator.instanceof",
                "keyword.operator.logical.python",
                "keyword.operator.wordlike"
            ],
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "keyword.other.unit",
            "settings": {
                "foreground": "#b5cea8"
            }
        },
        {
            "scope": [
                "punctuation.section.embedded.begin.php",
                "punctuation.section.embedded.end.php"
            ],
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "support.function.git-rebase",
            "settings": {
                "foreground": "#9cdcfe"
            }
        },
        {
            "scope": "constant.sha.git-rebase",
            "settings": {
                "foreground": "#b5cea8"
            }
        },
        {
            "name": "coloring of the Java import and package identifiers",
            "scope": [
                "storage.modifier.import.java",
                "variable.language.wildcard.java",
                "storage.modifier.package.java"
            ],
            "settings": {
                "foreground": "#d4d4d4"
            }
        },
        {
            "name": "this.self",
            "scope": "variable.language",
            "settings": {
                "foreground": "#569cd6"
            }
        }
    ],
    "semanticHighlighting": true,
    "semanticTokenColors": {
        "newOperator": "#d4d4d4",
        "stringLiteral": "#ce9178",
        "customLiteral": "#D4D4D4",
        "numberLiteral": "#b5cea8",
    }
};
const DarkPlus = {
    "$schema": "vscode://schemas/color-theme",
    "name": "Dark+",
    "include": "./dark_vs.json",
    "colors": {
        "checkbox.border": "#6B6B6B",
        "editor.background": "#1E1E1E",
        "editor.foreground": "#D4D4D4",
        "editor.inactiveSelectionBackground": "#3A3D41",
        "editorIndentGuide.background1": "#404040",
        "editorIndentGuide.activeBackground1": "#707070",
        "editor.selectionHighlightBackground": "#ADD6FF26",
        "list.dropBackground": "#383B3D",
        "activityBarBadge.background": "#007ACC",
        "sideBarTitle.foreground": "#BBBBBB",
        "input.placeholderForeground": "#A6A6A6",
        "menu.background": "#252526",
        "menu.foreground": "#CCCCCC",
        "menu.separatorBackground": "#454545",
        "menu.border": "#454545",
        "menu.selectionBackground": "#0078d4",
        "statusBarItem.remoteForeground": "#FFF",
        "statusBarItem.remoteBackground": "#16825D",
        "ports.iconRunningProcessForeground": "#369432",
        "sideBarSectionHeader.background": "#0000",
        "sideBarSectionHeader.border": "#ccc3",
        "tab.selectedBackground": "#222222",
        "tab.selectedForeground": "#ffffffa0",
        "tab.lastPinnedBorder": "#ccc3",
        "list.activeSelectionIconForeground": "#FFF",
        "terminal.inactiveSelectionBackground": "#3A3D41",
        "widget.border": "#303031",
        "actionBar.toggledBackground": "#383a49"
    },
    "tokenColors": [
        {
            "name": "Function declarations",
            "scope": [
                "entity.name.function",
                "support.function",
                "support.constant.handlebars",
                "source.powershell variable.other.member",
                "entity.name.operator.custom-literal" // See https://en.cppreference.com/w/cpp/language/user_literal
            ],
            "settings": {
                "foreground": "#DCDCAA"
            }
        },
        {
            "name": "Types declaration and references",
            "scope": [
                "support.class",
                "support.type",
                "entity.name.type",
                "entity.name.namespace",
                "entity.other.attribute",
                "entity.name.scope-resolution",
                "entity.name.class",
                "storage.type.numeric.go",
                "storage.type.byte.go",
                "storage.type.boolean.go",
                "storage.type.string.go",
                "storage.type.uintptr.go",
                "storage.type.error.go",
                "storage.type.rune.go",
                "storage.type.cs",
                "storage.type.generic.cs",
                "storage.type.modifier.cs",
                "storage.type.variable.cs",
                "storage.type.annotation.java",
                "storage.type.generic.java",
                "storage.type.java",
                "storage.type.object.array.java",
                "storage.type.primitive.array.java",
                "storage.type.primitive.java",
                "storage.type.token.java",
                "storage.type.groovy",
                "storage.type.annotation.groovy",
                "storage.type.parameters.groovy",
                "storage.type.generic.groovy",
                "storage.type.object.array.groovy",
                "storage.type.primitive.array.groovy",
                "storage.type.primitive.groovy"
            ],
            "settings": {
                "foreground": "#4EC9B0"
            }
        },
        {
            "name": "Types declaration and references, TS grammar specific",
            "scope": [
                "meta.type.cast.expr",
                "meta.type.new.expr",
                "support.constant.math",
                "support.constant.dom",
                "support.constant.json",
                "entity.other.inherited-class",
                "punctuation.separator.namespace.ruby"
            ],
            "settings": {
                "foreground": "#4EC9B0"
            }
        },
        {
            "name": "Control flow / Special keywords",
            "scope": [
                "keyword.control",
                "source.cpp keyword.operator.new",
                "keyword.operator.delete",
                "keyword.other.using",
                "keyword.other.directive.using",
                "keyword.other.operator",
                "entity.name.operator"
            ],
            "settings": {
                "foreground": "#C586C0"
            }
        },
        {
            "name": "Variable and parameter name",
            "scope": [
                "variable",
                "meta.definition.variable.name",
                "support.variable",
                "entity.name.variable",
                "constant.other.placeholder", // placeholders in strings
            ],
            "settings": {
                "foreground": "#9CDCFE"
            }
        },
        {
            "name": "Constants and enums",
            "scope": [
                "variable.other.constant",
                "variable.other.enummember"
            ],
            "settings": {
                "foreground": "#4FC1FF",
            }
        },
        {
            "name": "Object keys, TS grammar specific",
            "scope": [
                "meta.object-literal.key"
            ],
            "settings": {
                "foreground": "#9CDCFE"
            }
        },
        {
            "name": "CSS property value",
            "scope": [
                "support.constant.property-value",
                "support.constant.font-name",
                "support.constant.media-type",
                "support.constant.media",
                "constant.other.color.rgb-value",
                "constant.other.rgb-value",
                "support.constant.color"
            ],
            "settings": {
                "foreground": "#CE9178"
            }
        },
        {
            "name": "Regular expression groups",
            "scope": [
                "punctuation.definition.group.regexp",
                "punctuation.definition.group.assertion.regexp",
                "punctuation.definition.character-class.regexp",
                "punctuation.character.set.begin.regexp",
                "punctuation.character.set.end.regexp",
                "keyword.operator.negation.regexp",
                "support.other.parenthesis.regexp"
            ],
            "settings": {
                "foreground": "#CE9178"
            }
        },
        {
            "scope": [
                "constant.character.character-class.regexp",
                "constant.other.character-class.set.regexp",
                "constant.other.character-class.regexp",
                "constant.character.set.regexp"
            ],
            "settings": {
                "foreground": "#d16969"
            }
        },
        {
            "scope": [
                "keyword.operator.or.regexp",
                "keyword.control.anchor.regexp"
            ],
            "settings": {
                "foreground": "#DCDCAA"
            }
        },
        {
            "scope": "keyword.operator.quantifier.regexp",
            "settings": {
                "foreground": "#d7ba7d"
            }
        },
        {
            "scope": [
                "constant.character",
                "constant.other.option"
            ],
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "constant.character.escape",
            "settings": {
                "foreground": "#d7ba7d"
            }
        },
        {
            "scope": "entity.name.label",
            "settings": {
                "foreground": "#C8C8C8"
            }
        }
    ],
    "semanticTokenColors": {
        "newOperator": "#C586C0",
        "stringLiteral": "#ce9178",
        "customLiteral": "#DCDCAA",
        "numberLiteral": "#b5cea8",
    }
};
const DarkVS = {
    "$schema": "vscode://schemas/color-theme",
    "name": "Dark (Visual Studio)",
    "colors": {
        "checkbox.border": "#6B6B6B",
        "editor.background": "#1E1E1E",
        "editor.foreground": "#D4D4D4",
        "editor.inactiveSelectionBackground": "#3A3D41",
        "editorIndentGuide.background1": "#404040",
        "editorIndentGuide.activeBackground1": "#707070",
        "editor.selectionHighlightBackground": "#ADD6FF26",
        "list.dropBackground": "#383B3D",
        "activityBarBadge.background": "#007ACC",
        "sideBarTitle.foreground": "#BBBBBB",
        "input.placeholderForeground": "#A6A6A6",
        "menu.background": "#252526",
        "menu.foreground": "#CCCCCC",
        "menu.separatorBackground": "#454545",
        "menu.border": "#454545",
        "menu.selectionBackground": "#0078d4",
        "statusBarItem.remoteForeground": "#FFF",
        "statusBarItem.remoteBackground": "#16825D",
        "ports.iconRunningProcessForeground": "#369432",
        "sideBarSectionHeader.background": "#0000",
        "sideBarSectionHeader.border": "#ccc3",
        "tab.selectedBackground": "#222222",
        "tab.selectedForeground": "#ffffffa0",
        "tab.lastPinnedBorder": "#ccc3",
        "list.activeSelectionIconForeground": "#FFF",
        "terminal.inactiveSelectionBackground": "#3A3D41",
        "widget.border": "#303031",
        "actionBar.toggledBackground": "#383a49"
    },
    "tokenColors": [
        {
            "scope": [
                "meta.embedded",
                "source.groovy.embedded",
                "string meta.image.inline.markdown",
                "variable.legacy.builtin.python"
            ],
            "settings": {
                "foreground": "#D4D4D4"
            }
        },
        {
            "scope": "emphasis",
            "settings": {
                "fontStyle": "italic"
            }
        },
        {
            "scope": "strong",
            "settings": {
                "fontStyle": "bold"
            }
        },
        {
            "scope": "header",
            "settings": {
                "foreground": "#000080"
            }
        },
        {
            "scope": "comment",
            "settings": {
                "foreground": "#6A9955"
            }
        },
        {
            "scope": "constant.language",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": [
                "constant.numeric",
                "variable.other.enummember",
                "keyword.operator.plus.exponent",
                "keyword.operator.minus.exponent"
            ],
            "settings": {
                "foreground": "#b5cea8"
            }
        },
        {
            "scope": "constant.regexp",
            "settings": {
                "foreground": "#646695"
            }
        },
        {
            "scope": "entity.name.tag",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": [
                "entity.name.tag.css",
                "entity.name.tag.less"
            ],
            "settings": {
                "foreground": "#d7ba7d"
            }
        },
        {
            "scope": "entity.other.attribute-name",
            "settings": {
                "foreground": "#9cdcfe"
            }
        },
        {
            "scope": [
                "entity.other.attribute-name.class.css",
                "source.css entity.other.attribute-name.class",
                "entity.other.attribute-name.id.css",
                "entity.other.attribute-name.parent-selector.css",
                "entity.other.attribute-name.parent.less",
                "source.css entity.other.attribute-name.pseudo-class",
                "entity.other.attribute-name.pseudo-element.css",
                "source.css.less entity.other.attribute-name.id",
                "entity.other.attribute-name.scss"
            ],
            "settings": {
                "foreground": "#d7ba7d"
            }
        },
        {
            "scope": "invalid",
            "settings": {
                "foreground": "#f44747"
            }
        },
        {
            "scope": "markup.underline",
            "settings": {
                "fontStyle": "underline"
            }
        },
        {
            "scope": "markup.bold",
            "settings": {
                "fontStyle": "bold",
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "markup.heading",
            "settings": {
                "fontStyle": "bold",
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "markup.italic",
            "settings": {
                "fontStyle": "italic"
            }
        },
        {
            "scope": "markup.strikethrough",
            "settings": {
                "fontStyle": "strikethrough"
            }
        },
        {
            "scope": "markup.inserted",
            "settings": {
                "foreground": "#b5cea8"
            }
        },
        {
            "scope": "markup.deleted",
            "settings": {
                "foreground": "#ce9178"
            }
        },
        {
            "scope": "markup.changed",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "punctuation.definition.quote.begin.markdown",
            "settings": {
                "foreground": "#6A9955"
            }
        },
        {
            "scope": "punctuation.definition.list.begin.markdown",
            "settings": {
                "foreground": "#6796e6"
            }
        },
        {
            "scope": "markup.inline.raw",
            "settings": {
                "foreground": "#ce9178"
            }
        },
        {
            "name": "brackets of XML/HTML tags",
            "scope": "punctuation.definition.tag",
            "settings": {
                "foreground": "#808080"
            }
        },
        {
            "scope": [
                "meta.preprocessor",
                "entity.name.function.preprocessor"
            ],
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "meta.preprocessor.string",
            "settings": {
                "foreground": "#ce9178"
            }
        },
        {
            "scope": "meta.preprocessor.numeric",
            "settings": {
                "foreground": "#b5cea8"
            }
        },
        {
            "scope": "meta.structure.dictionary.key.python",
            "settings": {
                "foreground": "#9cdcfe"
            }
        },
        {
            "scope": "meta.diff.header",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "storage",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "storage.type",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": [
                "storage.modifier",
                "keyword.operator.noexcept"
            ],
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": [
                "string",
                "meta.embedded.assembly"
            ],
            "settings": {
                "foreground": "#ce9178"
            }
        },
        {
            "scope": "string.tag",
            "settings": {
                "foreground": "#ce9178"
            }
        },
        {
            "scope": "string.value",
            "settings": {
                "foreground": "#ce9178"
            }
        },
        {
            "scope": "string.regexp",
            "settings": {
                "foreground": "#d16969"
            }
        },
        {
            "name": "String interpolation",
            "scope": [
                "punctuation.definition.template-expression.begin",
                "punctuation.definition.template-expression.end",
                "punctuation.section.embedded"
            ],
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "name": "Reset JavaScript string interpolation expression",
            "scope": [
                "meta.template.expression"
            ],
            "settings": {
                "foreground": "#d4d4d4"
            }
        },
        {
            "scope": [
                "support.type.vendored.property-name",
                "support.type.property-name",
                "source.css variable",
                "source.coffee.embedded"
            ],
            "settings": {
                "foreground": "#9cdcfe"
            }
        },
        {
            "scope": "keyword",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "keyword.control",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "keyword.operator",
            "settings": {
                "foreground": "#d4d4d4"
            }
        },
        {
            "scope": [
                "keyword.operator.new",
                "keyword.operator.expression",
                "keyword.operator.cast",
                "keyword.operator.sizeof",
                "keyword.operator.alignof",
                "keyword.operator.typeid",
                "keyword.operator.alignas",
                "keyword.operator.instanceof",
                "keyword.operator.logical.python",
                "keyword.operator.wordlike"
            ],
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "keyword.other.unit",
            "settings": {
                "foreground": "#b5cea8"
            }
        },
        {
            "scope": [
                "punctuation.section.embedded.begin.php",
                "punctuation.section.embedded.end.php"
            ],
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "support.function.git-rebase",
            "settings": {
                "foreground": "#9cdcfe"
            }
        },
        {
            "scope": "constant.sha.git-rebase",
            "settings": {
                "foreground": "#b5cea8"
            }
        },
        {
            "name": "coloring of the Java import and package identifiers",
            "scope": [
                "storage.modifier.import.java",
                "variable.language.wildcard.java",
                "storage.modifier.package.java"
            ],
            "settings": {
                "foreground": "#d4d4d4"
            }
        },
        {
            "name": "this.self",
            "scope": "variable.language",
            "settings": {
                "foreground": "#569cd6"
            }
        }
    ],
    "semanticHighlighting": true,
    "semanticTokenColors": {
        "newOperator": "#d4d4d4",
        "stringLiteral": "#ce9178",
        "customLiteral": "#D4D4D4",
        "numberLiteral": "#b5cea8",
    }
};
const HCBLACK = {
    "$schema": "vscode://schemas/color-theme",
    "name": "Dark High Contrast",
    "colors": {
        "editor.background": "#000000",
        "editor.foreground": "#FFFFFF",
        "editorIndentGuide.background1": "#FFFFFF",
        "editorIndentGuide.activeBackground1": "#FFFFFF",
        "sideBarTitle.foreground": "#FFFFFF",
        "selection.background": "#008000",
        "editor.selectionBackground": "#FFFFFF",
        "statusBarItem.remoteBackground": "#00000000",
        "ports.iconRunningProcessForeground": "#FFFFFF",
        "editorWhitespace.foreground": "#7c7c7c",
        "actionBar.toggledBackground": "#383a49"
    },
    "tokenColors": [
        {
            "scope": [
                "meta.embedded",
                "source.groovy.embedded",
                "string meta.image.inline.markdown",
                "variable.legacy.builtin.python"
            ],
            "settings": {
                "foreground": "#FFFFFF"
            }
        },
        {
            "scope": "emphasis",
            "settings": {
                "fontStyle": "italic"
            }
        },
        {
            "scope": "strong",
            "settings": {
                "fontStyle": "bold"
            }
        },
        {
            "scope": "meta.diff.header",
            "settings": {
                "foreground": "#000080"
            }
        },
        {
            "scope": "comment",
            "settings": {
                "foreground": "#7ca668"
            }
        },
        {
            "scope": "constant.language",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": [
                "constant.numeric",
                "constant.other.color.rgb-value",
                "constant.other.rgb-value",
                "support.constant.color"
            ],
            "settings": {
                "foreground": "#b5cea8"
            }
        },
        {
            "scope": "constant.regexp",
            "settings": {
                "foreground": "#b46695"
            }
        },
        {
            "scope": "constant.character",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "entity.name.tag",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": [
                "entity.name.tag.css",
                "entity.name.tag.less"
            ],
            "settings": {
                "foreground": "#d7ba7d"
            }
        },
        {
            "scope": "entity.other.attribute-name",
            "settings": {
                "foreground": "#9cdcfe"
            }
        },
        {
            "scope": [
                "entity.other.attribute-name.class.css",
                "source.css entity.other.attribute-name.class",
                "entity.other.attribute-name.id.css",
                "entity.other.attribute-name.parent-selector.css",
                "entity.other.attribute-name.parent.less",
                "source.css entity.other.attribute-name.pseudo-class",
                "entity.other.attribute-name.pseudo-element.css",
                "source.css.less entity.other.attribute-name.id",
                "entity.other.attribute-name.scss"
            ],
            "settings": {
                "foreground": "#d7ba7d"
            }
        },
        {
            "scope": "invalid",
            "settings": {
                "foreground": "#f44747"
            }
        },
        {
            "scope": "markup.underline",
            "settings": {
                "fontStyle": "underline"
            }
        },
        {
            "scope": "markup.bold",
            "settings": {
                "fontStyle": "bold"
            }
        },
        {
            "scope": "markup.heading",
            "settings": {
                "fontStyle": "bold",
                "foreground": "#6796e6"
            }
        },
        {
            "scope": "markup.italic",
            "settings": {
                "fontStyle": "italic"
            }
        },
        {
            "scope": "markup.strikethrough",
            "settings": {
                "fontStyle": "strikethrough"
            }
        },
        {
            "scope": "markup.inserted",
            "settings": {
                "foreground": "#b5cea8"
            }
        },
        {
            "scope": "markup.deleted",
            "settings": {
                "foreground": "#ce9178"
            }
        },
        {
            "scope": "markup.changed",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "name": "brackets of XML/HTML tags",
            "scope": [
                "punctuation.definition.tag"
            ],
            "settings": {
                "foreground": "#808080"
            }
        },
        {
            "scope": "meta.preprocessor",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "meta.preprocessor.string",
            "settings": {
                "foreground": "#ce9178"
            }
        },
        {
            "scope": "meta.preprocessor.numeric",
            "settings": {
                "foreground": "#b5cea8"
            }
        },
        {
            "scope": "meta.structure.dictionary.key.python",
            "settings": {
                "foreground": "#9cdcfe"
            }
        },
        {
            "scope": "storage",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "storage.type",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "storage.modifier",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "string",
            "settings": {
                "foreground": "#ce9178"
            }
        },
        {
            "scope": "string.tag",
            "settings": {
                "foreground": "#ce9178"
            }
        },
        {
            "scope": "string.value",
            "settings": {
                "foreground": "#ce9178"
            }
        },
        {
            "scope": "string.regexp",
            "settings": {
                "foreground": "#d16969"
            }
        },
        {
            "name": "String interpolation",
            "scope": [
                "punctuation.definition.template-expression.begin",
                "punctuation.definition.template-expression.end",
                "punctuation.section.embedded"
            ],
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "name": "Reset JavaScript string interpolation expression",
            "scope": [
                "meta.template.expression"
            ],
            "settings": {
                "foreground": "#ffffff"
            }
        },
        {
            "scope": [
                "support.type.vendored.property-name",
                "support.type.property-name",
                "source.css variable",
                "source.coffee.embedded"
            ],
            "settings": {
                "foreground": "#d4d4d4"
            }
        },
        {
            "scope": "keyword",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "keyword.control",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "keyword.operator",
            "settings": {
                "foreground": "#d4d4d4"
            }
        },
        {
            "scope": [
                "keyword.operator.new",
                "keyword.operator.expression",
                "keyword.operator.cast",
                "keyword.operator.sizeof",
                "keyword.operator.logical.python"
            ],
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "scope": "keyword.other.unit",
            "settings": {
                "foreground": "#b5cea8"
            }
        },
        {
            "scope": "support.function.git-rebase",
            "settings": {
                "foreground": "#d4d4d4"
            }
        },
        {
            "scope": "constant.sha.git-rebase",
            "settings": {
                "foreground": "#b5cea8"
            }
        },
        {
            "name": "coloring of the Java import and package identifiers",
            "scope": [
                "storage.modifier.import.java",
                "variable.language.wildcard.java",
                "storage.modifier.package.java"
            ],
            "settings": {
                "foreground": "#d4d4d4"
            }
        },
        {
            "name": "coloring of the TS this",
            "scope": "variable.language.this",
            "settings": {
                "foreground": "#569cd6"
            }
        },
        {
            "name": "Function declarations",
            "scope": [
                "entity.name.function",
                "support.function",
                "support.constant.handlebars",
                "source.powershell variable.other.member"
            ],
            "settings": {
                "foreground": "#DCDCAA"
            }
        },
        {
            "name": "Types declaration and references",
            "scope": [
                "support.class",
                "support.type",
                "entity.name.type",
                "entity.name.namespace",
                "entity.name.scope-resolution",
                "entity.name.class",
                "storage.type.cs",
                "storage.type.generic.cs",
                "storage.type.modifier.cs",
                "storage.type.variable.cs",
                "storage.type.annotation.java",
                "storage.type.generic.java",
                "storage.type.java",
                "storage.type.object.array.java",
                "storage.type.primitive.array.java",
                "storage.type.primitive.java",
                "storage.type.token.java",
                "storage.type.groovy",
                "storage.type.annotation.groovy",
                "storage.type.parameters.groovy",
                "storage.type.generic.groovy",
                "storage.type.object.array.groovy",
                "storage.type.primitive.array.groovy",
                "storage.type.primitive.groovy"
            ],
            "settings": {
                "foreground": "#4EC9B0"
            }
        },
        {
            "name": "Types declaration and references, TS grammar specific",
            "scope": [
                "meta.type.cast.expr",
                "meta.type.new.expr",
                "support.constant.math",
                "support.constant.dom",
                "support.constant.json",
                "entity.other.inherited-class",
                "punctuation.separator.namespace.ruby"
            ],
            "settings": {
                "foreground": "#4EC9B0"
            }
        },
        {
            "name": "Control flow / Special keywords",
            "scope": [
                "keyword.control",
                "source.cpp keyword.operator.new",
                "source.cpp keyword.operator.delete",
                "keyword.other.using",
                "keyword.other.directive.using",
                "keyword.other.operator"
            ],
            "settings": {
                "foreground": "#C586C0"
            }
        },
        {
            "name": "Variable and parameter name",
            "scope": [
                "variable",
                "meta.definition.variable.name",
                "support.variable"
            ],
            "settings": {
                "foreground": "#9CDCFE"
            }
        },
        {
            "name": "Object keys, TS grammar specific",
            "scope": [
                "meta.object-literal.key"
            ],
            "settings": {
                "foreground": "#9CDCFE"
            }
        },
        {
            "name": "CSS property value",
            "scope": [
                "support.constant.property-value",
                "support.constant.font-name",
                "support.constant.media-type",
                "support.constant.media",
                "constant.other.color.rgb-value",
                "constant.other.rgb-value",
                "support.constant.color"
            ],
            "settings": {
                "foreground": "#CE9178"
            }
        },
        {
            "name": "HC Search Editor context line override",
            "scope": "meta.resultLinePrefix.contextLinePrefix.search",
            "settings": {
                "foreground": "#CBEDCB"
            }
        }
    ],
    "semanticHighlighting": true,
    "semanticTokenColors": {
        "newOperator": "#FFFFFF",
        "stringLiteral": "#ce9178",
        "customLiteral": "#DCDCAA",
        "numberLiteral": "#b5cea8"
    }
};
const HCLIGHT = {
    "$schema": "vscode://schemas/color-theme",
    "name": "Light High Contrast",
    "tokenColors": [
        {
            "scope": [
                "meta.embedded",
                "source.groovy.embedded",
                "variable.legacy.builtin.python"
            ],
            "settings": {
                "foreground": "#292929"
            }
        },
        {
            "scope": "emphasis",
            "settings": {
                "fontStyle": "italic"
            }
        },
        {
            "scope": "strong",
            "settings": {
                "fontStyle": "bold"
            }
        },
        {
            "scope": "meta.diff.header",
            "settings": {
                "foreground": "#062F4A"
            }
        },
        {
            "scope": "comment",
            "settings": {
                "foreground": "#515151"
            }
        },
        {
            "scope": "constant.language",
            "settings": {
                "foreground": "#0F4A85"
            }
        },
        {
            "scope": [
                "constant.numeric",
                "variable.other.enummember",
                "keyword.operator.plus.exponent",
                "keyword.operator.minus.exponent"
            ],
            "settings": {
                "foreground": "#096d48"
            }
        },
        {
            "scope": "constant.regexp",
            "settings": {
                "foreground": "#811F3F"
            }
        },
        {
            "scope": "entity.name.tag",
            "settings": {
                "foreground": "#0F4A85"
            }
        },
        {
            "scope": "entity.name.selector",
            "settings": {
                "foreground": "#0F4A85"
            }
        },
        {
            "scope": "entity.other.attribute-name",
            "settings": {
                "foreground": "#264F78"
            }
        },
        {
            "scope": [
                "entity.other.attribute-name.class.css",
                "source.css entity.other.attribute-name.class",
                "entity.other.attribute-name.id.css",
                "entity.other.attribute-name.parent-selector.css",
                "entity.other.attribute-name.parent.less",
                "source.css entity.other.attribute-name.pseudo-class",
                "entity.other.attribute-name.pseudo-element.css",
                "source.css.less entity.other.attribute-name.id",
                "entity.other.attribute-name.scss"
            ],
            "settings": {
                "foreground": "#0F4A85"
            }
        },
        {
            "scope": "invalid",
            "settings": {
                "foreground": "#B5200D"
            }
        },
        {
            "scope": "markup.underline",
            "settings": {
                "fontStyle": "underline"
            }
        },
        {
            "scope": "markup.bold",
            "settings": {
                "foreground": "#000080",
                "fontStyle": "bold"
            }
        },
        {
            "scope": "markup.heading",
            "settings": {
                "foreground": "#0F4A85",
                "fontStyle": "bold"
            }
        },
        {
            "scope": "markup.italic",
            "settings": {
                "fontStyle": "italic"
            }
        },
        {
            "scope": "markup.strikethrough",
            "settings": {
                "fontStyle": "strikethrough"
            }
        },
        {
            "scope": "markup.inserted",
            "settings": {
                "foreground": "#096d48"
            }
        },
        {
            "scope": "markup.deleted",
            "settings": {
                "foreground": "#5A5A5A"
            }
        },
        {
            "scope": "markup.changed",
            "settings": {
                "foreground": "#0451A5"
            }
        },
        {
            "scope": [
                "punctuation.definition.quote.begin.markdown",
                "punctuation.definition.list.begin.markdown"
            ],
            "settings": {
                "foreground": "#0451A5"
            }
        },
        {
            "scope": "markup.inline.raw",
            "settings": {
                "foreground": "#0F4A85"
            }
        },
        {
            "scope": "punctuation.definition.tag",
            "settings": {
                "foreground": "#0F4A85"
            }
        },
        {
            "scope": ["meta.preprocessor", "entity.name.function.preprocessor"],
            "settings": {
                "foreground": "#0F4A85"
            }
        },
        {
            "scope": "meta.preprocessor.string",
            "settings": {
                "foreground": "#b5200d"
            }
        },
        {
            "scope": "meta.preprocessor.numeric",
            "settings": {
                "foreground": "#096d48"
            }
        },
        {
            "scope": "meta.structure.dictionary.key.python",
            "settings": {
                "foreground": "#0451A5"
            }
        },
        {
            "scope": "storage",
            "settings": {
                "foreground": "#0F4A85"
            }
        },
        {
            "scope": "storage.type",
            "settings": {
                "foreground": "#0F4A85"
            }
        },
        {
            "scope": ["storage.modifier", "keyword.operator.noexcept"],
            "settings": {
                "foreground": "#0F4A85"
            }
        },
        {
            "scope": ["string", "meta.embedded.assembly"],
            "settings": {
                "foreground": "#0F4A85"
            }
        },
        {
            "scope": [
                "string.comment.buffered.block.pug",
                "string.quoted.pug",
                "string.interpolated.pug",
                "string.unquoted.plain.in.yaml",
                "string.unquoted.plain.out.yaml",
                "string.unquoted.block.yaml",
                "string.quoted.single.yaml",
                "string.quoted.double.xml",
                "string.quoted.single.xml",
                "string.unquoted.cdata.xml",
                "string.quoted.double.html",
                "string.quoted.single.html",
                "string.unquoted.html",
                "string.quoted.single.handlebars",
                "string.quoted.double.handlebars"
            ],
            "settings": {
                "foreground": "#0F4A85"
            }
        },
        {
            "scope": "string.regexp",
            "settings": {
                "foreground": "#811F3F"
            }
        },
        {
            "scope": [
                "punctuation.definition.template-expression.begin",
                "punctuation.definition.template-expression.end",
                "punctuation.section.embedded"
            ],
            "settings": {
                "foreground": "#0F4A85"
            }
        },
        {
            "scope": ["meta.template.expression"],
            "settings": {
                "foreground": "#000000"
            }
        },
        {
            "scope": [
                "support.constant.property-value",
                "support.constant.font-name",
                "support.constant.media-type",
                "support.constant.media",
                "constant.other.color.rgb-value",
                "constant.other.rgb-value",
                "support.constant.color"
            ],
            "settings": {
                "foreground": "#0451A5"
            }
        },
        {
            "scope": [
                "support.type.vendored.property-name",
                "support.type.property-name",
                "source.css variable",
                "source.coffee.embedded"
            ],
            "settings": {
                "foreground": "#264F78"
            }
        },
        {
            "scope": ["support.type.property-name.json"],
            "settings": {
                "foreground": "#0451A5"
            }
        },
        {
            "scope": "keyword",
            "settings": {
                "foreground": "#0F4A85"
            }
        },
        {
            "scope": "keyword.control",
            "settings": {
                "foreground": "#0F4A85"
            }
        },
        {
            "scope": "keyword.operator",
            "settings": {
                "foreground": "#000000"
            }
        },
        {
            "scope": [
                "keyword.operator.new",
                "keyword.operator.expression",
                "keyword.operator.cast",
                "keyword.operator.sizeof",
                "keyword.operator.alignof",
                "keyword.operator.typeid",
                "keyword.operator.alignas",
                "keyword.operator.instanceof",
                "keyword.operator.logical.python",
                "keyword.operator.wordlike"
            ],
            "settings": {
                "foreground": "#0F4A85"
            }
        },
        {
            "scope": "keyword.other.unit",
            "settings": {
                "foreground": "#096d48"
            }
        },
        {
            "scope": [
                "punctuation.section.embedded.begin.php",
                "punctuation.section.embedded.end.php"
            ],
            "settings": {
                "foreground": "#0F4A85"
            }
        },
        {
            "scope": "support.function.git-rebase",
            "settings": {
                "foreground": "#0451A5"
            }
        },
        {
            "scope": "constant.sha.git-rebase",
            "settings": {
                "foreground": "#096d48"
            }
        },
        {
            "scope": [
                "storage.modifier.import.java",
                "variable.language.wildcard.java",
                "storage.modifier.package.java"
            ],
            "settings": {
                "foreground": "#000000"
            }
        },
        {
            "scope": "variable.language",
            "settings": {
                "foreground": "#0F4A85"
            }
        },
        {
            "scope": [
                "entity.name.function",
                "support.function",
                "support.constant.handlebars",
                "source.powershell variable.other.member",
                "entity.name.operator.custom-literal"
            ],
            "settings": {
                "foreground": "#5e2cbc"
            }
        },
        {
            "scope": [
                "support.class",
                "support.type",
                "entity.name.type",
                "entity.name.namespace",
                "entity.other.attribute",
                "entity.name.scope-resolution",
                "entity.name.class",
                "storage.type.numeric.go",
                "storage.type.byte.go",
                "storage.type.boolean.go",
                "storage.type.string.go",
                "storage.type.uintptr.go",
                "storage.type.error.go",
                "storage.type.rune.go",
                "storage.type.cs",
                "storage.type.generic.cs",
                "storage.type.modifier.cs",
                "storage.type.variable.cs",
                "storage.type.annotation.java",
                "storage.type.generic.java",
                "storage.type.java",
                "storage.type.object.array.java",
                "storage.type.primitive.array.java",
                "storage.type.primitive.java",
                "storage.type.token.java",
                "storage.type.groovy",
                "storage.type.annotation.groovy",
                "storage.type.parameters.groovy",
                "storage.type.generic.groovy",
                "storage.type.object.array.groovy",
                "storage.type.primitive.array.groovy",
                "storage.type.primitive.groovy"
            ],
            "settings": {
                "foreground": "#185E73"
            }
        },
        {
            "scope": [
                "meta.type.cast.expr",
                "meta.type.new.expr",
                "support.constant.math",
                "support.constant.dom",
                "support.constant.json",
                "entity.other.inherited-class",
                "punctuation.separator.namespace.ruby"
            ],
            "settings": {
                "foreground": "#185E73"
            }
        },
        {
            "scope": [
                "keyword.control",
                "source.cpp keyword.operator.new",
                "source.cpp keyword.operator.delete",
                "keyword.other.using",
                "keyword.other.directive.using",
                "keyword.other.operator",
                "entity.name.operator"
            ],
            "settings": {
                "foreground": "#b5200d"
            }
        },
        {
            "scope": [
                "variable",
                "meta.definition.variable.name",
                "support.variable",
                "entity.name.variable",
                "constant.other.placeholder"
            ],
            "settings": {
                "foreground": "#001080"
            }
        },
        {
            "scope": ["variable.other.constant", "variable.other.enummember"],
            "settings": {
                "foreground": "#02715D"
            }
        },
        {
            "scope": ["meta.object-literal.key"],
            "settings": {
                "foreground": "#001080"
            }
        },
        {
            "scope": [
                "support.constant.property-value",
                "support.constant.font-name",
                "support.constant.media-type",
                "support.constant.media",
                "constant.other.color.rgb-value",
                "constant.other.rgb-value",
                "support.constant.color"
            ],
            "settings": {
                "foreground": "#0451A5"
            }
        },
        {
            "scope": [
                "punctuation.definition.group.regexp",
                "punctuation.definition.group.assertion.regexp",
                "punctuation.definition.character-class.regexp",
                "punctuation.character.set.begin.regexp",
                "punctuation.character.set.end.regexp",
                "keyword.operator.negation.regexp",
                "support.other.parenthesis.regexp"
            ],
            "settings": {
                "foreground": "#D16969"
            }
        },
        {
            "scope": [
                "constant.character.character-class.regexp",
                "constant.other.character-class.set.regexp",
                "constant.other.character-class.regexp",
                "constant.character.set.regexp"
            ],
            "settings": {
                "foreground": "#811F3F"
            }
        },
        {
            "scope": "keyword.operator.quantifier.regexp",
            "settings": {
                "foreground": "#000000"
            }
        },
        {
            "scope": ["keyword.operator.or.regexp", "keyword.control.anchor.regexp"],
            "settings": {
                "foreground": "#EE0000"
            }
        },
        {
            "scope": "constant.character",
            "settings": {
                "foreground": "#0F4A85"
            }
        },
        {
            "scope": "constant.character.escape",
            "settings": {
                "foreground": "#EE0000"
            }
        },
        {
            "scope": "entity.name.label",
            "settings": {
                "foreground": "#000000"
            }
        },
        {
            "scope": "token.info-token",
            "settings": {
                "foreground": "#316BCD"
            }
        },
        {
            "scope": "token.warn-token",
            "settings": {
                "foreground": "#CD9731"
            }
        },
        {
            "scope": "token.error-token",
            "settings": {
                "foreground": "#CD3131"
            }
        },
        {
            "scope": "token.debug-token",
            "settings": {
                "foreground": "#800080"
            }
        }
    ],
    "colors": {
        "actionBar.toggledBackground": "#dddddd",
        "statusBarItem.remoteBackground": "#FFFFFF",
        "statusBarItem.remoteForeground": "#000000"
    }
};
const LIGHTMODERN = {
    "$schema": "vscode://schemas/color-theme",
    "name": "Default Light Modern",
    "include": "./light_plus.json",
    "colors": {
        "activityBar.activeBorder": "#005FB8",
        "activityBar.background": "#F8F8F8",
        "activityBar.border": "#E5E5E5",
        "activityBar.foreground": "#1F1F1F",
        "activityBar.inactiveForeground": "#616161",
        "activityBarBadge.background": "#005FB8",
        "activityBarBadge.foreground": "#FFFFFF",
        "badge.background": "#CCCCCC",
        "badge.foreground": "#3B3B3B",
        "button.background": "#005FB8",
        "button.border": "#0000001a",
        "button.foreground": "#FFFFFF",
        "button.hoverBackground": "#0258A8",
        "button.secondaryBackground": "#E5E5E5",
        "button.secondaryForeground": "#3B3B3B",
        "button.secondaryHoverBackground": "#CCCCCC",
        "chat.slashCommandBackground": "#D2ECFF",
        "chat.slashCommandForeground": "#306CA2",
        "chat.editedFileForeground": "#895503",
        "checkbox.background": "#F8F8F8",
        "checkbox.border": "#CECECE",
        "descriptionForeground": "#3B3B3B",
        "dropdown.background": "#FFFFFF",
        "dropdown.border": "#CECECE",
        "dropdown.foreground": "#3B3B3B",
        "dropdown.listBackground": "#FFFFFF",
        "editor.background": "#FFFFFF",
        "editor.foreground": "#3B3B3B",
        "editor.inactiveSelectionBackground": "#E5EBF1",
        "editor.selectionHighlightBackground": "#ADD6FF80",
        "editorGroup.border": "#E5E5E5",
        "editorGroupHeader.tabsBackground": "#F8F8F8",
        "editorGroupHeader.tabsBorder": "#E5E5E5",
        "editorGutter.addedBackground": "#2EA043",
        "editorGutter.deletedBackground": "#F85149",
        "editorGutter.modifiedBackground": "#005FB8",
        "editorIndentGuide.background1": "#D3D3D3",
        "editorLineNumber.activeForeground": "#171184",
        "editorLineNumber.foreground": "#6E7681",
        "editorOverviewRuler.border": "#E5E5E5",
        "editorSuggestWidget.background": "#F8F8F8",
        "editorWidget.background": "#F8F8F8",
        "errorForeground": "#F85149",
        "focusBorder": "#005FB8",
        "foreground": "#3B3B3B",
        "icon.foreground": "#3B3B3B",
        "input.background": "#FFFFFF",
        "input.border": "#CECECE",
        "input.foreground": "#3B3B3B",
        "input.placeholderForeground": "#767676",
        "inputOption.activeBackground": "#BED6ED",
        "inputOption.activeBorder": "#005FB8",
        "inputOption.activeForeground": "#000000",
        "keybindingLabel.foreground": "#3B3B3B",
        "list.activeSelectionBackground": "#E8E8E8",
        "list.activeSelectionForeground": "#000000",
        "list.activeSelectionIconForeground": "#000000",
        "list.hoverBackground": "#F2F2F2",
        "list.focusAndSelectionOutline": "#005FB8",
        "menu.border": "#CECECE",
        "menu.selectionBackground": "#005FB8",
        "menu.selectionForeground": "#ffffff",
        "notebook.cellBorderColor": "#E5E5E5",
        "notebook.selectedCellBackground": "#C8DDF150",
        "notificationCenterHeader.background": "#FFFFFF",
        "notificationCenterHeader.foreground": "#3B3B3B",
        "notifications.background": "#FFFFFF",
        "notifications.border": "#E5E5E5",
        "notifications.foreground": "#3B3B3B",
        "panel.background": "#F8F8F8",
        "panel.border": "#E5E5E5",
        "panelInput.border": "#E5E5E5",
        "panelTitle.activeBorder": "#005FB8",
        "panelTitle.activeForeground": "#3B3B3B",
        "panelTitle.inactiveForeground": "#3B3B3B",
        "peekViewEditor.matchHighlightBackground": "#BB800966",
        "peekViewResult.background": "#FFFFFF",
        "peekViewResult.matchHighlightBackground": "#BB800966",
        "pickerGroup.border": "#E5E5E5",
        "pickerGroup.foreground": "#8B949E",
        "ports.iconRunningProcessForeground": "#369432",
        "progressBar.background": "#005FB8",
        "quickInput.background": "#F8F8F8",
        "quickInput.foreground": "#3B3B3B",
        "searchEditor.textInputBorder": "#CECECE",
        "settings.dropdownBackground": "#FFFFFF",
        "settings.dropdownBorder": "#CECECE",
        "settings.headerForeground": "#1F1F1F",
        "settings.modifiedItemIndicator": "#BB800966",
        "settings.numberInputBorder": "#CECECE",
        "settings.textInputBorder": "#CECECE",
        "sideBar.background": "#F8F8F8",
        "sideBar.border": "#E5E5E5",
        "sideBar.foreground": "#3B3B3B",
        "sideBarSectionHeader.background": "#F8F8F8",
        "sideBarSectionHeader.border": "#E5E5E5",
        "sideBarSectionHeader.foreground": "#3B3B3B",
        "sideBarTitle.foreground": "#3B3B3B",
        "statusBar.background": "#F8F8F8",
        "statusBar.foreground": "#3B3B3B",
        "statusBar.border": "#E5E5E5",
        "statusBarItem.hoverBackground": "#B8B8B850",
        "statusBarItem.compactHoverBackground": "#CCCCCC",
        "statusBar.debuggingBackground": "#FD716C",
        "statusBar.debuggingForeground": "#000000",
        "statusBar.focusBorder": "#005FB8",
        "statusBar.noFolderBackground": "#F8F8F8",
        "statusBarItem.errorBackground": "#C72E0F",
        "statusBarItem.focusBorder": "#005FB8",
        "statusBarItem.prominentBackground": "#6E768166",
        "statusBarItem.remoteBackground": "#005FB8",
        "statusBarItem.remoteForeground": "#FFFFFF",
        "tab.activeBackground": "#FFFFFF",
        "tab.activeBorder": "#F8F8F8",
        "tab.activeBorderTop": "#005FB8",
        "tab.activeForeground": "#3B3B3B",
        "tab.selectedBorderTop": "#68a3da",
        "tab.border": "#E5E5E5",
        "tab.hoverBackground": "#FFFFFF",
        "tab.inactiveBackground": "#F8F8F8",
        "tab.inactiveForeground": "#868686",
        "tab.lastPinnedBorder": "#D4D4D4",
        "tab.unfocusedActiveBorder": "#F8F8F8",
        "tab.unfocusedActiveBorderTop": "#E5E5E5",
        "tab.unfocusedHoverBackground": "#F8F8F8",
        "terminalCursor.foreground": "#005FB8",
        "terminal.foreground": "#3B3B3B",
        "terminal.inactiveSelectionBackground": "#E5EBF1",
        "terminal.tab.activeBorder": "#005FB8",
        "textBlockQuote.background": "#F8F8F8",
        "textBlockQuote.border": "#E5E5E5",
        "textCodeBlock.background": "#F8F8F8",
        "textLink.activeForeground": "#005FB8",
        "textLink.foreground": "#005FB8",
        "textPreformat.foreground": "#3B3B3B",
        "textPreformat.background": "#0000001F",
        "textSeparator.foreground": "#21262D",
        "titleBar.activeBackground": "#F8F8F8",
        "titleBar.activeForeground": "#1E1E1E",
        "titleBar.border": "#E5E5E5",
        "titleBar.inactiveBackground": "#F8F8F8",
        "titleBar.inactiveForeground": "#8B949E",
        "welcomePage.tileBackground": "#F3F3F3",
        "widget.border": "#E5E5E5"
    },
    "tokenColors": [
        {
            "name": "Function declarations",
            "scope": [
                "entity.name.function",
                "support.function",
                "support.constant.handlebars",
                "source.powershell variable.other.member",
                "entity.name.operator.custom-literal" // See https://en.cppreference.com/w/cpp/language/user_literal
            ],
            "settings": {
                "foreground": "#795E26"
            }
        },
        {
            "name": "Types declaration and references",
            "scope": [
                "support.class",
                "support.type",
                "entity.name.type",
                "entity.name.namespace",
                "entity.other.attribute",
                "entity.name.scope-resolution",
                "entity.name.class",
                "storage.type.numeric.go",
                "storage.type.byte.go",
                "storage.type.boolean.go",
                "storage.type.string.go",
                "storage.type.uintptr.go",
                "storage.type.error.go",
                "storage.type.rune.go",
                "storage.type.cs",
                "storage.type.generic.cs",
                "storage.type.modifier.cs",
                "storage.type.variable.cs",
                "storage.type.annotation.java",
                "storage.type.generic.java",
                "storage.type.java",
                "storage.type.object.array.java",
                "storage.type.primitive.array.java",
                "storage.type.primitive.java",
                "storage.type.token.java",
                "storage.type.groovy",
                "storage.type.annotation.groovy",
                "storage.type.parameters.groovy",
                "storage.type.generic.groovy",
                "storage.type.object.array.groovy",
                "storage.type.primitive.array.groovy",
                "storage.type.primitive.groovy"
            ],
            "settings": {
                "foreground": "#267f99"
            }
        },
        {
            "name": "Types declaration and references, TS grammar specific",
            "scope": [
                "meta.type.cast.expr",
                "meta.type.new.expr",
                "support.constant.math",
                "support.constant.dom",
                "support.constant.json",
                "entity.other.inherited-class",
                "punctuation.separator.namespace.ruby"
            ],
            "settings": {
                "foreground": "#267f99"
            }
        },
        {
            "name": "Control flow / Special keywords",
            "scope": [
                "keyword.control",
                "source.cpp keyword.operator.new",
                "source.cpp keyword.operator.delete",
                "keyword.other.using",
                "keyword.other.directive.using",
                "keyword.other.operator",
                "entity.name.operator"
            ],
            "settings": {
                "foreground": "#AF00DB"
            }
        },
        {
            "name": "Variable and parameter name",
            "scope": [
                "variable",
                "meta.definition.variable.name",
                "support.variable",
                "entity.name.variable",
                "constant.other.placeholder", // placeholders in strings
            ],
            "settings": {
                "foreground": "#001080"
            }
        },
        {
            "name": "Constants and enums",
            "scope": [
                "variable.other.constant",
                "variable.other.enummember"
            ],
            "settings": {
                "foreground": "#0070C1",
            }
        },
        {
            "name": "Object keys, TS grammar specific",
            "scope": [
                "meta.object-literal.key"
            ],
            "settings": {
                "foreground": "#001080"
            }
        },
        {
            "name": "CSS property value",
            "scope": [
                "support.constant.property-value",
                "support.constant.font-name",
                "support.constant.media-type",
                "support.constant.media",
                "constant.other.color.rgb-value",
                "constant.other.rgb-value",
                "support.constant.color"
            ],
            "settings": {
                "foreground": "#0451a5"
            }
        },
        {
            "name": "Regular expression groups",
            "scope": [
                "punctuation.definition.group.regexp",
                "punctuation.definition.group.assertion.regexp",
                "punctuation.definition.character-class.regexp",
                "punctuation.character.set.begin.regexp",
                "punctuation.character.set.end.regexp",
                "keyword.operator.negation.regexp",
                "support.other.parenthesis.regexp"
            ],
            "settings": {
                "foreground": "#d16969"
            }
        },
        {
            "scope": [
                "constant.character.character-class.regexp",
                "constant.other.character-class.set.regexp",
                "constant.other.character-class.regexp",
                "constant.character.set.regexp"
            ],
            "settings": {
                "foreground": "#811f3f"
            }
        },
        {
            "scope": "keyword.operator.quantifier.regexp",
            "settings": {
                "foreground": "#000000"
            }
        },
        {
            "scope": [
                "keyword.operator.or.regexp",
                "keyword.control.anchor.regexp"
            ],
            "settings": {
                "foreground": "#EE0000"
            }
        },
        {
            "scope": [
                "constant.character",
                "constant.other.option"
            ],
            "settings": {
                "foreground": "#0000ff"
            }
        },
        {
            "scope": "constant.character.escape",
            "settings": {
                "foreground": "#EE0000"
            }
        },
        {
            "scope": "entity.name.label",
            "settings": {
                "foreground": "#000000"
            }
        }
    ],
    "semanticHighlighting": true,
    "semanticTokenColors": {
        "newOperator": "#AF00DB",
        "stringLiteral": "#a31515",
        "customLiteral": "#795E26",
        "numberLiteral": "#098658",
    }
};
const LightPLUS = {
    "$schema": "vscode://schemas/color-theme",
    "name": "Light+",
    "include": "./light_vs.json",
    "tokenColors": [
        {
            "name": "Function declarations",
            "scope": [
                "entity.name.function",
                "support.function",
                "support.constant.handlebars",
                "source.powershell variable.other.member",
                "entity.name.operator.custom-literal" // See https://en.cppreference.com/w/cpp/language/user_literal
            ],
            "settings": {
                "foreground": "#795E26"
            }
        },
        {
            "name": "Types declaration and references",
            "scope": [
                "support.class",
                "support.type",
                "entity.name.type",
                "entity.name.namespace",
                "entity.other.attribute",
                "entity.name.scope-resolution",
                "entity.name.class",
                "storage.type.numeric.go",
                "storage.type.byte.go",
                "storage.type.boolean.go",
                "storage.type.string.go",
                "storage.type.uintptr.go",
                "storage.type.error.go",
                "storage.type.rune.go",
                "storage.type.cs",
                "storage.type.generic.cs",
                "storage.type.modifier.cs",
                "storage.type.variable.cs",
                "storage.type.annotation.java",
                "storage.type.generic.java",
                "storage.type.java",
                "storage.type.object.array.java",
                "storage.type.primitive.array.java",
                "storage.type.primitive.java",
                "storage.type.token.java",
                "storage.type.groovy",
                "storage.type.annotation.groovy",
                "storage.type.parameters.groovy",
                "storage.type.generic.groovy",
                "storage.type.object.array.groovy",
                "storage.type.primitive.array.groovy",
                "storage.type.primitive.groovy"
            ],
            "settings": {
                "foreground": "#267f99"
            }
        },
        {
            "name": "Types declaration and references, TS grammar specific",
            "scope": [
                "meta.type.cast.expr",
                "meta.type.new.expr",
                "support.constant.math",
                "support.constant.dom",
                "support.constant.json",
                "entity.other.inherited-class",
                "punctuation.separator.namespace.ruby"
            ],
            "settings": {
                "foreground": "#267f99"
            }
        },
        {
            "name": "Control flow / Special keywords",
            "scope": [
                "keyword.control",
                "source.cpp keyword.operator.new",
                "source.cpp keyword.operator.delete",
                "keyword.other.using",
                "keyword.other.directive.using",
                "keyword.other.operator",
                "entity.name.operator"
            ],
            "settings": {
                "foreground": "#AF00DB"
            }
        },
        {
            "name": "Variable and parameter name",
            "scope": [
                "variable",
                "meta.definition.variable.name",
                "support.variable",
                "entity.name.variable",
                "constant.other.placeholder", // placeholders in strings
            ],
            "settings": {
                "foreground": "#001080"
            }
        },
        {
            "name": "Constants and enums",
            "scope": [
                "variable.other.constant",
                "variable.other.enummember"
            ],
            "settings": {
                "foreground": "#0070C1",
            }
        },
        {
            "name": "Object keys, TS grammar specific",
            "scope": [
                "meta.object-literal.key"
            ],
            "settings": {
                "foreground": "#001080"
            }
        },
        {
            "name": "CSS property value",
            "scope": [
                "support.constant.property-value",
                "support.constant.font-name",
                "support.constant.media-type",
                "support.constant.media",
                "constant.other.color.rgb-value",
                "constant.other.rgb-value",
                "support.constant.color"
            ],
            "settings": {
                "foreground": "#0451a5"
            }
        },
        {
            "name": "Regular expression groups",
            "scope": [
                "punctuation.definition.group.regexp",
                "punctuation.definition.group.assertion.regexp",
                "punctuation.definition.character-class.regexp",
                "punctuation.character.set.begin.regexp",
                "punctuation.character.set.end.regexp",
                "keyword.operator.negation.regexp",
                "support.other.parenthesis.regexp"
            ],
            "settings": {
                "foreground": "#d16969"
            }
        },
        {
            "scope": [
                "constant.character.character-class.regexp",
                "constant.other.character-class.set.regexp",
                "constant.other.character-class.regexp",
                "constant.character.set.regexp"
            ],
            "settings": {
                "foreground": "#811f3f"
            }
        },
        {
            "scope": "keyword.operator.quantifier.regexp",
            "settings": {
                "foreground": "#000000"
            }
        },
        {
            "scope": [
                "keyword.operator.or.regexp",
                "keyword.control.anchor.regexp"
            ],
            "settings": {
                "foreground": "#EE0000"
            }
        },
        {
            "scope": [
                "constant.character",
                "constant.other.option"
            ],
            "settings": {
                "foreground": "#0000ff"
            }
        },
        {
            "scope": "constant.character.escape",
            "settings": {
                "foreground": "#EE0000"
            }
        },
        {
            "scope": "entity.name.label",
            "settings": {
                "foreground": "#000000"
            }
        }
    ],
    "semanticHighlighting": true,
    "semanticTokenColors": {
        "newOperator": "#AF00DB",
        "stringLiteral": "#a31515",
        "customLiteral": "#795E26",
        "numberLiteral": "#098658",
    }
};
const LIGHTVS = {
    "$schema": "vscode://schemas/color-theme",
    "name": "Light (Visual Studio)",
    "colors": {
        "checkbox.border": "#919191",
        "editor.background": "#FFFFFF",
        "editor.foreground": "#000000",
        "editor.inactiveSelectionBackground": "#E5EBF1",
        "editorIndentGuide.background1": "#D3D3D3",
        "editorIndentGuide.activeBackground1": "#939393",
        "editor.selectionHighlightBackground": "#ADD6FF80",
        "editorSuggestWidget.background": "#F3F3F3",
        "activityBarBadge.background": "#007ACC",
        "sideBarTitle.foreground": "#6F6F6F",
        "list.hoverBackground": "#E8E8E8",
        "menu.border": "#D4D4D4",
        "input.placeholderForeground": "#767676",
        "searchEditor.textInputBorder": "#CECECE",
        "settings.textInputBorder": "#CECECE",
        "settings.numberInputBorder": "#CECECE",
        "statusBarItem.remoteForeground": "#FFF",
        "statusBarItem.remoteBackground": "#16825D",
        "ports.iconRunningProcessForeground": "#369432",
        "sideBarSectionHeader.background": "#0000",
        "sideBarSectionHeader.border": "#61616130",
        "tab.selectedForeground": "#333333b3",
        "tab.selectedBackground": "#ffffffa5",
        "tab.lastPinnedBorder": "#61616130",
        "notebook.cellBorderColor": "#E8E8E8",
        "notebook.selectedCellBackground": "#c8ddf150",
        "statusBarItem.errorBackground": "#c72e0f",
        "list.activeSelectionIconForeground": "#FFF",
        "list.focusAndSelectionOutline": "#90C2F9",
        "terminal.inactiveSelectionBackground": "#E5EBF1",
        "widget.border": "#d4d4d4",
        "actionBar.toggledBackground": "#dddddd",
        "diffEditor.unchangedRegionBackground": "#f8f8f8"
    },
    "tokenColors": [
        {
            "scope": [
                "meta.embedded",
                "source.groovy.embedded",
                "string meta.image.inline.markdown",
                "variable.legacy.builtin.python"
            ],
            "settings": {
                "foreground": "#000000ff"
            }
        },
        {
            "scope": "emphasis",
            "settings": {
                "fontStyle": "italic"
            }
        },
        {
            "scope": "strong",
            "settings": {
                "fontStyle": "bold"
            }
        },
        {
            "scope": "meta.diff.header",
            "settings": {
                "foreground": "#000080"
            }
        },
        {
            "scope": "comment",
            "settings": {
                "foreground": "#008000"
            }
        },
        {
            "scope": "constant.language",
            "settings": {
                "foreground": "#0000ff"
            }
        },
        {
            "scope": [
                "constant.numeric",
                "variable.other.enummember",
                "keyword.operator.plus.exponent",
                "keyword.operator.minus.exponent"
            ],
            "settings": {
                "foreground": "#098658"
            }
        },
        {
            "scope": "constant.regexp",
            "settings": {
                "foreground": "#811f3f"
            }
        },
        {
            "name": "css tags in selectors, xml tags",
            "scope": "entity.name.tag",
            "settings": {
                "foreground": "#800000"
            }
        },
        {
            "scope": "entity.name.selector",
            "settings": {
                "foreground": "#800000"
            }
        },
        {
            "scope": "entity.other.attribute-name",
            "settings": {
                "foreground": "#e50000"
            }
        },
        {
            "scope": [
                "entity.other.attribute-name.class.css",
                "source.css entity.other.attribute-name.class",
                "entity.other.attribute-name.id.css",
                "entity.other.attribute-name.parent-selector.css",
                "entity.other.attribute-name.parent.less",
                "source.css entity.other.attribute-name.pseudo-class",
                "entity.other.attribute-name.pseudo-element.css",
                "source.css.less entity.other.attribute-name.id",
                "entity.other.attribute-name.scss"
            ],
            "settings": {
                "foreground": "#800000"
            }
        },
        {
            "scope": "invalid",
            "settings": {
                "foreground": "#cd3131"
            }
        },
        {
            "scope": "markup.underline",
            "settings": {
                "fontStyle": "underline"
            }
        },
        {
            "scope": "markup.bold",
            "settings": {
                "fontStyle": "bold",
                "foreground": "#000080"
            }
        },
        {
            "scope": "markup.heading",
            "settings": {
                "fontStyle": "bold",
                "foreground": "#800000"
            }
        },
        {
            "scope": "markup.italic",
            "settings": {
                "fontStyle": "italic"
            }
        },
        {
            "scope": "markup.strikethrough",
            "settings": {
                "fontStyle": "strikethrough"
            }
        },
        {
            "scope": "markup.inserted",
            "settings": {
                "foreground": "#098658"
            }
        },
        {
            "scope": "markup.deleted",
            "settings": {
                "foreground": "#a31515"
            }
        },
        {
            "scope": "markup.changed",
            "settings": {
                "foreground": "#0451a5"
            }
        },
        {
            "scope": [
                "punctuation.definition.quote.begin.markdown",
                "punctuation.definition.list.begin.markdown"
            ],
            "settings": {
                "foreground": "#0451a5"
            }
        },
        {
            "scope": "markup.inline.raw",
            "settings": {
                "foreground": "#800000"
            }
        },
        {
            "name": "brackets of XML/HTML tags",
            "scope": "punctuation.definition.tag",
            "settings": {
                "foreground": "#800000"
            }
        },
        {
            "scope": [
                "meta.preprocessor",
                "entity.name.function.preprocessor"
            ],
            "settings": {
                "foreground": "#0000ff"
            }
        },
        {
            "scope": "meta.preprocessor.string",
            "settings": {
                "foreground": "#a31515"
            }
        },
        {
            "scope": "meta.preprocessor.numeric",
            "settings": {
                "foreground": "#098658"
            }
        },
        {
            "scope": "meta.structure.dictionary.key.python",
            "settings": {
                "foreground": "#0451a5"
            }
        },
        {
            "scope": "storage",
            "settings": {
                "foreground": "#0000ff"
            }
        },
        {
            "scope": "storage.type",
            "settings": {
                "foreground": "#0000ff"
            }
        },
        {
            "scope": [
                "storage.modifier",
                "keyword.operator.noexcept"
            ],
            "settings": {
                "foreground": "#0000ff"
            }
        },
        {
            "scope": [
                "string",
                "meta.embedded.assembly"
            ],
            "settings": {
                "foreground": "#a31515"
            }
        },
        {
            "scope": [
                "string.comment.buffered.block.pug",
                "string.quoted.pug",
                "string.interpolated.pug",
                "string.unquoted.plain.in.yaml",
                "string.unquoted.plain.out.yaml",
                "string.unquoted.block.yaml",
                "string.quoted.single.yaml",
                "string.quoted.double.xml",
                "string.quoted.single.xml",
                "string.unquoted.cdata.xml",
                "string.quoted.double.html",
                "string.quoted.single.html",
                "string.unquoted.html",
                "string.quoted.single.handlebars",
                "string.quoted.double.handlebars"
            ],
            "settings": {
                "foreground": "#0000ff"
            }
        },
        {
            "scope": "string.regexp",
            "settings": {
                "foreground": "#811f3f"
            }
        },
        {
            "name": "String interpolation",
            "scope": [
                "punctuation.definition.template-expression.begin",
                "punctuation.definition.template-expression.end",
                "punctuation.section.embedded"
            ],
            "settings": {
                "foreground": "#0000ff"
            }
        },
        {
            "name": "Reset JavaScript string interpolation expression",
            "scope": [
                "meta.template.expression"
            ],
            "settings": {
                "foreground": "#000000"
            }
        },
        {
            "scope": [
                "support.constant.property-value",
                "support.constant.font-name",
                "support.constant.media-type",
                "support.constant.media",
                "constant.other.color.rgb-value",
                "constant.other.rgb-value",
                "support.constant.color"
            ],
            "settings": {
                "foreground": "#0451a5"
            }
        },
        {
            "scope": [
                "support.type.vendored.property-name",
                "support.type.property-name",
                "source.css variable",
                "source.coffee.embedded"
            ],
            "settings": {
                "foreground": "#e50000"
            }
        },
        {
            "scope": [
                "support.type.property-name.json"
            ],
            "settings": {
                "foreground": "#0451a5"
            }
        },
        {
            "scope": "keyword",
            "settings": {
                "foreground": "#0000ff"
            }
        },
        {
            "scope": "keyword.control",
            "settings": {
                "foreground": "#0000ff"
            }
        },
        {
            "scope": "keyword.operator",
            "settings": {
                "foreground": "#000000"
            }
        },
        {
            "scope": [
                "keyword.operator.new",
                "keyword.operator.expression",
                "keyword.operator.cast",
                "keyword.operator.sizeof",
                "keyword.operator.alignof",
                "keyword.operator.typeid",
                "keyword.operator.alignas",
                "keyword.operator.instanceof",
                "keyword.operator.logical.python",
                "keyword.operator.wordlike"
            ],
            "settings": {
                "foreground": "#0000ff"
            }
        },
        {
            "scope": "keyword.other.unit",
            "settings": {
                "foreground": "#098658"
            }
        },
        {
            "scope": [
                "punctuation.section.embedded.begin.php",
                "punctuation.section.embedded.end.php"
            ],
            "settings": {
                "foreground": "#800000"
            }
        },
        {
            "scope": "support.function.git-rebase",
            "settings": {
                "foreground": "#0451a5"
            }
        },
        {
            "scope": "constant.sha.git-rebase",
            "settings": {
                "foreground": "#098658"
            }
        },
        {
            "name": "coloring of the Java import and package identifiers",
            "scope": [
                "storage.modifier.import.java",
                "variable.language.wildcard.java",
                "storage.modifier.package.java"
            ],
            "settings": {
                "foreground": "#000000"
            }
        },
        {
            "name": "this.self",
            "scope": "variable.language",
            "settings": {
                "foreground": "#0000ff"
            }
        }
    ],
    "semanticHighlighting": true,
    "semanticTokenColors": {
        "newOperator": "#0000ff",
        "stringLiteral": "#a31515",
        "customLiteral": "#000000",
        "numberLiteral": "#098658",
    }
};
function flattenTheme(theme) {
    console.log('Flattening theme:', theme);
    const flattened = {};
    const targetScopes = [
        "string",
        "variable",
        "function",
        "class",
        "keyword"
    ];
    const targetColors = [
        "editor.background",
        "editor.foreground",
        "button.background",
        "button.foreground",
        "input.background",
        "panel.background",
        "input.foreground"
    ];
    // Process tokenColors
    if (theme.tokenColors && Array.isArray(theme.tokenColors)) {
        const extractedColors = {};
        theme.tokenColors.forEach((item) => {
            if (item.scope && item.settings && item.settings.foreground) {
                const matches = targetScopes.filter(scope => {
                    if (typeof item.scope === "string") {
                        return item.scope.includes(scope);
                    }
                    if (Array.isArray(item.scope)) {
                        return item.scope.some((s) => s.includes(scope));
                    }
                    return false;
                });
                if (matches.length > 0) {
                    matches.forEach(m => {
                        if (!extractedColors[m]) {
                            extractedColors[m] = item.settings.foreground;
                        }
                    });
                }
            }
        });
        targetScopes.forEach(s => {
            if (extractedColors[s]) {
                flattened[`token.${s}`] = extractedColors[s];
            }
        });
    }
    // Process colors
    if (theme.colors && typeof theme.colors === 'object') {
        targetColors.forEach(colorKey => {
            if (theme.colors.hasOwnProperty(colorKey)) {
                flattened[colorKey] = theme.colors[colorKey];
            }
        });
    }
    if (!flattened["input.foreground"]) {
        flattened["input.foreground"] = flattened["token.string"];
    }
    console.log("FOIREEEEEEE", flattened);
    return flattened;
}
function isLightColor(hexColor) {
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
function getThemeName() {
    const activeThemeName = vscode.workspace.getConfiguration('workbench').get('colorTheme');
    return activeThemeName;
}
function getThemeColors() {
    // Fetch the currently active theme
    const activeThemeName = vscode.workspace.getConfiguration('workbench').get('colorTheme');
    const customColors = vscode.workspace.getConfiguration('workbench').get('colorCustomizations');
    console.log(`Current Active Theme: ${activeThemeName}`);
    if (activeThemeName === "Default Dark Modern") {
        var finalTheme = flattenTheme(DarkModern);
        finalTheme["input.foreground"] = "#9399B2";
        console.log('Custom Colors:', finalTheme);
        return finalTheme;
    }
    else if (activeThemeName === "Dark+") {
        var finalTheme = flattenTheme(DarkPlus);
        finalTheme["input.foreground"] = "#9399B2";
        console.log('Custom Colors:', finalTheme);
        return finalTheme;
    }
    else if (activeThemeName === "Visual Studio Dark") {
        var finalTheme = flattenTheme(DarkVS);
        finalTheme["input.foreground"] = "#9399B2";
        console.log('Custom Colors:', finalTheme);
        return finalTheme;
    }
    else if (activeThemeName === "Default High Contrast") {
        var finalTheme = flattenTheme(HCBLACK);
        finalTheme["input.foreground"] = "#9399B2";
        console.log('Custom Colors: DEFAULTT', finalTheme);
        return finalTheme;
    }
    else if (activeThemeName === "Light High Contrast") {
        var finalTheme = flattenTheme(HCLIGHT);
        finalTheme["input.foreground"] = "#9399B2";
        console.log('Custom Colors:', finalTheme);
        return finalTheme;
    }
    else if (activeThemeName === "Default Light Modern") {
        var finalTheme = flattenTheme(LIGHTMODERN);
        finalTheme["input.foreground"] = "#9399B2";
        console.log('Custom Colors:', finalTheme);
        return finalTheme;
    }
    else if (activeThemeName === "Light+") {
        var finalTheme = flattenTheme(LightPLUS);
        finalTheme["input.foreground"] = "#9399B2";
        console.log('Custom Colors:', finalTheme);
        return finalTheme;
    }
    else if (activeThemeName === "Light (Visual Studio)") {
        var finalTheme = flattenTheme(LIGHTVS);
        finalTheme["input.foreground"] = "#9399B2";
        console.log('Custom Colors:', finalTheme);
        return finalTheme;
    }
    // Search through installed extensions for the active theme
    for (const ext of vscode.extensions.all) {
        const contributes = ext.packageJSON.contributes;
        if (contributes && contributes.themes) {
            const theme = contributes.themes.find((t) => t.label === activeThemeName);
            if (theme) {
                // If the active theme is installed, read its file
                const themePath = path_1.default.join(ext.extensionPath, theme.path);
                console.log("I found theme path", themePath);
                try {
                    const themeContent = json5_1.default.parse(fs.readFileSync(themePath, 'utf-8'));
                    var finalTheme = flattenTheme(themeContent);
                    console.log("Final Theme", finalTheme);
                    return finalTheme;
                }
                catch (error) {
                    console.error(`Failed to read theme file for "${activeThemeName}":`, error);
                    break;
                }
            }
        }
    }
    // If the active theme is not part of an installed extension, fallback to customizations
    console.warn(`Active theme "${activeThemeName}" is not part of an installed extension.`);
    console.log('Custom Colors:', customColors);
    return customColors;
}
//# sourceMappingURL=colors.js.map