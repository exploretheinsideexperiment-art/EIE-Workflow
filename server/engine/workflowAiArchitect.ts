import { GoogleGenAI } from '@google/genai';
import { Workflow, WorkflowNodeData, WorkflowConnection } from '../db';

export interface WorkflowAiResponse {
  action: 'chat' | 'build_workflow' | 'auto_repair';
  reply: string;
  source: 'gemini' | 'local_architect';
  language: 'en' | 'hi';
  builtWorkflow?: {
    name: string;
    description: string;
    nodes: WorkflowNodeData[];
    connections: WorkflowConnection[];
  };
}

/**
 * Detect language: English vs Hindi/Hinglish
 */
export function detectUserLanguage(text: string): 'hi' | 'en' {
  if (!text) return 'en';
  // 1. Devanagari script presence
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hi';
  }

  // 2. Common Hindi / Hinglish tokens
  const hindiHinglishKeywords = new Set([
    'kewal', 'karo', 'karein', 'karke', 'karna', 'nahi', 'nahin', 'hai', 'hain',
    'kaise', 'kya', 'banao', 'bana', 'banado', 'thik', 'theek', 'sahi', 'galti',
    'sudharo', 'chalao', 'poocho', 'puchho', 'puchhe', 'puchha', 'pucho', 'mujhe',
    'aap', 'aapka', 'aur', 'bhi', 'ye', 'yeh', 'vo', 'voh', 'isme', 'usme', 'ho',
    'raha', 'rahi', 'rahe', 'chahiye', 'pehle', 'baad', 'badh', 'dikkat', 'madad',
    'bataye', 'batao', 'matlab', 'kaam', 'karte', 'kyu', 'kyun', 'karna'
  ]);

  const words = text.toLowerCase().split(/[^a-zA-Z0-9_]+/);
  let hindiTokens = 0;
  for (const w of words) {
    if (hindiHinglishKeywords.has(w)) {
      hindiTokens++;
    }
  }

  return hindiTokens >= 1 ? 'hi' : 'en';
}

/**
 * Detect if user prompt requests creating or building a new workflow
 */
export function isWorkflowGenerationPrompt(text: string): boolean {
  const lower = text.toLowerCase();
  const buildKeywords = [
    'build', 'create', 'generate', 'make a workflow', 'new workflow',
    'banao', 'bana do', 'naya workflow', 'create workflow', 'build workflow',
    'setup workflow', 'automate', 'workflow banado', 'workflow banao',
    'design workflow', 'flow banao', 'flow create', 'make workflow',
    'workflow create karo', 'workflow banao', 'ek workflow'
  ];
  return buildKeywords.some((kw) => lower.includes(kw));
}

/**
 * Fallback Intelligent Synthesizer: builds structured workflow from natural language
 */
export function synthesizeWorkflowFromPrompt(
  prompt: string,
  lang: 'en' | 'hi'
): { name: string; description: string; nodes: WorkflowNodeData[]; connections: WorkflowConnection[]; explanation: string } {
  const lower = prompt.toLowerCase();

  let name = 'Automated Workflow';
  let description = 'Created automatically by Ei-Doctor';
  let nodes: WorkflowNodeData[] = [];
  let connections: WorkflowConnection[] = [];
  let explanation = '';

  const timestamp = Date.now();

  // 1. Google Sheets -> Gmail / Email
  if ((lower.includes('sheet') || lower.includes('excel')) && (lower.includes('gmail') || lower.includes('email') || lower.includes('mail'))) {
    name = lang === 'en' ? 'Google Sheets Lead Dispatcher' : 'Google Sheets Lead Email Automator';
    description = lang === 'en'
      ? 'Scheduled trigger reads rows from Google Sheets, generates personalized emails, and dispatches via Gmail.'
      : 'Har roz Google Sheets se records padhta hai aur Gmail ke jariye automatic emails bhejta hai.';

    nodes = [
      {
        id: `node_sched_${timestamp}`,
        name: 'Schedule Trigger (09:00 AM)',
        type: 'trigger_schedule',
        category: 'Triggers',
        icon: 'Clock',
        position: { x: 100, y: 220 },
        inputs: [],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { cron: '0 9 * * 1-5', interval: 'Every weekday morning' },
      },
      {
        id: `node_sheets_${timestamp}`,
        name: 'Read Google Sheets Rows',
        type: 'app_google_sheets',
        category: 'Applications',
        icon: 'FileSpreadsheet',
        position: { x: 380, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { operation: 'readRows', sheetName: 'Leads', range: 'A:E' },
      },
      {
        id: `node_ai_${timestamp}`,
        name: 'Gemini Message Personalizer',
        type: 'ai_llm',
        category: 'AI',
        icon: 'Sparkles',
        position: { x: 660, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { userPromptTemplate: 'Write a warm personalized outreach email for customer: {{$json.customer || $json.name}}' },
      },
      {
        id: `node_gmail_${timestamp}`,
        name: 'Send Gmail Notification',
        type: 'app_gmail',
        category: 'Applications',
        icon: 'Mail',
        position: { x: 940, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { operation: 'send', to: 'client@company.com', subject: 'Automated Update: {{$json.customer || "New Lead"}}' },
      },
    ];

    connections = [
      { id: `c_1_${timestamp}`, fromNodeId: nodes[0].id, fromPortId: 'out_main', toNodeId: nodes[1].id, toPortId: 'in_main' },
      { id: `c_2_${timestamp}`, fromNodeId: nodes[1].id, fromPortId: 'out_main', toNodeId: nodes[2].id, toPortId: 'in_main' },
      { id: `c_3_${timestamp}`, fromNodeId: nodes[2].id, fromPortId: 'out_main', toNodeId: nodes[3].id, toPortId: 'in_main' },
    ];

    explanation = lang === 'en'
      ? `I've architected a 4-step automation for your request:\n1. **Schedule Trigger**: Fires automatically on weekdays.\n2. **Google Sheets**: Reads new rows from your spreadsheet.\n3. **Gemini AI**: Generates personalized copy dynamically.\n4. **Gmail**: Dispatches the email to your recipient.\n\nClick **"Load onto Canvas"** to start working with it right away!`
      : `Maine aapke kehne par 4 steps ka behtareen workflow taiyar kar diya hai:\n1. **Schedule Trigger**: Har roz subah automatic run karega.\n2. **Google Sheets**: Naye records aur leads ko padhega.\n3. **Gemini AI**: Har customer ke liye custom message draft karega.\n4. **Gmail**: Turant email dispatch karega.\n\nNiche **"Load onto Canvas"** par click karein aur ise turant canvas par chalayein!`;

  // 2. Webhook -> AI Agent -> Slack
  } else if (lower.includes('agent') || lower.includes('slack') || lower.includes('support') || lower.includes('triage')) {
    name = lang === 'en' ? 'Autonomous AI Support Agent & Slack Alert' : 'Autonomous AI Support Triage Workflow';
    description = lang === 'en'
      ? 'Listens to inbound webhooks, processes customer inquiries with an autonomous Gemini agent with memory and tools, and posts alerts to Slack.'
      : 'Inbound webhooks ko listen karta hai, Gemini AI Agent se intelligent solution nikalta hai aur Slack par post karta hai.';

    nodes = [
      {
        id: `node_wh_${timestamp}`,
        name: 'Inbound Customer Webhook',
        type: 'trigger_webhook',
        category: 'Triggers',
        icon: 'Webhook',
        position: { x: 80, y: 220 },
        inputs: [],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { httpMethod: 'POST', path: 'customer-inquiry' },
      },
      {
        id: `node_agent_${timestamp}`,
        name: 'Customer Support AI Agent',
        type: 'ai_agent',
        category: 'AI',
        icon: 'Bot',
        position: { x: 380, y: 180 },
        inputs: [
          { id: 'in_main', name: 'main', type: 'main' },
          { id: 'in_model', name: 'model', type: 'model' },
          { id: 'in_memory', name: 'memory', type: 'memory' },
          { id: 'in_tools', name: 'tools', type: 'tool' },
        ],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { systemPrompt: 'You are an autonomous customer support specialist. Analyze customer issues and provide clear resolutions.' },
      },
      {
        id: `node_model_${timestamp}`,
        name: 'Google Gemini 2.5 Flash',
        type: 'ai_model_gemini',
        category: 'AI Tools',
        icon: 'Sparkles',
        position: { x: 380, y: 380 },
        inputs: [],
        outputs: [{ id: 'out_model', name: 'model', type: 'model' }],
        config: { model: 'gemini-2.5-flash', temperature: 0.2 },
      },
      {
        id: `node_mem_${timestamp}`,
        name: 'Window Buffer Memory',
        type: 'ai_memory_window',
        category: 'AI Tools',
        icon: 'History',
        position: { x: 120, y: 380 },
        inputs: [],
        outputs: [{ id: 'out_memory', name: 'memory', type: 'memory' }],
        config: { contextWindow: 10 },
      },
      {
        id: `node_slack_${timestamp}`,
        name: 'Post Resolution to Slack',
        type: 'app_slack',
        category: 'Applications',
        icon: 'MessageSquare',
        position: { x: 820, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { channel: '#customer-support', text: 'New resolved ticket: {{$json.text || $json.output}}' },
      },
    ];

    connections = [
      { id: `c_1_${timestamp}`, fromNodeId: nodes[0].id, fromPortId: 'out_main', toNodeId: nodes[1].id, toPortId: 'in_main' },
      { id: `c_m_${timestamp}`, fromNodeId: nodes[2].id, fromPortId: 'out_model', toNodeId: nodes[1].id, toPortId: 'in_model' },
      { id: `c_mem_${timestamp}`, fromNodeId: nodes[3].id, fromPortId: 'out_memory', toNodeId: nodes[1].id, toPortId: 'in_memory' },
      { id: `c_s_${timestamp}`, fromNodeId: nodes[1].id, fromPortId: 'out_main', toNodeId: nodes[4].id, toPortId: 'in_main' },
    ];

    explanation = lang === 'en'
      ? `I've constructed an Autonomous AI Agent workflow:\n1. **Webhook Trigger**: Receives live payload.\n2. **AI Agent**: Empowered with Gemini Flash & Window Memory.\n3. **Slack Dispatch**: Alerts your support channel with the answer.\n\nClick **"Load onto Canvas"** to view and test it immediately!`
      : `Maine aapke liye Autonomous AI Agent workflow taiyar kiya hai:\n1. **Webhook Trigger**: Live customer inquiries receive karega.\n2. **AI Agent**: Gemini model aur memory ke sath query solve karega.\n3. **Slack Alert**: Solution ko aapke Slack channel par bheje ga.\n\nNiche **"Load onto Canvas"** dabayein aur turant use karein!`;

  // 3. Default: Webhook -> Gemini AI -> Webhook Response
  } else {
    name = lang === 'en' ? 'Smart Webhook & AI Processor' : 'Smart Webhook & AI Automation';
    description = lang === 'en'
      ? 'Listens for HTTP webhook calls, runs Gemini AI classification & logic routing, and returns instant results.'
      : 'Inbound webhooks ko receive karta hai, Gemini AI se process karke turant response deta hai.';

    nodes = [
      {
        id: `node_wh_${timestamp}`,
        name: 'Inbound Webhook API',
        type: 'trigger_webhook',
        category: 'Triggers',
        icon: 'Webhook',
        position: { x: 100, y: 220 },
        inputs: [],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { httpMethod: 'POST', path: 'api/process' },
      },
      {
        id: `node_ai_${timestamp}`,
        name: 'Gemini AI Processor',
        type: 'ai_llm',
        category: 'AI',
        icon: 'Sparkles',
        position: { x: 380, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { userPromptTemplate: 'Analyze and extract key attributes from this payload: {{$json}}' },
      },
      {
        id: `node_if_${timestamp}`,
        name: 'Check If High Priority',
        type: 'logic_if',
        category: 'Logic',
        icon: 'GitBranch',
        position: { x: 660, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [
          { id: 'out_true', name: 'true', type: 'true', label: 'True' },
          { id: 'out_false', name: 'false', type: 'false', label: 'False' },
        ],
        config: { fieldPath: 'isTrue', operator: '==', value: 'true' },
      },
      {
        id: `node_resp_${timestamp}`,
        name: 'Respond to Webhook',
        type: 'respond_to_webhook',
        category: 'HTTP',
        icon: 'Globe',
        position: { x: 960, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { responseCode: 200, responseBody: '{"success": true, "processed": true}' },
      },
    ];

    connections = [
      { id: `c_1_${timestamp}`, fromNodeId: nodes[0].id, fromPortId: 'out_main', toNodeId: nodes[1].id, toPortId: 'in_main' },
      { id: `c_2_${timestamp}`, fromNodeId: nodes[1].id, fromPortId: 'out_main', toNodeId: nodes[2].id, toPortId: 'in_main' },
      { id: `c_3_${timestamp}`, fromNodeId: nodes[2].id, fromPortId: 'out_true', toNodeId: nodes[3].id, toPortId: 'in_main' },
    ];

    explanation = lang === 'en'
      ? `I've created a complete automated pipeline for you:\n1. **Webhook Trigger**: Receives inbound requests.\n2. **Gemini AI**: Extracts details and computes smart answers.\n3. **Logic IF**: Routes high-priority events.\n4. **HTTP Response**: Returns instantaneous JSON response to caller.\n\nClick **"Load onto Canvas"** to apply this workflow directly!`
      : `Maine aapke liye complete workflow build kar diya hai:\n1. **Webhook Trigger**: Incoming API data ko receive karega.\n2. **Gemini AI**: Intelligent processing aur extraction karega.\n3. **Logic IF**: Condition ke anusar branch karega.\n4. **Respond to Webhook**: Caller ko turant response dega.\n\nNiche **"Load onto Canvas"** par click karein aur ise canvas par dekhein!`;
  }

  return { name, description, nodes, connections, explanation };
}

/**
 * Main AI Architect Handler
 */
export async function handleEiDoctorChat(
  message: string,
  workflow: Workflow,
  latestExecution: any
): Promise<WorkflowAiResponse> {
  const lang = detectUserLanguage(message);
  const wantsWorkflowBuild = isWorkflowGenerationPrompt(message);
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const nodes = workflow?.nodes || [];
      const connections = workflow?.connections || [];
      const nodeCount = nodes.length;

      const systemInstruction = `You are "Ei-Doctor", the expert AI Workflow Architect and Troubleshooter inside EIE-Workflow (an n8n-style automation platform).

STRICT LANGUAGE RULE:
- Detect the user's language in the prompt.
- If the user wrote in English, your "reply" MUST BE 100% IN NATURAL, POLITE, PROFESSIONAL ENGLISH. Do NOT speak in Hindi.
- If the user wrote in Hindi or Hinglish, your "reply" MUST BE IN NATURAL, FRIENDLY HINDI/HINGLISH.
- Always mirror the language used by the user.

TASK MODES:
1. WORKFLOW GENERATION:
If the user is asking to create, build, or automate a workflow (e.g. "build a workflow for...", "create workflow to...", "ek workflow banao jo..."):
You MUST return a JSON object with this EXACT structure:
{
  "action": "build_workflow",
  "reply": "Friendly explanation of the workflow you built and why in the user's language",
  "workflow": {
    "name": "Meaningful Workflow Name",
    "description": "Clear workflow description",
    "nodes": [
      {
        "id": "node_1",
        "name": "Step Name",
        "type": "trigger_webhook | trigger_schedule | trigger_manual | app_google_sheets | app_gmail | app_slack | ai_agent | ai_llm | logic_if | logic_switch | data_loop | data_merge | http_request | code_javascript",
        "category": "Triggers | Applications | AI | AI Tools | Logic | Data | HTTP",
        "icon": "Webhook | Clock | Mail | MessageSquare | FileSpreadsheet | Sparkles | Bot | GitBranch",
        "position": { "x": 100, "y": 220 },
        "inputs": [{ "id": "in_main", "name": "main", "type": "main" }],
        "outputs": [{ "id": "out_main", "name": "main", "type": "main" }],
        "config": {}
      }
    ],
    "connections": [
      { "id": "c1", "fromNodeId": "node_1", "fromPortId": "out_main", "toNodeId": "node_2", "toPortId": "in_main" }
    ]
  }
}
Note: For triggers, inputs should be empty []. Position nodes horizontally starting around x: 100, y: 220, spaced by 280px.

2. TROUBLESHOOTING & GENERAL HELP:
If the user asks a question about fixing an error, why something failed, or how nodes work:
Return JSON:
{
  "action": "chat",
  "reply": "Clear, concise diagnostic advice in the user's language"
}

Current Workflow Canvas State:
- Workflow Name: "${workflow?.name || 'Untitled'}"
- Total Nodes: ${nodeCount}
- Nodes: ${nodes.map((n: any) => `${n.name} (${n.type})`).join(', ')}
- Latest Status: ${latestExecution?.status || 'none'}
${latestExecution?.error ? `- Error: ${latestExecution.error}` : ''}

Respond ONLY with valid JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: message }] }],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text?.trim() || '';
      try {
        const parsed = JSON.parse(responseText);
        if (parsed.action === 'build_workflow' && parsed.workflow?.nodes?.length) {
          return {
            action: 'build_workflow',
            reply: parsed.reply || (lang === 'en' ? 'Here is the workflow I created for you.' : 'Yeh raha aapka taiyar workflow.'),
            source: 'gemini',
            language: lang,
            builtWorkflow: {
              name: parsed.workflow.name || 'AI Generated Workflow',
              description: parsed.workflow.description || 'Automated by Ei-Doctor',
              nodes: parsed.workflow.nodes,
              connections: parsed.workflow.connections || [],
            },
          };
        }

        return {
          action: 'chat',
          reply: parsed.reply || responseText,
          source: 'gemini',
          language: lang,
        };
      } catch {
        // If not JSON, return responseText as chat
        return {
          action: 'chat',
          reply: responseText,
          source: 'gemini',
          language: lang,
        };
      }
    } catch (err: any) {
      console.warn('[Ei-Doctor] Gemini call failed, using local architect engine:', err?.message || err);
    }
  }

  // --- LOCAL ARCHITECT FALLBACK ---
  if (wantsWorkflowBuild) {
    const synth = synthesizeWorkflowFromPrompt(message, lang);
    return {
      action: 'build_workflow',
      reply: synth.explanation,
      source: 'local_architect',
      language: lang,
      builtWorkflow: {
        name: synth.name,
        description: synth.description,
        nodes: synth.nodes,
        connections: synth.connections,
      },
    };
  }

  // Contextual Chat Fallback
  const lowerMsg = message.toLowerCase();
  let reply = '';
  const nodeCount = workflow?.nodes?.length || 0;
  const connectionCount = workflow?.connections?.length || 0;

  if (lang === 'en') {
    if (lowerMsg.includes('fix') || lowerMsg.includes('repair') || lowerMsg.includes('solve') || lowerMsg.includes('issue') || lowerMsg.includes('error')) {
      reply = `I have inspected your workflow **"${workflow?.name || 'Workflow'}"**. 
It currently contains ${nodeCount} node(s) and ${connectionCount} connection(s).

You can click the **"⚡ Auto-Fix All Problems"** button below to immediately repair disconnected ports, missing triggers, or incomplete node parameters!`;
    } else if (lowerMsg.includes('model') || lowerMsg.includes('gemini') || lowerMsg.includes('ai agent')) {
      reply = `Autonomous AI Agents require an attached **Chat Model (Purple port)** to function. 
Connect a **Google Gemini 2.5 Flash** model so the agent can reason and formulate answers. Would you like me to auto-connect it for you?`;
    } else if (lowerMsg.includes('test') || lowerMsg.includes('run')) {
      reply = `To test your workflow, click the **"Test Run"** button in the canvas header bar, or test any single node via its hover play icon.`;
    } else {
      reply = `Hello! I am **Ei-Doctor** 🩺, your AI Workflow Doctor and Architect. 
I can diagnose workflow errors, fix broken connections, and automatically build complete workflows from your prompts. 

Try asking: *"Build a workflow for customer support with Webhook and Slack"* or click **"Auto-Fix"**!`;
    }
  } else {
    if (lowerMsg.includes('thik') || lowerMsg.includes('fix') || lowerMsg.includes('galti') || lowerMsg.includes('problem')) {
      reply = `Namaste! Maine aapke workflow **"${workflow?.name || 'Workflow'}"** ka checkup kiya hai.
Isme ${nodeCount} node(s) aur ${connectionCount} connection(s) hain.

Aap niche diye gaye **"⚡ Auto-Fix All Problems"** par click karke sabhi issues ko ek click me turant theek kar sakte hain!`;
    } else if (lowerMsg.includes('model') || lowerMsg.includes('gemini') || lowerMsg.includes('ai agent')) {
      reply = `AI Agent ko execute karne ke liye **Chat Model (Purple port)** ki zaroorat hoti hai. 
Aap **Google Gemini Chat Model** connect karein taaki agent queries samajh sake.`;
    } else {
      reply = `Namaste! Main hoon **Ei-Doctor** 🩺, aapka AI Workflow Doctor aur Architect. 
Main aapke workflow ki galtiya theek kar sakta hoon aur naye prompt se pura workflow automatically build bhi kar sakta hoon. 

Aap mujhse pooch sakte hain: *"Ek naya workflow banao jo Google Sheets se lead padhe aur Gmail bheje"* ya "Auto-Fix" dabayein!`;
    }
  }

  return {
    action: 'chat',
    reply,
    source: 'local_architect',
    language: lang,
  };
}
