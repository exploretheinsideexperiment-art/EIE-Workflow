import { Workflow, WorkflowNodeData, WorkflowConnection, Execution } from '../types/workflow';
import { NODE_LIBRARY } from '../constants/nodeLibrary';
import { validateConnection } from './portValidation';

export interface WorkflowIssue {
  id: string;
  type: 'missing_trigger' | 'disconnected_node' | 'missing_model' | 'missing_memory' | 'missing_tool' | 'empty_config' | 'execution_error' | 'invalid_wire';
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  nodeId?: string;
  autoFixable: boolean;
}

export interface DiagnosticReport {
  healthScore: number; // 0 to 100
  status: 'healthy' | 'warning' | 'critical';
  issues: WorkflowIssue[];
  summary: string;
}

/**
 * Intelligent diagnostic engine that inspects nodes, connections, and execution results
 */
export function diagnoseWorkflow(workflow: Workflow, latestExecution?: Execution | null): DiagnosticReport {
  const issues: WorkflowIssue[] = [];
  const nodes = workflow.nodes || [];
  const connections = workflow.connections || [];

  if (nodes.length === 0) {
    return {
      healthScore: 100,
      status: 'healthy',
      issues: [],
      summary: 'Workflow canvas is empty. Add your first node to begin.',
    };
  }

  // 1. Check for Trigger
  const hasTrigger = nodes.some(
    (n) => n.category === 'Triggers' || n.type.startsWith('trigger_')
  );
  if (!hasTrigger && nodes.length > 1) {
    issues.push({
      id: 'issue_no_trigger',
      type: 'missing_trigger',
      severity: 'warning',
      title: 'Trigger Event Missing',
      description: 'Workflow me koi Trigger nahi hai (Webhook, Schedule, ya App Event). Iske bina workflow automatically start nahi ho payega.',
      autoFixable: true,
    });
  }

  // 2. Check each node
  nodes.forEach((node) => {
    // A. Disconnected nodes
    const hasIncoming = connections.some((c) => c.toNodeId === node.id);
    const hasOutgoing = connections.some((c) => c.fromNodeId === node.id);

    // AI sub-nodes only need outgoing
    const isAiSubNode = node.type.startsWith('ai_model_') || node.type.startsWith('ai_memory_') || node.type.startsWith('ai_tool_');
    const isTrigger = node.category === 'Triggers' || node.type.startsWith('trigger_');

    if (isAiSubNode) {
      if (!hasOutgoing) {
        issues.push({
          id: `issue_unconnected_sub_${node.id}`,
          type: 'disconnected_node',
          severity: 'warning',
          title: `Disconnected ${node.name}`,
          description: `"${node.name}" kisi AI Agent se connect nahi hai. Isko AI Agent ke matching port se connect karein.`,
          nodeId: node.id,
          autoFixable: true,
        });
      }
    } else if (isTrigger) {
      if (!hasOutgoing && nodes.length > 1) {
        issues.push({
          id: `issue_trigger_no_out_${node.id}`,
          type: 'disconnected_node',
          severity: 'warning',
          title: `Trigger "${node.name}" is Not Connected`,
          description: 'Trigger node ka output kisi downstream action se connect nahi hai.',
          nodeId: node.id,
          autoFixable: true,
        });
      }
    } else {
      // Regular action node
      if (!hasIncoming && !hasOutgoing && nodes.length > 1) {
        issues.push({
          id: `issue_orphan_${node.id}`,
          type: 'disconnected_node',
          severity: 'warning',
          title: `Orphan Node: "${node.name}"`,
          description: `"${node.name}" canvas par akela hai (na incoming wire hai na outgoing).`,
          nodeId: node.id,
          autoFixable: true,
        });
      }
    }

    // B. AI Agent specific checks
    if (node.type === 'ai_agent') {
      const modelConn = connections.find((c) => c.toNodeId === node.id && c.toPortId === 'in_model');
      if (!modelConn) {
        issues.push({
          id: `issue_agent_no_model_${node.id}`,
          type: 'missing_model',
          severity: 'error',
          title: `AI Agent Missing Chat Model: "${node.name}"`,
          description: 'AI Agent ko perform karne ke liye Google Gemini ya OpenAI model ki zaroorat hai.',
          nodeId: node.id,
          autoFixable: true,
        });
      }

      const memConn = connections.find((c) => c.toNodeId === node.id && c.toPortId === 'in_memory');
      if (!memConn) {
        issues.push({
          id: `issue_agent_no_mem_${node.id}`,
          type: 'missing_memory',
          severity: 'info',
          title: `AI Agent Missing Memory: "${node.name}"`,
          description: 'AI Agent ke paas Memory nahi hai, jisse conversation history retain nahi hogi.',
          nodeId: node.id,
          autoFixable: true,
        });
      }

      const toolConn = connections.find((c) => c.toNodeId === node.id && c.toPortId === 'in_tools');
      if (!toolConn) {
        issues.push({
          id: `issue_agent_no_tools_${node.id}`,
          type: 'missing_tool',
          severity: 'info',
          title: `AI Agent has No Tools: "${node.name}"`,
          description: 'AI Agent bina tools ke external actions (search, calculation, API) perform nahi kar payega.',
          nodeId: node.id,
          autoFixable: true,
        });
      }
    }

    // C. Empty Mandatory Configs
    if (node.type === 'http_request' && !node.config?.url) {
      issues.push({
        id: `issue_http_empty_${node.id}`,
        type: 'empty_config',
        severity: 'error',
        title: `Empty URL in HTTP Request: "${node.name}"`,
        description: 'HTTP Request me target URL khali hai.',
        nodeId: node.id,
        autoFixable: true,
      });
    }

    if (node.type === 'comm_email' && (!node.config?.to || !node.config?.subject)) {
      issues.push({
        id: `issue_email_empty_${node.id}`,
        type: 'empty_config',
        severity: 'warning',
        title: `Incomplete Email Config: "${node.name}"`,
        description: 'Recipient Email address ya Subject line missing hai.',
        nodeId: node.id,
        autoFixable: true,
      });
    }

    // D. Execution Error Check
    if (latestExecution?.nodeResults?.[node.id]?.status === 'failed') {
      const err = latestExecution.nodeResults[node.id].error || 'Execution failed';
      issues.push({
        id: `issue_exec_failed_${node.id}`,
        type: 'execution_error',
        severity: 'error',
        title: `Step Execution Failed: "${node.name}"`,
        description: `Last test run me yeh step fail hua: "${err}". Ei-Doctor iske configurations aur connections internally thik kar sakta hai.`,
        nodeId: node.id,
        autoFixable: true,
      });
    }
  });

  // Calculate Health Score
  let deductions = 0;
  issues.forEach((issue) => {
    if (issue.severity === 'error') deductions += 25;
    else if (issue.severity === 'warning') deductions += 15;
    else deductions += 5;
  });

  const healthScore = Math.max(0, 100 - deductions);
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (healthScore < 50) status = 'critical';
  else if (healthScore < 85) status = 'warning';

  let summary = 'Aapka workflow bilkul swasth aur ready hai! Sabhi connections aur configurations sahi hain.';
  if (issues.length > 0) {
    summary = `Ei-Doctor ne ${issues.length} problem(s) detect kiye hain. "Auto-Fix All" par click karke inhe turant thik karein.`;
  }

  return {
    healthScore,
    status,
    issues,
    summary,
  };
}

/**
 * Autonomous Repair Engine: fixes workflow problems internally
 */
export function autoRepairWorkflow(
  workflow: Workflow,
  latestExecution?: Execution | null
): { fixedWorkflow: Workflow; fixesApplied: string[] } {
  const fixesApplied: string[] = [];
  const nodes = JSON.parse(JSON.stringify(workflow.nodes)) as WorkflowNodeData[];
  let connections = JSON.parse(JSON.stringify(workflow.connections)) as WorkflowConnection[];

  // 1. Fix Missing Trigger
  const hasTrigger = nodes.some((n) => n.category === 'Triggers' || n.type.startsWith('trigger_'));
  if (!hasTrigger && nodes.length > 0) {
    const triggerDef = NODE_LIBRARY.find((n) => n.type === 'trigger_webhook');
    if (triggerDef) {
      const firstAction = nodes.find((n) => !n.type.startsWith('ai_model_') && !n.type.startsWith('ai_memory_') && !n.type.startsWith('ai_tool_'));
      const triggerX = firstAction ? Math.max(40, firstAction.position.x - 340) : 100;
      const triggerY = firstAction ? firstAction.position.y : 150;

      const triggerNode: WorkflowNodeData = {
        id: `trigger_wh_${Date.now()}`,
        type: triggerDef.type,
        name: 'Inbound Webhook Trigger',
        category: triggerDef.category,
        icon: triggerDef.icon,
        position: { x: triggerX, y: triggerY },
        inputs: triggerDef.inputs,
        outputs: triggerDef.outputs,
        config: { webhookPath: 'auto_webhook_' + Date.now().toString(36) },
      };

      nodes.unshift(triggerNode);
      fixesApplied.push('Added Inbound Webhook Trigger node');

      if (firstAction) {
        connections.push({
          id: `conn_trig_${Date.now()}`,
          fromNodeId: triggerNode.id,
          fromPortId: 'out_main',
          toNodeId: firstAction.id,
          toPortId: 'in_main',
        });
        fixesApplied.push(`Connected Trigger to "${firstAction.name}"`);
      }
    }
  }

  // 2. Fix AI Agents missing Model / Memory / Tools
  nodes.forEach((node) => {
    if (node.type === 'ai_agent') {
      // Model
      const hasModel = connections.some((c) => c.toNodeId === node.id && c.toPortId === 'in_model');
      if (!hasModel) {
        const geminiDef = NODE_LIBRARY.find((n) => n.type === 'ai_model_gemini');
        if (geminiDef) {
          const modelNode: WorkflowNodeData = {
            id: `model_gemini_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            type: geminiDef.type,
            name: 'Google Gemini Chat Model',
            category: geminiDef.category,
            icon: geminiDef.icon,
            position: { x: Math.max(40, node.position.x - 320), y: Math.max(40, node.position.y - 120) },
            inputs: geminiDef.inputs,
            outputs: geminiDef.outputs,
            config: { model: 'gemini-3.8-flash', temperature: 0.2 },
          };
          nodes.push(modelNode);
          connections.push({
            id: `conn_model_${Date.now()}`,
            fromNodeId: modelNode.id,
            fromPortId: 'out_model',
            toNodeId: node.id,
            toPortId: 'in_model',
          });
          fixesApplied.push(`Connected Google Gemini 3.8 Flash model (purple) to "${node.name}"`);
        }
      }

      // Memory
      const hasMemory = connections.some((c) => c.toNodeId === node.id && c.toPortId === 'in_memory');
      if (!hasMemory) {
        const memDef = NODE_LIBRARY.find((n) => n.type === 'ai_memory_window');
        if (memDef) {
          const memNode: WorkflowNodeData = {
            id: `mem_win_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            type: memDef.type,
            name: 'Window Buffer Memory',
            category: memDef.category,
            icon: memDef.icon,
            position: { x: Math.max(40, node.position.x - 320), y: node.position.y + 40 },
            inputs: memDef.inputs,
            outputs: memDef.outputs,
            config: { contextWindowLength: 10, sessionKey: 'session_{{$json.userId || "default"}}' },
          };
          nodes.push(memNode);
          connections.push({
            id: `conn_mem_${Date.now()}`,
            fromNodeId: memNode.id,
            fromPortId: 'out_memory',
            toNodeId: node.id,
            toPortId: 'in_memory',
          });
          fixesApplied.push(`Connected Window Buffer Memory (amber) to "${node.name}"`);
        }
      }

      // Tools
      const hasTool = connections.some((c) => c.toNodeId === node.id && c.toPortId === 'in_tools');
      if (!hasTool) {
        const toolDef = NODE_LIBRARY.find((n) => n.type === 'ai_tool_calculator');
        if (toolDef) {
          const toolNode: WorkflowNodeData = {
            id: `tool_calc_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            type: toolDef.type,
            name: 'Calculator Tool',
            category: toolDef.category,
            icon: toolDef.icon,
            position: { x: Math.max(40, node.position.x - 320), y: node.position.y + 180 },
            inputs: toolDef.inputs,
            outputs: toolDef.outputs,
            config: { toolName: 'calculator' },
          };
          nodes.push(toolNode);
          connections.push({
            id: `conn_tool_${Date.now()}`,
            fromNodeId: toolNode.id,
            fromPortId: 'out_tool',
            toNodeId: node.id,
            toPortId: 'in_tools',
          });
          fixesApplied.push(`Connected Calculator Tool (green) to "${node.name}"`);
        }
      }
    }
  });

  // 3. Fix Disconnected Action Nodes (Connect in logical left-to-right chain)
  const regularActionNodes = nodes.filter(
    (n) => !n.type.startsWith('ai_model_') && !n.type.startsWith('ai_memory_') && !n.type.startsWith('ai_tool_')
  ).sort((a, b) => a.position.x - b.position.x);

  for (let i = 0; i < regularActionNodes.length - 1; i++) {
    const current = regularActionNodes[i];
    const next = regularActionNodes[i + 1];

    const hasOutgoing = connections.some((c) => c.fromNodeId === current.id);
    const hasIncomingToNext = connections.some((c) => c.toNodeId === next.id);

    if (!hasOutgoing && !hasIncomingToNext) {
      connections.push({
        id: `conn_auto_${Date.now()}_${i}`,
        fromNodeId: current.id,
        fromPortId: current.outputs[0]?.id || 'out_main',
        toNodeId: next.id,
        toPortId: next.inputs[0]?.id || 'in_main',
      });
      fixesApplied.push(`Connected "${current.name}" to "${next.name}"`);
    }
  }

  // 4. Fix Empty Configurations
  nodes.forEach((node) => {
    if (node.type === 'http_request') {
      if (!node.config?.url) {
        node.config = {
          ...node.config,
          method: node.config?.method || 'GET',
          url: 'https://httpbin.org/get',
        };
        fixesApplied.push(`Auto-filled default test endpoint for "${node.name}"`);
      }
    } else if (node.type === 'comm_email') {
      if (!node.config?.to) {
        node.config = {
          ...node.config,
          to: 'team@yourdomain.com',
          subject: node.config?.subject || 'Automated Workflow Alert',
          bodyHtml: node.config?.bodyHtml || '<p>Automation completed successfully.</p>',
        };
        fixesApplied.push(`Configured recipient and subject defaults for "${node.name}"`);
      }
    } else if (node.type === 'app_slack') {
      if (!node.config?.channel) {
        node.config = {
          ...node.config,
          channel: '#general',
          text: node.config?.text || 'Automated alert from EIE-Workflow',
        };
        fixesApplied.push(`Configured default #general channel for "${node.name}"`);
      }
    }

    // 5. Fix steps that failed in the last execution
    if (latestExecution?.nodeResults?.[node.id]?.status === 'failed') {
      if (node.type === 'http_request') {
        node.config = {
          ...node.config,
          method: 'GET',
          url: 'https://httpbin.org/get',
        };
        fixesApplied.push(`Repaired HTTP request target to resilient endpoint for "${node.name}"`);
      } else if (node.type === 'data_code') {
        node.config = {
          ...node.config,
          code: 'return $json || { status: "success" };',
        };
        fixesApplied.push(`Fixed JavaScript sandbox script for "${node.name}"`);
      } else if (node.type === 'logic_if') {
        node.config = {
          ...node.config,
          operator: 'not_empty',
          value: '',
        };
        fixesApplied.push(`Reset IF condition logic for "${node.name}" to safe evaluator`);
      } else if (node.type === 'comm_email') {
        node.config = {
          ...node.config,
          to: 'team@yourdomain.com',
          subject: 'Workflow Notification: {{$json.event || "Success"}}',
        };
        fixesApplied.push(`Repaired email recipient and parameters for "${node.name}"`);
      }
    }
  });

  const fixedWorkflow: Workflow = {
    ...workflow,
    nodes,
    connections,
    updatedAt: new Date().toISOString(),
  };

  return {
    fixedWorkflow,
    fixesApplied,
  };
}
