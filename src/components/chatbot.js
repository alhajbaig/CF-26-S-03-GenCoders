/**
 * CASCADYN - Smart City AI Incident Commander & Infrastructure Chatbot
 * Real-Time Telemetry RAG Integration with Groq High-Speed LLM Inference.
 * Automatically synchronizes with live simulation scenarios, active cascade failures,
 * What-If disaster matrices, and DAG coupling states.
 */

import { sound } from '../engine/audioEngine.js';

const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
  'groq/compound'
];

const DEFAULT_GROQ_KEY = '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';

export class SmartCityChatbot {
  constructor(containerElement, graph, apiKey) {
    this.container = containerElement;
    this.graph = graph;
    this.apiKey = apiKey || import.meta.env.VITE_GROQ_API_KEY || DEFAULT_GROQ_KEY;
    this.isOpen = false;
    this.messages = [];
    this.chatHistory = []; // multi-turn conversation memory
    this.element = null;
    this.currentModelIdx = 0;

    this.init();
    this._subscribeToGraphEvents();
  }

  init() {
    // 1. Floating Launcher Button with Live Pulse Ring
    this.launcher = document.createElement('button');
    this.launcher.id = 'chatbot-launcher';
    this.launcher.className = 'chatbot-launcher-btn';
    this.launcher.title = 'Open Groq AI Incident Commander';
    this.launcher.innerHTML = `
      <div class="launcher-pulse-ring"></div>
      <div class="launcher-icon-wrap">
        <i data-lucide="bot" id="launcher-icon" style="width: 24px; height: 24px;"></i>
      </div>
      <span class="launcher-badge" id="launcher-live-badge">AI LIVE</span>
    `;
    this.container.appendChild(this.launcher);

    // 2. High-Tech Glassmorphic Chatbot Panel Container
    this.element = document.createElement('div');
    this.element.id = 'chatbot-panel';
    this.element.className = 'chatbot-panel-container collapsed';
    this.element.innerHTML = `
      <!-- SCADA Telemetry Header -->
      <div class="chatbot-header">
        <div class="cb-header-left">
          <div class="bot-avatar-badge">
            <i data-lucide="bot" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="cb-header-titles">
            <div class="cb-title-row">
              <h3 class="cb-title">CASCADYN AI COMMANDER</h3>
              <span class="cb-model-tag" id="cb-model-name">GROQ GPT-120B</span>
            </div>
            <div class="cb-status-row">
              <span class="cb-status-dot" id="cb-status-dot"></span>
              <span class="cb-status-text" id="cb-resilience-badge">● RESILIENCE: 100% (NOMINAL)</span>
            </div>
          </div>
        </div>

        <div class="cb-header-actions">
          <button id="btn-clear-chat" class="cb-icon-btn" title="Clear Conversation">
            <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
          </button>
          <button id="btn-close-chatbot" class="cb-icon-btn close-btn" title="Minimize Console">
            <i data-lucide="x" style="width: 17px; height: 17px;"></i>
          </button>
        </div>
      </div>

      <!-- Live Scenario Alert Banner -->
      <div class="cb-scenario-banner" id="cb-scenario-banner" style="display: none;">
        <span class="banner-icon">⚠️</span>
        <span class="banner-text" id="cb-banner-text">Active Crisis Detected: 0 Services Disrupted</span>
      </div>

      <!-- Scrollable Message Stream -->
      <div class="chatbot-messages" id="chatbot-messages-stream">
        <div class="chat-message bot">
          <div class="msg-author-tag">GROQ DISPATCHER</div>
          <p><strong>System Online.</strong> I am the <strong>CASCADYN AI Incident Commander</strong> powered by sub-second Groq inference. I have full real-time telemetry access to all 12 municipal services, continuous coupling weights (\(W_{u,v}\)), and active cascade shockwaves.</p>
          <p>Ask me anything about current live failures, simulate emergency disaster scenarios, or ask for targeted tactical recovery playbooks.</p>
        </div>
      </div>

      <!-- Dynamic Context-Aware Suggestion Chips -->
      <div class="chatbot-suggestions-tray" id="chatbot-suggestions-tray">
        <!-- Generated dynamically based on live city status -->
      </div>

      <!-- Interactive Input Form -->
      <form class="chatbot-input-area" id="chatbot-input-form">
        <div class="cb-input-wrap">
          <input type="text" id="chatbot-text-input"
            placeholder="Ask about live failures, dependencies, MTTR, or execute 'fail power'..."
            autocomplete="off" />
          <button type="submit" id="btn-send-chat" class="cb-send-btn" title="Send (Enter)">
            <i data-lucide="send" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
        <div class="cb-input-footer">
          <span class="cb-shortcut-hint"><span>Enter</span> to Send • <span>Live RAG</span> Synced</span>
          <span class="cb-action-tag">ACTION COMMANDS ENABLED</span>
        </div>
      </form>
    `;
    this.container.appendChild(this.element);

    if (window.lucide) window.lucide.createIcons();
    this._bindEvents();
    this.updateLiveTelemetryHeader();
  }

  _subscribeToGraphEvents() {
    if (this.graph && typeof this.graph.onStateChange === 'function') {
      this.graph.onStateChange(() => {
        this.updateLiveTelemetryHeader();
      });
    }
  }

  _bindEvents() {
    // Toggle Button
    this.launcher.addEventListener('click', () => {
      sound.playClick();
      this.toggle();
    });

    // Close Button
    this.element.querySelector('#btn-close-chatbot').addEventListener('click', () => {
      sound.playClick();
      this.close();
    });

    // Clear Chat
    this.element.querySelector('#btn-clear-chat').addEventListener('click', () => {
      sound.playClick();
      this._clearMessages();
    });

    // Submit Form
    const form = this.element.querySelector('#chatbot-input-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = this.element.querySelector('#chatbot-text-input');
      const text = input ? input.value.trim() : '';
      if (text) {
        input.value = '';
        this._handleSubmit(text);
      }
    });
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    this.isOpen = true;
    this.element.classList.remove('collapsed');
    this.launcher.classList.add('active');
    this.updateLiveTelemetryHeader();
    const input = this.element.querySelector('#chatbot-text-input');
    if (input) setTimeout(() => input.focus(), 200);
  }

  close() {
    this.isOpen = false;
    this.element.classList.add('collapsed');
    this.launcher.classList.remove('active');
  }

  updateLiveTelemetryHeader() {
    if (!this.graph) return;
    const services = this.graph.getAllServices();
    const resilience = this.graph.getResilienceScore();
    const failed = services.filter((s) => s.status === 'Failed');
    const degraded = services.filter((s) => s.status === 'Degraded');

    const badgeEl = this.element.querySelector('#cb-resilience-badge');
    const dotEl = this.element.querySelector('#cb-status-dot');
    const bannerEl = this.element.querySelector('#cb-scenario-banner');
    const bannerTextEl = this.element.querySelector('#cb-banner-text');

    if (badgeEl && dotEl) {
      if (failed.length > 0) {
        badgeEl.textContent = `● RESILIENCE: ${resilience.toFixed(1)}% (${failed.length} CRITICAL OUTAGE)`;
        badgeEl.style.color = '#EF4444';
        dotEl.style.background = '#EF4444';
        dotEl.style.boxShadow = '0 0 10px #EF4444';
      } else if (degraded.length > 0) {
        badgeEl.textContent = `● RESILIENCE: ${resilience.toFixed(1)}% (${degraded.length} DEGRADED)`;
        badgeEl.style.color = '#F97316';
        dotEl.style.background = '#F97316';
        dotEl.style.boxShadow = '0 0 10px #F97316';
      } else {
        badgeEl.textContent = `● RESILIENCE: ${resilience.toFixed(1)}% (NOMINAL)`;
        badgeEl.style.color = '#10B981';
        dotEl.style.background = '#10B981';
        dotEl.style.boxShadow = '0 0 10px #10B981';
      }
    }

    if (bannerEl && bannerTextEl) {
      if (failed.length > 0) {
        bannerEl.style.display = 'flex';
        bannerTextEl.innerHTML = `<strong>ACTIVE CRISIS:</strong> ${failed.map((s) => s.service_id).join(', ')} failed! Telemetry synchronized.`;
      } else {
        bannerEl.style.display = 'none';
      }
    }

    this._renderDynamicChips(failed, resilience);
  }

  _renderDynamicChips(failed, resilience) {
    const tray = this.element.querySelector('#chatbot-suggestions-tray');
    if (!tray) return;

    let chips = [];
    if (failed.length > 0) {
      chips = [
        '🚨 Diagnose Active Crisis',
        '📋 Generate Emergency Playbook',
        '🏥 Check Hospital Safety Status',
        '⚡ Why are downstream nodes failing?',
        '🔄 Restore All Services'
      ];
    } else {
      chips = [
        '⚡ What depends on Power?',
        '🧪 Simulate Power Grid Blackout',
        '📡 What happens if Telecom fails?',
        '📊 Which service is most critical?',
        '🔍 Identify Critical Bottlenecks'
      ];
    }

    tray.innerHTML = chips
      .map((c) => `<button class="cb-chip-btn">${c}</button>`)
      .join('');

    tray.querySelectorAll('.cb-chip-btn').forEach((chip) => {
      chip.addEventListener('click', () => {
        sound.playClick();
        const text = chip.textContent.trim();
        this._handleSubmit(text);
      });
    });
  }

  _formatMarkdown(text) {
    if (!text) return '';

    // 1. Clean reasoning blocks if any exist
    let formatted = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    // 2. Convert code blocks
    formatted = formatted.replace(/```([a-z]*)\n([\s\S]*?)```/gi, '<pre class="cb-code-block"><code>$2</code></pre>');

    // 3. Convert Markdown Tables into styled SCADA tables
    formatted = formatted.replace(/(\|.+?\|\n\|[-:| ]+?\|\n(?:\|.+?\|\n?)+)/g, (match) => {
      const rows = match.trim().split('\n').map((r) => r.trim()).filter(Boolean);
      if (rows.length < 2) return match;
      const headerCols = rows[0].split('|').map((c) => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
      const bodyRows = rows.slice(2);

      let html = '<div class="cb-table-wrapper"><table class="cb-table"><thead><tr>';
      headerCols.forEach((h) => {
        html += `<th>${h}</th>`;
      });
      html += '</tr></thead><tbody>';

      bodyRows.forEach((row) => {
        const cols = row.split('|').map((c) => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
        html += '<tr>';
        cols.forEach((col, idx) => {
          let cellClass = 'cb-cell';
          const lower = col.toLowerCase();
          if (lower.includes('failed') || lower.includes('critical') || lower.includes('high risk')) cellClass += ' cell-red';
          else if (lower.includes('operational') || lower.includes('nominal') || lower.includes('safe')) cellClass += ' cell-green';
          else if (lower.includes('high') || lower.includes('degraded') || lower.includes('warning')) cellClass += ' cell-orange';
          else if (idx === 0) cellClass += ' cell-id';
          html += `<td class="${cellClass}">${col}</td>`;
        });
        html += '</tr>';
      });
      html += '</tbody></table></div>';
      return html;
    });

    // 4. Format Section Headings (### or **🎯 Header**)
    formatted = formatted.replace(/^###\s+(.*?)$/gm, '<h4 class="cb-section-title">$1</h4>');
    formatted = formatted.replace(/^##\s+(.*?)$/gm, '<h3 class="cb-section-title main">$1</h3>');

    // 5. Format Action & Protocol Badges
    formatted = formatted.replace(/\[ACTION ([0-9]+)\]/gi, '<span class="cb-badge action">ACTION $1</span>');
    formatted = formatted.replace(/\[(ISOLATE|CUTOVER|RESTORE|MONITOR|ALERT|CRITICAL|PRE-EMPTIVE|SCADA READY|PRO-TIP|TIP)\]/gi, '<span class="cb-badge $1">$1</span>');

    // 6. Format bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 7. Format inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="cb-inline-code">$1</code>');

    // 8. Format Node IDs (PWR-01, WTR-01, etc.)
    formatted = formatted.replace(/\b(PWR|WTR|TEL|TRF|TRN|HOS|EMG|POL|FIR|GOV|FIN|IND)-01\b/g, '<span class="cb-node-pill">$1-01</span>');

    // 9. Format Dividers
    formatted = formatted.replace(/^---$/gm, '<div class="cb-divider"></div>');

    // 10. Format bullet points and sub-bullets
    formatted = formatted.replace(/^\s*[-*•]\s+(.*?)$/gm, '<div class="cb-bullet-item"><span class="bullet-dot">›</span><span>$1</span></div>');
    formatted = formatted.replace(/^\s*([0-9]+)\.\s+(.*?)$/gm, '<div class="cb-bullet-item"><span class="bullet-num">$1.</span><span>$2</span></div>');

    // 11. Paragraphs and Linebreaks
    formatted = formatted.replace(/\n\n/g, '<div class="cb-para-gap"></div>');
    formatted = formatted.replace(/\n/g, '<br/>');

    return formatted;
  }

  _clearMessages() {
    const stream = this.element.querySelector('#chatbot-messages-stream');
    if (!stream) return;
    this.messages = [];
    this.chatHistory = [];
    stream.innerHTML = `
      <div class="chat-message bot">
        <div class="msg-author-tag">GROQ DISPATCHER</div>
        <div class="msg-body">
          <p><strong>Console Cleared.</strong> Telemetry link synchronized. Ready for any questions or simulation tasks!</p>
        </div>
      </div>
    `;
    this.updateLiveTelemetryHeader();
  }

  _addMessage(role, text, isAction = false) {
    const stream = this.element.querySelector('#chatbot-messages-stream');
    if (!stream) return;
    const div = document.createElement('div');
    div.className = `chat-message ${role} ${isAction ? 'action-msg' : ''}`;

    const author = role === 'user' ? 'OPERATOR' : 'GROQ DISPATCHER • LIVE TELEMETRY';
    const formatted = this._formatMarkdown(text);

    div.innerHTML = `
      <div class="msg-author-tag">${author}</div>
      <div class="msg-body">${formatted}</div>
    `;

    stream.appendChild(div);
    stream.scrollTop = stream.scrollHeight;

    if (window.lucide) window.lucide.createIcons();
  }

  _showTyping() {
    const stream = this.element.querySelector('#chatbot-messages-stream');
    if (!stream) return;
    const div = document.createElement('div');
    div.className = 'chat-message bot typing-msg';
    div.id = 'typing-indicator';
    div.innerHTML = `
      <div class="msg-author-tag">GROQ DISPATCHER</div>
      <div class="typing-indicator-box">
        <span class="typing-dots"><span></span><span></span><span></span></span>
        <span class="typing-text">Thinking & structuring response...</span>
      </div>
    `;
    stream.appendChild(div);
    stream.scrollTop = stream.scrollHeight;
  }

  _removeTyping() {
    const el = this.element.querySelector('#typing-indicator');
    if (el) el.remove();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ACTION COMMAND EXECUTOR (Direct Simulator Actions from Chat)
  // ─────────────────────────────────────────────────────────────────────────

  _checkForActionCommands(text) {
    const lower = text.toLowerCase();

    // 1. Fail power
    if (lower.match(/(fail|break|blackout|shut down|kill)\s+(power|grid|pwr|pwr-01)/i) || lower.includes('simulate power grid blackout')) {
      this.graph.failService('PWR-01');
      sound.playAlert();
      this.updateLiveTelemetryHeader();
      return {
        executed: true,
        summary: `🚨 **ACTION EXECUTED:** Injected catastrophic outage into **Power Grid (PWR-01)**. Cascading shockwaves are now propagating through Water Works (WTR-01), Telecom (TEL-01), and Traffic (TRF-01).`
      };
    }

    // 2. Fail water
    if (lower.match(/(fail|break|shut down)\s+(water|wtr|wtr-01|water plant)/i)) {
      this.graph.failService('WTR-01');
      sound.playAlert();
      this.updateLiveTelemetryHeader();
      return {
        executed: true,
        summary: `🚨 **ACTION EXECUTED:** Injected failure into **Water Purification (WTR-01)**. Hospital cooling and municipal water pressure dropping.`
      };
    }

    // 3. Fail telecom
    if (lower.match(/(fail|break|shut down)\s+(telecom|tel|tel-01|5g|internet)/i)) {
      this.graph.failService('TEL-01');
      sound.playAlert();
      this.updateLiveTelemetryHeader();
      return {
        executed: true,
        summary: `🚨 **ACTION EXECUTED:** Injected failure into **5G Telecom Hub (TEL-01)**. SCADA telemetry synchronization and emergency dispatch links degraded.`
      };
    }

    // 4. Fail traffic
    if (lower.match(/(fail|break|shut down)\s+(traffic|trf|trf-01|signals)/i)) {
      this.graph.failService('TRF-01');
      sound.playAlert();
      this.updateLiveTelemetryHeader();
      return {
        executed: true,
        summary: `🚨 **ACTION EXECUTED:** Injected failure into **Smart Traffic Grid (TRF-01)**. Traffic signals flashing yellow fail-safe mode.`
      };
    }

    // 5. Restore all / Reset
    if (lower.match(/(restore all|recover all|reset city|fix all|clear failures|nominal)/i) || lower.includes('restore all services')) {
      this.graph.recoverAll();
      sound.playSuccess?.() || sound.playClick();
      this.updateLiveTelemetryHeader();
      return {
        executed: true,
        summary: `✅ **ACTION EXECUTED:** Triggered Full Grid Recovery. All 12 municipal services restored to **100% Operational Baseline**.`
      };
    }

    return null;
  }

  async _handleSubmit(text) {
    this._addMessage('user', text);

    // Check if user requested an interactive command
    const actionResult = this._checkForActionCommands(text);
    if (actionResult && actionResult.executed) {
      this._addMessage('bot', actionResult.summary, true);
    }

    this._showTyping();

    let response;
    try {
      response = await this._callGroq(text);
    } catch (err) {
      console.warn('Groq API fallback triggered:', err.message);
      response = this._localIntelligence(text);
    }

    this._removeTyping();

    // Clean any reasoning blocks like <think>
    response = response.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    this._addMessage('bot', response);
    this.updateLiveTelemetryHeader();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GROQ API CALL WITH LIVE SCENARIO RAG CONTEXT
  // ─────────────────────────────────────────────────────────────────────────

  async _callGroq(question) {
    if (!this.apiKey) throw new Error('No Groq API key available');

    const services = this.graph.getAllServices();
    const resilience = this.graph.getResilienceScore();
    const failedServices = services.filter((s) => s.status === 'Failed');
    const degradedServices = services.filter((s) => s.status === 'Degraded');

    // Build Live Topology Context
    const topologyContext = services
      .map((s) => {
        const dn = this.graph
          .getDownstreamDependents(s.service_id)
          .map((e) => `${e.service.service_id}(w=${e.strength.toFixed(2)})`)
          .join(', ');
        const up = this.graph
          .getUpstreamDependencies(s.service_id)
          .map((e) => `${e.service.service_id}(w=${e.strength.toFixed(2)})`)
          .join(', ');
        return `• [${s.service_id}] ${s.service_name} | Status:${s.status} | Criticality:${s.criticality} | MTTR:${s.recovery_time} | Outgoing_Feeds→[${dn || 'None'}] | Upstream_Inputs←[${up || 'None'}]`;
      })
      .join('\n');

    const systemPrompt = `You are CASCADYN AI, a friendly, ultra-knowledgeable, and highly articulate assistant designed to answer BOTH general questions and smart city infrastructure simulation queries.

LIVE MUNICIPAL SIMULATION SCENARIO:
- Global Resilience Score: ${resilience.toFixed(1)}% / 100%
- Active Failures (${failedServices.length}): ${failedServices.length > 0 ? failedServices.map((s) => `${s.service_name} (${s.service_id})`).join(', ') : 'None (City 100% Nominal)'}
- Degraded Services (${degradedServices.length}): ${degradedServices.length > 0 ? degradedServices.map((s) => `${s.service_name} (${s.service_id})`).join(', ') : 'None'}
- Critical Path Bottlenecks: PWR-01 (Power Grid) ➔ WTR-01 (Water Works) ➔ HOS-01 (St. Jude Level-1 Emergency Hospital)

LIVE TOPOLOGY GRAPH:
${topologyContext}

HOW YOU MUST STRUCTURE YOUR ANSWERS:
1. ALWAYS provide friendly, crystal-clear, structured answers that are easy to read and understand at a glance.
2. Structure your answers with clear sections using bold headers and emojis:
   - **🎯 Summary**: 1-2 friendly, clear sentences providing the direct answer.
   - **🔍 Key Details**: Clean, well-spaced bullet points highlighting the most important facts.
   - **⚡ City Impact** (for simulation queries): Explain in simple terms which services and citizens are affected.
   - **🛠️ Action Items** (when troubleshooting/mitigating): 1-3 simple numbered steps.
   - **💡 Pro-Tip**: A short, helpful tip or suggestion for the user.
3. Be versatile! Answer everyday general queries (greetings, technology, science, general advice, explanations of concepts) with warmth and clarity. Never decline normal questions.
4. When discussing simulation events, use the live city telemetry above and reference service names with bold IDs (e.g. **Power Grid (PWR-01)**).`;

    // Multi-turn messages
    const messagesPayload = [
      { role: 'system', content: systemPrompt }
    ];

    // Include recent chat turns for multi-turn conversational context
    this.chatHistory.slice(-4).forEach((m) => {
      messagesPayload.push({ role: m.role, content: m.content });
    });

    messagesPayload.push({ role: 'user', content: question });

    // Try models in cascade
    let lastError = null;
    for (let i = 0; i < GROQ_MODELS.length; i++) {
      const model = GROQ_MODELS[(this.currentModelIdx + i) % GROQ_MODELS.length];
      try {
        const modelLabelEl = this.element.querySelector('#cb-model-name');
        if (modelLabelEl) {
          modelLabelEl.textContent = model.toUpperCase().replace('OPENAI/', '').replace('GROQ/', '');
        }

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: messagesPayload,
            temperature: 0.3,
            max_tokens: 650
          })
        });

        if (!res.ok) {
          throw new Error(`Groq API HTTP ${res.status}: ${await res.text()}`);
        }

        const data = await res.json();
        const output = data.choices?.[0]?.message?.content?.trim();
        if (output) {
          this.chatHistory.push({ role: 'user', content: question });
          this.chatHistory.push({ role: 'assistant', content: output });
          return output;
        }
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    throw lastError || new Error('All Groq models exhausted');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOCAL GRAPH INTELLIGENCE (Rich structured fallback for offline use)
  // ─────────────────────────────────────────────────────────────────────────

  _localIntelligence(question) {
    const q = question.toLowerCase().trim();
    const services = this.graph.getAllServices();
    const resilience = this.graph.getResilienceScore();
    const failed = services.filter((s) => s.status === 'Failed');

    // 1. Greetings & General Inquiries
    if (q.match(/^(hi|hello|hey|greetings|howdy|good morning|good evening)/i)) {
      return `**🎯 Summary**
Hello! I'm your **CASCADYN AI Assistant**. I can help you with general questions as well as live smart city infrastructure simulation analysis.

**🔍 What You Can Ask Me:**
- 🏙️ **Live City State**: *"What is failing right now?"* or *"What is the city resilience?"*
- ⚡ **Cascade Simulations**: *"What happens if Power Grid fails?"*
- 📋 **Emergency Playbooks**: *"How do we protect the hospital during an outage?"*
- 🎮 **Interactive Actions**: Type *"fail power"* or *"restore all services"* to trigger events!
- 🌐 **General Knowledge**: Ask me about smart cities, disaster resilience, or graph theory.

**💡 Pro-Tip**: You can click directly on any building in the 3D City view to trigger a cascade failure and watch the shockwaves propagate in real time!`;
    }

    // 2. What is CASCADYN / About
    if (q.match(/(what is cascadyn|who are you|about this project|how does this work)/i)) {
      return `**🎯 Summary**
**CASCADYN** is a cutting-edge **3D Digital Twin and Urban Infrastructure Failure Simulator** that models how cascading outages ripple through interdependent municipal systems.

**🔍 Key Components:**
- 🏙️ **3D Smart City Engine**: Real-time WebGL visualization with procedural skyscrapers, dynamic lighting, and monorail loops.
- 🔬 **2D Topology DAG**: Directed Acyclic Graph showing continuous physical coupling strengths between services.
- 🎛️ **Stress Reactor & What-If Sandbox**: Multi-vector disaster testing and MTTR recovery algorithm benchmarking.
- 🤖 **AI Incident Commander**: Real-time telemetry RAG dispatcher powered by Groq Llama-3 inference.

**💡 Pro-Tip**: Try adjusting the **Stress Reactor Console** on the landing page from 0% to 100% to see how municipal SCADA jitter behaves under severe load!`;
    }

    // 3. Diagnose Active Outage
    if (q.match(/(diagnose|crisis|active|what is happening|what is wrong|failing right now)/i)) {
      if (failed.length === 0) {
        return `**🎯 Summary**
All systems are currently **100% Nominal**. The city is operating smoothly with a global resilience score of **${resilience.toFixed(1)}%**.

**🔍 Infrastructure Highlights:**
- ⚡ **Power Grid (PWR-01)**: Operational (120 MW output)
- 💧 **Water Works (WTR-01)**: Operational (Nominal pressure)
- 📡 **5G Telecom (TEL-01)**: Operational (Full bandwidth)
- 🏥 **St. Jude Hospital (HOS-01)**: Protected (All life-support active)

**💡 Pro-Tip**: You can test a cascade by saying *"Fail power grid"* or clicking on any building in the 3D viewport!`;
      }

      const list = failed
        .map((f) => {
          const dn = this.graph.getDownstreamDependents(f.service_id);
          return `- **${f.service_name} (${f.service_id})** has FAILED ➔ Disrupting **${dn.length} downstream services** (${dn.map((d) => d.service.service_id).join(', ')}).`;
        })
        .join('\n');

      return `**🎯 Summary**
🚨 **Active Crisis Detected**: The city resilience has dropped to **${resilience.toFixed(1)}%** due to **${failed.length} critical outage(s)**.

**🔍 Live Outage Breakdown:**
${list}

**🛠️ Recommended Recovery Steps:**
1. **[ISOLATE]** Quarantine circuit breakers feeding ${failed.map((f) => f.service_id).join(', ')}.
2. **[CUTOVER]** Ensure auxiliary backup generators are engaged for **St. Jude Hospital (HOS-01)**.
3. **[RESTORE]** Execute priority MTTR algorithms on primary root substations.

**💡 Pro-Tip**: Say *"Restore all services"* to instantly clear the failures and reset the city to nominal!`;
    }

    // 4. What happens if Power fails
    if (q.match(/what happens.*(power|electricity|pwr)/i)) {
      return `**🎯 Summary**
The **Power Grid (PWR-01)** is the primary root hub of the city. If it collapses, it triggers a catastrophic multi-tier cascade across nearly all municipal services.

**🔍 Downstream Cascade Chain:**
- 💧 **Water Purification (WTR-01)**: Stalls within 4.5 minutes due to electric pump stoppage (92% coupling).
- 📡 **5G Telecom Hub (TEL-01)**: Depletes battery reserves within 9 minutes (86% coupling).
- 🚦 **Smart Traffic Grid (TRF-01)**: Flashes yellow fail-safe mode (82% coupling).
- 🏥 **St. Jude Hospital (HOS-01)**: Cuts over to auxiliary diesel generator backup (75% coupling).

**🛠️ Mitigation Strategy:**
- Prioritize root substation restoration using the **Automated 2× MTTR algorithm** to recover the entire grid in under 28 minutes.`;
    }

    // 5. General Fallback
    return `**🎯 Summary**
I'm here to help with both general inquiries and live smart city simulation queries!

**🔍 Quick Ideas to Try:**
- *"What is the current city resilience?"*
- *"What happens if Telecom fails?"*
- *"Generate an emergency mitigation playbook"*
- *"Explain what a cascading failure is"*
- *"Fail the Power Grid"* (Interactive Simulator Action)
- *"Restore all services"* (Reset City)`;
  }
}

