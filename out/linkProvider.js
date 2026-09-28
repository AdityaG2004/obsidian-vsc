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
exports.WikilinkCompletionProvider = exports.WikilinkHoverProvider = exports.WikilinkDefinitionProvider = void 0;
const vscode = __importStar(require("vscode"));
const WIKILINK_AT_CURSOR = /\[\[([^\]|#]+)(#[^\]|]+)?(\|[^\]]+)?\]\]/g;
function findLinkAt(document, position) {
    const line = document.lineAt(position.line).text;
    let m;
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
class WikilinkDefinitionProvider {
    constructor(index) {
        this.index = index;
    }
    provideDefinition(document, position) {
        const link = findLinkAt(document, position);
        if (!link)
            return undefined;
        const uri = this.index.resolveTargetUri(link.target);
        if (!uri)
            return undefined;
        return new vscode.Location(uri, new vscode.Position(0, 0));
    }
}
exports.WikilinkDefinitionProvider = WikilinkDefinitionProvider;
class WikilinkHoverProvider {
    constructor(index) {
        this.index = index;
    }
    provideHover(document, position) {
        const link = findLinkAt(document, position);
        if (!link)
            return undefined;
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
exports.WikilinkHoverProvider = WikilinkHoverProvider;
// Autocomplete note names inside [[ ]]
class WikilinkCompletionProvider {
    constructor(index) {
        this.index = index;
    }
    provideCompletionItems(document, position) {
        const line = document.lineAt(position.line).text.slice(0, position.character);
        const open = line.lastIndexOf('[[');
        if (open === -1 || line.slice(open).includes(']]'))
            return undefined;
        return this.index.getAllNotes().map((note) => {
            const item = new vscode.CompletionItem(note.basename, vscode.CompletionItemKind.File);
            item.detail = 'Obsidian note';
            item.insertText = note.basename;
            return item;
        });
    }
}
exports.WikilinkCompletionProvider = WikilinkCompletionProvider;
//# sourceMappingURL=linkProvider.js.map