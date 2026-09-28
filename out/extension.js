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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const vaultIndex_1 = require("./vaultIndex");
const linkProvider_1 = require("./linkProvider");
const backlinksPanel_1 = require("./backlinksPanel");
const graphView_1 = require("./graphView");
async function activate(context) {
    const config = vscode.workspace.getConfiguration('obsidianLive');
    const configuredPath = config.get('vaultPath');
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const vaultRoot = configuredPath
        ? vscode.Uri.file(configuredPath)
        : workspaceFolder?.uri;
    if (!vaultRoot) {
        vscode.window.showWarningMessage('Obsidian Live: no vault found. Open the vault folder in VS Code or set obsidianLive.vaultPath.');
        return;
    }
    const index = new vaultIndex_1.VaultIndex(vaultRoot);
    await index.build();
    context.subscriptions.push(index.startWatching());
    const selector = { language: 'markdown', scheme: 'file' };
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(selector, new linkProvider_1.WikilinkDefinitionProvider(index)), vscode.languages.registerHoverProvider(selector, new linkProvider_1.WikilinkHoverProvider(index)), vscode.languages.registerCompletionItemProvider(selector, new linkProvider_1.WikilinkCompletionProvider(index), '['));
    const backlinksProvider = new backlinksPanel_1.BacklinksProvider(index);
    const tagsProvider = new backlinksPanel_1.TagsProvider(index);
    vscode.window.registerTreeDataProvider('obsidianLive.backlinks', backlinksProvider);
    vscode.window.registerTreeDataProvider('obsidianLive.tags', tagsProvider);
    // Jump-to-note-or-create-it on click, since default markdown links won't
    // resolve [[wikilink]] targets that don't exist yet.
    context.subscriptions.push(vscode.commands.registerCommand('obsidianLive.refreshIndex', async () => {
        await index.build();
        vscode.window.showInformationMessage('Obsidian vault index rebuilt.');
    }), vscode.commands.registerCommand('obsidianLive.openGraph', () => {
        graphView_1.GraphViewPanel.createOrShow(context.extensionUri, index);
    }), vscode.commands.registerCommand('obsidianLive.createNote', async () => {
        const name = await vscode.window.showInputBox({ prompt: 'New note name' });
        if (!name)
            return;
        const uri = vscode.Uri.joinPath(vaultRoot, `${name}.md`);
        const content = `---\ntitle: ${name}\ntags: []\n---\n\n`;
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
        await vscode.window.showTextDocument(uri);
    }), vscode.commands.registerCommand('obsidianLive.insertWikilink', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const pick = await vscode.window.showQuickPick(index.getAllNotes().map((n) => n.basename), { placeHolder: 'Link to note…' });
        if (!pick)
            return;
        editor.edit((edit) => edit.insert(editor.selection.active, `[[${pick}]]`));
    }), vscode.commands.registerCommand('obsidianLive.openDailyNote', async () => {
        const folder = config.get('dailyNoteFolder') || 'Daily';
        const today = new Date().toISOString().slice(0, 10);
        const uri = vscode.Uri.joinPath(vaultRoot, folder, `${today}.md`);
        try {
            await vscode.workspace.fs.stat(uri);
        }
        catch {
            await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(vaultRoot, folder));
            await vscode.workspace.fs.writeFile(uri, Buffer.from(`---\ntitle: ${today}\ntags: [daily]\n---\n\n`, 'utf8'));
        }
        await vscode.window.showTextDocument(uri);
    }));
    // Ctrl/Cmd+click on a [[wikilink]] to an as-yet-nonexistent note creates it.
    context.subscriptions.push(vscode.commands.registerCommand('obsidianLive._followOrCreate', async (target) => {
        const existing = index.resolveTargetUri(target);
        if (existing) {
            await vscode.window.showTextDocument(existing);
            return;
        }
        const uri = vscode.Uri.joinPath(vaultRoot, `${target}.md`);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(`---\ntitle: ${target}\ntags: []\n---\n\n`, 'utf8'));
        await vscode.window.showTextDocument(uri);
    }));
    vscode.window.setStatusBarMessage(`Obsidian Live: watching ${path.basename(vaultRoot.fsPath)}`, 4000);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map