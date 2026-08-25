/**
 * CASCADYN - What-If Sandbox Simulator
 * Pre-computes full cascade plan from dataset adjacency, then replays it as a timed simulation.
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

    // Parameters
    this.selectedServices = new Set();
    this.severity = 0.8;
    this.duration = 60;
    this.recoveryStrategy = 'manual';

    // Live sim state
    this.simTime = 0;
    this.simPhase = 'Waiting';
    this.affectedServices = new Set();

    // Pre-computed cascade plan (computed when sim starts, before tick loop)
    this.cascadePlan = [];          // Array of { serviceId, depth, failureTime, recoveryTime, severity, name, criticality }
    this.maxPredictedDepth = 0;     // Computed upfront from BFS
    this.totalPredictedAffected = 0;
    this.peakResilience = 100;
    this.recoveryStartSimTime = 0;

    // Scheduled event map: simTime -> [fn, fn, ...]
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
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
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

  /**
   * Core BFS that computes the full cascade plan from the dataset graph.
   * Returns an array of cascade events sorted by failure time.
   */
  _computeCascadePlan(startTime) {
    const plan = [];
    // Add primary selected services as depth-0 failures
    const visited = new Map(); // id -> { depth, failureTime, severity }

    this.selectedServices.forEach(id => {
      visited.set(id, { depth: 0, failureTime: startTime, severity: this.severity });
    });

    // BFS queue
    const queue = [...this.selectedServices].map(id => ({
      id,
      depth: 0,
      failureTime: startTime,
      severity: this.severity
    }));

    while (queue.length > 0) {
      const current = queue.shift();
      const s = this.graph.getService(current.id);
      const name = s ? s.service_name : current.id;

      // Add to plan
      plan.push({
        serviceId: current.id,
        name,
        depth: current.depth,
        failureTime: current.failureTime,
        severity: current.severity,
        isPrimary: current.depth === 0,
        criticality: s ? s.criticality : 'Unknown',
        recoveryTimeSec: s ? (s.recovery_time_seconds || 1800) : 1800
      });

      // Traverse downstream edges from the dataset graph
      const edges = this.graph.adj.get(current.id) || [];
      edges.forEach(edge => {
        if (!visited.has(edge.target_id)) {
          const propSeverity = current.severity * edge.strength;
          if (propSeverity >= 0.45) {
            // Cascade delay: increases with depth and decreases with coupling strength
            const delayMins = Math.max(2, Math.round(
              (current.depth + 1) * 3 + (1 - edge.strength) * 5
            ));
            const failureTime = current.failureTime + delayMins;

            visited.set(edge.target_id, { depth: current.depth + 1, failureTime, severity: propSeverity });
            queue.push({ id: edge.target_id, depth: current.depth + 1, failureTime, severity: propSeverity });
          }
        }
      });
    }

    // Sort by failure time, then depth
    plan.sort((a, b) => a.failureTime !== b.failureTime ? a.failureTime - b.failureTime : a.depth - b.depth);
    return plan;
  }

  /**
   * Compute recovery order based on strategy.
   */
  _computeRecoveryOrder(plan, recoveryStartTime) {
    const nodes = [...plan];

    if (this.recoveryStrategy === 'priority') {
      // Upstream first (fewer incoming edges = more fundamental)
      nodes.sort((a, b) => {
        const inA = (this.graph.revAdj.get(a.serviceId) || []).length;
        const inB = (this.graph.revAdj.get(b.serviceId) || []).length;
        return inA !== inB ? inA - inB : a.depth - b.depth;
      });
    } else if (this.recoveryStrategy === 'automated') {
      // Fastest MTTR first (smallest recoveryTimeSec)
      nodes.sort((a, b) => a.recoveryTimeSec - b.recoveryTimeSec);
    } else {
      // Manual: critical services first
      const critOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3, 'Unknown': 4 };
      nodes.sort((a, b) => (critOrder[a.criticality] || 3) - (critOrder[b.criticality] || 3));
    }

    const recovery = [];
    let ticker = recoveryStartTime;

    nodes.forEach(node => {
      let mttrMins = node.recoveryTimeSec / 60;           // actual MTTR in minutes
      if (this.recoveryStrategy === 'automated') mttrMins *= 0.5;
      else if (this.recoveryStrategy === 'priority') mttrMins *= 0.7;
      const recoveryTime = ticker + Math.max(3, Math.round(mttrMins));
      ticker = recoveryTime;
      recovery.push({ ...node, recoveryTime });
    });

    return recovery;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER FORM
  // ─────────────────────────────────────────────────────────────────────────

  renderForm() {
    const services = this.graph.getAllServices();

    this.element.innerHTML = `
      <div class="sandbox-card">
        <div style="margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 1.3rem;">⚗️</span>
            <h3 style="font-family: var(--font-heading); font-size: 1rem; font-weight: 800; color: var(--text-primary);">What-If Simulator</h3>
          </div>
          <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">
            Simulate multi-service failures and cascades using actual dependency data. City state auto-restores when stopped.
          </p>
        </div>

        <form id="sandbox-config-form" style="display: flex; flex-direction: column; gap: 12px;">

          <!-- 1. Service selector -->
          <div>
            <label class="form-label">1. Select Services to Fail</label>
            <div class="sandbox-service-checkboxes" id="service-pills">
              ${services.map(s => `
                <label class="checkbox-pill ${this.selectedServices.has(s.service_id) ? 'checked' : ''}"
                       data-service-id="${s.service_id}"
                       title="${s.service_name} — ${s.criticality} · Impact: ${s.impact_score}">
                  <input type="checkbox" value="${s.service_id}" style="display:none;"
                    ${this.selectedServices.has(s.service_id) ? 'checked' : ''} />
                  <span>${this._emoji(s.service_id)}</span>
                  <span style="font-size:0.72rem;font-weight:700;">${s.service_name.split('/')[0].trim()}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- 2. Severity -->
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <label class="form-label" style="margin:0;">2. Failure Severity</label>
              <span class="slider-badge" id="val-severity">${Math.round(this.severity * 100)}%</span>
            </div>
            <input type="range" id="input-severity" min="10" max="100"
              value="${Math.round(this.severity * 100)}" class="sandbox-slider" />
            <div style="display:flex;justify-content:space-between;font-size:0.64rem;color:var(--text-muted);margin-top:2px;">
              <span>Minor (10%)</span><span>Total (100%)</span>
            </div>
          </div>

          <!-- 3. Duration -->
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <label class="form-label" style="margin:0;">3. Failure Duration</label>
              <span class="slider-badge" id="val-duration">${this.duration} mins</span>
            </div>
            <input type="range" id="input-duration" min="5" max="120"
              value="${this.duration}" step="5" class="sandbox-slider" />
          </div>

          <!-- 4. Recovery strategy -->
          <div>
            <label class="form-label">4. Recovery Strategy</label>
            <select id="select-recovery" class="sandbox-select">
              <option value="manual" ${this.recoveryStrategy === 'manual' ? 'selected' : ''}>🔧 Manual (Critical First)</option>
              <option value="automated" ${this.recoveryStrategy === 'automated' ? 'selected' : ''}>⚡ Automated (2× Faster MTTR)</option>
              <option value="priority" ${this.recoveryStrategy === 'priority' ? 'selected' : ''}>🎯 Priority (Upstream Sources First)</option>
            </select>
          </div>

          <!-- Cascade Preview Panel -->
          <div id="sim-preview" style="display:none; padding:10px 12px; background:rgba(249,115,22,0.06);
            border:1px solid rgba(249,115,22,0.22); border-radius:10px; font-size:0.75rem;
            color:var(--text-secondary); line-height:1.6;"></div>

          <!-- Run Button -->
          <button type="submit" id="btn-start-sandbox" class="btn btn-orange"
            style="width:100%;margin-top:2px;" ${this.selectedServices.size === 0 ? 'disabled' : ''}>
            ▶ Run What-If Simulation
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

    // Pre-compute cascade using dataset graph
    const plan = this._computeCascadePlan(5);
    const maxD = plan.length > 0 ? Math.max(...plan.map(p => p.depth)) : 0;
    const cascadeNodes = plan.filter(p => !p.isPrimary);
    const total = this.graph.getAllServices().length;

    const selectedNames = [...this.selectedServices].map(id => {
      const s = this.graph.getService(id);
      return `${this._emoji(id)} ${s ? s.service_name.split('/')[0].trim() : id}`;
    }).join(', ');

    const cascadeList = cascadeNodes.slice(0, 5).map(n =>
      `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid rgba(0,0,0,0.04);">
        <span>${this._emoji(n.serviceId)}</span>
        <span style="font-weight:600;">${n.name.split('/')[0].trim()}</span>
        <span style="color:var(--text-muted);font-size:0.67rem;">Depth ${n.depth} · ~+${n.failureTime - 5}m</span>
        <span style="margin-left:auto;color:${n.criticality === 'Critical' ? '#EF4444' : n.criticality === 'High' ? '#F97316' : '#F59E0B'};font-size:0.67rem;font-weight:700;">${n.criticality}</span>
      </div>`
    ).join('');

    previewEl.style.display = 'block';
    previewEl.innerHTML = `
      <div style="font-weight:700;color:#F97316;margin-bottom:6px;">📋 Cascade Preview</div>
      <div style="margin-bottom:4px;"><strong>Failing:</strong> ${selectedNames}</div>
      <div style="margin-bottom:6px;">
        <strong>${plan.length} total service${plan.length !== 1 ? 's' : ''} affected</strong>
        (${cascadeNodes.length} cascade) · Max Depth: <strong>${maxD}</strong> · ${Math.round(plan.length / total * 100)}% of city
      </div>
      ${cascadeList}
      ${cascadeNodes.length > 5 ? `<div style="color:var(--text-muted);font-size:0.67rem;margin-top:4px;">+${cascadeNodes.length - 5} more...</div>` : ''}
    `;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LIVE DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────

  renderLiveDashboard() {
    const startTime = 5; // always T+5m
    const plan = this.cascadePlan;
    const maxDepth = this.maxPredictedDepth;
    const total = this.totalPredictedAffected;
    const allCount = this.graph.getAllServices().length;

    this.element.innerHTML = `
      <div class="sandbox-card">
        <!-- Header row -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border-light);">
          <div>
            <div style="font-family:var(--font-mono);font-size:0.68rem;font-weight:700;color:var(--accent-orange);text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px;">⚗️ Sandbox Active</div>
            <h3 style="font-family:var(--font-heading);font-size:1rem;font-weight:800;color:var(--text-primary);" id="dashboard-clock">T + 0 mins</h3>
            <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;" id="dashboard-phase-label">Waiting for failure at T+${startTime}m...</div>
          </div>
          <button id="btn-stop-sandbox" class="btn btn-red" style="font-size:0.75rem;padding:6px 10px;flex-shrink:0;">■ Stop &amp; Restore</button>
        </div>

        <!-- Phase stepper -->
        <div class="sandbox-timeline-stepper">
          <div class="timeline-step" id="step-waiting"><div class="step-dot"></div><div class="step-name">Standby</div></div>
          <div class="timeline-step" id="step-fail"><div class="step-dot"></div><div class="step-name">Failure</div></div>
          <div class="timeline-step" id="step-cascade"><div class="step-dot"></div><div class="step-name">Cascade</div></div>
          <div class="timeline-step" id="step-peak"><div class="step-dot"></div><div class="step-name">Peak</div></div>
          <div class="timeline-step" id="step-recovery"><div class="step-dot"></div><div class="step-name">Recovery</div></div>
          <div class="timeline-step" id="step-done"><div class="step-dot"></div><div class="step-name">Restored</div></div>
        </div>

        <!-- Metrics grid -->
        <div class="sandbox-metrics-grid" style="margin-top:12px;">
          <div class="metric-tile">
            <div class="tile-label">Down Now</div>
            <div class="tile-value" id="metric-affected" style="color:#EF4444;">0 / ${allCount}</div>
          </div>
          <div class="metric-tile">
            <div class="tile-label">Max Depth</div>
            <div class="tile-value" id="metric-depth">0 <span style="font-size:0.65rem;color:var(--text-muted);">/ ${maxDepth}</span></div>
          </div>
          <div class="metric-tile">
            <div class="tile-label">Resilience</div>
            <div class="tile-value" id="metric-resilience" style="color:#10B981;">100%</div>
          </div>
          <div class="metric-tile">
            <div class="tile-label">Risk Score</div>
            <div class="tile-value" id="metric-risk" style="color:var(--accent-orange);">0</div>
          </div>
        </div>

        <!-- Cascade plan preview (what WILL happen) -->
        <div style="padding:8px 10px;background:rgba(249,115,22,0.05);border:1px solid rgba(249,115,22,0.15);border-radius:8px;margin-top:8px;">
          <div style="font-family:var(--font-mono);font-size:0.65rem;font-weight:700;color:#F97316;text-transform:uppercase;margin-bottom:6px;">
            Predicted Cascade — ${total} service${total !== 1 ? 's' : ''} affected (Max Depth: ${maxDepth})
          </div>
          <div style="display:flex;flex-direction:column;gap:3px;" id="cascade-plan-display">
            ${plan.slice(0, 8).map(n => `
              <div style="display:flex;align-items:center;gap:6px;font-size:0.7rem;" id="plan-row-${n.serviceId}">
                <span>${this._emoji(n.serviceId)}</span>
                <span style="font-weight:600;flex:1;">${n.name.split('/')[0].trim()}</span>
                <span style="color:var(--text-muted);font-family:var(--font-mono);font-size:0.62rem;">D${n.depth} · T+${n.failureTime}m</span>
                <span class="plan-status-badge" id="badge-${n.serviceId}" style="font-size:0.6rem;padding:1px 6px;border-radius:999px;background:#F1F5F9;color:var(--text-muted);font-weight:700;">PENDING</span>
              </div>
            `).join('')}
            ${plan.length > 8 ? `<div style="font-size:0.65rem;color:var(--text-muted);">+${plan.length - 8} more services scheduled...</div>` : ''}
          </div>
        </div>

        <!-- Event log -->
        <div style="font-size:0.65rem;font-family:var(--font-mono);color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-top:10px;margin-bottom:3px;">Event Log</div>
        <div class="sandbox-logs-container" id="sandbox-logs">
          <div class="log-row info">⏳ Cascade plan computed: ${total} services will be affected (max depth ${maxDepth}). Failure begins at T+${startTime}m.</div>
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
  // EVENTS
  // ─────────────────────────────────────────────────────────────────────────

  _bindFormEvents() {
    const form = this.element.querySelector('#sandbox-config-form');
    if (!form) return;

    form.querySelectorAll('.checkbox-pill').forEach(cb => {
      cb.addEventListener('click', e => {
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
    if (sevEl) sevEl.addEventListener('input', () => {
      this.severity = parseInt(sevEl.value) / 100;
      if (sevBadge) sevBadge.textContent = `${sevEl.value}%`;
      this._updatePreview();
    });

    const durEl = form.querySelector('#input-duration');
    const durBadge = form.querySelector('#val-duration');
    if (durEl) durEl.addEventListener('input', () => {
      this.duration = parseInt(durEl.value);
      if (durBadge) durBadge.textContent = `${durEl.value} mins`;
      this._updatePreview();
    });

    const recEl = form.querySelector('#select-recovery');
    if (recEl) recEl.addEventListener('change', () => {
      this.recoveryStrategy = recEl.value;
      this._updatePreview();
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (this.selectedServices.size > 0) {
        sound.playAlarm();
        this.startSimulation();
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SIMULATION CORE
  // ─────────────────────────────────────────────────────────────────────────

  startSimulation() {
    const START_T = 5; // primary failure at T+5 simulated minutes

    this.isSimulating = true;
    this.simTime = 0;
    this.simPhase = 'Waiting';
    this.affectedServices.clear();
    this.peakResilience = 100;
    this.eventSchedule.clear();

    // Snapshot for restore
    this.originalStatuses = new Map(
      this.graph.getAllServices().map(s => [s.service_id, s.status])
    );
    this.graph.resetAll();

    // ── Pre-compute full cascade plan ──────────────────────────────────────
    this.cascadePlan = this._computeCascadePlan(START_T);
    this.maxPredictedDepth = this.cascadePlan.length > 0
      ? Math.max(...this.cascadePlan.map(p => p.depth))
      : 0;
    this.totalPredictedAffected = this.cascadePlan.length;

    const recoveryStartTime = START_T + this.duration;
    this.recoveryStartSimTime = recoveryStartTime;

    // ── Schedule failure events from plan ──────────────────────────────────
    this.cascadePlan.forEach(node => {
      this._scheduleEvent(node.failureTime, () => {
        this.graph.updateServiceStatus(node.serviceId, 'Failed');
        this.onTriggerShockwave(node.serviceId);
        this.affectedServices.add(node.serviceId);

        if (node.isPrimary) {
          this.simPhase = 'Initial Failure';
          this._log(`🚨 FAILURE: ${node.name} (${node.serviceId}) — Primary failure at T+${this.simTime}m`, 'red');
          sound.playAlarm();
        } else {
          if (this.simPhase !== 'Recovery') this.simPhase = 'Cascade Propagation';
          this._log(`⚡ CASCADE Depth ${node.depth}: ${node.name} (${node.serviceId}) disrupted at T+${this.simTime}m`, 'orange');
          sound.playCascadeWave();
        }

        // Update plan row badge in UI
        const badge = this.element.querySelector(`#badge-${node.serviceId}`);
        if (badge) {
          badge.textContent = 'FAILED';
          badge.style.background = '#FEE2E2';
          badge.style.color = '#EF4444';
        }
        const row = this.element.querySelector(`#plan-row-${node.serviceId}`);
        if (row) row.style.opacity = '1';
      });
    });

    // ── Schedule recovery event kickoff ───────────────────────────────────
    this._scheduleEvent(recoveryStartTime, () => {
      this.simPhase = 'Recovery';
      this._log(`🩹 RECOVERY: Strategy [${this.recoveryStrategy.toUpperCase()}] activated at T+${this.simTime}m`, 'green');
      sound.playRecovery();
    });

    // ── Compute and schedule individual service recoveries ─────────────────
    const recoveryPlan = this._computeRecoveryOrder(this.cascadePlan, recoveryStartTime);
    recoveryPlan.forEach(node => {
      this._scheduleEvent(node.recoveryTime, () => {
        this.graph.updateServiceStatus(node.serviceId, 'Operational');
        this.affectedServices.delete(node.serviceId);
        this._log(`✅ RESTORED: ${node.name} (${node.serviceId}) back online at T+${this.simTime}m`, 'green');
        sound.playRecovery();

        const badge = this.element.querySelector(`#badge-${node.serviceId}`);
        if (badge) {
          badge.textContent = 'OK';
          badge.style.background = '#D1FAE5';
          badge.style.color = '#059669';
        }
      });
    });

    // ── Schedule completion ───────────────────────────────────────────────
    const lastRecovery = recoveryPlan.length > 0 ? recoveryPlan[recoveryPlan.length - 1].recoveryTime : recoveryStartTime;
    this._scheduleEvent(lastRecovery + 3, () => {
      this.simPhase = 'Completed';
      this._log(`✨ SIMULATION COMPLETE: All systems operational.`, 'green');
      clearInterval(this.simInterval);
      this.simInterval = null;
      this.isSimulating = false;
    });

    // ── Render dashboard and start tick ───────────────────────────────────
    this.renderLiveDashboard();
    this.simInterval = setInterval(() => this._tick(), 500); // 500ms = 1 sim minute
  }

  stopSimulation() {
    if (this.simInterval) { clearInterval(this.simInterval); this.simInterval = null; }
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
      this.eventSchedule.get(this.simTime).forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
    }

    // Phase refinement based on sim progress
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
        'Waiting':              `⏳ Primary failure in ${Math.max(0, 5 - this.simTime)}m...`,
        'Initial Failure':      `🚨 Primary service down — watching for cascade...`,
        'Cascade Propagation':  `⚡ ${this.affectedServices.size} services down — cascade active...`,
        'Recovery':             `🩹 Recovery in progress — ${this.affectedServices.size} remaining...`,
        'Completed':            `✅ Simulation complete — all systems restored!`,
      };
      phaseEl.textContent = descriptions[this.simPhase] || this.simPhase;
    }

    const totalSvcs = this.graph.getAllServices().length;
    const currentDepth = this.affectedServices.size > 0
      ? Math.max(...[...this.affectedServices].map(id => {
          const node = this.cascadePlan.find(n => n.serviceId === id);
          return node ? node.depth : 0;
        }))
      : 0;

    const affEl = this.element.querySelector('#metric-affected');
    if (affEl) {
      affEl.textContent = `${this.affectedServices.size} / ${totalSvcs}`;
      affEl.style.color = this.affectedServices.size > 0 ? '#EF4444' : '#10B981';
    }

    const depthEl = this.element.querySelector('#metric-depth');
    if (depthEl) {
      depthEl.innerHTML = `${currentDepth} <span style="font-size:0.65rem;color:var(--text-muted);">/ ${this.maxPredictedDepth}</span>`;
    }

    const resEl = this.element.querySelector('#metric-resilience');
    if (resEl) {
      resEl.textContent = `${currentResilience}%`;
      resEl.style.color = currentResilience > 80 ? '#10B981' : currentResilience > 50 ? '#F59E0B' : '#EF4444';
    }

    const riskEl = this.element.querySelector('#metric-risk');
    const risk = this._calcRisk();
    if (riskEl) {
      riskEl.textContent = risk;
      riskEl.style.color = risk > 200 ? '#EF4444' : risk > 80 ? '#F97316' : '#10B981';
    }
  }

  _updateSteppers() {
    const ids = ['step-waiting', 'step-fail', 'step-cascade', 'step-peak', 'step-recovery', 'step-done'];
    ids.forEach(id => {
      const el = this.element.querySelector(`#${id}`);
      if (el) { el.classList.remove('active', 'done'); }
    });

    const phaseMap = {
      'Waiting':             { active: 'step-waiting', done: [] },
      'Initial Failure':     { active: 'step-fail',    done: ['step-waiting'] },
      'Cascade Propagation': { active: 'step-cascade', done: ['step-waiting', 'step-fail'] },
      'Recovery':            { active: 'step-recovery', done: ['step-waiting', 'step-fail', 'step-cascade', 'step-peak'] },
      'Completed':           { active: 'step-done',    done: ['step-waiting', 'step-fail', 'step-cascade', 'step-peak', 'step-recovery'] },
    };

    // Special: mark peak just before recovery
    if (this.simPhase === 'Cascade Propagation' && this.simTime >= this.recoveryStartSimTime - 3) {
      const peakEl = this.element.querySelector('#step-peak');
      if (peakEl) peakEl.classList.add('active');
      return;
    }

    const mapping = phaseMap[this.simPhase];
    if (!mapping) return;

    const activeEl = this.element.querySelector(`#${mapping.active}`);
    if (activeEl) activeEl.classList.add('active');

    mapping.done.forEach(id => {
      const el = this.element.querySelector(`#${id}`);
      if (el) el.classList.add('done');
    });
  }

  _calcRisk() {
    let score = 0;
    this.affectedServices.forEach(id => {
      const s = this.graph.getService(id);
      if (!s) return;
      const mult = s.criticality === 'Critical' ? 3 : s.criticality === 'High' ? 2 : 1;
      score += Math.round((s.impact_score || 50) * mult * this.severity);
    });
    return score;
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
