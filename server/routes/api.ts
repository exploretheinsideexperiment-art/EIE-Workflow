import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { db, hashPassword, Workflow, Webhook, Credential, ApiKey, AuditLog } from '../db';
import { WorkflowEngine, executionEvents } from '../engine/workflowEngine';
import { handleEiDoctorChat } from '../engine/workflowAiArchitect';

export const router = express.Router();

// Middleware: fake current user context
const DEFAULT_USER_ID = 'usr_admin_01';
const DEFAULT_WORKSPACE_ID = 'ws_default_01';

// --- AUTHENTICATION ---
router.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const users = db.get('users');
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.passwordHash !== hashPassword(password)) {
    // Provide friendly fallback for demo login if they type any password
    if (user) {
      return res.json({ user, workspace: db.get('workspaces')[0] });
    }
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const workspace = db.get('workspaces').find((w) => w.ownerId === user.id) || db.get('workspaces')[0];
  return res.json({ user, workspace });
});

router.post('/auth/signup', (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const users = db.get('users');
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'A user with this email already exists.' });
  }

  const newUser = {
    id: `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    name,
    email,
    passwordHash: hashPassword(password),
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  };

  const newWorkspace = {
    id: `ws_${Date.now()}`,
    name: `${name}'s Automation Lab`,
    ownerId: newUser.id,
    membersCount: 1,
    plan: 'free' as const,
  };

  db.mutate((d) => {
    d.users.push(newUser);
    d.workspaces.push(newWorkspace);
    d.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      workspaceId: newWorkspace.id,
      action: 'User Registered',
      details: `New account created for ${email}`,
      timestamp: new Date().toISOString(),
    });
  });

  return res.json({ user: newUser, workspace: newWorkspace });
});

router.get('/auth/me', (req: Request, res: Response) => {
  const user = db.get('users')[0];
  const workspace = db.get('workspaces')[0];
  return res.json({ user, workspace });
});

router.put('/user/profile', (req: Request, res: Response) => {
  const { name, email, avatar } = req.body;
  let updatedUser;
  db.mutate((d) => {
    if (d.users.length > 0) {
      if (name !== undefined) d.users[0].name = name;
      if (email !== undefined) d.users[0].email = email;
      if (avatar !== undefined) d.users[0].avatar = avatar;
      updatedUser = d.users[0];
    }
  });
  if (!updatedUser) {
    return res.status(404).json({ error: 'User not found.' });
  }
  return res.json({ user: updatedUser });
});

router.put('/user/avatar', (req: Request, res: Response) => {
  const { avatar } = req.body;
  if (!avatar) {
    return res.status(400).json({ error: 'Avatar URL or image data is required.' });
  }
  let updatedUser;
  db.mutate((d) => {
    if (d.users.length > 0) {
      d.users[0].avatar = avatar;
      updatedUser = d.users[0];
      d.auditLogs.unshift({
        id: `aud_${Date.now()}`,
        workspaceId: d.workspaces[0]?.id || DEFAULT_WORKSPACE_ID,
        action: 'Avatar Updated',
        details: 'User profile picture changed',
        timestamp: new Date().toISOString(),
      });
    }
  });
  return res.json({ user: updatedUser });
});

// --- WORKFLOWS CRUD ---
router.get('/workflows', (req: Request, res: Response) => {
  const workflows = db.get('workflows');
  return res.json(workflows);
});

router.get('/workflows/:id', (req: Request, res: Response) => {
  const wf = db.get('workflows').find((w) => w.id === req.params.id);
  if (!wf) {
    return res.status(404).json({ error: 'Workflow not found.' });
  }
  return res.json(wf);
});

router.post('/workflows', (req: Request, res: Response) => {
  const { name, description, nodes, connections, viewport } = req.body;
  const newWorkflow: Workflow = {
    id: `wf_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    workspaceId: DEFAULT_WORKSPACE_ID,
    name: name || 'Untitled Automation Workflow',
    description: description || 'Visually connects APIs, triggers, AI models, and communication channels.',
    active: false,
    nodes: nodes || [],
    connections: connections || [],
    viewport: viewport || { x: 120, y: 120, zoom: 1 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    executionCount: 0,
  };

  db.mutate((d) => {
    d.workflows.unshift(newWorkflow);
    d.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      workspaceId: DEFAULT_WORKSPACE_ID,
      action: 'Workflow Created',
      details: `Workflow "${newWorkflow.name}" created`,
      timestamp: new Date().toISOString(),
    });
  });

  return res.status(201).json(newWorkflow);
});

router.put('/workflows/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const updates = req.body;

  let updatedWf: Workflow | null = null;
  db.mutate((d) => {
    const idx = d.workflows.findIndex((w) => w.id === id);
    if (idx !== -1) {
      d.workflows[idx] = {
        ...d.workflows[idx],
        ...updates,
        id,
        updatedAt: new Date().toISOString(),
      };
      updatedWf = d.workflows[idx];
    } else {
      // Upsert: Create workflow in DB if it did not exist yet
      const newWf: Workflow = {
        id,
        workspaceId: updates.workspaceId || DEFAULT_WORKSPACE_ID,
        name: updates.name || 'Untitled Automation Workflow',
        description: updates.description || 'Visually connects APIs, triggers, AI models, and communication channels.',
        active: updates.active ?? false,
        nodes: updates.nodes || [],
        connections: updates.connections || [],
        viewport: updates.viewport || { x: 120, y: 120, zoom: 1 },
        createdAt: updates.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        executionCount: updates.executionCount || 0,
      };
      d.workflows.unshift(newWf);
      updatedWf = newWf;
    }

    // Sync any webhook triggers in the workflow with the webhooks table
    if (updatedWf && updatedWf.nodes) {
      const webhookNodes = updatedWf.nodes.filter((n) => n.type === 'trigger_webhook');
      for (const wn of webhookNodes) {
        const path = wn.config?.webhookPath || wn.id;
        const existingWh = d.webhooks.find((w) => w.workflowId === updatedWf!.id && w.nodeId === wn.id);
        if (existingWh) {
          existingWh.path = path;
          existingWh.name = wn.name || 'Webhook Trigger';
          existingWh.method = wn.config?.method || 'POST';
        } else {
          d.webhooks.push({
            id: path,
            workflowId: updatedWf!.id,
            nodeId: wn.id,
            name: wn.name || 'Webhook Trigger',
            path,
            method: wn.config?.method || 'POST',
            callCount: 0,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  });

  return res.json(updatedWf);
});

router.delete('/workflows/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  db.mutate((d) => {
    d.workflows = d.workflows.filter((w) => w.id !== id);
    d.webhooks = d.webhooks.filter((w) => w.workflowId !== id);
    d.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      workspaceId: DEFAULT_WORKSPACE_ID,
      action: 'Workflow Deleted',
      details: `Workflow ID ${id} deleted`,
      timestamp: new Date().toISOString(),
    });
  });
  return res.json({ success: true, message: 'Workflow deleted successfully.' });
});

router.post('/workflows/:id/toggle', (req: Request, res: Response) => {
  const id = req.params.id;
  let status: boolean = false;
  let wfName = '';
  db.mutate((d) => {
    const wf = d.workflows.find((w) => w.id === id);
    if (wf) {
      wf.active = !wf.active;
      status = wf.active;
      wfName = wf.name;
      d.auditLogs.unshift({
        id: `aud_${Date.now()}`,
        workspaceId: DEFAULT_WORKSPACE_ID,
        action: status ? 'Workflow Activated' : 'Workflow Deactivated',
        details: `Workflow "${wf.name}" is now ${status ? 'ACTIVE' : 'INACTIVE'}`,
        timestamp: new Date().toISOString(),
      });
    }
  });
  return res.json({ active: status, name: wfName });
});

router.post('/workflows/:id/duplicate', (req: Request, res: Response) => {
  const id = req.params.id;
  const original = db.get('workflows').find((w) => w.id === id);
  if (!original) return res.status(404).json({ error: 'Workflow not found.' });

  const duplicated: Workflow = {
    ...JSON.parse(JSON.stringify(original)),
    id: `wf_${Date.now()}_copy`,
    name: `${original.name} (Copy)`,
    active: false,
    executionCount: 0,
    lastExecutedAt: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.mutate((d) => {
    d.workflows.unshift(duplicated);
  });

  return res.json(duplicated);
});

// Run workflow manually or via test
router.post('/workflows/:id/run', async (req: Request, res: Response) => {
  const id = req.params.id;
  let wf = db.get('workflows').find((w) => w.id === id);

  // If client provided workflow in request body, upsert and prioritize it
  if (req.body?.workflow && req.body.workflow.nodes && req.body.workflow.nodes.length > 0) {
    const clientWf: Workflow = {
      ...req.body.workflow,
      id,
      updatedAt: new Date().toISOString(),
    };
    db.mutate((d) => {
      const idx = d.workflows.findIndex((w) => w.id === id);
      if (idx !== -1) {
        d.workflows[idx] = clientWf;
      } else {
        d.workflows.unshift(clientWf);
      }
    });
    wf = clientWf;
  }

  // If still not found in DB, fallback to any available workflow or auto-create fallback
  if (!wf) {
    const allWfs = db.get('workflows');
    if (allWfs.length > 0) {
      wf = allWfs[0];
    }
  }

  if (!wf) {
    return res.status(404).json({ error: 'No executable workflow found.' });
  }

  const triggerType = req.body?.triggerType || 'manual';
  const payload = req.body?.payload || {};

  try {
    const execution = await WorkflowEngine.executeWorkflow(wf, triggerType, payload);
    return res.json(execution);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Execution error.' });
  }
});

// --- EXECUTIONS ---
router.get('/executions', (req: Request, res: Response) => {
  const { workflowId } = req.query;
  let list = db.get('executions');
  if (workflowId && typeof workflowId === 'string') {
    list = list.filter((e) => e.workflowId === workflowId);
  }
  return res.json(list.slice(0, 50));
});

router.get('/executions/:id', (req: Request, res: Response) => {
  const execution = db.get('executions').find((e) => e.id === req.params.id);
  if (!execution) return res.status(404).json({ error: 'Execution not found.' });
  return res.json(execution);
});

// SSE Live Execution Stream
router.get('/executions-stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent({ type: 'connected', timestamp: new Date().toISOString() });

  const listener = (data: any) => {
    sendEvent(data);
  };

  executionEvents.on('execution_update', listener);

  req.on('close', () => {
    executionEvents.off('execution_update', listener);
  });
});

// --- WEBHOOK INGESTION & DISPATCH ---
router.get('/webhooks', (req: Request, res: Response) => {
  return res.json(db.get('webhooks'));
});

// Real webhook trigger endpoint: /api/webhook/:path
router.all('/webhook/:path', async (req: Request, res: Response) => {
  const path = req.params.path;
  const webhooks = db.get('webhooks');
  const targetWebhook = webhooks.find((w) => w.path === path || w.id === path);

  if (!targetWebhook) {
    return res.status(404).json({ error: `No active webhook registered at path: /webhook/${path}` });
  }

  const workflow = db.get('workflows').find((w) => w.id === targetWebhook.workflowId);
  if (!workflow) {
    return res.status(404).json({ error: 'Associated workflow not found.' });
  }

  const payload = {
    headers: req.headers,
    query: req.query,
    params: req.params,
    method: req.method,
    body: req.body,
    receivedAt: new Date().toISOString(),
    ...(typeof req.body === 'object' && req.body !== null ? req.body : {}),
  };

  // Update webhook stats
  db.mutate((d) => {
    const wh = d.webhooks.find((w) => w.id === targetWebhook.id);
    if (wh) {
      wh.callCount = (wh.callCount || 0) + 1;
      wh.lastCalledAt = new Date().toISOString();
      wh.lastPayload = req.body;
    }
  });

  try {
    const execution = await WorkflowEngine.executeWorkflow(workflow, 'webhook', payload);
    return res.json({
      status: 'success',
      message: `Workflow "${workflow.name}" triggered successfully via Webhook.`,
      executionId: execution.id,
      workflowStatus: execution.status,
      durationMs: execution.durationMs,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Webhook workflow trigger failed.' });
  }
});

// Convenience test dispatcher from UI
router.post('/webhooks/test-dispatch', async (req: Request, res: Response) => {
  const { path, payload, method } = req.body;
  const webhooks = db.get('webhooks');
  const wh = webhooks.find((w) => w.path === path || w.id === path);
  if (!wh) {
    return res.status(404).json({ error: `Webhook with path "${path}" not found.` });
  }

  const workflow = db.get('workflows').find((w) => w.id === wh.workflowId);
  if (!workflow) {
    return res.status(404).json({ error: 'Associated workflow not found.' });
  }

  try {
    const execution = await WorkflowEngine.executeWorkflow(workflow, 'webhook', payload || {});
    return res.json({
      success: true,
      executionId: execution.id,
      status: execution.status,
      durationMs: execution.durationMs,
      nodeResults: execution.nodeResults,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// --- CREDENTIALS ---
router.get('/credentials', (req: Request, res: Response) => {
  const creds = db.get('credentials').map((c) => {
    // Mask sensitive fields
    const masked: Record<string, string> = {};
    for (const [k, v] of Object.entries(c.data)) {
      if (k.toLowerCase().includes('key') || k.toLowerCase().includes('token') || k.toLowerCase().includes('secret') || k.toLowerCase().includes('password')) {
        masked[k] = v.length > 6 ? v.slice(0, 4) + '****************' : '******';
      } else {
        masked[k] = v;
      }
    }
    return { ...c, data: masked };
  });
  return res.json(creds);
});

router.post('/credentials', (req: Request, res: Response) => {
  const { name, type, data } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'Name and type are required.' });

  const newCred: Credential = {
    id: `cred_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    workspaceId: DEFAULT_WORKSPACE_ID,
    name,
    type,
    data: data || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.mutate((d) => {
    d.credentials.push(newCred);
    d.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      workspaceId: DEFAULT_WORKSPACE_ID,
      action: 'Credential Added',
      details: `New ${type.toUpperCase()} credential "${name}" created`,
      timestamp: new Date().toISOString(),
    });
  });

  return res.status(201).json(newCred);
});

router.delete('/credentials/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  db.mutate((d) => {
    d.credentials = d.credentials.filter((c) => c.id !== id);
    d.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      workspaceId: DEFAULT_WORKSPACE_ID,
      action: 'Credential Deleted',
      details: `Credential ${id} removed`,
      timestamp: new Date().toISOString(),
    });
  });
  return res.json({ success: true });
});

// --- API KEYS ---
router.get('/api-keys', (req: Request, res: Response) => {
  return res.json(db.get('apiKeys'));
});

router.post('/api-keys', (req: Request, res: Response) => {
  const { name } = req.body;
  const rawKey = `eie_${crypto.randomBytes(16).toString('hex')}`;
  const keyPrefix = rawKey.slice(0, 10);
  const keyHash = hashPassword(rawKey);

  const apiKey: ApiKey = {
    id: `key_${Date.now()}`,
    workspaceId: DEFAULT_WORKSPACE_ID,
    name: name || 'Default Service Token',
    keyPrefix,
    keyHash,
    createdAt: new Date().toISOString(),
  };

  db.mutate((d) => {
    d.apiKeys.push(apiKey);
    d.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      workspaceId: DEFAULT_WORKSPACE_ID,
      action: 'API Key Created',
      details: `API Key "${apiKey.name}" created`,
      timestamp: new Date().toISOString(),
    });
  });

  // Return the secret key ONLY once upon creation!
  return res.status(201).json({ ...apiKey, secretKey: rawKey });
});

router.delete('/api-keys/:id', (req: Request, res: Response) => {
  db.mutate((d) => {
    d.apiKeys = d.apiKeys.filter((k) => k.id !== req.params.id);
  });
  return res.json({ success: true });
});

// --- AUDIT LOGS ---
router.get('/audit-logs', (req: Request, res: Response) => {
  return res.json(db.get('auditLogs'));
});

// --- STATS OVERVIEW ---
router.get('/stats', (req: Request, res: Response) => {
  const workflows = db.get('workflows');
  const executions = db.get('executions');
  const webhooks = db.get('webhooks');

  const totalRuns = executions.length;
  const successfulRuns = executions.filter((e) => e.status === 'success').length;
  const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 100;
  const totalDuration = executions.reduce((acc, e) => acc + (e.durationMs || 0), 0);
  const avgDurationMs = totalRuns > 0 ? Math.round(totalDuration / totalRuns) : 0;

  return res.json({
    totalWorkflows: workflows.length,
    activeWorkflows: workflows.filter((w) => w.active).length,
    totalExecutions: totalRuns,
    successfulExecutions: successfulRuns,
    successRate,
    avgDurationMs,
    activeWebhooks: webhooks.length,
  });
});

// --- EI-DOCTOR AI CHAT, TROUBLESHOOTER & AUTONOMOUS WORKFLOW ARCHITECT ---
router.post('/buddy/chat', async (req: Request, res: Response) => {
  const { message, workflow, latestExecution } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    const aiResult = await handleEiDoctorChat(message, workflow, latestExecution);
    return res.json(aiResult);
  } catch (err: any) {
    console.error('[Ei-Doctor Error]', err);
    return res.json({
      action: 'chat',
      reply: 'An error occurred while processing your request. Please try again.',
      source: 'local_architect',
      language: 'en',
    });
  }
});

