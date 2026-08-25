/**
 * CASCADYN - 3D Smart City Visualization Engine (Three.js)
 * Implements procedural vibrant smart city, animated vehicles, water shader,
 * 3D service landmarks, glowing dependency arcs, and raycaster interaction.
 */

import * as THREE from 'three';

export class City3DScene {
  constructor(containerElement, graph, onSelectService) {
    this.container = containerElement;
    this.graph = graph;
    this.onSelectService = onSelectService;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.serviceMeshes = new Map();     // service_id -> THREE.Group
    this.servicePins = new Map();       // service_id -> THREE.Mesh
    this.dependencyLines = [];          // Array of { line, sourceId, targetId, particles, points }
    this.vehicles = [];                 // Array of { mesh, path, speed, progress }
    this.shockwaves = [];               // Array of { mesh, maxRadius, currentRadius, speed }
    this.waterMesh = null;
    this.metroTrain = null;

    this.selectedServiceId = null;
    this.hoveredServiceId = null;

    this.isLandingMode = true;
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.cameraPosition = new THREE.Vector3(0, 70, 95);

    this.clock = new THREE.Clock();
    this.animationFrameId = null;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xF1F5F9); // Light crisp background
    this.scene.fog = new THREE.FogExp2(0xF1F5F9, 0.0055);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 1000);
    this.camera.position.set(0, 85, 110);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting - Vibrant, high-contrast, clean futuristic daylight
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.85);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xFFF7ED, 1.25);
    dirLight.position.set(60, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 250;
    dirLight.shadow.camera.left = -90;
    dirLight.shadow.camera.right = 90;
    dirLight.shadow.camera.top = 90;
    dirLight.shadow.camera.bottom = -90;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0xE0F2FE, 0xFEF3C7, 0.6);
    this.scene.add(hemiLight);

    // Accent pink/cyan rim lights
    const magentaRim = new THREE.PointLight(0xFF2E93, 1.5, 120);
    magentaRim.position.set(-50, 30, -50);
    this.scene.add(magentaRim);

    const cyanRim = new THREE.PointLight(0x00D2FF, 1.2, 120);
    cyanRim.position.set(50, 30, 50);
    this.scene.add(cyanRim);

    // 5. Build Environment
    this.buildGroundAndRiver();
    this.buildRoadNetwork();
    this.buildProceduralCityBuildings();
    this.buildParksAndTrees();
    this.buildServiceLandmarks();
    this.buildDependencySplines();
    this.initVehicles();

    // 6. Event Listeners
    this.bindEvents();

    // 7. Subscribe to Graph changes
    this.unsubscribeGraph = this.graph.subscribe(() => {
      this.updateServiceVisuals();
    });

    // 8. Animation Loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  buildGroundAndRiver() {
    // Main city island base
    const groundGeo = new THREE.PlaneGeometry(240, 240);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xE2E8F0,
      roughness: 0.85,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Grid pattern overlay
    const gridHelper = new THREE.GridHelper(220, 44, 0xCBD5E1, 0xE2E8F0);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);

    // River / Water System (Curving water channel)
    const waterGeo = new THREE.PlaneGeometry(42, 240, 32, 32);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0EA5E9,
      roughness: 0.15,
      metalness: 0.8,
      transparent: true,
      opacity: 0.88
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.rotation.z = 0.18;
    this.waterMesh.position.set(-45, 0.05, 0);
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);

    // Water bridges
    [-40, 0, 40].forEach(z => {
      const bridgeGeo = new THREE.BoxGeometry(46, 1.2, 10);
      const bridgeMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.4 });
      const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
      bridge.position.set(-45, 0.8, z);
      bridge.castShadow = true;
      bridge.receiveShadow = true;
      this.scene.add(bridge);
    });
  }

  buildRoadNetwork() {
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7
    });

    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xFBBF24 });

    // Major Avenues (X & Z axes)
    const avenuePositions = [-30, -10, 10, 30];
    
    // East-West Roads
    avenuePositions.forEach(z => {
      const roadGeo = new THREE.PlaneGeometry(200, 6);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(0, 0.02, z);
      road.receiveShadow = true;
      this.scene.add(road);

      // Yellow Center Dash
      const dashGeo = new THREE.PlaneGeometry(190, 0.3);
      const dash = new THREE.Mesh(dashGeo, stripeMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.03, z);
      this.scene.add(dash);
    });

    // North-South Roads
    avenuePositions.forEach(x => {
      const roadGeo = new THREE.PlaneGeometry(6, 200);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(x, 0.02, 0);
      road.receiveShadow = true;
      this.scene.add(road);

      const dashGeo = new THREE.PlaneGeometry(0.3, 190);
      const dash = new THREE.Mesh(dashGeo, stripeMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(x, 0.03, 0);
      this.scene.add(dash);
    });
  }

  buildProceduralCityBuildings() {
    // Vibrant modern color palette for residential/commercial skyscrapers
    const buildingColors = [
      0x38BDF8, // Sky Blue
      0xF472B6, // Pink
      0xFB7185, // Rose
      0x34D399, // Emerald
      0xA78BFA, // Violet
      0xFBBF24, // Amber
      0xCBD5E1, // Pearl Silver
      0xE2E8F0  // Clean White
    ];

    const blocks = [
      { minX: -24, maxX: -14, minZ: -24, maxZ: -14 },
      { minX: -24, maxX: -14, minZ: -6, maxZ: 6 },
      { minX: -6, maxX: 6, minZ: -24, maxZ: -14 },
      { minX: -6, maxX: 6, minZ: 14, maxZ: 24 },
      { minX: 14, maxX: 24, minZ: -24, maxZ: -14 },
      { minX: 14, maxX: 24, minZ: -6, maxZ: 6 },
      { minX: -24, maxX: -14, minZ: 14, maxZ: 24 },
      { minX: 34, maxX: 48, minZ: -20, maxZ: 20 },
      { minX: -60, maxX: -48, minZ: -30, maxZ: 30 }
    ];

    blocks.forEach(block => {
      const count = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const width = 3 + Math.random() * 3.5;
        const depth = 3 + Math.random() * 3.5;
        const height = 8 + Math.random() * 22;
        
        const x = block.minX + Math.random() * (block.maxX - block.minX);
        const z = block.minZ + Math.random() * (block.maxZ - block.minZ);

        const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];
        const geo = new THREE.BoxGeometry(width, height, depth);
        const mat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.3,
          metalness: 0.25
        });

        const building = new THREE.Mesh(geo, mat);
        building.position.set(x, height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);

        // Rooftop feature (glass spire or AC cooling unit)
        if (Math.random() > 0.4) {
          const roofGeo = new THREE.BoxGeometry(width * 0.6, 1.8, depth * 0.6);
          const roofMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
          const roof = new THREE.Mesh(roofGeo, roofMat);
          roof.position.set(x, height + 0.9, z);
          this.scene.add(roof);
        }
      }
    });
  }

  buildParksAndTrees() {
    const parkMat = new THREE.MeshStandardMaterial({ color: 0x4ADE80, roughness: 0.9 });
    
    // Park zones
    const parkZones = [
      { x: -2, z: 2, w: 12, d: 12 },
      { x: -20, z: -2, w: 8, d: 8 }
    ];

    parkZones.forEach(p => {
      const park = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.d), parkMat);
      park.rotation.x = -Math.PI / 2;
      park.position.set(p.x, 0.03, p.z);
      this.scene.add(park);

      // Add low-poly stylized trees
      for (let t = 0; t < 6; t++) {
        const tx = p.x + (Math.random() - 0.5) * (p.w - 2);
        const tz = p.z + (Math.random() - 0.5) * (p.d - 2);
        this.createTree(tx, tz);
      }
    });
  }

  createTree(x, z) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 1.2, 5),
      new THREE.MeshStandardMaterial({ color: 0x78350F })
    );
    trunk.position.set(x, 0.6, z);
    trunk.castShadow = true;
    this.scene.add(trunk);

    const foliage = new THREE.Mesh(
      new THREE.ConeGeometry(1.1, 2.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x22C55E, roughness: 0.8 })
    );
    foliage.position.set(x, 2.2, z);
    foliage.castShadow = true;
    this.scene.add(foliage);
  }

  buildServiceLandmarks() {
    const services = this.graph.getAllServices();

    services.forEach(service => {
      const group = new THREE.Group();
      group.position.set(service.coordinates.x, service.coordinates.y, service.coordinates.z);
      group.userData = { serviceId: service.service_id, isServiceNode: true };

      // Base Landmark Pad
      const padGeo = new THREE.CylinderGeometry(6.5, 7.2, 0.6, 24);
      const padMat = new THREE.MeshStandardMaterial({
        color: 0x1E293B,
        metalness: 0.4,
        roughness: 0.3
      });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.y = 0.3;
      pad.receiveShadow = true;
      group.add(pad);

      // Glowing Base Ring
      const ringGeo = new THREE.TorusGeometry(6.6, 0.22, 12, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(service.badge_color || 0xFF2E93) });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.62;
      group.add(ring);

      // Custom Landmark Building by Category
      this.createLandmarkStructure(service, group);

      // 3D Floating Beacon / Status Pin
      const pinGroup = this.createStatusPin(service);
      pinGroup.position.set(0, 16, 0);
      group.add(pinGroup);
      this.servicePins.set(service.service_id, pinGroup);

      this.scene.add(group);
      this.serviceMeshes.set(service.service_id, group);
    });
  }

  createLandmarkStructure(service, group) {
    const id = service.service_id;

    if (id.includes("PWR")) {
      // Power Substation: Transformer core + 3 cooling coils + solar panels
      const mainCore = new THREE.Mesh(
        new THREE.BoxGeometry(6, 9, 6),
        new THREE.MeshStandardMaterial({ color: 0xFF2E93, metalness: 0.6, roughness: 0.2 })
      );
      mainCore.position.y = 4.8;
      mainCore.castShadow = true;
      group.add(mainCore);

      [-2.2, 0, 2.2].forEach(offset => {
        const coil = new THREE.Mesh(
          new THREE.CylinderGeometry(0.8, 0.8, 12, 16),
          new THREE.MeshStandardMaterial({ color: 0xFB7185, metalness: 0.8, roughness: 0.1 })
        );
        coil.position.set(offset, 6, 2.4);
        coil.castShadow = true;
        group.add(coil);
      });
    } 
    else if (id.includes("WTR")) {
      // Water Works: 2 circular treatment pools + central pumping facility
      [-2.5, 2.5].forEach(xOff => {
        const pool = new THREE.Mesh(
          new THREE.CylinderGeometry(2.4, 2.4, 2.5, 24),
          new THREE.MeshStandardMaterial({ color: 0x00D2FF, metalness: 0.7, roughness: 0.1, transparent: true, opacity: 0.9 })
        );
        pool.position.set(xOff, 1.4, 0);
        pool.castShadow = true;
        group.add(pool);
      });

      const pumpBuilding = new THREE.Mesh(
        new THREE.BoxGeometry(4, 6, 3),
        new THREE.MeshStandardMaterial({ color: 0x0284C7 })
      );
      pumpBuilding.position.set(0, 3.2, -2.5);
      pumpBuilding.castShadow = true;
      group.add(pumpBuilding);
    }
    else if (id.includes("TEL")) {
      // Telecom: Central transmission tower with microwave dishes & antennas
      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 1.8, 18, 8),
        new THREE.MeshStandardMaterial({ color: 0x0EA5E9, metalness: 0.8, roughness: 0.2 })
      );
      tower.position.y = 9;
      tower.castShadow = true;
      group.add(tower);

      // Antenna Dishes
      [8, 12, 15].forEach(h => {
        const dish = new THREE.Mesh(
          new THREE.TorusGeometry(1.6, 0.15, 8, 16),
          new THREE.MeshBasicMaterial({ color: 0x38BDF8 })
        );
        dish.rotation.x = Math.PI / 2;
        dish.position.y = h;
        group.add(dish);
      });
    }
    else if (id.includes("HOS")) {
      // Hospital: Multi-wing building + Helipad + Red Cross beacon
      const mainBuilding = new THREE.Mesh(
        new THREE.BoxGeometry(8, 10, 6),
        new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.2 })
      );
      mainBuilding.position.y = 5.2;
      mainBuilding.castShadow = true;
      group.add(mainBuilding);

      // Helipad on roof
      const helipad = new THREE.Mesh(
        new THREE.CylinderGeometry(2.5, 2.5, 0.4, 20),
        new THREE.MeshStandardMaterial({ color: 0xEF4444 })
      );
      helipad.position.set(0, 10.4, 0);
      group.add(helipad);
    }
    else if (id.includes("TRF")) {
      // Traffic Command Center: Modern curved dome + Radar sphere
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(3.6, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.5, roughness: 0.2 })
      );
      dome.position.y = 0.5;
      dome.castShadow = true;
      group.add(dome);

      const radar = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 7, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xD97706 })
      );
      radar.position.set(2.5, 4, 2.5);
      group.add(radar);
    }
    else if (id.includes("TRN")) {
      // Transit Station: Glass arched terminal + tracks
      const station = new THREE.Mesh(
        new THREE.CylinderGeometry(4, 4, 8, 16, 1, false, 0, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0xF97316, metalness: 0.4, roughness: 0.2, side: THREE.DoubleSide })
      );
      station.rotation.z = Math.PI / 2;
      station.position.y = 3;
      station.castShadow = true;
      group.add(station);

      // Mini Metro Train model
      const train = new THREE.Mesh(
        new THREE.BoxGeometry(7, 1.6, 2),
        new THREE.MeshStandardMaterial({ color: 0xFFFFFF, metalness: 0.7 })
      );
      train.position.set(0, 1.2, 0);
      group.add(train);
      this.metroTrain = train;
    }
    else if (id.includes("EMG")) {
      // Emergency Services: Fire & Rescue HQ with dual bay doors + siren beacon
      const station = new THREE.Mesh(
        new THREE.BoxGeometry(7.5, 7.5, 5.5),
        new THREE.MeshStandardMaterial({ color: 0xE11D48, roughness: 0.3 })
      );
      station.position.y = 4;
      station.castShadow = true;
      group.add(station);

      // Emergency Beacon light
      const siren = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xFF0033 })
      );
      siren.position.set(0, 8.2, 0);
      group.add(siren);
    }
    else {
      // Government / Municipal: Civic modern skyscraper with atrium
      const tower = new THREE.Mesh(
        new THREE.BoxGeometry(6.5, 14, 5.5),
        new THREE.MeshStandardMaterial({ color: 0x10B981, metalness: 0.4, roughness: 0.2 })
      );
      tower.position.y = 7.2;
      tower.castShadow = true;
      group.add(tower);
    }
  }

  createStatusPin(service) {
    const group = new THREE.Group();

    // Floating Glowing Diamond / Hexagon
    const diamondGeo = new THREE.OctahedronGeometry(1.2, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: this.getStatusColor(service.status),
      emissive: this.getStatusColor(service.status),
      emissiveIntensity: 0.7,
      metalness: 0.2,
      roughness: 0.1
    });
    const diamond = new THREE.Mesh(diamondGeo, diamondMat);
    group.add(diamond);

    // Glowing Pulse Ring around Diamond
    const ringGeo = new THREE.RingGeometry(1.5, 1.8, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: this.getStatusColor(service.status),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
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
      case "Degraded": return 0xF59E0B;   // Yellow/Orange
      case "Failed": return 0xEF4444;     // Red
      case "Recovering": return 0xD946EF; // Magenta
      default: return 0x0EA5E9;
    }
  }

  buildDependencySplines() {
    // Clear old lines
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
        
        // Arc peak height based on distance
        const dist = start.distanceTo(end);
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mid.y += Math.min(18, Math.max(5, dist * 0.25));

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const points = curve.getPoints(36);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const isFailure = source.status === "Failed" || target.status === "Failed";
        const isDegraded = source.status === "Degraded" || target.status === "Degraded";

        const lineColor = isFailure ? 0xEF4444 : isDegraded ? 0xF59E0B : 0x00D2FF;

        const material = new THREE.LineBasicMaterial({
          color: lineColor,
          linewidth: 2,
          transparent: true,
          opacity: 0.75
        });

        const line = new THREE.Line(geometry, material);
        this.scene.add(line);

        // Animated Energy/Data Particle on spline
        const particleGeo = new THREE.SphereGeometry(0.4, 8, 8);
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

  initVehicles() {
    // 16 vehicles traversing the avenue grid
    const carColors = [0xFF2E93, 0x00D2FF, 0xF59E0B, 0x10B981, 0xFFFFFF, 0x3B82F6];
    
    for (let i = 0; i < 16; i++) {
      const carGeo = new THREE.BoxGeometry(1.6, 0.7, 0.9);
      const carColor = carColors[i % carColors.length];
      const carMat = new THREE.MeshStandardMaterial({ color: carColor, roughness: 0.3 });
      const car = new THREE.Mesh(carGeo, carMat);
      
      // Headlights & Taillights
      const headlight = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.2, 0.7),
        new THREE.MeshBasicMaterial({ color: 0xFEF08A })
      );
      headlight.position.set(0.8, 0, 0);
      car.add(headlight);

      const taillight = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.2, 0.7),
        new THREE.MeshBasicMaterial({ color: 0xEF4444 })
      );
      taillight.position.set(-0.8, 0, 0);
      car.add(taillight);

      car.castShadow = true;
      this.scene.add(car);

      const isHorizontal = i % 2 === 0;
      const lane = (i % 4 - 1.5) * 20;

      this.vehicles.push({
        mesh: car,
        isHorizontal,
        lane,
        speed: 0.15 + Math.random() * 0.12,
        progress: (i / 16) * 160 - 80,
        direction: Math.random() > 0.5 ? 1 : -1
      });
    }
  }

  triggerCascadeShockwave(serviceId) {
    const service = this.graph.getService(serviceId);
    if (!service) return;

    const ringGeo = new THREE.RingGeometry(1, 2.5, 32);
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
      maxRadius: 40,
      currentScale: 1,
      speed: 24,
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

    // Refresh dependency line colors
    this.buildDependencySplines();
  }

  focusOnService(serviceId) {
    const service = this.graph.getService(serviceId);
    if (!service) return;

    this.selectedServiceId = serviceId;
    this.cameraTarget.set(service.coordinates.x, 2, service.coordinates.z);
    this.cameraPosition.set(
      service.coordinates.x + 25,
      28,
      service.coordinates.z + 32
    );

    this.updateServiceVisuals();
  }

  resetOverviewCamera() {
    this.selectedServiceId = null;
    this.cameraTarget.set(0, 0, 0);
    this.cameraPosition.set(0, 75, 100);
  }

  setLandingMode(isLanding) {
    this.isLandingMode = isLanding;
    if (isLanding) {
      this.cameraTarget.set(0, 0, 0);
      this.cameraPosition.set(0, 65, 115);
    } else {
      this.resetOverviewCamera();
    }
  }

  bindEvents() {
    // Window Resize
    this.onResize = () => {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };
    window.addEventListener('resize', this.onResize);

    // Mouse Move (Raycaster & Parallax)
    this.onMouseMove = (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Subtle Parallax during Landing Mode
      if (this.isLandingMode) {
        this.camera.position.x += (this.mouse.x * 12 - this.camera.position.x) * 0.03;
      }

      this.checkRaycastHover();
    };
    this.container.addEventListener('mousemove', this.onMouseMove);

    // Mouse Click (Service Selection)
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

  checkRaycastHover() {
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
    }
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Smooth Camera Interpolation
    if (!this.isLandingMode) {
      this.camera.position.lerp(this.cameraPosition, 0.05);
      const currentLookAt = new THREE.Vector3(0, 0, 0);
      this.camera.getWorldDirection(currentLookAt);
      this.camera.lookAt(this.cameraTarget);
    } else {
      // Gentle floating orbit in landing page
      const radius = 110;
      const angle = elapsedTime * 0.08;
      this.camera.position.x = Math.sin(angle) * radius;
      this.camera.position.z = Math.cos(angle) * radius;
      this.camera.position.y = 65 + Math.sin(elapsedTime * 0.5) * 6;
      this.camera.lookAt(0, 4, 0);
    }

    // 2. Animate Water Waves
    if (this.waterMesh) {
      this.waterMesh.position.y = 0.05 + Math.sin(elapsedTime * 2) * 0.03;
    }

    // 3. Animate Service Floating Pins
    this.servicePins.forEach(pinGroup => {
      if (pinGroup) {
        pinGroup.position.y = 16 + Math.sin(elapsedTime * 3 + pinGroup.position.x) * 0.8;
        pinGroup.rotation.y = elapsedTime * 1.5;
      }
    });

    // 4. Animate Dependency Spline Particles
    this.dependencyLines.forEach(item => {
      item.progress = (item.progress + delta * (0.25 * item.strength + 0.1)) % 1.0;
      const pt = item.curve.getPoint(item.progress);
      item.particles.position.copy(pt);
    });

    // 5. Animate Moving Vehicles
    this.vehicles.forEach(v => {
      v.progress += v.speed * v.direction;
      if (v.progress > 85) v.progress = -85;
      if (v.progress < -85) v.progress = 85;

      if (v.isHorizontal) {
        v.mesh.position.set(v.progress, 0.45, v.lane);
        v.mesh.rotation.y = v.direction > 0 ? 0 : Math.PI;
      } else {
        v.mesh.position.set(v.lane, 0.45, v.progress);
        v.mesh.rotation.y = v.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
      }
    });

    // 6. Animate Metro Train
    if (this.metroTrain) {
      this.metroTrain.position.x = Math.sin(elapsedTime * 1.8) * 3.5;
    }

    // 7. Animate Shockwaves
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

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.unsubscribeGraph) this.unsubscribeGraph();
    window.removeEventListener('resize', this.onResize);
    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
