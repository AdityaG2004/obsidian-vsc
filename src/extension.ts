import * as vscode from 'vscode';
import * as path from 'path';
import { VaultIndex } from './vaultIndex';
import {
  WikilinkDefinitionProvider,
  WikilinkHoverProvider,
  WikilinkCompletionProvider,
} from './linkProvider';
import { BacklinksProvider, TagsProvider } from './backlinksPanel';
import { GraphViewPanel } from './graphView';

export async function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('obsidianLive');
  const configuredPath = config.get<string>('vaultPath');
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

  const vaultRoot = configuredPath
    ? vscode.Uri.file(configuredPath)
    : workspaceFolder?.uri;

  if (!vaultRoot) {
    vscode.window.showWarningMessage(
      'Obsidian Live: no vault found. Open the vault folder in VS Code or set obsidianLive.vaultPath.'
    );
    return;
  }

  const index = new VaultIndex(vaultRoot);
  await index.build();
  context.subscriptions.push(index.startWatching());

  const selector: vscode.DocumentSelector = { language: 'markdown', scheme: 'file' };
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(selector, new WikilinkDefinitionProvider(index)),
    vscode.languages.registerHoverProvider(selector, new WikilinkHoverProvider(index)),
    vscode.languages.registerCompletionItemProvider(
      selector,
      new WikilinkCompletionProvider(index),
      '['
    )
  );

  const backlinksProvider = new BacklinksProvider(index);
  const tagsProvider = new TagsProvider(index);
  vscode.window.registerTreeDataProvider('obsidianLive.backlinks', backlinksProvider);
  vscode.window.registerTreeDataProvider('obsidianLive.tags', tagsProvider);

  // Jump-to-note-or-create-it on click, since default markdown links won't
  // resolve [[wikilink]] targets that don't exist yet.
  context.subscriptions.push(
    vscode.commands.registerCommand('obsidianLive.refreshIndex', async () => {
      await index.build();
      vscode.window.showInformationMessage('Obsidian vault index rebuilt.');
    }),

    vscode.commands.registerCommand('obsidianLive.openGraph', () => {
      GraphViewPanel.createOrShow(context.extensionUri, index);
    }),

    vscode.commands.registerCommand('obsidianLive.createNote', async () => {
      const name = await vscode.window.showInputBox({ prompt: 'New note name' });
      if (!name) return;
      const uri = vscode.Uri.joinPath(vaultRoot, `${name}.md`);
      const content = `---\ntitle: ${name}\ntags: []\n---\n\n`;
      await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
      await vscode.window.showTextDocument(uri);
    }),

    vscode.commands.registerCommand('obsidianLive.insertWikilink', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const pick = await vscode.window.showQuickPick(
        index.getAllNotes().map((n) => n.basename),
        { placeHolder: 'Link to note…' }
      );
      if (!pick) return;
      editor.edit((edit) => edit.insert(editor.selection.active, `[[${pick}]]`));
    }),

    vscode.commands.registerCommand('obsidianLive.openDailyNote', async () => {
      const folder = config.get<string>('dailyNoteFolder') || 'Daily';
      const today = new Date().toISOString().slice(0, 10);
      const uri = vscode.Uri.joinPath(vaultRoot, folder, `${today}.md`);
      try {
        await vscode.workspace.fs.stat(uri);
      } catch {
        await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(vaultRoot, folder));
        await vscode.workspace.fs.writeFile(
          uri,
          Buffer.from(`---\ntitle: ${today}\ntags: [daily]\n---\n\n`, 'utf8')
        );
      }
      await vscode.window.showTextDocument(uri);
    })
  );

  // Ctrl/Cmd+click on a [[wikilink]] to an as-yet-nonexistent note creates it.
  context.subscriptions.push(
    vscode.commands.registerCommand('obsidianLive._followOrCreate', async (target: string) => {
      const existing = index.resolveTargetUri(target);
      if (existing) {
        await vscode.window.showTextDocument(existing);
        return;
      }
      const uri = vscode.Uri.joinPath(vaultRoot, `${target}.md`);
      await vscode.workspace.fs.writeFile(
        uri,
        Buffer.from(`---\ntitle: ${target}\ntags: []\n---\n\n`, 'utf8')
      );
      await vscode.window.showTextDocument(uri);
    })
  );

  vscode.window.setStatusBarMessage(
    `Obsidian Live: watching ${path.basename(vaultRoot.fsPath)}`,
    4000
  );
}

export function deactivate() {}
