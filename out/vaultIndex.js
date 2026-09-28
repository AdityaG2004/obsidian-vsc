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
exports.VaultIndex = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
// Matches [[Note Name]], [[Note Name|Alias]], [[Note Name#Heading]], ![[Embed]]
const WIKILINK_RE = /!?\[\[([^\]|#]+)(#[^\]|]+)?(\|[^\]]+)?\]\]/g;
// Matches #tag  (not inside code fences — good enough for a lightweight index)
const TAG_RE = /(^|\s)#([A-Za-z0-9_/-]+)/g;
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;
class VaultIndex {
    constructor(vaultRoot) {
        this.vaultRoot = vaultRoot;
        this.notes = new Map(); // key: lowercase basename
        this.backlinks = new Map(); // key: lowercase basename -> set of basenames linking to it
        this._onDidChange = new vscode.EventEmitter();
        this.onDidChange = this._onDidChange.event;
    }
    async build() {
        this.notes.clear();
        this.backlinks.clear();
        const files = await vscode.workspace.findFiles(new vscode.RelativePattern(this.vaultRoot, '**/*.md'), '**/{node_modules,.git,.obsidian}/**');
        for (const file of files) {
            await this.indexFile(file);
        }
        this.rebuildBacklinks();
        this._onDidChange.fire();
    }
    startWatching() {
        this.watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(this.vaultRoot, '**/*.md'));
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
    basenameKey(uri) {
        return path.basename(uri.fsPath, '.md').toLowerCase();
    }
    async indexFile(uri) {
        let text;
        try {
            const bytes = await vscode.workspace.fs.readFile(uri);
            text = Buffer.from(bytes).toString('utf8');
        }
        catch {
            return;
        }
        const basename = path.basename(uri.fsPath, '.md');
        const frontmatter = this.parseFrontmatter(text);
        const tags = this.extractTags(text, frontmatter);
        const links = this.extractLinks(text);
        this.notes.set(basename.toLowerCase(), {
            uri,
            basename,
            title: frontmatter['title'] || basename,
            tags,
            links,
            frontmatter,
        });
    }
    parseFrontmatter(text) {
        const match = text.match(FRONTMATTER_RE);
        if (!match)
            return {};
        const out = {};
        // Minimal YAML key: value / key: [a, b] parser — no external dep required.
        for (const line of match[1].split(/\r?\n/)) {
            const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
            if (!kv)
                continue;
            const [, key, rawVal] = kv;
            if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
                out[key] = rawVal
                    .slice(1, -1)
                    .split(',')
                    .map((s) => s.trim().replace(/^["']|["']$/g, ''))
                    .filter(Boolean);
            }
            else {
                out[key] = rawVal.trim().replace(/^["']|["']$/g, '');
            }
        }
        return out;
    }
    extractTags(text, frontmatter) {
        const tags = new Set();
        const fmTags = frontmatter['tags'];
        if (Array.isArray(fmTags)) {
            fmTags.forEach((t) => tags.add(String(t)));
        }
        else if (typeof fmTags === 'string' && fmTags.length) {
            fmTags.split(',').forEach((t) => tags.add(t.trim()));
        }
        let m;
        TAG_RE.lastIndex = 0;
        while ((m = TAG_RE.exec(text))) {
            tags.add(m[2]);
        }
        return tags;
    }
    extractLinks(text) {
        const links = [];
        const lines = text.split(/\r?\n/);
        lines.forEach((line, lineNo) => {
            let m;
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
    rebuildBacklinks() {
        this.backlinks.clear();
        for (const note of this.notes.values()) {
            for (const link of note.links) {
                const targetKey = link.target.split('#')[0].trim().toLowerCase();
                if (!this.backlinks.has(targetKey)) {
                    this.backlinks.set(targetKey, new Set());
                }
                this.backlinks.get(targetKey).add(note.basename.toLowerCase());
            }
        }
    }
    getNote(basename) {
        return this.notes.get(basename.toLowerCase());
    }
    getAllNotes() {
        return [...this.notes.values()];
    }
    getBacklinks(basename) {
        const keys = this.backlinks.get(basename.toLowerCase()) ?? new Set();
        return [...keys]
            .map((k) => this.notes.get(k))
            .filter((n) => !!n);
    }
    getAllTags() {
        const counts = new Map();
        for (const note of this.notes.values()) {
            for (const tag of note.tags) {
                counts.set(tag, (counts.get(tag) ?? 0) + 1);
            }
        }
        return counts;
    }
    resolveTargetUri(target) {
        const clean = target.split('#')[0].trim();
        return this.notes.get(clean.toLowerCase())?.uri;
    }
}
exports.VaultIndex = VaultIndex;
//# sourceMappingURL=vaultIndex.js.map