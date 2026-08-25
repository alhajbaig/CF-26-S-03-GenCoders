/**
 * CASCADYN - Service Inspector Panel
 * Detailed slide-over panel displaying metrics, dependency graph connections,
 * dependency strengths [0.0 - 1.0], upstream feeds, downstream dependents,
 * and interactive stress-test failure triggers.
 */

import { sound } from '../engine/audioEngine.js';

export class ServiceInspector {
  constructor(containerElement, graph, onTriggerFailure, onMitigateService, onFocusService) {
    this.container = containerElement;
    this.graph = graph;
    this.onTriggerFailure = onTriggerFailure;
    this.onMitigateService = onMitigateService;
    this.onFocusService = onFocusService;
    this.currentServiceId = null;
    this.element = null;

    this.init();
  }

  init() {
    this.element = document.createElement('div');
    this.element.className = 'service-inspector-panel collapsed';
    this.element.id = 'service-inspector';
    this.container.appendChild(this.element);
  }

  inspect(serviceId) {
    this.currentServiceId = serviceId;
    const service = this.graph.getService(serviceId);
    if (!service) {
      this.close();
      return;
    }

    const upstream = this.graph.getUpstreamDependencies(serviceId);
    const downstream = this.graph.getDownstreamDependents(serviceId);
    const metrics = this.graph.getDependencyMetrics(serviceId);

    const statusClass = service.status.toLowerCase();

    this.element.innerHTML = `
      <!-- Header -->
      <div class="inspector-header">
        <div>
          <span class="inspector-header-id">${service.service_id} • ${service.category.toUpperCase()}</span>
          <h2>${service.service_name}</h2>
        </div>
        <button id="btn-close-inspector" class="btn-icon" title="Close Panel">
          <i data-lucide="x" style="width: 18px; height: 18px;"></i>
        </button>
      </div>

      <!-- Current Status Banner -->
      <div class="inspector-status-banner ${statusClass}">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.2rem;">●</span>
          <span>Status: ${service.status.toUpperCase()}</span>
        </div>
        <span style="font-size: 0.8rem; font-weight: 600; opacity: 0.85;">
          ${service.status === 'Operational' ? 'Active Feed' : service.status === 'Failed' ? 'Disrupted' : 'Sub-Optimal'}
        </span>
      </div>

      <!-- Core Metrics Grid -->
      <div class="inspector-grid">
        <div class="stat-tile">
          <div class="stat-tile-label">Criticality Tier</div>
          <div class="stat-tile-value" style="color: ${service.criticality === 'Critical' ? '#EF4444' : service.criticality === 'High' ? '#F97316' : '#F59E0B'};">
            ${service.criticality}
          </div>
        </div>

        <div class="stat-tile">
          <div class="stat-tile-label">Govt Repair Budget</div>
          <div class="stat-tile-value" style="color: #00D2FF; font-family: var(--font-mono); font-size: 1rem;">
            $${((service.repair_budget_usd || 2000000) / 1000000).toFixed(2)}M
          </div>
        </div>

        <div class="stat-tile">
          <div class="stat-tile-label">Economic Bleed Rate</div>
          <div class="stat-tile-value" style="color: #EF4444; font-family: var(--font-mono); font-size: 1rem;">
            $${((service.hourly_economic_bleed_usd || 500000) / 1000).toFixed(0)}k <span style="font-size: 0.7rem; color: var(--text-muted);">/ hr</span>
          </div>
        </div>

        <div class="stat-tile">
          <div class="stat-tile-label">Recovery Time (MTTR)</div>
          <div class="stat-tile-value" style="font-size: 1rem;">
            ${service.recovery_time}
          </div>
        </div>
      </div>

      <!-- Description & Backup Infrastructure -->
      <div style="padding: 12px 14px; background: var(--bg-primary); border-radius: var(--radius-md); border: 1px solid var(--border-light);">
        <div style="font-size: 0.76rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">System Overview</div>
        <p style="font-size: 0.85rem; line-height: 1.45; color: var(--text-secondary); margin-bottom: 8px;">${service.description}</p>
        
        <div style="font-size: 0.74rem; color: var(--text-muted);">
          <strong style="color: var(--text-primary);">Backup Mechanism:</strong> ${service.backup_system || 'Standard Battery / Grid Redundancy'}
        </div>
      </div>

      <!-- Downstream Dependents (Who Relies on This Service) -->
      <div class="connected-services-section">
        <h4>
          <span>Downstream Dependents (${downstream.length})</span>
          <span style="font-size: 0.74rem; font-weight: 600; color: var(--text-muted);">Outgoing Ripple</span>
        </h4>

        <div class="dependency-node-list">
          ${downstream.length === 0 ? `
            <div style="font-size: 0.8rem; color: var(--text-muted); padding: 8px; font-style: italic;">
              No downstream dependents. End-node consumer.
            </div>
          ` : downstream.map(edge => `
            <div class="dependency-link-card" data-target-id="${edge.service.service_id}" style="border-left-color: ${edge.service.badge_color || '#FF2E93'};">
              <div class="dep-header">
                <span class="dep-name">${edge.service.service_name}</span>
                <span class="dep-strength-badge" title="Dependency Coupling Strength">
                  Strength: ${(edge.strength * 100).toFixed(0)}% (${edge.strength})
                </span>
              </div>
              <p class="dep-desc">${edge.description}</p>
              <div class="strength-bar-bg">
                <div class="strength-bar-fill" style="width: ${edge.strength * 100}%;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Upstream Dependencies (Who Feeds This Service) -->
      <div class="connected-services-section">
        <h4>
          <span>Upstream Inputs (${upstream.length})</span>
          <span style="font-size: 0.74rem; font-weight: 600; color: var(--text-muted);">Required Inputs</span>
        </h4>

        <div class="dependency-node-list">
          ${upstream.length === 0 ? `
            <div style="font-size: 0.8rem; color: var(--text-muted); padding: 8px; font-style: italic;">
              Primary source provider (no upstream feeds required).
            </div>
          ` : upstream.map(edge => `
            <div class="dependency-link-card" data-target-id="${edge.service.service_id}" style="border-left-color: #00D2FF;">
              <div class="dep-header">
                <span class="dep-name">${edge.service.service_name}</span>
                <span class="dep-strength-badge" style="background: rgba(0, 210, 255, 0.15); color: #0284C7;">
                  Feed Weight: ${(edge.strength * 100).toFixed(0)}% (${edge.strength})
                </span>
              </div>
              <p class="dep-desc">${edge.description}</p>
              <div class="strength-bar-bg">
                <div class="strength-bar-fill" style="width: ${edge.strength * 100}%; background: #00D2FF;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Action Buttons: Simulate Failure vs Mitigate -->
      <div class="inspector-actions">
        ${service.status === 'Operational' ? `
          <button id="btn-stress-fail" class="btn btn-red" style="width: 100%;">
            <i data-lucide="zap-off" style="width: 18px; height: 18px;"></i>
            Trigger Failure & Simulate Cascade
          </button>
        ` : `
          <button id="btn-mitigate-service" class="btn btn-primary" style="width: 100%;">
            <i data-lucide="check-circle" style="width: 18px; height: 18px;"></i>
            Deploy Emergency Recovery (Mitigate)
          </button>
        `}
      </div>
    `;

    this.element.classList.remove('collapsed');
    if (window.lucide) window.lucide.createIcons();

    this.bindEvents();
  }

  bindEvents() {
    // Close Button
    const closeBtn = this.element.querySelector('#btn-close-inspector');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        sound.playClick();
        this.close();
      });
    }

    // Trigger Failure Button
    const failBtn = this.element.querySelector('#btn-stress-fail');
    if (failBtn) {
      failBtn.addEventListener('click', () => {
        sound.playAlarm();
        if (this.onTriggerFailure) this.onTriggerFailure(this.currentServiceId);
      });
    }

    // Mitigate Button
    const mitBtn = this.element.querySelector('#btn-mitigate-service');
    if (mitBtn) {
      mitBtn.addEventListener('click', () => {
        sound.playRecovery();
        if (this.onMitigateService) this.onMitigateService(this.currentServiceId);
      });
    }

    // Connected Service Links Click (Jump to that service)
    const linkCards = this.element.querySelectorAll('.dependency-link-card');
    linkCards.forEach(card => {
      card.addEventListener('mouseenter', () => sound.playHover());
      card.addEventListener('click', () => {
        sound.playClick();
        const targetId = card.getAttribute('data-target-id');
        if (targetId && this.onFocusService) {
          this.onFocusService(targetId);
        }
      });
    });
  }

  close() {
    this.currentServiceId = null;
    this.element.classList.add('collapsed');
  }

  isOpen() {
    return !this.element.classList.contains('collapsed');
  }
}
