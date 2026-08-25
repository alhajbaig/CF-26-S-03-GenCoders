/**
 * CASCADYN – Urban Infrastructure Cascade Simulator
 * Main Application Orchestrator
 */

import { SYNTHETIC_CITY_DATASET } from './data/cityDataset.js';
import { CityGraph } from './data/graphModel.js';
import { City3DScene } from './scene/city3D.js';
import { LandingPage } from './components/landingPage.js';
import { ServiceInspector } from './components/serviceInspector.js';
import { DatasetManagerModal } from './components/datasetManager.js';
import { NetworkGraphModal } from './components/networkGraphView.js';
import { sound } from './engine/audioEngine.js';
import { SmartCityChatbot } from './components/chatbot.js';
import { WhatIfSimulator } from './components/whatIfSimulator.js';
import { FailureFlashcard } from './components/failureFlashcard.js';

class CascadynApp {
  constructor() {
    this.graph = new CityGraph(SYNTHETIC_CITY_DATASET);
    this.cityScene = null;
    this.landingPage = null;
    this.inspector = null;
    this.datasetModal = null;
    this.graphModal = null;
    this.isAudioMuted = false;
    this.chatbot = null;
    this.whatIfSimulator = null;
    this.flashcard = null;
    this.activeDockTab = 'services';
    this.groqApiKey = import.meta.env.VITE_GROQ_API_KEY || '';
    this._prevFailedIds = new Set();

    this.init();
  }

  init() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    // 1. Create Canvas Container for 3D Three.js scene
    const canvasContainer = document.createElement('div');
    canvasContainer.id = 'canvas-container';
    appEl.appendChild(canvasContainer);

    // 2. Initialize 3D City Visualization
    this.cityScene = new City3DScene(
      canvasContainer,
      this.graph,
      (serviceId) => this.handleServiceSelected(serviceId)
    );

    // 3. Render Top Navigation Bar
    this.renderHeader(appEl);

    // 4. Render Left Quick-Access Service Dock
    this.renderLeftDock(appEl);

    // 5. Render Bottom 3D Camera Preset Toolbar
    this.renderBottomToolbar(appEl);

    // 6. Initialize Service Inspector Drawer
    this.inspector = new ServiceInspector(
      appEl,
      this.graph,
      (serviceId) => this.handleTriggerFailure(serviceId),
      (serviceId) => this.handleMitigateService(serviceId),
      (serviceId) => this.handleServiceSelected(serviceId)
    );

    // 7. Initialize Dataset Manager Modal
    this.datasetModal = new DatasetManagerModal(
      appEl,
      this.graph,
      (preset) => {
        this._prevFailedIds.clear();
        this.updateHeaderStats();
        this.updateLeftDock();
        this.cityScene.resetOverviewCamera();
        this.cityScene.updateServiceVisuals();
        if (this.whatIfSimulator) {
          this.whatIfSimulator.selectedServices.clear();
          this.whatIfSimulator.renderForm();
        }
      }
    );

    // 8. Initialize 2D Network Graph Modal
    this.graphModal = new NetworkGraphModal(
      appEl,
      this.graph,
      (serviceId) => this.handleServiceSelected(serviceId)
    );

    // 9. Initialize Landing Page Overlay
    this.landingPage = new LandingPage(
      appEl,
      this.graph,
      () => this.handleEnterSmartCity(),
      (serviceId) => {
        this.handleEnterSmartCity();
        this.handleServiceSelected(serviceId);
      }
    );

    // 10. Initialize Failure Flashcard overlay
    this.flashcard = new FailureFlashcard(appEl, this.graph);

    // 11. Subscribe to Graph state changes for global reactivity
    this.graph.subscribe(() => {
      this.updateHeaderStats();
      this.updateLeftDock();

      // Re-render the inspector if it's open (ensures action buttons update)
      if (this.inspector && this.inspector.currentServiceId) {
        this.inspector.inspect(this.inspector.currentServiceId);
      }

      // Detect newly failed services and show flashcard
      this._detectAndShowFailures();
    });

    // 12. Initialize AI Chatbot Assistant
    this.chatbot = new SmartCityChatbot(appEl, this.graph, this.groqApiKey);

    this.updateHeaderStats();

    if (window.lucide) window.lucide.createIcons();
  }

  /**
   * Detects newly failed services and shows flashcard for them
   */
  _detectAndShowFailures() {
    const services = this.graph.getAllServices();
    const currentFailedIds = new Set(
      services.filter(s => s.status === 'Failed').map(s => s.service_id)
    );

    // Find newly failed services (not in previous state)
    const newlyFailed = [...currentFailedIds].filter(id => !this._prevFailedIds.has(id));

    // If there are newly failed services, show flashcard for the most critical one
    if (newlyFailed.length > 0) {
      // Sort by criticality and show for the primary (most critical one)
      const primary = newlyFailed.sort((a, b) => {
        const sA = this.graph.getService(a);
        const sB = this.graph.getService(b);
        const order = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
        return (order[sA?.criticality] || 3) - (order[sB?.criticality] || 3);
      })[0];

      // Build cascade timeline for display
      const timeline = this.graph.simulateCascade(primary, 1.0);
      this.flashcard.showFailure(primary, timeline);
    }

    // Detect recovered services
    const nowRecovered = [...this._prevFailedIds].filter(id => !currentFailedIds.has(id));
    nowRecovered.forEach(id => {
      this.flashcard.showRecovery(id);
    });

    this._prevFailedIds = new Set(currentFailedIds);
  }

  renderHeader(container) {
    const header = document.createElement('header');
    header.className = 'app-header';
    header.id = 'app-header';

    header.innerHTML = `
      <div class="brand-wrapper" id="btn-brand-home" title="Return to Welcome Screen">
        <div class="brand-badge">C</div>
        <div class="brand-text">
          <h1>CASCADYN</h1>
          <span>Urban Cascade Simulator</span>
        </div>
      </div>

      <div class="header-center-stats">
        <div class="resilience-meter">
          <span class="resilience-label">City Resilience</span>
          <span class="resilience-value" id="header-resilience-val">100%</span>
        </div>

        <div class="status-pills">
          <span class="pill green" id="pill-operational">
            <span class="pill-dot"></span>
            <span id="count-operational">8</span> Operational
          </span>
          <span class="pill red" id="pill-failed" style="display: none;">
            <span class="pill-dot"></span>
            <span id="count-failed">0</span> Failed
          </span>
        </div>
      </div>

      <div class="header-actions">
        <button id="btn-open-graph" class="btn btn-secondary" title="View 2D Dependency Graph">
          <i data-lucide="git-fork" style="width: 16px; height: 16px;"></i>
          2D Graph
        </button>

        <button id="btn-open-datasets" class="btn btn-secondary" title="Switch or Upload Datasets">
          <i data-lucide="database" style="width: 16px; height: 16px;"></i>
          Datasets
        </button>

        <button id="btn-reset-city" class="btn btn-primary" title="Restore All Infrastructure">
          <i data-lucide="rotate-ccw" style="width: 16px; height: 16px;"></i>
          Reset City
        </button>

        <button id="btn-toggle-audio" class="btn-icon" title="Toggle Sound">
          <i data-lucide="volume-2" id="audio-icon" style="width: 18px; height: 18px;"></i>
        </button>
      </div>
    `;

    container.appendChild(header);

    // Bind Header Events
    header.querySelector('#btn-brand-home').addEventListener('click', () => {
      sound.playClick();
      this.landingPage.show();
      this.cityScene.setLandingMode(true);
      this.inspector.close();
    });

    header.querySelector('#btn-open-graph').addEventListener('click', () => {
      sound.playClick();
      this.graphModal.open(this.inspector.currentServiceId);
    });

    header.querySelector('#btn-open-datasets').addEventListener('click', () => {
      sound.playClick();
      this.datasetModal.open();
    });

    header.querySelector('#btn-reset-city').addEventListener('click', () => {
      sound.playRecovery();
      if (this.whatIfSimulator && this.whatIfSimulator.isSimulating) {
        this.whatIfSimulator.stopSimulation();
      }
      this.flashcard.dismiss();
      this._prevFailedIds.clear();
      this.graph.resetAll();
    });

    header.querySelector('#btn-toggle-audio').addEventListener('click', () => {
      this.isAudioMuted = sound.toggleMute();
      const icon = header.querySelector('#audio-icon');
      if (icon) {
        icon.setAttribute('data-lucide', this.isAudioMuted ? 'volume-x' : 'volume-2');
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  renderLeftDock(container) {
    const dock = document.createElement('div');
    dock.className = 'floating-dock-left';
    dock.id = 'left-services-dock';

    dock.innerHTML = `
      <!-- Tab Controls -->
      <div class="dock-tabs-bar">
        <button class="dock-tab-btn active" id="tab-btn-services">Services</button>
        <button class="dock-tab-btn" id="tab-btn-whatif">⚗ What-If</button>
      </div>

      <!-- Tab Content 1: Services List -->
      <div class="dock-card" id="tab-content-services">
        <div class="dock-title">
          <span>Infrastructure Services</span>
          <span class="pill green" style="font-size: 0.7rem; padding: 2px 8px;" id="dock-status-summary">Live</span>
        </div>
        <div class="dock-service-list" id="dock-services-container">
          <!-- Dynamically populated -->
        </div>
      </div>

      <!-- Tab Content 2: What-If Sandbox -->
      <div class="dock-card" id="tab-content-whatif" style="display: none;">
        <div id="sandbox-component-container"></div>
      </div>
    `;

    container.appendChild(dock);

    // Bind Tab Click events
    const tabServicesBtn = dock.querySelector('#tab-btn-services');
    const tabWhatIfBtn = dock.querySelector('#tab-btn-whatif');
    const contentServices = dock.querySelector('#tab-content-services');
    const contentWhatIf = dock.querySelector('#tab-content-whatif');

    tabServicesBtn.addEventListener('click', () => {
      sound.playClick();
      this.activeDockTab = 'services';
      tabServicesBtn.classList.add('active');
      tabWhatIfBtn.classList.remove('active');
      contentServices.style.display = 'block';
      contentWhatIf.style.display = 'none';
    });

    tabWhatIfBtn.addEventListener('click', () => {
      sound.playClick();
      this.activeDockTab = 'whatif';
      tabWhatIfBtn.classList.add('active');
      tabServicesBtn.classList.remove('active');
      contentWhatIf.style.display = 'block';
      contentServices.style.display = 'none';
    });

    // Initialize What-If Simulator inside its container
    const sandboxContainer = dock.querySelector('#sandbox-component-container');
    this.whatIfSimulator = new WhatIfSimulator(
      sandboxContainer,
      this.graph,
      (serviceId) => {
        // Trigger shockwave + ensure 3D scene updates
        this.cityScene.triggerCascadeShockwave(serviceId);
        this.cityScene.updateServiceVisuals();
      },
      (serviceId) => this.handleServiceSelected(serviceId)
    );

    this.updateLeftDock();
  }

  updateLeftDock() {
    const container = document.getElementById('dock-services-container');
    if (!container) return;

    const services = this.graph.getAllServices();
    const failedCount = services.filter(s => s.status === 'Failed').length;

    // Update dock status pill
    const statusSummary = document.getElementById('dock-status-summary');
    if (statusSummary) {
      if (failedCount > 0) {
        statusSummary.textContent = `${failedCount} Failed`;
        statusSummary.className = 'pill red';
        statusSummary.style.cssText = 'font-size: 0.7rem; padding: 2px 8px; animation: pulse-red 1.5s ease-in-out infinite;';
      } else {
        statusSummary.textContent = 'Live';
        statusSummary.className = 'pill green';
        statusSummary.style.cssText = 'font-size: 0.7rem; padding: 2px 8px;';
      }
    }

    container.innerHTML = services.map(s => {
      const isSelected = this.inspector && this.inspector.currentServiceId === s.service_id;
      const statusColor = s.status === 'Operational' ? '#10B981'
        : s.status === 'Degraded' ? '#F59E0B'
        : s.status === 'Recovering' ? '#D946EF'
        : '#EF4444';

      const emoji = this._getServiceEmoji(s.service_id);
      const isFailed = s.status === 'Failed';

      return `
        <div class="dock-service-row ${isSelected ? 'selected' : ''} ${isFailed ? 'failed-row' : ''}" data-service-id="${s.service_id}">
          <div class="service-row-left">
            <div class="service-status-dot" style="background: ${statusColor}; ${isFailed ? 'animation: pulse-red 1s ease-in-out infinite;' : ''}"></div>
            <span class="service-emoji">${emoji}</span>
            <div>
              <div class="service-row-name">${s.service_name}</div>
              <div class="service-row-id ${isFailed ? 'text-failed' : ''}">${s.status} • ${s.criticality}</div>
            </div>
          </div>
          <i data-lucide="chevron-right" style="width: 14px; height: 14px; color: var(--text-muted); flex-shrink: 0;"></i>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.dock-service-row').forEach(row => {
      row.addEventListener('click', () => {
        sound.playClick();
        const id = row.getAttribute('data-service-id');
        this.handleServiceSelected(id);
      });
    });

    if (window.lucide) window.lucide.createIcons();
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

  renderBottomToolbar(container) {
    const toolbar = document.createElement('div');
    toolbar.className = 'bottom-controls-toolbar';
    toolbar.id = 'bottom-view-toolbar';

    const presets = [
      { label: '🗺 Overview', id: 'all' },
      { label: '⚡ Power', id: 'PWR-01' },
      { label: '💧 Water', id: 'WTR-01' },
      { label: '📡 Telecom', id: 'TEL-01' },
      { label: '🏥 Hospital', id: 'HOS-01' },
      { label: '🚦 Traffic', id: 'TRF-01' },
      { label: '🚨 Emergency', id: 'EMG-01' },
    ];

    toolbar.innerHTML = presets.map(p => `
      <button class="view-preset-btn ${p.id === 'all' ? 'active' : ''}" data-preset-id="${p.id}">
        ${p.label}
      </button>
    `).join('');

    container.appendChild(toolbar);

    toolbar.querySelectorAll('.view-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        toolbar.querySelectorAll('.view-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const presetId = btn.getAttribute('data-preset-id');
        if (presetId === 'all') {
          this.cityScene.resetOverviewCamera();
          this.inspector.close();
        } else {
          this.handleServiceSelected(presetId);
        }
      });
    });
  }

  updateHeaderStats() {
    const score = this.graph.getResilienceScore();
    const services = this.graph.getAllServices();
    const operationalCount = services.filter(s => s.status === 'Operational').length;
    const failedCount = services.filter(s => s.status === 'Failed').length;

    const resVal = document.getElementById('header-resilience-val');
    if (resVal) {
      resVal.textContent = `${score}%`;
      resVal.style.color = score > 80 ? '#10B981' : score > 50 ? '#F59E0B' : '#EF4444';
    }

    const opCount = document.getElementById('count-operational');
    if (opCount) opCount.textContent = operationalCount;

    const failPill = document.getElementById('pill-failed');
    const failCount = document.getElementById('count-failed');
    if (failPill && failCount) {
      failCount.textContent = failedCount;
      failPill.style.display = failedCount > 0 ? 'inline-flex' : 'none';
    }
  }

  handleEnterSmartCity() {
    this.cityScene.setLandingMode(false);
    this.cityScene.resetOverviewCamera();
  }

  handleServiceSelected(serviceId) {
    this.cityScene.focusOnService(serviceId);
    this.inspector.inspect(serviceId);
    this.updateLeftDock();
  }

  handleTriggerFailure(serviceId) {
    sound.playAlarm();

    // 1. Mark target service as Failed
    this.graph.updateServiceStatus(serviceId, 'Failed');

    // 2. Trigger visual 3D shockwaves
    this.cityScene.triggerCascadeShockwave(serviceId);

    // 3. Compute cascade propagation timeline
    const timeline = this.graph.simulateCascade(serviceId, 1.0);

    // 4. Animate cascaded downstream failures with time offsets
    timeline.forEach(step => {
      if (step.depth > 0) {
        setTimeout(() => {
          this.graph.updateServiceStatus(step.serviceId, 'Failed');
          this.cityScene.triggerCascadeShockwave(step.serviceId);
          this.cityScene.updateServiceVisuals();
          sound.playCascadeWave();
        }, step.timeSeconds * 400);
      }
    });
  }

  handleMitigateService(serviceId) {
    sound.playRecovery();

    // Mark service as Operational
    this.graph.updateServiceStatus(serviceId, 'Operational');

    // Update 3D scene visuals
    this.cityScene.updateServiceVisuals();

    // Re-inspect so the inspector panel refreshes its button states
    setTimeout(() => {
      if (this.inspector && this.inspector.currentServiceId === serviceId) {
        this.inspector.inspect(serviceId);
      }
    }, 50);
  }
}

// Bootstrap Application on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new CascadynApp();
});
