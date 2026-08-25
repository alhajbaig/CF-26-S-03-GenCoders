/**
 * CASCADYN - Urban Infrastructure City Dataset & Service Model
 * Defines structured datasets for smart city services and graph dependencies.
 */

export const SYNTHETIC_CITY_DATASET = [
  {
    service_id: "PWR-01",
    service_name: "Electricity / Power",
    category: "energy",
    status: "Operational", // Operational | Degraded | Failed | Recovering
    criticality: "Critical", // Critical | High | Medium | Low
    dependency_strength: 0.95,
    recovery_time: "45 mins",
    recovery_time_seconds: 45 * 60,
    impact_score: 98,
    coordinates: { x: -28, y: 0, z: -25 },
    icon: "zap",
    badge_color: "#FF2E93",
    description: "Central grid distribution, high-voltage transformers, and renewable microgrid interconnects.",
    backup_system: "Auxiliary Gas Turbines (30 min reserve) + Battery BESS (15 min)",
    capacity_mw: "850 MW",
    load_percentage: 64,
    color_hex: "#FF2E93",
    connected_services: [
      { target_id: "WTR-01", strength: 0.92, description: "Powers intake pumps, filtration turbines, and chlorination plants" },
      { target_id: "TEL-01", strength: 0.95, description: "Energizes primary telecom core switches, cellular masts, and 5G nodes" },
      { target_id: "TRF-01", strength: 0.88, description: "Powers smart intersection signals, radar sensors, and adaptive controllers" },
      { target_id: "TRN-01", strength: 0.94, description: "Feeds 750V DC traction power for Metro Rail lines & electric bus depots" },
      { target_id: "HOS-01", strength: 0.90, description: "Direct dual-feed line to ICU life support, MRI, and surgical suites" },
      { target_id: "GOV-01", strength: 0.82, description: "Supplies power to Municipal Datacenter and banking exchange clearing" },
      { target_id: "EMG-01", strength: 0.80, description: "Energizes 911 dispatch radio towers, sirens, and fire station doors" }
    ]
  },
  {
    service_id: "WTR-01",
    service_name: "Water Supply",
    category: "water",
    status: "Operational",
    criticality: "High",
    dependency_strength: 0.85,
    recovery_time: "60 mins",
    recovery_time_seconds: 60 * 60,
    impact_score: 86,
    coordinates: { x: -35, y: 0, z: 22 },
    icon: "droplets",
    badge_color: "#00D2FF",
    description: "Municipal water intake, filtration reservoir, and high-pressure pumping distribution.",
    backup_system: "Gravity-feed Elevated Reservoirs (4-hour pressurized buffer)",
    capacity_mw: "320 MGD",
    load_percentage: 58,
    color_hex: "#00D2FF",
    connected_services: [
      { target_id: "HOS-01", strength: 0.85, description: "Supplies sterilized cooling, dialysis units, and sanitation lines" },
      { target_id: "EMG-01", strength: 0.88, description: "Maintains required PSI for municipal fire hydrants across all zones" },
      { target_id: "GOV-01", strength: 0.65, description: "Chilled water loop for municipal datacenter thermal management" },
      { target_id: "PWR-01", strength: 0.70, description: "Cooling loops and feedwater for power generation turbines" }
    ]
  },
  {
    service_id: "TEL-01",
    service_name: "Telecom / Internet",
    category: "telecom",
    status: "Operational",
    criticality: "Critical",
    dependency_strength: 0.92,
    recovery_time: "30 mins",
    recovery_time_seconds: 30 * 60,
    impact_score: 92,
    coordinates: { x: 0, y: 0, z: -10 },
    icon: "radio",
    badge_color: "#0EA5E9",
    description: "5G cellular mast network, municipal dark fiber ring, and ISP edge exchange.",
    backup_system: "Emergency Microwave Backhaul & Satellite Uplink Starlink arrays",
    capacity_mw: "10 Gbps / km²",
    load_percentage: 71,
    color_hex: "#0EA5E9",
    connected_services: [
      { target_id: "TRF-01", strength: 0.90, description: "Sub-millisecond telemetry links for smart traffic flow optimization" },
      { target_id: "EMG-01", strength: 0.96, description: "Carries 911 telephony, CAD dispatch data, and responder GPS feeds" },
      { target_id: "GOV-01", strength: 0.92, description: "Municipal cloud connectivity, digital identity, and payment portals" },
      { target_id: "HOS-01", strength: 0.78, description: "Telemedicine consultations, robotic surgery links, and EHR access" },
      { target_id: "TRN-01", strength: 0.82, description: "Automated Train Supervision (ATS) signaling & passenger announcements" }
    ]
  },
  {
    service_id: "TRF-01",
    service_name: "Traffic Management",
    category: "traffic",
    status: "Operational",
    criticality: "Medium",
    dependency_strength: 0.75,
    recovery_time: "20 mins",
    recovery_time_seconds: 20 * 60,
    impact_score: 74,
    coordinates: { x: 18, y: 0, z: -15 },
    icon: "traffic-cone",
    badge_color: "#F59E0B",
    description: "Adaptive signal controllers, congestion sensors, and dynamic highway signage.",
    backup_system: "Fixed-timer flashing amber fail-safe mode on all intersection controllers",
    capacity_mw: "140,000 veh/hr",
    load_percentage: 52,
    color_hex: "#F59E0B",
    connected_services: [
      { target_id: "EMG-01", strength: 0.85, description: "Emergency green-wave preemptive corridors for ambulances and fire trucks" },
      { target_id: "TRN-01", strength: 0.72, description: "Surface transit bus lane priority and transit hub intersection timing" }
    ]
  },
  {
    service_id: "TRN-01",
    service_name: "Public Transport",
    category: "transit",
    status: "Operational",
    criticality: "High",
    dependency_strength: 0.80,
    recovery_time: "50 mins",
    recovery_time_seconds: 50 * 60,
    impact_score: 82,
    coordinates: { x: 25, y: 0, z: 15 },
    icon: "train",
    badge_color: "#F97316",
    description: "Metro rapid rail lines, automated shuttle network, and electric bus depot fleet.",
    backup_system: "Diesel backup locomotive fleet and emergency bus shuttle bridging",
    capacity_mw: "45,000 pax/hr",
    load_percentage: 68,
    color_hex: "#F97316",
    connected_services: [
      { target_id: "HOS-01", strength: 0.60, description: "Transport corridor for medical shift workers and outpatient clinic visitors" },
      { target_id: "GOV-01", strength: 0.65, description: "Civic transit access connecting government complexes and downtown workforce" }
    ]
  },
  {
    service_id: "HOS-01",
    service_name: "Hospitals",
    category: "health",
    status: "Operational",
    criticality: "Critical",
    dependency_strength: 0.95,
    recovery_time: "90 mins",
    recovery_time_seconds: 90 * 60,
    impact_score: 99,
    coordinates: { x: -10, y: 0, z: 28 },
    icon: "heart-pulse",
    badge_color: "#EF4444",
    description: "Metropolitan Trauma Center, Intensive Care Units, and Emergency Surgical Wing.",
    backup_system: "Emergency Diesel Generators (48h fuel supply) + Onsite Water Cistern",
    capacity_mw: "1,200 beds",
    load_percentage: 78,
    color_hex: "#EF4444",
    connected_services: [
      { target_id: "EMG-01", strength: 0.90, description: "Live ER intake capacity broadcasting to 911 ambulance routing" }
    ]
  },
  {
    service_id: "EMG-01",
    service_name: "Emergency Services",
    category: "emergency",
    status: "Operational",
    criticality: "Critical",
    dependency_strength: 0.90,
    recovery_time: "25 mins",
    recovery_time_seconds: 25 * 60,
    impact_score: 95,
    coordinates: { x: 8, y: 0, z: 30 },
    icon: "shield-alert",
    badge_color: "#E11D48",
    description: "911 Dispatch Command, Central Fire Department, and Hazmat Emergency Units.",
    backup_system: "Mobile Command Post Vehicles + Encrypted VHF Radio Mesh Network",
    capacity_mw: "350 response units",
    load_percentage: 45,
    color_hex: "#E11D48",
    connected_services: [
      { target_id: "HOS-01", strength: 0.88, description: "Patient triage transport and rapid critical trauma delivery" },
      { target_id: "PWR-01", strength: 0.60, description: "Substation electrical fire response and emergency hazard cordoning" },
      { target_id: "WTR-01", strength: 0.55, description: "Auxiliary mobile high-capacity flood pumps and water line rescue" }
    ]
  },
  {
    service_id: "GOV-01",
    service_name: "Government / Digital Services",
    category: "municipal",
    status: "Operational",
    criticality: "Medium",
    dependency_strength: 0.78,
    recovery_time: "40 mins",
    recovery_time_seconds: 40 * 60,
    impact_score: 79,
    coordinates: { x: 30, y: 0, z: -28 },
    icon: "landmark",
    badge_color: "#10B981",
    description: "City Hall Datacenter, municipal cloud servers, financial transactions, and public alerts.",
    backup_system: "Geo-replicated Cloud Failover in Secondary Region (30-second switchover)",
    capacity_mw: "2.4M transactions/min",
    load_percentage: 60,
    color_hex: "#10B981",
    connected_services: [
      { target_id: "EMG-01", strength: 0.75, description: "Emergency municipal funding authorization & disaster warning siren triggers" },
      { target_id: "HOS-01", strength: 0.70, description: "Public health registry sync and emergency pharmaceutical supply release" }
    ]
  }
];

export const CHICAGO_CITY_DATASET = [
  {
    service_id: "CHI-PWR-01",
    service_name: "ComEd Chicago Grid Core",
    category: "energy",
    status: "Operational",
    criticality: "Critical",
    dependency_strength: 0.96,
    recovery_time: "50 mins",
    recovery_time_seconds: 50 * 60,
    impact_score: 99,
    coordinates: { x: -30, y: 0, z: -20 },
    icon: "zap",
    badge_color: "#FF2E93",
    description: "Commonwealth Edison South Loop substation network & Midwest ISO high-voltage feed.",
    backup_system: "Peaker generation units + Battery storage array",
    capacity_mw: "1,450 MW",
    load_percentage: 67,
    color_hex: "#FF2E93",
    connected_services: [
      { target_id: "CHI-WTR-01", strength: 0.94, description: "Jardine Water Purification Plant raw intake pumps" },
      { target_id: "CHI-TEL-01", strength: 0.97, description: "350 E Cermak Carrier Hotel power feeds" },
      { target_id: "CHI-TRF-01", strength: 0.89, description: "CDOT traffic signals in the Loop and Michigan Ave" },
      { target_id: "CHI-TRN-01", strength: 0.95, description: "CTA 'L' Elevated subway 600V DC third rail" },
      { target_id: "CHI-HOS-01", strength: 0.91, description: "Illinois Medical District Rush/Stroger feeds" },
      { target_id: "CHI-GOV-01", strength: 0.84, description: "Daley Center & Cook County administration" },
      { target_id: "CHI-EMG-01", strength: 0.82, description: "OEMC Madison St Emergency Command Center" }
    ]
  },
  {
    service_id: "CHI-WTR-01",
    service_name: "Jardine Water Plant (Lakefront)",
    category: "water",
    status: "Operational",
    criticality: "High",
    dependency_strength: 0.88,
    recovery_time: "75 mins",
    recovery_time_seconds: 75 * 60,
    impact_score: 89,
    coordinates: { x: -38, y: 0, z: 18 },
    icon: "droplets",
    badge_color: "#00D2FF",
    description: "World's largest water treatment plant purifying 1 billion gallons/day from Lake Michigan.",
    backup_system: "Auxiliary steam pumps & elevated distribution towers",
    capacity_mw: "1,000 MGD",
    load_percentage: 61,
    color_hex: "#00D2FF",
    connected_services: [
      { target_id: "CHI-HOS-01", strength: 0.88, description: "Medical district sterilization and dialysis supply" },
      { target_id: "CHI-EMG-01", strength: 0.92, description: "CFD Fire hydrant system across 50 wards" },
      { target_id: "CHI-PWR-01", strength: 0.72, description: "Cooling water for generation and distribution facilities" }
    ]
  },
  {
    service_id: "CHI-TEL-01",
    service_name: "350 E Cermak Fiber Hub",
    category: "telecom",
    status: "Operational",
    criticality: "Critical",
    dependency_strength: 0.95,
    recovery_time: "35 mins",
    recovery_time_seconds: 35 * 60,
    impact_score: 95,
    coordinates: { x: -2, y: 0, z: -12 },
    icon: "radio",
    badge_color: "#0EA5E9",
    description: "Premier carrier-neutral interconnection facility in North America housing CME & Nasdaq nodes.",
    backup_system: "Four 8.5MW diesel rotary UPS arrays + multi-carrier dark fiber",
    capacity_mw: "40 Tbps aggregate",
    load_percentage: 74,
    color_hex: "#0EA5E9",
    connected_services: [
      { target_id: "CHI-TRF-01", strength: 0.92, description: "CDOT automated traffic signal mesh telemetry" },
      { target_id: "CHI-EMG-01", strength: 0.98, description: "Chicago 911 OEMC computer-aided dispatch (CAD)" },
      { target_id: "CHI-GOV-01", strength: 0.94, description: "Chicago Board of Trade & City Financial Network" },
      { target_id: "CHI-HOS-01", strength: 0.80, description: "Epic EHR cloud connectivity for medical district" },
      { target_id: "CHI-TRN-01", strength: 0.85, description: "CTA Train tracker API and trackside signaling" }
    ]
  },
  {
    service_id: "CHI-TRF-01",
    service_name: "CDOT Traffic Management",
    category: "traffic",
    status: "Operational",
    criticality: "Medium",
    dependency_strength: 0.76,
    recovery_time: "25 mins",
    recovery_time_seconds: 25 * 60,
    impact_score: 76,
    coordinates: { x: 16, y: 0, z: -18 },
    icon: "traffic-cone",
    badge_color: "#F59E0B",
    description: "Chicago Department of Transportation grid covering 3,000 signalized intersections and Lake Shore Drive.",
    backup_system: "Fail-safe red flash relays and manual traffic warden deployment",
    capacity_mw: "210,000 veh/hr",
    load_percentage: 55,
    color_hex: "#F59E0B",
    connected_services: [
      { target_id: "CHI-EMG-01", strength: 0.88, description: "Preempted siren-triggered green corridors for CFD" },
      { target_id: "CHI-TRN-01", strength: 0.75, description: "Bus priority lanes on Chicago Ave & Michigan Ave" }
    ]
  },
  {
    service_id: "CHI-TRN-01",
    service_name: "CTA Rail Transit ('L')",
    category: "transit",
    status: "Operational",
    criticality: "High",
    dependency_strength: 0.84,
    recovery_time: "55 mins",
    recovery_time_seconds: 55 * 60,
    impact_score: 85,
    coordinates: { x: 22, y: 0, z: 12 },
    icon: "train",
    badge_color: "#F97316",
    description: "Chicago Transit Authority 8-line rapid transit system serving 500,000 daily commuters.",
    backup_system: "Dual substation substructure and express bus bridging",
    capacity_mw: "80,000 pax/hr",
    load_percentage: 70,
    color_hex: "#F97316",
    connected_services: [
      { target_id: "CHI-HOS-01", strength: 0.65, description: "Pink/Blue Line access to Illinois Medical District" },
      { target_id: "CHI-GOV-01", strength: 0.70, description: "Loop connection to City Hall & County Buildings" }
    ]
  },
  {
    service_id: "CHI-HOS-01",
    service_name: "Illinois Medical District (IMD)",
    category: "health",
    status: "Operational",
    criticality: "Critical",
    dependency_strength: 0.96,
    recovery_time: "90 mins",
    recovery_time_seconds: 90 * 60,
    impact_score: 99,
    coordinates: { x: -12, y: 0, z: 25 },
    icon: "heart-pulse",
    badge_color: "#EF4444",
    description: "560-acre healthcare district comprising Rush University, Stroger Hospital, and UI Health.",
    backup_system: "Tri-redundant turbine generators and dedicated medical oxygen reserves",
    capacity_mw: "2,200 beds",
    load_percentage: 82,
    color_hex: "#EF4444",
    connected_services: [
      { target_id: "CHI-EMG-01", strength: 0.92, description: "Level-1 trauma intake status and emergency bed telemetry" }
    ]
  },
  {
    service_id: "CHI-EMG-01",
    service_name: "Chicago OEMC & CFD",
    category: "emergency",
    status: "Operational",
    criticality: "Critical",
    dependency_strength: 0.92,
    recovery_time: "25 mins",
    recovery_time_seconds: 25 * 60,
    impact_score: 96,
    coordinates: { x: 10, y: 0, z: 28 },
    icon: "shield-alert",
    badge_color: "#E11D48",
    description: "Office of Emergency Management and Communications + Chicago Fire Department Headquarters.",
    backup_system: "Mobile satellite command vehicles and alternate West Side dispatch site",
    capacity_mw: "480 active units",
    load_percentage: 48,
    color_hex: "#E11D48",
    connected_services: [
      { target_id: "CHI-HOS-01", strength: 0.90, description: "Trauma casualty ambulance transport to IMD" },
      { target_id: "CHI-PWR-01", strength: 0.65, description: "Electrical hazard response and ComEd liaison" }
    ]
  },
  {
    service_id: "CHI-GOV-01",
    service_name: "Chicago City Hall & CME Hub",
    category: "municipal",
    status: "Operational",
    criticality: "Medium",
    dependency_strength: 0.80,
    recovery_time: "45 mins",
    recovery_time_seconds: 45 * 60,
    impact_score: 82,
    coordinates: { x: 28, y: 0, z: -25 },
    icon: "landmark",
    badge_color: "#10B981",
    description: "121 N LaSalle City Hall, Cook County Civic infrastructure, and Chicago Mercantile Exchange.",
    backup_system: "Multi-datacenter cloud replication & auxiliary power feeds",
    capacity_mw: "4.5M trades/sec",
    load_percentage: 63,
    color_hex: "#10B981",
    connected_services: [
      { target_id: "CHI-EMG-01", strength: 0.78, description: "Mayoral emergency executive orders & funding disbursement" },
      { target_id: "CHI-HOS-01", strength: 0.72, description: "Chicago Department of Public Health (CDPH) epidemic coordination" }
    ]
  }
];

/**
 * Parses and validates custom CSV format:
 * service_id,service_name,status,criticality,dependency_strength,recovery_time,impact_score,coordinates,connected_services
 */
export function importFromCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("CSV contains no data rows.");
  
  const services = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].trim();
    if (!row) continue;
    
    // Parse CSV line handling potential quotes or semicolons
    const tokens = row.split(",").map(t => t.replace(/^"|"$/g, "").trim());
    if (tokens.length < 5) continue;

    const id = tokens[0] || `SRV-${i}`;
    const name = tokens[1] || `Service ${i}`;
    const status = tokens[2] || "Operational";
    const criticality = tokens[3] || "Medium";
    const strength = parseFloat(tokens[4]) || 0.8;
    const recovery = tokens[5] || "45 mins";
    const impact = parseInt(tokens[6], 10) || 75;
    
    // Parse coordinates or assign default
    let coords = { x: (i % 4 - 1.5) * 20, y: 0, z: (Math.floor(i / 4) - 1) * 25 };
    if (tokens[7]) {
      const parts = tokens[7].split(";").map(Number);
      if (parts.length >= 2) coords = { x: parts[0] || 0, y: 0, z: parts[1] || 0 };
    }

    // Parse connected services (format: ID:strength;ID2:strength2)
    const connected = [];
    if (tokens[8]) {
      const links = tokens[8].split(";");
      for (const link of links) {
        const [targetId, linkStrength] = link.split(":");
        if (targetId) {
          connected.push({
            target_id: targetId.trim(),
            strength: parseFloat(linkStrength) || 0.8,
            description: `Interconnection to ${targetId.trim()}`
          });
        }
      }
    }

    services.push({
      service_id: id,
      service_name: name,
      category: id.toLowerCase().includes("pwr") ? "energy" : id.toLowerCase().includes("wtr") ? "water" : "municipal",
      status: ["Operational", "Degraded", "Failed", "Recovering"].includes(status) ? status : "Operational",
      criticality: ["Critical", "High", "Medium", "Low"].includes(criticality) ? criticality : "Medium",
      dependency_strength: Math.min(1, Math.max(0, strength)),
      recovery_time: recovery,
      recovery_time_seconds: 45 * 60,
      impact_score: impact,
      coordinates: coords,
      connected_services: connected,
      description: `Imported infrastructure service ${name}`,
      backup_system: "Standard Auxiliary Backup Grid",
      icon: "activity",
      badge_color: "#FF2E93",
      color_hex: "#FF2E93"
    });
  }

  return services;
}

/**
 * Exports current city dataset to CSV string
 */
export function exportToCSV(services) {
  const header = "service_id,service_name,status,criticality,dependency_strength,recovery_time,impact_score,coordinates,connected_services\n";
  const rows = services.map(s => {
    const coordsStr = `${s.coordinates.x};${s.coordinates.z}`;
    const connectedStr = (s.connected_services || []).map(c => `${c.target_id}:${c.strength}`).join(";");
    return `"${s.service_id}","${s.service_name}","${s.status}","${s.criticality}",${s.dependency_strength},"${s.recovery_time}",${s.impact_score},"${coordsStr}","${connectedStr}"`;
  });
  return header + rows.join("\n");
}

/**
 * Exports current city dataset to JSON string
 */
export function exportToJSON(services) {
  return JSON.stringify(services, null, 2);
}
