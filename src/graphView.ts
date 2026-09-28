import * as vscode from 'vscode';
import { VaultIndex } from './vaultIndex';

export class GraphViewPanel {
  public static current: GraphViewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  static createOrShow(extensionUri: vscode.Uri, index: VaultIndex) {
    if (GraphViewPanel.current) {
      GraphViewPanel.current.panel.reveal();
      GraphViewPanel.current.update();
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'obsidianGraph',
      'Obsidian Graph',
      vscode.ViewColumn.Beside,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    GraphViewPanel.current = new GraphViewPanel(panel, extensionUri, index);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private extensionUri: vscode.Uri,
    private index: VaultIndex
  ) {
    this.panel = panel;
    this.panel.webview.html = this.getHtml();
    this.update();

    this.index.onDidChange(() => this.update(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage((msg) => {
      if (msg.type === 'openNote') {
        const note = this.index.getNote(msg.basename);
        if (note) vscode.window.showTextDocument(note.uri);
      }
    });

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  private update() {
    const notes = this.index.getAllNotes();
    const nodes = notes.map((n) => ({
      id: n.basename,
      label: n.title,
      tags: [...n.tags],
      group: [...n.tags][0] ?? 'untagged',
    }));
    const nodeKeys = new Set(nodes.map((n) => n.id.toLowerCase()));
    const links: { source: string; target: string }[] = [];
    for (const n of notes) {
      for (const l of n.links) {
        const targetKey = l.target.split('#')[0].trim();
        if (nodeKeys.has(targetKey.toLowerCase())) {
          links.push({ source: n.basename, target: targetKey });
        }
      }
    }
    this.panel.webview.postMessage({ type: 'graphData', nodes, links });
  }

  private getHtml(): string {
    return /* html */ `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  html, body { margin:0; padding:0; height:100%; background: var(--vscode-editor-background); }
  svg { width:100%; height:100vh; }
  .node circle { stroke: var(--vscode-editor-background); stroke-width: 1.5px; cursor:pointer; }
  .node text { fill: var(--vscode-editor-foreground); font-size: 10px; font-family: var(--vscode-font-family); pointer-events:none; }
  .link { stroke: var(--vscode-editorWidget-border, #888); stroke-opacity: 0.5; }
</style>
</head>
<body>
<svg id="graph"></svg>
<script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
<script>
  const vscode = acquireVsCodeApi();
  const svg = d3.select('#graph');
  let width = window.innerWidth, height = window.innerHeight;
  svg.attr('viewBox', [0,0,width,height]);

  const container = svg.append('g');
  svg.call(d3.zoom().scaleExtent([0.1, 5]).on('zoom', (e) => container.attr('transform', e.transform)));

  let simulation;

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'graphData') render(msg.nodes, msg.links);
  });

  function render(nodes, links) {
    container.selectAll('*').remove();
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(70))
      .force('charge', d3.forceManyBody().strength(-180))
      .force('center', d3.forceCenter(width/2, height/2))
      .force('collide', d3.forceCollide(24));

    const link = container.append('g').selectAll('line')
      .data(links).join('line').attr('class', 'link');

    const node = container.append('g').selectAll('g')
      .data(nodes).join('g').attr('class', 'node')
      .call(drag(simulation))
      .on('click', (_, d) => vscode.postMessage({ type: 'openNote', basename: d.id }));

    node.append('circle')
      .attr('r', 7)
      .attr('fill', d => color(d.group));

    node.append('text')
      .attr('dx', 10)
      .attr('dy', 4)
      .text(d => d.label);

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => \`translate(\${d.x},\${d.y})\`);
    });
  }

  function drag(sim) {
    function started(event) {
      if (!event.active) sim.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x; event.subject.fy = event.subject.y;
    }
    function dragged(event) { event.subject.fx = event.x; event.subject.fy = event.y; }
    function ended(event) {
      if (!event.active) sim.alphaTarget(0);
      event.subject.fx = null; event.subject.fy = null;
    }
    return d3.drag().on('start', started).on('drag', dragged).on('end', ended);
  }
</script>
</body>
</html>`;
  }

  dispose() {
    GraphViewPanel.current = undefined;
    this.panel.dispose();
    this.disposables.forEach((d) => d.dispose());
  }
}
