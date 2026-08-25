/**
 * CASCADYN - Directed Weighted Dependency Graph Model
 * Manages infrastructure nodes, directional edges with strengths [0.0 - 1.0],
 * upstream/downstream traversals, and cascade failure simulations.
 */

export class CityGraph {
  constructor(dataset = []) {
    this.services = new Map();
    this.adj = new Map();     // Outgoing: source -> [{ target_id, strength, description }]
    this.revAdj = new Map();  // Incoming: target -> [{ source_id, strength, description }]
    this.listeners = new Set();
    
    if (dataset.length > 0) {
      this.loadDataset(dataset);
    }
  }

  /**
   * Subscribe to graph state changes
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this));
  }

  /**
   * Loads or switches a dataset
   */
  loadDataset(dataset) {
    this.services.clear();
    this.adj.clear();
    this.revAdj.clear();

    // Deep clone to allow state mutations without altering raw dataset definitions
    dataset.forEach(rawItem => {
      const item = JSON.parse(JSON.stringify(rawItem));
      this.services.set(item.service_id, item);
      this.adj.set(item.service_id, []);
      this.revAdj.set(item.service_id, []);
    });

    // Populate adjacency lists
    this.services.forEach(service => {
      if (Array.isArray(service.connected_services)) {
        service.connected_services.forEach(edge => {
          if (this.services.has(edge.target_id)) {
            this.adj.get(service.service_id).push({
              target_id: edge.target_id,
              strength: Math.max(0, Math.min(1, edge.strength ?? 0.8)),
              description: edge.description || `Dependency link to ${edge.target_id}`
            });

            this.revAdj.get(edge.target_id).push({
              source_id: service.service_id,
              strength: Math.max(0, Math.min(1, edge.strength ?? 0.8)),
              description: edge.description || `Powered/Supported by ${service.service_id}`
            });
          }
        });
      }
    });

    this.notify();
  }

  getService(id) {
    return this.services.get(id);
  }

  getAllServices() {
    return Array.from(this.services.values());
  }

  /**
   * Returns direct upstream dependencies (who this service relies upon)
   */
  getUpstreamDependencies(id) {
    const list = this.revAdj.get(id) || [];
    return list.map(edge => ({
      service: this.services.get(edge.source_id),
      strength: edge.strength,
      description: edge.description
    })).filter(e => Boolean(e.service));
  }

  /**
   * Returns direct downstream dependents (who relies upon this service)
   */
  getDownstreamDependents(id) {
    const list = this.adj.get(id) || [];
    return list.map(edge => ({
      service: this.services.get(edge.target_id),
      strength: edge.strength,
      description: edge.description
    })).filter(e => Boolean(e.service));
  }

  /**
   * Total dependency count (upstream + downstream)
   */
  getDependencyMetrics(id) {
    const upstream = this.getUpstreamDependencies(id);
    const downstream = this.getDownstreamDependents(id);
    return {
      upstreamCount: upstream.length,
      downstreamCount: downstream.length,
      totalLinks: upstream.length + downstream.length,
      avgUpstreamStrength: upstream.length > 0 
        ? (upstream.reduce((acc, u) => acc + u.strength, 0) / upstream.length).toFixed(2) 
        : "0.00",
      avgDownstreamStrength: downstream.length > 0 
        ? (downstream.reduce((acc, d) => acc + d.strength, 0) / downstream.length).toFixed(2) 
        : "0.00"
    };
  }

  /**
   * Updates status of a service: 'Operational' | 'Degraded' | 'Failed' | 'Recovering'
   */
  updateServiceStatus(id, newStatus) {
    const service = this.services.get(id);
    if (!service) return;
    service.status = newStatus;
    this.notify();
  }

  /**
   * Resets all services to Operational
   */
  resetAll() {
    this.services.forEach(service => {
      service.status = "Operational";
    });
    this.notify();
  }

  /**
   * Calculates overall City Resilience Score (0 to 100%)
   */
  getResilienceScore() {
    if (this.services.size === 0) return 100;
    
    let totalWeight = 0;
    let earnedWeight = 0;

    this.services.forEach(s => {
      const critMultiplier = s.criticality === "Critical" ? 3.0 : s.criticality === "High" ? 2.0 : 1.0;
      totalWeight += critMultiplier;

      let statusFactor = 1.0;
      if (s.status === "Degraded") statusFactor = 0.5;
      else if (s.status === "Recovering") statusFactor = 0.75;
      else if (s.status === "Failed") statusFactor = 0.0;

      earnedWeight += critMultiplier * statusFactor;
    });

    return Math.round((earnedWeight / totalWeight) * 100);
  }

  /**
   * Simulates a cascade failure propagation starting from a specific node
   * Returns a step-by-step propagation timeline
   */
  simulateCascade(startServiceId, failureSeverity = 1.0) {
    const timeline = [];
    const visited = new Set();
    const queue = [{ id: startServiceId, depth: 0, time: 0, severity: failureSeverity, cause: "Primary Injected Failure" }];
    
    visited.add(startServiceId);

    while (queue.length > 0) {
      const current = queue.shift();
      const service = this.services.get(current.id);
      if (!service) continue;

      timeline.push({
        timeSeconds: current.time,
        serviceId: current.id,
        serviceName: service.service_name,
        criticality: service.criticality,
        depth: current.depth,
        severity: current.severity,
        cause: current.cause,
        icon: service.icon,
        impactScore: service.impact_score
      });

      const downstream = this.adj.get(current.id) || [];
      downstream.forEach(edge => {
        if (!visited.has(edge.target_id)) {
          const propagatedSeverity = current.severity * edge.strength;
          // If propagated impact exceeds threshold (0.4), it causes cascading failure
          if (propagatedSeverity >= 0.45) {
            visited.add(edge.target_id);
            const delay = Math.round((current.depth + 1) * 3.5 + (1 - edge.strength) * 4);
            queue.push({
              id: edge.target_id,
              depth: current.depth + 1,
              time: current.time + delay,
              severity: propagatedSeverity,
              cause: `Cascaded from ${service.service_name} (${edge.description})`
            });
          }
        }
      });
    }

    return timeline;
  }
}
