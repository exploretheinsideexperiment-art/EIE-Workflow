import { Workflow } from '../types/workflow';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  workflow: Omit<Workflow, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt' | 'executionCount' | 'lastExecutedAt'>;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'tpl_aajtak_telegram_broadcast',
    name: 'Aaj Tak Hindi State News → Telegram Live Broadcast',
    description: 'Enterprise 7-step pipeline: Schedules automated runs, fetches 18 state pages from Aaj Tak (https://www.aajtak.in/), extracts structured JSON-LD headlines, removes duplicate stories, formats rich Hindi news bulletins, and delivers directly to Telegram (Chat ID: 5102553052).',
    category: 'Communication',
    tags: ['Aaj Tak News', 'Telegram Bot', 'Cloud Delivery', 'Web Scraper', 'Deduplication', 'Hindi News'],
    workflow: {
      name: 'Aaj Tak State News to Telegram',
      description: 'Automated news pipeline that crawls Aaj Tak state portals, extracts headlines, deduplicates, and broadcasts formatted bulletins to Telegram.',
      active: true,
      viewport: { x: 50, y: 100, zoom: 0.85 },
      nodes: [
        {
          id: 'node_tg_sched',
          type: 'trigger_schedule',
          name: 'Every Day 9,21',
          category: 'Triggers',
          icon: 'Clock',
          position: { x: 60, y: 240 },
          inputs: [],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Trigger' }],
          config: {
            interval: 'hourly',
            cron: '0 0 9,21 * * *',
            cronExpression: '0 0 9,21 * * *'
          }
        },
        {
          id: 'node_state_list',
          type: 'core_code',
          name: 'State Pages List',
          category: 'Data',
          icon: 'Code',
          position: { x: 380, y: 240 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Trigger In' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'State URLs' }],
          config: {
            jsCode: "const base = 'https://www.aajtak.in/';\nconst list = [\n  ['उत्तर प्रदेश', 'uttar-pradesh'],\n  ['बिहार', 'bihar'],\n  ['मध्य प्रदेश', 'madhya-pradesh'],\n  ['राजस्थान', 'rajasthan'],\n  ['ओडिशा', 'odisha'],\n  ['पश्चिम बंगाल', 'west-bengal'],\n  ['कर्नाटक', 'karnataka'],\n  ['छत्तीसगढ़', 'india/chhattisgarh'],\n  ['दिल्ली', 'india/delhi'],\n  ['गुजरात', 'india/gujarat'],\n  ['हरियाणा', 'india/haryana'],\n  ['हिमाचल प्रदेश', 'india/himachal-pradesh'],\n  ['जम्मू-कश्मीर', 'india/jammu-kashmir'],\n  ['झारखंड', 'india/jharkhand'],\n  ['महाराष्ट्र', 'india/maharashtra'],\n  ['पंजाब', 'india/punjab'],\n  ['तेलंगाना', 'india/telangana'],\n  ['उत्तराखंड', 'india/uttarakhand'],\n];\nreturn list.map(([state, slug]) => ({ json: { state, url: base + slug } }));"
          }
        },
        {
          id: 'node_fetch_states',
          type: 'core_http',
          name: 'Fetch State Page',
          category: 'HTTP',
          icon: 'Globe',
          position: { x: 700, y: 240 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'State In' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'HTML Data' }],
          config: {
            method: 'GET',
            url: '={{ $json.url }}',
            timeoutMs: 12000
          }
        },
        {
          id: 'node_extract_hl',
          type: 'core_code',
          name: 'Extract Headlines',
          category: 'Data',
          icon: 'FileCode',
          position: { x: 1020, y: 240 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'HTML In' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Headlines' }],
          config: {
            jsCode: "const MAX_PER_STATE = 5;\nconst stateItems = $('State Pages List').all();\nconst out = [];\n$input.all().forEach((item, i) => {\n  const state = stateItems[i] ? stateItems[i].json.state : 'राज्य';\n  const html = String(item.json.data || '');\n  const re = /<script type=\"application\\/ld\\+json\">([\\s\\S]*?)<\\/script>/g;\n  let m;\n  while ((m = re.exec(html)) !== null) {\n    if (m[1].indexOf('\"ItemList\"') === -1) continue;\n    try {\n      const data = JSON.parse(m[1]);\n      const list = (data.itemListElement || []).slice(0, MAX_PER_STATE);\n      for (const el of list) {\n        if (el && el.url && el.name) out.push({ json: { state, title: el.name, link: el.url } });\n      }\n    } catch (e) {}\n    break;\n  }\n});\nreturn out;"
          }
        },
        {
          id: 'node_dedupe_hl',
          type: 'eie-nodes-base.removeDuplicates',
          name: 'Only New Headlines',
          category: 'Flow',
          icon: 'Filter',
          position: { x: 1340, y: 240 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Raw News' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Unique' }],
          config: {
            dedupeValue: '={{ $json.link }}'
          }
        },
        {
          id: 'node_build_msgs',
          type: 'core_code',
          name: 'Build State Messages',
          category: 'Data',
          icon: 'MessageSquare',
          position: { x: 1660, y: 240 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Unique News' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Bulletins' }],
          config: {
            jsCode: "const dec = (s) => String(s).replace(/&#0?39;/g, \"'\").replace(/&quot;/g, '\"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();\nconst esc = (s) => dec(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');\nconst byState = {};\nconst order = [];\nfor (const it of $input.all()) {\n  const s = it.json.state;\n  if (!byState[s]) { byState[s] = []; order.push(s); }\n  byState[s].push(it.json);\n}\nreturn order.map((s) => {\n  const lines = byState[s].map((n, idx) => (idx + 1) + '. <a href=\"' + n.link + '\">' + esc(n.title) + '</a>');\n  return { json: { state: s, text: '<b>' + esc(s) + ' की ताज़ा खबरें</b>\\n\\n' + lines.join('\\n\\n') } };\n});"
          }
        },
        {
          id: 'node_tg_dispatch',
          type: 'app_telegram',
          name: 'Send to Telegram',
          category: 'Communication',
          icon: 'Send',
          credentialId: 'cred_telegram_bot',
          position: { x: 1980, y: 240 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Bulletins' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Dispatched' }],
          config: {
            botToken: '',
            chatId: '5102553052',
            chat_id: '5102553052',
            parseMode: 'HTML',
            text: '{{$json.text || $json.message}}'
          }
        }
      ],
      connections: [
        { id: 'conn_sched_to_list', fromNodeId: 'node_tg_sched', fromPortId: 'out_main', toNodeId: 'node_state_list', toPortId: 'in_main' },
        { id: 'conn_list_to_fetch', fromNodeId: 'node_state_list', fromPortId: 'out_main', toNodeId: 'node_fetch_states', toPortId: 'in_main' },
        { id: 'conn_fetch_to_extract', fromNodeId: 'node_fetch_states', fromPortId: 'out_main', toNodeId: 'node_extract_hl', toPortId: 'in_main' },
        { id: 'conn_extract_to_dedupe', fromNodeId: 'node_extract_hl', fromPortId: 'out_main', toNodeId: 'node_dedupe_hl', toPortId: 'in_main' },
        { id: 'conn_dedupe_to_build', fromNodeId: 'node_dedupe_hl', fromPortId: 'out_main', toNodeId: 'node_build_msgs', toPortId: 'in_main' },
        { id: 'conn_build_to_tg', fromNodeId: 'node_build_msgs', fromPortId: 'out_main', toNodeId: 'node_tg_dispatch', toPortId: 'in_main' }
      ]
    }
  },
  {
    id: 'tpl_eie_ai_agent',
    name: 'Autonomous AI Agent (Tools, Memory & LLM Model)',
    description: 'Autonomous LangChain AI Agent connected with Google Gemini Model, Window Buffer Memory, Calculator Tool, and Web Search Tool to solve complex multi-step automations.',
    category: 'AI & Ingestion',
    tags: ['AI Agent', 'Gemini', 'Memory', 'Tools', 'Autonomous'],
    workflow: {
      name: 'Autonomous AI Agent (Tools, Memory & LLM Model)',
      description: 'Autonomous LangChain AI Agent connected with Google Gemini Model, Window Buffer Memory, Calculator Tool, and Web Search Tool.',
      active: true,
      viewport: { x: 40, y: 80, zoom: 0.85 },
      nodes: [
        {
          id: 'agent_wh',
          type: 'trigger_webhook',
          name: 'Chat Inbound Trigger',
          category: 'Triggers',
          icon: 'Webhook',
          position: { x: 80, y: 240 },
          inputs: [],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Message' }],
          config: { webhookPath: 'chat_agent', method: 'POST' }
        },
        {
          id: 'agent_core',
          type: 'ai_agent',
          name: 'Autonomous AI Agent',
          category: 'AI',
          icon: 'Bot',
          position: { x: 440, y: 220 },
          inputs: [
            { id: 'in_main', name: 'main', type: 'main', label: 'Chat Input' },
            { id: 'in_model', name: 'model', type: 'model', label: 'Chat Model' },
            { id: 'in_memory', name: 'memory', type: 'memory', label: 'Memory' },
            { id: 'in_tools', name: 'tool', type: 'tool', label: 'Tools' },
          ],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Agent Response' }],
          config: {
            agentType: 'tools_agent',
            systemPrompt: 'You are an autonomous AI Agent that solves problems by invoking Calculator, Web Search, and HTTP tools.',
            temperature: 0.2
          }
        },
        {
          id: 'agent_model',
          type: 'ai_model_gemini',
          name: 'Google Gemini 2.5 Flash',
          category: 'AI',
          icon: 'Sparkles',
          position: { x: 120, y: 60 },
          inputs: [],
          outputs: [{ id: 'out_model', name: 'model', type: 'model', label: 'Model' }],
          config: { model: 'gemini-2.5-flash' }
        },
        {
          id: 'agent_mem',
          type: 'ai_memory_window',
          name: 'Window Buffer Memory',
          category: 'AI',
          icon: 'History',
          position: { x: 120, y: 380 },
          inputs: [],
          outputs: [{ id: 'out_memory', name: 'memory', type: 'memory', label: 'Memory' }],
          config: { contextWindowLength: 10 }
        },
        {
          id: 'agent_calc',
          type: 'ai_tool_calculator',
          name: 'Calculator Tool',
          category: 'AI Tools',
          icon: 'Activity',
          position: { x: 120, y: 520 },
          inputs: [],
          outputs: [{ id: 'out_tool', name: 'tool', type: 'tool', label: 'Tool' }],
          config: { toolName: 'calculator' }
        },
        {
          id: 'agent_search',
          type: 'ai_tool_search',
          name: 'Web Search Tool',
          category: 'AI Tools',
          icon: 'Globe',
          position: { x: 120, y: 660 },
          inputs: [],
          outputs: [{ id: 'out_tool', name: 'tool', type: 'tool', label: 'Tool' }],
          config: { toolName: 'web_search' }
        },
        {
          id: 'agent_slack',
          type: 'app_slack',
          name: 'Slack Notification',
          category: 'All Applications',
          icon: 'MessageSquare',
          position: { x: 820, y: 240 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Payload' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Result' }],
          config: { channel: '#ai-agent-outputs', text: '🤖 Agent Completed: {{$json.text}}' }
        }
      ],
      connections: [
        { id: 'conn_wh', fromNodeId: 'agent_wh', fromPortId: 'out_main', toNodeId: 'agent_core', toPortId: 'in_main' },
        { id: 'conn_model', fromNodeId: 'agent_model', fromPortId: 'out_model', toNodeId: 'agent_core', toPortId: 'in_model' },
        { id: 'conn_mem', fromNodeId: 'agent_mem', fromPortId: 'out_memory', toNodeId: 'agent_core', toPortId: 'in_memory' },
        { id: 'conn_calc', fromNodeId: 'agent_calc', fromPortId: 'out_tool', toNodeId: 'agent_core', toPortId: 'in_tools' },
        { id: 'conn_search', fromNodeId: 'agent_search', fromPortId: 'out_tool', toNodeId: 'agent_core', toPortId: 'in_tools' },
        { id: 'conn_slack', fromNodeId: 'agent_core', fromPortId: 'out_main', toNodeId: 'agent_slack', toPortId: 'in_main' }
      ]
    }
  },
  {
    id: 'tpl_webhook_ai_email',
    name: 'Webhook → AI Agent → Smart Email Alert',
    description: 'Intercepts incoming webhook payloads, executes Gemini AI analysis with structured entity extraction, and dispatches dynamic email notifications.',
    category: 'AI & Ingestion',
    tags: ['Webhook', 'Gemini AI', 'Email', 'Trending'],
    workflow: {
      name: 'Webhook → AI Agent → Smart Email Alert',
      description: 'Intercepts incoming webhook payloads, executes Gemini AI analysis with structured entity extraction, and dispatches dynamic email notifications.',
      active: true,
      viewport: { x: 80, y: 150, zoom: 0.95 },
      nodes: [
        {
          id: 'n_wh',
          type: 'trigger_webhook',
          name: 'Customer Inbound Webhook',
          category: 'Triggers',
          icon: 'Webhook',
          position: { x: 80, y: 220 },
          inputs: [],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Payload' }],
          config: {
            webhookPath: 'inbound_lead',
            method: 'POST',
            samplePayload: '{\n  "leadName": "Elena Vance",\n  "company": "Quantum Innovations",\n  "requirement": "Enterprise security with SOC2 compliance and 100k API triggers per hour.",\n  "budget": "$15,000/mo"\n}'
          }
        },
        {
          id: 'n_ai',
          type: 'ai_agent',
          name: 'Gemini AI Lead Scorer',
          category: 'AI',
          icon: 'Sparkles',
          position: { x: 440, y: 180 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Analysis' }],
          config: {
            model: 'gemini-2.5-flash',
            systemPrompt: 'You are an enterprise sales qualification AI. Return JSON with leadScore (1-100), urgencyLevel (Critical, High, Medium, Low), and executiveSummary.',
            userPromptTemplate: 'Analyze enterprise lead:\nName: {{$json.leadName}}\nCompany: {{$json.company}}\nRequirement: {{$json.requirement}}\nBudget: {{$json.budget}}',
            temperature: 0.1,
            responseFormat: 'json'
          }
        },
        {
          id: 'n_if',
          type: 'logic_if',
          name: 'High Value Threshold',
          category: 'Logic',
          icon: 'GitBranch',
          position: { x: 800, y: 220 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
          outputs: [
            { id: 'out_true', name: 'true', type: 'true', label: 'Score >= 80' },
            { id: 'out_false', name: 'false', type: 'false', label: 'Standard' }
          ],
          config: {
            fieldPath: 'leadScore',
            operator: '>=',
            value: '80'
          }
        },
        {
          id: 'n_email',
          type: 'comm_email',
          name: 'VIP Sales Executive Alert',
          category: 'Communication',
          icon: 'Mail',
          position: { x: 1140, y: 140 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Sent' }],
          config: {
            to: 'enterprise-sales@eie-workflow.internal',
            subject: '🌟 HIGH VALUE LEAD: {{$node["Customer Inbound Webhook"].json.company}} (Score: {{$json.leadScore}})',
            bodyHtml: '<h3>High Priority Enterprise Inbound</h3><p><strong>Executive Summary:</strong> {{$node["Gemini AI Lead Scorer"].json.executiveSummary}}</p><p><strong>Urgency:</strong> {{$node["Gemini AI Lead Scorer"].json.urgencyLevel}}</p>'
          }
        },
        {
          id: 'n_slack',
          type: 'comm_slack',
          name: 'Standard Lead Channel',
          category: 'Communication',
          icon: 'MessageSquare',
          position: { x: 1140, y: 340 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Posted' }],
          config: {
            channel: '#standard-inbound',
            messageText: 'Standard lead queued: {{$node["Customer Inbound Webhook"].json.company}} - {{$node["Gemini AI Lead Scorer"].json.executiveSummary}}'
          }
        }
      ],
      connections: [
        { id: 'c1', fromNodeId: 'n_wh', fromPortId: 'out_main', toNodeId: 'n_ai', toPortId: 'in_main' },
        { id: 'c2', fromNodeId: 'n_ai', fromPortId: 'out_main', toNodeId: 'n_if', toPortId: 'in_main' },
        { id: 'c3', fromNodeId: 'n_if', fromPortId: 'out_true', toNodeId: 'n_email', toPortId: 'in_main' },
        { id: 'c4', fromNodeId: 'n_if', fromPortId: 'out_false', toNodeId: 'n_slack', toPortId: 'in_main' }
      ]
    }
  },
  {
    id: 'tpl_api_monitor',
    name: 'Scheduled API Health Monitor → Telegram Alert',
    description: 'Polls mission-critical HTTP microservices on a scheduled cadence and pings DevOps via Telegram Bot if uptime checks fail.',
    category: 'DevOps & Reliability',
    tags: ['Schedule', 'HTTP Request', 'IF', 'Telegram'],
    workflow: {
      name: 'Scheduled API Health Monitor → Telegram Alert',
      description: 'Polls mission-critical HTTP microservices on a scheduled cadence and alerts on latency or failure.',
      active: true,
      viewport: { x: 80, y: 150, zoom: 1 },
      nodes: [
        {
          id: 'm_sched',
          type: 'trigger_schedule',
          name: 'Every 5 Minutes',
          category: 'Triggers',
          icon: 'Clock',
          position: { x: 100, y: 200 },
          inputs: [],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Tick' }],
          config: { interval: 'every_5_minutes' }
        },
        {
          id: 'm_http',
          type: 'http_request',
          name: 'Probe API Health',
          category: 'HTTP',
          icon: 'Globe',
          position: { x: 420, y: 200 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Run' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Response' }],
          config: {
            method: 'GET',
            url: 'https://httpbin.org/status/200',
            timeoutMs: 5000
          }
        },
        {
          id: 'm_if',
          type: 'logic_if',
          name: 'Check Status Code',
          category: 'Logic',
          icon: 'GitBranch',
          position: { x: 760, y: 200 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
          outputs: [
            { id: 'out_true', name: 'true', type: 'true', label: 'Healthy (200)' },
            { id: 'out_false', name: 'false', type: 'false', label: 'Outage (!=200)' }
          ],
          config: {
            fieldPath: 'statusCode',
            operator: '==',
            value: '200'
          }
        },
        {
          id: 'm_tg',
          type: 'comm_telegram',
          name: 'Telegram Emergency Alert',
          category: 'Communication',
          icon: 'Send',
          position: { x: 1080, y: 300 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Alert' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Sent' }],
          config: {
            chatId: '@infra_oncall',
            message: '🚨 CRITICAL API OUTAGE: Microservice probe returned status {{$json.statusCode}}! Immediate intervention required.'
          }
        }
      ],
      connections: [
        { id: 'mc1', fromNodeId: 'm_sched', fromPortId: 'out_main', toNodeId: 'm_http', toPortId: 'in_main' },
        { id: 'mc2', fromNodeId: 'm_http', fromPortId: 'out_main', toNodeId: 'm_if', toPortId: 'in_main' },
        { id: 'mc3', fromNodeId: 'm_if', fromPortId: 'out_false', toNodeId: 'm_tg', toPortId: 'in_main' }
      ]
    }
  },
  {
    id: 'tpl_csv_etl',
    name: 'Data Transformation & PostgreSQL Ingestion',
    description: 'Accepts raw tabular data, cleans and normalizes fields via JavaScript sandbox, and commits structured records to PostgreSQL.',
    category: 'Data & ETL',
    tags: ['Data', 'Code (JS)', 'PostgreSQL', 'ETL'],
    workflow: {
      name: 'Data Transformation & PostgreSQL Ingestion',
      description: 'Cleans, normalizes, and enriches data via JavaScript sandbox and commits to database.',
      active: false,
      viewport: { x: 80, y: 150, zoom: 1 },
      nodes: [
        {
          id: 'e_manual',
          type: 'trigger_manual',
          name: 'Manual Ingest Trigger',
          category: 'Triggers',
          icon: 'PlayCircle',
          position: { x: 100, y: 200 },
          inputs: [],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Records' }],
          config: {
            samplePayload: '{\n  "batchId": "b_9918",\n  "rawEmail": "  SARAH.CONNOR@SKYNET.COM  ",\n  "totalSpend": "1420.50"\n}'
          }
        },
        {
          id: 'e_code',
          type: 'data_code',
          name: 'Cleanse & Sanitize',
          category: 'Data',
          icon: 'Code2',
          position: { x: 440, y: 200 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Clean Data' }],
          config: {
            code: 'return {\n  batchId: $json.batchId,\n  normalizedEmail: ($json.rawEmail || "").trim().toLowerCase(),\n  numericSpend: parseFloat($json.totalSpend || 0),\n  isVip: parseFloat($json.totalSpend || 0) > 1000,\n  processedAt: new Date().toISOString()\n};'
          }
        },
        {
          id: 'e_pg',
          type: 'db_postgres',
          name: 'Upsert into PostgreSQL',
          category: 'Database',
          icon: 'Database',
          position: { x: 800, y: 200 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'DB Result' }],
          config: {
            operation: 'INSERT',
            table: 'customer_profiles',
            query: 'INSERT INTO customer_profiles (email, spend, is_vip, ingested_at) VALUES (\'{{$json.normalizedEmail}}\', {{$json.numericSpend}}, {{$json.isVip}}, \'{{$json.processedAt}}\') ON CONFLICT (email) DO UPDATE SET spend = EXCLUDED.spend;'
          }
        }
      ],
      connections: [
        { id: 'ec1', fromNodeId: 'e_manual', fromPortId: 'out_main', toNodeId: 'e_code', toPortId: 'in_main' },
        { id: 'ec2', fromNodeId: 'e_code', fromPortId: 'out_main', toNodeId: 'e_pg', toPortId: 'in_main' }
      ]
    }
  }
];
