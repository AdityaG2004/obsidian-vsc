import * as vscode from 'vscode';
import * as path from 'path';
import { VaultIndex } from './vaultIndex';

export class BacklinksProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private index: VaultIndex) {
    index.onDidChange(() => this._onDidChangeTreeData.fire());
    vscode.window.onDidChangeActiveTextEditor(() => this._onDidChangeTreeData.fire());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): vscode.ProviderResult<vscode.TreeItem[]> {
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

export class TagsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private index: VaultIndex) {
    index.onDidChange(() => this._onDidChangeTreeData.fire());
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
    if (element) {
      // element.id holds the tag name; list notes carrying that tag
      const tag = element.id!;
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