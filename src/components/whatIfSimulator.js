/**
 * CASCADYN - What-If Sandbox Simulator
 * Pre-computes full cascade plan from dataset adjacency, then replays it as a timed simulation.
 * Includes Government Emergency Disaster Budgeting, Real-Time Economic Bleed, and Capital Recovery Metrics.
 */

import { sound } from '../engine/audioEngine.js';

export class WhatIfSimulator {
  constructor(containerElement, graph, onTriggerShockwave, onFocusService) {
    this.container = containerElement;
    this.graph = graph;
    this.onTriggerShockwave = onTriggerShockwave;
    this.onFocusService = onFocusService;

    this.simInterval = null;
    this.isSimulating = false;

    // Simulation Parameters
    this.selectedServices = new Set();
    this.severity = 0.8;
    this.duration = 60;
    this.recoveryStrategy = 'automated';
    this.disasterFund = 15000000;             // $15M default municipal emergency fund
    this.budgetAllocationMode = 'optimal';     // 'optimal' | 'life_safety' | 'upstream_root' | 'austerity'

    // Live Financial & Sim state
    this.simTime = 0;
    this.simPhase = 'Waiting';
    this.affectedServices = new Set();
    this.accumulatedRepairCost = 0;            // Hardware / physical repair costs ($)
    this.accumulatedEconomicLoss = 0;          // Downtown & business stoppage loss ($)
    this.accumulatedEmergencyOps = 0;          // Public safety & first responder overtime ($)

    // Pre-computed cascade plan
    this.cascadePlan = [];
    this.maxPredictedDepth = 0;
    this.totalPredictedAffected = 0;
    this.peakResilience = 100;
    this.recoveryStartSimTime = 0;

    // Scheduled event map
    this.eventSchedule = new Map();
    this.originalStatuses = null;

    this.init();
  }

  init() {
    this.element = document.createElement('div');
    this.element.id = 'what-if-sandbox';
    this.element.className = 'what-if-sandbox-container';
    this.container.appendChild(this.element);
    this.renderForm();

    this.graph.subscribe(() => {
      if (!this.isSimulating) {
        const validIds = new Set(this.graph.getAllServices().map((s) => s.service_id));
        for (const id of this.selectedServices) {
          if (!validIds.has(id)) this.selectedServices.delete(id);
        }
        this.renderForm();
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS & FORMATTERS
  // ─────────────────────────────────────────────────────────────────────────

  _emoji(id) {
    if (id.includes('PWR')) return '⚡';
    if (id.includes('WTR')) return '💧';
    if (id.includes('TEL')) return '📡';
    if (id.includes('HOS')) return '🏥';
    if (id.includes('TRF')) return '🚦';
    if (id.includes('TRN')) return '🚇';
    if (id.includes('EMG')) return '🚨';
    if (id.includes('GOV')) return '🏛️';
    return '⚙️';
  }

  _formatMoney(num) {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}k`;
    }
    return `$${Math.round(num)}`;
  }

  /**
   * Core BFS that computes the full cascade plan from the dataset graph.
   */
  _computeCascadePlan(startTime) {
    const plan = [];
    const visited = new Map();

    this.selectedServices.forEach((id) => {
      visited.set(id, { depth: 0, failureTime: startTime, severity: this.severity });
    });

    const queue = [...this.selectedServices].map((id) => ({
      id,
      depth: 0,
      failureTime: startTime,
      severity: this.severity
    }));

    while (queue.length > 0) {
      const current = queue.shift();
      const s = this.graph.getService(current.id);
      const name = s ? s.service_name : current.id;

      plan.push({
        serviceId: current.id,
        name,
        depth: current.depth,
        failureTime: current.failureTime,
        severity: current.severity,
        isPrimary: current.depth === 0,
        criticality: s ? s.criticality : 'Unknown',
        recoveryTimeSec: s ? (s.recovery_time_seconds || 1800) : 1800,
        repairBudget: s ? (s.repair_budget_usd || 2000000) : 2000000,
        hourlyBleed: s ? (s.hourly_economic_bleed_usd || 500000) : 500000,
        emergencyOps: s ? (s.emergency_ops_hourly_usd || 30000) : 30000
      });

      const edges = this.graph.adj.get(current.id) || [];
      edges.forEach((edge) => {
        if (!visited.has(edge.target_id)) {
          const propSeverity = current.severity * edge.strength;
          if (propSeverity >= 0.45) {
            const delayMins = Math.max(2, Math.round((current.depth + 1) * 3 + (1 - edge.strength) * 5));
            const failureTime = current.failureTime + delayMins;

            visited.set(edge.target_id, { depth: current.depth + 1, failureTime, severity: propSeverity });
            queue.push({ id: edge.target_id, depth: current.depth + 1, failureTime, severity: propSeverity });
          }
        }
      });
    }

    plan.sort((a, b) => (a.failureTime !== b.failureTime ? a.failureTime - b.failureTime : a.depth - b.depth));
    return plan;
  }

  /**
   * Compute recovery order based on strategy & budget policy.
   */
  _computeRecoveryOrder(plan, recoveryStartTime) {
    const nodes = [...plan];

    if (this.budgetAllocationMode === 'life_safety') {
      const lifeSafetyOrder = { 'HOS-01': 0, 'EMG-01': 1, 'WTR-01': 2, 'PWR-01': 3 };
      nodes.sort((a, b) => (lifeSafetyOrder[a.serviceId] ?? 9) - (lifeSafetyOrder[b.serviceId] ?? 9));
    } else if (this.budgetAllocationMode === 'upstream_root' || this.recoveryStrategy === 'priority') {
      nodes.sort((a, b) => {
        const inA = (this.graph.revAdj.get(a.serviceId) || []).length;
        const inB = (this.graph.revAdj.get(b.serviceId) || []).length;
        return inA !== inB ? inA - inB : a.depth - b.depth;
      });
    } else if (this.recoveryStrategy === 'automated' || this.budgetAllocationMode === 'optimal') {
      nodes.sort((a, b) => a.recoveryTimeSec - b.recoveryTimeSec);
    } else {
      const critOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3, 'Unknown': 4 };
      nodes.sort((a, b) => (critOrder[a.criticality] || 3) - (critOrder[b.criticality] || 3));
    }

    const recovery = [];
    let ticker = recoveryStartTime;

    nodes.forEach((node) => {
      let mttrMins = node.recoveryTimeSec / 60;
      if (this.recoveryStrategy === 'automated') mttrMins *= 0.5;
      else if (this.recoveryStrategy === 'priority') mttrMins *= 0.7;
      const recoveryTime = ticker + Math.max(3, Math.round(mttrMins));
      ticker = recoveryTime;
      recovery.push({ ...node, recoveryTime });
    });

    return recovery;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER FORM (With Government Budget & What-If Parameters)
  // ─────────────────────────────────────────────────────────────────────────

  renderForm() {
    const services = this.graph.getAllServices();

    this.element.innerHTML = `
      <div class="sandbox-card">
        <div style="margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 1.3rem;">🏛️</span>
            <h3 style="font-family: var(--font-heading); font-size: 1rem; font-weight: 800; color: var(--text-primary);">Municipal Disaster What-If & Budget Sandbox</h3>
          </div>
          <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">
            Simulate multi-service failure cascades and evaluate the <strong>exact government budget & economic capital</strong> required for emergency recovery.
          </p>
        </div>

        <form id="sandbox-config-form" style="display: flex; flex-direction: column; gap: 12px;">

          <!-- 1. Service selector -->
          <div>
            <label class="form-label">1. Select Primary Services to Detonate</label>
            <div class="sandbox-service-checkboxes" id="service-pills">
              ${services
                .map(
                  (s) => `
                <label class="checkbox-pill ${this.selectedServices.has(s.service_id) ? 'checked' : ''}"
                       data-service-id="${s.service_id}"
                       title="${s.service_name} — Repair: $${((s.repair_budget_usd || 2000000) / 1000000).toFixed(1)}M · Bleed: $${((s.hourly_economic_bleed_usd || 500000) / 1000).toFixed(0)}k/hr">
                  <input type="checkbox" value="${s.service_id}" style="display:none;"
                    ${this.selectedServices.has(s.service_id) ? 'checked' : ''} />
                  <span>${this._emoji(s.service_id)}</span>
                  <span style="font-size:0.72rem;font-weight:700;">${s.service_name.split('/')[0].trim()}</span>
                </label>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- 2. Severity -->
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <label class="form-label" style="margin:0;">2. Injected Crisis Severity</label>
              <span class="slider-badge" id="val-severity">${Math.round(this.severity * 100)}%</span>
            </div>
            <input type="range" id="input-severity" min="10" max="100"
              value="${Math.round(this.severity * 100)}" class="sandbox-slider" />
            <div style="display:flex;justify-content:space-between;font-size:0.64rem;color:var(--text-muted);margin-top:2px;">
              <span>Minor Degraded (10%)</span><span>Catastrophic (100%)</span>
            </div>
          </div>

          <!-- 3. Duration -->
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <label class="form-label" style="margin:0;">3. Outage Duration Before Intervention</label>
              <span class="slider-badge" id="val-duration">${this.duration} mins</span>
            </div>
            <input type="range" id="input-duration" min="5" max="120"
              value="${this.duration}" step="5" class="sandbox-slider" />
          </div>

          <!-- 4. Recovery strategy -->
          <div>
            <label class="form-label">4. Recovery Engineering Algorithm</label>
            <select id="select-recovery" class="sandbox-select">
              <option value="automated" ${this.recoveryStrategy === 'automated' ? 'selected' : ''}>⚡ Automated 2× MTTR (Optimal - Saves Max $)</option>
              <option value="priority" ${this.recoveryStrategy === 'priority' ? 'selected' : ''}>🎯 Priority (Upstream Root Grid First)</option>
              <option value="manual" ${this.recoveryStrategy === 'manual' ? 'selected' : ''}>🔧 Manual (Critical Life-Safety First)</option>
            </select>
          </div>

          <!-- 5. Government Emergency Disaster Fund (NEW PARAMETER) -->
          <div style="padding:10px 12px; background:rgba(0, 210, 255, 0.04); border:1px solid rgba(0, 210, 255, 0.2); border-radius:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <label class="form-label" style="margin:0;color:#00D2FF;display:flex;align-items:center;gap:5px;">
                <span>💰</span> 5. Municipal Emergency Fund Cap
              </label>
              <span class="slider-badge" id="val-fund" style="background:rgba(0,210,255,0.2);color:#00D2FF;border-color:rgba(0,210,255,0.4);">
                ${this._formatMoney(this.disasterFund)}
              </span>
            </div>
            <input type="range" id="input-fund" min="2000000" max="50000000" step="1000000"
              value="${this.disasterFund}" class="sandbox-slider" />
            <div style="display:flex;justify-content:space-between;font-size:0.64rem;color:var(--text-muted);margin-top:2px;">
              <span>$2.0M (Tight)</span><span>$25.0M (Standard)</span><span>$50.0M (Surplus)</span>
            </div>
          </div>

          <!-- 6. Government Capital Allocation Policy (NEW PARAMETER) -->
          <div>
            <label class="form-label">6. Municipal Capital Allocation Policy</label>
            <select id="select-budget-policy" class="sandbox-select">
              <option value="optimal" ${this.budgetAllocationMode === 'optimal' ? 'selected' : ''}>⚡ Maximum Speed (Full Capital Deployment - Lowest Downtime Loss)</option>
              <option value="life_safety" ${this.budgetAllocationMode === 'life_safety' ? 'selected' : ''}>🏥 Life-Safety Priority (Hospitals & 911 Emergency First)</option>
              <option value="upstream_root" ${this.budgetAllocationMode === 'upstream_root' ? 'selected' : ''}>🎯 Upstream Roots First (Power Grid & Water Substations)</option>
              <option value="austerity" ${this.budgetAllocationMode === 'austerity' ? 'selected' : ''}>📉 Fiscal Austerity (Strict Cashflow Conservation)</option>
            </select>
          </div>

          <!-- Cascade & Budget Preview Panel -->
          <div id="sim-preview" style="display:none; padding:12px 14px; background:rgba(249,115,22,0.06);
            border:1px solid rgba(249,115,22,0.25); border-radius:10px; font-size:0.75rem;
            color:var(--text-secondary); line-height:1.6;"></div>

          <!-- Run Button -->
          <button type="submit" id="btn-start-sandbox" class="btn btn-orange"
            style="width:100%;margin-top:4px;padding:12px;font-weight:800;font-size:0.85rem;"
            ${this.selectedServices.size === 0 ? 'disabled' : ''}>
            ▶ Run What-If Simulation & Budget Forecast
          </button>
        </form>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    this._bindFormEvents();
  }

  _updatePreview() {
    const previewEl = this.element.querySelector('#sim-preview');
    if (!previewEl) return;

    if (this.selectedServices.size === 0) {
      previewEl.style.display = 'none';
      return;
    }

    const plan = this._computeCascadePlan(5);
    const maxD = plan.length > 0 ? Math.max(...plan.map((p) => p.depth)) : 0;
    const cascadeNodes = plan.filter((p) => !p.isPrimary);
    const total = this.graph.getAllServices().length;

    // Financial calculations
    const directRepairTotal = plan.reduce((sum, n) => sum + (n.repairBudget || 2000000) * this.severity, 0);
    const hourlyBleedTotal = plan.reduce((sum, n) => sum + (n.hourlyBleed || 500000) * this.severity, 0);
    const estDowntimeLoss = (hourlyBleedTotal * (this.duration / 60));
    const totalBudgetRequired = directRepairTotal + estDowntimeLoss;

    const fundSurplus = this.disasterFund - totalBudgetRequired;
    const isDeficit = fundSurplus < 0;

    // Estimated MTTR savings (Automated vs Manual)
    const manualDowntimeMins = plan.length * 25;
    const autoDowntimeMins = plan.length * 12;
    const minsSaved = manualDowntimeMins - autoDowntimeMins;
    const capitalSaved = (hourlyBleedTotal * (minsSaved / 60));

    const cascadeList = cascadeNodes
      .slice(0, 4)
      .map(
        (n) =>
          `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
            <span>${this._emoji(n.serviceId)}</span>
            <span style="font-weight:600;">${n.name.split('/')[0].trim()}</span>
            <span style="color:var(--text-muted);font-size:0.67rem;">D${n.depth} · ~+${n.failureTime - 5}m</span>
            <span style="margin-left:auto;color:#00D2FF;font-family:var(--font-mono);font-size:0.67rem;font-weight:700;">
              ${this._formatMoney(n.repairBudget * this.severity)}
            </span>
          </div>`
      )
      .join('');

    previewEl.style.display = 'block';
    previewEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-weight:800;color:#F97316;font-family:var(--font-mono);">📋 CASCADE & FISCAL PREVIEW</span>
        <span style="font-size:0.68rem;font-family:var(--font-mono);font-weight:800;color:${isDeficit ? '#EF4444' : '#10B981'};">
          ${isDeficit ? `🚨 DEFICIT: -${this._formatMoney(Math.abs(fundSurplus))}` : `✅ SURPLUS: +${this._formatMoney(fundSurplus)}`}
        </span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px;background:rgba(0,0,0,0.3);border-radius:8px;margin-bottom:8px;">
        <div>
          <div style="font-size:0.62rem;color:var(--text-muted);text-transform:uppercase;">Govt Budget Needed:</div>
          <div style="font-family:var(--font-mono);font-size:0.95rem;font-weight:900;color:#F97316;">${this._formatMoney(totalBudgetRequired)}</div>
        </div>
        <div>
          <div style="font-size:0.62rem;color:var(--text-muted);text-transform:uppercase;">Economic Bleed Rate:</div>
          <div style="font-family:var(--font-mono);font-size:0.95rem;font-weight:900;color:#EF4444;">${this._formatMoney(hourlyBleedTotal)}/hr</div>
        </div>
      </div>

      <div style="margin-bottom:4px;font-size:0.72rem;">
        <strong>${plan.length} services affected</strong> (${cascadeNodes.length} downstream) · Max Depth: <strong>${maxD}</strong> (${Math.round((plan.length / total) * 100)}% of city)
      </div>

      ${cascadeList}
      ${cascadeNodes.length > 4 ? `<div style="color:var(--text-muted);font-size:0.67rem;margin-top:3px;">+${cascadeNodes.length - 4} more downstream services...</div>` : ''}

      <div style="margin-top:8px;padding-top:6px;border-top:1px dashed rgba(255,255,255,0.1);font-size:0.68rem;color:#10B981;">
        💡 <strong>Fiscal Optimization:</strong> Automated 2× MTTR will save ~<strong>${this._formatMoney(capitalSaved)}</strong> in downtime bleeding!
      </div>
    `;
  }

  _bindFormEvents() {
    const form = this.element.querySelector('#sandbox-config-form');
    if (!form) return;

    form.querySelectorAll('.checkbox-pill').forEach((cb) => {
      cb.addEventListener('click', (e) => {
        e.preventDefault();
        const id = cb.getAttribute('data-service-id');
        if (this.selectedServices.has(id)) {
          this.selectedServices.delete(id);
          cb.classList.remove('checked');
        } else {
          this.selectedServices.add(id);
          cb.classList.add('checked');
        }
        sound.playClick();
        const btn = form.querySelector('#btn-start-sandbox');
        if (btn) btn.disabled = this.selectedServices.size === 0;
        this._updatePreview();
      });
    });

    const sevEl = form.querySelector('#input-severity');
    const sevBadge = form.querySelector('#val-severity');
    if (sevEl)
      sevEl.addEventListener('input', () => {
        this.severity = parseInt(sevEl.value) / 100;
        if (sevBadge) sevBadge.textContent = `${sevEl.value}%`;
        this._updatePreview();
      });

    const durEl = form.querySelector('#input-duration');
    const durBadge = form.querySelector('#val-duration');
    if (durEl)
      durEl.addEventListener('input', () => {
        this.duration = parseInt(durEl.value);
        if (durBadge) durBadge.textContent = `${durEl.value} mins`;
        this._updatePreview();
      });

    const fundEl = form.querySelector('#input-fund');
    const fundBadge = form.querySelector('#val-fund');
    if (fundEl)
      fundEl.addEventListener('input', () => {
        this.disasterFund = parseInt(fundEl.value);
        if (fundBadge) fundBadge.textContent = this._formatMoney(this.disasterFund);
        this._updatePreview();
      });

    const recEl = form.querySelector('#select-recovery');
    if (recEl)
      recEl.addEventListener('change', () => {
        this.recoveryStrategy = recEl.value;
        this._updatePreview();
      });

    const polEl = form.querySelector('#select-budget-policy');
    if (polEl)
      polEl.addEventListener('change', () => {
        this.budgetAllocationMode = polEl.value;
        this._updatePreview();
      });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.selectedServices.size > 0) {
        sound.playAlarm();
        this.startSimulation();
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LIVE DASHBOARD (With Real-Time Financial Gauges)
  // ─────────────────────────────────────────────────────────────────────────

  renderLiveDashboard() {
    const startTime = 5;
    const plan = this.cascadePlan;
    const maxDepth = this.maxPredictedDepth;
    const total = this.totalPredictedAffected;
    const allCount = this.graph.getAllServices().length;

    this.element.innerHTML = `
      <div class="sandbox-card">
        <!-- Header row -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border-light);">
          <div>
            <div style="font-family:var(--font-mono);font-size:0.68rem;font-weight:700;color:var(--accent-orange);text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px;">
              🏛️ Municipal What-If Active
            </div>
            <h3 style="font-family:var(--font-heading);font-size:1rem;font-weight:800;color:var(--text-primary);" id="dashboard-clock">T + 0 mins</h3>
            <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;" id="dashboard-phase-label">
              Waiting for primary detonation at T+${startTime}m...
            </div>
          </div>
          <button id="btn-stop-sandbox" class="btn btn-red" style="font-size:0.75rem;padding:6px 10px;flex-shrink:0;">■ Stop &amp; Restore</button>
        </div>

        <!-- Phase stepper -->
        <div class="sandbox-timeline-stepper">
          <div class="timeline-step" id="step-waiting"><div class="step-dot"></div><div class="step-name">Standby</div></div>
          <div class="timeline-step" id="step-fail"><div class="step-dot"></div><div class="step-name">Failure</div></div>
          <div class="timeline-step" id="step-cascade"><div class="step-dot"></div><div class="step-name">Cascade</div></div>
          <div class="timeline-step" id="step-peak"><div class="step-dot"></div><div class="step-name">Peak Loss</div></div>
          <div class="timeline-step" id="step-recovery"><div class="step-dot"></div><div class="step-name">Recovery</div></div>
          <div class="timeline-step" id="step-done"><div class="step-dot"></div><div class="step-name">Audited</div></div>
        </div>

        <!-- Real-Time Metrics Grid (With Government Budget & Bleed Rate) -->
        <div class="sandbox-metrics-grid" style="margin-top:12px; grid-template-columns: repeat(3, 1fr); gap: 6px;">
          <div class="metric-tile">
            <div class="tile-label">Down Now</div>
            <div class="tile-value" id="metric-affected" style="color:#EF4444;">0 / ${allCount}</div>
          </div>
          <div class="metric-tile">
            <div class="tile-label">Resilience</div>
            <div class="tile-value" id="metric-resilience" style="color:#10B981;">100%</div>
          </div>
          <div class="metric-tile">
            <div class="tile-label">Bleed Rate</div>
            <div class="tile-value" id="metric-bleed" style="color:#EF4444;">$0/hr</div>
          </div>
          <div class="metric-tile">
            <div class="tile-label">Govt Budget Spent</div>
            <div class="tile-value" id="metric-budget" style="color:#F97316;">$0.00M</div>
          </div>
          <div class="metric-tile">
            <div class="tile-label">Fund Balance</div>
            <div class="tile-value" id="metric-fund-bal" style="color:#10B981;">${this._formatMoney(this.disasterFund)}</div>
          </div>
          <div class="metric-tile">
            <div class="tile-label">MTTR $ Saved</div>
            <div class="tile-value" id="metric-saved" style="color:#00D2FF;">+$0.00M</div>
          </div>
        </div>

        <!-- Live Disaster Fund Consumption Bar -->
        <div style="margin-top:10px; padding:8px 10px; background:rgba(0,0,0,0.35); border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
          <div style="display:flex;justify-content:space-between;font-size:0.65rem;font-family:var(--font-mono);margin-bottom:4px;">
            <span>DISASTER FUND UTILIZATION:</span>
            <span id="fund-pct-label" style="font-weight:800;color:#00D2FF;">0% UTILIZED</span>
          </div>
          <div style="height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;">
            <div id="fund-bar-fill" style="height:100%;width:0%;background:linear-gradient(90deg, #10B981, #F97316);transition:width 0.3s ease;"></div>
          </div>
        </div>

        <!-- Predicted Cascade Plan -->
        <div style="padding:8px 10px;background:rgba(249,115,22,0.05);border:1px solid rgba(249,115,22,0.15);border-radius:8px;margin-top:10px;">
          <div style="font-family:var(--font-mono);font-size:0.65rem;font-weight:700;color:#F97316;text-transform:uppercase;margin-bottom:6px;">
            Cascade Sequence (${total} services) · Max Depth: ${maxDepth}
          </div>
          <div style="display:flex;flex-direction:column;gap:3px;" id="cascade-plan-display">
            ${plan
              .slice(0, 6)
              .map(
                (n) => `
              <div style="display:flex;align-items:center;gap:6px;font-size:0.7rem;" id="plan-row-${n.serviceId}">
                <span>${this._emoji(n.serviceId)}</span>
                <span style="font-weight:600;flex:1;">${n.name.split('/')[0].trim()}</span>
                <span style="color:var(--text-muted);font-family:var(--font-mono);font-size:0.62rem;">D${n.depth} · T+${n.failureTime}m</span>
                <span class="plan-status-badge" id="badge-${n.serviceId}" style="font-size:0.6rem;padding:1px 6px;border-radius:999px;background:#F1F5F9;color:var(--text-muted);font-weight:700;">PENDING</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Post-Sim Municipal Financial Audit Card (Hidden until finished) -->
        <div id="financial-audit-card" style="display:none;margin-top:10px;padding:10px 12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:10px;"></div>

        <!-- Event log -->
        <div style="font-size:0.65rem;font-family:var(--font-mono);color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-top:10px;margin-bottom:3px;">SCADA & Fiscal Event Log</div>
        <div class="sandbox-logs-container" id="sandbox-logs">
          <div class="log-row info">⏳ Cascade plan initialized: ${total} services tracked. Emergency Disaster Fund: ${this._formatMoney(this.disasterFund)}.</div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    this.element.querySelector('#btn-stop-sandbox').addEventListener('click', () => {
      sound.playClick();
      this.stopSimulation();
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SIMULATION CORE & TICK
  // ─────────────────────────────────────────────────────────────────────────

  startSimulation() {
    const START_T = 5;

    this.isSimulating = true;
    this.simTime = 0;
    this.simPhase = 'Waiting';
    this.affectedServices.clear();
    this.accumulatedRepairCost = 0;
    this.accumulatedEconomicLoss = 0;
    this.accumulatedEmergencyOps = 0;
    this.peakResilience = 100;
    this.eventSchedule.clear();

    this.originalStatuses = new Map(this.graph.getAllServices().map((s) => [s.service_id, s.status]));
    this.graph.resetAll();

    this.cascadePlan = this._computeCascadePlan(START_T);
    this.maxPredictedDepth = this.cascadePlan.length > 0 ? Math.max(...this.cascadePlan.map((p) => p.depth)) : 0;
    this.totalPredictedAffected = this.cascadePlan.length;

    const recoveryStartTime = START_T + this.duration;
    this.recoveryStartSimTime = recoveryStartTime;

    // Schedule failure events
    this.cascadePlan.forEach((node) => {
      this._scheduleEvent(node.failureTime, () => {
        this.graph.updateServiceStatus(node.serviceId, 'Failed');
        this.onTriggerShockwave(node.serviceId);
        this.affectedServices.add(node.serviceId);

        // Add direct physical repair cost immediately upon failure
        this.accumulatedRepairCost += (node.repairBudget || 2000000) * this.severity;

        if (node.isPrimary) {
          this.simPhase = 'Initial Failure';
          this._log(`🚨 FAILURE: ${node.name} (${node.serviceId}) — Primary failure! Repair Cost: ${this._formatMoney(node.repairBudget * this.severity)}`, 'red');
          sound.playAlarm();
        } else {
          if (this.simPhase !== 'Recovery') this.simPhase = 'Cascade Propagation';
          this._log(`⚡ CASCADE D${node.depth}: ${node.name} (${node.serviceId}) failed! Repair Cost: ${this._formatMoney(node.repairBudget * this.severity)}`, 'orange');
          sound.playCascadeWave();
        }

        const badge = this.element.querySelector(`#badge-${node.serviceId}`);
        if (badge) {
          badge.textContent = 'FAILED';
          badge.style.background = '#FEE2E2';
          badge.style.color = '#EF4444';
        }
      });
    });

    // Schedule recovery kickoff
    this._scheduleEvent(recoveryStartTime, () => {
      this.simPhase = 'Recovery';
      this._log(`🩹 RECOVERY: Municipal emergency teams deployed under [${this.budgetAllocationMode.toUpperCase()}] policy.`, 'green');
      sound.playRecovery();
    });

    // Schedule recoveries
    const recoveryPlan = this._computeRecoveryOrder(this.cascadePlan, recoveryStartTime);
    recoveryPlan.forEach((node) => {
      this._scheduleEvent(node.recoveryTime, () => {
        this.graph.updateServiceStatus(node.serviceId, 'Operational');
        this.affectedServices.delete(node.serviceId);
        this._log(`✅ RESTORED: ${node.name} (${node.serviceId}) back online at T+${this.simTime}m.`, 'green');
        sound.playRecovery();

        const badge = this.element.querySelector(`#badge-${node.serviceId}`);
        if (badge) {
          badge.textContent = 'OK';
          badge.style.background = '#D1FAE5';
          badge.style.color = '#059669';
        }
      });
    });

    // Schedule completion
    const lastRecovery = recoveryPlan.length > 0 ? recoveryPlan[recoveryPlan.length - 1].recoveryTime : recoveryStartTime;
    this._scheduleEvent(lastRecovery + 3, () => {
      this.simPhase = 'Completed';
      this._log(`✨ SIMULATION COMPLETE: All services restored to nominal. Generating Municipal Fiscal Audit...`, 'green');
      clearInterval(this.simInterval);
      this.simInterval = null;
      this.isSimulating = false;
      this._renderFinalFiscalAudit();
    });

    this.renderLiveDashboard();
    this.simInterval = setInterval(() => this._tick(), 500);
  }

  stopSimulation() {
    if (this.simInterval) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }
    this.isSimulating = false;

    if (this.originalStatuses) {
      this.originalStatuses.forEach((status, id) => this.graph.updateServiceStatus(id, status));
      this.originalStatuses = null;
    } else {
      this.graph.resetAll();
    }

    this.renderForm();
  }

  _scheduleEvent(time, fn) {
    if (!this.eventSchedule.has(time)) this.eventSchedule.set(time, []);
    this.eventSchedule.get(time).push(fn);
  }

  _tick() {
    this.simTime += 1;

    if (this.eventSchedule.has(this.simTime)) {
      this.eventSchedule.get(this.simTime).forEach((fn) => {
        try {
          fn();
        } catch (e) {
          console.error(e);
        }
      });
    }

    // Accumulate economic loss & emergency ops for all currently down services
    this.affectedServices.forEach((id) => {
      const node = this.cascadePlan.find((n) => n.serviceId === id);
      if (node) {
        this.accumulatedEconomicLoss += ((node.hourlyBleed || 500000) * this.severity) / 60;
        this.accumulatedEmergencyOps += (node.emergencyOps || 30000) / 60;
      }
    });

    if (this.simPhase !== 'Completed') {
      if (this.simTime < 5) this.simPhase = 'Waiting';
      else if (this.simTime >= this.recoveryStartSimTime && this.affectedServices.size === 0 && this.simTime > this.recoveryStartSimTime) {
        this.simPhase = 'Completed';
      }
    }

    const res = this.graph.getResilienceScore();
    this.peakResilience = Math.min(this.peakResilience, res);

    this._updateDashboard(res);
    this._updateSteppers();
  }

  _updateDashboard(currentResilience) {
    const clockEl = this.element.querySelector('#dashboard-clock');
    if (clockEl) clockEl.textContent = `T + ${this.simTime} mins`;

    const phaseEl = this.element.querySelector('#dashboard-phase-label');
    if (phaseEl) {
      const descriptions = {
        Waiting: `⏳ Primary failure in ${Math.max(0, 5 - this.simTime)}m...`,
        'Initial Failure': `🚨 Primary service down — watching for cascade...`,
        'Cascade Propagation': `⚡ ${this.affectedServices.size} services down — economic bleed active...`,
        Recovery: `🩹 Recovery in progress — ${this.affectedServices.size} remaining...`,
        Completed: `✅ Simulation complete — all systems restored!`
      };
      phaseEl.textContent = descriptions[this.simPhase] || this.simPhase;
    }

    const totalSvcs = this.graph.getAllServices().length;
    const affEl = this.element.querySelector('#metric-affected');
    if (affEl) {
      affEl.textContent = `${this.affectedServices.size} / ${totalSvcs}`;
      affEl.style.color = this.affectedServices.size > 0 ? '#EF4444' : '#10B981';
    }

    const resEl = this.element.querySelector('#metric-resilience');
    if (resEl) {
      resEl.textContent = `${currentResilience.toFixed(0)}%`;
      resEl.style.color = currentResilience > 80 ? '#10B981' : currentResilience > 50 ? '#F59E0B' : '#EF4444';
    }

    // Real-Time Hourly Economic Bleed Rate
    let currentHourlyBleed = 0;
    this.affectedServices.forEach((id) => {
      const node = this.cascadePlan.find((n) => n.serviceId === id);
      if (node) currentHourlyBleed += (node.hourlyBleed || 500000) * this.severity;
    });

    const bleedEl = this.element.querySelector('#metric-bleed');
    if (bleedEl) {
      bleedEl.textContent = `${this._formatMoney(currentHourlyBleed)}/hr`;
      bleedEl.style.color = currentHourlyBleed > 0 ? '#EF4444' : '#10B981';
    }

    // Total Government Budget Spent
    const totalCostSoFar = this.accumulatedRepairCost + this.accumulatedEconomicLoss + this.accumulatedEmergencyOps;
    const budgetEl = this.element.querySelector('#metric-budget');
    if (budgetEl) {
      budgetEl.textContent = this._formatMoney(totalCostSoFar);
    }

    // Fund Balance
    const fundBal = this.disasterFund - totalCostSoFar;
    const fundBalEl = this.element.querySelector('#metric-fund-bal');
    if (fundBalEl) {
      fundBalEl.textContent = fundBal >= 0 ? `+${this._formatMoney(fundBal)}` : `-${this._formatMoney(Math.abs(fundBal))}`;
      fundBalEl.style.color = fundBal >= 0 ? '#10B981' : '#EF4444';
    }

    // Fund Utilization Bar
    const fundPct = Math.min(100, Math.round((totalCostSoFar / this.disasterFund) * 100));
    const fundPctEl = this.element.querySelector('#fund-pct-label');
    const fundBarEl = this.element.querySelector('#fund-bar-fill');
    if (fundPctEl && fundBarEl) {
      fundPctEl.textContent = `${fundPct}% UTILIZED`;
      fundPctEl.style.color = fundPct > 90 ? '#EF4444' : fundPct > 60 ? '#F97316' : '#10B981';
      fundBarEl.style.width = `${fundPct}%`;
      fundBarEl.style.background = fundPct > 90 ? '#EF4444' : fundPct > 60 ? 'linear-gradient(90deg, #10B981, #F97316)' : '#10B981';
    }

    // Capital Saved by MTTR
    const manualDowntimeMins = this.cascadePlan.length * 25;
    const savedSoFar = (currentHourlyBleed * ((manualDowntimeMins - this.simTime) / 60));
    const savedEl = this.element.querySelector('#metric-saved');
    if (savedEl) {
      savedEl.textContent = `+${this._formatMoney(Math.max(0, savedSoFar))}`;
    }
  }

  _renderFinalFiscalAudit() {
    const auditEl = this.element.querySelector('#financial-audit-card');
    if (!auditEl) return;

    const totalCost = this.accumulatedRepairCost + this.accumulatedEconomicLoss + this.accumulatedEmergencyOps;
    const netBalance = this.disasterFund - totalCost;
    const isDeficit = netBalance < 0;

    auditEl.style.display = 'block';
    auditEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-family:var(--font-heading);font-weight:900;font-size:0.88rem;color:#10B981;">🏛️ MUNICIPAL FISCAL AUDIT CERTIFICATE</span>
        <span style="font-family:var(--font-mono);font-size:0.65rem;padding:2px 6px;border-radius:4px;background:${isDeficit ? '#EF4444' : '#10B981'};color:#FFFFFF;font-weight:800;">
          ${isDeficit ? 'CAPITAL DEFICIT' : 'SURPLUS PRESERVED'}
        </span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.72rem;margin-bottom:8px;">
        <div>• Physical Hardware Repairs:</div>
        <div style="text-align:right;font-family:var(--font-mono);font-weight:700;color:#F97316;">${this._formatMoney(this.accumulatedRepairCost)}</div>

        <div>• Economic Downtime Loss:</div>
        <div style="text-align:right;font-family:var(--font-mono);font-weight:700;color:#EF4444;">${this._formatMoney(this.accumulatedEconomicLoss)}</div>

        <div>• First Responder / Safety Ops:</div>
        <div style="text-align:right;font-family:var(--font-mono);font-weight:700;color:#00D2FF;">${this._formatMoney(this.accumulatedEmergencyOps)}</div>

        <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;font-weight:800;">Total Government Cost:</div>
        <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;text-align:right;font-family:var(--font-mono);font-weight:900;color:#FFFFFF;">
          ${this._formatMoney(totalCost)}
        </div>
      </div>

      <div style="font-size:0.68rem;color:#10B981;padding-top:4px;border-top:1px dashed rgba(16,185,129,0.3);">
        ✨ <strong>Optimization Summary:</strong> Using the <strong>${this.recoveryStrategy.toUpperCase()}</strong> strategy saved the municipality an estimated <strong>${this._formatMoney(this.accumulatedEconomicLoss * 0.45)}</strong> compared to uncoordinated manual recovery.
      </div>
    `;
  }

  _updateSteppers() {
    const ids = ['step-waiting', 'step-fail', 'step-cascade', 'step-peak', 'step-recovery', 'step-done'];
    ids.forEach((id) => {
      const el = this.element.querySelector(`#${id}`);
      if (el) el.classList.remove('active', 'done');
    });

    const phaseMap = {
      Waiting: { active: 'step-waiting', done: [] },
      'Initial Failure': { active: 'step-fail', done: ['step-waiting'] },
      'Cascade Propagation': { active: 'step-cascade', done: ['step-waiting', 'step-fail'] },
      Recovery: { active: 'step-recovery', done: ['step-waiting', 'step-fail', 'step-cascade', 'step-peak'] },
      Completed: { active: 'step-done', done: ['step-waiting', 'step-fail', 'step-cascade', 'step-peak', 'step-recovery'] }
    };

    if (this.simPhase === 'Cascade Propagation' && this.simTime >= this.recoveryStartSimTime - 3) {
      const peakEl = this.element.querySelector('#step-peak');
      if (peakEl) peakEl.classList.add('active');
      return;
    }

    const mapping = phaseMap[this.simPhase];
    if (!mapping) return;

    const activeEl = this.element.querySelector(`#${mapping.active}`);
    if (activeEl) activeEl.classList.add('active');

    mapping.done.forEach((id) => {
      const el = this.element.querySelector(`#${id}`);
      if (el) el.classList.add('done');
    });
  }

  _log(msg, cls = 'info') {
    const logs = this.element.querySelector('#sandbox-logs');
    if (!logs) return;
    const row = document.createElement('div');
    row.className = `log-row ${cls}`;
    row.innerHTML = `<span style="opacity:.55;margin-right:5px;font-size:0.62rem;">[T+${this.simTime}m]</span> ${msg}`;
    logs.appendChild(row);
    logs.scrollTop = logs.scrollHeight;
  }
}
