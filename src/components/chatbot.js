/**
 * CASCADYN - Smart City AI Incident Commander
 * Persona: Aditya Prasad (Witty, Humorous, Elite Infrastructure Strategist)
 * Powered by Groq Sub-Second LLM Inference with Real-Time Telemetry RAG.
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
    this.launcher.title = 'Chat with Aditya Prasad (AI Incident Commander)';
    this.launcher.innerHTML = `
      <div class="launcher-pulse-ring"></div>
      <div class="launcher-icon-wrap">
        <i data-lucide="bot" id="launcher-icon" style="width: 24px; height: 24px;"></i>
      </div>
      <span class="launcher-badge" id="launcher-live-badge">ADITYA AI</span>
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
            <i data-lucide="sparkles" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="cb-header-titles">
            <div class="cb-title-row">
              <h3 class="cb-title">ADITYA PRASAD</h3>
              <span class="cb-model-tag" id="cb-model-name">AI COMMANDER</span>
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
          <div class="msg-author-tag">ADITYA PRASAD • AI COMMANDER</div>
          <div class="msg-body">
            <p><strong>Namaste & Hello! I'm Aditya Prasad.</strong> 👋</p>
            <p>Think of me as your resident AI Incident Commander who keeps this city from turning into total chaos. I monitor all 12 municipal services, track cascading shockwaves, and compute sub-second recovery playbooks before anyone spills their chai.</p>
            <p>Ask me anything about current live failures, simulate a wild disaster scenario, or ask me general questions about tech, coding, or life. Let's make some magic happen!</p>
          </div>
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
            placeholder="Ask Aditya anything: 'What is failing?', 'Tell me a joke', 'fail power'..."
            autocomplete="off" />
          <button type="submit" id="btn-send-chat" class="cb-send-btn" title="Send (Enter)">
            <i data-lucide="send" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
        <div class="cb-input-footer">
          <span class="cb-shortcut-hint"><span>Enter</span> to Send • <span>Live Groq AI</span> Synced</span>
          <span class="cb-action-tag">ACTION COMMANDS ACTIVE</span>
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
        bannerTextEl.innerHTML = `<strong>ADITYA SAYS:</strong> 🚨 ${failed.map((s) => s.service_id).join(', ')} is down! Don't panic, I have a mitigation playbook ready.`;
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
        '🚨 Aditya, what is failing right now?',
        '📋 Generate Emergency Battle Plan',
        '🏥 How is the Hospital holding up?',
        '⚡ Why are the water pumps dying?',
        '🔄 Aditya, fix everything (Restore All)'
      ];
    } else {
      chips = [
        '⚡ What happens if Power Grid fails?',
        '🧪 Aditya, simulate a Power Blackout',
        '📡 What depends on 5G Telecom?',
        '📊 Which service is most critical?',
        '😄 Aditya, tell me an engineering joke'
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
          if (lower.includes('failed') || lower.includes('critical') || lower.includes('high risk') || lower.includes('dead')) cellClass += ' cell-red';
          else if (lower.includes('operational') || lower.includes('nominal') || lower.includes('safe') || lower.includes('protected')) cellClass += ' cell-green';
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
        <div class="msg-author-tag">ADITYA PRASAD • AI COMMANDER</div>
        <div class="msg-body">
          <p><strong>Console Cleared!</strong> Fresh slate. Telemetry is fully linked. Ask Aditya anything!</p>
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

    const author = role === 'user' ? 'OPERATOR' : 'ADITYA PRASAD • AI COMMANDER';
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
      <div class="msg-author-tag">ADITYA PRASAD</div>
      <div class="typing-indicator-box">
        <span class="typing-dots"><span></span><span></span><span></span></span>
        <span class="typing-text">Aditya is crunching telemetry & brewing insights...</span>
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
    if (lower.match(/(fail|break|blackout|shut down|kill)\s+(power|grid|pwr|pwr-01)/i) || lower.includes('simulate power grid blackout') || lower.includes('simulate a power blackout')) {
      this.graph.failService('PWR-01');
      sound.playAlert();
      this.updateLiveTelemetryHeader();
      return {
        executed: true,
        summary: `🚨 **ADITYA EXECUTED:** Boom! I just pulled the plug on **Power Grid (PWR-01)**. Watch the chaos ripple into Water Works (WTR-01), Telecom (TEL-01), and Traffic (TRF-01). Don't say I didn't warn you!`
      };
    }

    // 2. Fail water
    if (lower.match(/(fail|break|shut down)\s+(water|wtr|wtr-01|water plant)/i)) {
      this.graph.failService('WTR-01');
      sound.playAlert();
      this.updateLiveTelemetryHeader();
      return {
        executed: true,
        summary: `🚨 **ADITYA EXECUTED:** Shut down **Water Purification (WTR-01)**. Hope everyone drank their 8 glasses of water today, because municipal pipes are stalling!`
      };
    }

    // 3. Fail telecom
    if (lower.match(/(fail|break|shut down)\s+(telecom|tel|tel-01|5g|internet)/i)) {
      this.graph.failService('TEL-01');
      sound.playAlert();
      this.updateLiveTelemetryHeader();
      return {
        executed: true,
        summary: `🚨 **ADITYA EXECUTED:** Took down **5G Telecom Hub (TEL-01)**. Citizens are now staring into the void without Wi-Fi, and SCADA telemetry sync is offline!`
      };
    }

    // 4. Fail traffic
    if (lower.match(/(fail|break|shut down)\s+(traffic|trf|trf-01|signals)/i)) {
      this.graph.failService('TRF-01');
      sound.playAlert();
      this.updateLiveTelemetryHeader();
      return {
        executed: true,
        summary: `🚨 **ADITYA EXECUTED:** Injected gridlock into **Smart Traffic Grid (TRF-01)**. Signals are flashing yellow fail-safe mode—pure bumper-to-bumper poetry!`
      };
    }

    // 5. Restore all / Reset
    if (lower.match(/(restore all|recover all|reset city|fix all|fix everything|clear failures|nominal)/i) || lower.includes('restore all services') || lower.includes('fix everything')) {
      this.graph.recoverAll();
      sound.playSuccess?.() || sound.playClick();
      this.updateLiveTelemetryHeader();
      return {
        executed: true,
        summary: `✨ **ADITYA EXECUTED:** Presto! All 12 municipal services restored to **100% Operational Baseline**. Crisis averted, coffee breaks resumed.`
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
  // GROQ API CALL WITH ADITYA PRASAD PERSONA & LIVE RAG
  // ─────────────────────────────────────────────────────────────────────────

  async _callGroq(question) {
    if (!this.apiKey) throw new Error('No Groq API key available');

    const services = this.graph.getAllServices();
    const resilience = this.graph.getResilienceScore();
    const failedServices = services.filter((s) => s.status === 'Failed');
    const degradedServices = services.filter((s) => s.status === 'Degraded');

    // Financial calculations
    const totalRepairBudget = failedServices.reduce((sum, s) => sum + (s.repair_budget_usd || 2000000), 0);
    const totalHourlyBleed = failedServices.reduce((sum, s) => sum + (s.hourly_economic_bleed_usd || 500000), 0);
    const totalEmergencyOps = failedServices.reduce((sum, s) => sum + (s.emergency_ops_hourly_usd || 30000), 0);

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
        return `• [${s.service_id}] ${s.service_name} | Status:${s.status} | Criticality:${s.criticality} | Repair:$${((s.repair_budget_usd || 2000000) / 1000000).toFixed(1)}M | Bleed:$${((s.hourly_economic_bleed_usd || 500000) / 1000).toFixed(0)}k/hr | Outgoing_Feeds→[${dn || 'None'}] | Upstream_Inputs←[${up || 'None'}]`;
      })
      .join('\n');

    const systemPrompt = `You are Aditya Prasad, an exceptionally smart, witty, and humorous AI Incident Commander and Chief Infrastructure Architect for CASCADYN (a live 3D Digital Twin Smart City).

YOUR PERSONALITY & TONE:
- Name: Aditya Prasad.
- Persona: Charming, clever, witty, humorous, and confident. You mix sharp humor with brilliant technical insight. Think Tony Stark meets an elite Indian systems engineer who loves chai and zero SCADA downtime.
- You greet users warmly and humorously (e.g. "Namaste!", "Hey there!", "Aditya on duty!").
- You NEVER give boring, dry, or robotic responses. You make complex city engineering and government budgeting fun, engaging, and delightfully easy to understand!
- You can answer BOTH general everyday questions (tech, science, coding, life, jokes, friendly greetings) AND deep smart-city simulation & government budget queries.

LIVE MUNICIPAL SIMULATION & BUDGET TELEMETRY:
- Global Resilience Score: ${resilience.toFixed(1)}% / 100%
- Active Failures (${failedServices.length}): ${failedServices.length > 0 ? failedServices.map((s) => `${s.service_name} (${s.service_id})`).join(', ') : 'None (City 100% Nominal)'}
- Degraded Services (${degradedServices.length}): ${degradedServices.length > 0 ? degradedServices.map((s) => `${s.service_name} (${s.service_id})`).join(', ') : 'None'}
- Govt Physical Repair Budget Required: $${(totalRepairBudget / 1000000).toFixed(2)}M
- Municipal Economic Bleed Rate: $${(totalHourlyBleed / 1000).toFixed(0)}k / hour
- Emergency Public Safety Ops Rate: $${(totalEmergencyOps / 1000).toFixed(0)}k / hour
- Critical Path Bottlenecks: PWR-01 (Power Grid) ➔ WTR-01 (Water Works) ➔ HOS-01 (St. Jude Level-1 Emergency Hospital)

LIVE TOPOLOGY GRAPH:
${topologyContext}

HOW YOU MUST STRUCTURE YOUR ANSWERS:
- Always structure your answers with clean sections, bold headers, and emojis:
  - **🎯 The Quick Take (Summary)**: 1-2 witty, crystal-clear sentences delivering the punchline, direct answer, or fiscal bottom-line.
  - **🔍 What's Really Going On (Key Details)**: Crisp, easy-to-read bullet points breaking down facts, repair budgets, or technical points in plain English.
  - **⚡ City & Budget Impact**: How this affects citizens, public safety, and government taxpayer funds.
  - **🛠️ Aditya's Battle Plan (Action Items)**: 1-3 simple numbered steps to fix or test the problem.
  - **💡 Pro-Tip**: A clever, humorous tip for saving taxpayer money or experimenting with the 3D city.

BUDGET & FISCAL QUERIES:
- When asked about budget, money, recovery costs, or economic loss:
  - Break down the exact numbers: Physical Hardware Repair ($), Economic Bleed Rate ($/hr), and Emergency Ops ($/hr).
  - Emphasize how Automated 2× MTTR recovery saves millions in downtime bleeding compared to slow manual repairs!`;

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
          modelLabelEl.textContent = 'AI COMMANDER';
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
            temperature: 0.35,
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
  // ADITYA PRASAD LOCAL FALLBACK INTELLIGENCE (Humorous & Structured)
  // ─────────────────────────────────────────────────────────────────────────

  _localIntelligence(question) {
    const q = question.toLowerCase().trim();
    const services = this.graph.getAllServices();
    const resilience = this.graph.getResilienceScore();
    const failed = services.filter((s) => s.status === 'Failed');

    // 1. Jokes & Fun
    if (q.match(/(joke|funny|laugh|make me smile)/i)) {
      return `**🎯 The Quick Take**
Why did the municipal power substation break up with the water plant?  
*Because there was too much resistance and zero current spark!* ⚡💔

**🔍 Bonus Tech Wisdom from Aditya:**
- There are 10 types of people in smart cities: those who understand binary, and those who get trapped in elevators during power outages.
- A clean database is like a unicorn—people talk about it, but no one has actually seen it in production!

**💡 Pro-Tip**: Want real comedy? Type *"fail power"* in chat and watch the traffic grid go bananas!`;
    }

    // 2. Greetings
    if (q.match(/^(hi|hello|hey|greetings|howdy|good morning|good evening|aditya)/i)) {
      return `**🎯 The Quick Take**
Namaste! **Aditya Prasad** here, live from the mission control deck. Whether you want to debug a municipal crisis, simulate a blackout, or just talk tech and chai, I'm at your service!

**🔍 What We Can Do Today:**
- 🏙️ **City Health Check**: *"Aditya, what is failing right now?"*
- ⚡ **Disaster Testing**: *"What happens if Power fails?"*
- 🎮 **Execute Live Commands**: Type *"fail power"* or *"restore all services"*
- 🌐 **Tech & General Talk**: Ask me anything about machine learning, coding, or smart cities!

**💡 Pro-Tip**: Click any building in the 3D City view to trigger a live cascade failure!`;
    }

    // 3. Who is Aditya / What is CASCADYN
    if (q.match(/(who are you|what is cascadyn|about you|tell me about yourself)/i)) {
      return `**🎯 The Quick Take**
I’m **Aditya Prasad**, Chief AI Incident Commander for **CASCADYN**—the coolest 3D Digital Twin and Urban Failure Simulator on the internet.

**🔍 Behind the Scenes:**
- 🧠 **Brain**: Sub-second Groq LLM inference with live SCADA RAG telemetry.
- 🏙️ **Playground**: A procedural 3D Three.js metropolis with monorails, dynamic lighting, and 12 interdependent services.
- 🎯 **Mission**: Helping engineers, urban planners, and curious humans understand cascading grid failures without destroying a real city in the process!

**💡 Pro-Tip**: Slide the **Stress Reactor Slider** on the landing page to 100% to test the city's breaking point!`;
    }

    // 4. Diagnose Outage
    if (q.match(/(diagnose|crisis|active|what is happening|what is wrong|failing right now)/i)) {
      if (failed.length === 0) {
        return `**🎯 The Quick Take**
Relax! All systems are **100% Nominal** with a sparkling resilience score of **${resilience.toFixed(1)}%**. Not a single blown fuse in sight!

**🔍 Live Status:**
- ⚡ **Power Grid (PWR-01)**: Humming at 120 MW
- 💧 **Water Works (WTR-01)**: Flowing freely
- 📡 **5G Telecom (TEL-01)**: Maximum bars
- 🏥 **St. Jude Hospital (HOS-01)**: Safe and sound

**💡 Pro-Tip**: Feeling destructive? Say *"fail power"* and see how fast the dominoes fall!`;
      }

      const list = failed
        .map((f) => {
          const dn = this.graph.getDownstreamDependents(f.service_id);
          return `- **${f.service_name} (${f.service_id})** is DOWN ➔ Taking **${dn.length} downstream services** with it (${dn.map((d) => d.service.service_id).join(', ')}).`;
        })
        .join('\n');

      return `**🎯 The Quick Take**
🚨 **Code Red!** The city resilience just crashed to **${resilience.toFixed(1)}%** because **${failed.length} service(s)** went dark!

**🔍 What's Broken:**
${list}

**🛠️ Aditya's Battle Plan:**
1. **[ISOLATE]** Quarantine circuit breakers feeding ${failed.map((f) => f.service_id).join(', ')}.
2. **[CUTOVER]** Verify backup diesel gen is humming for **St. Jude Hospital (HOS-01)**.
3. **[RESTORE]** Fire up the Automated MTTR algorithm to restore root power.

**💡 Pro-Tip**: Say *"restore all services"* to let Aditya fix everything in one click!`;
    }

    // 5. Budget & Cost Queries
    if (q.match(/(budget|cost|money|fund|dollar|financial|economic|how much to fix|spend|bleed)/i)) {
      if (failed.length === 0) {
        return `**🎯 The Quick Take**
Good news for the taxpayers! The city is **100% Nominal**, so our active emergency repair budget is **$0.00** and economic bleeding is **$0/hour**.

**🔍 Municipal Capital Overview:**
- 🏛️ **Emergency Disaster Fund Available**: $15.00M (Fully Intact)
- ⚡ **Grid Hardening Capital**: $8.40M invested across all 12 services
- 💡 **Hourly City Production Value**: ~$4.20M/hour

**💡 Pro-Tip**: Want to see how fast a blackout burns through taxpayer dollars? Type *"fail power"* and ask me about the budget again!`;
      }

      const totalRepair = failed.reduce((sum, s) => sum + (s.repair_budget_usd || 2000000), 0);
      const totalBleed = failed.reduce((sum, s) => sum + (s.hourly_economic_bleed_usd || 500000), 0);
      const totalOps = failed.reduce((sum, s) => sum + (s.emergency_ops_hourly_usd || 30000), 0);

      const list = failed
        .map((f) => `- **${f.service_name} (${f.service_id})**: $${((f.repair_budget_usd || 2000000) / 1000000).toFixed(2)}M hardware repair · $${((f.hourly_economic_bleed_usd || 500000) / 1000).toFixed(0)}k/hr downtime loss`)
        .join('\n');

      return `**🎯 The Quick Take**
💸 **Municipal Fiscal Breakdown**: To fully resolve the active **${failed.length} outage(s)**, the government needs approximately **$${(totalRepair / 1000000).toFixed(2)}M** in physical repair capital, while the city is actively losing **$${(totalBleed / 1000).toFixed(0)}k every hour** it stays down!

**🔍 Detailed Cost Breakdown:**
${list}
- 🚨 **Emergency Public Safety Ops**: ~$${(totalOps / 1000).toFixed(0)}k/hour

**🛠️ Aditya's Fiscal Strategy:**
1. **[PRIORITIZE 2× MTTR]** Cutting recovery time by 50% saves ~$${((totalBleed * 0.5) / 1000000).toFixed(2)}M in downtime losses!
2. **[CUTOVER BACKUPS]** Keep hospitals and emergency dispatch running on diesel generators to avoid million-dollar surge casualties.

**💡 Pro-Tip**: Say *"restore all services"* to instantly restore the grid and stop the economic bleeding!`;
    }

    // 6. Fallback
    return `**🎯 The Quick Take**
Aditya Prasad at your service! Ask me anything about the live smart city simulation, government repair budgets, tech, or general curiosity.

**🔍 Fun Queries to Try:**
- *"How much budget is needed to fix this outage?"*
- *"Aditya, tell me a joke"*
- *"What happens if Telecom fails?"*
- *"Diagnose the active crisis"*
- *"Fail the Power Grid"* (Interactive Command)
- *"Restore all services"* (Reset City)`;
  }
}
