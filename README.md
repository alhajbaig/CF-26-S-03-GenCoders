# ⚡ CASCADYN — Urban Infrastructure Failure & Cascade Propagation Simulator

<p align="center">
  <img src="https://img.shields.io/badge/Three.js-r128-black?style=for-the-badge&logo=three.js&logoColor=white" />
  <img src="https://img.shields.io/badge/GSAP-3.12-green?style=for-the-badge&logo=greensock&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Groq-Llama--3-F55036?style=for-the-badge&logo=openai&logoColor=white" />
  <img src="https://img.shields.io/badge/WebGL-2.0-red?style=for-the-badge&logo=webgl&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />
</p>

---

## 🌐 Overview

**CASCADYN** is a next-generation, defense-grade **Digital Twin and Cascading Infrastructure Failure Simulator**. Built for municipal engineers, disaster response coordinators, and systems architects, CASCADYN models how localized disruptions (*e.g., a power grid substation trip*) propagate non-linearly across interdependent municipal sectors (*Water Purification, 5G Telecommunications, Metro Transit, and Level-1 Emergency Healthcare*).

Equipped with a **real-time 3D Three.js Smart City Viewport**, a **2D Directed Acyclic Graph (DAG) Topology Engine**, a **Monte Carlo What-If Sandbox**, and a **Groq Llama-3 AI Incident Commander**, CASCADYN transforms complex graph-theoretic risk into actionable, automated recovery playbooks.

---

## ✨ Key Architectural Pillars

### 1. 🏙️ Real-Time 3D Smart City Digital Twin
- **Procedural Metropolis**: Procedural skyscrapers with glowing window maps, rooftop helipads, telecommunication antennas, and dynamic elevation.
- **Dynamic Photometric Lighting**: Seamless switching between **☀️ Day** (atmospheric sunlight), **🌅 Sunset** (golden-hour volumetric rim lighting), and **🌙 Cyberpunk Night** (neon bloom and ground reflections).
- **Urban Transit Simulation**: Animated monorail loops and emergency vehicle conduits traversing the municipal grid.
- **Interactive SCADA Tooltips**: 3D Raycasting with real-time telemetry hover cards (`PWR-01`, `WTR-01`, `TEL-01`, `TRF-01`, `HOS-01`).

### 2. 🌌 Live 2D Cascade Propagation Visualizer
- **High-DPI Interactive Canvas**: Direct canvas node interaction with multi-tier dependency propagation.
- **Shockwave Ripple Physics**: Real-time rendering of radiating crisis energy rings and high-velocity particle edge flows.
- **Playback Controls**: Step-by-step simulation wave triggers, one-click graph reset, and automatic self-healing resilience recovery.

### 3. 🔬 Topology Intelligence & Directed Acyclic Graph (DAG)
- **Continuous Edge Coupling Weights**: Scaled mathematical edge coupling ($W_{u,v} \in [0.0, 1.0]$) modeling real physical dependencies.
- **SCADA Adjacency Heatmap Matrix**: Embedded tabular matrix displaying directed upstream/downstream weights and spectral radius ($\lambda$).
- **Single-Point-of-Failure (SPOF) Detection**: Automated identification of critical bottlenecks and vulnerable municipal transit hubs.

### 4. 🎛️ Interactive Stress Reactor & What-If Sandbox
- **Heavy SCADA Drag Console**: Stress slider from `0% Baseline` to `100% Catastrophic Grid Collapse` with real-time recalculation of SCADA jitter and municipal resilience.
- **Monte Carlo Recovery Benchmarking**: Real-time comparative analysis between **Manual Repair** ($60\text{ min}$), **Priority Root Restoration** ($42\text{ min}$), and **Automated $2\times$ MTTR Algorithm** ($28\text{ min}$).

### 5. 🤖 Groq Llama-3 AI Incident Commander
- **Sub-Second RAG Telemetry Querying**: Real-time context injection linking live simulator metrics to Groq Llama-3 inference ($18\text{ ms}$ latency).
- **Automated Mitigation Playbooks**: Generates structured, emergency mitigation protocols with confidence scores and tactical step breakdowns.

### 6. 💎 $100K Apple/Linear-Grade Motion Experience
- **Floating Frosted Glass Capsule Navigation Bar**: Multi-tier ambient shadows, saturated blur, and integrated FPS / Web Audio synthesizer toggle.
- **Interactive 5-Step Masterclass**: 2-column synchronized vertical scroll showcase with sticky holographic preview screens.
- **GPU-Accelerated Carousel**: Smooth horizontal slide transitions with snapping navigation and real-world historical case studies (*2003 Northeast Blackout, 2021 Texas ERCOT Freeze, 2024 Cloud Outage*).

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0.0 or higher)
- `npm` or `pnpm`

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/alhajbaig/CF-26-S-03-GenCoders.git

# 2. Navigate to project root
cd CF-26-S-03-GenCoders

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
```

The application will launch on **`http://localhost:5173/`**.

---

## ⌨️ Keyboard Shortcuts & Controls

| Shortcut / Action | Function |
| :--- | :--- |
| **`Left Click + Drag`** | 360° 3D Orbit Camera Rotation |
| **`Right Click + Drag`** | Pan 3D Camera Plane |
| **`Scroll Wheel`** | Zoom In / Out of Metropolitan Grid |
| **`Spacebar`** | Play / Pause Cascade Failure Simulation |
| **`G`** | Toggle 2D Topological DAG Graph Overlay |
| **`R`** | Trigger Auto-Recovery / Reset Node States |
| **`Day / Sunset / Night`** | Toggle 3D Lighting Environment Themes |

---

## 📁 Repository Structure

```
├── index.html                    # Entry HTML document with modern viewport meta
├── package.json                  # Dependencies (Three.js, GSAP, Lenis, Lucide)
├── vite.config.js                # Vite build & bundle optimizations
└── src/
    ├── main.js                   # Application orchestration & life-cycle manager
    ├── components/
    │   ├── landingPage.js        # $100K Masterclass landing page & interactive demos
    │   ├── dagVisualizer.js      # 2D Topological Graph Canvas & SCADA Matrix
    │   ├── stressConsole.js      # Interactive Stress Reactor Slider
    │   ├── aiAssistant.js        # Groq Llama-3 AI Dispatcher & RAG Playbook Engine
    │   └── hudOverlay.js         # Real-time telemetry HUD overlay
    ├── scene/
    │   ├── city3D.js             # Three.js 3D Smart City Engine & procedural meshes
    │   ├── monorail.js           # Animated transit & vehicle paths
    │   └── lighting.js           # Day / Sunset / Night photometric lighting system
    ├── engine/
    │   ├── graphEngine.js        # Directed graph data structure & BFS failure propagation
    │   ├── whatIfEngine.js       # Monte Carlo disaster vector simulator
    │   └── audioEngine.js        # Cybernetic Web Audio synthesizer & sound FX
    └── styles/
        ├── main.css              # Master design system & SCADA glassmorphism styling
        └── typography.css        # Monospace & display typography tokens
```

---

## 🛠️ Technology Stack

- **3D Graphics & Rendering**: [Three.js](https://threejs.org/) (WebGL 2.0, PBR Materials, Custom Shaders)
- **Smooth Physics & Kinetic Motion**: [GSAP 3](https://greensock.com/gsap/) & [Lenis Scroll](https://lenis.darkroom.engineering/)
- **Audio Synthesizer**: Web Audio API (real-time harmonic frequency generator)
- **AI Telemetry RAG**: Groq Cloud API (Llama-3 70B / 8B inference)
- **Iconography**: [Lucide Icons](https://lucide.dev/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)

---

## 📄 License

This project is open-source and distributed under the **MIT License**. See `LICENSE` for more information.
