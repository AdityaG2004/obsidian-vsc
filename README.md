# 🧠 Obsidian Live for VS Code

> **Turn any folder into a live, Obsidian-aware workspace — directly inside VS Code.**

A VS Code extension that brings the core power of **Obsidian** directly into your development workflow.

Open an existing Obsidian vault in VS Code and instantly get:

* 🔗 Clickable `[[wikilinks]]`
* 🔙 Backlinks
* 🏷️ Tags & frontmatter
* 🕸️ Interactive knowledge graph
* ✨ Wikilink autocomplete
* 👀 Hover previews
* 📝 Quick note creation
* 📅 Daily notes
* ⚡ Real-time vault updates

The best part?

> **VS Code and Obsidian use the exact same `.md` files.**

There is no import, export, conversion, or synchronization database.

Edit in Obsidian → VS Code updates.

Edit in VS Code → Obsidian updates.

It's the **same vault on disk**.

---

## ✨ Why Obsidian Live?

Obsidian is excellent for knowledge management.

VS Code is excellent for development.

This extension connects the two.

Instead of switching between applications while working on technical notes, documentation, research, architecture diagrams, or project knowledge, you can work with your Obsidian vault directly inside VS Code.

```text
              ┌──────────────────────┐
              │       Obsidian       │
              │                      │
              │      Your Vault      │
              └──────────┬───────────┘
                         │
                         │ Same .md files
                         │
              ┌──────────▼───────────┐
              │       VS Code        │
              │                      │
              │    Obsidian Live     │
              └──────────────────────┘
```

No syncing layer.

No database.

No proprietary format.

Just Markdown files.

---

# 🚀 Features

## 🔗 Wikilink Navigation

Use standard Obsidian wikilinks directly inside VS Code.

```md
[[Machine Learning]]
[[RAG Architecture]]
[[AI Agents]]
[[My Projects]]
```

Press:

```text
Ctrl + Click
```

or:

```text
Cmd + Click
```

on a wikilink to jump directly to the target note.

---

## ✨ Wikilink Autocomplete

Start typing:

```md
[[
```

and the extension automatically suggests existing notes from your vault.

Example:

```text
[[

    Machine Learning
    RAG Architecture
    AI Agents
    Backend Engineering
    Project Ideas
```

You don't need to remember the exact filename.

---

## 👀 Hover Previews

Hover over a wikilink to preview information about the target note without opening it.

Example:

```md
I'm currently working on [[RAG Architecture]].
```

Hovering over `[[RAG Architecture]]` can show:

```text
RAG Architecture

Tags:
#ai
#rag
#llm
```

This makes navigating large knowledge bases much faster.

---

# 🔙 Backlinks

The **Backlinks** panel automatically shows every note that links to the currently opened note.

Example:

```text
EXPLORER
│
├── 🔙 BACKLINKS
│   │
│   ├── AI Research
│   ├── RAG Notes
│   ├── Project Ideas
│   └── Backend Architecture
│
└── 🏷️ TAGS
    │
    ├── #ai
    ├── #backend
    ├── #rag
    └── #research
```

Open a note and its backlinks are automatically refreshed.

---

# 🏷️ Tag Explorer

The Tags panel indexes tags across the entire vault.

It supports inline Markdown tags:

```md
#ai
#machine-learning
#backend
#research
```

and frontmatter tags:

```yaml
---
tags: [ai, rag, backend]
---
```

Tags can be expanded to see every note that uses them.

---

# 🕸️ Interactive Knowledge Graph

Open the graph using:

```text
Obsidian: Open Graph View
```

The graph visualizes relationships between notes across your entire vault.

### Graph capabilities

* 🔍 Zoom in/out
* 🖱️ Drag nodes
* 🔗 Visualize note relationships
* 📄 Click nodes to open notes
* ⚡ Automatically refresh when files change
* 🧠 Explore your knowledge structure

Powered by **D3.js**.

```text
                     ┌──────────────┐
                     │ Machine      │
                     │ Learning     │
                     └──────┬───────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
          ┌──────────┐ ┌─────────┐ ┌──────────┐
          │   RAG    │ │   LLM   │ │  Python  │
          └────┬─────┘ └────┬────┘ └──────────┘
               │             │
               └──────┬──────┘
                      ▼
                ┌─────────────┐
                │ AI Agents   │
                └─────────────┘
```

---

# 📝 Quick Note Creation

Create a new note directly from VS Code.

Command:

```text
Obsidian: Create New Note
```

The extension creates the Markdown file inside your vault and makes it immediately available to the index.

---

# 📅 Daily Notes

Open or create today's daily note with:

```text
Obsidian: Open Today's Daily Note
```

This makes it easy to maintain a daily journal, development log, research notes, or work diary without leaving VS Code.

---

# 🔗 Insert Wikilink

Right-click inside a Markdown file and select:

```text
Insert Wikilink
```

A Quick Pick displays all notes in the vault.

Select one and the extension inserts:

```md
[[Selected Note]]
```

automatically.

---

# ⚡ Live Vault Synchronization

The extension uses VS Code's:

```ts
vscode.workspace.createFileSystemWatcher()
```

to monitor Markdown files.

When a file changes:

```text
Markdown file changed
        ↓
FileSystemWatcher
        ↓
Vault Index updated
        ↓
Backlinks recalculated
        ↓
Tags refreshed
        ↓
Graph updated
        ↓
VS Code UI refreshed
```

Changes can originate from:

* VS Code
* Obsidian
* Git
* External editors
* Scripts
* Other applications

The extension doesn't care where the change came from.

If the `.md` file changes, the workspace updates.

---

# 🔄 No Conversion Required

This extension does **not** convert your Obsidian vault.

It directly works with the files Obsidian already uses.

```text
MyVault/
│
├── Notes/
│   ├── AI.md
│   ├── RAG.md
│   └── Backend.md
│
├── Projects/
│   ├── Project A.md
│   └── Project B.md
│
├── Daily/
│   └── 2026-08-20.md
│
└── .obsidian/
```

The `.obsidian/` directory is left untouched.

Your existing vault remains an ordinary Obsidian vault.

---

# 🧩 Architecture

```text
┌────────────────────────────────────────────┐
│                 VS Code                    │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │          Extension Host              │  │
│  │                                      │  │
│  │  extension.ts                        │  │
│  │       │                              │  │
│  │       ▼                              │  │
│  │  ┌───────────────────────────────┐   │  │
│  │  │        Vault Index            │   │  │
│  │  │                               │   │  │
│  │  │  • Markdown files             │   │  │
│  │  │  • Wikilinks                  │   │  │
│  │  │  • Backlinks                  │   │  │
│  │  │  • Tags                       │   │  │
│  │  │  • Frontmatter                │   │  │
│  │  └───────────────┬───────────────┘   │  │
│  │                  │                   │  │
│  │       ┌──────────┼──────────┐        │  │
│  │       ▼          ▼          ▼        │  │
│  │   LinkProvider  Sidebar   Graph      │  │
│  │                  │        View        │  │
│  └──────────────────┼───────────────────┘  │
│                     │                      │
└─────────────────────┼──────────────────────┘
                      ▼
              ┌─────────────────┐
              │   Obsidian      │
              │     Vault       │
              │                 │
              │   *.md files    │
              └─────────────────┘
```

---

# 📁 Project Structure

```text
obsidian-vscode/
│
├── 📦 package.json
├── ⚙️ tsconfig.json
├── 🚫 .vscodeignore
│
├── .vscode/
│   ├── launch.json
│   └── tasks.json
│
└── src/
    │
    ├── extension.ts
    │   └── Extension activation
    │      Commands
    │      Providers
    │      Event wiring
    │
    ├── vaultIndex.ts
    │   └── Vault parsing
    │      File watching
    │      Wikilinks
    │      Backlinks
    │      Tags
    │
    ├── linkProvider.ts
    │   └── Go-to-definition
    │      Hover provider
    │      Autocomplete
    │
    ├── backlinksPanel.ts
    │   └── Backlinks TreeView
    │      Tags TreeView
    │
    └── graphView.ts
        └── D3 graph
            Webview
            Node interactions
```

---

# 🛠️ Tech Stack

| Technology                | Purpose                         |
| ------------------------- | ------------------------------- |
| **TypeScript**            | Extension development           |
| **Node.js**               | Build environment               |
| **VS Code Extension API** | Editor integration              |
| **D3.js**                 | Interactive graph visualization |
| **Markdown**              | Vault storage                   |
| **FileSystemWatcher**     | Real-time file monitoring       |
| **YAML parser**           | Lightweight frontmatter parsing |
| **npm**                   | Dependency management           |
| **vsce**                  | VSIX packaging                  |

---

# 📋 Requirements

| Tool           | Version               | Purpose                 |
| -------------- | --------------------- | ----------------------- |
| Node.js        | 18.x / 20.x LTS       | Build & compile         |
| npm            | Included with Node.js | Dependencies            |
| VS Code        | 1.85+                 | Extension host          |
| `@vscode/vsce` | ^2.24                 | VSIX packaging          |
| Obsidian vault | Any                   | Markdown knowledge base |

### Optional

If you want to regenerate the extension skeleton:

```bash
npm install -g yo generator-code
```

You **do not need Obsidian installed** to build or run the extension.

Obsidian is only useful for verifying the live file behavior.

---

# 🚀 Development Setup

Clone the repository:

```bash
git clone <repository-url>
```

Navigate to the project:

```bash
cd obsidian-vscode
```

Install dependencies:

```bash
npm install
```

Compile the extension:

```bash
npm run compile
```

---

# ▶️ Run in Development Mode

Open the project folder in VS Code:

```bash
code .
```

Then press:

```text
F5
```

or:

```text
Run → Start Debugging
```

VS Code opens a new:

```text
Extension Development Host
```

window.

Inside that window:

```text
File
  ↓
Open Folder...
  ↓
Select your Obsidian Vault
```

The extension activates automatically.

The vault is then indexed.

---

# 📂 Using a Different Vault

If your vault isn't the current VS Code workspace, configure:

```json
{
  "obsidianLive.vaultPath": "/absolute/path/to/MyVault"
}
```

Example:

```json
{
  "obsidianLive.vaultPath": "/Users/vishwas/Documents/MyVault"
}
```

On Windows:

```json
{
  "obsidianLive.vaultPath": "C:\\Users\\Vishwas\\Documents\\MyVault"
}
```

---

# 📦 Package the Extension

Install the VS Code Extension Manager:

```bash
npm install -g @vscode/vsce
```

Package the extension:

```bash
vsce package
```

This generates:

```text
obsidian-vscode-live-0.1.0.vsix
```

---

# 💻 Install the VSIX

Using the CLI:

```bash
code --install-extension obsidian-vscode-live-0.1.0.vsix
```

Or from VS Code:

```text
Extensions
    ↓
...
    ↓
Install from VSIX...
```

Select the generated `.vsix` file.

---

# 🧠 Frontmatter Support

The extension understands basic Obsidian frontmatter.

Example:

```yaml
---
title: Retrieval Augmented Generation
tags: [ai, rag, llm]
---
```

The built-in parser extracts:

```text
title
tags
```

and makes this information available to the extension.

---

# ⚠️ Known Limitations

The current implementation intentionally uses lightweight parsing in a few areas.

## 1. Simple YAML Parser

The built-in YAML parser supports basic:

```yaml
key: value
```

and:

```yaml
key: [a, b, c]
```

For example:

```yaml
---
title: AI Research
tags: [ai, research]
---
```

Complex nested YAML is not fully supported.

### Recommended improvement

Use:

```bash
npm install gray-matter
```

for full YAML/frontmatter support.

---

## 2. Tag Detection

Tags currently use a lightweight regular expression.

For example:

```md
This is a note about #machine-learning and #ai.
```

The parser detects:

```text
#machine-learning
#ai
```

However, it does not currently distinguish tags inside fenced code blocks.

Example:

````md
```python
#ai
#backend
```
````

Those tags may still be detected.

### Recommended improvement

Add Markdown-aware parsing that ignores fenced code blocks.

---

## 3. D3 CDN Dependency

The graph view currently loads D3.js from a CDN.

For example:

```text
https://cdn.jsdelivr.net/npm/d3@7
```

This means the graph requires network access when the webview loads D3.

### Recommended improvement

For a completely offline extension:

```text
media/
└── d3.min.js
```

Then load D3 as a local webview resource.

This would make the graph completely self-contained.

---

# 🔐 Data & Privacy

The extension operates directly on the user's local vault.

There is no requirement for:

* Cloud storage
* External database
* Vault migration
* Obsidian API
* Remote synchronization service

The extension reads and writes the same local Markdown files.

Your notes remain where they already are.

---

# 🗺️ Roadmap

Potential future improvements:

### 🔗 Advanced Wikilinks

* `[[Note#Heading]]`
* `[[Note#Heading|Display Text]]`
* `[[Note^Block]]`
* `![[Embedded Note]]`

### 📝 Markdown Features

* Embedded notes
* Embedded images
* Block references
* Heading navigation
* Callouts

### 🧠 Better Search

* Fuzzy note search
* Full-text search
* Tag filtering
* Recent notes
* Related notes

### 🕸️ Graph Improvements

* Local graph
* Global graph
* Tag-based filtering
* Folder filtering
* Search within graph
* Graph clustering
* Adjustable node physics

### 🎨 UI Improvements

* Obsidian-inspired theme
* Dark/light mode
* Better sidebar navigation
* Note preview cards
* Graph controls
* Custom icons

---

# 🎯 Use Cases

This extension is particularly useful for:

### 👨‍💻 Developers

Keep:

* Architecture notes
* API documentation
* Engineering decisions
* Debugging notes
* Project documentation

alongside your code.

### 🤖 AI/ML Engineers

Build a personal AI knowledge base containing:

```text
LLMs
 │
 ├── RAG
 │   ├── Embeddings
 │   ├── Vector Databases
 │   └── Retrieval
 │
 ├── Agents
 │   ├── LangGraph
 │   └── Tool Calling
 │
 └── ML
     ├── PyTorch
     └── Transformers
```

### 📚 Researchers

Connect papers, concepts, experiments, references, and research notes through wikilinks.

### 🧠 Knowledge Management

Turn your Markdown folder into a connected knowledge graph without changing your existing workflow.

---

# 💡 Design Philosophy

The project follows three principles:

### 1. Markdown First

Your notes are plain Markdown.

No proprietary database.

### 2. Local First

Your vault stays on your machine.

### 3. Zero Migration

Already have an Obsidian vault?

Just open it.

That's it.

---

# 📊 Feature Overview

| Feature                  | Status |
| ------------------------ | ------ |
| 🔗 Wikilink navigation   | ✅      |
| ✨ Wikilink autocomplete  | ✅      |
| 👀 Hover previews        | ✅      |
| 🔙 Backlinks             | ✅      |
| 🏷️ Tags                 | ✅      |
| 📋 Frontmatter           | ✅      |
| 🕸️ Graph view           | ✅      |
| 📝 Create note           | ✅      |
| 📅 Daily note            | ✅      |
| 🔗 Insert wikilink       | ✅      |
| ⚡ Live file watching     | ✅      |
| 🔄 Automatic re-indexing | ✅      |
| 🌐 Offline D3            | 🔜     |
| 🧠 Advanced YAML         | 🔜     |
| 🔗 Block references      | 🔜     |
| 📎 Embeds                | 🔜     |

---

# 🤝 Contributing

Contributions are welcome!

A typical workflow:

```bash
git checkout -b feature/my-feature

npm install

npm run compile

# Make your changes

git add .

git commit -m "Add my feature"

git push origin feature/my-feature
```

Then open a pull request.

---

# 🐛 Issues & Feature Requests

Found a bug?

Have an idea?

Open an issue describing:

```text
What happened?
What did you expect?
How can it be reproduced?
VS Code version
Extension version
Operating system
```

Screenshots and sample Markdown files are especially helpful.

---

# 📜 License

Add your preferred license here.

For example:

```text
MIT License
```

---

# ⭐ Final

**Obsidian Live for VS Code** brings the connected knowledge experience of Obsidian into the development environment you already use.

Your vault remains:

```text
Markdown
+
Local
+
Portable
+
Obsidian-compatible
```

while VS Code becomes a powerful development + knowledge workspace.

> **Your notes. Your files. Your knowledge graph. One workspace.**

⭐ If you find this project useful, consider giving it a star.

