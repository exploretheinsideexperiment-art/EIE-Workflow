import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  avatar?: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  membersCount: number;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface NodePort {
  id: string;
  name: string;
  type: 'main' | 'true' | 'false' | 'error' | 'branch' | 'model' | 'memory' | 'tool' | 'outputParser';
  label?: string;
  color?: string;
}

export interface WorkflowNodeData {
  id: string;
  type: string;
  name: string;
  category: string;
  icon: string;
  position: { x: number; y: number };
  inputs: NodePort[];
  outputs: NodePort[];
  config: Record<string, any>;
  credentialId?: string;
  disabled?: boolean;
  pinnedData?: any;
  notes?: string;
  isExpanded?: boolean;
  executionSettings?: {
    continueOnError?: boolean;
    retryCount?: number;
    retryWaitMs?: number;
    executeOnce?: boolean;
    alwaysOutputData?: boolean;
    timeoutMs?: number;
    onError?: 'stop' | 'continue' | 'continueErrorOutput';
  };
}

export interface WorkflowConnection {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
}

export interface Workflow {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  active: boolean;
  nodes: WorkflowNodeData[];
  connections: WorkflowConnection[];
  viewport: { x: number; y: number; zoom: number };
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string;
  executionCount: number;
}

export interface Credential {
  id: string;
  workspaceId: string;
  name: string;
  type: string;
  data: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionNodeResult {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: 'waiting' | 'running' | 'success' | 'failed' | 'skipped';
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  input?: any;
  output?: any;
  error?: string;
}

export interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  triggerType: 'manual' | 'webhook' | 'schedule' | 'api';
  status: 'running' | 'success' | 'failed' | 'cancelled';
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  nodeResults: Record<string, ExecutionNodeResult>;
  logs: Array<{ timestamp: string; level: 'info' | 'warn' | 'error'; message: string; nodeId?: string }>;
  error?: string;
}

export interface Webhook {
  id: string;
  workflowId: string;
  nodeId: string;
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'ALL';
  secretToken?: string;
  callCount: number;
  lastCalledAt?: string;
  lastPayload?: any;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  workspaceId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface DatabaseSchema {
  users: User[];
  workspaces: Workspace[];
  workflows: Workflow[];
  credentials: Credential[];
  executions: Execution[];
  webhooks: Webhook[];
  apiKeys: ApiKey[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'eie_store.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_eie_salt_2026').digest('hex');
}

function createDefaultData(): DatabaseSchema {
  const adminId = 'usr_admin_01';
  const workspaceId = 'ws_default_01';

  const defaultUser: User = {
    id: adminId,
    email: 'exploretheinsideexperiment@gmail.com',
    name: 'EIE Automation Engineer',
    passwordHash: hashPassword('password123'),
    avatar: '/avatar.svg',
    createdAt: new Date().toISOString(),
  };

  const defaultWorkspace: Workspace = {
    id: workspaceId,
    name: 'Personal Automation Hub',
    ownerId: adminId,
    membersCount: 1,
    plan: 'pro',
  };

  const sampleWorkflowId = 'wf_sample_ai_lead';
  const webhookId = 'wh_lead_inbound';

  const sampleWorkflow: Workflow = {
    id: sampleWorkflowId,
    workspaceId: workspaceId,
    name: 'Inbound Webhook → AI Agent Analysis → Email Dispatch',
    description: 'Receives customer inquiries or alerts, analyzes sentiment and extracts key points using Gemini AI, then sends an email notification.',
    active: true,
    viewport: { x: 80, y: 140, zoom: 0.95 },
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    executionCount: 12,
    lastExecutedAt: new Date(Date.now() - 3600000).toISOString(),
    nodes: [
      {
        id: 'node_1',
        type: 'trigger_webhook',
        name: 'Inbound Webhook',
        category: 'Triggers',
        icon: 'Webhook',
        position: { x: 100, y: 220 },
        inputs: [],
        outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Trigger Output' }],
        config: {
          webhookPath: webhookId,
          method: 'POST',
          responseCode: 200,
          samplePayload: JSON.stringify({
            customer: "Alex Mercer",
            email: "alex.mercer@enterprise.io",
            company: "Apex Dynamics",
            inquiry: "We urgently need enterprise automation for 50,000 daily events with custom webhook triggers and AI classification.",
            priority: "High"
          }, null, 2)
        }
      },
      {
        id: 'node_2',
        type: 'ai_agent',
        name: 'Gemini AI Lead Analyst',
        category: 'AI',
        icon: 'Sparkles',
        position: { x: 480, y: 160 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input Data' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'AI Output' }],
        config: {
          model: 'gemini-3.8-flash',
          systemPrompt: 'You are an elite sales engineering AI. Analyze the customer inquiry. Return a clean JSON object with summary, estimatedContractTier (Tier 1, Tier 2, Tier 3), urgencyScore (1-100), and recommendedNextSteps array.',
          userPromptTemplate: 'Analyze customer inquiry from: {{$json.customer}} ({{$json.company}}):\nInquiry: {{$json.inquiry}}',
          temperature: 0.2,
          responseFormat: 'json'
        }
      },
      {
        id: 'node_3',
        type: 'logic_if',
        name: 'Check High Urgency',
        category: 'Logic',
        icon: 'GitBranch',
        position: { x: 860, y: 220 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
        outputs: [
          { id: 'out_true', name: 'true', type: 'true', label: 'Urgent (True)' },
          { id: 'out_false', name: 'false', type: 'false', label: 'Standard (False)' }
        ],
        config: {
          fieldPath: 'urgencyScore',
          operator: '>=',
          value: '50'
        }
      },
      {
        id: 'node_4',
        type: 'comm_email',
        name: 'Urgent Alert to VP Sales',
        category: 'Communication',
        icon: 'Mail',
        position: { x: 1220, y: 140 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Sent' }],
        config: {
          to: 'vp-sales@eie-workflow.internal',
          subject: '🔥 HIGH PRIORITY LEAD: {{$node["Gemini AI Lead Analyst"].json.estimatedContractTier}} from {{$json.company}}',
          bodyHtml: '<h3>Urgent Lead Notification</h3><p><strong>Customer:</strong> {{$json.customer}}</p><p><strong>Summary:</strong> {{$node["Gemini AI Lead Analyst"].json.summary}}</p><p><strong>Urgency Score:</strong> {{$node["Gemini AI Lead Analyst"].json.urgencyScore}}/100</p>'
        }
      },
      {
        id: 'node_5',
        type: 'comm_slack',
        name: 'Post to #leads-feed',
        category: 'Communication',
        icon: 'MessageSquare',
        position: { x: 1220, y: 340 },
        inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
        outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Posted' }],
        config: {
          channel: '#standard-leads',
          messageText: 'Standard lead queued from {{$json.company}}: {{$node["Gemini AI Lead Analyst"].json.summary}}'
        }
      }
    ],
    connections: [
      { id: 'c_1', fromNodeId: 'node_1', fromPortId: 'out_main', toNodeId: 'node_2', toPortId: 'in_main' },
      { id: 'c_2', fromNodeId: 'node_2', fromPortId: 'out_main', toNodeId: 'node_3', toPortId: 'in_main' },
      { id: 'c_3', fromNodeId: 'node_3', fromPortId: 'out_true', toNodeId: 'node_4', toPortId: 'in_main' },
      { id: 'c_4', fromNodeId: 'node_3', fromPortId: 'out_false', toNodeId: 'node_5', toPortId: 'in_main' },
    ]
  };

  const sampleWebhook: Webhook = {
    id: webhookId,
    workflowId: sampleWorkflowId,
    nodeId: 'node_1',
    name: 'Customer Lead Webhook',
    path: webhookId,
    method: 'POST',
    callCount: 12,
    lastCalledAt: new Date(Date.now() - 3600000).toISOString(),
    lastPayload: { customer: 'Sarah Connor', company: 'Cyberdyne', inquiry: 'System security audit request' },
    createdAt: new Date(Date.now() - 86400000).toISOString()
  };

  const defaultApiKey: ApiKey = {
    id: 'key_live_demo',
    workspaceId: workspaceId,
    name: 'Production Ingestion Key',
    keyPrefix: 'eie_live_9a8f',
    keyHash: hashPassword('eie_live_9a8f_secret_token_123'),
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    lastUsedAt: new Date(Date.now() - 1800000).toISOString(),
  };

  const sampleExecutions: Execution[] = [
    {
      id: 'exec_1042',
      workflowId: sampleWorkflowId,
      workflowName: sampleWorkflow.name,
      triggerType: 'webhook',
      status: 'success',
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      finishedAt: new Date(Date.now() - 3598160).toISOString(),
      durationMs: 1840,
      logs: [
        { timestamp: new Date(Date.now() - 3600000).toISOString(), level: 'info', message: 'Webhook triggered with payload: Apex Dynamics inquiry', nodeId: 'node_1' },
        { timestamp: new Date(Date.now() - 3599600).toISOString(), level: 'info', message: 'Gemini AI model gemini-3.8-flash generated structured analysis in 980ms', nodeId: 'node_2' },
        { timestamp: new Date(Date.now() - 3598600).toISOString(), level: 'info', message: 'IF Condition evaluated urgencyScore (88 >= 50) => Branch TRUE', nodeId: 'node_3' },
        { timestamp: new Date(Date.now() - 3598160).toISOString(), level: 'info', message: 'Email dispatched successfully to vp-sales@eie-workflow.internal', nodeId: 'node_4' }
      ],
      nodeResults: {
        'node_1': {
          nodeId: 'node_1',
          nodeName: 'Inbound Webhook',
          nodeType: 'trigger_webhook',
          status: 'success',
          durationMs: 12,
          output: {
            customer: "Alex Mercer",
            email: "alex.mercer@enterprise.io",
            company: "Apex Dynamics",
            inquiry: "We urgently need enterprise automation for 50,000 daily events with custom webhook triggers and AI classification.",
            priority: "High"
          }
        },
        'node_2': {
          nodeId: 'node_2',
          nodeName: 'Gemini AI Lead Analyst',
          nodeType: 'ai_agent',
          status: 'success',
          durationMs: 980,
          output: {
            summary: "Enterprise client requiring high-throughput visual workflow engine with 50k events/day capacity.",
            estimatedContractTier: "Tier 1",
            urgencyScore: 88,
            recommendedNextSteps: ["Schedule immediate enterprise architecture call", "Provision dedicated worker pool", "Offer custom node SDK demo"]
          }
        },
        'node_3': {
          nodeId: 'node_3',
          nodeName: 'Check High Urgency',
          nodeType: 'logic_if',
          status: 'success',
          durationMs: 5,
          output: { branch: 'true', urgencyScore: 88 }
        },
        'node_4': {
          nodeId: 'node_4',
          nodeName: 'Urgent Alert to VP Sales',
          nodeType: 'comm_email',
          status: 'success',
          durationMs: 340,
          output: { sent: true, recipient: 'vp-sales@eie-workflow.internal', subject: '🔥 HIGH PRIORITY LEAD: Tier 1 from Apex Dynamics' }
        },
        'node_5': {
          nodeId: 'node_5',
          nodeName: 'Post to #leads-feed',
          nodeType: 'comm_slack',
          status: 'skipped'
        }
      }
    }
  ];

  const credentials: Credential[] = [
    {
      id: 'cred_gemini_default',
      workspaceId: workspaceId,
      name: 'Google Gemini Workspace Key',
      type: 'gemini',
      data: { apiKey: 'AIzaSy********************' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cred_telegram_bot',
      workspaceId: workspaceId,
      name: 'DevOps Alert Bot',
      type: 'telegram',
      data: { botToken: '689241****:AAH*****************' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cred_postgres_prod',
      workspaceId: workspaceId,
      name: 'Analytics Data Warehouse',
      type: 'postgres',
      data: { host: 'analytics-db.eie.internal', database: 'prod_telemetry', user: 'eie_ro' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const auditLogs: AuditLog[] = [
    { id: 'aud_1', workspaceId: workspaceId, action: 'Workflow Created', details: 'Initialized workflow "Inbound Webhook → AI Agent Analysis"', timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 'aud_2', workspaceId: workspaceId, action: 'Workflow Activated', details: 'Webhook listener enabled on /api/webhook/wh_lead_inbound', timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: 'aud_3', workspaceId: workspaceId, action: 'Execution #1042', details: 'Manual & Webhook execution completed with status SUCCESS', timestamp: new Date(Date.now() - 3600000).toISOString() }
  ];

  return {
    users: [defaultUser],
    workspaces: [defaultWorkspace],
    workflows: [sampleWorkflow],
    credentials,
    executions: sampleExecutions,
    webhooks: [sampleWebhook],
    apiKeys: [defaultApiKey],
    auditLogs
  };
}

class Store {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[DB] Failed to load data from disk, initializing defaults:', err);
    }
    const initial = createDefaultData();
    this.save(initial);
    return initial;
  }

  private save(dataToSave?: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed to write database to disk:', err);
    }
  }

  public get<K extends keyof DatabaseSchema>(table: K): DatabaseSchema[K] {
    return this.data[table];
  }

  public set<K extends keyof DatabaseSchema>(table: K, value: DatabaseSchema[K]) {
    this.data[table] = value;
    this.save();
  }

  public mutate<T>(fn: (db: DatabaseSchema) => T): T {
    const result = fn(this.data);
    this.save();
    return result;
  }
}

export const db = new Store();
export { hashPassword };
