/**
 * CASCADYN - Ultra-Realistic & Premium 3D Smart City Visualization Engine (Three.js)
 * Features:
 * - Full OrbitControls (Drag rotate, Right-click pan, Mouse wheel zoom with smooth damping)
 * - Dynamic Day / Sunset / Cyberpunk Night lighting system with realistic fog, shadows, and window glow
 * - High-detail procedural architecture with setbacks, illuminated windows, helipads, antennas & HVAC units
 * - Realistic road networks with zebra crosswalks, lane markings, and 3D street lamps
 * - Elevated Monorail track system with animated maglev transit train
 * - Multi-class animated vehicular traffic (sedans, electric buses, delivery trucks) with headlights/taillights
 * - Floating atmospheric data particles & dynamic ripple shockwaves
 * - Interactive 3D raycaster hover telemetry
 * - Smooth camera preset transitions & cinematic drone tour mode
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class City3DScene {
  constructor(containerElement, graph, onSelectService, onHoverService) {
    this.container = containerElement;
    this.graph = graph;
    this.onSelectService = onSelectService;
    this.onHoverService = onHoverService;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Lighting & Environment
    this.timeOfDay = 'day'; // 'day' | 'sunset' | 'night'
    this.dirLight = null;
    this.ambientLight = null;
    this.hemiLight = null;
    this.streetLights = [];
    this.buildingWindowMaterials = [];
    this.nightLights = [];

    // Meshes & Actors
    this.serviceMeshes = new Map();     // service_id -> THREE.Group
    this.servicePins = new Map();       // service_id -> THREE.Mesh
    this.dependencyLines = [];          // Array of { line, sourceId, targetId, particles, curve }
    this.vehicles = [];                 // Array of { mesh, isHorizontal, lane, speed, progress, direction }
    this.shockwaves = [];               // Array of { mesh, maxRadius, currentScale, speed, opacity }
    this.waterMesh = null;
    this.monorailTrain = null;
    this.monorailTrackPoints = [];
    this.monorailProgress = 0;
    this.atmosphericParticles = null;
    this.streetLampMeshes = [];

    // Selection & Navigation
    this.selectedServiceId = null;
    this.hoveredServiceId = null;
    this.isLandingMode = true;
    this.isTourMode = false;
    this.isPaused = false;

    // Smooth Camera Transition Tweening
    this.cameraTween = null; // { startPos, targetPos, startTarget, endTarget, startTime, duration }

    this.clock = new THREE.Clock();
    this.animationFrameId = null;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xF1F5F9);
    this.scene.fog = new THREE.FogExp2(0xF1F5F9, 0.0045);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 1200);
    this.camera.position.set(0, 85, 115);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer with high dynamic range & crisp shadows
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    this.initControls();

    // 5. Lighting Engine (Day / Sunset / Night)
    this.initLighting();

    // 6. Build Rich City World
    this.buildGroundAndRiver();
    this.buildRoadNetworkAndCrosswalks();
    this.buildStreetLamps();
    this.buildProceduralCityBuildings();
    this.buildMonorailSystem();
    this.buildParksAndFoliage();
    this.buildServiceLandmarks();
    this.buildDependencySplines();
    this.initAtmosphericParticles();
    this.initVehicles();

    // 7. Event Listeners
    this.bindEvents();

    // 8. Graph Subscription (Dynamic sync with dataset additions/reductions)
    this.unsubscribeGraph = this.graph.subscribe(() => {
      this.syncWithDataset();
    });

    // 9. Animation Loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONTROLS & CAMERA INTERACTION
  // ─────────────────────────────────────────────────────────────────────────

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 12;
    this.controls.maxDistance = 260;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04; // Prevent going below ground
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    // Pause tour when user manually drags camera
    this.controls.addEventListener('start', () => {
      if (this.isTourMode) {
        this.isTourMode = false;
        if (this.onTourStateChange) this.onTourStateChange(false);
      }
      this.cameraTween = null;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LIGHTING & ATMOSPHERIC ENGINE
  // ─────────────────────────────────────────────────────────────────────────

  initLighting() {
    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.95);
    this.scene.add(this.ambientLight);

    // Primary Sun / Directional Key Light
    this.dirLight = new THREE.DirectionalLight(0xFFF7ED, 1.4);
    this.dirLight.position.set(65, 110, 55);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 300;
    this.dirLight.shadow.camera.left = -110;
    this.dirLight.shadow.camera.right = 110;
    this.dirLight.shadow.camera.top = 110;
    this.dirLight.shadow.camera.bottom = -110;
    this.dirLight.shadow.bias = -0.0004;
    this.scene.add(this.dirLight);

    // Hemispheric Sky/Ground Ambient
    this.hemiLight = new THREE.HemisphereLight(0xE0F2FE, 0xFEF3C7, 0.65);
    this.scene.add(this.hemiLight);

    // Accent Cyberpunk Rim Lights
    this.magentaRim = new THREE.PointLight(0xFF2E93, 1.2, 140);
    this.magentaRim.position.set(-60, 35, -60);
    this.scene.add(this.magentaRim);

    this.cyanRim = new THREE.PointLight(0x00D2FF, 1.0, 140);
    this.cyanRim.position.set(60, 35, 60);
    this.scene.add(this.cyanRim);
  }

  setTimeOfDay(mode) {
    this.timeOfDay = mode;

    if (mode === 'night') {
      // Midnight Cyberpunk Night Mode
      this.scene.background.set(0x080C14);
      this.scene.fog.color.set(0x080C14);
      this.scene.fog.density = 0.0055;

      this.ambientLight.color.set(0x1E293B);
      this.ambientLight.intensity = 0.45;

      this.dirLight.color.set(0x38BDF8); // Cool Moon Light
      this.dirLight.intensity = 0.55;
      this.dirLight.position.set(-50, 90, -40);

      this.hemiLight.color.set(0x0F172A);
      this.hemiLight.groundColor.set(0x0284C7);
      this.hemiLight.intensity = 0.5;

      this.magentaRim.intensity = 2.4;
      this.cyanRim.intensity = 2.2;

      // Glow street lamps
      this.streetLights.forEach(sl => {
        sl.light.intensity = 1.6;
        sl.bulb.material.emissiveIntensity = 2.0;
      });

      // Glow building windows
      this.buildingWindowMaterials.forEach(m => {
        m.emissiveIntensity = 1.35;
      });

      if (this.waterMesh) {
        this.waterMesh.material.color.set(0x0369A1);
        this.waterMesh.material.roughness = 0.08;
      }
    } else if (mode === 'sunset') {
      // Golden Hour Sunset Mode
      this.scene.background.set(0x2D1B36);
      this.scene.fog.color.set(0x4C1D4F);
      this.scene.fog.density = 0.005;

      this.ambientLight.color.set(0xFED7AA);
      this.ambientLight.intensity = 0.7;

      this.dirLight.color.set(0xF97316); // Warm orange setting sun
      this.dirLight.intensity = 1.8;
      this.dirLight.position.set(90, 40, 50);

      this.hemiLight.color.set(0xF472B6);
      this.hemiLight.groundColor.set(0xEA580C);
      this.hemiLight.intensity = 0.85;

      this.magentaRim.intensity = 1.8;
      this.cyanRim.intensity = 1.2;

      this.streetLights.forEach(sl => {
        sl.light.intensity = 1.0;
        sl.bulb.material.emissiveIntensity = 1.2;
      });

      this.buildingWindowMaterials.forEach(m => {
        m.emissiveIntensity = 0.85;
      });

      if (this.waterMesh) {
        this.waterMesh.material.color.set(0xC2410C);
        this.waterMesh.material.roughness = 0.12;
      }
    } else {
      // Crisp Futuristic Daylight Mode
      this.scene.background.set(0xF1F5F9);
      this.scene.fog.color.set(0xF1F5F9);
      this.scene.fog.density = 0.0045;

      this.ambientLight.color.set(0xFFFFFF);
      this.ambientLight.intensity = 0.95;

      this.dirLight.color.set(0xFFF7ED);
      this.dirLight.intensity = 1.4;
      this.dirLight.position.set(65, 110, 55);

      this.hemiLight.color.set(0xE0F2FE);
      this.hemiLight.groundColor.set(0xFEF3C7);
      this.hemiLight.intensity = 0.65;

      this.magentaRim.intensity = 1.2;
      this.cyanRim.intensity = 1.0;

      this.streetLights.forEach(sl => {
        sl.light.intensity = 0;
        sl.bulb.material.emissiveIntensity = 0.2;
      });

      this.buildingWindowMaterials.forEach(m => {
        m.emissiveIntensity = 0.25;
      });

      if (this.waterMesh) {
        this.waterMesh.material.color.set(0x0EA5E9);
        this.waterMesh.material.roughness = 0.15;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PROCEDURAL TEXTURE GENERATION
  // ─────────────────────────────────────────────────────────────────────────

  _generateWindowTexture(tintColor, neonColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base facade background
    ctx.fillStyle = tintColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Architectural grid lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 2;

    const rows = 16;
    const cols = 6;
    const padX = 6;
    const padY = 6;
    const w = (canvas.width - (cols + 1) * padX) / cols;
    const h = (canvas.height - (rows + 1) * padY) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = padX + c * (w + padX);
        const y = padY + r * (h + padY);

        // Random window illumination
        const isLit = Math.random() > 0.35;
        if (isLit) {
          ctx.fillStyle = Math.random() > 0.3 ? '#FFFFFF' : neonColor;
        } else {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        }
        ctx.fillRect(x, y, w, h);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WORLD BUILDERS
  // ─────────────────────────────────────────────────────────────────────────

  buildGroundAndRiver() {
    // Island Foundation
    const groundGeo = new THREE.PlaneGeometry(260, 260);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xE2E8F0,
      roughness: 0.88,
      metalness: 0.08
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Subtle Technological Grid Overlay
    const gridHelper = new THREE.GridHelper(240, 48, 0xCBD5E1, 0xE2E8F0);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);

    // Shimmering Curving River Canal
    const waterGeo = new THREE.PlaneGeometry(44, 250, 48, 48);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0EA5E9,
      roughness: 0.12,
      metalness: 0.85,
      transparent: true,
      opacity: 0.92
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.rotation.z = 0.16;
    this.waterMesh.position.set(-46, 0.05, 0);
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);

    // Shoreline Embankments along river
    [-46].forEach(riverX => {
      const bankLeftGeo = new THREE.BoxGeometry(2, 0.8, 250);
      const bankMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, roughness: 0.6 });
      
      const leftBank = new THREE.Mesh(bankLeftGeo, bankMat);
      leftBank.position.set(riverX - 22, 0.25, 0);
      leftBank.rotation.y = 0.16;
      leftBank.receiveShadow = true;
      this.scene.add(leftBank);

      const rightBank = new THREE.Mesh(bankLeftGeo, bankMat);
      rightBank.position.set(riverX + 22, 0.25, 0);
      rightBank.rotation.y = 0.16;
      rightBank.receiveShadow = true;
      this.scene.add(rightBank);
    });

    // Architectural Bridge Crossings with Pillars & Illuminated Railings
    [-44, 0, 44].forEach(z => {
      const bridgeGroup = new THREE.Group();
      bridgeGroup.position.set(-46, 0.8, z);

      // Deck
      const deckGeo = new THREE.BoxGeometry(48, 1.4, 11);
      const deckMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.35, metalness: 0.2 });
      const deck = new THREE.Mesh(deckGeo, deckMat);
      deck.castShadow = true;
      deck.receiveShadow = true;
      bridgeGroup.add(deck);

      // Asphalt layer on bridge
      const roadGeo = new THREE.PlaneGeometry(48, 9);
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.7 });
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.y = 0.72;
      road.receiveShadow = true;
      bridgeGroup.add(road);

      // Bridge Support Pillars
      [-16, 16].forEach(px => {
        const pillarGeo = new THREE.CylinderGeometry(1.6, 2.0, 8, 16);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.5 });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(px, -3.2, 0);
        pillar.castShadow = true;
        bridgeGroup.add(pillar);
      });

      // Illuminated Guardrails
      [-4.8, 4.8].forEach(rz => {
        const railGeo = new THREE.BoxGeometry(48, 1.2, 0.4);
        const railMat = new THREE.MeshStandardMaterial({ color: 0x00D2FF, emissive: 0x00D2FF, emissiveIntensity: 0.5 });
        const rail = new THREE.Mesh(railGeo, railMat);
        rail.position.set(0, 1.2, rz);
        bridgeGroup.add(rail);
      });

      this.scene.add(bridgeGroup);
    });
  }

  buildRoadNetworkAndCrosswalks() {
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1E293B, // Dark rich asphalt
      roughness: 0.65,
      metalness: 0.1
    });

    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xFBBF24 });
    const crosswalkMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

    const avenuePositions = [-30, -10, 10, 30];

    // East-West Avenues
    avenuePositions.forEach(z => {
      const roadGeo = new THREE.PlaneGeometry(210, 7.5);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(0, 0.02, z);
      road.receiveShadow = true;
      this.scene.add(road);

      // Yellow Center Dash
      const dashGeo = new THREE.PlaneGeometry(200, 0.35);
      const dash = new THREE.Mesh(dashGeo, stripeMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.03, z);
      this.scene.add(dash);
    });

    // North-South Avenues
    avenuePositions.forEach(x => {
      const roadGeo = new THREE.PlaneGeometry(7.5, 210);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(x, 0.02, 0);
      road.receiveShadow = true;
      this.scene.add(road);

      const dashGeo = new THREE.PlaneGeometry(0.35, 200);
      const dash = new THREE.Mesh(dashGeo, stripeMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(x, 0.03, 0);
      this.scene.add(dash);
    });

    // Zebra Crosswalks at Intersections
    avenuePositions.forEach(x => {
      avenuePositions.forEach(z => {
        // Crosswalk strips on 4 arms of the intersection
        const offsets = [
          { dx: 0, dz: 4.8, rot: 0 },
          { dx: 0, dz: -4.8, rot: 0 },
          { dx: 4.8, dz: 0, rot: Math.PI / 2 },
          { dx: -4.8, dz: 0, rot: Math.PI / 2 }
        ];

        offsets.forEach(off => {
          for (let s = -2.5; s <= 2.5; s += 0.9) {
            const stripGeo = new THREE.PlaneGeometry(0.45, 1.8);
            const strip = new THREE.Mesh(stripGeo, crosswalkMat);
            strip.rotation.x = -Math.PI / 2;
            strip.rotation.z = off.rot;
            strip.position.set(
              x + off.dx + (off.rot === 0 ? s : 0),
              0.035,
              z + off.dz + (off.rot !== 0 ? s : 0)
            );
            this.scene.add(strip);
          }
        });
      });
    });
  }

  buildStreetLamps() {
    const lampPositions = [];
    const avenues = [-30, -10, 10, 30];

    avenues.forEach(z => {
      for (let x = -75; x <= 75; x += 30) {
        lampPositions.push({ x: x, z: z - 4.6 });
        lampPositions.push({ x: x, z: z + 4.6 });
      }
    });

    lampPositions.forEach((pos, idx) => {
      const lampGroup = new THREE.Group();
      lampGroup.position.set(pos.x, 0, pos.z);

      // Pole
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 4.8, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 2.4;
      pole.castShadow = true;
      lampGroup.add(pole);

      // Curved Arm
      const armGeo = new THREE.BoxGeometry(0.9, 0.1, 0.1);
      const arm = new THREE.Mesh(armGeo, poleMat);
      arm.position.set(0.35, 4.7, 0);
      lampGroup.add(arm);

      // Glowing Lamp Bulb
      const bulbGeo = new THREE.SphereGeometry(0.22, 10, 10);
      const bulbMat = new THREE.MeshStandardMaterial({
        color: 0xFEF08A,
        emissive: 0xFBBF24,
        emissiveIntensity: 0.2
      });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(0.7, 4.55, 0);
      lampGroup.add(bulb);

      this.scene.add(lampGroup);
      this.streetLampMeshes.push(lampGroup);

      // Add dynamic light source for every 4th lamp
      if (idx % 4 === 0) {
        const pLight = new THREE.PointLight(0xFBBF24, 0, 18);
        pLight.position.set(pos.x, 4.6, pos.z);
        this.scene.add(pLight);
        this.streetLights.push({ light: pLight, bulb });
      }
    });
  }

  buildProceduralCityBuildings() {
    const buildingStyles = [
      { tint: '#0284C7', neon: '#00D2FF', metal: 0.4, rough: 0.2 }, // Cyan Modern Glass
      { tint: '#E11D48', neon: '#FF2E93', metal: 0.3, rough: 0.25 }, // Magenta Corporate
      { tint: '#D97706', neon: '#FBBF24', metal: 0.5, rough: 0.3 }, // Amber Highrise
      { tint: '#059669', neon: '#34D399', metal: 0.35, rough: 0.25 }, // Emerald Eco Tower
      { tint: '#7C3AED', neon: '#A78BFA', metal: 0.45, rough: 0.2 }, // Purple Tech Spire
      { tint: '#334155', neon: '#38BDF8', metal: 0.8, rough: 0.15 }  // Slate Mirror Skyscraper
    ];

    const blocks = [
      { minX: -24, maxX: -14, minZ: -24, maxZ: -14 },
      { minX: -24, maxX: -14, minZ: -6, maxZ: 6 },
      { minX: -6, maxX: 6, minZ: -24, maxZ: -14 },
      { minX: -6, maxX: 6, minZ: 14, maxZ: 24 },
      { minX: 14, maxX: 24, minZ: -24, maxZ: -14 },
      { minX: 14, maxX: 24, minZ: -6, maxZ: 6 },
      { minX: -24, maxX: -14, minZ: 14, maxZ: 24 },
      { minX: 34, maxX: 50, minZ: -22, maxZ: 22 },
      { minX: -64, maxX: -50, minZ: -32, maxZ: 32 }
    ];

    blocks.forEach((block, bIdx) => {
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const style = buildingStyles[(bIdx + i) % buildingStyles.length];
        const width = 4 + Math.random() * 4;
        const depth = 4 + Math.random() * 4;
        const height = 12 + Math.random() * 26;

        const x = block.minX + Math.random() * (block.maxX - block.minX);
        const z = block.minZ + Math.random() * (block.maxZ - block.minZ);

        const buildingGroup = new THREE.Group();
        buildingGroup.position.set(x, 0, z);

        // Window textured material
        const winTex = this._generateWindowTexture(style.tint, style.neon);
        winTex.repeat.set(1, Math.max(1, Math.round(height / 10)));

        const mat = new THREE.MeshStandardMaterial({
          map: winTex,
          emissiveMap: winTex,
          emissive: new THREE.Color(style.neon),
          emissiveIntensity: 0.25,
          roughness: style.rough,
          metalness: style.metal
        });
        this.buildingWindowMaterials.push(mat);

        // Main Tower Body
        const geo = new THREE.BoxGeometry(width, height, depth);
        const building = new THREE.Mesh(geo, mat);
        building.position.y = height / 2;
        building.castShadow = true;
        building.receiveShadow = true;
        buildingGroup.add(building);

        // Tiered Setbacks & Penthouse on Taller Buildings
        if (height > 20) {
          const tierH = height * 0.3;
          const tierGeo = new THREE.BoxGeometry(width * 0.72, tierH, depth * 0.72);
          const tier = new THREE.Mesh(tierGeo, mat);
          tier.position.y = height + tierH / 2;
          tier.castShadow = true;
          buildingGroup.add(tier);

          // Helipad on Rooftop
          if (Math.random() > 0.4) {
            const padH = height + tierH + 0.2;
            const heliGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.25, 20);
            const heliMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
            const helipad = new THREE.Mesh(heliGeo, heliMat);
            helipad.position.y = padH;
            buildingGroup.add(helipad);

            // Glowing 'H' Mark Ring
            const ringGeo = new THREE.RingGeometry(1.6, 1.85, 20);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0xFBBF24, side: THREE.DoubleSide });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = padH + 0.15;
            buildingGroup.add(ring);
          }
        } else {
          // Rooftop HVAC Chiller units & Telecom Antenna
          const acGeo = new THREE.BoxGeometry(width * 0.45, 1.6, depth * 0.45);
          const acMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 });
          const ac = new THREE.Mesh(acGeo, acMat);
          ac.position.set(0, height + 0.8, 0);
          buildingGroup.add(ac);

          // Antenna with glowing red warning beacon
          const antGeo = new THREE.CylinderGeometry(0.08, 0.18, 6, 6);
          const antMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.8 });
          const ant = new THREE.Mesh(antGeo, antMat);
          ant.position.set(width * 0.25, height + 3, depth * 0.25);
          buildingGroup.add(ant);

          const beacon = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xEF4444 })
          );
          beacon.position.set(width * 0.25, height + 6.1, depth * 0.25);
          buildingGroup.add(beacon);
        }

        this.scene.add(buildingGroup);
      }
    });
  }

  buildMonorailSystem() {
    const trackGroup = new THREE.Group();

    // Loop Curve Points around the Smart City
    const trackCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-60, 9, -40),
      new THREE.Vector3(-15, 9, -50),
      new THREE.Vector3(45, 9, -35),
      new THREE.Vector3(55, 9, 15),
      new THREE.Vector3(20, 9, 50),
      new THREE.Vector3(-45, 9, 45),
      new THREE.Vector3(-65, 9, 0)
    ], true);

    this.monorailTrackCurve = trackCurve;
    this.monorailTrackPoints = trackCurve.getPoints(120);

    // Track Rail Geometry
    const tubeGeo = new THREE.TubeGeometry(trackCurve, 120, 0.6, 8, true);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x64748B,
      metalness: 0.8,
      roughness: 0.2
    });
    const trackMesh = new THREE.Mesh(tubeGeo, tubeMat);
    trackMesh.castShadow = true;
    trackGroup.add(trackMesh);

    // Concrete Support Pillars
    for (let i = 0; i < 18; i++) {
      const pt = trackCurve.getPoint(i / 18);
      const pillarGeo = new THREE.CylinderGeometry(0.7, 0.9, pt.y, 12);
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0xCBD5E1, roughness: 0.6 });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(pt.x, pt.y / 2, pt.z);
      pillar.castShadow = true;
      trackGroup.add(pillar);
    }

    // High-Speed Sleek Maglev Train
    const trainGroup = new THREE.Group();

    // 3 Linked Carriages
    for (let c = -1; c <= 1; c++) {
      const carGeo = new THREE.BoxGeometry(6.5, 1.8, 1.9);
      const carMat = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        metalness: 0.5,
        roughness: 0.2
      });
      const carriage = new THREE.Mesh(carGeo, carMat);
      carriage.position.x = c * 7.2;
      carriage.castShadow = true;
      trainGroup.add(carriage);

      // Glowing Cyan Windows
      const winGeo = new THREE.BoxGeometry(5.8, 0.6, 2.02);
      const winMat = new THREE.MeshBasicMaterial({ color: 0x00D2FF });
      const win = new THREE.Mesh(winGeo, winMat);
      win.position.x = c * 7.2;
      trainGroup.add(win);
    }

    this.monorailTrain = trainGroup;
    this.scene.add(trackGroup);
    this.scene.add(trainGroup);
  }

  buildParksAndFoliage() {
    const parkMat = new THREE.MeshStandardMaterial({ color: 0x22C55E, roughness: 0.9 });

    const parkZones = [
      { x: -2, z: 2, w: 13, d: 13 },
      { x: -20, z: -2, w: 9, d: 9 },
      { x: 20, z: 20, w: 10, d: 10 }
    ];

    parkZones.forEach(p => {
      const park = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.d), parkMat);
      park.rotation.x = -Math.PI / 2;
      park.position.set(p.x, 0.035, p.z);
      this.scene.add(park);

      // Stylized Realistic Foliage Trees (Conifers & Deciduous)
      for (let t = 0; t < 7; t++) {
        const tx = p.x + (Math.random() - 0.5) * (p.w - 2.5);
        const tz = p.z + (Math.random() - 0.5) * (p.d - 2.5);
        this.createDetailedTree(tx, tz, Math.random() > 0.4);
      }
    });
  }

  createDetailedTree(x, z, isPine) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, 0, z);

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 1.4, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.7;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    if (isPine) {
      // 3-tiered pine foliage
      [1.6, 2.5, 3.3].forEach((h, idx) => {
        const rad = 1.3 - idx * 0.35;
        const pineGeo = new THREE.ConeGeometry(rad, 1.2, 7);
        const pineMat = new THREE.MeshStandardMaterial({ color: 0x15803D, roughness: 0.8 });
        const layer = new THREE.Mesh(pineGeo, pineMat);
        layer.position.y = h;
        layer.castShadow = true;
        treeGroup.add(layer);
      });
    } else {
      // Round deciduous lush tree
      const leafGeo = new THREE.DodecahedronGeometry(1.2, 1);
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x4ADE80, roughness: 0.75 });
      const foliage = new THREE.Mesh(leafGeo, leafMat);
      foliage.position.y = 2.3;
      foliage.scale.set(1.1, 1.2, 1.1);
      foliage.castShadow = true;
      treeGroup.add(foliage);
    }

    this.scene.add(treeGroup);
  }

  syncWithDataset() {
    const currentServices = this.graph.getAllServices();
    const currentIds = new Set(currentServices.map((s) => s.service_id));
    const existingIds = new Set(this.serviceMeshes.keys());

    // Check if building count or service IDs changed
    let needsFullRebuild = currentIds.size !== existingIds.size;
    if (!needsFullRebuild) {
      for (const id of currentIds) {
        if (!existingIds.has(id)) {
          needsFullRebuild = true;
          break;
        }
      }
    }

    if (needsFullRebuild) {
      this.rebuildServiceLandmarksAndSplines(currentServices);
    } else {
      this.updateServiceVisuals();
    }
  }

  buildServiceLandmarks() {
    this.rebuildServiceLandmarksAndSplines(this.graph.getAllServices());
  }

  rebuildServiceLandmarksAndSplines(services) {
    // 1. Cleanly dispose and remove all existing service landmark meshes
    this.serviceMeshes.forEach((group) => {
      this.scene.remove(group);
      group.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    });
    this.serviceMeshes.clear();
    this.servicePins.clear();

    // 2. Cleanly dispose and remove all existing dependency splines
    this.dependencyLines.forEach((item) => {
      if (item.line) {
        this.scene.remove(item.line);
        if (item.line.geometry) item.line.geometry.dispose();
        if (item.line.material) item.line.material.dispose();
      }
      if (item.particles) {
        this.scene.remove(item.particles);
        if (item.particles.geometry) item.particles.geometry.dispose();
        if (item.particles.material) item.particles.material.dispose();
      }
    });
    this.dependencyLines = [];

    // 3. Smart Coordinate Placement Generator for uploaded datasets
    // If coordinates are missing, (0,0,0), or overlapping, distribute them across the 3D grid
    const totalCount = services.length;
    services.forEach((service, index) => {
      if (
        !service.coordinates ||
        (service.coordinates.x === 0 && service.coordinates.z === 0) ||
        isNaN(service.coordinates.x) ||
        isNaN(service.coordinates.z)
      ) {
        const ring = Math.floor(index / 8);
        const ringRadius = 26 + ring * 22;
        const countInRing = Math.min(8, totalCount - ring * 8);
        const angle = (index % 8) * (Math.PI * 2 / countInRing) + ring * 0.4;
        service.coordinates = {
          x: Math.round(Math.cos(angle) * ringRadius),
          y: 0,
          z: Math.round(Math.sin(angle) * ringRadius)
        };
      }
    });

    // 4. Build fresh landmark structures for all N services in dataset
    services.forEach((service) => {
      const group = new THREE.Group();
      group.position.set(service.coordinates.x, service.coordinates.y || 0, service.coordinates.z);
      group.userData = { serviceId: service.service_id, isServiceNode: true };

      // Base Landmark Pad
      const padGeo = new THREE.CylinderGeometry(7.0, 7.8, 0.7, 32);
      const padMat = new THREE.MeshStandardMaterial({
        color: 0x0F172A,
        metalness: 0.5,
        roughness: 0.25
      });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.y = 0.35;
      pad.receiveShadow = true;
      group.add(pad);

      // Glowing Hologram Base Ring
      const ringGeo = new THREE.TorusGeometry(7.2, 0.28, 16, 48);
      const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(service.badge_color || 0x00D2FF) });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.72;
      ring.userData = { isStatusRing: true };
      group.add(ring);

      // Custom Landmark Building by Category / Custom procedural
      this.createLandmarkStructure(service, group);

      // 3D Floating Beacon / Holographic Status Pin
      const pinGroup = this.createStatusPin(service);
      pinGroup.position.set(0, 18, 0);
      group.add(pinGroup);
      this.servicePins.set(service.service_id, pinGroup);

      this.scene.add(group);
      this.serviceMeshes.set(service.service_id, group);
    });

    // 5. Rebuild Dependency Splines
    this.buildDependencySplines();

    // 6. Camera Auto-Frame
    if (services.length > 0) {
      let minX = Infinity,
        maxX = -Infinity,
        minZ = Infinity,
        maxZ = -Infinity;
      services.forEach((s) => {
        minX = Math.min(minX, s.coordinates.x);
        maxX = Math.max(maxX, s.coordinates.x);
        minZ = Math.min(minZ, s.coordinates.z);
        maxZ = Math.max(maxZ, s.coordinates.z);
      });
      const span = Math.max(maxX - minX, maxZ - minZ, 60);
      const camDist = Math.max(100, span * 1.35);
      this.animateCameraTo(new THREE.Vector3(0, camDist * 0.7, camDist), new THREE.Vector3(0, 0, 0), 1000);
    }
  }

  updateServiceVisuals() {
    const services = this.graph.getAllServices();

    services.forEach((service) => {
      const pin = this.servicePins.get(service.service_id);
      if (pin && pin.userData) {
        const color = this.getStatusColor(service.status);
        if (pin.userData.diamond) {
          pin.userData.diamond.material.color.setHex(color);
          pin.userData.diamond.material.emissive.setHex(color);
        }
        if (pin.userData.ring) {
          pin.userData.ring.material.color.setHex(color);
        }
      }

      const meshGroup = this.serviceMeshes.get(service.service_id);
      if (meshGroup) {
        meshGroup.traverse((child) => {
          if (child.isMesh && child.userData && child.userData.isStatusRing) {
            child.material.color.setHex(this.getStatusColor(service.status));
          }
        });
      }
    });

    // Update dependency lines
    this.dependencyLines.forEach((item) => {
      const source = this.graph.getService(item.sourceId);
      const target = this.graph.getService(item.targetId);
      if (!source || !target) return;

      const isFailure = source.status === 'Failed' || target.status === 'Failed';
      const isDegraded = source.status === 'Degraded' || target.status === 'Degraded';
      const lineColor = isFailure ? 0xEF4444 : isDegraded ? 0xF59E0B : 0x00D2FF;

      if (item.line && item.line.material) {
        item.line.material.color.setHex(lineColor);
      }
      if (item.particles && item.particles.material) {
        item.particles.material.color.setHex(lineColor);
      }
    });
  }

  createLandmarkStructure(service, group) {
    const id = (service.service_id || '').toUpperCase();
    const cat = (service.category || '').toLowerCase();
    const badgeColor = service.badge_color || '#00D2FF';

    if (id.includes('PWR') || cat.includes('energy') || cat.includes('power')) {
      // Power Grid Substation: High-voltage core + cooling coils + solar canopy
      const mainCore = new THREE.Mesh(
        new THREE.BoxGeometry(6.5, 9.5, 6.5),
        new THREE.MeshStandardMaterial({ color: 0xFF2E93, metalness: 0.7, roughness: 0.2 })
      );
      mainCore.position.y = 5.1;
      mainCore.castShadow = true;
      group.add(mainCore);

      [-2.4, 0, 2.4].forEach((offset) => {
        const coil = new THREE.Mesh(
          new THREE.CylinderGeometry(0.85, 0.85, 13, 16),
          new THREE.MeshStandardMaterial({ color: 0xFB7185, metalness: 0.85, roughness: 0.1 })
        );
        coil.position.set(offset, 6.5, 2.5);
        coil.castShadow = true;
        group.add(coil);
      });
    } else if (id.includes('WTR') || cat.includes('water')) {
      // Water Purification Works: Dual circular reservoirs + central filtration tower
      [-2.6, 2.6].forEach((xOff) => {
        const pool = new THREE.Mesh(
          new THREE.CylinderGeometry(2.6, 2.6, 2.8, 28),
          new THREE.MeshStandardMaterial({ color: 0x00D2FF, metalness: 0.8, roughness: 0.1, transparent: true, opacity: 0.92 })
        );
        pool.position.set(xOff, 1.6, 0);
        pool.castShadow = true;
        group.add(pool);
      });

      const pumpBuilding = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 6.5, 3.5),
        new THREE.MeshStandardMaterial({ color: 0x0284C7, metalness: 0.4 })
      );
      pumpBuilding.position.set(0, 3.6, -2.6);
      pumpBuilding.castShadow = true;
      group.add(pumpBuilding);
    } else if (id.includes('TEL') || cat.includes('telecom') || cat.includes('comm')) {
      // 5G Telecom Communications Tower: High-gain lattice + microwave satellite dishes
      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 2.0, 20, 8),
        new THREE.MeshStandardMaterial({ color: 0x0EA5E9, metalness: 0.85, roughness: 0.15 })
      );
      tower.position.y = 10;
      tower.castShadow = true;
      group.add(tower);

      [9, 13, 17].forEach((h) => {
        const dish = new THREE.Mesh(
          new THREE.TorusGeometry(1.8, 0.18, 12, 24),
          new THREE.MeshBasicMaterial({ color: 0x38BDF8 })
        );
        dish.rotation.x = Math.PI / 2;
        dish.position.y = h;
        group.add(dish);
      });
    } else if (id.includes('HOS') || cat.includes('health') || cat.includes('med')) {
      // Smart Medical Center: Main hospital wing + active rooftop helipad
      const mainBuilding = new THREE.Mesh(
        new THREE.BoxGeometry(8.5, 11, 6.5),
        new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.15, metalness: 0.1 })
      );
      mainBuilding.position.y = 5.8;
      mainBuilding.castShadow = true;
      group.add(mainBuilding);

      const helipad = new THREE.Mesh(
        new THREE.CylinderGeometry(2.8, 2.8, 0.4, 24),
        new THREE.MeshStandardMaterial({ color: 0xEF4444 })
      );
      helipad.position.set(0, 11.5, 0);
      group.add(helipad);
    } else if (id.includes('TRF') || cat.includes('traffic') || cat.includes('signal')) {
      // Traffic AI Command Center: Geodesic dome + rotating radar satellite
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(3.8, 28, 20, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.6, roughness: 0.2 })
      );
      dome.position.y = 0.5;
      dome.castShadow = true;
      group.add(dome);

      const radar = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 7.5, 1.4),
        new THREE.MeshStandardMaterial({ color: 0xD97706, metalness: 0.7 })
      );
      radar.position.set(2.6, 4.2, 2.6);
      group.add(radar);
    } else if (id.includes('TRN') || cat.includes('transit') || cat.includes('metro') || cat.includes('rail')) {
      // Central Metro Terminal: Curved glass canopy
      const station = new THREE.Mesh(
        new THREE.CylinderGeometry(4.5, 4.5, 9, 20, 1, false, 0, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0xF97316, metalness: 0.5, roughness: 0.2, side: THREE.DoubleSide })
      );
      station.rotation.z = Math.PI / 2;
      station.position.y = 3.5;
      station.castShadow = true;
      group.add(station);
    } else if (id.includes('EMG') || cat.includes('emergency') || cat.includes('police') || cat.includes('fire')) {
      // Emergency Command HQ: Dual bay garage + rotating siren beacon
      const station = new THREE.Mesh(
        new THREE.BoxGeometry(8, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0xE11D48, roughness: 0.25 })
      );
      station.position.y = 4.3;
      station.castShadow = true;
      group.add(station);

      const siren = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xFF0033 })
      );
      siren.position.set(0, 8.8, 0);
      group.add(siren);
    } else if (id.includes('GOV') || cat.includes('gov') || cat.includes('civic') || cat.includes('admin')) {
      // Civic / Government Municipal Spire
      const tower = new THREE.Mesh(
        new THREE.BoxGeometry(7, 15, 6),
        new THREE.MeshStandardMaterial({ color: 0x10B981, metalness: 0.5, roughness: 0.2 })
      );
      tower.position.y = 7.8;
      tower.castShadow = true;
      group.add(tower);
    } else if (id.includes('FIN') || cat.includes('fin') || cat.includes('bank')) {
      // Financial Crystalline Skyscraper
      const finTower = new THREE.Mesh(
        new THREE.CylinderGeometry(3.5, 4.5, 18, 6),
        new THREE.MeshStandardMaterial({ color: 0xFBBF24, metalness: 0.75, roughness: 0.15 })
      );
      finTower.position.y = 9;
      finTower.castShadow = true;
      group.add(finTower);
    } else if (id.includes('DAT') || cat.includes('data') || cat.includes('cloud')) {
      // Modular Datacenter Cube
      const dataCube = new THREE.Mesh(
        new THREE.BoxGeometry(7.5, 8, 7.5),
        new THREE.MeshStandardMaterial({ color: 0x06B6D4, metalness: 0.6, roughness: 0.2 })
      );
      dataCube.position.y = 4;
      dataCube.castShadow = true;
      group.add(dataCube);
    } else {
      // Generic High-Tech Procedural Landmark (for custom uploaded services)
      const colorHex = parseInt(badgeColor.replace('#', '0x'), 16) || 0x00D2FF;
      const customTower = new THREE.Mesh(
        new THREE.BoxGeometry(6.5, 14, 6.5),
        new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.6, roughness: 0.2 })
      );
      customTower.position.y = 7;
      customTower.castShadow = true;
      group.add(customTower);

      // Rooftop glowing crown beacon
      const crown = new THREE.Mesh(
        new THREE.RingGeometry(2.0, 2.5, 16),
        new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide })
      );
      crown.rotation.x = Math.PI / 2;
      crown.position.y = 14.2;
      group.add(crown);
    }
  }

  createStatusPin(service) {
    const group = new THREE.Group();

    // Floating Glowing Holographic Octahedron
    const diamondGeo = new THREE.OctahedronGeometry(1.3, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: this.getStatusColor(service.status),
      emissive: this.getStatusColor(service.status),
      emissiveIntensity: 0.8,
      metalness: 0.3,
      roughness: 0.1
    });
    const diamond = new THREE.Mesh(diamondGeo, diamondMat);
    group.add(diamond);

    // Glowing Concentric Pulse Rings
    const ringGeo = new THREE.RingGeometry(1.6, 1.95, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: this.getStatusColor(service.status),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    group.userData = { diamond, ring, serviceId: service.service_id };
    return group;
  }

  getStatusColor(status) {
    switch (status) {
      case "Operational": return 0x10B981; // Green
      case "Degraded": return 0xF59E0B;   // Yellow/Amber
      case "Failed": return 0xEF4444;     // Red
      case "Recovering": return 0xD946EF; // Magenta
      default: return 0x0EA5E9;
    }
  }

  buildDependencySplines() {
    this.dependencyLines.forEach(item => {
      this.scene.remove(item.line);
      this.scene.remove(item.particles);
    });
    this.dependencyLines = [];

    const services = this.graph.getAllServices();

    services.forEach(source => {
      (source.connected_services || []).forEach(edge => {
        const target = this.graph.getService(edge.target_id);
        if (!target) return;

        const start = new THREE.Vector3(source.coordinates.x, 2.5, source.coordinates.z);
        const end = new THREE.Vector3(target.coordinates.x, 2.5, target.coordinates.z);

        const dist = start.distanceTo(end);
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mid.y += Math.min(20, Math.max(6, dist * 0.26));

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const points = curve.getPoints(40);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const isFailure = source.status === "Failed" || target.status === "Failed";
        const isDegraded = source.status === "Degraded" || target.status === "Degraded";

        const lineColor = isFailure ? 0xEF4444 : isDegraded ? 0xF59E0B : 0x00D2FF;

        const material = new THREE.LineBasicMaterial({
          color: lineColor,
          linewidth: 2,
          transparent: true,
          opacity: 0.8
        });

        const line = new THREE.Line(geometry, material);
        this.scene.add(line);

        // Animated Energy / Telemetry Data Pulse
        const particleGeo = new THREE.SphereGeometry(0.45, 8, 8);
        const particleMat = new THREE.MeshBasicMaterial({ color: lineColor });
        const particle = new THREE.Mesh(particleGeo, particleMat);
        this.scene.add(particle);

        this.dependencyLines.push({
          line,
          particles: particle,
          curve,
          sourceId: source.service_id,
          targetId: target.service_id,
          strength: edge.strength,
          progress: Math.random()
        });
      });
    });
  }

  initAtmosphericParticles() {
    // Floating glowing dust motes in the atmosphere
    const count = 180;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 180;
      positions[i + 1] = 4 + Math.random() * 45;
      positions[i + 2] = (Math.random() - 0.5) * 180;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x38BDF8,
      size: 0.8,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });

    this.atmosphericParticles = new THREE.Points(geo, mat);
    this.scene.add(this.atmosphericParticles);
  }

  initVehicles() {
    const vehicleConfigs = [
      { type: 'car', color: 0xFF2E93, w: 1.6, h: 0.7, d: 0.9 },
      { type: 'car', color: 0x00D2FF, w: 1.6, h: 0.7, d: 0.9 },
      { type: 'bus', color: 0x3B82F6, w: 3.2, h: 1.1, d: 1.2 },
      { type: 'truck', color: 0xF59E0B, w: 2.6, h: 1.3, d: 1.1 },
      { type: 'car', color: 0x10B981, w: 1.6, h: 0.7, d: 0.9 },
      { type: 'emergency', color: 0xEF4444, w: 2.0, h: 0.9, d: 1.0 }
    ];

    for (let i = 0; i < 20; i++) {
      const cfg = vehicleConfigs[i % vehicleConfigs.length];
      const vehicleGroup = new THREE.Group();

      const bodyGeo = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d);
      const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.3, metalness: 0.2 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;
      vehicleGroup.add(body);

      // Glowing Headlights
      const headGeo = new THREE.BoxGeometry(0.1, 0.2, cfg.d * 0.7);
      const headMat = new THREE.MeshBasicMaterial({ color: 0xFEF08A });
      const headlight = new THREE.Mesh(headGeo, headMat);
      headlight.position.set(cfg.w / 2, 0, 0);
      vehicleGroup.add(headlight);

      // Red Glowing Taillights
      const tailGeo = new THREE.BoxGeometry(0.1, 0.2, cfg.d * 0.7);
      const tailMat = new THREE.MeshBasicMaterial({ color: 0xEF4444 });
      const taillight = new THREE.Mesh(tailGeo, tailMat);
      taillight.position.set(-cfg.w / 2, 0, 0);
      vehicleGroup.add(taillight);

      this.scene.add(vehicleGroup);

      const isHorizontal = i % 2 === 0;
      const lane = (i % 4 - 1.5) * 20;

      this.vehicles.push({
        mesh: vehicleGroup,
        isHorizontal,
        lane,
        speed: 0.16 + Math.random() * 0.14,
        progress: (i / 20) * 180 - 90,
        direction: Math.random() > 0.5 ? 1 : -1
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DYNAMIC SIMULATION & SHOCKWAVES
  // ─────────────────────────────────────────────────────────────────────────

  triggerCascadeShockwave(serviceId) {
    const service = this.graph.getService(serviceId);
    if (!service) return;

    const ringGeo = new THREE.RingGeometry(1.2, 3.2, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xEF4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const shockwave = new THREE.Mesh(ringGeo, ringMat);
    shockwave.rotation.x = Math.PI / 2;
    shockwave.position.set(service.coordinates.x, 0.5, service.coordinates.z);
    this.scene.add(shockwave);

    this.shockwaves.push({
      mesh: shockwave,
      maxRadius: 45,
      currentScale: 1,
      speed: 26,
      opacity: 1
    });
  }

  updateServiceVisuals() {
    const services = this.graph.getAllServices();

    services.forEach(service => {
      const pin = this.servicePins.get(service.service_id);
      if (pin && pin.userData) {
        const color = new THREE.Color(this.getStatusColor(service.status));
        pin.userData.diamond.material.color = color;
        pin.userData.diamond.material.emissive = color;
        pin.userData.ring.material.color = color;

        if (service.status === "Failed") {
          this.triggerCascadeShockwave(service.service_id);
        }
      }
    });

    this.buildDependencySplines();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CAMERA TRANSITIONS & PRESETS
  // ─────────────────────────────────────────────────────────────────────────

  setPresetView(presetKey) {
    if (this.isTourMode && presetKey !== 'tour') {
      this.isTourMode = false;
      if (this.onTourStateChange) this.onTourStateChange(false);
    }

    switch (presetKey) {
      case 'overview':
        this.animateCameraTo(new THREE.Vector3(0, 80, 115), new THREE.Vector3(0, 0, 0));
        break;
      case 'isometric-north':
        this.animateCameraTo(new THREE.Vector3(85, 65, 85), new THREE.Vector3(0, 0, 0));
        break;
      case 'isometric-south':
        this.animateCameraTo(new THREE.Vector3(-85, 65, -85), new THREE.Vector3(0, 0, 0));
        break;
      case 'topdown':
        this.animateCameraTo(new THREE.Vector3(0, 135, 2), new THREE.Vector3(0, 0, 0));
        break;
      case 'street':
        this.animateCameraTo(new THREE.Vector3(26, 9, 36), new THREE.Vector3(0, 4, 0));
        break;
      case 'tour':
        this.isTourMode = !this.isTourMode;
        if (this.onTourStateChange) this.onTourStateChange(this.isTourMode);
        break;
    }
  }

  animateCameraTo(targetPosition, targetLookAt, duration = 1200) {
    this.cameraTween = {
      startPos: this.camera.position.clone(),
      endPos: targetPosition.clone(),
      startLook: this.controls.target.clone(),
      endLook: targetLookAt.clone(),
      startTime: performance.now(),
      duration
    };
  }

  focusOnService(serviceId) {
    const service = this.graph.getService(serviceId);
    if (!service) return;

    this.selectedServiceId = serviceId;
    const destTarget = new THREE.Vector3(service.coordinates.x, 3, service.coordinates.z);
    const destPos = new THREE.Vector3(
      service.coordinates.x + 28,
      30,
      service.coordinates.z + 34
    );

    this.animateCameraTo(destPos, destTarget, 1000);
    this.updateServiceVisuals();
  }

  resetOverviewCamera() {
    this.selectedServiceId = null;
    this.setPresetView('overview');
  }

  setLandingMode(isLanding) {
    this.isLandingMode = isLanding;
    if (isLanding) {
      this.animateCameraTo(new THREE.Vector3(0, 68, 120), new THREE.Vector3(0, 0, 0));
    } else {
      this.resetOverviewCamera();
    }
  }

  zoomIn() {
    const dir = new THREE.Vector3().subVectors(this.controls.target, this.camera.position).normalize();
    this.camera.position.addScaledVector(dir, 14);
    this.controls.update();
  }

  zoomOut() {
    const dir = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize();
    this.camera.position.addScaledVector(dir, 14);
    this.controls.update();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EVENT BINDINGS & RAYCASTING
  // ─────────────────────────────────────────────────────────────────────────

  bindEvents() {
    this.onResize = () => {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };
    window.addEventListener('resize', this.onResize);

    // Mouse Move for Raycaster & Floating Tooltip
    this.onMouseMove = (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.checkRaycastHover(e);
    };
    this.container.addEventListener('mousemove', this.onMouseMove);

    // Mouse Click for Service Selection
    this.onClick = (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);

      for (const hit of intersects) {
        let current = hit.object;
        while (current && current !== this.scene) {
          if (current.userData && current.userData.serviceId) {
            const id = current.userData.serviceId;
            this.focusOnService(id);
            if (this.onSelectService) this.onSelectService(id);
            return;
          }
          current = current.parent;
        }
      }
    };
    this.container.addEventListener('click', this.onClick);
  }

  checkRaycastHover(mouseEvent) {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    let foundServiceId = null;

    for (const hit of intersects) {
      let current = hit.object;
      while (current && current !== this.scene) {
        if (current.userData && current.userData.serviceId) {
          foundServiceId = current.userData.serviceId;
          break;
        }
        current = current.parent;
      }
      if (foundServiceId) break;
    }

    if (foundServiceId !== this.hoveredServiceId) {
      this.hoveredServiceId = foundServiceId;
      this.container.style.cursor = foundServiceId ? 'pointer' : 'default';

      if (this.onHoverService) {
        const service = foundServiceId ? this.graph.getService(foundServiceId) : null;
        this.onHoverService(service, { clientX: mouseEvent.clientX, clientY: mouseEvent.clientY });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ANIMATION TICK LOOP
  // ─────────────────────────────────────────────────────────────────────────

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Camera Tween Interpolation or OrbitControls
    if (this.cameraTween) {
      const now = performance.now();
      const elapsed = now - this.cameraTween.startTime;
      const t = Math.min(1, elapsed / this.cameraTween.duration);
      // Smooth cubic ease-in-out
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      this.camera.position.lerpVectors(this.cameraTween.startPos, this.cameraTween.endPos, ease);
      this.controls.target.lerpVectors(this.cameraTween.startLook, this.cameraTween.endLook, ease);
      this.controls.update();

      if (t >= 1) this.cameraTween = null;
    } else if (this.isTourMode || this.isLandingMode) {
      // Cinematic continuous drone orbit around the perimeter
      const radius = 115;
      const angle = elapsedTime * 0.075;
      this.camera.position.x = Math.sin(angle) * radius;
      this.camera.position.z = Math.cos(angle) * radius;
      this.camera.position.y = 70 + Math.sin(elapsedTime * 0.4) * 8;
      this.controls.target.set(0, 3, 0);
      this.controls.update();
    } else {
      this.controls.update();
    }

    if (!this.isPaused) {
      // 2. Animate Water Canal Waves
      if (this.waterMesh) {
        this.waterMesh.position.y = 0.05 + Math.sin(elapsedTime * 2.2) * 0.035;
      }

      // 3. Animate Service Floating Beacon Pins
      this.servicePins.forEach(pinGroup => {
        if (pinGroup) {
          pinGroup.position.y = 18 + Math.sin(elapsedTime * 3 + pinGroup.position.x) * 0.9;
          pinGroup.rotation.y = elapsedTime * 1.6;
        }
      });

      // 4. Animate Monorail Maglev Train along Track
      if (this.monorailTrain && this.monorailTrackCurve) {
        this.monorailProgress = (this.monorailProgress + delta * 0.045) % 1.0;
        const pt = this.monorailTrackCurve.getPoint(this.monorailProgress);
        const tangent = this.monorailTrackCurve.getTangent(this.monorailProgress);

        this.monorailTrain.position.copy(pt);
        this.monorailTrain.position.y += 0.8;
        this.monorailTrain.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tangent);
      }

      // 5. Animate Atmospheric Floating Particles
      if (this.atmosphericParticles) {
        this.atmosphericParticles.rotation.y = elapsedTime * 0.02;
      }

      // 6. Animate Dependency Spline Particles
      this.dependencyLines.forEach(item => {
        item.progress = (item.progress + delta * (0.28 * item.strength + 0.12)) % 1.0;
        const pt = item.curve.getPoint(item.progress);
        item.particles.position.copy(pt);
      });

      // 7. Animate Moving Vehicles
      this.vehicles.forEach(v => {
        v.progress += v.speed * v.direction;
        if (v.progress > 95) v.progress = -95;
        if (v.progress < -95) v.progress = 95;

        if (v.isHorizontal) {
          v.mesh.position.set(v.progress, 0.45, v.lane);
          v.mesh.rotation.y = v.direction > 0 ? 0 : Math.PI;
        } else {
          v.mesh.position.set(v.lane, 0.45, v.progress);
          v.mesh.rotation.y = v.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
        }
      });

      // 8. Animate Shockwaves
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.currentScale += delta * sw.speed;
        sw.mesh.scale.set(sw.currentScale, sw.currentScale, 1);
        sw.opacity = Math.max(0, 1 - sw.currentScale / sw.maxRadius);
        sw.mesh.material.opacity = sw.opacity;

        if (sw.opacity <= 0.01) {
          this.scene.remove(sw.mesh);
          this.shockwaves.splice(i, 1);
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.unsubscribeGraph) this.unsubscribeGraph();
    window.removeEventListener('resize', this.onResize);
    if (this.controls) this.controls.dispose();
    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
