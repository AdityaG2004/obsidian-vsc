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
exports.TagsProvider = exports.BacklinksProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
class BacklinksProvider {
    constructor(index) {
        this.index = index;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        index.onDidChange(() => this._onDidChangeTreeData.fire());
        vscode.window.onDidChangeActiveTextEditor(() => this._onDidChangeTreeData.fire());
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.md')) {
            return [new vscode.TreeItem('Open a note to see backlinks')];
        }
        const basename = path.basename(editor.document.fileName, '.md');
        const backlinks = this.index.getBacklinks(basename);
        if (!backlinks.length) {
            return [new vscode.TreeItem('No backlinks yet')];
        }
        return backlinks.map((note) => {
            const item = new vscode.TreeItem(note.title, vscode.TreeItemCollapsibleState.None);
            item.description = [...note.tags].map((t) => `#${t}`).join(' ');
            item.command = {
                command: 'vscode.open',
                title: 'Open note',
                arguments: [note.uri],
            };
            item.iconPath = new vscode.ThemeIcon('note');
            return item;
        });
    }
}
exports.BacklinksProvider = BacklinksProvider;
class TagsProvider {
    constructor(index) {
        this.index = index;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        index.onDidChange(() => this._onDidChangeTreeData.fire());
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element) {
            // element.id holds the tag name; list notes carrying that tag
            const tag = element.id;
            return this.index
                .getAllNotes()
                .filter((n) => n.tags.has(tag))
                .map((n) => {
                const item = new vscode.TreeItem(n.title, vscode.TreeItemCollapsibleState.None);
                item.command = { command: 'vscode.open', title: 'Open note', arguments: [n.uri] };
                return item;
            });
        }
        const tags = this.index.getAllTags();
        return [...tags.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([tag, count]) => {
            const item = new vscode.TreeItem(`#${tag}`, vscode.TreeItemCollapsibleState.Collapsed);
            item.id = tag;
            item.description = `${count}`;
            return item;
        });
    }
}
exports.TagsProvider = TagsProvider;
//# sourceMappingURL=backlinksPanel.js.map