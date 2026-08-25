/**
 * CASCADYN - Failure Flashcard Overlay System
 * Shows a prominent flashcard overlay whenever a service fails,
 * listing all affected services, impact, and estimated recovery time.
 */

export class FailureFlashcard {
  constructor(containerElement, graph) {
    this.container = containerElement;
    this.graph = graph;
    this.element = null;
    this.dismissTimeout = null;
    this.activeFailures = new Map(); // serviceId -> { service, timestamp }

    this._init();
  }

  _init() {
    this.element = document.createElement('div');
    this.element.id = 'failure-flashcard-overlay';
    this.element.className = 'failure-flashcard-overlay hidden';
    this.container.appendChild(this.element);
  }

  /**
   * Called when a service fails - shows the flashcard with full cascade info
   */
  showFailure(primaryServiceId, cascadeTimeline = []) {
    const primary = this.graph.getService(primaryServiceId);
    if (!primary) return;

    // Cancel any existing auto-dismiss
    if (this.dismissTimeout) {
      clearTimeout(this.dismissTimeout);
      this.dismissTimeout = null;
    }

    // Build affected services list from cascade timeline
    const affected = cascadeTimeline.filter(step => step.serviceId !== primaryServiceId);
    const allAffected = cascadeTimeline;

    // Severity
    const failedCount = this.graph.getAllServices().filter(s => s.status === 'Failed').length;
    const severityLabel = failedCount >= 5 ? 'CRITICAL' : failedCount >= 3 ? 'HIGH' : failedCount >= 1 ? 'MEDIUM' : 'LOW';
    const severityColor = failedCount >= 5 ? '#EF4444' : failedCount >= 3 ? '#F97316' : '#F59E0B';

    // Recovery ETA
    const maxRecovery = allAffected.reduce((max, step) => {
      const s = this.graph.getService(step.serviceId);
      if (!s) return max;
      return Math.max(max, s.recovery_time_seconds || 0);
    }, primary.recovery_time_seconds || 0);
    const recoveryETA = this._formatRecoveryTime(maxRecovery);

    this.element.innerHTML = `
      <div class="flashcard-backdrop" id="flashcard-backdrop"></div>
      <div class="flashcard-container" id="flashcard-main">
        <!-- Animated Red Siren Bar -->
        <div class="flashcard-siren-bar">
          <div class="siren-bar-inner">
            <span class="siren-icon">🚨</span>
            <span class="siren-text">INFRASTRUCTURE FAILURE DETECTED</span>
            <span class="siren-icon">🚨</span>
          </div>
        </div>

        <!-- Primary Failure Header -->
        <div class="flashcard-header">
          <div class="flashcard-service-icon" style="background: ${primary.badge_color || '#EF4444'}22; border-color: ${primary.badge_color || '#EF4444'};">
            <span style="font-size: 2rem;">${this._getServiceEmoji(primaryServiceId)}</span>
          </div>
          <div class="flashcard-title-block">
            <div class="flashcard-badge" style="background: ${severityColor}22; color: ${severityColor}; border-color: ${severityColor};">
              ⚠ SEVERITY: ${severityLabel}
            </div>
            <h2 class="flashcard-service-name">${primary.service_name}</h2>
            <p class="flashcard-subtitle">Primary Failure → Cascade Propagation Active</p>
          </div>
          <button class="flashcard-close-btn" id="flashcard-close-btn" title="Dismiss">✕</button>
        </div>

        <!-- Impact Summary Bar -->
        <div class="flashcard-impact-bar">
          <div class="impact-metric">
            <div class="impact-metric-val" style="color: #EF4444;">${allAffected.length}</div>
            <div class="impact-metric-label">Services Down</div>
          </div>
          <div class="impact-divider"></div>
          <div class="impact-metric">
            <div class="impact-metric-val" style="color: #00D2FF; font-family: var(--font-mono); font-size: 1.05rem;">
              $${((primary.repair_budget_usd || 2000000) / 1000000).toFixed(1)}M
            </div>
            <div class="impact-metric-label">Govt Repair Cost</div>
          </div>
          <div class="impact-divider"></div>
          <div class="impact-metric">
            <div class="impact-metric-val" style="color: #EF4444; font-family: var(--font-mono); font-size: 1.05rem;">
              $${((primary.hourly_economic_bleed_usd || 500000) / 1000).toFixed(0)}k/h
            </div>
            <div class="impact-metric-label">Economic Bleed</div>
          </div>
          <div class="impact-divider"></div>
          <div class="impact-metric">
            <div class="impact-metric-val" style="color: #F59E0B;">⏱ ${recoveryETA}</div>
            <div class="impact-metric-label">Est. Recovery</div>
          </div>
        </div>

        <!-- What Happened Description -->
        <div class="flashcard-description">
          <div class="flashcard-desc-label">📍 What Happened</div>
          <p>${primary.description}</p>
          <p style="margin-top: 6px; color: #F97316; font-weight: 600;">
            Backup: ${primary.backup_system || 'Standard Grid Redundancy'}
          </p>
        </div>

        <!-- Cascade Impact: All Affected Services -->
        ${affected.length > 0 ? `
        <div class="flashcard-cascade-section">
          <div class="flashcard-desc-label" style="color: #F97316;">⚡ Cascade Impact — ${affected.length} Downstream Service${affected.length !== 1 ? 's' : ''} Affected</div>
          <div class="flashcard-cascade-grid">
            ${affected.slice(0, 6).map(step => {
              const s = this.graph.getService(step.serviceId);
              if (!s) return '';
              return `
                <div class="cascade-service-chip">
                  <span class="chip-emoji">${this._getServiceEmoji(step.serviceId)}</span>
                  <div class="chip-info">
                    <div class="chip-name">${s.service_name}</div>
                    <div class="chip-detail">Depth ${step.depth} · +${Math.round(step.timeSeconds / 60 * 0.4)}m</div>
                  </div>
                  <span class="chip-severity" style="color: ${s.criticality === 'Critical' ? '#EF4444' : s.criticality === 'High' ? '#F97316' : '#F59E0B'};">${s.criticality}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Recovery Guide -->
        <div class="flashcard-recovery-guide">
          <div class="recovery-guide-label">✅ Recommended Actions</div>
          <div class="recovery-actions-list">
            <div class="recovery-action-item">
              <span class="action-num">1</span>
              <span>Click <strong>"Deploy Emergency Recovery"</strong> in the inspector panel to restore this service</span>
            </div>
            <div class="recovery-action-item">
              <span class="action-num">2</span>
              <span>Use <strong>"Reset City"</strong> in the top bar to restore ALL services instantly</span>
            </div>
            <div class="recovery-action-item">
              <span class="action-num">3</span>
              <span>Try the <strong>What-If Sandbox</strong> to simulate recovery strategies</span>
            </div>
          </div>
        </div>

        <!-- Bottom dismiss note -->
        <div class="flashcard-footer">
          <span>Click anywhere outside or press ESC to dismiss • Auto-closes in 15s</span>
        </div>
      </div>
    `;

    this.element.classList.remove('hidden');
    this.element.classList.add('visible');

    // Bind dismiss events
    const closeBtn = this.element.querySelector('#flashcard-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.dismiss());

    const backdrop = this.element.querySelector('#flashcard-backdrop');
    if (backdrop) backdrop.addEventListener('click', () => this.dismiss());

    // ESC key
    this._escHandler = (e) => {
      if (e.key === 'Escape') this.dismiss();
    };
    document.addEventListener('keydown', this._escHandler);

    // Auto-dismiss after 15 seconds
    this.dismissTimeout = setTimeout(() => this.dismiss(), 15000);
  }

  /**
   * Shows a quick recovery toast (when a service comes back online)
   */
  showRecovery(serviceId) {
    const service = this.graph.getService(serviceId);
    if (!service) return;

    // Quick toast notification
    const toast = document.createElement('div');
    toast.className = 'recovery-toast';
    toast.innerHTML = `
      <span class="toast-emoji">✅</span>
      <div class="toast-text">
        <strong>${service.service_name}</strong>
        <span>Back Online — Operational</span>
      </div>
    `;
    this.container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('toast-visible');
    });

    // Auto remove after 3s
    setTimeout(() => {
      toast.classList.remove('toast-visible');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  dismiss() {
    this.element.classList.remove('visible');
    this.element.classList.add('hidden');
    if (this.dismissTimeout) {
      clearTimeout(this.dismissTimeout);
      this.dismissTimeout = null;
    }
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }
  }

  _getServiceEmoji(serviceId) {
    if (serviceId.includes('PWR')) return '⚡';
    if (serviceId.includes('WTR')) return '💧';
    if (serviceId.includes('TEL')) return '📡';
    if (serviceId.includes('HOS')) return '🏥';
    if (serviceId.includes('TRF')) return '🚦';
    if (serviceId.includes('TRN')) return '🚇';
    if (serviceId.includes('EMG')) return '🚨';
    if (serviceId.includes('GOV')) return '🏛️';
    return '⚙️';
  }

  _formatRecoveryTime(seconds) {
    if (!seconds) return 'Unknown';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''}`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
  }
}
