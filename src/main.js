/**
 * CASCADYN – Urban Infrastructure Cascade Simulator
 * Main Application Orchestrator with Ultra-Realistic 3D Controls & Accessibility
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
    this.dockSearchQuery = '';
    this.dockCategoryFilter = 'all';
    this.groqApiKey = import.meta.env.VITE_GROQ_API_KEY || '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';
    this._prevFailedIds = new Set();
    this.hoverTooltipEl = null;

    this.init();
  }

  init() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    // 1. Create Canvas Container for 3D Three.js scene
    const canvasContainer = document.createElement('div');
    canvasContainer.id = 'canvas-container';
    appEl.appendChild(canvasContainer);

    // 2. Create Floating 3D Hover Tooltip overlay
    this.createHoverTooltip(appEl);

    // 3. Initialize 3D City Visualization
    this.cityScene = new City3DScene(
      canvasContainer,
      this.graph,
      (serviceId) => this.handleServiceSelected(serviceId),
      (service, screenPos) => this.handleServiceHover(service, screenPos)
    );

    this.cityScene.onTourStateChange = (isTouring) => {
      const tourBtn = document.getElementById('btn-preset-tour');
      if (tourBtn) {
        if (isTouring) tourBtn.classList.add('active');
        else tourBtn.classList.remove('active');
      }
    };

    // 4. Render Top Navigation Bar
    this.renderHeader(appEl);

    // 5. Render Left Quick-Access Service Dock
    this.renderLeftDock(appEl);

    // 6. Render Bottom 3D Camera Preset & Controls Toolbar
    this.renderBottomToolbar(appEl);

    // 7. Render Keyboard Shortcuts Modal
    this.renderShortcutsModal(appEl);

    // 8. Initialize Service Inspector Drawer
    this.inspector = new ServiceInspector(
      appEl,
      this.graph,
      (serviceId) => this.handleTriggerFailure(serviceId),
      (serviceId) => this.handleMitigateService(serviceId),
      (serviceId) => this.handleServiceSelected(serviceId)
    );

    // 9. Initialize Dataset Manager Modal
    this.datasetModal = new DatasetManagerModal(
      appEl,
      this.graph,
      (preset) => {
        this._prevFailedIds.clear();
        this.updateHeaderStats();
        this.updateLeftDock();
        this.cityScene.resetOverviewCamera();
        this.cityScene.syncWithDataset();
        if (this.whatIfSimulator) {
          this.whatIfSimulator.selectedServices.clear();
          this.whatIfSimulator.renderForm();
        }
      }
    );

    // 10. Initialize 2D Network Graph Modal
    this.graphModal = new NetworkGraphModal(
      appEl,
      this.graph,
      (serviceId) => this.handleServiceSelected(serviceId)
    );

    // 11. Initialize Landing Page Overlay
    this.landingPage = new LandingPage(
      appEl,
      this.graph,
      () => this.handleEnterSmartCity(),
      (serviceId) => {
        this.handleEnterSmartCity();
        this.handleServiceSelected(serviceId);
      }
    );

    // 12. Initialize Failure Flashcard overlay
    this.flashcard = new FailureFlashcard(appEl, this.graph);

    // 13. Subscribe to Graph state changes for global reactivity
    this.graph.subscribe(() => {
      this.updateHeaderStats();
      this.updateLeftDock();

      if (this.inspector && this.inspector.currentServiceId) {
        this.inspector.inspect(this.inspector.currentServiceId);
      }

      this._detectAndShowFailures();
    });

    // 14. Initialize AI Chatbot Assistant
    this.chatbot = new SmartCityChatbot(appEl, this.graph, this.groqApiKey);

    // 15. Bind Global Keyboard Accessibility Shortcuts
    this.bindKeyboardShortcuts();

    this.updateHeaderStats();

    if (window.lucide) window.lucide.createIcons();
  }

  createHoverTooltip(container) {
    this.hoverTooltipEl = document.createElement('div');
    this.hoverTooltipEl.id = 'city-hover-tooltip';
    this.hoverTooltipEl.className = 'city-3d-tooltip';
    this.hoverTooltipEl.style.display = 'none';
    container.appendChild(this.hoverTooltipEl);
  }

  handleServiceHover(service, screenPos) {
    if (!this.hoverTooltipEl) return;

    if (!service) {
      this.hoverTooltipEl.style.display = 'none';
      return;
    }

    const emoji = this._getServiceEmoji(service.service_id);
    const statusClass = service.status.toLowerCase();
    const statusColor = service.status === 'Operational' ? '#10B981'
      : service.status === 'Degraded' ? '#F59E0B'
      : service.status === 'Recovering' ? '#D946EF'
      : '#EF4444';

    this.hoverTooltipEl.innerHTML = `
      <div class="tooltip-header">
        <span class="tooltip-emoji">${emoji}</span>
        <div class="tooltip-title">
          <div class="tooltip-name">${service.service_name}</div>
          <div class="tooltip-id">${service.service_id} • ${service.criticality}</div>
        </div>
      </div>
      <div class="tooltip-body">
        <div class="tooltip-row">
          <span class="tooltip-label">Status:</span>
          <span class="tooltip-pill" style="color: ${statusColor}; background: ${statusColor}1A; border: 1px solid ${statusColor}40;">
            ${service.status}
          </span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Impact Score:</span>
          <span class="tooltip-val">${service.impact_score || 0} / 100</span>
        </div>
        <div class="tooltip-hint">👆 Click to inspect telemetry & cascade</div>
      </div>
    `;

    // Position tooltip safely within screen bounds
    const tooltipX = Math.min(window.innerWidth - 240, screenPos.clientX + 16);
    const tooltipY = Math.min(window.innerHeight - 150, screenPos.clientY + 16);

    this.hoverTooltipEl.style.left = `${tooltipX}px`;
    this.hoverTooltipEl.style.top = `${tooltipY}px`;
    this.hoverTooltipEl.style.display = 'block';
  }

  _detectAndShowFailures() {
    const services = this.graph.getAllServices();
    const currentFailedIds = new Set(
      services.filter(s => s.status === 'Failed').map(s => s.service_id)
    );

    const newlyFailed = [...currentFailedIds].filter(id => !this._prevFailedIds.has(id));

    if (newlyFailed.length > 0) {
      const primary = newlyFailed.sort((a, b) => {
        const sA = this.graph.getService(a);
        const sB = this.graph.getService(b);
        const order = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
        return (order[sA?.criticality] || 3) - (order[sB?.criticality] || 3);
      })[0];

      const timeline = this.graph.simulateCascade(primary, 1.0);
      this.flashcard.showFailure(primary, timeline);
    }

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
        <button id="btn-open-graph" class="btn btn-secondary" title="View 2D Dependency Graph (Press G)">
          <i data-lucide="git-fork" style="width: 16px; height: 16px;"></i>
          2D Graph
        </button>

        <button id="btn-open-datasets" class="btn btn-secondary" title="Switch or Upload Datasets">
          <i data-lucide="database" style="width: 16px; height: 16px;"></i>
          Datasets
        </button>

        <button id="btn-reset-city" class="btn btn-primary" title="Restore All Infrastructure (Press R)">
          <i data-lucide="rotate-ccw" style="width: 16px; height: 16px;"></i>
          Reset City
        </button>

        <button id="btn-toggle-audio" class="btn-icon" title="Toggle Sound (Press M)">
          <i data-lucide="volume-2" id="audio-icon" style="width: 18px; height: 18px;"></i>
        </button>

        <button id="btn-open-shortcuts" class="btn-icon" title="Keyboard Shortcuts (Press ?)">
          <i data-lucide="keyboard" style="width: 18px; height: 18px;"></i>
        </button>
      </div>
    `;

    container.appendChild(header);

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

    header.querySelector('#btn-open-shortcuts').addEventListener('click', () => {
      sound.playClick();
      this.toggleShortcutsModal(true);
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

        <!-- Quick Search & Category Filter Bar -->
        <div class="dock-search-wrapper">
          <input type="text" id="dock-search-input" class="dock-search-input" placeholder="🔍 Search infrastructure..." />
        </div>
        <div class="dock-filter-chips" id="dock-category-chips">
          <button class="dock-filter-chip active" data-filter="all">All</button>
          <button class="dock-filter-chip" data-filter="PWR">⚡ Power</button>
          <button class="dock-filter-chip" data-filter="WTR">💧 Water</button>
          <button class="dock-filter-chip" data-filter="TEL">📡 Tel</button>
          <button class="dock-filter-chip" data-filter="HOS">🏥 Health</button>
          <button class="dock-filter-chip" data-filter="TRF">🚦 Traffic</button>
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

    // Tab bindings
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

    // Search input listener
    const searchInput = dock.querySelector('#dock-search-input');
    searchInput.addEventListener('input', (e) => {
      this.dockSearchQuery = e.target.value.toLowerCase().trim();
      this.updateLeftDock();
    });

    // Filter chips
    dock.querySelectorAll('.dock-filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        sound.playClick();
        dock.querySelectorAll('.dock-filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.dockCategoryFilter = chip.getAttribute('data-filter');
        this.updateLeftDock();
      });
    });

    // Initialize What-If Simulator inside its container
    const sandboxContainer = dock.querySelector('#sandbox-component-container');
    this.whatIfSimulator = new WhatIfSimulator(
      sandboxContainer,
      this.graph,
      (serviceId) => {
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

    let services = this.graph.getAllServices();
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

    // Apply category filter
    if (this.dockCategoryFilter !== 'all') {
      services = services.filter(s => s.service_id.includes(this.dockCategoryFilter));
    }

    // Apply text search
    if (this.dockSearchQuery) {
      services = services.filter(s =>
        s.service_name.toLowerCase().includes(this.dockSearchQuery) ||
        s.service_id.toLowerCase().includes(this.dockSearchQuery) ||
        s.criticality.toLowerCase().includes(this.dockSearchQuery)
      );
    }

    if (services.length === 0) {
      container.innerHTML = `
        <div style="padding: 24px 12px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">
          No matching services found.
        </div>
      `;
      return;
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

    toolbar.innerHTML = `
      <!-- Camera Angle Presets -->
      <div class="toolbar-group">
        <button class="view-preset-btn active" data-preset-id="overview" title="Default Overview (Press 1)">🗺 Overview</button>
        <button class="view-preset-btn" data-preset-id="topdown" title="Top-Down Map View (Press 2)">📐 Top-Down</button>
        <button class="view-preset-btn" data-preset-id="isometric-north" title="Isometric North View (Press 3)">🧭 Iso North</button>
        <button class="view-preset-btn" data-preset-id="isometric-south" title="Isometric South View (Press 4)">🧭 Iso South</button>
        <button class="view-preset-btn" data-preset-id="street" title="Street Level View (Press 5)">🚶 Street</button>
        <button class="view-preset-btn" id="btn-preset-tour" data-preset-id="tour" title="Cinematic Drone Tour (Press T)">🎥 Drone Tour</button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Time of Day / Dynamic Lighting Switcher -->
      <div class="toolbar-group">
        <button class="toolbar-icon-btn active" id="btn-tod-day" data-tod="day" title="Daylight Lighting (Press D)">☀️ Day</button>
        <button class="toolbar-icon-btn" id="btn-tod-sunset" data-tod="sunset" title="Golden Sunset Lighting (Press D)">🌅 Sunset</button>
        <button class="toolbar-icon-btn" id="btn-tod-night" data-tod="night" title="Cyberpunk Night Lighting (Press D)">🌙 Night</button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Zoom & Camera Action Tools -->
      <div class="toolbar-group">
        <button class="toolbar-icon-btn" id="btn-zoom-in" title="Zoom In (+)">➕</button>
        <button class="toolbar-icon-btn" id="btn-zoom-out" title="Zoom Out (-)">➖</button>
        <button class="toolbar-icon-btn" id="btn-reset-cam" title="Center View (Press R)">⟲ Reset</button>
      </div>
    `;

    container.appendChild(toolbar);

    // Camera preset buttons
    toolbar.querySelectorAll('.view-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        const presetId = btn.getAttribute('data-preset-id');
        if (presetId !== 'tour') {
          toolbar.querySelectorAll('.view-preset-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
        this.cityScene.setPresetView(presetId);
      });
    });

    // Time of Day buttons
    const todBtns = toolbar.querySelectorAll('[data-tod]');
    todBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        todBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-tod');
        this.cityScene.setTimeOfDay(mode);
      });
    });

    // Zoom buttons
    toolbar.querySelector('#btn-zoom-in').addEventListener('click', () => {
      sound.playClick();
      this.cityScene.zoomIn();
    });

    toolbar.querySelector('#btn-zoom-out').addEventListener('click', () => {
      sound.playClick();
      this.cityScene.zoomOut();
    });

    toolbar.querySelector('#btn-reset-cam').addEventListener('click', () => {
      sound.playClick();
      this.cityScene.resetOverviewCamera();
      toolbar.querySelectorAll('.view-preset-btn').forEach(b => b.classList.remove('active'));
      const ov = toolbar.querySelector('[data-preset-id="overview"]');
      if (ov) ov.classList.add('active');
    });
  }

  renderShortcutsModal(container) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'keyboard-shortcuts-modal';
    modal.style.display = 'none';

    modal.innerHTML = `
      <div class="modal-card" style="max-width: 520px;">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.4rem;">⌨️</span>
            <div>
              <h3 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">
                Keyboard & Navigation Shortcuts
              </h3>
              <p style="font-size: 0.76rem; color: var(--text-muted);">
                Pro controls for exploring the smart city & running simulations
              </p>
            </div>
          </div>
          <button class="btn-icon" id="btn-close-shortcuts-modal">
            <i data-lucide="x" style="width: 18px; height: 18px;"></i>
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; margin: 16px 0;">
          <div class="shortcut-row">
            <div class="shortcut-keys"><kbd>Left Drag</kbd></div>
            <span class="shortcut-desc">Orbit / Rotate 3D City Camera</span>
          </div>
          <div class="shortcut-row">
            <div class="shortcut-keys"><kbd>Right Drag</kbd></div>
            <span class="shortcut-desc">Pan Across Districts</span>
          </div>
          <div class="shortcut-row">
            <div class="shortcut-keys"><kbd>Scroll Wheel</kbd></div>
            <span class="shortcut-desc">Zoom In / Out</span>
          </div>
          <div class="shortcut-row">
            <div class="shortcut-keys"><kbd>1</kbd> - <kbd>5</kbd></div>
            <span class="shortcut-desc">Switch Camera Presets (Overview, Top-Down, Iso, Street)</span>
          </div>
          <div class="shortcut-row">
            <div class="shortcut-keys"><kbd>T</kbd></div>
            <span class="shortcut-desc">Toggle Cinematic Drone Tour</span>
          </div>
          <div class="shortcut-row">
            <div class="shortcut-keys"><kbd>D</kbd></div>
            <span class="shortcut-desc">Cycle Lighting (Day ☀️ ➔ Sunset 🌅 ➔ Night 🌙)</span>
          </div>
          <div class="shortcut-row">
            <div class="shortcut-keys"><kbd>Space</kbd></div>
            <span class="shortcut-desc">Pause / Resume Vehicles & Simulation</span>
          </div>
          <div class="shortcut-row">
            <div class="shortcut-keys"><kbd>R</kbd></div>
            <span class="shortcut-desc">Reset City Infrastructure & Center View</span>
          </div>
          <div class="shortcut-row">
            <div class="shortcut-keys"><kbd>G</kbd></div>
            <span class="shortcut-desc">Open 2D Network Dependency Graph</span>
          </div>
          <div class="shortcut-row">
            <div class="shortcut-keys"><kbd>M</kbd></div>
            <span class="shortcut-desc">Mute / Unmute Audio Sound FX</span>
          </div>
          <div class="shortcut-row">
            <div class="shortcut-keys"><kbd>?</kbd></div>
            <span class="shortcut-desc">Toggle this Shortcuts Guide</span>
          </div>
          <div class="shortcut-row">
            <div class="shortcut-keys"><kbd>Esc</kbd></div>
            <span class="shortcut-desc">Close Open Drawer / Dialogs</span>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end;">
          <button class="btn btn-primary" id="btn-done-shortcuts">Got It</button>
        </div>
      </div>
    `;

    container.appendChild(modal);

    modal.querySelector('#btn-close-shortcuts-modal').addEventListener('click', () => {
      this.toggleShortcutsModal(false);
    });
    modal.querySelector('#btn-done-shortcuts').addEventListener('click', () => {
      this.toggleShortcutsModal(false);
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.toggleShortcutsModal(false);
    });
  }

  toggleShortcutsModal(show) {
    const modal = document.getElementById('keyboard-shortcuts-modal');
    if (modal) {
      modal.style.display = show ? 'flex' : 'none';
    }
  }

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't trigger when user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }

      const key = e.key.toUpperCase();

      if (e.key === '1') {
        this.cityScene.setPresetView('overview');
      } else if (e.key === '2') {
        this.cityScene.setPresetView('topdown');
      } else if (e.key === '3') {
        this.cityScene.setPresetView('isometric-north');
      } else if (e.key === '4') {
        this.cityScene.setPresetView('isometric-south');
      } else if (e.key === '5') {
        this.cityScene.setPresetView('street');
      } else if (key === 'T') {
        this.cityScene.setPresetView('tour');
      } else if (key === 'D') {
        const nextMode = this.cityScene.timeOfDay === 'day' ? 'sunset'
          : this.cityScene.timeOfDay === 'sunset' ? 'night' : 'day';
        this.cityScene.setTimeOfDay(nextMode);
        document.querySelectorAll('[data-tod]').forEach(b => {
          if (b.getAttribute('data-tod') === nextMode) b.classList.add('active');
          else b.classList.remove('active');
        });
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        this.cityScene.isPaused = !this.cityScene.isPaused;
      } else if (key === 'R') {
        sound.playRecovery();
        this.cityScene.resetOverviewCamera();
        this.flashcard.dismiss();
        this._prevFailedIds.clear();
        this.graph.resetAll();
      } else if (key === 'M') {
        this.isAudioMuted = sound.toggleMute();
        const icon = document.getElementById('audio-icon');
        if (icon) {
          icon.setAttribute('data-lucide', this.isAudioMuted ? 'volume-x' : 'volume-2');
          if (window.lucide) window.lucide.createIcons();
        }
      } else if (key === 'G') {
        this.graphModal.open(this.inspector?.currentServiceId);
      } else if (e.key === '?' || key === 'H') {
        const modal = document.getElementById('keyboard-shortcuts-modal');
        const isShown = modal && modal.style.display === 'flex';
        this.toggleShortcutsModal(!isShown);
      } else if (e.key === 'Escape') {
        this.toggleShortcutsModal(false);
        this.inspector.close();
      }
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
    this.graph.updateServiceStatus(serviceId, 'Failed');
    this.cityScene.triggerCascadeShockwave(serviceId);

    const timeline = this.graph.simulateCascade(serviceId, 1.0);

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
    this.graph.updateServiceStatus(serviceId, 'Operational');
    this.cityScene.updateServiceVisuals();

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
