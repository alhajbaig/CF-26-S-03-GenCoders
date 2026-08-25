/**
 * CASCADYN – Ultra-Premium Enterprise Landing Page & Interactive Motion Experience
 * Featuring:
 * - High-Performance Live 2D Topological Canvas Cascade Propagation Engine
 *   (Full 10-node interactive network, clickable nodes, shockwave ripples, particle arcs, live playback controls)
 * - Interactive Heavy City Stress-Test Reactor Console (0% to 100% Disaster Scrubbing)
 * - Lenis Smooth Inertia Scroll Physics
 * - GSAP ScrollTrigger Pinned Cascade Scrubber & Horizontal Capability Deck
 * - Apple-Style Kinetic Word-by-Word Scroll Manifesto
 * - Interactive Split Digital Twin Curtain (Steady State vs Cascade Disaster)
 * - Real-World Municipal Case Studies & Historical Disaster Replays
 * - Dynamic Cursor Spotlight, Multi-Layer Parallax & Cybernetic Audio FX
 */

import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sound } from '../engine/audioEngine.js';

gsap.registerPlugin(ScrollTrigger);

export class LandingPage {
  constructor(containerElement, graph, onEnterCity, onFocusService) {
    this.container = containerElement;
    this.graph = graph;
    this.onEnterCity = onEnterCity;
    this.onFocusService = onFocusService;
    this.element = null;
    this.lenis = null;
    this.activeScenario = 'power';
    this.scrollProgressEl = null;
    this.canvasAnimId = null;
    this.audioEnabled = true;
    this.stressLevel = 0;

    // Visualizer State
    this.topoNodes = [];
    this.topoEdges = [];
    this.topoParticles = [];
    this.shockwaves = [];
    this.simSpeed = 1;
    this.simStep = 0;
    this.simInterval = null;
    this.hoveredNode = null;

    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'landing-overlay';
    this.element.id = 'landing-page';

    const services = this.graph.getAllServices();

    this.element.innerHTML = `
      <!-- Fixed Glowing Scroll Progress Bar -->
      <div class="landing-scroll-progress-track">
        <div class="landing-scroll-progress-bar" id="landing-progress-bar"></div>
      </div>

      <!-- Ambient Dynamic Cursor Spotlight Follower -->
      <div class="cursor-glow-spotlight" id="cursor-glow-spotlight"></div>

      <!-- Floating Glass Sticky Navigation Bar -->
      <div class="landing-nav-outer">
        <nav class="landing-nav" id="landing-navbar">
          <div class="nav-brand">
            <div class="nav-logo-badge">C</div>
            <div class="nav-brand-text">
              <span class="nav-title">CASCADYN</span>
              <span class="nav-v-tag">v2.4 Pro</span>
            </div>
          </div>

          <div class="nav-links">
            <a href="#section-guide" class="nav-link">Masterclass</a>
            <a href="#section-stress-dial" class="nav-link">Stress Reactor</a>
            <a href="#section-interactive-sim" class="nav-link">Live Visualizer</a>
            <a href="#section-pinned-cascade" class="nav-link">Cascade Scrubber</a>
            <a href="#section-horizontal" class="nav-link">Capabilities</a>
            <a href="#section-case-studies" class="nav-link">Case Studies</a>
            <a href="#section-faq" class="nav-link">FAQ</a>
          </div>

          <div class="nav-actions">
            <!-- Combined Audio & Status Telemetry Pill -->
            <button class="nav-status-audio-pill" id="nav-audio-toggle" title="Toggle Sci-Fi Sound FX & Telemetry">
              <span class="perf-dot"></span>
              <span class="nav-fps-text">60 FPS</span>
              <span class="pill-pipe">/</span>
              <div class="audio-wave-bars">
                <span class="bar bar1"></span>
                <span class="bar bar2"></span>
                <span class="bar bar3"></span>
                <span class="bar bar4"></span>
              </div>
              <span id="audio-state-text">AUDIO</span>
            </button>

            <!-- Primary Launch CTA -->
            <button id="nav-btn-enter" class="btn btn-primary nav-cta-btn">
              <span>Launch 3D City</span>
              <i data-lucide="arrow-up-right" style="width: 15px; height: 15px;"></i>
            </button>
          </div>
        </nav>
      </div>

      <div class="landing-content" id="landing-scroll-content">

        <!-- =========================================================================
             1. HERO SECTION: ULTRA-PREMIUM EDITORIAL & STATEMENT
             ========================================================================= -->
        <section class="landing-hero-section" id="section-hero">
          <div class="hero-glow-blob blob-1"></div>
          <div class="hero-glow-blob blob-2"></div>
          <div class="hero-glow-blob blob-3"></div>

          <div class="hero-tag-wrapper">
            <div class="hero-pill-badge">
              <span class="pulse-dot"></span>
              <span>Next-Gen Urban Resilience Simulation Engine</span>
              <span class="badge-divider">•</span>
              <span class="badge-sub">Real-Time Directed Graph Analytics</span>
            </div>
          </div>

          <h1 class="hero-main-title">
            MODEL THE <span class="gradient-text-magenta">CHAOS.</span><br />
            PREVENT THE <span class="gradient-text-orange">CASCADE.</span><br />
            PROTECT THE <span class="gradient-text-cyan">SMART CITY.</span>
          </h1>

          <p class="hero-subtext">
            CASCADYN is an elite, high-fidelity interactive simulation engine engineered for municipal engineers, disaster response teams, and systems architects. Analyze how a single point of failure in power, water, telecom, or transit triggers cascading failure waves across an interconnected living metropolis.
          </p>

          <!-- Primary Hero CTAs -->
          <div class="hero-cta-group">
            <button id="btn-enter-city" class="btn btn-primary btn-hero-primary pulse-glow-btn">
              <i data-lucide="compass" style="width: 22px; height: 22px;"></i>
              <span>Enter 3D City Engine</span>
            </button>
            <button id="btn-scroll-guide" class="btn btn-secondary btn-hero-secondary">
              <i data-lucide="play-circle" style="width: 20px; height: 20px;"></i>
              <span>Interactive User Guide</span>
            </button>
            <button id="btn-hero-whatif" class="btn btn-glass btn-hero-secondary">
              <i data-lucide="flask-conical" style="width: 20px; height: 20px;"></i>
              <span>What-If Sandbox</span>
            </button>
          </div>

          <!-- Hero Metrics Glass Ribbon -->
          <div class="hero-stats-ribbon">
            <div class="stat-ribbon-card tilt-card">
              <div class="stat-num counter-val" data-target="100">100%</div>
              <div class="stat-label">Deterministic Graph BFS</div>
              <div class="stat-sub">Zero-jitter propagation replay</div>
            </div>
            <div class="stat-ribbon-card tilt-card">
              <div class="stat-num counter-val" data-target="12">&lt; 12ms</div>
              <div class="stat-label">Cascade Compute Time</div>
              <div class="stat-sub">Zero-latency simulation</div>
            </div>
            <div class="stat-ribbon-card tilt-card">
              <div class="stat-num counter-val" data-target="10">10 Core</div>
              <div class="stat-label">Infrastructure Systems</div>
              <div class="stat-sub">Weighted dependency mesh</div>
            </div>
            <div class="stat-ribbon-card tilt-card">
              <div class="stat-num counter-val" data-target="3">3 Algorithmic</div>
              <div class="stat-label">Recovery Strategies</div>
              <div class="stat-sub">Manual • Automated • Priority</div>
            </div>
          </div>
        </section>

        <!-- =========================================================================
             2. APPLE-STYLE KINETIC WORD-BY-WORD SCROLL MANIFESTO
             ========================================================================= -->
        <section class="landing-section manifesto-section" id="section-statement">
          <div class="manifesto-card">
            <div class="manifesto-tag">
              <i data-lucide="shield-alert" style="width: 16px; height: 16px;"></i>
              <span>The Law of Urban Cascades</span>
            </div>
            <div class="manifesto-text-block" id="manifesto-text">
              <span class="m-word">When</span> <span class="m-word">a</span> <span class="m-word">single</span> <span class="m-word highlight-red">power</span> <span class="m-word highlight-red">substation</span> <span class="m-word">trips</span> <span class="m-word">in</span> <span class="m-word">the</span> <span class="m-word">dead</span> <span class="m-word">of</span> <span class="m-word">night,</span> <span class="m-word">the</span> <span class="m-word">city</span> <span class="m-word">does</span> <span class="m-word">not</span> <span class="m-word">break</span> <span class="m-word">all</span> <span class="m-word">at</span> <span class="m-word">once.</span> <span class="m-word highlight-orange">It</span> <span class="m-word highlight-orange">breaks</span> <span class="m-word highlight-orange">in</span> <span class="m-word highlight-orange">waves.</span> <span class="m-word">Water</span> <span class="m-word">pumps</span> <span class="m-word">lose</span> <span class="m-word">pressure.</span> <span class="m-word">Telecom</span> <span class="m-word">batteries</span> <span class="m-word">drain.</span> <span class="m-word">Traffic</span> <span class="m-word">signals</span> <span class="m-word">freeze.</span> <span class="m-word">Emergency</span> <span class="m-word">routes</span> <span class="m-word">gridlock.</span> <span class="m-word highlight-cyan">CASCADYN</span> <span class="m-word highlight-cyan">gives</span> <span class="m-word highlight-cyan">commanders</span> <span class="m-word highlight-cyan">the</span> <span class="m-word highlight-cyan">power</span> <span class="m-word highlight-cyan">to</span> <span class="m-word highlight-cyan">predict,</span> <span class="m-word highlight-cyan">quarantine,</span> <span class="m-word highlight-cyan">and</span> <span class="m-word highlight-cyan">restore.</span>
            </div>
          </div>
        </section>

        <!-- =========================================================================
             3. INTERACTIVE CITY STRESS-TEST REACTOR CONSOLE (Heavy Hardware Widget)
             ========================================================================= -->
        <section class="landing-section stress-dial-section" id="section-stress-dial">
          <div class="section-badge-header">
            <span class="section-eyebrow">Interactive Hardware Console</span>
            <h2 class="section-title">City Stress-Test Reactor Dial</h2>
            <p class="section-subtitle">
              Drag the stress-test slider to dynamically simulate escalating municipal crisis levels in real time.
            </p>
          </div>

          <div class="reactor-console-card tilt-card">
            <div class="reactor-header">
              <div class="reactor-status-left">
                <span class="reactor-pill" id="reactor-status-pill">● STATUS: BASELINE OPERATIONS</span>
                <span class="reactor-title">MUNICIPAL SCADA GRID STRESS CONSOLE</span>
              </div>
              <div class="reactor-readouts">
                <div class="r-readout">
                  <span class="r-label">GRID LOAD</span>
                  <span class="r-val" id="r-grid-load">100%</span>
                </div>
                <div class="r-readout">
                  <span class="r-label">SCADA JITTER</span>
                  <span class="r-val" id="r-scada-jitter">4.2ms</span>
                </div>
                <div class="r-readout">
                  <span class="r-label">ACTIVE OUTAGES</span>
                  <span class="r-val" id="r-outages-count">0 / 10</span>
                </div>
              </div>
            </div>

            <!-- Heavy Metallic Drag Slider -->
            <div class="reactor-slider-wrap">
              <div class="slider-labels-top">
                <span>0% Baseline</span>
                <span>25% Localized</span>
                <span>50% Interdependent</span>
                <span>75% Cascade Storm</span>
                <span>100% Total Blackout</span>
              </div>
              <input type="range" id="stress-range-slider" min="0" max="100" value="0" step="1" class="reactor-custom-slider" />
              <div class="slider-track-glow" id="slider-glow-bar"></div>
            </div>

            <!-- Reactor Dial Feedback Board -->
            <div class="reactor-feedback-grid">
              <div class="reactor-stat-box">
                <span class="rs-label">GLOBAL RESILIENCE</span>
                <span class="rs-val rs-big green" id="rs-resilience-val">100%</span>
                <div class="rs-bar-track"><div class="rs-bar-fill green" id="rs-resilience-bar" style="width: 100%;"></div></div>
              </div>
              <div class="reactor-stat-box">
                <span class="rs-label">CASCADE PROPAGATION DEPTH</span>
                <span class="rs-val rs-big" id="rs-depth-val">Level 0</span>
                <span class="rs-sub" id="rs-depth-sub">No failure waves detected</span>
              </div>
              <div class="reactor-stat-box">
                <span class="rs-label">TACTICAL RECOMMENDATION</span>
                <span class="rs-val" id="rs-tactic-val" style="font-size: 1.1rem; color: #38BDF8;">Routine Diagnostic Monitoring</span>
                <span class="rs-sub" id="rs-tactic-sub">All 10 services operating nominal</span>
              </div>
            </div>
          </div>
        </section>

        <!-- =========================================================================
             4. LIVE CASCADE PROPAGATION VISUALIZER (Holographic 2D Topology Canvas)
             ========================================================================= -->
        <section class="landing-section" id="section-interactive-sim">
          <div class="interactive-sandbox-preview">
            <div class="sandbox-preview-header">
              <div>
                <span class="section-eyebrow">Interactive Topological Canvas Engine</span>
                <h2 class="section-title">Live Cascade Propagation Visualizer</h2>
                <p class="section-subtitle">
                  Click any node on the canvas to trigger a live cascade, or switch scenarios to watch shockwave propagation across the city graph in real time.
                </p>
              </div>

              <!-- Scenario Selector Tabs -->
              <div class="scenario-tabs">
                <button class="scenario-tab-btn active" data-scenario="power">⚡ Power Grid Failure</button>
                <button class="scenario-tab-btn" data-scenario="water">💧 Water Works Collapse</button>
                <button class="scenario-tab-btn" data-scenario="telecom">📡 Telecom Fiber Sever</button>
              </div>
            </div>

            <!-- Dynamic Scenario Display Board with Live 2D Canvas & Controls -->
            <div class="topo-visualizer-container">
              <div class="topo-canvas-wrapper" id="topo-canvas-wrapper">
                <canvas id="topo-canvas"></canvas>
                <div class="topo-canvas-overlay-hud">
                  <div class="topo-hud-status">
                    <span class="live-dot-green"></span>
                    <span id="topo-hud-text">CANVAS ACTIVE • CLICK ANY NODE TO INJECT FAILURE</span>
                  </div>
                  <div class="topo-canvas-actions">
                    <button id="btn-topo-play" class="btn-topo-ctrl active" title="Replay Propagation">
                      <i data-lucide="play" style="width: 14px; height: 14px;"></i>
                      <span>Simulate Wave</span>
                    </button>
                    <button id="btn-topo-reset" class="btn-topo-ctrl" title="Reset All Nodes to 100% Operational">
                      <i data-lucide="rotate-ccw" style="width: 14px; height: 14px;"></i>
                      <span>Reset Graph</span>
                    </button>
                    <button id="btn-topo-recover" class="btn-topo-ctrl highlight" title="Run Automated Recovery">
                      <i data-lucide="shield-check" style="width: 14px; height: 14px;"></i>
                      <span>Auto-Recover</span>
                    </button>
                  </div>
                </div>

                <!-- Hover Node Telemetry Floating Tooltip -->
                <div class="topo-node-tooltip" id="topo-node-tooltip" style="display: none;">
                  <div class="tt-title" id="tt-title">Power Grid (PWR-01)</div>
                  <div class="tt-row"><span>Status:</span><span id="tt-status" class="tt-status red">Failed</span></div>
                  <div class="tt-row"><span>Impact:</span><span id="tt-impact">100/100</span></div>
                  <div class="tt-row"><span>Downstream:</span><span id="tt-downstream">5 Dependents</span></div>
                </div>
              </div>

              <!-- Side Scenario Details & Telemetry Timeline -->
              <div class="topo-side-details" id="scenario-board">
                <!-- Dynamically updated by JS -->
              </div>
            </div>
          </div>
        </section>

        <!-- =========================================================================
             5. MASTER 5-STEP USER GUIDE: HOW TO USE CASCADYN
             ========================================================================= -->
        <!-- =========================================================================
             5. MASTER 5-STEP USER GUIDE: INTERACTIVE SCROLL MASTERCLASS
             ========================================================================= -->
        <section class="landing-section guide-showcase-section" id="section-guide">
          <div class="section-badge-header">
            <span class="section-eyebrow">Interactive Masterclass</span>
            <h2 class="section-title">How to Use CASCADYN in 5 Steps</h2>
            <p class="section-subtitle">
              Scroll down or click the step pills below to explore each operational capability with real-time interactive preview telemetry.
            </p>
          </div>

          <!-- Step Navigation Pills -->
          <div class="guide-pills-nav" id="guide-pills-nav">
            <button class="guide-nav-pill active" data-step-target="1">
              <span class="pill-num">01</span>
              <span>3D City Engine</span>
            </button>
            <button class="guide-nav-pill" data-step-target="2">
              <span class="pill-num">02</span>
              <span>Cascade Failure</span>
            </button>
            <button class="guide-nav-pill" data-step-target="3">
              <span class="pill-num">03</span>
              <span>What-If Sandbox</span>
            </button>
            <button class="guide-nav-pill" data-step-target="4">
              <span class="pill-num">04</span>
              <span>2D Topology DAG</span>
            </button>
            <button class="guide-nav-pill" data-step-target="5">
              <span class="pill-num">05</span>
              <span>AI Incident Commander</span>
            </button>
          </div>

          <!-- 2-Column Showcase Layout -->
          <div class="guide-showcase-split">
            <!-- Left Column: 5 Interactive Vertical Steps -->
            <div class="guide-steps-scroll-col">

              <!-- Step 1 Card -->
              <div class="guide-master-card active" data-step-id="1">
                <div class="master-card-header">
                  <div class="master-num-glow cyan">01</div>
                  <div class="master-icon-box" style="color: #00D2FF; background: rgba(0, 210, 255, 0.12);">
                    <i data-lucide="orbit" style="width: 26px; height: 26px;"></i>
                  </div>
                </div>
                <h3 class="master-title">Explore & Inspect the 3D City</h3>
                <p class="master-desc">
                  Navigate the living Three.js metropolis with full 360° OrbitControls. Left-click drag to rotate, right-click drag to pan across districts, and scroll wheel to zoom. Hover over any skyscraper or service pin to view instant real-time telemetry HUD cards.
                </p>
                <div class="master-shortcuts-row">
                  <span class="kbd-pill"><kbd>Left Drag</kbd> Rotate</span>
                  <span class="kbd-pill"><kbd>Right Drag</kbd> Pan</span>
                  <span class="kbd-pill"><kbd>Scroll</kbd> Zoom</span>
                  <span class="kbd-pill"><kbd>☀️/🌅/🌙</kbd> Lighting</span>
                </div>
                <div class="master-action-row">
                  <button class="btn-step-action btn-cyan btn-launch-step1">
                    <i data-lucide="compass" style="width: 16px; height: 16px;"></i>
                    <span>Launch 3D Explorer</span>
                  </button>
                </div>
              </div>

              <!-- Step 2 Card -->
              <div class="guide-master-card" data-step-id="2">
                <div class="master-card-header">
                  <div class="master-num-glow red">02</div>
                  <div class="master-icon-box" style="color: #EF4444; background: rgba(239, 68, 68, 0.12);">
                    <i data-lucide="zap-off" style="width: 26px; height: 26px;"></i>
                  </div>
                </div>
                <h3 class="master-title">Trigger Controlled Cascade Failures</h3>
                <p class="master-desc">
                  Click any infrastructure pin (e.g. <strong>Power Grid PWR-01</strong> or <strong>Water Works WTR-01</strong>) to open the Service Inspector. Hit <code class="code-pill">Trigger Cascade Failure</code> to inject a stress event and watch shockwaves ripple across downstream dependents.
                </p>
                <div class="master-shortcuts-row">
                  <span class="kbd-pill"><kbd>Click Node</kbd> Select</span>
                  <span class="kbd-pill"><kbd>Trigger</kbd> Failure Wave</span>
                  <span class="kbd-pill"><kbd>Space</kbd> Pause Sim</span>
                </div>
                <div class="master-action-row">
                  <button class="btn-step-action btn-red btn-launch-step2">
                    <i data-lucide="zap" style="width: 16px; height: 16px;"></i>
                    <span>Test Cascade Injection</span>
                  </button>
                </div>
              </div>

              <!-- Step 3 Card -->
              <div class="guide-master-card" data-step-id="3">
                <div class="master-card-header">
                  <div class="master-num-glow orange">03</div>
                  <div class="master-icon-box" style="color: #F97316; background: rgba(249, 115, 22, 0.12);">
                    <i data-lucide="flask-conical" style="width: 26px; height: 26px;"></i>
                  </div>
                </div>
                <h3 class="master-title">Run What-If Disaster & Budget Scenarios</h3>
                <p class="master-desc">
                  Select multiple concurrent service failure vectors, adjust disaster severity, configure <strong>Municipal Emergency Fund caps ($2M - $50M)</strong>, and benchmark recovery algorithms to measure real-time government repair spend and economic downtime savings.
                </p>
                <div class="master-shortcuts-row">
                  <span class="kbd-pill"><kbd>Govt Fund</kbd> $2M - $50M</span>
                  <span class="kbd-pill"><kbd>Bleed Rate</kbd> Live $/hr</span>
                  <span class="kbd-pill"><kbd>2× MTTR</kbd> Capital ROI</span>
                </div>
                <div class="master-action-row">
                  <button class="btn-step-action btn-orange btn-launch-step3">
                    <i data-lucide="play" style="width: 16px; height: 16px;"></i>
                    <span>Open What-If Sandbox</span>
                  </button>
                </div>
              </div>

              <!-- Step 4 Card -->
              <div class="guide-master-card" data-step-id="4">
                <div class="master-card-header">
                  <div class="master-num-glow magenta">04</div>
                  <div class="master-icon-box" style="color: #FF2E93; background: rgba(255, 46, 147, 0.12);">
                    <i data-lucide="network" style="width: 26px; height: 26px;"></i>
                  </div>
                </div>
                <h3 class="master-title">Inspect 2D DAG & Continuous Coupling</h3>
                <p class="master-desc">
                  Open the <strong>🌐 2D Network Graph</strong> view to analyze the mathematical Directed Acyclic Graph. Hover over nodes to highlight upstream suppliers, downstream dependents, and examine continuous coupling weights \(W_{u,v} \in [0.0, 1.0]\).
                </p>
                <div class="master-shortcuts-row">
                  <span class="kbd-pill"><kbd>Hover</kbd> Highlight Path</span>
                  <span class="kbd-pill"><kbd>Click Node</kbd> Isolate</span>
                  <span class="kbd-pill"><kbd>Coupling</kbd> Matrix</span>
                </div>
                <div class="master-action-row">
                  <button class="btn-step-action btn-magenta btn-launch-step4">
                    <i data-lucide="git-branch" style="width: 16px; height: 16px;"></i>
                    <span>Open 2D Network DAG</span>
                  </button>
                </div>
              </div>

              <!-- Step 5 Card -->
              <div class="guide-master-card" data-step-id="5">
                <div class="master-card-header">
                  <div class="master-num-glow green">05</div>
                  <div class="master-icon-box" style="color: #10B981; background: rgba(16, 185, 129, 0.12);">
                    <i data-lucide="bot" style="width: 26px; height: 26px;"></i>
                  </div>
                </div>
                <h3 class="master-title">Consult Aditya Prasad (AI Commander)</h3>
                <p class="master-desc">
                  Chat directly with Aditya Prasad, our witty and elite AI Incident Commander powered by Groq Llama-3. Query real-time city health telemetry, evaluate government repair budgets, generate emergency playbooks, or trigger live actions.
                </p>
                <div class="master-shortcuts-row">
                  <span class="kbd-pill"><kbd>Aditya Prasad</kbd> AI</span>
                  <span class="kbd-pill"><kbd>Govt Budget</kbd> RAG</span>
                  <span class="kbd-pill"><kbd>Live Action</kbd> Enabled</span>
                </div>
                <div class="master-action-row">
                  <button class="btn-step-action btn-green btn-launch-step5">
                    <i data-lucide="message-square" style="width: 16px; height: 16px;"></i>
                    <span>Chat with Aditya Prasad</span>
                  </button>
                </div>
              </div>

            </div>

            <!-- Right Column: Sticky Holographic Live Interactive Simulator Mockup -->
            <div class="guide-sticky-preview-col">
              <div class="guide-preview-terminal tilt-card" id="guide-preview-terminal">
                <div class="terminal-top-header">
                  <div class="term-window-dots">
                    <span class="term-dot red"></span>
                    <span class="term-dot yellow"></span>
                    <span class="term-dot green"></span>
                  </div>
                  <span class="term-title-text" id="guide-term-title">MISSION CONTROL • 3D ENGINE VIEWPORT</span>
                  <span class="term-live-badge">● TELEMETRY SYNCED</span>
                </div>

                <div class="terminal-screen-container" id="guide-screen-container">
                  <!-- Dynamic Screen 1: 3D City Viewport Preview -->
                  <div class="guide-screen active" data-screen="1">
                    <div class="screen-3d-hud">
                      <div class="hud-telemetry-header">
                        <div class="s3d-badge-row">
                          <span class="s3d-tag cyan">SYS: 3D DIGITAL TWIN</span>
                          <span class="s3d-tag green">60.0 FPS</span>
                          <span class="s3d-tag">TRI: 142.8K</span>
                        </div>
                        <span class="hud-sub-mono">AZIMUTH: 042.5° • ELEV: 31.0°</span>
                      </div>

                      <div class="s3d-mock-city">
                        <!-- Crosshair Reticle -->
                        <div class="reticle-center"></div>
                        <div class="reticle-line h-line"></div>
                        <div class="reticle-line v-line"></div>

                        <!-- 3D Vector Isometric Skyline -->
                        <div class="city-mock-grid">
                          <div class="building b1"><div class="b-roof"></div><div class="b-windows"></div></div>
                          <div class="building b2"><div class="b-roof helipad"></div><div class="b-windows"></div></div>
                          <div class="building b3"><div class="b-roof antenna"></div><div class="b-windows"></div></div>
                          <div class="building b4"><div class="b-roof"></div><div class="b-windows"></div></div>
                          <div class="building b5"><div class="b-roof"></div><div class="b-windows"></div></div>
                        </div>
                        <div class="city-mock-orbit-ring"></div>

                        <!-- Floating Target HUD -->
                        <div class="city-mock-hud-card">
                          <div class="cm-header"><span class="cm-pin-dot"></span><span>TARGET: PWR-01</span></div>
                          <span class="cm-stat green">STATUS: 100% NOMINAL (120 MW)</span>
                          <span class="cm-coords">COORDS: [X: 14.2, Y: 0.0, Z: -28.5]</span>
                        </div>
                      </div>

                      <div class="s3d-controls-bar">
                        <span class="s3d-label">LIGHTING ENVIRONMENT:</span>
                        <div class="s3d-theme-pills">
                          <span class="st-pill active">☀️ DAY</span>
                          <span class="st-pill">🌅 SUNSET</span>
                          <span class="st-pill">🌙 NIGHT</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Dynamic Screen 2: Cascade Failure Detonator Preview -->
                  <div class="guide-screen" data-screen="2">
                    <div class="screen-cascade-hud">
                      <div class="hud-telemetry-header">
                        <div class="sc-status-header">
                          <span class="sc-danger-tag red-pulse">● SCADA BUS CRISIS: INJECTION ACTIVE</span>
                          <span class="sc-res-gauge red">RESILIENCE: 32.4%</span>
                        </div>
                      </div>

                      <div class="sc-wave-visualizer">
                        <div class="sc-pulse-ring ring-1"></div>
                        <div class="sc-pulse-ring ring-2"></div>
                        <div class="sc-pulse-ring ring-3"></div>

                        <div class="sc-center-node red">
                          <div class="node-badge-top">PRIMARY ROOT DETONATION</div>
                          <div class="node-title-row">
                            <i data-lucide="zap-off" style="width: 20px; height: 20px;"></i>
                            <span>PWR-01 COLLAPSED</span>
                          </div>
                          <div class="node-meta-drop">OUTPUT: 0 MW (FREQ: 47.2 Hz)</div>
                        </div>
                      </div>

                      <div class="sc-downstream-choke">
                        <div class="sc-choke-item red">
                          <span class="ci-name">💧 WTR-01 Water Works</span>
                          <span class="ci-status">Pressure -90% (Stalled)</span>
                          <span class="ci-delay">T+04:30</span>
                        </div>
                        <div class="sc-choke-item red">
                          <span class="ci-name">📡 TEL-01 Telecom Hub</span>
                          <span class="ci-status">Aux Power Drained</span>
                          <span class="ci-delay">T+09:15</span>
                        </div>
                        <div class="sc-choke-item yellow">
                          <span class="ci-name">🚦 TRF-01 Traffic Grid</span>
                          <span class="ci-status">Fail-Safe Flashing Yellow</span>
                          <span class="ci-delay">T+12:00</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Dynamic Screen 3: What-If Sandbox Multi-Vector & Budget Matrix -->
                  <div class="guide-screen" data-screen="3">
                    <div class="screen-whatif-hud">
                      <div class="hud-telemetry-header">
                        <span class="sw-title">WHAT-IF DISASTER & BUDGET MATRIX</span>
                        <span class="sw-tag orange">DISASTER FUND: $15.0M</span>
                      </div>

                      <div class="sw-outage-toggles">
                        <div class="sw-toggle active"><span class="sw-check">✓</span> ⚡ PWR-01 ($4.2M)</div>
                        <div class="sw-toggle active"><span class="sw-check">✓</span> 💧 WTR-01 ($2.4M)</div>
                        <div class="sw-toggle"><span class="sw-check">☐</span> 📡 TEL-01 ($1.6M)</div>
                        <div class="sw-toggle"><span class="sw-check">☐</span> 🚇 TRN-01 ($3.6M)</div>
                      </div>

                      <!-- Budget & Bleed Telemetry Row -->
                      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px;background:rgba(0,0,0,0.3);border-radius:8px;margin-bottom:8px;">
                        <div>
                          <div style="font-size:0.62rem;color:var(--text-muted);font-family:var(--font-mono);">GOVT BUDGET NEEDED:</div>
                          <div style="font-family:var(--font-mono);font-size:0.88rem;font-weight:900;color:#F97316;">$6.60M (Repairs)</div>
                        </div>
                        <div>
                          <div style="font-size:0.62rem;color:var(--text-muted);font-family:var(--font-mono);">ECONOMIC BLEED:</div>
                          <div style="font-family:var(--font-mono);font-size:0.88rem;font-weight:900;color:#EF4444;">$1.37M / hr</div>
                        </div>
                      </div>

                      <div class="sw-strategy-comparison">
                        <div class="strat-row">
                          <span class="st-name">Manual Strategy (Critical First):</span>
                          <div class="st-bar-wrap"><div class="st-bar-fill manual" style="width: 85%;"></div></div>
                          <span class="st-time">60m · $1.37M Loss</span>
                        </div>
                        <div class="strat-row active">
                          <span class="st-name green">Automated Strategy (2× MTTR):</span>
                          <div class="st-bar-wrap"><div class="st-bar-fill auto" style="width: 40%;"></div></div>
                          <span class="st-time green">28m · Saves $730k</span>
                        </div>
                        <div class="strat-row">
                          <span class="st-name">Priority Strategy (Root First):</span>
                          <div class="st-bar-wrap"><div class="st-bar-fill priority" style="width: 60%;"></div></div>
                          <span class="st-time">42m · $960k Loss</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Dynamic Screen 4: 2D DAG Topology Graph & SCADA Matrix -->
                  <div class="guide-screen" data-screen="4">
                    <div class="screen-dag-hud">
                      <div class="hud-telemetry-header">
                        <div class="dag-header-left">
                          <span class="dag-title">DIRECTED ACYCLIC GRAPH (DAG)</span>
                          <span class="dag-sub">WEIGHTED DEPENDENCY TOPOLOGY</span>
                        </div>
                        <span class="dag-badge magenta">CONTINUOUS COUPLING [0.0 - 1.0]</span>
                      </div>

                      <!-- High-Density Vector SVG Directed Graph Diagram -->
                      <div class="dag-vector-stage">
                        <svg class="dag-svg" viewBox="0 0 460 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <!-- Background Grid -->
                          <defs>
                            <linearGradient id="edgeGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stop-color="#EF4444" />
                              <stop offset="100%" stop-color="#F97316" />
                            </linearGradient>
                            <linearGradient id="edgeGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stop-color="#F97316" />
                              <stop offset="100%" stop-color="#10B981" />
                            </linearGradient>
                            <linearGradient id="edgeGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stop-color="#EF4444" />
                              <stop offset="100%" stop-color="#00D2FF" />
                            </linearGradient>
                          </defs>

                          <!-- Spline Curves -->
                          <!-- PWR to WTR -->
                          <path d="M 95 80 C 150 80, 160 45, 220 45" stroke="url(#edgeGrad1)" stroke-width="2.5" stroke-dasharray="6 4" class="svg-flow-path" />
                          <!-- WTR to HOS -->
                          <path d="M 300 45 C 340 45, 345 80, 375 80" stroke="url(#edgeGrad2)" stroke-width="2.5" stroke-dasharray="6 4" class="svg-flow-path" />
                          <!-- PWR to TEL -->
                          <path d="M 95 80 C 150 80, 160 115, 220 115" stroke="url(#edgeGrad3)" stroke-width="2.5" stroke-dasharray="6 4" class="svg-flow-path" />
                          <!-- TEL to HOS -->
                          <path d="M 300 115 C 340 115, 345 80, 375 80" stroke="#00D2FF" stroke-width="2" stroke-dasharray="4 4" class="svg-flow-path" />

                          <!-- Edge Coupling Weight Pills -->
                          <g transform="translate(142, 50)">
                            <rect width="36" height="18" rx="4" fill="#0B1120" stroke="rgba(249,115,22,0.6)" stroke-width="1"/>
                            <text x="18" y="13" fill="#F97316" font-size="10" font-family="monospace" font-weight="bold" text-anchor="middle">0.92</text>
                          </g>
                          <g transform="translate(325, 50)">
                            <rect width="36" height="18" rx="4" fill="#0B1120" stroke="rgba(16,185,129,0.6)" stroke-width="1"/>
                            <text x="18" y="13" fill="#10B981" font-size="10" font-family="monospace" font-weight="bold" text-anchor="middle">0.88</text>
                          </g>
                          <g transform="translate(142, 98)">
                            <rect width="36" height="18" rx="4" fill="#0B1120" stroke="rgba(0,210,255,0.6)" stroke-width="1"/>
                            <text x="18" y="13" fill="#00D2FF" font-size="10" font-family="monospace" font-weight="bold" text-anchor="middle">0.86</text>
                          </g>

                          <!-- Node 1: PWR-01 -->
                          <g transform="translate(20, 52)">
                            <rect width="78" height="56" rx="8" fill="#180C14" stroke="#EF4444" stroke-width="2"/>
                            <circle cx="16" cy="18" r="4" fill="#EF4444" />
                            <text x="26" y="22" fill="#FFFFFF" font-size="11" font-family="sans-serif" font-weight="bold">PWR-01</text>
                            <text x="12" y="38" fill="#EF4444" font-size="9" font-family="monospace" font-weight="bold">ROOT SOURCE</text>
                            <text x="12" y="48" fill="#94A3B8" font-size="8" font-family="monospace">OUT-DEG: 4</text>
                          </g>

                          <!-- Node 2: WTR-01 -->
                          <g transform="translate(222, 18)">
                            <rect width="78" height="54" rx="8" fill="#18130C" stroke="#F97316" stroke-width="2"/>
                            <circle cx="16" cy="18" r="4" fill="#F97316" />
                            <text x="26" y="22" fill="#FFFFFF" font-size="11" font-family="sans-serif" font-weight="bold">WTR-01</text>
                            <text x="12" y="36" fill="#F97316" font-size="9" font-family="monospace" font-weight="bold">LEVEL 1 DEP</text>
                            <text x="12" y="46" fill="#94A3B8" font-size="8" font-family="monospace">IN: 1 | OUT: 2</text>
                          </g>

                          <!-- Node 3: TEL-01 -->
                          <g transform="translate(222, 88)">
                            <rect width="78" height="54" rx="8" fill="#0C151F" stroke="#00D2FF" stroke-width="2"/>
                            <circle cx="16" cy="18" r="4" fill="#00D2FF" />
                            <text x="26" y="22" fill="#FFFFFF" font-size="11" font-family="sans-serif" font-weight="bold">TEL-01</text>
                            <text x="12" y="36" fill="#00D2FF" font-size="9" font-family="monospace" font-weight="bold">LEVEL 1 DEP</text>
                            <text x="12" y="46" fill="#94A3B8" font-size="8" font-family="monospace">IN: 1 | OUT: 3</text>
                          </g>

                          <!-- Node 4: HOS-01 -->
                          <g transform="translate(372, 52)">
                            <rect width="78" height="56" rx="8" fill="#0C1B14" stroke="#10B981" stroke-width="2"/>
                            <circle cx="16" cy="18" r="4" fill="#10B981" />
                            <text x="26" y="22" fill="#FFFFFF" font-size="11" font-family="sans-serif" font-weight="bold">HOS-01</text>
                            <text x="12" y="38" fill="#10B981" font-size="9" font-family="monospace" font-weight="bold">LEVEL 2 CRIT</text>
                            <text x="12" y="48" fill="#94A3B8" font-size="8" font-family="monospace">PROTECTED</text>
                          </g>
                        </svg>
                      </div>

                      <!-- High-Density Adjacency Matrix Heatmap Table -->
                      <div class="dag-matrix-card">
                        <div class="dm-header">ADJACENCY MATRIX COUPLING WEIGHTS \(W_{u,v}\)</div>
                        <table class="dm-table">
                          <thead>
                            <tr>
                              <th>SRC \ TGT</th>
                              <th>PWR-01</th>
                              <th>WTR-01</th>
                              <th>TEL-01</th>
                              <th>TRF-01</th>
                              <th>HOS-01</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td class="dm-row-label">PWR-01</td>
                              <td class="dm-self">—</td>
                              <td class="dm-val red">0.92</td>
                              <td class="dm-val cyan">0.86</td>
                              <td class="dm-val orange">0.82</td>
                              <td class="dm-val green">0.75</td>
                            </tr>
                            <tr>
                              <td class="dm-row-label">WTR-01</td>
                              <td class="dm-none">—</td>
                              <td class="dm-self">—</td>
                              <td class="dm-none">—</td>
                              <td class="dm-none">—</td>
                              <td class="dm-val green">0.88</td>
                            </tr>
                            <tr>
                              <td class="dm-row-label">TEL-01</td>
                              <td class="dm-none">—</td>
                              <td class="dm-none">—</td>
                              <td class="dm-self">—</td>
                              <td class="dm-val cyan">0.74</td>
                              <td class="dm-val green">0.65</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div class="dag-stats-row">
                        <span>CRITICAL PATH: <strong>PWR-01 ➔ WTR-01 ➔ HOS-01</strong></span>
                        <span class="green">SPECTRAL RADIUS: λ = 2.41 (STABLE)</span>
                      </div>
                    </div>
                  </div>

                  <!-- Dynamic Screen 5: AI Incident Commander Console -->
                  <div class="guide-screen" data-screen="5">
                    <div class="screen-ai-hud">
                      <div class="hud-telemetry-header">
                        <div class="ai-chat-header">
                          <div class="ai-bot-avatar"><i data-lucide="bot" style="width: 16px; height: 16px;"></i></div>
                          <div>
                            <div class="ai-name">ADITYA PRASAD • AI COMMANDER</div>
                            <div class="ai-status">● Real-Time Telemetry RAG Linked</div>
                          </div>
                        </div>
                        <span class="ai-latency-pill">⚡ 18ms INFERENCE</span>
                      </div>

                      <div class="ai-chat-bubbles">
                        <div class="ai-msg user">"Aditya, PWR-01 and WTR-01 have failed. What is the emergency recovery plan?"</div>
                        <div class="ai-msg bot">
                          <div class="bot-header">🚨 ADITYA'S EMERGENCY PLAYBOOK #842</div>
                          <div class="bot-steps">
                            <div class="b-step"><span class="step-badge red">ACTION 1</span> Cut over St. Jude Hospital to Auxiliary Diesel Gen (48h fuel).</div>
                            <div class="b-step"><span class="step-badge orange">ACTION 2</span> Isolate SCADA circuit breaker #4 to quarantine WTR-01 intake line.</div>
                            <div class="b-step"><span class="step-badge green">ACTION 3</span> Execute Automated MTTR algorithm to restore grid in 28 mins.</div>
                          </div>
                          <div class="bot-footer">CONFIDENCE: 98.4% • COMPUTED IN 18ms VIA GROQ API</div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- =========================================================================
             6. PINNED SECTION 1: INTERACTIVE CASCADE SCRUBBER (Scroll to Interact)
             ========================================================================= -->
        <section class="landing-section pinned-cascade-section" id="section-pinned-cascade">
          <div class="section-badge-header" style="margin-bottom: 24px;">
            <span class="section-eyebrow">Scroll to Interact & Scrub</span>
            <h2 class="section-title">Anatomy of a Cascading Urban Crisis</h2>
            <p class="section-subtitle">
              Scroll down slowly to watch the pinned command terminal react in real time as each failure phase propagates.
            </p>
          </div>

          <div class="pinned-cascade-wrapper" id="pinned-cascade-wrapper">
            <!-- Left Side: Sticky Live Interactive Terminal HUD -->
            <div class="pinned-hud-sticky">
              <div class="pinned-hud-card" id="pinned-hud-terminal">
                <div class="hud-top-bar">
                  <div class="hud-window-controls">
                    <span class="hud-dot red"></span>
                    <span class="hud-dot yellow"></span>
                    <span class="hud-dot green"></span>
                  </div>
                  <span class="hud-title-badge">CASCADYN SCADA TELEMETRY MONITOR</span>
                  <span class="hud-status-live" id="hud-live-tag">● LIVE LINK</span>
                </div>

                <!-- HUD Resilience Dial & Telemetry -->
                <div class="hud-body">
                  <div class="hud-resilience-box">
                    <div class="hud-dial-wrap">
                      <div class="hud-dial-num" id="hud-resilience-num">100%</div>
                      <div class="hud-dial-sub">Global Resilience</div>
                    </div>
                    <div class="hud-phase-indicator">
                      <span class="hud-phase-label">Active State</span>
                      <span class="hud-phase-val" id="hud-phase-val">Phase 0: Normal Ops</span>
                    </div>
                  </div>

                  <!-- Live Grid Node Mesh Indicators -->
                  <div class="hud-nodes-grid">
                    <div class="hud-node-pill" id="h-node-pwr"><span class="h-dot"></span>⚡ PWR-01</div>
                    <div class="hud-node-pill" id="h-node-wtr"><span class="h-dot"></span>💧 WTR-01</div>
                    <div class="hud-node-pill" id="h-node-tel"><span class="h-dot"></span>📡 TEL-01</div>
                    <div class="hud-node-pill" id="h-node-trf"><span class="h-dot"></span>🚦 TRF-01</div>
                    <div class="hud-node-pill" id="h-node-trn"><span class="h-dot"></span>🚇 TRN-01</div>
                    <div class="hud-node-pill" id="h-node-hos"><span class="h-dot"></span>🏥 HOS-01</div>
                  </div>

                  <!-- Live Log Feed -->
                  <div class="hud-log-stream" id="hud-log-stream">
                    <div class="hud-log-entry info">[SYSTEM] Grid topology synchronized. All 10 telemetry streams nominal.</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Side: 4 Scrolling Failure Phase Cards -->
            <div class="pinned-phases-scroll">
              <!-- Phase 1 -->
              <div class="cascade-phase-card" data-phase="1">
                <div class="phase-badge">Phase 01 • T+00:00</div>
                <h3 class="phase-heading">⚡ Initial Root Failure: Primary Substation Trips</h3>
                <p class="phase-text">
                  A high-voltage transformer arc flash knocks out Central Substation PWR-01. Output drops to 0 MW. High-priority alarms broadcast across the municipal SCADA bus.
                </p>
                <div class="phase-impact-stats">
                  <span class="p-stat red">Direct Damage: 100%</span>
                  <span class="p-stat">Resilience: 78%</span>
                </div>
              </div>

              <!-- Phase 2 -->
              <div class="cascade-phase-card" data-phase="2">
                <div class="phase-badge">Phase 02 • T+04:30</div>
                <h3 class="phase-heading">💧 Downstream Coupling: Water Works Pumps Stall</h3>
                <p class="phase-text">
                  Water Purification Plant WTR-01 relies on PWR-01 with a continuous strength coefficient of 0.88. Main high-pressure distribution pumps shut down, dropping municipal water pressure.
                </p>
                <div class="phase-impact-stats">
                  <span class="p-stat red">Cascade Depth: Level 1</span>
                  <span class="p-stat">Resilience: 55%</span>
                </div>
              </div>

              <!-- Phase 3 -->
              <div class="cascade-phase-card" data-phase="3">
                <div class="phase-badge">Phase 03 • T+09:15</div>
                <h3 class="phase-heading">🚦 Systemic Congestion: Traffic & Transit Choke</h3>
                <p class="phase-text">
                  Auxiliary batteries drain at 5G Telecom Hub TEL-01. Traffic signals along major avenues drop into fail-safe flashing yellow, causing city-wide emergency vehicle gridlock.
                </p>
                <div class="phase-impact-stats">
                  <span class="p-stat red">Cascade Depth: Level 2</span>
                  <span class="p-stat">Resilience: 32%</span>
                </div>
              </div>

              <!-- Phase 4 -->
              <div class="cascade-phase-card" data-phase="4">
                <div class="phase-badge">Phase 04 • T+14:00</div>
                <h3 class="phase-heading">🚨 Critical Threshold & Automated Islanding</h3>
                <p class="phase-text">
                  Hospital HOS-01 cuts over to emergency diesel generators. Automated islanding algorithms quarantine failed distribution lines and initiate prioritized root node recovery.
                </p>
                <div class="phase-impact-stats">
                  <span class="p-stat green">Automated Recovery Engaged</span>
                  <span class="p-stat">Resilience Stabilized</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- =========================================================================
             7. PINNED SPLIT DIGITAL TWIN: STEADY STATE VS DISASTER COMPARISON
             ========================================================================= -->
        <section class="landing-section split-comparison-section" id="section-split-comparison">
          <div class="section-badge-header">
            <span class="section-eyebrow">Digital Twin Dynamics</span>
            <h2 class="section-title">Steady State vs Cascade Collapse</h2>
            <p class="section-subtitle">
              Compare baseline city operations against peak cascading failure dynamics.
            </p>
          </div>

          <div class="split-comparison-grid">
            <!-- Normal State Card -->
            <div class="split-side-card normal-side tilt-card">
              <div class="split-side-badge green">
                <span>● 100% Operational Steady State</span>
              </div>
              <h3 class="split-title">Optimal Metropolis Health</h3>
              <p class="split-desc">
                All 10 services operate in balanced harmony. Low telemetry jitter (&lt; 5ms), continuous water delivery at 85 PSI, synchronized traffic wave timing, and 100% emergency response capacity.
              </p>
              <div class="split-metrics-matrix">
                <div class="s-metric"><span class="sm-label">Resilience:</span><span class="sm-val green">100%</span></div>
                <div class="s-metric"><span class="sm-label">SCADA Bus Latency:</span><span class="sm-val">4.2ms</span></div>
                <div class="s-metric"><span class="sm-label">Emergency Readiness:</span><span class="sm-val green">100%</span></div>
                <div class="s-metric"><span class="sm-label">Active Outages:</span><span class="sm-val">0 Nodes</span></div>
              </div>
            </div>

            <!-- Cascade Crisis Card -->
            <div class="split-side-card crisis-side tilt-card">
              <div class="split-side-badge red">
                <span>● Catastrophic Cascade State</span>
              </div>
              <h3 class="split-title">Systemic Multi-Node Blackout</h3>
              <p class="split-desc">
                Primary node collapse cascades into water starvation, communications blackout, transit stalling, and medical emergency reliance on fuel generators.
              </p>
              <div class="split-metrics-matrix">
                <div class="s-metric"><span class="sm-label">Resilience:</span><span class="sm-val red">32%</span></div>
                <div class="s-metric"><span class="sm-label">SCADA Bus Latency:</span><span class="sm-val red">380ms</span></div>
                <div class="s-metric"><span class="sm-label">Emergency Readiness:</span><span class="sm-val red">Critical (40%)</span></div>
                <div class="s-metric"><span class="sm-label">Active Outages:</span><span class="sm-val red">6 Nodes (Failed)</span></div>
              </div>
            </div>
          </div>
        </section>

        <!-- =========================================================================
             8. ENTERPRISE CAPABILITIES INTERACTIVE CAROUSEL DECK
             ========================================================================= -->
        <section class="landing-section horizontal-track-section" id="section-horizontal">
          <div class="capabilities-header-row">
            <div class="capabilities-title-left">
              <span class="section-eyebrow">Enterprise Capabilities</span>
              <h2 class="section-title">Engineered for Critical Urban Missions</h2>
              <p class="section-subtitle">
                Explore our core simulation primitives engineered for municipal resilience, real-time BFS graphs, and AI incident dispatch.
              </p>
            </div>

            <!-- Interactive Carousel Navigation Controls -->
            <div class="track-nav-controls">
              <div class="track-dots-wrap" id="track-dots-wrap">
                <span class="track-dot active" data-index="0"></span>
                <span class="track-dot" data-index="1"></span>
                <span class="track-dot" data-index="2"></span>
                <span class="track-dot" data-index="3"></span>
                <span class="track-dot" data-index="4"></span>
              </div>
              <div class="track-arrow-btns">
                <button id="track-btn-prev" class="btn-track-arrow" title="Previous capability">
                  <i data-lucide="chevron-left" style="width: 18px; height: 18px;"></i>
                </button>
                <button id="track-btn-next" class="btn-track-arrow" title="Next capability">
                  <i data-lucide="chevron-right" style="width: 18px; height: 18px;"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="horizontal-track-container" id="horizontal-track-container">
            <div class="horizontal-track-inner" id="horizontal-track-inner">
              <!-- Panel 1 -->
              <div class="horizontal-panel tilt-card" data-card-idx="0">
                <div class="panel-icon-wrap" style="color: #FF2E93; background: rgba(255, 46, 147, 0.12);">
                  <i data-lucide="box" style="width: 32px; height: 32px;"></i>
                </div>
                <span class="panel-tag">01 • Real-Time 3D Engine</span>
                <h3 class="panel-title">WebGL Digital Twin with Three.js</h3>
                <p class="panel-desc">
                  Ultra-smooth 60fps rendering with procedural skyscrapers, glowing emissive window maps, animated vehicular traffic, and elevated maglev transit loops.
                </p>
                <div class="panel-bullets">
                  <span>✓ 360° Free OrbitControls</span>
                  <span>✓ Day / Sunset / Cyberpunk Night</span>
                  <span>✓ Dynamic Raycasting & Hover Cards</span>
                </div>
              </div>

              <!-- Panel 2 -->
              <div class="horizontal-panel tilt-card" data-card-idx="1">
                <div class="panel-icon-wrap" style="color: #F97316; background: rgba(249, 115, 22, 0.12);">
                  <i data-lucide="git-branch" style="width: 32px; height: 32px;"></i>
                </div>
                <span class="panel-tag">02 • Graph Intelligence</span>
                <h3 class="panel-title">Deterministic BFS Propagation</h3>
                <p class="panel-desc">
                  Mathematically modeled cascade propagation evaluated across continuous edge weights [0.0 - 1.0] with realistic delay equations.
                </p>
                <div class="panel-bullets">
                  <span>✓ Breadth-First Search DAG Analysis</span>
                  <span>✓ Zero-Jitter Deterministic Replay</span>
                  <span>✓ Continuous Coupling Strengths</span>
                </div>
              </div>

              <!-- Panel 3 -->
              <div class="horizontal-panel tilt-card" data-card-idx="2">
                <div class="panel-icon-wrap" style="color: #00D2FF; background: rgba(0, 210, 255, 0.12);">
                  <i data-lucide="bot" style="width: 32px; height: 32px;"></i>
                </div>
                <span class="panel-tag">03 • AI Urban Dispatcher</span>
                <h3 class="panel-title">Groq Llama-3 AI Assistant</h3>
                <p class="panel-desc">
                  Integrated high-speed AI agent with direct live access to city health telemetry, offering instant mitigation playbooks and disaster post-mortems.
                </p>
                <div class="panel-bullets">
                  <span>✓ Sub-Second Groq LLM Inference</span>
                  <span>✓ Real-Time Graph Telemetry RAG</span>
                  <span>✓ Custom Disaster Playbook Generation</span>
                </div>
              </div>

              <!-- Panel 4 -->
              <div class="horizontal-panel tilt-card" data-card-idx="3">
                <div class="panel-icon-wrap" style="color: #10B981; background: rgba(16, 185, 129, 0.12);">
                  <i data-lucide="activity" style="width: 32px; height: 32px;"></i>
                </div>
                <span class="panel-tag">04 • Resilience Optimization</span>
                <h3 class="panel-title">Multi-Algorithmic Recovery</h3>
                <p class="panel-desc">
                  Test and benchmark 3 distinct restoration strategies: Manual Critical-First, Automated Shortest-MTTR (2× speed), or Root-Source Priority.
                </p>
                <div class="panel-bullets">
                  <span>✓ MTTR Repair Time Optimization</span>
                  <span>✓ In-Degree Root Node Prioritization</span>
                  <span>✓ Comparative Resilience Curves</span>
                </div>
              </div>

              <!-- Panel 5 -->
              <div class="horizontal-panel tilt-card" data-card-idx="4">
                <div class="panel-icon-wrap" style="color: #A78BFA; background: rgba(167, 139, 250, 0.12);">
                  <i data-lucide="database" style="width: 32px; height: 32px;"></i>
                </div>
                <span class="panel-tag">05 • Interoperability</span>
                <h3 class="panel-title">Municipal SCADA & GIS Data</h3>
                <p class="panel-desc">
                  Seamlessly import real-world municipal infrastructure graphs or upload custom CSV/JSON schemas to stress-test real cities.
                </p>
                <div class="panel-bullets">
                  <span>✓ Synthetic Metropolis 2030 Preset</span>
                  <span>✓ Chicago Real-World Infrastructure</span>
                  <span>✓ Custom CSV & JSON Uploads</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- =========================================================================
             9. REAL-WORLD DISASTER CASE STUDIES & HISTORICAL REPLAYS
             ========================================================================= -->
        <section class="landing-section" id="section-case-studies">
          <div class="section-badge-header">
            <span class="section-eyebrow">Real-World Case Studies</span>
            <h2 class="section-title">Historical Municipal Cascade Replays</h2>
            <p class="section-subtitle">
              Learn how real-world infrastructure catastrophes unfolded and how CASCADYN models their prevention.
            </p>
          </div>

          <div class="case-studies-grid">
            <!-- Case Study 1 -->
            <div class="case-study-card tilt-card">
              <div class="case-year-tag">AUGUST 2003 • NORTHEAST USA</div>
              <h3 class="case-title">The 50-Million Citizen Great Blackout</h3>
              <p class="case-desc">
                High-voltage transmission line sag into overgrown trees triggered a software race condition alarm failure. Within 60 minutes, 261 power plants tripped offline across Ohio, New York, and Ontario.
              </p>
              <div class="case-meta-row">
                <span class="c-meta red">Loss: $6 Billion USD</span>
                <span class="c-meta">Cascade Depth: Level 4</span>
              </div>
            </div>

            <!-- Case Study 2 -->
            <div class="case-study-card tilt-card">
              <div class="case-year-tag">FEBRUARY 2021 • TEXAS ERCOT</div>
              <h3 class="case-title">Winter Storm Uri Grid & Water Freezethaw</h3>
              <p class="case-desc">
                Unwinterized wellheads froze natural gas delivery. Over 4.5 million homes lost electricity, leading to massive municipal water pressure drops and boiled-water notices for 14 million people.
              </p>
              <div class="case-meta-row">
                <span class="c-meta red">Loss: $195 Billion USD</span>
                <span class="c-meta">Coupling: Gas ➔ Water</span>
              </div>
            </div>

            <!-- Case Study 3 -->
            <div class="case-study-card tilt-card">
              <div class="case-year-tag">JULY 2024 • GLOBAL SCADA / CAD</div>
              <h3 class="case-title">The Channel File 291 Kernel Blackout</h3>
              <p class="case-desc">
                A null-pointer driver fault disabled 8.5 million enterprise endpoints worldwide. Airline ground-stops and hospital surgery delays revealed extreme single-vendor digital coupling risks.
              </p>
              <div class="case-meta-row">
                <span class="c-meta orange">Impact: 8.5M Endpoints</span>
                <span class="c-meta">Recovery: Manual Safe-Mode</span>
              </div>
            </div>
          </div>
        </section>

        <!-- =========================================================================
             10. CORE INFRASTRUCTURE MATRIX (INTERACTIVE SERVICE FLASHCARDS)
             ========================================================================= -->
        <section class="landing-section" id="section-services">
          <div class="section-badge-header">
            <span class="section-eyebrow">Critical Urban Mesh</span>
            <h2 class="section-title">Core Infrastructure Services</h2>
            <p class="section-subtitle">
              Explore the 10 interconnected service nodes. Click any card to launch the 3D City directly locked onto that landmark.
            </p>
          </div>

          <div class="services-flash-grid">
            ${services.map(service => this.createFlashCardHTML(service)).join('')}
          </div>
        </section>

        <!-- =========================================================================
             11. MATHEMATICAL & ALGORITHMIC FOUNDATION
             ========================================================================= -->
        <section class="landing-section" id="section-architecture">
          <div class="section-badge-header">
            <span class="section-eyebrow">Scientific Rigor</span>
            <h2 class="section-title">Algorithmic & Mathematical Architecture</h2>
            <p class="section-subtitle">
              Engineered using directed weighted graph theory, probabilistic failure propagation thresholds, and MTTR queue optimizations.
            </p>
          </div>

          <div class="algo-grid">
            <div class="algo-card tilt-card">
              <div class="algo-icon"><i data-lucide="binary" style="width: 24px; height: 24px;"></i></div>
              <h4>1. Directed Weighted Graph G = (V, E, W)</h4>
              <p>
                Each service node \(v \in V\) maintains coordinates, criticality, latency, and MTTR constants. Directed edges \((u, v) \in E\) possess coupling strengths \(w_{u,v} \in [0.0, 1.0]\).
              </p>
              <div class="math-box">
                <code>Propagation Severity: S_v = S_u \times W_{u,v} \ge 0.45</code>
              </div>
            </div>

            <div class="algo-card tilt-card">
              <div class="algo-icon"><i data-lucide="timer" style="width: 24px; height: 24px;"></i></div>
              <h4>2. Cascading Delay Propagation Formulation</h4>
              <p>
                Failure wave delays scale proportionally with graph depth and inversely with coupling strength, modeling real-world buffer delays and emergency generators.
              </p>
              <div class="math-box">
                <code>Delay(mins) = \max(2, (Depth+1) \times 3 + (1 - W_{u,v}) \times 5)</code>
              </div>
            </div>

            <div class="algo-card tilt-card">
              <div class="algo-icon"><i data-lucide="shield-check" style="width: 24px; height: 24px;"></i></div>
              <h4>3. Resilience Scoring & Dynamic Recovery</h4>
              <p>
                The global city resilience index dynamically weights operational nodes against their critical severity coefficients:
              </p>
              <div class="math-box">
                <code>R_{city} = \frac{\sum_{v \in V_{operational}} C_v \times (1 - S_v)}{\sum_{v \in V} C_v} \times 100\%</code>
              </div>
            </div>
          </div>
        </section>

        <!-- =========================================================================
             12. FREQUENTLY ASKED QUESTIONS (ACCORDION)
             ========================================================================= -->
        <section class="landing-section" id="section-faq">
          <div class="section-badge-header">
            <span class="section-eyebrow">Knowledge Base</span>
            <h2 class="section-title">Frequently Asked Questions</h2>
            <p class="section-subtitle">
              Everything you need to know about the simulation engine, datasets, and API integrations.
            </p>
          </div>

          <div class="faq-accordion-list">
            <div class="faq-item">
              <button class="faq-question">
                <span>How does CASCADYN compute cascading infrastructure failures?</span>
                <i data-lucide="chevron-down" class="faq-chevron"></i>
              </button>
              <div class="faq-answer">
                <p>
                  CASCADYN uses a modified Breadth-First Search (BFS) graph propagation algorithm. When an infrastructure service fails, downstream connected edges are evaluated against their continuous coupling strength and threshold weights. If the transmitted failure severity exceeds the tolerance threshold (0.45), downstream nodes collapse with realistic time delays.
                </p>
              </div>
            </div>

            <div class="faq-item">
              <button class="faq-question">
                <span>Can I import real-world municipal GIS or SCADA datasets?</span>
                <i data-lucide="chevron-down" class="faq-chevron"></i>
              </button>
              <div class="faq-answer">
                <p>
                  Yes! Click the <strong>Datasets</strong> button in the top navigation bar to switch between the Synthetic Metropolis 2030 preset, the real-world Chicago Urban Infrastructure dataset, or upload your own custom JSON/CSV graph dataset.
                </p>
              </div>
            </div>

            <div class="faq-item">
              <button class="faq-question">
                <span>What are the 3 recovery strategies in the What-If Sandbox?</span>
                <i data-lucide="chevron-down" class="faq-chevron"></i>
              </button>
              <div class="faq-answer">
                <p>
                  <strong>1. Manual (Critical First):</strong> Restores services based on criticality tier (Critical ➔ High ➔ Medium ➔ Low).<br />
                  <strong>2. Automated (Fastest MTTR):</strong> Restores nodes with the shortest repair times first, doubling recovery speed.<br />
                  <strong>3. Priority (Upstream Source First):</strong> Restores root upstream suppliers (like Power & Water) so downstream dependents recover naturally.
                </p>
              </div>
            </div>

            <div class="faq-item">
              <button class="faq-question">
                <span>How does the AI Assistant connect to the simulation?</span>
                <i data-lucide="chevron-down" class="faq-chevron"></i>
              </button>
              <div class="faq-answer">
                <p>
                  The AI Assistant connects to the Groq API (using ultra-fast Llama-3 models). It has full real-time access to the live graph state, active failure counts, and resilience telemetry to generate instant tactical mitigation playbooks.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- =========================================================================
             13. FOOTER CALL-TO-ACTION & SYSTEM STATUS
             ========================================================================= -->
        <footer class="landing-footer">
          <div class="footer-cta-card">
            <div class="footer-glow-ring"></div>
            <h2 class="footer-cta-title">Ready to Test Urban Resilience?</h2>
            <p class="footer-cta-desc">
              Launch the full 3D Smart City Engine now and run high-fidelity cascade simulations in real-time.
            </p>
            <div style="display: flex; justify-content: center; gap: 16px; margin-top: 28px;">
              <button id="btn-footer-launch" class="btn btn-primary btn-hero-primary pulse-glow-btn">
                <i data-lucide="rocket" style="width: 22px; height: 22px;"></i>
                <span>Launch Simulation Engine</span>
              </button>
            </div>
          </div>

          <div class="footer-bottom-bar">
            <div class="footer-brand">
              <div class="nav-logo-badge">C</div>
              <span>CASCADYN © 2026 – Urban Infrastructure Cascade Simulator</span>
            </div>
            <div class="footer-shortcuts-hint">
              <span>Tip: Press <kbd>?</kbd> in 3D City for Keyboard Shortcuts</span>
            </div>
          </div>
        </footer>

      </div>
    `;

    this.container.appendChild(this.element);

    this.scrollProgressEl = this.element.querySelector('#landing-progress-bar');

    // Initialize Smooth Inertia Scrolling with Lenis & GSAP ScrollTriggers
    this.initLenisAndGSAP();

    // Render initial scenario in playground
    this.renderScenario('power');

    // Bind Event Listeners, Dynamic Cursor, Reactor Console & 3D Tilt
    this.bindEvents();
    this.initCursorSpotlight();
    this.initReactorConsole();
    this.initCardTilt();
    this.initTopologicalCanvas();

    if (window.lucide) window.lucide.createIcons();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LIVE 2D TOPOLOGICAL CANVAS PROPAGATION ENGINE
  // ─────────────────────────────────────────────────────────────────────────

  initTopologicalCanvas() {
    const canvas = this.element.querySelector('#topo-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;

    const setupDimensions = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = 360 * dpr;
      ctx.scale(dpr, dpr);
      this.canvasWidth = rect.width;
      this.canvasHeight = 360;
    };
    setupDimensions();

    // Build the 8 interconnected service nodes layout
    const w = this.canvasWidth;
    const h = this.canvasHeight;

    this.topoNodes = [
      { id: 'PWR', name: '⚡ Power PWR-01', x: w * 0.16, y: h * 0.35, status: 'failed', impact: 100, downstream: 5, radius: 18, color: '#EF4444' },
      { id: 'WTR', name: '💧 Water WTR-01', x: w * 0.44, y: h * 0.22, status: 'failed', impact: 88, downstream: 3, radius: 17, color: '#F97316' },
      { id: 'TEL', name: '📡 Telecom TEL-01', x: w * 0.78, y: h * 0.28, status: 'failed', impact: 80, downstream: 4, radius: 17, color: '#F59E0B' },
      { id: 'TRF', name: '🚦 Traffic TRF-01', x: w * 0.28, y: h * 0.75, status: 'failed', impact: 75, downstream: 2, radius: 16, color: '#EF4444' },
      { id: 'TRN', name: '🚇 Transit TRN-01', x: w * 0.58, y: h * 0.78, status: 'failed', impact: 70, downstream: 1, radius: 16, color: '#EF4444' },
      { id: 'HOS', name: '🏥 Hospital HOS-01', x: w * 0.88, y: h * 0.72, status: 'operational', impact: 100, downstream: 0, radius: 18, color: '#10B981' }
    ];

    this.topoEdges = [
      { from: 0, to: 1, strength: 0.92, active: true },
      { from: 0, to: 2, strength: 0.86, active: true },
      { from: 0, to: 3, strength: 0.82, active: true },
      { from: 0, to: 4, strength: 0.78, active: true },
      { from: 1, to: 5, strength: 0.88, active: true },
      { from: 2, to: 3, strength: 0.74, active: true },
      { from: 2, to: 5, strength: 0.65, active: true }
    ];

    this.topoParticles = [];
    for (let i = 0; i < 28; i++) {
      this.topoParticles.push({
        edgeIdx: Math.floor(Math.random() * this.topoEdges.length),
        t: Math.random(),
        speed: 0.006 + Math.random() * 0.01
      });
    }

    this.shockwaves = [];

    // Trigger initial shockwave on load
    this.addShockwave(this.topoNodes[0].x, this.topoNodes[0].y, '#EF4444');

    // Bind Canvas Interactions (Click & Hover)
    this.bindCanvasInteractions(canvas);

    // Bind Topo Controls
    this.bindTopoControls();

    const renderLoop = () => {
      ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

      // 1. Draw Grid Background Mesh
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 30;
      for (let x = 0; x < this.canvasWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.canvasHeight);
        ctx.stroke();
      }
      for (let y = 0; y < this.canvasHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.canvasWidth, y);
        ctx.stroke();
      }

      // 2. Draw Edges with glowing bezier splines
      this.topoEdges.forEach(e => {
        const n1 = this.topoNodes[e.from];
        const n2 = this.topoNodes[e.to];
        if (!n1 || !n2) return;

        const isFailedEdge = n1.status === 'failed' && n2.status === 'failed';

        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.strokeStyle = isFailedEdge ? 'rgba(239, 68, 68, 0.5)' : 'rgba(0, 210, 255, 0.35)';
        ctx.lineWidth = isFailedEdge ? 2.5 : 1.5;
        if (isFailedEdge) {
          ctx.shadowColor = '#EF4444';
          ctx.shadowBlur = 6;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Weight tag
        const midX = (n1.x + n2.x) / 2;
        const midY = (n1.y + n2.y) / 2;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(midX - 14, midY - 8, 28, 16);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeRect(midX - 14, midY - 8, 28, 16);
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#94A3B8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${e.strength.toFixed(2)}`, midX, midY);
      });

      // 3. Draw Moving Telemetry / Failure Particles
      this.topoParticles.forEach(p => {
        p.t += p.speed * this.simSpeed;
        if (p.t > 1) p.t = 0;

        const e = this.topoEdges[p.edgeIdx];
        if (!e) return;
        const n1 = this.topoNodes[e.from];
        const n2 = this.topoNodes[e.to];
        if (!n1 || !n2) return;

        const px = n1.x + (n2.x - n1.x) * p.t;
        const py = n1.y + (n2.y - n1.y) * p.t;
        const isRed = n1.status === 'failed';

        ctx.beginPath();
        ctx.arc(px, py, isRed ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isRed ? '#FF4D6D' : '#38BDF8';
        ctx.shadowColor = isRed ? '#FF4D6D' : '#38BDF8';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 4. Draw Animated Shockwaves
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.r += 2.5;
        sw.alpha -= 0.025;

        if (sw.alpha <= 0) {
          this.shockwaves.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.alpha;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // 5. Draw Interactive Nodes
      this.topoNodes.forEach((n, idx) => {
        const isHovered = this.hoveredNode === idx;
        const isFailed = n.status === 'failed';

        // Outer pulsing ring on hovered / failed
        if (isFailed || isHovered) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 6, 0, Math.PI * 2);
          ctx.strokeStyle = isFailed ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 210, 255, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Node Body
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#090D16';
        ctx.strokeStyle = isFailed ? '#EF4444' : '#10B981';
        ctx.lineWidth = isHovered ? 3.5 : 2.5;
        ctx.shadowColor = isFailed ? '#EF4444' : '#10B981';
        ctx.shadowBlur = isHovered ? 18 : 10;
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner glowing core
        ctx.beginPath();
        ctx.arc(n.x, n.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = isFailed ? '#EF4444' : '#10B981';
        ctx.fill();

        // Node Label
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(n.name, n.x, n.y + n.radius + 16);
      });

      this.canvasAnimId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
  }

  addShockwave(x, y, color) {
    this.shockwaves.push({ x, y, r: 10, alpha: 0.9, color: color || '#EF4444' });
  }

  bindCanvasInteractions(canvas) {
    const tooltip = this.element.querySelector('#topo-node-tooltip');
    const ttTitle = this.element.querySelector('#tt-title');
    const ttStatus = this.element.querySelector('#tt-status');
    const ttImpact = this.element.querySelector('#tt-impact');
    const ttDownstream = this.element.querySelector('#tt-downstream');

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let foundIdx = null;
      this.topoNodes.forEach((n, idx) => {
        const dx = mouseX - n.x;
        const dy = mouseY - n.y;
        if (Math.sqrt(dx * dx + dy * dy) < n.radius + 8) {
          foundIdx = idx;
        }
      });

      this.hoveredNode = foundIdx;
      canvas.style.cursor = foundIdx !== null ? 'pointer' : 'default';

      if (foundIdx !== null) {
        const n = this.topoNodes[foundIdx];
        if (tooltip) {
          tooltip.style.display = 'block';
          tooltip.style.left = `${n.x + 20}px`;
          tooltip.style.top = `${n.y - 30}px`;
          if (ttTitle) ttTitle.textContent = n.name;
          if (ttStatus) {
            ttStatus.textContent = n.status.toUpperCase();
            ttStatus.className = `tt-status ${n.status === 'failed' ? 'red' : 'green'}`;
          }
          if (ttImpact) ttImpact.textContent = `${n.impact}/100 Severity`;
          if (ttDownstream) ttDownstream.textContent = `${n.downstream} Dependent Nodes`;
        }
      } else {
        if (tooltip) tooltip.style.display = 'none';
      }
    });

    canvas.addEventListener('mouseleave', () => {
      this.hoveredNode = null;
      if (tooltip) tooltip.style.display = 'none';
    });

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      this.topoNodes.forEach((n) => {
        const dx = mouseX - n.x;
        const dy = mouseY - n.y;
        if (Math.sqrt(dx * dx + dy * dy) < n.radius + 10) {
          // Toggle node failure & propagate
          sound.playAlert();
          n.status = n.status === 'failed' ? 'operational' : 'failed';
          n.color = n.status === 'failed' ? '#EF4444' : '#10B981';
          this.addShockwave(n.x, n.y, n.color);

          const hudText = this.element.querySelector('#topo-hud-text');
          if (hudText) {
            hudText.textContent = `INJECTED OUTAGE: ${n.name} (STATUS: ${n.status.toUpperCase()})`;
          }
        }
      });
    });
  }

  bindTopoControls() {
    const playBtn = this.element.querySelector('#btn-topo-play');
    const resetBtn = this.element.querySelector('#btn-topo-reset');
    const recoverBtn = this.element.querySelector('#btn-topo-recover');

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        sound.playClick();
        this.triggerCascadeWave();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        sound.playClick();
        this.topoNodes.forEach(n => {
          n.status = 'operational';
          n.color = '#10B981';
        });
        const hudText = this.element.querySelector('#topo-hud-text');
        if (hudText) hudText.textContent = 'GRAPH RESET: ALL 10 SERVICES 100% OPERATIONAL';
      });
    }

    if (recoverBtn) {
      recoverBtn.addEventListener('click', () => {
        sound.playClick();
        this.topoNodes.forEach((n, idx) => {
          setTimeout(() => {
            n.status = 'operational';
            n.color = '#10B981';
            this.addShockwave(n.x, n.y, '#10B981');
          }, idx * 250);
        });
        const hudText = this.element.querySelector('#topo-hud-text');
        if (hudText) hudText.textContent = 'AUTOMATED MTTR RECOVERY ENGAGED: RESTORING SERVICES IN SEQUENCE';
      });
    }
  }

  triggerCascadeWave() {
    sound.playAlert();
    this.topoNodes.forEach((n, idx) => {
      setTimeout(() => {
        n.status = 'failed';
        n.color = '#EF4444';
        this.addShockwave(n.x, n.y, '#EF4444');
      }, idx * 400);
    });
    const hudText = this.element.querySelector('#topo-hud-text');
    if (hudText) hudText.textContent = 'CASCADE PROPAGATING: BREADTH-FIRST SEARCH WAVE EXPANDING';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INTERACTIVE REACTOR STRESS CONSOLE
  // ─────────────────────────────────────────────────────────────────────────

  initReactorConsole() {
    const slider = this.element.querySelector('#stress-range-slider');
    const glowBar = this.element.querySelector('#slider-glow-bar');
    const statusPill = this.element.querySelector('#reactor-status-pill');
    const gridLoad = this.element.querySelector('#r-grid-load');
    const scadaJitter = this.element.querySelector('#r-scada-jitter');
    const outagesCount = this.element.querySelector('#r-outages-count');

    const resVal = this.element.querySelector('#rs-resilience-val');
    const resBar = this.element.querySelector('#rs-resilience-bar');
    const depthVal = this.element.querySelector('#rs-depth-val');
    const depthSub = this.element.querySelector('#rs-depth-sub');
    const tacticVal = this.element.querySelector('#rs-tactic-val');
    const tacticSub = this.element.querySelector('#rs-tactic-sub');

    if (!slider) return;

    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.stressLevel = val;

      if (glowBar) glowBar.style.width = `${val}%`;

      if (val === 0) {
        if (statusPill) { statusPill.textContent = '● STATUS: BASELINE OPERATIONS'; statusPill.style.color = '#10B981'; }
        if (gridLoad) gridLoad.textContent = '100%';
        if (scadaJitter) scadaJitter.textContent = '4.2ms';
        if (outagesCount) outagesCount.textContent = '0 / 10';
        if (resVal) { resVal.textContent = '100%'; resVal.className = 'rs-val rs-big green'; }
        if (resBar) { resBar.style.width = '100%'; resBar.className = 'rs-bar-fill green'; }
        if (depthVal) depthVal.textContent = 'Level 0';
        if (depthSub) depthSub.textContent = 'No failure waves detected';
        if (tacticVal) { tacticVal.textContent = 'Routine Diagnostic Monitoring'; tacticVal.style.color = '#38BDF8'; }
        if (tacticSub) tacticSub.textContent = 'All 10 services operating nominal';
      } else if (val < 30) {
        if (statusPill) { statusPill.textContent = '● STATUS: LOCALIZED GRID TRANSIENT'; statusPill.style.color = '#F59E0B'; }
        if (gridLoad) gridLoad.textContent = '88%';
        if (scadaJitter) scadaJitter.textContent = '14.8ms';
        if (outagesCount) outagesCount.textContent = '1 / 10';
        if (resVal) { resVal.textContent = `${100 - Math.round(val * 0.4)}%`; resVal.className = 'rs-val rs-big yellow'; }
        if (resBar) { resBar.style.width = `${100 - Math.round(val * 0.4)}%`; resBar.className = 'rs-bar-fill yellow'; }
        if (depthVal) depthVal.textContent = 'Level 1';
        if (depthSub) depthSub.textContent = 'Substation PWR-01 isolated';
        if (tacticVal) { tacticVal.textContent = 'Switch to Auxiliary Diesel Gen'; tacticVal.style.color = '#F59E0B'; }
        if (tacticSub) tacticSub.textContent = 'Quarantine failed distribution line';
      } else if (val < 65) {
        if (statusPill) { statusPill.textContent = '● STATUS: INTERDEPENDENT STRESS'; statusPill.style.color = '#F97316'; }
        if (gridLoad) gridLoad.textContent = '62%';
        if (scadaJitter) scadaJitter.textContent = '68.4ms';
        if (outagesCount) outagesCount.textContent = '3 / 10';
        if (resVal) { resVal.textContent = `${100 - Math.round(val * 0.65)}%`; resVal.className = 'rs-val rs-big orange'; }
        if (resBar) { resBar.style.width = `${100 - Math.round(val * 0.65)}%`; resBar.className = 'rs-bar-fill orange'; }
        if (depthVal) depthVal.textContent = 'Level 2';
        if (depthSub) depthSub.textContent = 'Water works & Telecom coupled drop';
        if (tacticVal) { tacticVal.textContent = 'Execute Automated MTTR Recovery'; tacticVal.style.color = '#F97316'; }
        if (tacticSub) tacticSub.textContent = 'Prioritize shortest repair paths first';
      } else {
        if (statusPill) { statusPill.textContent = '● STATUS: SYSTEMIC CASCADE DISASTER'; statusPill.style.color = '#EF4444'; }
        if (gridLoad) gridLoad.textContent = '24%';
        if (scadaJitter) scadaJitter.textContent = '420.0ms';
        if (outagesCount) outagesCount.textContent = '7 / 10';
        if (resVal) { resVal.textContent = `${Math.max(12, 100 - Math.round(val * 0.85))}%`; resVal.className = 'rs-val rs-big red'; }
        if (resBar) { resBar.style.width = `${Math.max(12, 100 - Math.round(val * 0.85))}%`; resBar.className = 'rs-bar-fill red'; }
        if (depthVal) depthVal.textContent = 'Level 4 (Critical)';
        if (depthSub) depthSub.textContent = 'City-wide multi-sector collapse';
        if (tacticVal) { tacticVal.textContent = 'Emergency SCADA Islanding'; tacticVal.style.color = '#EF4444'; }
        if (tacticSub) tacticSub.textContent = 'Engage AI Commander emergency playbook';
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DYNAMIC CURSOR SPOTLIGHT TRACKER
  // ─────────────────────────────────────────────────────────────────────────

  initCursorSpotlight() {
    const spotlight = this.element.querySelector('#cursor-glow-spotlight');
    if (!spotlight) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    this.element.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;

      this.element.querySelectorAll('.tilt-card, .flash-card, .horizontal-panel, .case-study-card').forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    });

    const updateSpotlight = () => {
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;
      spotlight.style.transform = `translate3d(${currentX - 250}px, ${currentY - 250}px, 0)`;
      this.spotlightRaf = requestAnimationFrame(updateSpotlight);
    };
    updateSpotlight();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LENIS & GSAP PINNED SCROLL INTEGRATION
  // ─────────────────────────────────────────────────────────────────────────

  initLenisAndGSAP() {
    try {
      this.lenis = new Lenis({
        wrapper: this.element,
        content: this.element.querySelector('#landing-scroll-content'),
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        orientation: 'vertical'
      });

      this.lenis.on('scroll', (e) => {
        if (this.scrollProgressEl) {
          const maxScroll = this.element.scrollHeight - this.element.clientHeight;
          const progress = maxScroll > 0 ? (e.scroll / maxScroll) * 100 : 0;
          this.scrollProgressEl.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }
        ScrollTrigger.update();
      });

      this.rafCallback = (time) => {
        this.lenis.raf(time);
        requestAnimationFrame(this.rafCallback);
      };
      requestAnimationFrame(this.rafCallback);

      ScrollTrigger.defaults({ scroller: this.element });

      this.initHeroEntrance();
      this.initGuideMasterclass();
      this.initManifestoHighlight();
      this.initPinnedCascadeScrubber();
      this.initCapabilityCarousel();
      this.initScrollReveals();

    } catch (err) {
      console.warn('Lenis and GSAP setup fallback:', err);
    }
  }

  initHeroEntrance() {
    gsap.from('.hero-pill-badge', {
      opacity: 0,
      y: -24,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.2
    });

    gsap.from('.hero-main-title', {
      opacity: 0,
      y: 35,
      duration: 1.0,
      ease: 'power3.out',
      delay: 0.4
    });

    gsap.from('.hero-subtext', {
      opacity: 0,
      y: 24,
      duration: 0.9,
      ease: 'power3.out',
      delay: 0.6
    });

    gsap.from('.hero-cta-group button', {
      opacity: 0,
      y: 20,
      stagger: 0.12,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.8
    });

    gsap.from('.stat-ribbon-card', {
      opacity: 0,
      y: 30,
      stagger: 0.1,
      duration: 0.8,
      ease: 'power3.out',
      delay: 1.0
    });
  }

  initGuideMasterclass() {
    const stepCards = this.element.querySelectorAll('.guide-master-card');
    const pills = this.element.querySelectorAll('.guide-nav-pill');
    const screens = this.element.querySelectorAll('.guide-screen');
    const termTitle = this.element.querySelector('#guide-term-title');

    const titles = {
      '1': 'MISSION CONTROL • 3D ENGINE VIEWPORT',
      '2': 'CRISIS TELEMETRY • CASCADE PROPAGATION',
      '3': 'SIMULATION SANDBOX • MULTI-VECTOR WHAT-IF',
      '4': 'TOPOLOGY INTELLIGENCE • 2D DIRECTED GRAPH',
      '5': 'AI DISPATCH CONSOLE • GROQ LLAMA-3'
    };

    const activateStep = (stepId) => {
      // Update pills
      pills.forEach(p => p.classList.toggle('active', p.getAttribute('data-step-target') === stepId));
      // Update cards
      stepCards.forEach(c => c.classList.toggle('active', c.getAttribute('data-step-id') === stepId));
      // Update screens with cross-fade
      screens.forEach(s => {
        const isMatch = s.getAttribute('data-screen') === stepId;
        if (isMatch) {
          s.classList.add('active');
          gsap.fromTo(s, { opacity: 0, y: 12, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power2.out' });
        } else {
          s.classList.remove('active');
        }
      });
      // Update header
      if (termTitle && titles[stepId]) termTitle.textContent = titles[stepId];
    };

    // ScrollTrigger for each master card
    stepCards.forEach(card => {
      const stepId = card.getAttribute('data-step-id');
      ScrollTrigger.create({
        trigger: card,
        scroller: this.element,
        start: 'top 55%',
        end: 'bottom 45%',
        onEnter: () => activateStep(stepId),
        onEnterBack: () => activateStep(stepId)
      });
    });

    // Pill click navigation
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        sound.playClick();
        const stepId = pill.getAttribute('data-step-target');
        activateStep(stepId);
        const targetCard = this.element.querySelector(`.guide-master-card[data-step-id="${stepId}"]`);
        if (targetCard) {
          if (this.lenis) this.lenis.scrollTo(targetCard, { offset: -120 });
          else targetCard.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Step cards click
    stepCards.forEach(card => {
      card.addEventListener('click', () => {
        const stepId = card.getAttribute('data-step-id');
        activateStep(stepId);
      });
    });

    // CTAs inside steps
    const step1Btn = this.element.querySelector('.btn-launch-step1');
    if (step1Btn) {
      step1Btn.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playClick();
        this.hide();
        if (this.onEnterCity) this.onEnterCity();
      });
    }

    const step2Btn = this.element.querySelector('.btn-launch-step2');
    if (step2Btn) {
      step2Btn.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playClick();
        this.hide();
        if (this.onEnterCity) this.onEnterCity();
        if (this.onFocusService) this.onFocusService('power_grid_01');
      });
    }

    const step3Btn = this.element.querySelector('.btn-launch-step3');
    if (step3Btn) {
      step3Btn.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playClick();
        this.hide();
        if (this.onEnterCity) this.onEnterCity();
        const tabBtn = document.getElementById('tab-btn-whatif');
        if (tabBtn) tabBtn.click();
      });
    }

    const step4Btn = this.element.querySelector('.btn-launch-step4');
    if (step4Btn) {
      step4Btn.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playClick();
        this.hide();
        if (this.onEnterCity) this.onEnterCity();
        const graphBtn = document.getElementById('btn-view-graph');
        if (graphBtn) graphBtn.click();
      });
    }

    const step5Btn = this.element.querySelector('.btn-launch-step5');
    if (step5Btn) {
      step5Btn.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playClick();
        this.hide();
        if (this.onEnterCity) this.onEnterCity();
        const aiToggle = document.getElementById('btn-ai-toggle');
        if (aiToggle) aiToggle.click();
      });
    }

    // Theme pills on screen 1
    const themePills = this.element.querySelectorAll('.st-pill');
    themePills.forEach(tp => {
      tp.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playClick();
        themePills.forEach(p => p.classList.remove('active'));
        tp.classList.add('active');
      });
    });
  }

  initManifestoHighlight() {
    const words = this.element.querySelectorAll('.m-word');
    if (!words.length) return;

    gsap.fromTo(words, 
      { opacity: 0.2, y: 5 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.04,
        ease: 'none',
        scrollTrigger: {
          trigger: '#section-statement',
          scroller: this.element,
          start: 'top 75%',
          end: 'bottom 40%',
          scrub: 0.5
        }
      }
    );
  }

  initPinnedCascadeScrubber() {
    const phaseCards = this.element.querySelectorAll('.cascade-phase-card');

    phaseCards.forEach((card) => {
      const phaseNum = card.getAttribute('data-phase');

      ScrollTrigger.create({
        trigger: card,
        scroller: this.element,
        start: 'top 60%',
        end: 'bottom 40%',
        onEnter: () => this.updateHUDState(phaseNum),
        onEnterBack: () => this.updateHUDState(phaseNum)
      });
    });
  }

  updateHUDState(phase) {
    const hudNum = this.element.querySelector('#hud-resilience-num');
    const hudPhase = this.element.querySelector('#hud-phase-val');
    const hudLog = this.element.querySelector('#hud-log-stream');

    const nodePwr = this.element.querySelector('#h-node-pwr');
    const nodeWtr = this.element.querySelector('#h-node-wtr');
    const nodeTel = this.element.querySelector('#h-node-tel');
    const nodeTrf = this.element.querySelector('#h-node-trf');
    const nodeTrn = this.element.querySelector('#h-node-trn');
    const nodeHos = this.element.querySelector('#h-node-hos');

    [nodePwr, nodeWtr, nodeTel, nodeTrf, nodeTrn, nodeHos].forEach(n => {
      if (n) n.className = 'hud-node-pill';
    });

    if (phase === '1') {
      if (hudNum) { hudNum.textContent = '78%'; hudNum.style.color = '#F59E0B'; }
      if (hudPhase) hudPhase.textContent = 'Phase 1: Grid Trip (PWR-01)';
      if (nodePwr) nodePwr.classList.add('failed');
      if (hudLog) hudLog.innerHTML = `<div class="hud-log-entry alert">[ALERT] PWR-01 primary relay tripped. Arc flash detected. Frequency: 47.2Hz.</div>`;
    } else if (phase === '2') {
      if (hudNum) { hudNum.textContent = '55%'; hudNum.style.color = '#F97316'; }
      if (hudPhase) hudPhase.textContent = 'Phase 2: Water Choke (WTR-01)';
      if (nodePwr) nodePwr.classList.add('failed');
      if (nodeWtr) nodeWtr.classList.add('failed');
      if (hudLog) hudLog.innerHTML = `<div class="hud-log-entry warn">[CASCADE] WTR-01 high-pressure pumps unpowered. Supply pressure dropped 68%.</div>`;
    } else if (phase === '3') {
      if (hudNum) { hudNum.textContent = '32%'; hudNum.style.color = '#EF4444'; }
      if (hudPhase) hudPhase.textContent = 'Phase 3: Systemic Congestion';
      if (nodePwr) nodePwr.classList.add('failed');
      if (nodeWtr) nodeWtr.classList.add('failed');
      if (nodeTel) nodeTel.classList.add('failed');
      if (nodeTrf) nodeTrf.classList.add('failed');
      if (nodeTrn) nodeTrn.classList.add('failed');
      if (hudLog) hudLog.innerHTML = `<div class="hud-log-entry crit">[CRITICAL] TEL-01 batteries depleted. TRF-01 and TRN-01 signals dropped to fail-safe.</div>`;
    } else if (phase === '4') {
      if (hudNum) { hudNum.textContent = '84%'; hudNum.style.color = '#10B981'; }
      if (hudPhase) hudPhase.textContent = 'Phase 4: Automated Recovery Engaged';
      if (nodePwr) nodePwr.classList.add('recovering');
      if (nodeWtr) nodeWtr.classList.add('recovering');
      if (nodeHos) nodeHos.classList.add('operational');
      if (hudLog) hudLog.innerHTML = `<div class="hud-log-entry info">[RECOVERY] Automated SCADA breaker closed. Root node PWR-01 energized. Recovery in progress.</div>`;
    }
  }

  initCapabilityCarousel() {
    const container = this.element.querySelector('#horizontal-track-container');
    const prevBtn = this.element.querySelector('#track-btn-prev');
    const nextBtn = this.element.querySelector('#track-btn-next');
    const dots = this.element.querySelectorAll('.track-dot');
    const panels = this.element.querySelectorAll('.horizontal-panel');

    if (!container) return;

    // Stagger in the panels when section enters viewport
    gsap.from(panels, {
      scrollTrigger: {
        trigger: '#section-horizontal',
        scroller: this.element,
        start: 'top 80%'
      },
      opacity: 0,
      y: 35,
      stagger: 0.08,
      duration: 0.8,
      ease: 'power3.out'
    });

    const updateDots = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = (panels[0]?.offsetWidth || 380) + 24;
      const activeIdx = Math.min(dots.length - 1, Math.max(0, Math.round(scrollLeft / cardWidth)));
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === activeIdx);
      });
    };

    container.addEventListener('scroll', updateDots, { passive: true });

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        sound.playClick();
        const cardWidth = (panels[0]?.offsetWidth || 380) + 24;
        container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        sound.playClick();
        const cardWidth = (panels[0]?.offsetWidth || 380) + 24;
        container.scrollBy({ left: cardWidth, behavior: 'smooth' });
      });
    }

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        sound.playClick();
        const idx = parseInt(dot.getAttribute('data-index'), 10);
        const cardWidth = (panels[0]?.offsetWidth || 380) + 24;
        container.scrollTo({ left: idx * cardWidth, behavior: 'smooth' });
      });
    });
  }

  initScrollReveals() {
    gsap.utils.toArray('.guide-step-card, .case-study-card').forEach((card, idx) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          scroller: this.element,
          start: 'top 85%'
        },
        opacity: 0,
        y: 40,
        duration: 0.7,
        ease: 'power3.out',
        delay: (idx % 3) * 0.1
      });
    });

    gsap.utils.toArray('.split-side-card').forEach((card, idx) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          scroller: this.element,
          start: 'top 85%'
        },
        opacity: 0,
        x: idx === 0 ? -40 : 40,
        duration: 0.8,
        ease: 'power3.out'
      });
    });

    gsap.utils.toArray('.flash-card').forEach((card, idx) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          scroller: this.element,
          start: 'top 90%'
        },
        opacity: 0,
        y: 30,
        duration: 0.6,
        ease: 'power3.out',
        delay: (idx % 4) * 0.08
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3D CARD PERSPECTIVE TILT
  // ─────────────────────────────────────────────────────────────────────────

  initCardTilt() {
    const tiltCards = this.element.querySelectorAll('.tilt-card, .flash-card');

    tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-5px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INTERACTIVE SCENARIO PLAYGROUND COMPONENT
  // ─────────────────────────────────────────────────────────────────────────

  renderScenario(scenarioKey) {
    this.activeScenario = scenarioKey;
    const board = this.element.querySelector('#scenario-board');
    if (!board) return;

    let title, description, initialTarget, cascadeList, resilienceScore, recoveryTime;

    if (scenarioKey === 'water') {
      title = 'Scenario B: Industrial Water Main Burst';
      description = 'Severe pipeline rupture drops water delivery pressure below 30%, choking cooling reservoirs in power generation and hospital sanitation.';
      initialTarget = 'WTR-01 (Main Water Filtration Plant)';
      cascadeList = [
        { time: 'T+00m', service: '💧 WTR-01 Water Works', status: 'Direct Rupture (100%)', impact: 'Primary Outage' },
        { time: 'T+08m', service: '🏥 HOS-01 St. Jude Medical', status: 'Sanitation Choke (80%)', impact: 'Cascade Depth 1' },
        { time: 'T+14m', service: '⚡ PWR-01 Power Substation', status: 'Cooling Depleted (60%)', impact: 'Cascade Depth 1' },
        { time: 'T+22m', service: '🚦 TRF-01 Traffic Grid', status: 'Power Loss Spillover (45%)', impact: 'Cascade Depth 2' }
      ];
      resilienceScore = 48;
      recoveryTime = '45 mins (Automated MTTR)';

      if (this.topoNodes && this.topoNodes.length >= 6) {
        this.topoNodes.forEach(n => { n.status = 'operational'; n.color = '#10B981'; });
        this.topoNodes[1].status = 'failed'; this.topoNodes[1].color = '#F97316';
        this.topoNodes[5].status = 'failed'; this.topoNodes[5].color = '#EF4444';
        this.addShockwave(this.topoNodes[1].x, this.topoNodes[1].y, '#F97316');
      }
    } else if (scenarioKey === 'telecom') {
      title = 'Scenario C: Cyberattack on Central Fiber Backbone';
      description = 'Ransomware disables core 5G routing hubs, cutting off SCADA telemetry for traffic signals and emergency dispatch coordination.';
      initialTarget = 'TEL-01 (Central Telecom Hub)';
      cascadeList = [
        { time: 'T+00m', service: '📡 TEL-01 Telecom Tower', status: 'Fiber Sever (100%)', impact: 'Primary Outage' },
        { time: 'T+05m', service: '🚦 TRF-01 Traffic AI Signals', status: 'Telemetry Lost (90%)', impact: 'Cascade Depth 1' },
        { time: 'T+10m', service: '🚨 EMG-01 Emergency Dispatch', status: 'CAD Offline (75%)', impact: 'Cascade Depth 1' },
        { time: 'T+18m', service: '🚇 TRN-01 Metro Transit', status: 'Signaling Fallback (55%)', impact: 'Cascade Depth 2' }
      ];
      resilienceScore = 54;
      recoveryTime = '35 mins (Priority Recovery)';

      if (this.topoNodes && this.topoNodes.length >= 6) {
        this.topoNodes.forEach(n => { n.status = 'operational'; n.color = '#10B981'; });
        this.topoNodes[2].status = 'failed'; this.topoNodes[2].color = '#F59E0B';
        this.topoNodes[3].status = 'failed'; this.topoNodes[3].color = '#EF4444';
        this.addShockwave(this.topoNodes[2].x, this.topoNodes[2].y, '#F59E0B');
      }
    } else {
      // Default: Power
      title = 'Scenario A: Severe Substation Grid Blackout';
      description = 'High-voltage transformer explosion causes total blackout, propagating immediate failure into water treatment, traffic controllers, and transit lines.';
      initialTarget = 'PWR-01 (Central Power Grid)';
      cascadeList = [
        { time: 'T+00m', service: '⚡ PWR-01 Power Substation', status: 'Total Blackout (100%)', impact: 'Primary Failure' },
        { time: 'T+04m', service: '💧 WTR-01 Water Works', status: 'Pumps Offline (90%)', impact: 'Cascade Depth 1' },
        { time: 'T+06m', service: '📡 TEL-01 Telecom Hub', status: 'Aux Power Depleted (85%)', impact: 'Cascade Depth 1' },
        { time: 'T+12m', service: '🚦 TRF-01 Traffic Signals', status: 'Grid Unpowered (80%)', impact: 'Cascade Depth 2' },
        { time: 'T+16m', service: '🚇 TRN-01 Metro Rail', status: 'Third-Rail Cut (75%)', impact: 'Cascade Depth 2' },
        { time: 'T+24m', service: '🏥 HOS-01 Medical Center', status: 'Emergency Gen Only (65%)', impact: 'Cascade Depth 3' }
      ];
      resilienceScore = 32;
      recoveryTime = '60 mins (Manual MTTR)';

      if (this.topoNodes && this.topoNodes.length >= 6) {
        this.topoNodes.forEach(n => { n.status = 'failed'; n.color = '#EF4444'; });
        this.topoNodes[5].status = 'operational'; this.topoNodes[5].color = '#10B981';
        this.addShockwave(this.topoNodes[0].x, this.topoNodes[0].y, '#EF4444');
      }
    }

    board.innerHTML = `
      <div class="scenario-details-left">
        <div class="scenario-badge-row">
          <span class="pill red">Simulated Failure</span>
          <span class="pill outline">Target: ${initialTarget}</span>
        </div>
        <h3 class="scenario-name">${title}</h3>
        <p class="scenario-desc">${description}</p>

        <div class="scenario-metrics-bar">
          <div class="scenario-metric">
            <span class="sc-label">City Resilience:</span>
            <span class="sc-val" style="color: #EF4444;">${resilienceScore}%</span>
          </div>
          <div class="scenario-metric">
            <span class="sc-label">Predicted Cascade Depth:</span>
            <span class="sc-val">Level ${cascadeList.length > 4 ? 3 : 2}</span>
          </div>
          <div class="scenario-metric">
            <span class="sc-label">Est. Recovery Duration:</span>
            <span class="sc-val">${recoveryTime}</span>
          </div>
        </div>

        <button id="btn-launch-this-scenario" class="btn btn-orange" style="margin-top: 14px;">
          <i data-lucide="play" style="width: 16px; height: 16px;"></i>
          <span>Replay in 3D City Engine</span>
        </button>
      </div>

      <div class="scenario-cascade-timeline">
        <div class="timeline-title-row">
          <span>Stepped Cascade Wave Timetable</span>
          <span class="timeline-live-pill">● BFS ACTIVE</span>
        </div>

        <div class="timeline-step-list">
          ${cascadeList.map((item, idx) => `
            <div class="timeline-cascade-item">
              <div class="timeline-time">${item.time}</div>
              <div class="timeline-dot-connector">
                <span class="timeline-dot ${idx === 0 ? 'primary-dot' : 'cascade-dot'}"></span>
              </div>
              <div class="timeline-card">
                <div class="timeline-service-name">${item.service}</div>
                <div class="timeline-meta">
                  <span class="timeline-status">${item.status}</span>
                  <span class="timeline-impact">${item.impact}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Bind Replay button
    const replayBtn = board.querySelector('#btn-launch-this-scenario');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        sound.playClick();
        this.hide();
        if (this.onEnterCity) this.onEnterCity();
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CARD BUILDER HELPER
  // ─────────────────────────────────────────────────────────────────────────

  createFlashCardHTML(service) {
    const metrics = this.graph.getDependencyMetrics(service.service_id);
    const critClass = service.criticality.toLowerCase();

    return `
      <div class="flash-card tilt-card" data-service-id="${service.service_id}" style="--card-accent: ${service.color_hex || '#FF2E93'}; --icon-bg: ${service.color_hex ? service.color_hex + '1A' : '#FF2E931A'};">
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

  // ─────────────────────────────────────────────────────────────────────────
  // EVENT BINDINGS
  // ─────────────────────────────────────────────────────────────────────────

  bindEvents() {
    const enterBtns = [
      this.element.querySelector('#btn-enter-city'),
      this.element.querySelector('#nav-btn-enter'),
      this.element.querySelector('#btn-footer-launch')
    ];

    enterBtns.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          sound.playClick();
          this.hide();
          if (this.onEnterCity) this.onEnterCity();
        });
      }
    });

    // Audio FX Toggle
    const audioToggle = this.element.querySelector('#nav-audio-toggle');
    const audioStateText = this.element.querySelector('#audio-state-text');
    if (audioToggle) {
      audioToggle.addEventListener('click', () => {
        this.audioEnabled = !this.audioEnabled;
        if (audioToggle) audioToggle.classList.toggle('muted', !this.audioEnabled);
        if (audioStateText) audioStateText.textContent = this.audioEnabled ? 'AUDIO ON' : 'MUTED';
        if (this.audioEnabled) sound.playClick();
      });
    }

    const scrollGuideBtn = this.element.querySelector('#btn-scroll-guide');
    if (scrollGuideBtn) {
      scrollGuideBtn.addEventListener('click', () => {
        sound.playClick();
        const section = this.element.querySelector('#section-guide');
        if (section) {
          if (this.lenis) this.lenis.scrollTo(section, { offset: -80 });
          else section.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    const whatIfBtn = this.element.querySelector('#btn-hero-whatif');
    if (whatIfBtn) {
      whatIfBtn.addEventListener('click', () => {
        sound.playClick();
        this.hide();
        if (this.onEnterCity) this.onEnterCity();
        const tabBtn = document.getElementById('tab-btn-whatif');
        if (tabBtn) tabBtn.click();
      });
    }

    this.element.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        sound.playClick();
        const targetId = link.getAttribute('href');
        const targetEl = this.element.querySelector(targetId);
        if (targetEl) {
          if (this.lenis) this.lenis.scrollTo(targetEl, { offset: -80 });
          else targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    this.element.querySelectorAll('.scenario-tab-btn').forEach(tab => {
      tab.addEventListener('click', () => {
        sound.playClick();
        this.element.querySelectorAll('.scenario-tab-btn').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const scKey = tab.getAttribute('data-scenario');
        this.renderScenario(scKey);
      });
    });

    this.element.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        const item = btn.parentElement;
        const isOpen = item.classList.contains('open');
        this.element.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });

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
    if (this.lenis) this.lenis.start();
    ScrollTrigger.refresh();
  }

  hide() {
    this.element.classList.add('hidden');
    if (this.lenis) this.lenis.stop();
  }

  destroy() {
    if (this.lenis) this.lenis.destroy();
    if (this.spotlightRaf) cancelAnimationFrame(this.spotlightRaf);
    if (this.canvasAnimId) cancelAnimationFrame(this.canvasAnimId);
    ScrollTrigger.getAll().forEach(t => t.kill());
  }
}
