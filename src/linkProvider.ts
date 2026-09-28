import * as vscode from 'vscode';
import { VaultIndex } from './vaultIndex';

const WIKILINK_AT_CURSOR = /\[\[([^\]|#]+)(#[^\]|]+)?(\|[^\]]+)?\]\]/g;

function findLinkAt(document: vscode.TextDocument, position: vscode.Position) {
  const line = document.lineAt(position.line).text;
  let m: RegExpExecArray | null;
  WIKILINK_AT_CURSOR.lastIndex = 0;
  while ((m = WIKILINK_AT_CURSOR.exec(line))) {
    const start = m.index;
    const end = m.index + m[0].length;
    if (position.character >= start && position.character <= end) {
      return { target: m[1].trim(), start, end };
    }
  }
  return undefined;
}

export class WikilinkDefinitionProvider implements vscode.DefinitionProvider {
  constructor(private index: VaultIndex) {}

  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.ProviderResult<vscode.Definition> {
    const link = findLinkAt(document, position);
    if (!link) return undefined;
    const uri = this.index.resolveTargetUri(link.target);
    if (!uri) return undefined;
    return new vscode.Location(uri, new vscode.Position(0, 0));
  }
}

export class WikilinkHoverProvider implements vscode.HoverProvider {
  constructor(private index: VaultIndex) {}

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.ProviderResult<vscode.Hover> {
    const link = findLinkAt(document, position);
    if (!link) return undefined;
    const note = this.index.getNote(link.target.split('#')[0]);
    if (!note) {
      const md = new vscode.MarkdownString(`*Note not found — will be created on click.*`);
      return new vscode.Hover(md);
    }
    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**${note.title}**\n\n`);
    if (note.tags.size) {
      md.appendMarkdown([...note.tags].map((t) => `\`#${t}\``).join(' ') + '\n\n');
    }
    md.appendMarkdown(`${note.links.length} outgoing link(s)`);
    return new vscode.Hover(md);
  }
}

// Autocomplete note names inside [[ ]]
export class WikilinkCompletionProvider implements vscode.CompletionItemProvider {
  constructor(private index: VaultIndex) {}

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.ProviderResult<vscode.CompletionItem[]> {
    const line = document.lineAt(position.line).text.slice(0, position.character);
    const open = line.lastIndexOf('[[');
    if (open === -1 || line.slice(open).includes(']]')) return undefined;

    return this.index.getAllNotes().map((note) => {
      const item = new vscode.CompletionItem(note.basename, vscode.CompletionItemKind.File);
      item.detail = 'Obsidian note';
      item.insertText = note.basename;
      return item;
    });
  }
}
