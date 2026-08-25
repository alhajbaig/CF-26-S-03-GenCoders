/**
 * CASCADYN - Municipal Budget Allocator & Resilience Finance Engine
 * Features:
 * - Dynamic multi-factor budget distribution based on Priority (Criticality), Use (Live Load %), and Cascade Risk
 * - Dedicated Disaster Disruption & Rapid Recovery Reserve Fund
 * - Comprehensive Allocation Rationale & Explainability Engine (tells user EXACTLY why budget was allocated this way)
 * - Two-way live synchronization with What-If Simulator and 3D City Engine
 * - CSV & JSON Budget file import/export + sample template generation
 * - 5 Strategy Presets: Balanced, Life Safety, High Demand, Infrastructure Hardening, Custom
 * - Compact Dock View + High-Resolution Full-Screen Analytics Studio Modal with Explainability Tab
 * - Real-time Disaster Stress-Testing & Recovery Coverage Ratio Analytics
 * - Live City Integration: applies funding investments to boost resilience & reduce MTTR
 */

import { sound } from '../engine/audioEngine.js';

export class BudgetAllocator {
  constructor(containerElement, graph, onFocusService, onApplyToCity) {
    this.container = containerElement;
    this.graph = graph;
    this.onFocusService = onFocusService;
    this.onApplyToCity = onApplyToCity;

    // Core State
    this.totalBudget = 50000000; // $50M default
    this.reservePercentage = 20; // 20% reserve
    this.strategy = 'balanced'; // 'balanced' | 'life_safety' | 'high_demand' | 'hardening' | 'custom'

    // Strategy factor weights [0.0 - 1.0]
    this.weights = {
      priority: 0.40,
      usage: 0.35,
      cascade: 0.25
    };

    // Service-specific custom locks / overrides { [serviceId]: lockedAmount }
    this.serviceLocks = new Map();

    // Expanded reasons tracker in dock { [serviceId]: boolean }
    this.expandedReasons = new Set();

    // UI elements
    this.element = null;
    this.analyticsModal = null;
    this.isModalOpen = false;
    this.activeAnalyticsTab = 'overview'; // 'overview' | 'explainability' | 'reserves' | 'matrix' | 'upload'
    this.selectedExplainServiceId = 'PWR-01';

    // Applied state tracker
    this.isAppliedToCity = false;
    this.lastAppliedTimestamp = null;

    this.init();
  }

  init() {
    this.element = document.createElement('div');
    this.element.id = 'budget-allocator-container';
    this.element.className = 'budget-allocator-wrapper';
    this.container.appendChild(this.element);

    this.createAnalyticsModal();
    this.renderDockView();

    // Initial broadcast to sync with What-If Simulator
    if (this.onApplyToCity) {
      this.onApplyToCity(this.calculateAllocation());
    }

    // Subscribe to graph changes (e.g. dataset switch)
    this.graph.subscribe(() => {
      this.recalculate();
      this.renderDockView();
      if (this.isModalOpen) {
        this.renderModalContent();
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CALCULATION & ALLOCATION ENGINE WITH EXPLAINABILITY
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Computes full budget allocation breakdown across all services & reserves
   * Includes detailed mathematical justifications and reasons for each service.
   */
  calculateAllocation() {
    const services = this.graph.getAllServices();
    if (!services || services.length === 0) {
      return {
        totalBudget: this.totalBudget,
        reserveAmount: 0,
        preventionReserve: 0,
        recoveryReserve: 0,
        activePool: 0,
        strategy: this.strategy,
        weights: this.weights,
        serviceAllocations: [],
        kpis: {
          resilienceBoost: 0,
          mttrReductionPct: 0,
          coverageRatioPct: 0,
          economicBufferHours: 0,
          worstCaseCascadeCost: 0
        }
      };
    }

    const reserveAmount = (this.totalBudget * this.reservePercentage) / 100;
    const preventionReserve = reserveAmount * 0.5; // Proactive hardening
    const recoveryReserve = reserveAmount * 0.5;   // Emergency recovery
    let activePool = this.totalBudget - reserveAmount;

    // Priority multiplier map
    const priorityMultipliers = {
      'Critical': 4.0,
      'High': 2.5,
      'Medium': 1.5,
      'Low': 1.0
    };

    // 1. Calculate raw multi-factor scores for each service
    const serviceScores = services.map(service => {
      const metrics = this.graph.getDependencyMetrics(service.service_id);
      const downstreamCount = metrics.downstreamCount || 0;
      const downstreamList = this.graph.getDownstreamDependents(service.service_id);
      
      // Normalized factors (0 to 1)
      const pFactor = (priorityMultipliers[service.criticality] || 1.5) / 4.0;
      const uFactor = Math.min(1, Math.max(0.1, (service.load_percentage || 50) / 100));
      const cFactor = Math.min(1, (downstreamCount * 0.15) + ((service.impact_score || 50) / 150));

      const rawScore = 
        (this.weights.priority * pFactor) +
        (this.weights.usage * uFactor) +
        (this.weights.cascade * cFactor);

      return {
        service,
        service_id: service.service_id,
        service_name: service.service_name,
        criticality: service.criticality,
        load_percentage: service.load_percentage || 50,
        capacity: service.capacity_mw || 'Standard',
        impact_score: service.impact_score || 75,
        downstreamCount,
        downstreamList,
        pFactor,
        uFactor,
        cFactor,
        rawScore: Math.max(0.01, rawScore),
        isLocked: this.serviceLocks.has(service.service_id),
        lockedAmount: this.serviceLocks.get(service.service_id) || 0
      };
    });

    // 2. Handle locked services vs unlocked distribution pool
    let remainingPool = activePool;
    let unlockedScoreSum = 0;

    serviceScores.forEach(item => {
      if (item.isLocked) {
        remainingPool -= item.lockedAmount;
      } else {
        unlockedScoreSum += item.rawScore;
      }
    });

    if (remainingPool < 0) remainingPool = 0;
    if (unlockedScoreSum <= 0) unlockedScoreSum = 1;

    // 3. Finalize service allocation amounts & generate AI-grade reasoning
    const allocations = serviceScores.map(item => {
      let allocated = item.isLocked 
        ? item.lockedAmount 
        : (remainingPool * (item.rawScore / unlockedScoreSum));

      allocated = Math.max(0, Math.round(allocated));

      const shareOfActivePool = activePool > 0 ? (allocated / activePool) * 100 : 0;
      const shareOfTotalBudget = this.totalBudget > 0 ? (allocated / this.totalBudget) * 100 : 0;

      // CapEx vs OpEx
      const capexPct = item.criticality === 'Critical' ? 0.70 : item.criticality === 'High' ? 0.65 : 0.55;
      const capexAmount = Math.round(allocated * capexPct);
      const opexAmount = allocated - capexAmount;

      // Base repair benchmark from dataset
      const baseRepairCost = item.service.repair_budget_usd || 2000000;
      const fundingAdequacy = (allocated / baseRepairCost) * 100;

      // Generate structured Allocation Rationale & Reasons
      const reasons = this._generateAllocationReason(item, allocated, shareOfActivePool, capexAmount, opexAmount, fundingAdequacy);

      return {
        ...item,
        allocatedAmount: allocated,
        shareOfActivePool,
        shareOfTotalBudget,
        capexAmount,
        opexAmount,
        baseRepairCost,
        fundingAdequacy: Math.round(fundingAdequacy),
        reasons
      };
    });

    // 4. City-Wide Resilience & Disruption Stress-Test Analytics
    const worstCaseCascadeCost = services.reduce((acc, s) => acc + (s.repair_budget_usd || 2000000), 0);
    const totalHourlyBleed = services.reduce((acc, s) => acc + (s.hourly_economic_bleed_usd || 500000), 0);
    const totalHourlyOps = services.reduce((acc, s) => acc + (s.emergency_ops_hourly_usd || 40000), 0);

    const coverageRatioPct = worstCaseCascadeCost > 0 
      ? Math.round((recoveryReserve / worstCaseCascadeCost) * 100) 
      : 100;

    const economicBufferHours = totalHourlyBleed > 0 
      ? (recoveryReserve / (totalHourlyBleed + totalHourlyOps)).toFixed(1) 
      : "0.0";

    const fundingRatio = activePool / (worstCaseCascadeCost || 1);
    const mttrReductionPct = Math.min(65, Math.round(Math.pow(fundingRatio, 0.4) * 35));

    const baseResilience = this.graph.getResilienceScore();
    const resilienceBoost = Math.min(100 - baseResilience, Math.round((activePool / this.totalBudget) * 15 * (1 + preventionReserve / this.totalBudget)));
    const projectedResilience = Math.min(100, baseResilience + resilienceBoost);

    return {
      totalBudget: this.totalBudget,
      reservePercentage: this.reservePercentage,
      reserveAmount,
      preventionReserve,
      recoveryReserve,
      activePool,
      strategy: this.strategy,
      weights: this.weights,
      serviceAllocations: allocations,
      kpis: {
        baseResilience,
        projectedResilience,
        resilienceBoost,
        mttrReductionPct,
        coverageRatioPct,
        economicBufferHours,
        worstCaseCascadeCost,
        totalHourlyBleed,
        totalHourlyOps
      }
    };
  }

  /**
   * Generates comprehensive explainability reasons for why a service received its specific allocation
   */
  _generateAllocationReason(item, allocated, share, capex, opex, adequacy) {
    const isCritical = item.criticality === 'Critical';
    const isHigh = item.criticality === 'High';
    const hasManyDownstream = item.downstreamCount >= 3;
    const isHeavyLoad = item.load_percentage >= 65;

    // 1. Criticality Justification
    let critReason = '';
    if (isCritical) {
      critReason = `Designated as Critical Life-Safety tier (4.0× multiplier). Mandatory top-tier funding to prevent catastrophic civic or life-support failure.`;
    } else if (isHigh) {
      critReason = `Designated as High Priority tier (2.5× multiplier). Powers essential municipal operations and public infrastructure continuity.`;
    } else {
      critReason = `Designated as ${item.criticality} Priority (${item.criticality === 'Medium' ? '1.5×' : '1.0×'} multiplier). Standard maintenance tier with lower immediate contagion risk.`;
    }

    // 2. Load & Utilization Justification
    let loadReason = '';
    if (isHeavyLoad) {
      loadReason = `Operating under high active load of ${item.load_percentage}% (${item.capacity}). Heavy continuous strain requires ${this._formatMoney(opex)} OpEx for wear-and-tear mitigation and thermal cooling.`;
    } else {
      loadReason = `Operating at moderate load of ${item.load_percentage}% (${item.capacity}) with sufficient operational headroom, allowing balanced capital distribution.`;
    }

    // 3. Systemic Graph Cascade Justification
    let cascadeReason = '';
    if (hasManyDownstream) {
      const targets = item.downstreamList.map(d => d.service?.service_name.split('/')[0].trim()).slice(0, 3).join(', ');
      cascadeReason = `Major systemic backbone node directly energizing ${item.downstreamCount} downstream systems (e.g. ${targets}). A failure produces an immediate ${item.impact_score}/100 cascade impact wave.`;
    } else if (item.downstreamCount > 0) {
      cascadeReason = `Connected to ${item.downstreamCount} downstream target(s) with ${item.impact_score}/100 impact rating. Medium cascade blast radius.`;
    } else {
      cascadeReason = `Endpoint service node with zero downstream dependencies. Outages remain localized without triggering domino failure waves.`;
    }

    // 4. Executive Summary Synthesis
    const summary = `${item.service_name} receives ${this._formatMoney(allocated)} (${share.toFixed(1)}% of pool) based on its ${item.criticality} tier, ${item.load_percentage}% utilization load, and ${item.downstreamCount} connected graph dependencies. Covers ${Math.round(adequacy)}% of base capital repair benchmark with ${this._formatMoney(capex)} for physical hardening.`;

    return {
      summary,
      critReason,
      loadReason,
      cascadeReason,
      primaryDriver: isCritical ? 'Critical Life-Safety' : isHeavyLoad ? 'High Demand Load' : hasManyDownstream ? 'Graph Dependency Centrality' : 'Standard Distribution'
    };
  }

  recalculate() {
    return this.calculateAllocation();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STRATEGY PRESETS
  // ─────────────────────────────────────────────────────────────────────────

  setStrategy(strategyKey) {
    sound.playClick();
    this.strategy = strategyKey;

    switch (strategyKey) {
      case 'balanced':
        this.weights = { priority: 0.40, usage: 0.35, cascade: 0.25 };
        this.reservePercentage = 20;
        break;
      case 'life_safety':
        this.weights = { priority: 0.65, usage: 0.20, cascade: 0.15 };
        this.reservePercentage = 25;
        break;
      case 'high_demand':
        this.weights = { priority: 0.20, usage: 0.60, cascade: 0.20 };
        this.reservePercentage = 15;
        break;
      case 'hardening':
        this.weights = { priority: 0.25, usage: 0.25, cascade: 0.50 };
        this.reservePercentage = 30;
        break;
      case 'custom':
        break;
    }

    const data = this.calculateAllocation();
    if (this.onApplyToCity) {
      this.onApplyToCity(data);
    }

    this.renderDockView();
    if (this.isModalOpen) {
      this.renderModalContent();
    }
  }

  setBudgetPreset(amount) {
    sound.playClick();
    this.totalBudget = amount;
    const data = this.calculateAllocation();
    if (this.onApplyToCity) {
      this.onApplyToCity(data);
    }
    this.renderDockView();
    if (this.isModalOpen) {
      this.renderModalContent();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DOCK VIEW RENDERING (With Interactive Explainability Drawers)
  // ─────────────────────────────────────────────────────────────────────────

  renderDockView() {
    const data = this.calculateAllocation();
    const formattedTotal = this._formatMoney(this.totalBudget);
    const formattedActive = this._formatMoney(data.activePool);
    const formattedReserve = this._formatMoney(data.reserveAmount);

    this.element.innerHTML = `
      <div class="dock-title">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.1rem;">💰</span>
          <span>Budget Allocator</span>
        </div>
        <button id="btn-expand-budget-modal" class="btn-icon" title="Expand Full Budget & Resilience Analytics Studio" style="width: 28px; height: 28px;">
          <i data-lucide="maximize-2" style="width: 15px; height: 15px;"></i>
        </button>
      </div>

      <!-- Quick Total Budget Input & Presets -->
      <div class="budget-input-card">
        <div class="budget-input-header">
          <label for="slider-total-budget" class="budget-label">Total Municipal Budget</label>
          <span class="budget-badge-pill" id="badge-total-budget">${formattedTotal}</span>
        </div>
        
        <div class="budget-slider-wrapper">
          <input 
            type="range" 
            id="slider-total-budget" 
            class="budget-range-slider" 
            min="5000000" 
            max="200000000" 
            step="1000000" 
            value="${this.totalBudget}" 
          />
          <div class="slider-ticks-row">
            <span>$5M</span>
            <span>$50M</span>
            <span>$100M</span>
            <span>$200M</span>
          </div>
        </div>

        <!-- Quick Preset Pills -->
        <div class="budget-presets-grid">
          <button class="budget-preset-btn ${this.totalBudget === 15000000 ? 'active' : ''}" data-budget="15000000">$15M</button>
          <button class="budget-preset-btn ${this.totalBudget === 35000000 ? 'active' : ''}" data-budget="35000000">$35M</button>
          <button class="budget-preset-btn ${this.totalBudget === 50000000 ? 'active' : ''}" data-budget="50000000">$50M</button>
          <button class="budget-preset-btn ${this.totalBudget === 100000000 ? 'active' : ''}" data-budget="100000000">$100M</button>
        </div>
      </div>

      <!-- Strategy Presets Selector -->
      <div class="budget-strategy-section">
        <div class="strategy-section-title">
          <span>Allocation Strategy</span>
          <span class="strategy-tag">${this.strategy.replace('_', ' ').toUpperCase()}</span>
        </div>
        <div class="strategy-chips-container">
          <button class="strategy-chip ${this.strategy === 'balanced' ? 'active' : ''}" data-strat="balanced" title="Balance Priority (40%), Usage (35%), & Cascade (25%)">
            🛡️ Balanced
          </button>
          <button class="strategy-chip ${this.strategy === 'life_safety' ? 'active' : ''}" data-strat="life_safety" title="65% Weight on Critical Life Safety & Emergency">
            🚨 Life Safety
          </button>
          <button class="strategy-chip ${this.strategy === 'high_demand' ? 'active' : ''}" data-strat="high_demand" title="60% Weight on Active Load & Capacity Usage">
            ⚡ High Demand
          </button>
          <button class="strategy-chip ${this.strategy === 'hardening' ? 'active' : ''}" data-strat="hardening" title="50% Weight on Graph Dependencies & Hardening">
            🌐 Hardening
          </button>
        </div>
      </div>

      <!-- Disruption & Recovery Reserve Slider -->
      <div class="reserve-control-card">
        <div class="reserve-header-row">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 0.9rem;">🛡️</span>
            <span class="reserve-label">Disruption & Recovery Reserve</span>
          </div>
          <span class="reserve-val-text">${this.reservePercentage}% (${formattedReserve})</span>
        </div>

        <input 
          type="range" 
          id="slider-reserve-pct" 
          class="budget-range-slider reserve-slider" 
          min="5" 
          max="40" 
          step="5" 
          value="${this.reservePercentage}" 
        />
        
        <div class="reserve-split-bar">
          <div class="reserve-sub-pill" title="Proactive hardware redundancy & failover">
            <i data-lucide="shield-check" style="width: 12px; height: 12px; color: #10B981;"></i>
            <span>Hardening: ${this._formatMoney(data.preventionReserve)}</span>
          </div>
          <div class="reserve-sub-pill" title="Emergency crew & rapid parts replacement">
            <i data-lucide="life-buoy" style="width: 12px; height: 12px; color: #F59E0B;"></i>
            <span>Recovery: ${this._formatMoney(data.recoveryReserve)}</span>
          </div>
        </div>
      </div>

      <!-- File Upload & Export Mini Toolbar -->
      <div class="budget-file-toolbar">
        <label class="btn btn-secondary budget-mini-btn" style="cursor: pointer;" title="Upload custom JSON or CSV budget">
          <i data-lucide="upload" style="width: 13px; height: 13px;"></i>
          Upload Budget
          <input type="file" id="dock-budget-file-input" accept=".json,.csv" style="display: none;" />
        </label>
        <button id="dock-btn-download-template" class="btn btn-secondary budget-mini-btn" title="Download template JSON">
          <i data-lucide="file-code" style="width: 13px; height: 13px;"></i>
          Template
        </button>
        <button id="dock-btn-export-csv" class="btn btn-secondary budget-mini-btn" title="Export current allocation as CSV">
          <i data-lucide="download" style="width: 13px; height: 13px;"></i>
          Export
        </button>
      </div>

      <!-- Live Service Allocation List with EXPLAINABILITY EXPANDERS -->
      <div class="dock-allocations-header">
        <span>Allocations & Rationale (${data.serviceAllocations.length})</span>
        <span style="font-size: 0.72rem; color: var(--text-muted);">Pool: ${formattedActive}</span>
      </div>

      <div class="dock-allocations-list">
        ${data.serviceAllocations.map(s => {
          const emoji = this._getServiceEmoji(s.service_id);
          const formattedAmt = this._formatMoney(s.allocatedAmount);
          const barPct = Math.min(100, Math.max(5, s.shareOfActivePool * 3.2));
          const isExpanded = this.expandedReasons.has(s.service_id);
          const statusColor = s.criticality === 'Critical' ? '#EF4444'
            : s.criticality === 'High' ? '#F97316'
            : s.criticality === 'Medium' ? '#F59E0B'
            : '#10B981';

          return `
            <div class="dock-alloc-row ${isExpanded ? 'expanded' : ''}" data-service-id="${s.service_id}">
              <div class="dock-alloc-info">
                <div class="dock-alloc-left">
                  <span class="dock-alloc-emoji">${emoji}</span>
                  <div>
                    <div class="dock-alloc-name">${s.service_name}</div>
                    <div class="dock-alloc-meta">
                      <span style="color: ${statusColor}; font-weight: 600;">${s.criticality}</span>
                      <span>• Load ${s.load_percentage}%</span>
                      <span>• Links: ${s.downstreamCount}</span>
                    </div>
                  </div>
                </div>
                <div class="dock-alloc-right">
                  <div class="dock-alloc-amount">${formattedAmt}</div>
                  <div class="dock-alloc-share">${s.shareOfActivePool.toFixed(1)}% pool</div>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="dock-alloc-track">
                <div class="dock-alloc-fill" style="width: ${barPct}%; background: ${statusColor};"></div>
              </div>

              <!-- Explainability Trigger Button -->
              <div class="dock-reason-toggle-row">
                <button class="btn-toggle-reason" data-toggle-service="${s.service_id}">
                  <span class="reason-indicator">💡</span>
                  <span>Why this amount?</span>
                  <i data-lucide="${isExpanded ? 'chevron-up' : 'chevron-down'}" style="width: 12px; height: 12px; margin-left: auto;"></i>
                </button>
              </div>

              <!-- Expandable Reason Box -->
              <div class="dock-reason-drawer ${isExpanded ? 'open' : ''}">
                <div class="reason-driver-tag">
                  <span>Primary Driver:</span> <strong>${s.reasons.primaryDriver}</strong>
                </div>
                <ul class="reason-points-list">
                  <li>🎯 <strong>Priority Factor:</strong> ${s.reasons.critReason}</li>
                  <li>📈 <strong>Utilization Factor:</strong> ${s.reasons.loadReason}</li>
                  <li>🌐 <strong>Cascade Blast Radius:</strong> ${s.reasons.cascadeReason}</li>
                </ul>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Action Buttons Bar -->
      <div class="budget-dock-actions">
        <button id="btn-apply-budget-city" class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: var(--shadow-magenta);">
          <i data-lucide="zap" style="width: 16px; height: 16px;"></i>
          ${this.isAppliedToCity ? '✓ Budget Synced with What-If' : 'Apply Budget to What-If & 3D City'}
        </button>
        <button id="btn-open-analytics-studio" class="btn btn-secondary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i data-lucide="bar-chart-3" style="width: 16px; height: 16px;"></i>
          Open Full Analytics Studio
        </button>
      </div>
    `;

    this.bindDockEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  bindDockEvents() {
    // Total budget slider
    const budgetSlider = this.element.querySelector('#slider-total-budget');
    if (budgetSlider) {
      budgetSlider.addEventListener('input', (e) => {
        this.totalBudget = parseInt(e.target.value, 10);
        const badge = this.element.querySelector('#badge-total-budget');
        if (badge) badge.textContent = this._formatMoney(this.totalBudget);
        
        // Auto-sync with What-If
        const data = this.calculateAllocation();
        if (this.onApplyToCity) this.onApplyToCity(data);

        this.renderDockView();
      });
    }

    // Preset buttons
    this.element.querySelectorAll('.budget-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.getAttribute('data-budget'), 10);
        this.setBudgetPreset(val);
      });
    });

    // Strategy chips
    this.element.querySelectorAll('.strategy-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const strat = chip.getAttribute('data-strat');
        this.setStrategy(strat);
      });
    });

    // Reserve slider
    const reserveSlider = this.element.querySelector('#slider-reserve-pct');
    if (reserveSlider) {
      reserveSlider.addEventListener('input', (e) => {
        this.reservePercentage = parseInt(e.target.value, 10);
        const data = this.calculateAllocation();
        if (this.onApplyToCity) this.onApplyToCity(data);
        this.renderDockView();
      });
    }

    // Toggle Explainability Drawers
    this.element.querySelectorAll('.btn-toggle-reason').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playClick();
        const id = btn.getAttribute('data-toggle-service');
        if (this.expandedReasons.has(id)) {
          this.expandedReasons.delete(id);
        } else {
          this.expandedReasons.add(id);
        }
        this.renderDockView();
      });
    });

    // Service row clicks (focus on 3D building)
    this.element.querySelectorAll('.dock-alloc-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.btn-toggle-reason') || e.target.closest('.dock-reason-drawer')) return;
        sound.playClick();
        const id = row.getAttribute('data-service-id');
        if (this.onFocusService) this.onFocusService(id);
      });
    });

    // File input
    const fileInput = this.element.querySelector('#dock-budget-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) this.handleFileUpload(file);
      });
    }

    // Template download
    const tplBtn = this.element.querySelector('#dock-btn-download-template');
    if (tplBtn) {
      tplBtn.addEventListener('click', () => {
        sound.playClick();
        this.downloadSampleTemplate();
      });
    }

    // CSV export
    const exportBtn = this.element.querySelector('#dock-btn-export-csv');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        sound.playClick();
        this.exportAllocationCSV();
      });
    }

    // Apply budget to city button
    const applyBtn = this.element.querySelector('#btn-apply-budget-city');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        this.applyBudgetToLiveCity();
      });
    }

    // Expand analytics modal buttons
    const expandBtn = this.element.querySelector('#btn-expand-budget-modal');
    const studioBtn = this.element.querySelector('#btn-open-analytics-studio');
    if (expandBtn) expandBtn.addEventListener('click', () => this.openAnalyticsModal());
    if (studioBtn) studioBtn.addEventListener('click', () => this.openAnalyticsModal());
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FULL-SCREEN ANALYTICS STUDIO MODAL WITH EXPLAINABILITY TAB
  // ─────────────────────────────────────────────────────────────────────────

  createAnalyticsModal() {
    this.analyticsModal = document.createElement('div');
    this.analyticsModal.id = 'budget-analytics-modal';
    this.analyticsModal.className = 'modal-backdrop budget-modal-backdrop';
    this.analyticsModal.style.display = 'none';

    document.body.appendChild(this.analyticsModal);
  }

  openAnalyticsModal() {
    sound.playClick();
    this.isModalOpen = true;
    this.analyticsModal.style.display = 'flex';
    this.renderModalContent();
  }

  closeAnalyticsModal() {
    sound.playClick();
    this.isModalOpen = false;
    this.analyticsModal.style.display = 'none';
  }

  renderModalContent() {
    const data = this.calculateAllocation();
    const formattedTotal = this._formatMoney(this.totalBudget);
    const formattedActive = this._formatMoney(data.activePool);
    const formattedReserve = this._formatMoney(data.reserveAmount);

    this.analyticsModal.innerHTML = `
      <div class="modal-card budget-analytics-card">
        <!-- Modal Header -->
        <div class="modal-header budget-modal-header">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div class="budget-modal-icon-badge">
              <i data-lucide="pie-chart" style="width: 24px; height: 24px; color: #FFFFFF;"></i>
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <h2 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 800; color: var(--text-primary);">
                  Municipal Budget & Resilience Analytics Studio
                </h2>
                <span class="pill green" style="font-size: 0.72rem; padding: 2px 8px;">Synced with What-If Sandbox</span>
              </div>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                Strategic capital allocation, multi-factor explainability engine, and disaster recovery reserve analytics
              </p>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <button id="modal-btn-export-json" class="btn btn-secondary" style="font-size: 0.8rem; padding: 8px 14px;">
              <i data-lucide="file-json" style="width: 15px; height: 15px;"></i>
              Export JSON
            </button>
            <button id="modal-btn-export-csv" class="btn btn-secondary" style="font-size: 0.8rem; padding: 8px 14px;">
              <i data-lucide="file-spreadsheet" style="width: 15px; height: 15px;"></i>
              Export CSV
            </button>
            <button id="modal-btn-print-report" class="btn btn-secondary" style="font-size: 0.8rem; padding: 8px 14px;">
              <i data-lucide="printer" style="width: 15px; height: 15px;"></i>
              Print
            </button>
            <button id="btn-close-budget-modal" class="btn-icon" style="width: 36px; height: 36px;">
              <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>
          </div>
        </div>

        <!-- KPI Hero Metric Cards -->
        <div class="budget-kpi-grid">
          <div class="kpi-metric-card">
            <div class="kpi-top">
              <span class="kpi-title">Total Municipal Budget</span>
              <div class="kpi-icon-box" style="background: rgba(255, 46, 147, 0.12); color: #FF2E93;">
                <i data-lucide="wallet" style="width: 16px; height: 16px;"></i>
              </div>
            </div>
            <div class="kpi-value">${formattedTotal}</div>
            <div class="kpi-subtext">
              <span>Pool: ${formattedActive}</span> • <span>Reserve: ${formattedReserve}</span>
            </div>
          </div>

          <div class="kpi-metric-card">
            <div class="kpi-top">
              <span class="kpi-title">Projected Resilience</span>
              <div class="kpi-icon-box" style="background: rgba(16, 185, 129, 0.12); color: #10B981;">
                <i data-lucide="shield-alert" style="width: 16px; height: 16px;"></i>
              </div>
            </div>
            <div class="kpi-value" style="color: #10B981;">${data.kpis.projectedResilience}%</div>
            <div class="kpi-subtext">
              <span style="color: #10B981; font-weight: 700;">+${data.kpis.resilienceBoost}% boost</span> from baseline (${data.kpis.baseResilience}%)
            </div>
          </div>

          <div class="kpi-metric-card">
            <div class="kpi-top">
              <span class="kpi-title">Cascade Disaster Coverage</span>
              <div class="kpi-icon-box" style="background: rgba(14, 165, 233, 0.12); color: #0EA5E9;">
                <i data-lucide="umbrella" style="width: 16px; height: 16px;"></i>
              </div>
            </div>
            <div class="kpi-value" style="color: ${data.kpis.coverageRatioPct >= 100 ? '#10B981' : '#F59E0B'};">
              ${data.kpis.coverageRatioPct}%
            </div>
            <div class="kpi-subtext">
              Worst-case repair: ${this._formatMoney(data.kpis.worstCaseCascadeCost)}
            </div>
          </div>

          <div class="kpi-metric-card">
            <div class="kpi-top">
              <span class="kpi-title">Disaster Recovery (MTTR)</span>
              <div class="kpi-icon-box" style="background: rgba(245, 158, 11, 0.12); color: #F59E0B;">
                <i data-lucide="timer" style="width: 16px; height: 16px;"></i>
              </div>
            </div>
            <div class="kpi-value" style="color: #F59E0B;">-${data.kpis.mttrReductionPct}%</div>
            <div class="kpi-subtext">
              Cushions <strong>${data.kpis.economicBufferHours}h</strong> economic loss
            </div>
          </div>
        </div>

        <!-- Studio Navigation Tabs (Including Explainability Engine) -->
        <div class="budget-modal-tabs">
          <button class="modal-tab-btn ${this.activeAnalyticsTab === 'overview' ? 'active' : ''}" data-tab="overview">
            <i data-lucide="layout-grid" style="width: 15px; height: 15px;"></i>
            Allocation & Breakdown
          </button>
          <button class="modal-tab-btn ${this.activeAnalyticsTab === 'explainability' ? 'active' : ''}" data-tab="explainability">
            <i data-lucide="sparkles" style="width: 15px; height: 15px;"></i>
            Allocation Rationale & Reasons
          </button>
          <button class="modal-tab-btn ${this.activeAnalyticsTab === 'reserves' ? 'active' : ''}" data-tab="reserves">
            <i data-lucide="shield-check" style="width: 15px; height: 15px;"></i>
            Disruption & Recovery Reserve
          </button>
          <button class="modal-tab-btn ${this.activeAnalyticsTab === 'matrix' ? 'active' : ''}" data-tab="matrix">
            <i data-lucide="scatter-chart" style="width: 15px; height: 15px;"></i>
            Risk vs. Budget Matrix
          </button>
          <button class="modal-tab-btn ${this.activeAnalyticsTab === 'upload' ? 'active' : ''}" data-tab="upload">
            <i data-lucide="upload-cloud" style="width: 15px; height: 15px;"></i>
            Upload & Data Config
          </button>
        </div>

        <!-- Tab Body Content -->
        <div class="budget-modal-body">
          ${this._renderModalTabContent(data)}
        </div>

        <!-- Modal Footer Controls -->
        <div class="modal-footer budget-modal-footer">
          <div class="footer-left-info">
            <span>Strategy: <strong>${this.strategy.toUpperCase()}</strong></span> • 
            <span>Reserve: <strong>${this.reservePercentage}% (${formattedReserve})</strong></span> •
            <span>What-If Status: <strong style="color: #10B981;">Connected</strong></span>
          </div>
          <div style="display: flex; gap: 12px;">
            <button id="modal-btn-apply-city" class="btn btn-primary" style="box-shadow: var(--shadow-magenta);">
              <i data-lucide="zap" style="width: 16px; height: 16px;"></i>
              Sync & Deploy to What-If Simulator
            </button>
            <button id="modal-btn-close" class="btn btn-secondary">
              Close Studio
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindModalEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  _renderModalTabContent(data) {
    if (this.activeAnalyticsTab === 'overview') {
      return this._renderOverviewTab(data);
    } else if (this.activeAnalyticsTab === 'explainability') {
      return this._renderExplainabilityTab(data);
    } else if (this.activeAnalyticsTab === 'reserves') {
      return this._renderReservesTab(data);
    } else if (this.activeAnalyticsTab === 'matrix') {
      return this._renderMatrixTab(data);
    } else if (this.activeAnalyticsTab === 'upload') {
      return this._renderUploadTab(data);
    }
    return '';
  }

  // 1. OVERVIEW TAB
  _renderOverviewTab(data) {
    return `
      <div class="analytics-split-layout">
        <!-- Left Table: Service Breakdown -->
        <div class="analytics-panel" style="flex: 1.6;">
          <div class="panel-header">
            <h3 class="panel-title">Service Allocation Ledger</h3>
            <span class="panel-badge">${data.serviceAllocations.length} Municipal Systems</span>
          </div>

          <div class="table-responsive-container">
            <table class="budget-ledger-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Criticality</th>
                  <th>Load / Usage</th>
                  <th>Allocated ($)</th>
                  <th>Share (%)</th>
                  <th>CapEx / OpEx</th>
                  <th>Coverage</th>
                </tr>
              </thead>
              <tbody>
                ${data.serviceAllocations.map(s => {
                  const emoji = this._getServiceEmoji(s.service_id);
                  const critBadgeClass = s.criticality.toLowerCase();
                  return `
                    <tr>
                      <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span style="font-size: 1.1rem;">${emoji}</span>
                          <div>
                            <div style="font-weight: 700; color: var(--text-primary);">${s.service_name}</div>
                            <div style="font-size: 0.68rem; font-family: var(--font-mono); color: var(--text-muted);">${s.service_id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="crit-pill ${critBadgeClass}">${s.criticality}</span>
                      </td>
                      <td>
                        <div class="usage-mini-bar-cell">
                          <span>${s.load_percentage}%</span>
                          <div class="usage-bar-track">
                            <div class="usage-bar-fill" style="width: ${s.load_percentage}%;"></div>
                          </div>
                        </div>
                      </td>
                      <td style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-magenta);">
                        ${this._formatMoney(s.allocatedAmount)}
                      </td>
                      <td>
                        <span style="font-weight: 600;">${s.shareOfActivePool.toFixed(1)}%</span>
                      </td>
                      <td style="font-size: 0.75rem; color: var(--text-muted);">
                        ${this._formatMoney(s.capexAmount)} / ${this._formatMoney(s.opexAmount)}
                      </td>
                      <td>
                        <span class="coverage-tag ${s.fundingAdequacy >= 100 ? 'good' : 'warning'}">
                          ${s.fundingAdequacy}%
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right Side: Tier Distribution & CapEx/OpEx Breakdown -->
        <div class="analytics-panel" style="flex: 1; display: flex; flex-direction: column; gap: 16px;">
          <div class="panel-header">
            <h3 class="panel-title">Criticality Tier Distribution</h3>
          </div>

          <!-- Tier Breakdown Bars -->
          <div class="tier-distribution-card">
            ${this._renderTierBreakdown(data)}
          </div>

          <!-- CapEx vs OpEx Overview -->
          <div class="capex-opex-card">
            <div style="font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; color: var(--text-primary);">
              Capital Hardening vs Operational Maintenance
            </div>
            <div class="capex-split-track">
              <div class="capex-split-bar capex" style="width: 66%;" title="Capital Hardening: 66%">CapEx (66%)</div>
              <div class="capex-split-bar opex" style="width: 34%;" title="Operational Readiness: 34%">OpEx (34%)</div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); margin-top: 6px;">
              <span>🏗️ CapEx: Infrastructure upgrades & backups</span>
              <span>🛠️ OpEx: Day-to-day operations & fuel</span>
            </div>
          </div>

          <!-- Strategy Weights Summary -->
          <div class="weights-summary-card">
            <div style="font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; color: var(--text-primary);">
              Active Mathematical Multipliers
            </div>
            <div class="weights-sliders-list">
              <div class="weight-row">
                <span>Criticality Tier:</span>
                <strong>${(this.weights.priority * 100).toFixed(0)}%</strong>
              </div>
              <div class="weight-row">
                <span>Real-Time Load / Usage:</span>
                <strong>${(this.weights.usage * 100).toFixed(0)}%</strong>
              </div>
              <div class="weight-row">
                <span>Cascade Risk (Dependencies):</span>
                <strong>${(this.weights.cascade * 100).toFixed(0)}%</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 2. EXPLAINABILITY & RATIONALE TAB (NEW TAB SHOWING EXACT REASONS)
  _renderExplainabilityTab(data) {
    const selectedService = data.serviceAllocations.find(s => s.service_id === this.selectedExplainServiceId) || data.serviceAllocations[0];
    const emoji = this._getServiceEmoji(selectedService.service_id);

    return `
      <div class="analytics-split-layout">
        <!-- Left: Service Selector list for deep dive -->
        <div class="analytics-panel" style="flex: 1;">
          <div class="panel-header">
            <h3 class="panel-title">Select Service for Rationale</h3>
            <span class="panel-badge">7 Systems</span>
          </div>

          <div class="explain-service-selector-list">
            ${data.serviceAllocations.map(s => {
              const isSelected = s.service_id === selectedService.service_id;
              const sEmoji = this._getServiceEmoji(s.service_id);
              const statusColor = s.criticality === 'Critical' ? '#EF4444'
                : s.criticality === 'High' ? '#F97316'
                : s.criticality === 'Medium' ? '#F59E0B'
                : '#10B981';

              return `
                <div class="explain-service-row ${isSelected ? 'active' : ''}" data-explain-id="${s.service_id}">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.1rem;">${sEmoji}</span>
                    <div>
                      <div style="font-weight: 700; font-size: 0.82rem; color: var(--text-primary);">${s.service_name}</div>
                      <div style="font-size: 0.68rem; color: ${statusColor}; font-weight: 600;">${s.criticality} • ${s.load_percentage}% Load</div>
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-family: var(--font-mono); font-weight: 800; color: var(--accent-magenta); font-size: 0.82rem;">
                      ${this._formatMoney(s.allocatedAmount)}
                    </div>
                    <div style="font-size: 0.65rem; color: var(--text-muted);">${s.shareOfActivePool.toFixed(1)}% pool</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Right: Comprehensive Rationale Deep Dive Card -->
        <div class="analytics-panel" style="flex: 1.8; display: flex; flex-direction: column; gap: 16px;">
          <div class="panel-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.4rem;">${emoji}</span>
              <div>
                <h3 class="panel-title">${selectedService.service_name}</h3>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">
                  ${selectedService.service_id} • ${selectedService.criticality} Tier • Load: ${selectedService.load_percentage}% • Direct Targets: ${selectedService.downstreamCount}
                </div>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 1.25rem; font-weight: 800; font-family: var(--font-heading); color: var(--accent-magenta);">
                ${this._formatMoney(selectedService.allocatedAmount)}
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">
                ${selectedService.shareOfActivePool.toFixed(1)}% of Municipal Active Pool
              </div>
            </div>
          </div>

          <!-- Summary Callout -->
          <div class="explain-summary-callout">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="font-size: 1.1rem;">💡</span>
              <strong style="color: var(--text-primary); font-size: 0.88rem;">Executive Fiscal Justification:</strong>
            </div>
            <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.55;">
              ${selectedService.reasons.summary}
            </p>
          </div>

          <!-- Factor Breakdown Grid -->
          <div class="explain-factors-grid">
            <!-- Priority Factor -->
            <div class="explain-factor-card">
              <div class="factor-header">
                <span class="factor-icon" style="background: rgba(239, 68, 68, 0.12); color: #EF4444;">🎯</span>
                <div>
                  <div class="factor-title">1. Criticality & Priority Driver</div>
                  <div class="factor-weight">Weight Multiplier: ${(this.weights.priority * 100).toFixed(0)}%</div>
                </div>
              </div>
              <p class="factor-text">${selectedService.reasons.critReason}</p>
            </div>

            <!-- Utilization Factor -->
            <div class="explain-factor-card">
              <div class="factor-header">
                <span class="factor-icon" style="background: rgba(14, 165, 233, 0.12); color: #0EA5E9;">📈</span>
                <div>
                  <div class="factor-title">2. Real-Time Demand & Load</div>
                  <div class="factor-weight">Weight Multiplier: ${(this.weights.usage * 100).toFixed(0)}%</div>
                </div>
              </div>
              <p class="factor-text">${selectedService.reasons.loadReason}</p>
            </div>

            <!-- Cascade Centrality Factor -->
            <div class="explain-factor-card">
              <div class="factor-header">
                <span class="factor-icon" style="background: rgba(245, 158, 11, 0.12); color: #F59E0B;">🌐</span>
                <div>
                  <div class="factor-title">3. Systemic Cascade Blast Radius</div>
                  <div class="factor-weight">Weight Multiplier: ${(this.weights.cascade * 100).toFixed(0)}%</div>
                </div>
              </div>
              <p class="factor-text">${selectedService.reasons.cascadeReason}</p>
            </div>

            <!-- Hardening CapEx Breakdown -->
            <div class="explain-factor-card">
              <div class="factor-header">
                <span class="factor-icon" style="background: rgba(16, 185, 129, 0.12); color: #10B981;">🏗️</span>
                <div>
                  <div class="factor-title">4. Capital vs OpEx Readiness</div>
                  <div class="factor-weight">CapEx: ${this._formatMoney(selectedService.capexAmount)} • OpEx: ${this._formatMoney(selectedService.opexAmount)}</div>
                </div>
              </div>
              <p class="factor-text">
                CapEx funds hardware hardening (failover switches, backup diesel/BESS, auxiliary pumps). OpEx maintains daily maintenance crew shifts, telemetry monitoring, and supplies.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _renderTierBreakdown(data) {
    const tiers = ['Critical', 'High', 'Medium', 'Low'];
    const tierTotals = {};

    tiers.forEach(t => {
      tierTotals[t] = data.serviceAllocations
        .filter(s => s.criticality === t)
        .reduce((sum, s) => sum + s.allocatedAmount, 0);
    });

    const activePool = data.activePool || 1;

    return tiers.map(tier => {
      const amount = tierTotals[tier] || 0;
      const pct = ((amount / activePool) * 100).toFixed(1);
      const color = tier === 'Critical' ? '#EF4444'
        : tier === 'High' ? '#F97316'
        : tier === 'Medium' ? '#F59E0B'
        : '#10B981';

      return `
        <div class="tier-breakdown-row">
          <div class="tier-label-row">
            <span style="font-weight: 700; color: ${color}; font-size: 0.82rem;">${tier} Priority</span>
            <span style="font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700;">${this._formatMoney(amount)} (${pct}%)</span>
          </div>
          <div class="tier-bar-track">
            <div class="tier-bar-fill" style="width: ${pct}%; background: ${color};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 3. RESERVES TAB
  _renderReservesTab(data) {
    const formattedReserve = this._formatMoney(data.reserveAmount);
    const formattedPrevention = this._formatMoney(data.preventionReserve);
    const formattedRecovery = this._formatMoney(data.recoveryReserve);
    const formattedWorstCase = this._formatMoney(data.kpis.worstCaseCascadeCost);

    return `
      <div class="analytics-split-layout">
        <!-- Left Pillar Card -->
        <div class="analytics-panel" style="flex: 1.2;">
          <div class="panel-header">
            <h3 class="panel-title">Dual-Pillar Contingency Architecture</h3>
            <span class="panel-badge" style="background: rgba(16, 185, 129, 0.12); color: #10B981;">${this.reservePercentage}% of Municipal Fund</span>
          </div>

          <div class="reserve-pillars-grid">
            <!-- Pillar 1 -->
            <div class="reserve-pillar-card">
              <div class="pillar-header">
                <div class="pillar-icon-box" style="background: rgba(16, 185, 129, 0.15); color: #10B981;">
                  <i data-lucide="shield-check" style="width: 20px; height: 20px;"></i>
                </div>
                <div>
                  <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary);">Pillar 1: Disruption Prevention</h4>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Proactive Hardening & Failover</div>
                </div>
              </div>
              <div class="pillar-amount" style="color: #10B981;">${formattedPrevention}</div>
              <ul class="pillar-features-list">
                <li>⚡ BESS Battery grid micro-storage reserve (30m buffer)</li>
                <li>💧 Pressurized auxiliary gravity water reservoirs</li>
                <li>📡 Microwave starlink redundant mesh backhaul</li>
                <li>🔒 Automated cyber intrusion honeypot failover</li>
              </ul>
            </div>

            <!-- Pillar 2 -->
            <div class="reserve-pillar-card">
              <div class="pillar-header">
                <div class="pillar-icon-box" style="background: rgba(245, 158, 11, 0.15); color: #F59E0B;">
                  <i data-lucide="life-buoy" style="width: 20px; height: 20px;"></i>
                </div>
                <div>
                  <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary);">Pillar 2: Disaster Recovery</h4>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Emergency Operations & Restoration</div>
                </div>
              </div>
              <div class="pillar-amount" style="color: #F59E0B;">${formattedRecovery}</div>
              <ul class="pillar-features-list">
                <li>🚒 Emergency responder all-call overtime pool</li>
                <li>🔧 Rapid high-voltage transformer replacements</li>
                <li>🏥 Mobile intensive care trauma center deployment</li>
                <li>🚨 Municipal civil business stoppage relief grant</li>
              </ul>
            </div>
          </div>

          <!-- Disruption Reserve Stress Test Gauge -->
          <div class="reserve-stress-test-box">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-weight: 800; font-size: 0.9rem; color: var(--text-primary);">Worst-Case Cascade Stress Test</span>
              <span class="pill ${data.kpis.coverageRatioPct >= 100 ? 'green' : 'orange'}">
                ${data.kpis.coverageRatioPct}% Funded
              </span>
            </div>
            <div class="stress-bar-track">
              <div class="stress-bar-fill" style="width: ${Math.min(100, data.kpis.coverageRatioPct)}%; background: ${data.kpis.coverageRatioPct >= 100 ? '#10B981' : '#F59E0B'};"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 6px;">
              <span>Available Recovery Fund: ${formattedRecovery}</span>
              <span>Total Catastrophic Repair: ${formattedWorstCase}</span>
            </div>
          </div>
        </div>

        <!-- Right Side: Economic Bleed & Loss Mitigation Analysis -->
        <div class="analytics-panel" style="flex: 1; display: flex; flex-direction: column; gap: 16px;">
          <div class="panel-header">
            <h3 class="panel-title">Economic Bleed & Cushion</h3>
          </div>

          <div class="economic-bleed-card">
            <div class="bleed-stat-row">
              <span>Hourly Downtown Economic Bleed:</span>
              <strong style="color: #EF4444;">${this._formatMoney(data.kpis.totalHourlyBleed)}/hr</strong>
            </div>
            <div class="bleed-stat-row">
              <span>Emergency First Responder Ops:</span>
              <strong style="color: #F97316;">${this._formatMoney(data.kpis.totalHourlyOps)}/hr</strong>
            </div>
            <div class="bleed-stat-row" style="border-top: 1px dashed var(--border-light); padding-top: 10px; margin-top: 6px;">
              <span>Reserve Cushion Duration:</span>
              <strong style="color: #10B981; font-size: 1.1rem;">${data.kpis.economicBufferHours} Hours</strong>
            </div>
            <p style="font-size: 0.76rem; color: var(--text-muted); margin-top: 8px;">
              With <strong>${formattedReserve}</strong> in reserve, the municipality can sustain full economic loss and first-responder operations for <strong>${data.kpis.economicBufferHours} continuous hours</strong> during a total cascade blackout before requiring state emergency loans.
            </p>
          </div>

          <!-- Proactive Hardening ROI -->
          <div class="roi-summary-card">
            <h4 style="font-size: 0.88rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">
              Resilience Investment ROI
            </h4>
            <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5;">
              Every <strong>$1.00</strong> allocated to proactive prevention reserves prevents an estimated <strong>$4.80</strong> in downstream cascading losses across healthcare, commerce, and transit sectors.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 4. MATRIX TAB
  _renderMatrixTab(data) {
    return `
      <div class="analytics-panel" style="width: 100%;">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">Infrastructure Risk vs. Budget Allocation Matrix</h3>
            <p style="font-size: 0.78rem; color: var(--text-muted);">
              Correlates live infrastructure load utilization against capital funding and cascade vulnerability
            </p>
          </div>
          <span class="panel-badge">Quadrant Analysis</span>
        </div>

        <div class="matrix-quadrant-container">
          <div class="matrix-grid-labels top-label">High Utilization (Load > 60%)</div>
          <div class="matrix-grid-labels bottom-label">Low Utilization (Load &le; 60%)</div>
          <div class="matrix-grid-labels left-label">&larr; Lower Funding</div>
          <div class="matrix-grid-labels right-label">Higher Funding &rarr;</div>

          <div class="matrix-canvas-wrapper">
            ${data.serviceAllocations.map(s => {
              const emoji = this._getServiceEmoji(s.service_id);
              const maxAlloc = Math.max(...data.serviceAllocations.map(x => x.allocatedAmount)) || 1;
              const posX = Math.min(90, Math.max(10, (s.allocatedAmount / maxAlloc) * 85));
              const posY = Math.min(88, Math.max(12, 100 - s.load_percentage));
              const dotColor = s.criticality === 'Critical' ? '#EF4444'
                : s.criticality === 'High' ? '#F97316'
                : s.criticality === 'Medium' ? '#F59E0B'
                : '#10B981';

              return `
                <div 
                  class="matrix-bubble" 
                  style="left: ${posX}%; top: ${posY}%; border-color: ${dotColor};" 
                  title="${s.service_name} (${s.service_id})\nLoad: ${s.load_percentage}%\nAllocated: ${this._formatMoney(s.allocatedAmount)}\nCriticality: ${s.criticality}"
                >
                  <span class="bubble-emoji">${emoji}</span>
                  <div class="bubble-tag">${s.service_id}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Legend -->
        <div class="matrix-legend-row">
          <div class="legend-item"><span class="legend-dot" style="background: #EF4444;"></span> Critical Priority</div>
          <div class="legend-item"><span class="legend-dot" style="background: #F97316;"></span> High Priority</div>
          <div class="legend-item"><span class="legend-dot" style="background: #F59E0B;"></span> Medium Priority</div>
          <div class="legend-item"><span class="legend-dot" style="background: #10B981;"></span> Low Priority</div>
        </div>
      </div>
    `;
  }

  // 5. UPLOAD TAB
  _renderUploadTab(data) {
    return `
      <div class="analytics-split-layout">
        <!-- Left: Upload & Drag Drop -->
        <div class="analytics-panel" style="flex: 1.2;">
          <div class="panel-header">
            <h3 class="panel-title">Upload Municipal Budget Data</h3>
            <span class="panel-badge">JSON or CSV</span>
          </div>

          <div class="upload-dropzone-box" id="modal-upload-dropzone">
            <div class="dropzone-icon">
              <i data-lucide="cloud-upload" style="width: 38px; height: 38px; color: var(--accent-magenta);"></i>
            </div>
            <div class="dropzone-title">Drag & Drop your Budget File here</div>
            <div class="dropzone-sub">Accepts <code>.json</code> or <code>.csv</code> municipal budget specifications</div>

            <label class="btn btn-primary" style="margin-top: 14px; cursor: pointer;">
              <i data-lucide="folder-open" style="width: 16px; height: 16px;"></i>
              Browse Files
              <input type="file" id="modal-budget-file-input" accept=".json,.csv" style="display: none;" />
            </label>
          </div>

          <div style="display: flex; gap: 12px; margin-top: 14px;">
            <button id="modal-btn-download-sample-json" class="btn btn-secondary" style="flex: 1;">
              <i data-lucide="file-json" style="width: 15px; height: 15px;"></i>
              Download Sample JSON
            </button>
            <button id="modal-btn-download-sample-csv" class="btn btn-secondary" style="flex: 1;">
              <i data-lucide="file-spreadsheet" style="width: 15px; height: 15px;"></i>
              Download Sample CSV
            </button>
          </div>
        </div>

        <!-- Right: Schema Spec & Documentation -->
        <div class="analytics-panel" style="flex: 1;">
          <div class="panel-header">
            <h3 class="panel-title">Supported File Schema</h3>
          </div>

          <div class="schema-spec-box">
            <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">
              Sample JSON Format:
            </div>
            <pre class="schema-code"><code>{
  "total_budget_usd": 50000000,
  "reserve_percentage": 20,
  "strategy": "balanced",
  "department_weights": {
    "priority": 0.40,
    "usage": 0.35,
    "cascade": 0.25
  },
  "service_overrides": {
    "PWR-01": 8500000,
    "HOS-01": 7200000
  }
}</code></pre>

            <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary); margin: 12px 0 6px 0;">
              Sample CSV Format:
            </div>
            <pre class="schema-code"><code>service_id,allocated_budget_usd,priority_weight,locked
PWR-01,8500000,0.95,true
WTR-01,5200000,0.85,false
TEL-01,6400000,0.92,false
HOS-01,7200000,0.95,true</code></pre>
          </div>
        </div>
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODAL EVENT BINDINGS
  // ─────────────────────────────────────────────────────────────────────────

  bindModalEvents() {
    // Close button
    const closeBtn = this.analyticsModal.querySelector('#btn-close-budget-modal');
    const closeFooterBtn = this.analyticsModal.querySelector('#modal-btn-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeAnalyticsModal());
    if (closeFooterBtn) closeFooterBtn.addEventListener('click', () => this.closeAnalyticsModal());

    // Backdrop click
    this.analyticsModal.addEventListener('click', (e) => {
      if (e.target === this.analyticsModal) this.closeAnalyticsModal();
    });

    // Tab buttons
    this.analyticsModal.querySelectorAll('.modal-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        this.activeAnalyticsTab = btn.getAttribute('data-tab');
        this.renderModalContent();
      });
    });

    // Explainability service item clicks
    this.analyticsModal.querySelectorAll('.explain-service-row').forEach(row => {
      row.addEventListener('click', () => {
        sound.playClick();
        this.selectedExplainServiceId = row.getAttribute('data-explain-id');
        this.renderModalContent();
      });
    });

    // Export JSON
    const exportJsonBtn = this.analyticsModal.querySelector('#modal-btn-export-json');
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => {
        sound.playClick();
        this.exportAllocationJSON();
      });
    }

    // Export CSV
    const exportCsvBtn = this.analyticsModal.querySelector('#modal-btn-export-csv');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        sound.playClick();
        this.exportAllocationCSV();
      });
    }

    // Print
    const printBtn = this.analyticsModal.querySelector('#modal-btn-print-report');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // Apply to live city & What-If simulator from modal
    const applyModalBtn = this.analyticsModal.querySelector('#modal-btn-apply-city');
    if (applyModalBtn) {
      applyModalBtn.addEventListener('click', () => {
        this.applyBudgetToLiveCity();
      });
    }

    // Upload handlers
    const modalFileInput = this.analyticsModal.querySelector('#modal-budget-file-input');
    if (modalFileInput) {
      modalFileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) this.handleFileUpload(file);
      });
    }

    const dropzone = this.analyticsModal.querySelector('#modal-upload-dropzone');
    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
      });
      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('drag-over');
      });
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        const file = e.dataTransfer?.files?.[0];
        if (file) this.handleFileUpload(file);
      });
    }

    const sampleJsonBtn = this.analyticsModal.querySelector('#modal-btn-download-sample-json');
    if (sampleJsonBtn) {
      sampleJsonBtn.addEventListener('click', () => {
        sound.playClick();
        this.downloadSampleTemplate('json');
      });
    }

    const sampleCsvBtn = this.analyticsModal.querySelector('#modal-btn-download-sample-csv');
    if (sampleCsvBtn) {
      sampleCsvBtn.addEventListener('click', () => {
        sound.playClick();
        this.downloadSampleTemplate('csv');
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FILE IMPORT / EXPORT / TEMPLATE GENERATOR
  // ─────────────────────────────────────────────────────────────────────────

  handleFileUpload(file) {
    const reader = new FileReader();
    const isJson = file.name.endsWith('.json');
    const isCsv = file.name.endsWith('.csv');

    reader.onload = (e) => {
      try {
        const content = e.target.result;
        if (isJson) {
          this.parseJsonBudget(content);
        } else if (isCsv) {
          this.parseCsvBudget(content);
        } else {
          alert('Unsupported file format. Please upload .json or .csv');
          return;
        }

        sound.playRecovery();
        const data = this.calculateAllocation();
        if (this.onApplyToCity) this.onApplyToCity(data);

        this.renderDockView();
        if (this.isModalOpen) {
          this.renderModalContent();
        }
        alert(`Successfully loaded budget file: "${file.name}"! Total Budget: ${this._formatMoney(this.totalBudget)}`);
      } catch (err) {
        console.error('Failed to parse budget file:', err);
        alert(`Error parsing budget file: ${err.message}`);
      }
    };

    reader.readAsText(file);
  }

  parseJsonBudget(jsonString) {
    const data = JSON.parse(jsonString);
    if (data.total_budget_usd) {
      this.totalBudget = Math.max(1000000, Number(data.total_budget_usd));
    }
    if (data.reserve_percentage !== undefined) {
      this.reservePercentage = Math.min(50, Math.max(5, Number(data.reserve_percentage)));
    }
    if (data.strategy) {
      this.strategy = data.strategy;
    }
    if (data.department_weights) {
      this.weights = {
        priority: Number(data.department_weights.priority ?? 0.4),
        usage: Number(data.department_weights.usage ?? 0.35),
        cascade: Number(data.department_weights.cascade ?? 0.25)
      };
    }
    if (data.service_overrides && typeof data.service_overrides === 'object') {
      this.serviceLocks.clear();
      Object.entries(data.service_overrides).forEach(([id, amt]) => {
        this.serviceLocks.set(id, Number(amt));
      });
    }
  }

  parseCsvBudget(csvString) {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV file is empty or missing data rows');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const idIdx = headers.findIndex(h => h.includes('service_id') || h.includes('id'));
    const budgetIdx = headers.findIndex(h => h.includes('budget') || h.includes('allocated'));
    const lockIdx = headers.findIndex(h => h.includes('lock'));

    if (idIdx === -1) throw new Error('Missing service_id column in CSV');

    let sumAllocated = 0;
    this.serviceLocks.clear();

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(c => c.trim());
      if (row.length <= idIdx) continue;

      const serviceId = row[idIdx];
      const budgetVal = budgetIdx !== -1 ? parseFloat(row[budgetIdx]) : 0;
      const isLocked = lockIdx !== -1 ? row[lockIdx].toLowerCase() === 'true' : false;

      if (!isNaN(budgetVal) && budgetVal > 0) {
        sumAllocated += budgetVal;
        if (isLocked) {
          this.serviceLocks.set(serviceId, budgetVal);
        }
      }
    }

    if (sumAllocated > 0) {
      this.totalBudget = Math.round(sumAllocated / (1 - this.reservePercentage / 100));
    }
  }

  downloadSampleTemplate(type = 'json') {
    if (type === 'json') {
      const sample = {
        title: "Metropolitan Infrastructure Resiliency Budget",
        version: "2.4",
        total_budget_usd: 65000000,
        reserve_percentage: 22,
        strategy: "balanced",
        department_weights: {
          priority: 0.45,
          usage: 0.35,
          cascade: 0.20
        },
        service_overrides: {
          "PWR-01": 9500000,
          "HOS-01": 8000000
        }
      };

      const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
      this._triggerDownload(blob, 'budget_template_cascadyn.json');
    } else {
      const csv = `service_id,service_name,allocated_budget_usd,priority_weight,locked\nPWR-01,Electricity / Power,9500000,0.95,true\nWTR-01,Water Supply,5800000,0.85,false\nTEL-01,Telecom / Internet,6800000,0.92,false\nTRF-01,Traffic Management,3200000,0.75,false\nTRN-01,Public Transport,4500000,0.80,false\nHOS-01,Hospitals,8000000,0.95,true\nEMG-01,Emergency Services,5100000,0.90,false\nGOV-01,Government / Digital,3800000,0.78,false`;

      const blob = new Blob([csv], { type: 'text/csv' });
      this._triggerDownload(blob, 'budget_template_cascadyn.csv');
    }
  }

  exportAllocationCSV() {
    const data = this.calculateAllocation();
    const rows = [
      ['Service ID', 'Service Name', 'Criticality', 'Load (%)', 'Allocated USD', 'Share of Pool (%)', 'CapEx USD', 'OpEx USD', 'Base Repair USD', 'Coverage (%)', 'Allocation Rationale']
    ];

    data.serviceAllocations.forEach(s => {
      rows.push([
        s.service_id,
        `"${s.service_name}"`,
        s.criticality,
        s.load_percentage,
        s.allocatedAmount,
        s.shareOfActivePool.toFixed(2),
        s.capexAmount,
        s.opexAmount,
        s.baseRepairCost,
        s.fundingAdequacy,
        `"${s.reasons.summary.replace(/"/g, '""')}"`
      ]);
    });

    // Add Reserves summary rows
    rows.push([]);
    rows.push(['--- RESERVE BREAKDOWN ---', '', '', '', '', '', '', '', '', '', '']);
    rows.push(['Total Municipal Budget', '', '', '', data.totalBudget, '100.00', '', '', '', '', '']);
    rows.push(['Operational Active Pool', '', '', '', data.activePool, (100 - data.reservePercentage).toFixed(2), '', '', '', '', '']);
    rows.push(['Total Contingency Reserve', '', '', '', data.reserveAmount, data.reservePercentage.toFixed(2), '', '', '', '', '']);
    rows.push(['Disruption Prevention Fund (50%)', '', '', '', data.preventionReserve, (data.reservePercentage * 0.5).toFixed(2), '', '', '', '', '']);
    rows.push(['Disaster Recovery Fund (50%)', '', '', '', data.recoveryReserve, (data.reservePercentage * 0.5).toFixed(2), '', '', '', '', '']);

    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    this._triggerDownload(blob, `cascadyn_budget_allocation_${Date.now()}.csv`);
  }

  exportAllocationJSON() {
    const data = this.calculateAllocation();
    const exportData = {
      export_timestamp: new Date().toISOString(),
      metadata: {
        total_budget_usd: data.totalBudget,
        reserve_percentage: data.reservePercentage,
        reserve_amount_usd: data.reserveAmount,
        prevention_reserve_usd: data.preventionReserve,
        recovery_reserve_usd: data.recoveryReserve,
        active_pool_usd: data.activePool,
        strategy: this.strategy,
        weights: this.weights
      },
      kpis: data.kpis,
      allocations: data.serviceAllocations
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    this._triggerDownload(blob, `cascadyn_budget_allocation_${Date.now()}.json`);
  }

  _triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LIVE CITY SIMULATION INTEGRATION (WITH WHAT-IF ENGINE SYNC)
  // ─────────────────────────────────────────────────────────────────────────

  applyBudgetToLiveCity() {
    sound.playRecovery();
    this.isAppliedToCity = true;
    this.lastAppliedTimestamp = Date.now();

    const data = this.calculateAllocation();

    // Dynamically adjust graph service resilience and recovery speeds based on funding
    data.serviceAllocations.forEach(item => {
      const s = this.graph.getService(item.service_id);
      if (s) {
        // High funding adequacy accelerates recovery time
        const baseSec = s.recovery_time_seconds || 1800;
        const reductionMultiplier = Math.max(0.35, 1 - (item.fundingAdequacy / 280));
        s.active_recovery_seconds = Math.round(baseSec * reductionMultiplier);

        // Disruption prevention reserve hardens dependency resilience
        s.active_resilience_factor = Math.min(1.35, (item.fundingAdequacy / 90));
        s.budget_allocated_usd = item.allocatedAmount;
      }
    });

    if (this.onApplyToCity) {
      this.onApplyToCity(data);
    }

    this.renderDockView();
    if (this.isModalOpen) {
      this.renderModalContent();
    }

    // Trigger visual celebration feedback
    this.showCelebrationBanner(data);
  }

  showCelebrationBanner(data) {
    const banner = document.createElement('div');
    banner.className = 'budget-applied-toast';
    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 1.3rem;">⚡</span>
        <div>
          <div style="font-weight: 800; font-size: 0.9rem;">Budget Synced with What-If Simulator!</div>
          <div style="font-size: 0.75rem; color: rgba(255,255,255,0.85);">
            +${data.kpis.resilienceBoost}% City Resilience boost • -${data.kpis.mttrReductionPct}% Disaster Recovery Time
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(banner);
    setTimeout(() => {
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(-20px)';
      setTimeout(() => banner.remove(), 400);
    }, 3500);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  _getServiceEmoji(id) {
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
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    }
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}k`;
    }
    return `$${Math.round(num)}`;
  }
}
