/**
 * CASCADYN - City Dataset Manager Component
 * Allows switching datasets (Synthetic Metropolis vs Chicago),
 * importing custom CSV/JSON files, and exporting active graph datasets.
 */

import { SYNTHETIC_CITY_DATASET, CHICAGO_CITY_DATASET, importFromCSV, exportToCSV, exportToJSON } from '../data/cityDataset.js';
import { sound } from '../engine/audioEngine.js';

export class DatasetManagerModal {
  constructor(containerElement, graph, onDatasetLoaded) {
    this.container = containerElement;
    this.graph = graph;
    this.onDatasetLoaded = onDatasetLoaded;
    this.element = null;
    this.currentPreset = 'synthetic';

    this.init();
  }

  init() {
    this.element = document.createElement('div');
    this.element.className = 'modal-overlay';
    this.element.id = 'dataset-modal';
    this.container.appendChild(this.element);
  }

  open() {
    const services = this.graph.getAllServices();

    this.element.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h3>City Dataset & Service Graph Manager</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Manage and import structured urban infrastructure graphs with weighted dependencies.
            </p>
          </div>
          <button id="btn-close-dataset-modal" class="modal-close-btn">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <!-- Preset Switcher -->
        <div style="display: flex; gap: 12px; margin-bottom: 24px;">
          <button id="btn-preset-synthetic" class="btn ${this.currentPreset === 'synthetic' ? 'btn-primary' : 'btn-secondary'}" style="flex: 1;">
            <i data-lucide="cpu" style="width: 18px; height: 18px;"></i>
            Synthetic Metropolis (Default)
          </button>
          <button id="btn-preset-chicago" class="btn ${this.currentPreset === 'chicago' ? 'btn-primary' : 'btn-secondary'}" style="flex: 1;">
            <i data-lucide="building" style="width: 18px; height: 18px;"></i>
            Chicago Urban Sample (Loop & IMD)
          </button>
        </div>

        <!-- Custom Upload & Export Toolbar -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: var(--bg-primary); border-radius: var(--radius-md); margin-bottom: 20px; border: 1px solid var(--border-light);">
          <div>
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">Import Custom Graph Data</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Supports standard CSV or JSON format with weighted links</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <label class="btn btn-secondary" style="font-size: 0.8rem; padding: 8px 14px; cursor: pointer;">
              <i data-lucide="upload" style="width: 16px; height: 16px;"></i>
              Upload CSV / JSON
              <input type="file" id="input-dataset-file" accept=".csv,.json" style="display: none;" />
            </label>
            <button id="btn-export-csv" class="btn btn-secondary" style="font-size: 0.8rem; padding: 8px 14px;">
              <i data-lucide="download" style="width: 16px; height: 16px;"></i>
              Export CSV
            </button>
            <button id="btn-export-json" class="btn btn-secondary" style="font-size: 0.8rem; padding: 8px 14px;">
              <i data-lucide="file-json" style="width: 16px; height: 16px;"></i>
              Export JSON
            </button>
          </div>
        </div>

        <!-- Current Services Table Preview -->
        <div style="margin-top: 10px;">
          <div style="font-size: 0.85rem; font-weight: 700; margin-bottom: 10px; display: flex; justify-content: space-between;">
            <span>Active Services in Graph (${services.length})</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Schema: ID | Name | Criticality | Impact | Connections</span>
          </div>

          <div style="max-height: 240px; overflow-y: auto; border: 1px solid var(--border-light); border-radius: var(--radius-md);">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; text-align: left;">
              <thead style="background: var(--bg-primary); position: sticky; top: 0; color: var(--text-muted); font-size: 0.74rem; text-transform: uppercase;">
                <tr>
                  <th style="padding: 10px 14px;">ID</th>
                  <th style="padding: 10px 14px;">Service Name</th>
                  <th style="padding: 10px 14px;">Status</th>
                  <th style="padding: 10px 14px;">Criticality</th>
                  <th style="padding: 10px 14px;">Impact</th>
                  <th style="padding: 10px 14px;">Connected Targets</th>
                </tr>
              </thead>
              <tbody>
                ${services.map(s => `
                  <tr style="border-top: 1px solid var(--border-light);">
                    <td style="padding: 10px 14px; font-family: var(--font-mono); font-weight: 700; color: var(--accent-magenta);">${s.service_id}</td>
                    <td style="padding: 10px 14px; font-weight: 600;">${s.service_name}</td>
                    <td style="padding: 10px 14px;">
                      <span style="display: inline-flex; align-items: center; gap: 4px; color: ${s.status === 'Operational' ? '#10B981' : '#EF4444'}; font-weight: 700;">
                        ● ${s.status}
                      </span>
                    </td>
                    <td style="padding: 10px 14px;">${s.criticality}</td>
                    <td style="padding: 10px 14px; font-family: var(--font-mono);">${s.impact_score}/100</td>
                    <td style="padding: 10px 14px; font-size: 0.76rem; color: var(--text-muted);">
                      ${(s.connected_services || []).map(c => `${c.target_id} (${c.strength})`).join(', ')}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.element.classList.add('open');
    if (window.lucide) window.lucide.createIcons();
    this.bindEvents();
  }

  bindEvents() {
    // Close
    const closeBtn = this.element.querySelector('#btn-close-dataset-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        sound.playClick();
        this.close();
      });
    }

    // Preset Synthetic
    const synthBtn = this.element.querySelector('#btn-preset-synthetic');
    if (synthBtn) {
      synthBtn.addEventListener('click', () => {
        sound.playClick();
        this.currentPreset = 'synthetic';
        this.graph.loadDataset(SYNTHETIC_CITY_DATASET);
        if (this.onDatasetLoaded) this.onDatasetLoaded('synthetic');
        this.open();
      });
    }

    // Preset Chicago
    const chiBtn = this.element.querySelector('#btn-preset-chicago');
    if (chiBtn) {
      chiBtn.addEventListener('click', () => {
        sound.playClick();
        this.currentPreset = 'chicago';
        this.graph.loadDataset(CHICAGO_CITY_DATASET);
        if (this.onDatasetLoaded) this.onDatasetLoaded('chicago');
        this.open();
      });
    }

    // Export CSV
    const exportCsvBtn = this.element.querySelector('#btn-export-csv');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        sound.playClick();
        const csv = exportToCSV(this.graph.getAllServices());
        this.downloadFile(csv, 'cascadyn_city_dataset.csv', 'text/csv');
      });
    }

    // Export JSON
    const exportJsonBtn = this.element.querySelector('#btn-export-json');
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => {
        sound.playClick();
        const json = exportToJSON(this.graph.getAllServices());
        this.downloadFile(json, 'cascadyn_city_dataset.json', 'application/json');
      });
    }

    // File Upload Handler
    const fileInput = this.element.querySelector('#input-dataset-file');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target.result;
            let dataset;
            if (file.name.endsWith('.json')) {
              dataset = JSON.parse(content);
            } else {
              dataset = importFromCSV(content);
            }

            if (Array.isArray(dataset) && dataset.length > 0) {
              this.currentPreset = 'custom';
              this.graph.loadDataset(dataset);
              if (this.onDatasetLoaded) this.onDatasetLoaded('custom');
              sound.playRecovery();
              this.open();
            } else {
              alert("Invalid dataset structure. Please ensure columns or JSON matches schema.");
            }
          } catch (err) {
            alert("Error parsing file: " + err.message);
          }
        };
        reader.readAsText(file);
      });
    }
  }

  downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  close() {
    this.element.classList.remove('open');
  }
}
