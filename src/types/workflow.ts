export type NodeCategory =
  | 'All Applications'
  | 'Applications'
  | 'Triggers'
  | 'Chat'
  | 'Core'
  | 'Flow'
  | 'Chain'
  | 'Condition'
  | 'AI'
  | 'AI Tools'
  | 'HTTP'
  | 'Database'
  | 'Communication'
  | 'Logic'
  | 'Data'
  | 'Files'
  | 'Developer'
  | 'Utilities';

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
  category: NodeCategory;
  icon: string;
  position: { x: number; y: number };
  inputs: NodePort[];
  outputs: NodePort[];
  config: Record<string, any>;
  credentialId?: string;
  disabled?: boolean; // n8n: disabled / muted node
  pinnedData?: any; // n8n: pinned test data
  notes?: string; // n8n: custom documentation note
  isExpanded?: boolean; // expandable card view on canvas
  executionSettings?: {
    continueOnError?: boolean;
    retryCount?: number;
    retryWaitMs?: number;
    executeOnce?: boolean;
    alwaysOutputData?: boolean;
    timeoutMs?: number;
    onError?: 'stop' | 'continue' | 'continueErrorOutput';
    displayNoteInFlow?: boolean;
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

export interface NodeDefinition {
  type: string;
  name: string;
  description: string;
  category: NodeCategory;
  icon: string;
  accentColor: string;
  inputs: NodePort[];
  outputs: NodePort[];
  defaultConfig: Record<string, any>;
  requiresCredentials?: boolean;
  credentialType?: string;
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

export interface Credential {
  id: string;
  workspaceId: string;
  name: string;
  type: string;
  data: Record<string, string>;
  createdAt: string;
  updatedAt: string;
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
  keyHash?: string;
  secretKey?: string;
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

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  membersCount: number;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface StatsOverview {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successfulExecutions: number;
  successRate: number;
  avgDurationMs: number;
  activeWebhooks: number;
}
