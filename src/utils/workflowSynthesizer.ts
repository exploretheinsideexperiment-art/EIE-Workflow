import { WorkflowNodeData, WorkflowConnection } from '../types/workflow';

/**
 * Robust Language Detection: English vs Hindi/Hinglish
 */
export function detectUserLanguage(text: string): 'hi' | 'en' {
  if (!text) return 'en';
  const lower = text.toLowerCase();

  // 1. Explicit user language commands
  if (
    lower.includes('in english') ||
    lower.includes('speak english') ||
    lower.includes('reply in english') ||
    lower.includes('english please') ||
    lower.includes('only english')
  ) {
    return 'en';
  }
  if (
    lower.includes('in hindi') ||
    lower.includes('hindi me') ||
    lower.includes('hindi mein') ||
    lower.includes('hindi please')
  ) {
    return 'hi';
  }

  // 2. Devanagari script presence (Hindi/Sanskrit)
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hi';
  }

  // 3. Common Hindi / Hinglish tokens (only exact full words)
  const hindiKeywords = new Set([
    'kewal', 'karo', 'karein', 'karke', 'karna', 'nahi', 'nahin', 'hai', 'hain',
    'kaise', 'kya', 'banao', 'bana', 'banado', 'thik', 'theek', 'sahi', 'galti',
    'sudharo', 'chalao', 'poocho', 'puchho', 'puchhe', 'puchha', 'pucho', 'mujhe',
    'aap', 'aapka', 'aur', 'bhi', 'yeh', 'voh', 'isme', 'usme',
    'raha', 'rahi', 'rahe', 'chahiye', 'pehle', 'baad', 'badh', 'dikkat', 'madad',
    'bataye', 'batao', 'matlab', 'kaam', 'karte', 'kyu', 'kyun'
  ]);

  const words = lower.split(/[^a-zA-Z0-9_]+/);
  let hindiTokens = 0;
  for (const w of words) {
    if (hindiKeywords.has(w)) {
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
    'workflow create karo', 'ek workflow', 'auto build', 'construct workflow'
  ];
  return buildKeywords.some((kw) => lower.includes(kw));
}

/**
 * Intelligent client & server workflow synthesizer:
 * Converts natural language requests into fully functional connected node graphs.
 */
export function synthesizeWorkflowFromPrompt(
  prompt: string,
  lang: 'en' | 'hi'
): {
  name: string;
  description: string;
  nodes: WorkflowNodeData[];
  connections: WorkflowConnection[];
  explanation: string;
} {
  const lower = prompt.toLowerCase();
  const ts = Date.now();
  const isEn = lang === 'en';

  // A. CHAT AUTOMATION WORKFLOW
  if (lower.includes('chat') || lower.includes('bot') || lower.includes('conversation') || lower.includes('baatcheet')) {
    const name = isEn ? 'Autonomous AI Live Chat Assistant' : 'AI Chat Assistant Workflow';
    const description = isEn
      ? 'Live Chat Trigger captures user queries, maintains conversational memory, reasons with Interactive AI Chat, and sends formatted responses.'
      : 'Live Chat Trigger user ke message capture karta hai, memory maintain karta hai aur AI reply bhejta hai.';

    const nodes: WorkflowNodeData[] = [
      {
        id: `node_ctrig_${ts}`,
        name: isEn ? 'Chat Trigger' : 'Chat Trigger',
        type: 'chat_trigger',
        category: 'Chat',
        icon: 'MessageSquare',
        position: { x: 100, y: 220 },
        inputs: [],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { welcomeMessage: 'Hello! How can I assist you today?' },
      },
      {
        id: `node_cmem_${ts}`,
        name: isEn ? 'Chat Window Memory' : 'Chat Window Memory',
        type: 'chat_memory',
        category: 'Chat',
        icon: 'Brain',
        position: { x: 380, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { windowSize: 10, memoryKey: 'support_session' },
      },
      {
        id: `node_cai_${ts}`,
        name: isEn ? 'Interactive AI Chat' : 'Interactive AI Chat',
        type: 'chat_ai',
        category: 'Chat',
        icon: 'Bot',
        position: { x: 660, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { systemPrompt: 'You are an intelligent workflow support assistant.', temperature: 0.3 },
      },
      {
        id: `node_cmsg_${ts}`,
        name: isEn ? 'Send Chat Response' : 'Send Chat Response',
        type: 'chat_message',
        category: 'Chat',
        icon: 'Send',
        position: { x: 940, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { message: '{{$json.reply || $json.output}}', role: 'assistant' },
      },
    ];

    const connections: WorkflowConnection[] = [
      { id: `c1_${ts}`, fromNodeId: nodes[0].id, fromPortId: 'out_main', toNodeId: nodes[1].id, toPortId: 'in_main' },
      { id: `c2_${ts}`, fromNodeId: nodes[1].id, fromPortId: 'out_main', toNodeId: nodes[2].id, toPortId: 'in_main' },
      { id: `c3_${ts}`, fromNodeId: nodes[2].id, fromPortId: 'out_main', toNodeId: nodes[3].id, toPortId: 'in_main' },
    ];

    const explanation = isEn
      ? `I have architected a real 4-step Chat automation workflow:\n1. **Chat Trigger**: Receives live conversation messages.\n2. **Chat Window Memory**: Preserves context and conversation turns.\n3. **Interactive AI Chat**: Analyzes user queries with Google Gemini.\n4. **Send Chat Response**: Delivers styled Markdown response back to the user.`
      : `Maine aapke liye real 4-step Chat automation workflow canvas par load kar diya hai:\n1. **Chat Trigger**: Live user message receive karta hai.\n2. **Chat Window Memory**: Pura conversation context track rakhta hai.\n3. **Interactive AI Chat**: Gemini model se smart response banata hai.\n4. **Send Chat Response**: User ko real-time me answer send karta hai.`;

    return { name, description, nodes, connections, explanation };
  }

  // B. CONDITION & RULE ROUTING WORKFLOW
  if (lower.includes('condition') || lower.includes('shart') || lower.includes('if else') || lower.includes('switch') || lower.includes('validator')) {
    const name = isEn ? 'Multi-Condition Rule Engine' : 'Conditional Validation & Branching';
    const description = isEn
      ? 'Inbound API triggers schema validation, evaluates business conditions with IF/ELSE, and alerts on Slack.'
      : 'Inbound API data validate karta hai, condition IF evaluate karta hai aur Slack par alert bhejta hai.';

    const nodes: WorkflowNodeData[] = [
      {
        id: `node_wh_${ts}`,
        name: isEn ? 'Inbound Order Webhook' : 'Inbound Order Webhook',
        type: 'trigger_webhook',
        category: 'Triggers',
        icon: 'Webhook',
        position: { x: 100, y: 220 },
        inputs: [],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { path: 'orders/intake' },
      },
      {
        id: `node_val_${ts}`,
        name: isEn ? 'Validate Order Schema' : 'Data Schema Validator',
        type: 'condition_validator',
        category: 'Condition',
        icon: 'CheckSquare',
        position: { x: 380, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [
          { id: 'out_valid', name: 'valid', type: 'main', label: 'Valid' },
          { id: 'out_invalid', name: 'invalid', type: 'branch', label: 'Invalid' },
        ],
        config: { requiredFields: ['email', 'amount'] },
      },
      {
        id: `node_if_${ts}`,
        name: isEn ? 'High Value Check (IF)' : 'Condition (IF / ELSE)',
        type: 'condition_if',
        category: 'Condition',
        icon: 'GitBranch',
        position: { x: 660, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [
          { id: 'out_true', name: 'true', type: 'true', label: 'True Branch' },
          { id: 'out_false', name: 'false', type: 'false', label: 'False Branch' },
        ],
        config: { fieldPath: 'amount', operator: '>', value: '500' },
      },
      {
        id: `node_slack_${ts}`,
        name: isEn ? 'Alert VIP Sales Channel' : 'Slack VIP Alert',
        type: 'app_slack',
        category: 'Applications',
        icon: 'MessageSquare',
        position: { x: 940, y: 160 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { channel: '#vip-sales', text: '🚀 New High Value Order: ${{$json.amount}} from {{$json.email}}' },
      },
    ];

    const connections: WorkflowConnection[] = [
      { id: `c1_${ts}`, fromNodeId: nodes[0].id, fromPortId: 'out_main', toNodeId: nodes[1].id, toPortId: 'in_main' },
      { id: `c2_${ts}`, fromNodeId: nodes[1].id, fromPortId: 'out_valid', toNodeId: nodes[2].id, toPortId: 'in_main' },
      { id: `c3_${ts}`, fromNodeId: nodes[2].id, fromPortId: 'out_true', toNodeId: nodes[3].id, toPortId: 'in_main' },
    ];

    const explanation = isEn
      ? `I have constructed a real Condition-based branching workflow:\n1. **Webhook Trigger**: Receives raw payload.\n2. **Data Schema Validator**: Validates required attributes (branches to Valid/Invalid).\n3. **Condition (IF / ELSE)**: Evaluates high-value orders ($500+).\n4. **Slack**: Alerts your VIP channel on true condition.`
      : `Maine aapke liye Condition branching workflow taiyar kar diya hai:\n1. **Webhook Trigger**: Inbound payload intake karega.\n2. **Schema Validator**: Required fields check karega.\n3. **Condition (IF / ELSE)**: Rule test karega (amount > 500).\n4. **Slack**: True branch par VIP channel me notification bhejega.`;

    return { name, description, nodes, connections, explanation };
  }

  // C. CHAIN (LANGCHAIN / LLM PIPELINE) WORKFLOW
  if (lower.includes('chain') || lower.includes('langchain') || lower.includes('pipeline') || lower.includes('summariz')) {
    const name = isEn ? 'Sequential LLM Chain Pipeline' : 'LLM Chain Pipeline Workflow';
    const description = isEn
      ? 'Executes structured LLM chains: basic reasoning chain feeds directly into summarization chain and chat responder.'
      : 'Multi-stage LLM Chain pipeline jo content extract aur summarize karta hai.';

    const nodes: WorkflowNodeData[] = [
      {
        id: `node_trig_${ts}`,
        name: isEn ? 'Manual Run Trigger' : 'Manual Trigger',
        type: 'trigger_manual',
        category: 'Triggers',
        icon: 'Play',
        position: { x: 100, y: 220 },
        inputs: [],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: {},
      },
      {
        id: `node_cllm_${ts}`,
        name: isEn ? 'Basic LLM Chain' : 'Basic LLM Chain',
        type: 'chain_llm',
        category: 'Chain',
        icon: 'Sparkles',
        position: { x: 380, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { promptTemplate: 'Analyze and extract critical business findings from: {{$json}}' },
      },
      {
        id: `node_csum_${ts}`,
        name: isEn ? 'Summarization Chain' : 'Summarization Chain',
        type: 'chain_summarize',
        category: 'Chain',
        icon: 'FileText',
        position: { x: 660, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { format: 'bullet_points', maxBullets: 5 },
      },
      {
        id: `node_resp_${ts}`,
        name: isEn ? 'Send Chain Result' : 'Send Chat Response',
        type: 'chat_message',
        category: 'Chat',
        icon: 'Send',
        position: { x: 940, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { message: '{{$json.summary || $json.output}}', role: 'assistant' },
      },
    ];

    const connections: WorkflowConnection[] = [
      { id: `c1_${ts}`, fromNodeId: nodes[0].id, fromPortId: 'out_main', toNodeId: nodes[1].id, toPortId: 'in_main' },
      { id: `c2_${ts}`, fromNodeId: nodes[1].id, fromPortId: 'out_main', toNodeId: nodes[2].id, toPortId: 'in_main' },
      { id: `c3_${ts}`, fromNodeId: nodes[2].id, fromPortId: 'out_main', toNodeId: nodes[3].id, toPortId: 'in_main' },
    ];

    const explanation = isEn
      ? `I have assembled a real Chain workflow:\n1. **Manual Trigger**: Initiates execution.\n2. **Basic LLM Chain**: Runs prompt template through Gemini.\n3. **Summarization Chain**: Distills findings into bullet points.\n4. **Send Chat Response**: Outputs clean formatted digest.`
      : `Maine aapke liye Chain workflow generate kar diya hai:\n1. **Manual Trigger**: Pipeline shuru karega.\n2. **Basic LLM Chain**: Input data par intelligent reasoning chalayega.\n3. **Summarization Chain**: Bullet points me summary tayar karega.\n4. **Chat Response**: Result display karega.`;

    return { name, description, nodes, connections, explanation };
  }

  // D. FLOW CONTROL (ROUTER, BATCHES & FILTER) WORKFLOW
  if (lower.includes('flow') || lower.includes('batch') || lower.includes('loop') || lower.includes('router') || lower.includes('filter')) {
    const name = isEn ? 'Flow Control & Batch Processor' : 'Flow Control & Loop Workflow';
    const description = isEn
      ? 'Splits records in batches, filters active items, and routes them dynamically across dedicated channels.'
      : 'Items ko batches me split karta hai, filter karta hai aur Flow Router se distribute karta hai.';

    const nodes: WorkflowNodeData[] = [
      {
        id: `node_wh_${ts}`,
        name: isEn ? 'Batch Inbound Webhook' : 'Batch Inbound Webhook',
        type: 'trigger_webhook',
        category: 'Triggers',
        icon: 'Webhook',
        position: { x: 100, y: 220 },
        inputs: [],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { path: 'batch/intake' },
      },
      {
        id: `node_sbatch_${ts}`,
        name: isEn ? 'Split In Batches' : 'Split In Batches',
        type: 'flow_split_batches',
        category: 'Flow',
        icon: 'Layers',
        position: { x: 380, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [
          { id: 'out_loop', name: 'loop', type: 'branch', label: 'Batch Loop' },
          { id: 'out_done', name: 'done', type: 'main', label: 'Done' },
        ],
        config: { batchSize: 5 },
      },
      {
        id: `node_filt_${ts}`,
        name: isEn ? 'Filter Active Items' : 'Filter Items',
        type: 'flow_filter',
        category: 'Flow',
        icon: 'Filter',
        position: { x: 660, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [
          { id: 'out_kept', name: 'kept', type: 'main', label: 'Kept' },
          { id: 'out_discarded', name: 'discarded', type: 'branch', label: 'Discarded' },
        ],
        config: { field: 'status', operator: '==', value: 'active' },
      },
      {
        id: `node_router_${ts}`,
        name: isEn ? 'Flow Router' : 'Flow Router',
        type: 'flow_router',
        category: 'Flow',
        icon: 'Network',
        position: { x: 940, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [
          { id: 'out_route_1', name: 'route_1', type: 'branch', label: 'Route 1' },
          { id: 'out_route_2', name: 'route_2', type: 'branch', label: 'Route 2' },
          { id: 'out_fallback', name: 'fallback', type: 'branch', label: 'Fallback' },
        ],
        config: { activeRoute: 'out_route_1' },
      },
    ];

    const connections: WorkflowConnection[] = [
      { id: `c1_${ts}`, fromNodeId: nodes[0].id, fromPortId: 'out_main', toNodeId: nodes[1].id, toPortId: 'in_main' },
      { id: `c2_${ts}`, fromNodeId: nodes[1].id, fromPortId: 'out_loop', toNodeId: nodes[2].id, toPortId: 'in_main' },
      { id: `c3_${ts}`, fromNodeId: nodes[2].id, fromPortId: 'out_kept', toNodeId: nodes[3].id, toPortId: 'in_main' },
    ];

    const explanation = isEn
      ? `I have configured a high-performance Flow Control workflow:\n1. **Webhook Trigger**: Receives array of item records.\n2. **Split In Batches**: Chunks items into batches of 5.\n3. **Filter Items**: Filters active records only.\n4. **Flow Router**: Directs records through matching output routes.`
      : `Maine Flow Control workflow canvas par build kar diya hai:\n1. **Webhook Trigger**: Items array intake karega.\n2. **Split In Batches**: 5-5 items ke batches banayega.\n3. **Filter Items**: Keval active items ko aage pass karega.\n4. **Flow Router**: Alag-alag branches me items route karega.`;

    return { name, description, nodes, connections, explanation };
  }

  // E. CORE NODES WORKFLOW
  if (lower.includes('core') || lower.includes('variable') || lower.includes('edit fields') || lower.includes('code node')) {
    const name = isEn ? 'Core Operations & Data Computation' : 'Core Data Pipeline Workflow';
    const description = isEn
      ? 'Uses Core suite: Edit Fields assigns variables, Code script performs custom transformations, and Date & Time formats timestamps.'
      : 'Core suite nodes: Edit Fields, Code script aur Date & Time se data transform karta hai.';

    const nodes: WorkflowNodeData[] = [
      {
        id: `node_sched_${ts}`,
        name: isEn ? 'Schedule Trigger' : 'Schedule Trigger',
        type: 'trigger_schedule',
        category: 'Triggers',
        icon: 'Clock',
        position: { x: 100, y: 220 },
        inputs: [],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { cron: '0 * * * *', interval: 'Every hour' },
      },
      {
        id: `node_set_${ts}`,
        name: isEn ? 'Edit Fields (Set)' : 'Edit Fields (Set)',
        type: 'core_edit_fields',
        category: 'Core',
        icon: 'Edit3',
        position: { x: 380, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: {
          assignments: [
            { name: 'environment', value: 'production' },
            { name: 'runTimestamp', value: '{{$now}}' }
          ]
        },
      },
      {
        id: `node_code_${ts}`,
        name: isEn ? 'Code (JS / TS)' : 'Code Script (JS)',
        type: 'core_code',
        category: 'Core',
        icon: 'Terminal',
        position: { x: 660, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { code: 'item.calculatedScore = Math.floor(Math.random() * 100) + 1;\nitem.isHealthy = item.calculatedScore > 20;\nreturn item;' },
      },
      {
        id: `node_dt_${ts}`,
        name: isEn ? 'Date & Time' : 'Date & Time',
        type: 'core_datetime',
        category: 'Core',
        icon: 'Calendar',
        position: { x: 940, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { operation: 'format', format: 'YYYY-MM-DD HH:mm:ss', timezone: 'UTC' },
      },
    ];

    const connections: WorkflowConnection[] = [
      { id: `c1_${ts}`, fromNodeId: nodes[0].id, fromPortId: 'out_main', toNodeId: nodes[1].id, toPortId: 'in_main' },
      { id: `c2_${ts}`, fromNodeId: nodes[1].id, fromPortId: 'out_main', toNodeId: nodes[2].id, toPortId: 'in_main' },
      { id: `c3_${ts}`, fromNodeId: nodes[2].id, fromPortId: 'out_main', toNodeId: nodes[3].id, toPortId: 'in_main' },
    ];

    const explanation = isEn
      ? `I have created a Core processing workflow:\n1. **Schedule Trigger**: Triggers automatically on an hourly cron.\n2. **Edit Fields (Set)**: Sets environment variables and timestamps.\n3. **Code (JS / TS)**: Runs high-speed JS script logic.\n4. **Date & Time**: Converts and normalizes execution timestamps.`
      : `Maine Core Data Pipeline canvas par generate kar diya hai:\n1. **Schedule**: Har ghante automatic run karega.\n2. **Edit Fields (Set)**: Custom values aur timestamp assign karega.\n3. **Code Node**: JavaScript code run karke calculation karega.\n4. **Date & Time**: Date ko clean format me normalize karega.`;

    return { name, description, nodes, connections, explanation };
  }

  // 1. Google Sheets -> Gemini -> Gmail / Email
  if (
    (lower.includes('sheet') || lower.includes('excel') || lower.includes('lead')) &&
    (lower.includes('gmail') || lower.includes('email') || lower.includes('mail'))
  ) {
    const name = isEn ? 'Google Sheets Lead Outreach' : 'Google Sheets Lead Email Automator';
    const description = isEn
      ? 'Scheduled trigger reads rows from Google Sheets, personalizes content with Gemini AI, and dispatches via Gmail.'
      : 'Har roz Google Sheets se leads padhta hai aur Gemini AI ke sath personalized email bhejta hai.';

    const nodes: WorkflowNodeData[] = [
      {
        id: `node_sched_${ts}`,
        name: isEn ? 'Schedule Trigger (Daily 9 AM)' : 'Schedule Trigger (Roz Subah)',
        type: 'trigger_schedule',
        category: 'Triggers',
        icon: 'Clock',
        position: { x: 100, y: 220 },
        inputs: [],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { cron: '0 9 * * 1-5', interval: 'Every weekday morning' },
      },
      {
        id: `node_sheets_${ts}`,
        name: isEn ? 'Fetch Google Sheet Rows' : 'Google Sheet Rows Padho',
        type: 'app_google_sheets',
        category: 'Applications',
        icon: 'FileSpreadsheet',
        position: { x: 380, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { operation: 'readRows', sheetName: 'Leads', range: 'A:E' },
      },
      {
        id: `node_ai_${ts}`,
        name: isEn ? 'Gemini Email Personalizer' : 'Gemini AI Message Generator',
        type: 'ai_llm',
        category: 'AI',
        icon: 'Sparkles',
        position: { x: 660, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: {
          userPromptTemplate: 'Draft a warm, polite outreach email for: {{$json.name || $json.email}} regarding our automation services.',
        },
      },
      {
        id: `node_gmail_${ts}`,
        name: isEn ? 'Send Gmail Message' : 'Gmail Se Email Bhejo',
        type: 'app_gmail',
        category: 'Applications',
        icon: 'Mail',
        position: { x: 940, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: {
          operation: 'send',
          to: '{{$json.email || "recipient@example.com"}}',
          subject: 'Personalized Update for {{$json.name || "Valued Partner"}}',
        },
      },
    ];

    const connections: WorkflowConnection[] = [
      { id: `c1_${ts}`, fromNodeId: nodes[0].id, fromPortId: 'out_main', toNodeId: nodes[1].id, toPortId: 'in_main' },
      { id: `c2_${ts}`, fromNodeId: nodes[1].id, fromPortId: 'out_main', toNodeId: nodes[2].id, toPortId: 'in_main' },
      { id: `c3_${ts}`, fromNodeId: nodes[2].id, fromPortId: 'out_main', toNodeId: nodes[3].id, toPortId: 'in_main' },
    ];

    const explanation = isEn
      ? `I have architected and loaded a 4-step automation workflow on your canvas:\n1. **Schedule Trigger**: Triggers automatically on schedule.\n2. **Google Sheets**: Reads new rows and contacts.\n3. **Gemini AI**: Generates custom tailored email content.\n4. **Gmail**: Dispatches the email to your recipient.`
      : `Maine aapke liye 4 steps ka naya workflow canvas par directly build kar diya hai:\n1. **Schedule Trigger**: Automatic daily trigger karega.\n2. **Google Sheets**: Leads aur rows read karega.\n3. **Gemini AI**: Custom email draft banayega.\n4. **Gmail**: Recipient ko turant email bhejega.`;

    return { name, description, nodes, connections, explanation };
  }

  // 2. Webhook -> AI Agent -> Slack / Discord
  if (
    lower.includes('agent') ||
    lower.includes('slack') ||
    lower.includes('discord') ||
    lower.includes('support') ||
    lower.includes('triage')
  ) {
    const isSlack = !lower.includes('discord');
    const name = isEn ? 'Autonomous AI Support Agent' : 'Autonomous AI Support & Alert Agent';
    const description = isEn
      ? 'Listens for customer inquiries via Webhook, reasons with an Autonomous Gemini Agent with Memory, and alerts team.'
      : 'Inbound Webhook se query leta hai, Gemini Agent aur Memory se solve karke team ko alert bhejta hai.';

    const nodes: WorkflowNodeData[] = [
      {
        id: `node_wh_${ts}`,
        name: isEn ? 'Inbound Customer Webhook' : 'Customer Inbound Webhook',
        type: 'trigger_webhook',
        category: 'Triggers',
        icon: 'Webhook',
        position: { x: 80, y: 220 },
        inputs: [],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { httpMethod: 'POST', path: 'support-inquiry' },
      },
      {
        id: `node_agent_${ts}`,
        name: isEn ? 'Autonomous AI Support Agent' : 'AI Support Specialist Agent',
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
        config: {
          systemPrompt: 'You are an autonomous customer support engineer. Analyze the customer issue and provide an immediate helpful solution.',
        },
      },
      {
        id: `node_model_${ts}`,
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
        id: `node_mem_${ts}`,
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
        id: `node_dest_${ts}`,
        name: isSlack ? 'Post Alert to Slack' : 'Send Alert to Discord',
        type: isSlack ? 'app_slack' : 'app_discord',
        category: 'Applications',
        icon: isSlack ? 'MessageSquare' : 'Send',
        position: { x: 820, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: isSlack
          ? { channel: '#support-alerts', text: 'New Support Resolution: {{$json.text || $json.output}}' }
          : { channelId: 'support-channel', content: 'New Support Resolution: {{$json.text || $json.output}}' },
      },
    ];

    const connections: WorkflowConnection[] = [
      { id: `c1_${ts}`, fromNodeId: nodes[0].id, fromPortId: 'out_main', toNodeId: nodes[1].id, toPortId: 'in_main' },
      { id: `c_model_${ts}`, fromNodeId: nodes[2].id, fromPortId: 'out_model', toNodeId: nodes[1].id, toPortId: 'in_model' },
      { id: `c_mem_${ts}`, fromNodeId: nodes[3].id, fromPortId: 'out_memory', toNodeId: nodes[1].id, toPortId: 'in_memory' },
      { id: `c_dest_${ts}`, fromNodeId: nodes[1].id, fromPortId: 'out_main', toNodeId: nodes[4].id, toPortId: 'in_main' },
    ];

    const explanation = isEn
      ? `I have built an Autonomous AI Agent workflow directly on your canvas:\n1. **Webhook Trigger**: Receives incoming requests.\n2. **AI Agent**: Equipped with Gemini 2.5 Flash model and Window Memory.\n3. **Alert Channel**: Delivers resolution directly to team channel.`
      : `Maine aapke liye Autonomous AI Agent workflow canvas par ready kar diya hai:\n1. **Webhook**: Customer query receive karega.\n2. **AI Agent**: Gemini model aur memory ke sath query solve karega.\n3. **Team Alert**: Solution ko channel par dispatch karega.`;

    return { name, description, nodes, connections, explanation };
  }

  // 3. Database / SQL / Schedule Report
  if (lower.includes('database') || lower.includes('sql') || lower.includes('postgres') || lower.includes('mysql')) {
    const name = isEn ? 'Automated Database Reporter' : 'Database Data Extraction & Report';
    const description = isEn
      ? 'Runs scheduled query on Postgres, aggregates data with JavaScript sandbox, and dispatches automated report.'
      : 'Database se query execute karta hai aur clean report tayar karke dispatch karta hai.';

    const nodes: WorkflowNodeData[] = [
      {
        id: `node_sched_${ts}`,
        name: isEn ? 'Schedule Trigger' : 'Schedule Trigger',
        type: 'trigger_schedule',
        category: 'Triggers',
        icon: 'Clock',
        position: { x: 100, y: 220 },
        inputs: [],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { cron: '0 8 * * *' },
      },
      {
        id: `node_db_${ts}`,
        name: isEn ? 'PostgreSQL Query' : 'PostgreSQL Query Runner',
        type: 'app_postgres',
        category: 'Database',
        icon: 'Database',
        position: { x: 380, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: { operation: 'query', query: 'SELECT * FROM users WHERE created_at >= NOW() - INTERVAL \'24 HOURS\';' },
      },
      {
        id: `node_code_${ts}`,
        name: isEn ? 'Format Report (JS Code)' : 'Format Report Data',
        type: 'data_code',
        category: 'Developer',
        icon: 'Code',
        position: { x: 660, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: {
          code: 'const rows = $json.rows || [];\nreturn { totalNewUsers: rows.length, generatedAt: new Date().toISOString() };',
        },
      },
      {
        id: `node_email_${ts}`,
        name: isEn ? 'Send Executive Summary' : 'Report Email Bhejo',
        type: 'comm_email',
        category: 'Communication',
        icon: 'Mail',
        position: { x: 940, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
        config: {
          to: 'leadership@company.com',
          subject: 'Daily Operations Report: {{$json.totalNewUsers}} new signups',
        },
      },
    ];

    const connections: WorkflowConnection[] = [
      { id: `c1_${ts}`, fromNodeId: nodes[0].id, fromPortId: 'out_main', toNodeId: nodes[1].id, toPortId: 'in_main' },
      { id: `c2_${ts}`, fromNodeId: nodes[1].id, fromPortId: 'out_main', toNodeId: nodes[2].id, toPortId: 'in_main' },
      { id: `c3_${ts}`, fromNodeId: nodes[2].id, fromPortId: 'out_main', toNodeId: nodes[3].id, toPortId: 'in_main' },
    ];

    const explanation = isEn
      ? `I have built the Database Automation workflow for you:\n1. **Schedule Trigger**: Runs on automated schedule.\n2. **PostgreSQL**: Queries recent activity records.\n3. **Code Node**: Formats and computes summary stats.\n4. **Email**: Delivers report directly to stakeholders.`
      : `Maine Database Automation workflow canvas par generate kar diya hai:\n1. **Schedule**: Regular intervals par trigger karega.\n2. **PostgreSQL**: Database se records query karega.\n3. **Code Node**: Data clean aur aggregate karega.\n4. **Email**: Executive report dispatch karega.`;

    return { name, description, nodes, connections, explanation };
  }

  // 4. Default: Webhook -> Gemini AI -> Conditional Logic (IF) -> Webhook Response
  const name = isEn ? 'Smart API Webhook & AI Routing' : 'Smart Webhook & AI Router Workflow';
  const description = isEn
    ? 'Inbound Webhook trigger parses API data, classifies with Gemini AI, branches via IF logic, and responds immediately.'
    : 'Inbound Webhook data process karta hai, Gemini AI se classification karta hai aur conditional route karta hai.';

  const nodes: WorkflowNodeData[] = [
    {
      id: `node_wh_${ts}`,
      name: isEn ? 'Inbound Webhook API' : 'Inbound Webhook API',
      type: 'trigger_webhook',
      category: 'Triggers',
      icon: 'Webhook',
      position: { x: 100, y: 220 },
      inputs: [],
      outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
      config: { httpMethod: 'POST', path: 'api/intake' },
    },
    {
      id: `node_ai_${ts}`,
      name: isEn ? 'Gemini AI Processor' : 'Gemini AI Intent Analyzer',
      type: 'ai_llm',
      category: 'AI',
      icon: 'Sparkles',
      position: { x: 380, y: 220 },
      inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
      outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
      config: {
        userPromptTemplate: 'Analyze this input and determine priority (high/normal): {{$json}}',
      },
    },
    {
      id: `node_if_${ts}`,
      name: isEn ? 'Check Priority IF' : 'Check High Priority IF',
      type: 'logic_if',
      category: 'Logic',
      icon: 'GitBranch',
      position: { x: 660, y: 220 },
      inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
      outputs: [
        { id: 'out_true', name: 'true', type: 'true', label: 'True' },
        { id: 'out_false', name: 'false', type: 'false', label: 'False' },
      ],
      config: { fieldPath: 'isPriority', operator: '==', value: 'true' },
    },
    {
      id: `node_resp_${ts}`,
      name: isEn ? 'Respond to Webhook' : 'Webhook Response Bhejo',
      type: 'respond_to_webhook',
      category: 'HTTP',
      icon: 'Globe',
      position: { x: 960, y: 220 },
      inputs: [{ id: 'in_main', name: 'main', type: 'main' }],
      outputs: [{ id: 'out_main', name: 'main', type: 'main' }],
      config: {
        responseCode: 200,
        responseBody: '{"success": true, "message": "Workflow executed seamlessly"}',
      },
    },
  ];

  const connections: WorkflowConnection[] = [
    { id: `c1_${ts}`, fromNodeId: nodes[0].id, fromPortId: 'out_main', toNodeId: nodes[1].id, toPortId: 'in_main' },
    { id: `c2_${ts}`, fromNodeId: nodes[1].id, fromPortId: 'out_main', toNodeId: nodes[2].id, toPortId: 'in_main' },
    { id: `c3_${ts}`, fromNodeId: nodes[2].id, fromPortId: 'out_true', toNodeId: nodes[3].id, toPortId: 'in_main' },
  ];

  const explanation = isEn
    ? `I have synthesized and loaded a complete automation workflow on your canvas:\n1. **Webhook Trigger**: Receives payload.\n2. **Gemini AI**: Extracts insights and intent.\n3. **Logic IF**: Routes decisions dynamically.\n4. **Webhook Response**: Returns immediate HTTP status.`
    : `Maine aapka workflow canvas par successfully build aur load kar diya hai:\n1. **Webhook Trigger**: Request intake karega.\n2. **Gemini AI**: Data analyze aur classify karega.\n3. **Logic IF**: True/False branch routing karega.\n4. **Webhook Response**: Turant response return karega.`;

  return { name, description, nodes, connections, explanation };
}
