/**
 * CASCADYN - Welcome / Landing Page Component
 * Renders the "Welcome to Smart City" hero screen with interactive flashcards
 * showcasing all available services, metrics, and instant entry triggers.
 */

import { sound } from '../engine/audioEngine.js';

export class LandingPage {
  constructor(containerElement, graph, onEnterCity, onFocusService) {
    this.container = containerElement;
    this.graph = graph;
    this.onEnterCity = onEnterCity;
    this.onFocusService = onFocusService;
    this.element = null;

    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'landing-overlay';
    this.element.id = 'landing-page';

    const services = this.graph.getAllServices();

    this.element.innerHTML = `
      <div class="landing-content">
        <!-- Hero Header -->
        <div class="landing-hero">
          <div class="hero-tag">
            <i data-lucide="sparkles" style="width: 16px; height: 16px;"></i>
            Next-Gen Urban Resilience Simulator
          </div>

          <h1 class="hero-title">
            Welcome to <span class="gradient-text">SmartCity</span>
          </h1>

          <p class="hero-tagline">
            “Simulate. Understand. Prevent Urban Cascades.”
          </p>

          <p class="hero-description">
            Explore an interconnected living metropolis where critical infrastructure networks—energy, water, telecom, transit, and emergency healthcare—rely on directed weighted dependencies. Witness how a single localized failure propagates into a catastrophic cascade.
          </p>

          <div class="hero-actions">
            <button id="btn-enter-city" class="btn btn-primary btn-hero pulse-animation">
              <i data-lucide="compass" style="width: 22px; height: 22px;"></i>
              Enter Smart City
            </button>
            <button id="btn-quick-tour" class="btn btn-secondary btn-hero">
              <i data-lucide="layers" style="width: 20px; height: 20px;"></i>
              Explore Services (${services.length})
            </button>
          </div>
        </div>

        <!-- Available Services Flash Cards Section -->
        <div class="section-header">
          <div>
            <h3>Available City Services</h3>
            <p>Select any infrastructure service below to inspect its dependency matrix and failure tolerance</p>
          </div>
          <span class="pill green">
            <span class="pill-dot"></span>
            All 8 Core Systems Online
          </span>
        </div>

        <div class="services-flash-grid">
          ${services.map(service => this.createFlashCardHTML(service)).join('')}
        </div>

        <!-- Key Features Section -->
        <div class="section-header" style="margin-top: 20px;">
          <div>
            <h3>Simulation & Intelligence Capabilities</h3>
            <p>Engineered for high-fidelity disaster response analysis and cascading risk modeling</p>
          </div>
        </div>

        <div class="features-grid">
          <div class="feature-box">
            <div class="feature-box-icon" style="background: rgba(255, 46, 147, 0.12); color: #FF2E93;">
              <i data-lucide="git-fork" style="width: 26px; height: 26px;"></i>
            </div>
            <div class="feature-box-text">
              <h4>Directed Weighted Graph Engine</h4>
              <p>Model dependencies with precise continuous strengths [0.0 - 1.0] across power, water, telecom, transit, and medical lines.</p>
            </div>
          </div>

          <div class="feature-box">
            <div class="feature-box-icon" style="background: rgba(249, 115, 22, 0.12); color: #F97316;">
              <i data-lucide="flame" style="width: 26px; height: 26px;"></i>
            </div>
            <div class="feature-box-text">
              <h4>Dynamic Cascade Propagation</h4>
              <p>Observe shockwaves and failure waves ripple in real-time through downstream services when upstream nodes collapse.</p>
            </div>
          </div>

          <div class="feature-box">
            <div class="feature-box-icon" style="background: rgba(16, 185, 129, 0.12); color: #10B981;">
              <i data-lucide="database" style="width: 26px; height: 26px;"></i>
            </div>
            <div class="feature-box-text">
              <h4>Real-World Dataset Import</h4>
              <p>Switch seamlessly between Synthetic Metropolis 2030, the Chicago Urban Infrastructure dataset, or upload custom CSV/JSON graphs.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
    this.bindEvents();
  }

  createFlashCardHTML(service) {
    const metrics = this.graph.getDependencyMetrics(service.service_id);
    const critClass = service.criticality.toLowerCase();

    return `
      <div class="flash-card" data-service-id="${service.service_id}" style="--card-accent: ${service.color_hex || '#FF2E93'}; --icon-bg: ${service.color_hex ? service.color_hex + '20' : '#FF2E9320'};">
        <div class="card-top">
          <div class="card-icon-box">
            <i data-lucide="${service.icon || 'activity'}" style="width: 24px; height: 24px;"></i>
          </div>
          <span class="card-status-badge" style="background: ${this.getStatusBg(service.status)}; color: ${this.getStatusColor(service.status)};">
            ● ${service.status}
          </span>
        </div>

        <h4 class="card-title">${service.service_name}</h4>
        <p class="card-desc">${service.description}</p>

        <div class="card-metrics">
          <div class="metric-item">
            <span class="metric-label">Impact Score</span>
            <span class="metric-val" style="color: ${service.impact_score > 90 ? '#EF4444' : '#F97316'};">${service.impact_score}/100</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Est. Recovery</span>
            <span class="metric-val">${service.recovery_time}</span>
          </div>
        </div>

        <div class="card-footer-tags">
          <span class="tag-criticality ${critClass}">
            ${service.criticality} Tier
          </span>
          <span>
            ${metrics.downstreamCount} Dependents • ${metrics.upstreamCount} Inputs
          </span>
        </div>
      </div>
    `;
  }

  getStatusBg(status) {
    switch (status) {
      case 'Operational': return 'rgba(16, 185, 129, 0.12)';
      case 'Degraded': return 'rgba(245, 158, 11, 0.12)';
      case 'Failed': return 'rgba(239, 68, 68, 0.14)';
      default: return 'rgba(217, 70, 239, 0.14)';
    }
  }

  getStatusColor(status) {
    switch (status) {
      case 'Operational': return '#10B981';
      case 'Degraded': return '#F59E0B';
      case 'Failed': return '#EF4444';
      default: return '#D946EF';
    }
  }

  bindEvents() {
    // Enter City Button
    const enterBtn = this.element.querySelector('#btn-enter-city');
    if (enterBtn) {
      enterBtn.addEventListener('click', () => {
        sound.playClick();
        this.hide();
        if (this.onEnterCity) this.onEnterCity();
      });
    }

    // Quick Tour Button
    const tourBtn = this.element.querySelector('#btn-quick-tour');
    if (tourBtn) {
      tourBtn.addEventListener('click', () => {
        sound.playClick();
        const grid = this.element.querySelector('.services-flash-grid');
        if (grid) grid.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Flash Cards Click Events
    const cards = this.element.querySelectorAll('.flash-card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => sound.playHover());
      card.addEventListener('click', () => {
        sound.playClick();
        const serviceId = card.getAttribute('data-service-id');
        this.hide();
        if (this.onEnterCity) this.onEnterCity();
        if (this.onFocusService) this.onFocusService(serviceId);
      });
    });
  }

  show() {
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
