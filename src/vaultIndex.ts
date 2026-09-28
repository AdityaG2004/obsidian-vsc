import * as vscode from 'vscode';
import * as path from 'path';

// Matches [[Note Name]], [[Note Name|Alias]], [[Note Name#Heading]], ![[Embed]]
const WIKILINK_RE = /!?\[\[([^\]|#]+)(#[^\]|]+)?(\|[^\]]+)?\]\]/g;
// Matches #tag  (not inside code fences — good enough for a lightweight index)
const TAG_RE = /(^|\s)#([A-Za-z0-9_/-]+)/g;
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

export interface NoteLink {
  target: string;       // resolved note name (without extension)
  raw: string;           // original text inside [[ ]]
  isEmbed: boolean;
  range: vscode.Range;
}

export interface NoteRecord {
  uri: vscode.Uri;
  basename: string;      // filename without extension — used as the link key
  title: string;
  tags: Set<string>;
  links: NoteLink[];
  frontmatter: Record<string, unknown>;
}

export class VaultIndex {
  private notes = new Map<string, NoteRecord>();      // key: lowercase basename
  private backlinks = new Map<string, Set<string>>(); // key: lowercase basename -> set of basenames linking to it
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChange = this._onDidChange.event;
  private watcher?: vscode.FileSystemWatcher;

  constructor(private vaultRoot: vscode.Uri) {}

  async build(): Promise<void> {
    this.notes.clear();
    this.backlinks.clear();
    const files = await vscode.workspace.findFiles(
      new vscode.RelativePattern(this.vaultRoot, '**/*.md'),
      '**/{node_modules,.git,.obsidian}/**'
    );
    for (const file of files) {
      await this.indexFile(file);
    }
    this.rebuildBacklinks();
    this._onDidChange.fire();
  }

  startWatching(): vscode.Disposable {
    this.watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(this.vaultRoot, '**/*.md')
    );
    this.watcher.onDidChange(async (uri) => {
      await this.indexFile(uri);
      this.rebuildBacklinks();
      this._onDidChange.fire();
    });
    this.watcher.onDidCreate(async (uri) => {
      await this.indexFile(uri);
      this.rebuildBacklinks();
      this._onDidChange.fire();
    });
    this.watcher.onDidDelete((uri) => {
      const key = this.basenameKey(uri);
      this.notes.delete(key);
      this.rebuildBacklinks();
      this._onDidChange.fire();
    });
    return this.watcher;
  }

  private basenameKey(uri: vscode.Uri): string {
    return path.basename(uri.fsPath, '.md').toLowerCase();
  }

  private async indexFile(uri: vscode.Uri): Promise<void> {
    let text: string;
    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      text = Buffer.from(bytes).toString('utf8');
    } catch {
      return;
    }

    const basename = path.basename(uri.fsPath, '.md');
    const frontmatter = this.parseFrontmatter(text);
    const tags = this.extractTags(text, frontmatter);
    const links = this.extractLinks(text);

    this.notes.set(basename.toLowerCase(), {
      uri,
      basename,
      title: (frontmatter['title'] as string) || basename,
      tags,
      links,
      frontmatter,
    });
  }

  private parseFrontmatter(text: string): Record<string, unknown> {
    const match = text.match(FRONTMATTER_RE);
    if (!match) return {};
    const out: Record<string, unknown> = {};
    // Minimal YAML key: value / key: [a, b] parser — no external dep required.
    for (const line of match[1].split(/\r?\n/)) {
      const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (!kv) continue;
      const [, key, rawVal] = kv;
      if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
        out[key] = rawVal
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      } else {
        out[key] = rawVal.trim().replace(/^["']|["']$/g, '');
      }
    }
    return out;
  }

  private extractTags(text: string, frontmatter: Record<string, unknown>): Set<string> {
    const tags = new Set<string>();
    const fmTags = frontmatter['tags'];
    if (Array.isArray(fmTags)) {
      fmTags.forEach((t) => tags.add(String(t)));
    } else if (typeof fmTags === 'string' && fmTags.length) {
      fmTags.split(',').forEach((t) => tags.add(t.trim()));
    }
    let m: RegExpExecArray | null;
    TAG_RE.lastIndex = 0;
    while ((m = TAG_RE.exec(text))) {
      tags.add(m[2]);
    }
    return tags;
  }

  private extractLinks(text: string): NoteLink[] {
    const links: NoteLink[] = [];
    const lines = text.split(/\r?\n/);
    lines.forEach((line, lineNo) => {
      let m: RegExpExecArray | null;
      WIKILINK_RE.lastIndex = 0;
      while ((m = WIKILINK_RE.exec(line))) {
        const isEmbed = m[0].startsWith('!');
        const target = m[1].trim();
        const start = new vscode.Position(lineNo, m.index);
        const end = new vscode.Position(lineNo, m.index + m[0].length);
        links.push({
          target,
          raw: m[0],
          isEmbed,
          range: new vscode.Range(start, end),
        });
      }
    });
    return links;
  }

  private rebuildBacklinks(): void {
    this.backlinks.clear();
    for (const note of this.notes.values()) {
      for (const link of note.links) {
        const targetKey = link.target.split('#')[0].trim().toLowerCase();
        if (!this.backlinks.has(targetKey)) {
          this.backlinks.set(targetKey, new Set());
        }
        this.backlinks.get(targetKey)!.add(note.basename.toLowerCase());
      }
    }
  }

  getNote(basename: string): NoteRecord | undefined {
    return this.notes.get(basename.toLowerCase());
  }

  getAllNotes(): NoteRecord[] {
    return [...this.notes.values()];
  }

  getBacklinks(basename: string): NoteRecord[] {
    const keys = this.backlinks.get(basename.toLowerCase()) ?? new Set();
    return [...keys]
      .map((k) => this.notes.get(k))
      .filter((n): n is NoteRecord => !!n);
  }

  getAllTags(): Map<string, number> {
    const counts = new Map<string, number>();
    for (const note of this.notes.values()) {
      for (const tag of note.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return counts;
  }

  resolveTargetUri(target: string): vscode.Uri | undefined {
    const clean = target.split('#')[0].trim();
    return this.notes.get(clean.toLowerCase())?.uri;
  }
}
