import { NodeDefinition, NodeCategory } from '../types/workflow';

export const NODE_LIBRARY: NodeDefinition[] = [
  // 1. TRIGGERS
  {
    type: 'trigger_manual',
    name: 'Manual Trigger',
    description: 'Triggers workflow execution manually with optional test payload data.',
    category: 'Triggers',
    icon: 'PlayCircle',
    accentColor: '#10b981', // emerald
    inputs: [],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Output' }],
    defaultConfig: {
      samplePayload: '{\n  "test": true,\n  "initiatedBy": "Engineer"\n}'
    }
  },
  {
    type: 'trigger_webhook',
    name: 'Webhook Trigger',
    description: 'Generates a unique HTTP webhook endpoint for inbound external event integration.',
    category: 'Triggers',
    icon: 'Webhook',
    accentColor: '#06b6d4', // cyan
    inputs: [],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Inbound Data' }],
    defaultConfig: {
      webhookPath: '',
      method: 'POST',
      responseCode: 200,
      samplePayload: '{\n  "event": "order_created",\n  "amount": 250,\n  "customer": "Apex Ltd"\n}'
    }
  },
  {
    type: 'trigger_schedule',
    name: 'Schedule Trigger',
    description: 'Executes workflows periodically (every minute, hourly, daily, or via cron).',
    category: 'Triggers',
    icon: 'Clock',
    accentColor: '#8b5cf6', // violet
    inputs: [],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Schedule Event' }],
    defaultConfig: {
      interval: 'hourly',
      cronExpression: '0 * * * *'
    }
  },
  {
    type: 'trigger_email',
    name: 'Email Trigger',
    description: 'Starts workflow when a configured inbox receives a qualifying message.',
    category: 'Triggers',
    icon: 'Inbox',
    accentColor: '#f59e0b', // amber
    inputs: [],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Email Event' }],
    defaultConfig: {
      filterSender: '',
      filterSubject: ''
    }
  },

  // 2. HTTP
  {
    type: 'http_request',
    name: 'HTTP Request',
    description: 'Executes outbound REST API calls with GET, POST, PUT, PATCH, DELETE and custom headers.',
    category: 'HTTP',
    icon: 'Globe',
    accentColor: '#3b82f6', // blue
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Trigger Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Response' }],
    defaultConfig: {
      method: 'GET',
      url: 'https://httpbin.org/get',
      headers: [{ key: 'Accept', value: 'application/json' }],
      body: '',
      timeoutMs: 15000
    }
  },

  // 3. AI SERVICES
  {
    type: 'ai_agent',
    name: 'Gemini AI Agent',
    description: 'Leverages Google Gemini 3.8 to reason, classify, extract entities, or summarize.',
    category: 'AI',
    icon: 'Sparkles',
    accentColor: '#ec4899', // pink
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Context / Data' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'AI Output' }],
    defaultConfig: {
      model: 'gemini-3.8-flash',
      systemPrompt: 'You are an intelligent workflow automation agent. Analyze input data and return concise structured output.',
      userPromptTemplate: 'Analyze this record: {{$json}}',
      temperature: 0.2,
      responseFormat: 'json'
    }
  },
  {
    type: 'ai_classifier',
    name: 'Smart Classifier',
    description: 'Categorizes incoming data into defined buckets using prompt classification.',
    category: 'AI',
    icon: 'Tags',
    accentColor: '#d946ef', // fuchsia
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Text Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Category' }],
    defaultConfig: {
      categories: ['Sales', 'Technical Support', 'Billing', 'Spam'],
      fieldToClassify: 'message'
    }
  },

  // 4. LOGIC
  {
    type: 'logic_if',
    name: 'IF / Condition',
    description: 'Branches workflow execution into TRUE or FALSE paths based on rules.',
    category: 'Logic',
    icon: 'GitBranch',
    accentColor: '#f97316', // orange
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [
      { id: 'out_true', name: 'true', type: 'true', label: 'TRUE' },
      { id: 'out_false', name: 'false', type: 'false', label: 'FALSE' }
    ],
    defaultConfig: {
      fieldPath: 'status',
      operator: '==',
      value: 'active'
    }
  },
  {
    type: 'logic_switch',
    name: 'Switch Case',
    description: 'Routes data along multiple paths based on matching criteria.',
    category: 'Logic',
    icon: 'Network',
    accentColor: '#eab308', // yellow
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [
      { id: 'out_case1', name: 'case1', type: 'branch', label: 'Case 1' },
      { id: 'out_case2', name: 'case2', type: 'branch', label: 'Case 2' },
      { id: 'out_default', name: 'default', type: 'branch', label: 'Default' }
    ],
    defaultConfig: {
      switchField: 'type'
    }
  },
  {
    type: 'logic_wait',
    name: 'Wait / Delay',
    description: 'Pauses workflow execution for a specified duration in seconds.',
    category: 'Logic',
    icon: 'Hourglass',
    accentColor: '#64748b', // slate
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'After Wait' }],
    defaultConfig: {
      seconds: 2
    }
  },
  {
    type: 'logic_filter',
    name: 'Filter Items',
    description: 'Filters lists of items, only allowing elements that meet criteria to proceed.',
    category: 'Logic',
    icon: 'Filter',
    accentColor: '#0ea5e9',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'List' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Filtered' }],
    defaultConfig: {
      filterCondition: 'item.score > 50'
    }
  },

  // 5. DATA TRANSFORMATION
  {
    type: 'data_set',
    name: 'Set Data',
    description: 'Adds, overwrites, or computes key-value fields in workflow JSON data.',
    category: 'Data',
    icon: 'Edit3',
    accentColor: '#14b8a6', // teal
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Modified Data' }],
    defaultConfig: {
      fields: [
        { name: 'processedAt', value: '{{$now}}' },
        { name: 'status', value: 'approved' }
      ]
    }
  },
  {
    type: 'data_code',
    name: 'Code Sandbox (JS)',
    description: 'Runs custom JavaScript code to transform, map, aggregate, or clean data.',
    category: 'Data',
    icon: 'Code2',
    accentColor: '#6366f1', // indigo
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Code Output' }],
    defaultConfig: {
      code: '// $json is incoming object, $input is raw payload\nreturn {\n  ...$json,\n  computedHash: "id_" + Math.random().toString(36).substr(2, 9),\n  timestamp: new Date().toISOString()\n};'
    }
  },
  {
    type: 'data_transform',
    name: 'Text & JSON Formatter',
    description: 'Converts between string case formats, parses JSON, or formats dates.',
    category: 'Data',
    icon: 'Layers',
    accentColor: '#0284c7',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Formatted' }],
    defaultConfig: {
      transformation: 'json_parse'
    }
  },

  // 6. COMMUNICATION
  {
    type: 'comm_email',
    name: 'Send Email',
    description: 'Sends automated HTML/Text email notifications with dynamic variable bindings.',
    category: 'Communication',
    icon: 'Mail',
    accentColor: '#ef4444', // red
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Sent Result' }],
    defaultConfig: {
      to: 'alerts@eie-workflow.internal',
      subject: 'Notification: {{$json.event}}',
      bodyHtml: '<p>Hello,</p><p>Workflow event received: {{$json}}</p>'
    }
  },
  {
    type: 'comm_telegram',
    name: 'Telegram Bot',
    description: 'Dispatches real-time alerts or chat messages to a Telegram group or channel.',
    category: 'Communication',
    icon: 'Send',
    accentColor: '#22d3ee', // light cyan
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Delivered' }],
    defaultConfig: {
      chatId: '@devops_channel',
      message: '🚨 EIE-Workflow Alert: {{$json.summary || "Trigger event detected"}}'
    }
  },
  {
    type: 'comm_slack',
    name: 'Slack Message',
    description: 'Posts formatted messages or blocks to a Slack channel via webhook.',
    category: 'Communication',
    icon: 'MessageSquare',
    accentColor: '#a855f7',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Sent' }],
    defaultConfig: {
      channel: '#general',
      messageText: 'EIE-Workflow Notification: {{$json.title || "Execution Finished"}}'
    }
  },
  {
    type: 'comm_discord',
    name: 'Discord Webhook',
    description: 'Sends rich embeds or text notifications to Discord channels.',
    category: 'Communication',
    icon: 'Disc',
    accentColor: '#5865F2',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Sent' }],
    defaultConfig: {
      content: '⚡ EIE-Workflow: Process completed successfully.'
    }
  },

  // 7. DATABASE
  {
    type: 'db_postgres',
    name: 'PostgreSQL',
    description: 'Executes parameterized queries, inserts, updates, and selects against PostgreSQL.',
    category: 'Database',
    icon: 'Database',
    accentColor: '#336791',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Query Results' }],
    defaultConfig: {
      operation: 'SELECT',
      table: 'leads',
      query: 'SELECT * FROM leads WHERE status = \'unassigned\' LIMIT 10;'
    }
  },
  {
    type: 'db_mysql',
    name: 'MySQL',
    description: 'Connects to MySQL databases for structured transactional querying.',
    category: 'Database',
    icon: 'HardDrive',
    accentColor: '#00758F',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Query Results' }],
    defaultConfig: {
      operation: 'SELECT',
      table: 'orders',
      query: 'SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;'
    }
  },
  {
    type: 'db_redis',
    name: 'Redis Cache',
    description: 'Performs high-speed cache operations: GET, SET, INCR, or PUBLISH.',
    category: 'Database',
    icon: 'Cpu',
    accentColor: '#DC382D',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Cache Output' }],
    defaultConfig: {
      command: 'SET',
      key: 'user:session:{{$json.id}}',
      ttlSeconds: 3600
    }
  },

  // 8. FILES
  {
    type: 'file_read_write',
    name: 'CSV / File Converter',
    description: 'Converts arrays of JSON objects to CSV strings or parses CSV lines into structured JSON.',
    category: 'Files',
    icon: 'FileSpreadsheet',
    accentColor: '#10b981',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input Array' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'CSV / File Data' }],
    defaultConfig: {
      mode: 'json_to_csv'
    }
  },

  // 9. DEVELOPER
  {
    type: 'dev_graphql',
    name: 'GraphQL Query',
    description: 'Executes GraphQL queries and mutations with variables and headers.',
    category: 'Developer',
    icon: 'Terminal',
    accentColor: '#e535ab',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Data' }],
    defaultConfig: {
      endpoint: 'https://api.github.com/graphql',
      query: 'query { viewer { login } }'
    }
  }
];

export const CATEGORIES: NodeCategory[] = [
  'Triggers',
  'Applications',
  'HTTP',
  'AI',
  'Logic',
  'Data',
  'Communication',
  'Database',
  'Files',
  'Developer',
  'Utilities'
];
