/**
 * CASCADYN - Smart City AI Assistant Chatbot
 * Groq API integration with comprehensive local graph-aware fallback.
 * Handles questions about dependencies, cascades, resilience, criticality, etc.
 */

import { sound } from '../engine/audioEngine.js';

const GROQ_MODELS = ['llama3-8b-8192', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];

export class SmartCityChatbot {
  constructor(containerElement, graph, apiKey) {
    this.container = containerElement;
    this.graph = graph;
    this.apiKey = apiKey;
    this.isOpen = false;
    this.messages = [];
    this.element = null;
    this.currentModelIdx = 0;  // try models in order

    this.init();
  }

  init() {
    // Floating launcher button
    this.launcher = document.createElement('button');
    this.launcher.id = 'chatbot-launcher';
    this.launcher.className = 'chatbot-launcher-btn';
    this.launcher.title = 'Ask SmartCity Assistant';
    this.launcher.innerHTML = `<i data-lucide="message-square" id="launcher-icon" style="width:22px;height:22px;"></i>`;
    this.container.appendChild(this.launcher);

    // Chat panel
    this.element = document.createElement('div');
    this.element.id = 'chatbot-panel';
    this.element.className = 'chatbot-panel-container collapsed';
    this.element.innerHTML = `
      <div class="chatbot-header">
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="bot-avatar">AI</div>
          <div>
            <h3 style="font-family:var(--font-heading);font-weight:800;font-size:0.95rem;color:var(--text-primary);line-height:1.2;">SmartCity Assistant</h3>
            <span style="font-size:0.72rem;color:var(--status-green);font-weight:600;display:flex;align-items:center;gap:4px;">
              <span style="width:6px;height:6px;border-radius:50%;background:var(--status-green);"></span> Online
            </span>
          </div>
        </div>
        <button id="btn-close-chatbot" class="btn-icon" style="width:32px;height:32px;" title="Close">
          <i data-lucide="x" style="width:16px;height:16px;"></i>
        </button>
      </div>

      <div class="chatbot-messages" id="chatbot-messages-stream">
        <div class="chat-message bot">
          <p>Hello! I'm the <strong>CASCADYN AI</strong>. Ask me anything about the city's infrastructure — dependencies, failure cascades, criticality, recovery priorities, and more.</p>
        </div>
      </div>

      <div class="chatbot-suggestions">
        <button class="suggestion-chip">What depends on Power?</button>
        <button class="suggestion-chip">What happens if Telecom fails?</button>
        <button class="suggestion-chip">Which service is most critical?</button>
        <button class="suggestion-chip">Which creates the largest cascade?</button>
        <button class="suggestion-chip">Why are hospitals affected?</button>
        <button class="suggestion-chip">What should be restored first?</button>
        <button class="suggestion-chip">Show all failed services</button>
        <button class="suggestion-chip">What is the city resilience?</button>
      </div>

      <form class="chatbot-input-area" id="chatbot-input-form">
        <input type="text" id="chatbot-text-input"
          placeholder="Ask about dependencies, failures, MTTR..." autocomplete="off" />
        <button type="submit" id="btn-send-chat" title="Send">
          <i data-lucide="send" style="width:16px;height:16px;"></i>
        </button>
      </form>
    `;
    this.container.appendChild(this.element);

    if (window.lucide) window.lucide.createIcons();
    this._bindEvents();
  }

  _bindEvents() {
    this.launcher.addEventListener('click', () => { sound.playClick(); this.toggle(); });

    this.element.querySelector('#btn-close-chatbot').addEventListener('click', () => {
      sound.playClick(); this.close();
    });

    this.element.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        sound.playClick();
        const text = chip.textContent.trim();
        this._handleSubmit(text);
      });
    });

    const form = this.element.querySelector('#chatbot-input-form');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = this.element.querySelector('#chatbot-text-input');
      const text = input ? input.value.trim() : '';
      if (text) { input.value = ''; this._handleSubmit(text); }
    });
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    this.isOpen = true;
    this.element.classList.remove('collapsed');
    const input = this.element.querySelector('#chatbot-text-input');
    if (input) setTimeout(() => input.focus(), 200);
  }

  close() {
    this.isOpen = false;
    this.element.classList.add('collapsed');
  }

  _addMessage(role, text) {
    const stream = this.element.querySelector('#chatbot-messages-stream');
    if (!stream) return;
    const div = document.createElement('div');
    div.className = `chat-message ${role}`;
    // Convert markdown-lite to HTML
    const html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n- /g, '<br>• ')
      .replace(/\n/g, '<br>');
    div.innerHTML = `<p>${html}</p>`;
    stream.appendChild(div);
    stream.scrollTop = stream.scrollHeight;
  }

  _showTyping() {
    const stream = this.element.querySelector('#chatbot-messages-stream');
    if (!stream) return;
    const div = document.createElement('div');
    div.className = 'chat-message bot typing-indicator-msg';
    div.id = 'typing-indicator';
    div.innerHTML = `<span class="typing-dots"><span></span><span></span><span></span></span>`;
    stream.appendChild(div);
    stream.scrollTop = stream.scrollHeight;
  }

  _removeTyping() {
    const el = this.element.querySelector('#typing-indicator');
    if (el) el.remove();
  }

  async _handleSubmit(text) {
    this._addMessage('user', text);
    this._showTyping();

    let response;
    try {
      response = await this._callGroq(text);
    } catch (err) {
      console.warn('Groq API unavailable, using local engine:', err.message);
      response = this._localIntelligence(text);
    }

    this._removeTyping();
    this._addMessage('bot', response);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GROQ API CALL
  // ─────────────────────────────────────────────────────────────────────────

  async _callGroq(question) {
    if (!this.apiKey) throw new Error('No API key');

    const services = this.graph.getAllServices();
    const resilience = this.graph.getResilienceScore();
    const failedServices = services.filter(s => s.status === 'Failed');

    // Build concise but complete city context
    const ctx = services.map(s => {
      const dn = this.graph.getDownstreamDependents(s.service_id)
        .map(e => `${e.service.service_id}(${e.strength.toFixed(2)})`).join(',');
      const up = this.graph.getUpstreamDependencies(s.service_id)
        .map(e => `${e.service.service_id}(${e.strength.toFixed(2)})`).join(',');
      return `[${s.service_id}] ${s.service_name} | Status:${s.status} | Criticality:${s.criticality} | Impact:${s.impact_score} | MTTR:${s.recovery_time} | Feeds→[${dn}] | FedBy→[${up}]`;
    }).join('\n');

    const systemPrompt = `You are CASCADYN AI, an expert urban infrastructure analyst for a simulated smart city.

LIVE CITY STATE (Resilience: ${resilience}%):
${ctx}
${failedServices.length > 0 ? `\nCURRENTLY FAILED: ${failedServices.map(s => s.service_id).join(', ')}` : '\nAll services currently OPERATIONAL.'}

RULES:
1. Only answer questions about this city's infrastructure, dependencies, failures, and cascades.
2. Reference service IDs (PWR-01, TEL-01, etc.) and actual data values from the context above.
3. For cascade questions: trace the dependency chain using the Feeds→ data to determine what fails.
4. Be concise (max 4 sentences or a short bulleted list). Use **bold** for service names.
5. If asked about current status, use the live State data above.
6. Decline off-topic questions politely.`;

    const model = GROQ_MODELS[this.currentModelIdx % GROQ_MODELS.length];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        temperature: 0.2,
        max_tokens: 500
      })
    });

    if (!res.ok) {
      // Try next model on failure
      this.currentModelIdx++;
      throw new Error(`Groq API error ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    return data.choices[0].message.content.trim();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOCAL INTELLIGENCE ENGINE (Full graph-aware, handles many question types)
  // ─────────────────────────────────────────────────────────────────────────

  _localIntelligence(question) {
    const q = question.toLowerCase().trim();
    const services = this.graph.getAllServices();
    const resilience = this.graph.getResilienceScore();

    // ── Off-topic guard ──────────────────────────────────────────────────
    const offTopics = ['recipe', 'cook', 'javascript', 'python', 'history of', 'who is', 'president', 'capital of', 'weather'];
    if (offTopics.some(k => q.includes(k))) {
      return "I'm specialized for CASCADYN infrastructure analysis only. Ask me about city services, dependencies, failures, or cascade simulations.";
    }

    // ── Helper: find service from any keyword ─────────────────────────────
    const findSvc = (keyword) => {
      return services.find(s =>
        s.service_name.toLowerCase().includes(keyword) ||
        s.service_id.toLowerCase().includes(keyword) ||
        s.category.toLowerCase().includes(keyword)
      );
    };

    // ── Helper: simulate full cascade from a service ──────────────────────
    const simulateCascade = (startId, severity = 1.0) => {
      const visited = new Map();
      const queue = [{ id: startId, depth: 0, severity, cause: 'Primary' }];
      visited.set(startId, { depth: 0 });
      const timeline = [];

      while (queue.length > 0) {
        const cur = queue.shift();
        const s = this.graph.getService(cur.id);
        timeline.push({ ...cur, name: s ? s.service_name : cur.id, criticality: s?.criticality, impact: s?.impact_score });

        const edges = this.graph.adj.get(cur.id) || [];
        edges.forEach(edge => {
          if (!visited.has(edge.target_id)) {
            const propSev = cur.severity * edge.strength;
            if (propSev >= 0.45) {
              visited.set(edge.target_id, { depth: cur.depth + 1 });
              queue.push({ id: edge.target_id, depth: cur.depth + 1, severity: propSev, cause: `${cur.id}` });
            }
          }
        });
      }
      return timeline;
    };

    // ══════════════════════════════════════════════════════════════════════
    // 1. "What depends on [service]?" / "What is downstream of [service]?"
    // ══════════════════════════════════════════════════════════════════════
    if (q.match(/what.*(depends?|downstream|relies?|need)/)) {
      // Which service?
      let target = null;
      const keywords = ['power', 'electricity', 'water', 'telecom', 'internet', 'hospital', 'traffic', 'transit', 'metro', 'emergency', 'government', 'municipal'];
      for (const kw of keywords) {
        if (q.includes(kw)) { target = findSvc(kw); break; }
      }
      if (!target) {
        // Try to match any service name in the question
        target = services.find(s => q.includes(s.service_name.toLowerCase().split('/')[0].toLowerCase()));
      }

      if (target) {
        const dependents = this.graph.getDownstreamDependents(target.service_id);
        if (dependents.length === 0) {
          return `**${target.service_name} (${target.service_id})** has no direct downstream dependents — it is an end-node consumer.`;
        }
        const list = dependents.map(d =>
          `- **${d.service.service_name} (${d.service.service_id})**: coupling strength ${(d.strength * 100).toFixed(0)}% — ${d.description}`
        ).join('\n');
        return `**${dependents.length} services** directly depend on **${target.service_name} (${target.service_id})**:\n\n${list}`;
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    // 2. "What feeds / powers / supplies [service]?" — Upstream deps
    // ══════════════════════════════════════════════════════════════════════
    if (q.match(/(what|which).*(feed|power|supply|upstream|input|requir).*(hospital|water|telecom|traffic|transit|emergency|government)/i) ||
        q.match(/(upstream|inputs? of|feeds?|powers?)/)) {
      const keywords = ['hospital', 'water', 'telecom', 'traffic', 'transit', 'emergency', 'government', 'power'];
      let target = null;
      for (const kw of keywords) {
        if (q.includes(kw)) { target = findSvc(kw); break; }
      }
      if (target) {
        const upstream = this.graph.getUpstreamDependencies(target.service_id);
        if (upstream.length === 0) {
          return `**${target.service_name} (${target.service_id})** is a primary source — it has no upstream dependencies.`;
        }
        const list = upstream.map(u =>
          `- **${u.service.service_name} (${u.service.service_id})** (weight: ${(u.strength * 100).toFixed(0)}%) — ${u.description}`
        ).join('\n');
        return `**${target.service_name} (${target.service_id})** depends on these upstream inputs:\n\n${list}`;
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    // 3. "What happens if [service] fails?" — Full cascade trace
    // ══════════════════════════════════════════════════════════════════════
    if (q.match(/(what happens|what if|cascade|fail|break|down|collapse)/)) {
      const keywords = ['power', 'electricity', 'water', 'telecom', 'internet', 'hospital', 'traffic', 'transit', 'emergency', 'government'];
      let target = null;
      for (const kw of keywords) {
        if (q.includes(kw)) { target = findSvc(kw); break; }
      }
      if (!target) {
        target = services.find(s => q.includes(s.service_name.toLowerCase().split('/')[0].toLowerCase()));
      }

      if (target) {
        const timeline = simulateCascade(target.service_id, 1.0);
        const cascade = timeline.slice(1); // exclude the source itself

        if (cascade.length === 0) {
          return `If **${target.service_name} (${target.service_id})** fails, no downstream cascade occurs. It is an end-node consumer.`;
        }

        const maxDepth = Math.max(...cascade.map(c => c.depth));
        const criticalCount = cascade.filter(c => c.criticality === 'Critical').length;
        const list = cascade.slice(0, 6).map(c =>
          `- **${c.name} (${c.id})** — Depth ${c.depth}${c.criticality === 'Critical' ? ' ⚠ Critical' : ''}`
        ).join('\n');
        const more = cascade.length > 6 ? `\n- ...and ${cascade.length - 6} more services` : '';

        return `If **${target.service_name} (${target.service_id})** fails, **${cascade.length} service${cascade.length !== 1 ? 's' : ''}** are disrupted (cascade depth: **${maxDepth}**${criticalCount > 0 ? `, ${criticalCount} critical` : ''}):\n\n${list}${more}`;
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    // 4. "Which service is most critical?" / "Most important?"
    // ══════════════════════════════════════════════════════════════════════
    if (q.match(/(most critical|most important|highest impact|highest criticality|critical service)/)) {
      const critical = services.filter(s => s.criticality === 'Critical');
      if (critical.length === 0) {
        return 'No services are classified as Critical in the current dataset.';
      }
      const sorted = critical.sort((a, b) => b.impact_score - a.impact_score);
      const list = sorted.map(s =>
        `- **${s.service_name} (${s.service_id})**: Impact ${s.impact_score}/100, MTTR: ${s.recovery_time}`
      ).join('\n');
      return `The **Critical-tier** services (highest priority) are:\n\n${list}\n\nDisrupting these triggers city-wide cascades.`;
    }

    // ══════════════════════════════════════════════════════════════════════
    // 5. "Which service creates the largest cascade?" / "Worst failure?"
    // ══════════════════════════════════════════════════════════════════════
    if (q.match(/(largest cascade|biggest cascade|worst failure|most damage|most impact|most downstream)/)) {
      let best = null, bestCount = 0;
      services.forEach(s => {
        const timeline = simulateCascade(s.service_id, 1.0);
        if (timeline.length > bestCount) { bestCount = timeline.length; best = s; }
      });
      if (best) {
        const cascade = simulateCascade(best.service_id, 1.0).slice(1);
        const maxDepth = cascade.length > 0 ? Math.max(...cascade.map(c => c.depth)) : 0;
        return `**${best.service_name} (${best.service_id})** causes the largest cascade. Failing it disrupts **${cascade.length} other services** (max depth: ${maxDepth}, ${Math.round((cascade.length + 1) / services.length * 100)}% of city infrastructure).`;
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    // 6. "Why are hospitals affected?" / "Why is [service] affected?"
    // ══════════════════════════════════════════════════════════════════════
    if (q.includes('why') && q.match(/(affect|down|fail|not work)/)) {
      const keywords = ['hospital', 'water', 'telecom', 'traffic', 'transit', 'emergency', 'government'];
      let target = null;
      for (const kw of keywords) {
        if (q.includes(kw)) { target = findSvc(kw); break; }
      }
      if (target) {
        const upstream = this.graph.getUpstreamDependencies(target.service_id);
        const failedUpstream = upstream.filter(u => u.service.status === 'Failed');
        if (failedUpstream.length > 0) {
          const list = failedUpstream.map(u => `- **${u.service.service_name}** (${(u.strength*100).toFixed(0)}% coupling) is currently FAILED`).join('\n');
          return `**${target.service_name}** is affected because its upstream dependencies have failed:\n\n${list}\n\nRestoring these upstream services will restore **${target.service_name}**.`;
        } else {
          const list = upstream.map(u => `- **${u.service.service_name}** (${(u.strength*100).toFixed(0)}% coupling) — ${u.description}`).join('\n');
          if (list) {
            return `**${target.service_name}** relies on these critical inputs:\n\n${list}\n\nIf any of these fail at high coupling strength, ${target.service_name} is immediately disrupted.`;
          }
          return `**${target.service_name}** has no upstream dependencies — it is a primary source.`;
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    // 7. "What should be restored first?" / "Recovery priority?"
    // ══════════════════════════════════════════════════════════════════════
    if (q.match(/(restore|fix|recover|priority|first|should be)/)) {
      const failed = services.filter(s => s.status === 'Failed' || s.status === 'Degraded');
      if (failed.length === 0) {
        return `All **${services.length} city services** are currently **Operational**. Resilience: **${resilience}%**. No restoration needed.`;
      }

      // Score by: criticality × downstream count × impact score
      const scored = failed.map(s => {
        const dn = this.graph.getDownstreamDependents(s.service_id).length;
        const critScore = s.criticality === 'Critical' ? 3 : s.criticality === 'High' ? 2 : 1;
        return { s, score: critScore * 10 + dn * 5 + (s.impact_score / 10) };
      }).sort((a, b) => b.score - a.score);

      const list = scored.map((r, i) => {
        const dn = this.graph.getDownstreamDependents(r.s.service_id).length;
        return `${i + 1}. **${r.s.service_name} (${r.s.service_id})** — ${r.s.criticality}, ${dn} downstream, MTTR: ${r.s.recovery_time}`;
      }).join('\n');

      return `**${failed.length} service${failed.length !== 1 ? 's' : ''}** need restoration. Recommended priority order:\n\n${list}\n\nRestoring upstream critical services first resolves downstream cascades automatically.`;
    }

    // ══════════════════════════════════════════════════════════════════════
    // 8. "Which services have the highest dependency / most connections?"
    // ══════════════════════════════════════════════════════════════════════
    if (q.match(/(most connected|highest dependency|most dependencies|most links|hub)/)) {
      const ranked = services.map(s => {
        const m = this.graph.getDependencyMetrics(s.service_id);
        return { s, total: m.totalLinks, out: m.downstreamCount, in: m.upstreamCount };
      }).sort((a, b) => b.total - a.total);

      const list = ranked.slice(0, 4).map(r =>
        `- **${r.s.service_name} (${r.s.service_id})**: ${r.total} total (${r.out} outgoing, ${r.in} incoming)`
      ).join('\n');
      return `Most interconnected services (highest total dependency links):\n\n${list}`;
    }

    // ══════════════════════════════════════════════════════════════════════
    // 9. "Show all failed services" / "What services are down?"
    // ══════════════════════════════════════════════════════════════════════
    if (q.match(/(show|list|what|which).*(fail|down|broken|offline|disrupted)/)) {
      const failed = services.filter(s => s.status === 'Failed');
      const degraded = services.filter(s => s.status === 'Degraded');
      if (failed.length === 0 && degraded.length === 0) {
        return `✅ All **${services.length} services** are currently **Operational**. City resilience: **${resilience}%**.`;
      }
      let resp = `**Current Disruptions** (Resilience: ${resilience}%):\n\n`;
      if (failed.length > 0) resp += `🚨 **Failed (${failed.length}):** ${failed.map(s => `${s.service_name} (${s.service_id})`).join(', ')}\n`;
      if (degraded.length > 0) resp += `⚠️ **Degraded (${degraded.length}):** ${degraded.map(s => `${s.service_name} (${s.service_id})`).join(', ')}`;
      return resp;
    }

    // ══════════════════════════════════════════════════════════════════════
    // 10. "What is the resilience?" / "City status?"
    // ══════════════════════════════════════════════════════════════════════
    if (q.match(/(resilience|city status|overall|health|score)/)) {
      const failed = services.filter(s => s.status === 'Failed').length;
      const operational = services.filter(s => s.status === 'Operational').length;
      const statusText = resilience > 90 ? '🟢 Excellent' : resilience > 70 ? '🟡 Moderate' : resilience > 40 ? '🟠 Poor' : '🔴 Critical';
      return `**City Resilience: ${resilience}%** — ${statusText}\n\n- Operational: **${operational} / ${services.length}** services\n- Failed: **${failed}** service${failed !== 1 ? 's' : ''}\n\nUse "Reset City" to restore all services or "Deploy Emergency Recovery" on individual services.`;
    }

    // ══════════════════════════════════════════════════════════════════════
    // 11. "What is [service]?" / "Tell me about [service]"
    // ══════════════════════════════════════════════════════════════════════
    if (q.match(/(what is|tell me|about|describe|explain)/)) {
      const keywords = ['power', 'electricity', 'water', 'telecom', 'internet', 'hospital', 'traffic', 'transit', 'emergency', 'government'];
      let target = null;
      for (const kw of keywords) {
        if (q.includes(kw)) { target = findSvc(kw); break; }
      }
      if (target) {
        const dn = this.graph.getDownstreamDependents(target.service_id).length;
        const up = this.graph.getUpstreamDependencies(target.service_id).length;
        return `**${target.service_name} (${target.service_id})**\n\n- **Criticality:** ${target.criticality} | **Impact Score:** ${target.impact_score}/100\n- **Status:** ${target.status} | **MTTR:** ${target.recovery_time}\n- **Connections:** ${dn} downstream dependents, ${up} upstream inputs\n- **Description:** ${target.description}\n- **Backup:** ${target.backup_system || 'Standard Grid Backup'}`;
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    // 12. General fallback
    // ══════════════════════════════════════════════════════════════════════
    const failedCount = services.filter(s => s.status === 'Failed').length;
    const tips = [
      'What depends on Power?',
      'What happens if Telecom fails?',
      'Which service creates the largest cascade?',
      'What should be restored first?',
      'Why are hospitals affected?',
      'Which service is most critical?',
    ];
    return `**City Resilience: ${resilience}%**${failedCount > 0 ? ` — ⚠ ${failedCount} service${failedCount !== 1 ? 's' : ''} currently failed` : ' — all services operational'}\n\nI can help with:\n${tips.map(t => `- "${t}"`).join('\n')}\n\nOr ask about any specific service by name.`;
  }
}
