/**
 * CASCADYN - 2D Interactive Dependency Network Graph
 * HTML5 Canvas force/topological rendering of the city infrastructure graph,
 * directed weighted edges [0.0 - 1.0], and cascade wave propagation.
 */

import { sound } from '../engine/audioEngine.js';

export class NetworkGraphModal {
  constructor(containerElement, graph, onSelectService) {
    this.container = containerElement;
    this.graph = graph;
    this.onSelectService = onSelectService;
    this.element = null;
    this.canvas = null;
    this.ctx = null;
    this.nodes = [];
    this.animId = null;
    this.hoveredNode = null;
    this.selectedNodeId = null;

    this.init();
  }

  init() {
    this.element = document.createElement('div');
    this.element.className = 'modal-overlay';
    this.element.id = 'network-graph-modal';
    this.container.appendChild(this.element);
  }

  open(selectedId = null) {
    this.selectedNodeId = selectedId;

    this.element.innerHTML = `
      <div class="modal-card" style="max-width: 960px; height: 85vh; display: flex; flex-direction: column;">
        <div class="modal-header" style="flex-shrink: 0;">
          <div>
            <h3>Directed Weighted Dependency Graph</h3>
            <p style="font-size: 0.84rem; color: var(--text-muted);">
              Visualizing inter-service dependencies. Arrow directions indicate supply flow (Source → Dependent). Numbers indicate dependency strength [0.0 - 1.0].
            </p>
          </div>
          <button id="btn-close-graph-modal" class="modal-close-btn">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <!-- Canvas Container -->
        <div style="flex-grow: 1; position: relative; background: #F8FAFC; border-radius: var(--radius-md); border: 1px solid var(--border-light); overflow: hidden;">
          <canvas id="graph-canvas" style="width: 100%; height: 100%; display: block;"></canvas>
        </div>

        <!-- Legend -->
        <div style="flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; margin-top: 14px; font-size: 0.78rem; color: var(--text-muted);">
          <div style="display: flex; gap: 14px;">
            <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; border-radius: 50%; background: #10B981;"></span> Operational</span>
            <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; border-radius: 50%; background: #F59E0B;"></span> Degraded</span>
            <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; border-radius: 50%; background: #EF4444;"></span> Failed</span>
          </div>
          <div>Click any node to focus & inspect service in 3D City</div>
        </div>
      </div>
    `;

    this.element.classList.add('open');
    if (window.lucide) window.lucide.createIcons();

    this.setupCanvas();
    this.bindEvents();
  }

  setupCanvas() {
    this.canvas = this.element.querySelector('#graph-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Layout Nodes in an intelligent hierarchical / circular arrangement
    const services = this.graph.getAllServices();
    const count = services.length;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.38;

    this.nodes = services.map((s, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      return {
        id: s.service_id,
        name: s.service_name,
        status: s.status,
        criticality: s.criticality,
        badgeColor: s.badge_color || '#FF2E93',
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        radius: s.criticality === 'Critical' ? 32 : s.criticality === 'High' ? 28 : 24
      };
    });

    this.startAnimation();
  }

  startAnimation() {
    let particleOffset = 0;

    const draw = () => {
      if (!this.element.classList.contains('open')) return;
      
      const width = this.canvas.width / (window.devicePixelRatio || 1);
      const height = this.canvas.height / (window.devicePixelRatio || 1);

      this.ctx.clearRect(0, 0, width, height);

      particleOffset += 0.015;
      if (particleOffset > 1) particleOffset = 0;

      // 1. Draw Directed Edges with Arrows and Strength Labels
      const services = this.graph.getAllServices();
      services.forEach(source => {
        const sourceNode = this.nodes.find(n => n.id === source.service_id);
        if (!sourceNode) return;

        (source.connected_services || []).forEach(edge => {
          const targetNode = this.nodes.find(n => n.id === edge.target_id);
          if (!targetNode) return;

          const isHighlight = this.selectedNodeId === source.service_id || this.selectedNodeId === targetNode.id;
          const isFailed = source.status === 'Failed' || targetNode.status === 'Failed';

          // Draw Line
          this.ctx.beginPath();
          this.ctx.moveTo(sourceNode.x, sourceNode.y);
          this.ctx.lineTo(targetNode.x, targetNode.y);
          this.ctx.strokeStyle = isFailed ? '#EF4444' : isHighlight ? '#FF2E93' : '#CBD5E1';
          this.ctx.lineWidth = isHighlight ? 2.5 : 1.5;
          this.ctx.setLineDash(isFailed ? [6, 6] : []);
          this.ctx.stroke();
          this.ctx.setLineDash([]);

          // Arrow head
          const angle = Math.atan2(targetNode.y - sourceNode.y, targetNode.x - sourceNode.x);
          const arrowDist = targetNode.radius + 6;
          const arrowX = targetNode.x - Math.cos(angle) * arrowDist;
          const arrowY = targetNode.y - Math.sin(angle) * arrowDist;

          this.ctx.beginPath();
          this.ctx.moveTo(arrowX, arrowY);
          this.ctx.lineTo(arrowX - 10 * Math.cos(angle - Math.PI / 6), arrowY - 10 * Math.sin(angle - Math.PI / 6));
          this.ctx.lineTo(arrowX - 10 * Math.cos(angle + Math.PI / 6), arrowY - 10 * Math.sin(angle + Math.PI / 6));
          this.ctx.fillStyle = isFailed ? '#EF4444' : isHighlight ? '#FF2E93' : '#94A3B8';
          this.ctx.fill();

          // Animated energy pulse particle along line
          const curT = (particleOffset + edge.strength) % 1;
          const px = sourceNode.x + (targetNode.x - sourceNode.x) * curT;
          const py = sourceNode.y + (targetNode.y - sourceNode.y) * curT;
          this.ctx.beginPath();
          this.ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          this.ctx.fillStyle = isFailed ? '#EF4444' : '#00D2FF';
          this.ctx.fill();

          // Strength Tag
          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;
          this.ctx.fillStyle = '#64748B';
          this.ctx.font = '600 10px "JetBrains Mono"';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(edge.strength.toFixed(2), midX, midY - 4);
        });
      });

      // 2. Draw Nodes
      this.nodes.forEach(node => {
        const isSelected = this.selectedNodeId === node.id;
        const isHovered = this.hoveredNode && this.hoveredNode.id === node.id;

        // Outer Glow / Ring
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius + (isSelected ? 8 : 4), 0, Math.PI * 2);
        this.ctx.fillStyle = isSelected ? 'rgba(255, 46, 147, 0.25)' : 'rgba(241, 245, 249, 0.9)';
        this.ctx.fill();

        // Node Body
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fill();
        this.ctx.strokeStyle = node.status === 'Operational' ? '#10B981' : node.status === 'Degraded' ? '#F59E0B' : '#EF4444';
        this.ctx.lineWidth = isSelected || isHovered ? 4 : 2.5;
        this.ctx.stroke();

        // Node Text ID & Label
        this.ctx.fillStyle = '#0F172A';
        this.ctx.font = '700 11px Outfit, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(node.id, node.x, node.y + 4);

        // Sub-label below
        this.ctx.fillStyle = '#475569';
        this.ctx.font = '500 10px Inter, sans-serif';
        this.ctx.fillText(node.name.split('/')[0].trim(), node.x, node.y + node.radius + 14);
      });

      this.animId = requestAnimationFrame(draw);
    };

    draw();
  }

  bindEvents() {
    const closeBtn = this.element.querySelector('#btn-close-graph-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        sound.playClick();
        this.close();
      });
    }

    if (this.canvas) {
      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        this.hoveredNode = this.nodes.find(n => {
          const dx = n.x - mouseX;
          const dy = n.y - mouseY;
          return Math.sqrt(dx * dx + dy * dy) <= n.radius;
        });

        this.canvas.style.cursor = this.hoveredNode ? 'pointer' : 'default';
      });

      this.canvas.addEventListener('click', (e) => {
        if (this.hoveredNode) {
          sound.playClick();
          this.selectedNodeId = this.hoveredNode.id;
          if (this.onSelectService) this.onSelectService(this.hoveredNode.id);
          this.close();
        }
      });
    }
  }

  close() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.element.classList.remove('open');
  }
}
