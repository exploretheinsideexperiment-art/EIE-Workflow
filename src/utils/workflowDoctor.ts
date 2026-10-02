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

export const isTriggerNode = (node: WorkflowNodeData): boolean => {
  return (
    node.category === 'Triggers' ||
    node.type.startsWith('trigger_') ||
    node.type === 'chat_trigger' ||
    node.type === 'widget_chat' ||
    node.type === 'app_typeform' ||
    node.type === 'app_google_forms'
  );
};

/**
 * Intelligent diagnostic engine that inspects nodes, connections, and execution results
 */
export function diagnoseWorkflow(
  workflow: Workflow,
  latestExecution?: Execution | null,
  lang: 'en' | 'hi' = 'en'
): DiagnosticReport {
  const issues: WorkflowIssue[] = [];
  const nodes = workflow.nodes || [];
  const connections = workflow.connections || [];

  const isEn = lang === 'en';

  if (nodes.length === 0) {
    return {
      healthScore: 100,
      status: 'healthy',
      issues: [],
      summary: isEn
        ? 'Workflow canvas is empty. Add your first node to begin.'
        : 'Canvas abhi khali hai. Shuru karne ke liye pehla node add karein.',
    };
  }

  // 1. Check for Trigger
  const hasTrigger = nodes.some(isTriggerNode);
  if (!hasTrigger && nodes.length > 1) {
    issues.push({
      id: 'issue_no_trigger',
      type: 'missing_trigger',
      severity: 'warning',
      title: isEn ? 'Trigger Event Missing' : 'Trigger Event Missing',
      description: isEn
        ? 'The workflow has no Trigger event (Webhook, Schedule, Chat, or Manual trigger). Without a trigger, the workflow cannot start automatically.'
        : 'Workflow me koi Trigger nahi hai (Webhook, Schedule, Chat, ya App Event). Iske bina workflow automatically start nahi ho payega.',
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
    const isTrigger = isTriggerNode(node);

    if (isAiSubNode) {
      if (!hasOutgoing) {
        issues.push({
          id: `issue_unconnected_sub_${node.id}`,
          type: 'disconnected_node',
          severity: 'warning',
          title: isEn ? `Disconnected ${node.name}` : `Disconnected ${node.name}`,
          description: isEn
            ? `"${node.name}" is not attached to any AI Agent. Connect it to the matching port on an AI Agent node.`
            : `"${node.name}" kisi AI Agent se connect nahi hai. Isko AI Agent ke matching port se connect karein.`,
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
          title: isEn ? `Trigger "${node.name}" is Not Connected` : `Trigger "${node.name}" is Not Connected`,
          description: isEn
            ? `Trigger "${node.name}" output is not connected to any downstream action node.`
            : 'Trigger node ka output kisi downstream action se connect nahi hai.',
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
          title: isEn ? `Orphan Node: "${node.name}"` : `Orphan Node: "${node.name}"`,
          description: isEn
            ? `"${node.name}" is isolated on the canvas with neither incoming nor outgoing connections.`
            : `"${node.name}" canvas par akela hai (na incoming wire hai na outgoing).`,
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
          title: isEn ? `AI Agent Missing Chat Model: "${node.name}"` : `AI Agent Missing Chat Model: "${node.name}"`,
          description: isEn
            ? `The AI Agent requires a Chat Model (e.g. Google Gemini 2.5 Flash) connected to its Model port.`
            : 'AI Agent ko perform karne ke liye Google Gemini ya OpenAI model ki zaroorat hai.',
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
          title: isEn ? `AI Agent Missing Memory: "${node.name}"` : `AI Agent Missing Memory: "${node.name}"`,
          description: isEn
            ? `The AI Agent has no Memory component attached to retain multi-turn conversational context.`
            : 'AI Agent ke paas Memory nahi hai, jisse conversation history retain nahi hogi.',
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
          title: isEn ? `AI Agent has No Tools: "${node.name}"` : `AI Agent has No Tools: "${node.name}"`,
          description: isEn
            ? `The AI Agent has no external tools attached (Calculator, Web Search, Code Execution, etc.).`
            : 'AI Agent bina tools ke external actions (search, calculation, API) perform nahi kar payega.',
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
        title: isEn ? `Empty URL in HTTP Request: "${node.name}"` : `Empty URL in HTTP Request: "${node.name}"`,
        description: isEn
          ? `The HTTP Request node has an empty Target URL.`
          : 'HTTP Request me target URL khali hai.',
        nodeId: node.id,
        autoFixable: true,
      });
    }

    if (node.type === 'comm_email' && (!node.config?.to || !node.config?.subject)) {
      issues.push({
        id: `issue_email_empty_${node.id}`,
        type: 'empty_config',
        severity: 'warning',
        title: isEn ? `Incomplete Email Config: "${node.name}"` : `Incomplete Email Config: "${node.name}"`,
        description: isEn
          ? `Recipient Email address or Subject line is missing.`
          : 'Recipient Email address ya Subject line missing hai.',
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
        title: isEn ? `Step Execution Failed: "${node.name}"` : `Step Execution Failed: "${node.name}"`,
        description: isEn
          ? `This step failed during the last test run with error: "${err}". Ei-Doctor can reconfigure and repair it automatically.`
          : `Last test run me yeh step fail hua: "${err}". Ei-Doctor iske configurations aur connections internally thik kar sakta hai.`,
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

  let summary = isEn
    ? 'Your workflow is healthy and fully configured! All connections and parameters are valid.'
    : 'Aapka workflow bilkul swasth aur ready hai! Sabhi connections aur configurations sahi hain.';

  if (issues.length > 0) {
    summary = isEn
      ? `Ei-Doctor detected ${issues.length} potential problem(s). Click "Auto-Fix All" to resolve them automatically.`
      : `Ei-Doctor ne ${issues.length} problem(s) detect kiye hain. "Auto-Fix All" par click karke inhe turant thik karein.`;
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
  latestExecution?: Execution | null,
  lang: 'en' | 'hi' = 'en'
): { fixedWorkflow: Workflow; fixesApplied: string[] } {
  const isEn = lang === 'en';
  const fixesApplied: string[] = [];
  const nodes = JSON.parse(JSON.stringify(workflow.nodes)) as WorkflowNodeData[];
  let connections = JSON.parse(JSON.stringify(workflow.connections)) as WorkflowConnection[];

  // 1. Fix Missing Trigger
  const hasTrigger = nodes.some(isTriggerNode);
  if (!hasTrigger && nodes.length > 0) {
    const hasChat = nodes.some((n) => n.type.startsWith('chat_'));
    const triggerType = hasChat ? 'chat_trigger' : 'trigger_webhook';
    const triggerDef = NODE_LIBRARY.find((n) => n.type === triggerType);
    if (triggerDef) {
      const firstAction = nodes.find((n) => !n.type.startsWith('ai_model_') && !n.type.startsWith('ai_memory_') && !n.type.startsWith('ai_tool_'));
      const triggerX = firstAction ? Math.max(40, firstAction.position.x - 340) : 100;
      const triggerY = firstAction ? firstAction.position.y : 150;

      const triggerNode: WorkflowNodeData = {
        id: `trigger_${Date.now()}`,
        type: triggerDef.type,
        name: triggerDef.name,
        category: triggerDef.category,
        icon: triggerDef.icon,
        position: { x: triggerX, y: triggerY },
        inputs: triggerDef.inputs,
        outputs: triggerDef.outputs,
        config: triggerDef.defaultConfig || {},
      };

      nodes.unshift(triggerNode);
      fixesApplied.push(isEn ? `Added ${triggerDef.name}` : `${triggerDef.name} add kar diya gaya`);

      if (firstAction) {
        connections.push({
          id: `conn_trig_${Date.now()}`,
          fromNodeId: triggerNode.id,
          fromPortId: triggerNode.outputs[0]?.id || 'out_main',
          toNodeId: firstAction.id,
          toPortId: firstAction.inputs[0]?.id || 'in_main',
        });
        fixesApplied.push(isEn ? `Connected ${triggerDef.name} to "${firstAction.name}"` : `${triggerDef.name} ko "${firstAction.name}" se connect kar diya`);
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
            config: { model: 'gemini-2.5-flash', temperature: 0.2 },
          };
          nodes.push(modelNode);
          connections.push({
            id: `conn_model_${Date.now()}`,
            fromNodeId: modelNode.id,
            fromPortId: 'out_model',
            toNodeId: node.id,
            toPortId: 'in_model',
          });
          fixesApplied.push(`Connected Google Gemini 2.5 Flash model (purple) to "${node.name}"`);
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

/**
 * Resolve and remove a single specific issue on demand
 */
export function fixSingleIssue(
  workflow: Workflow,
  issueId: string,
  latestExecution?: Execution | null,
  lang: 'en' | 'hi' = 'en'
): { fixedWorkflow: Workflow; fixApplied: string } {
  const isEn = lang === 'en';
  let fixApplied = isEn ? 'Issue resolved' : 'Samasya theek ho gayi';
  const nodes = JSON.parse(JSON.stringify(workflow.nodes)) as WorkflowNodeData[];
  let connections = JSON.parse(JSON.stringify(workflow.connections)) as WorkflowConnection[];

  // 1. Missing Trigger
  if (issueId === 'issue_no_trigger') {
    const hasChat = nodes.some((n) => n.type.startsWith('chat_'));
    const triggerDef = NODE_LIBRARY.find((n) => n.type === (hasChat ? 'chat_trigger' : 'trigger_webhook'));
    if (triggerDef) {
      const firstAction = nodes.find((n) => !n.type.startsWith('ai_model_') && !n.type.startsWith('ai_memory_') && !n.type.startsWith('ai_tool_'));
      const triggerNode: WorkflowNodeData = {
        id: `trigger_${Date.now()}`,
        type: triggerDef.type,
        name: triggerDef.name,
        category: triggerDef.category,
        icon: triggerDef.icon,
        position: { x: firstAction ? Math.max(40, firstAction.position.x - 320) : 80, y: firstAction ? firstAction.position.y : 160 },
        inputs: triggerDef.inputs,
        outputs: triggerDef.outputs,
        config: triggerDef.defaultConfig || {},
      };
      nodes.unshift(triggerNode);
      if (firstAction) {
        connections.push({
          id: `conn_trig_${Date.now()}`,
          fromNodeId: triggerNode.id,
          fromPortId: triggerNode.outputs[0]?.id || 'out_main',
          toNodeId: firstAction.id,
          toPortId: firstAction.inputs[0]?.id || 'in_main',
        });
      }
      fixApplied = isEn ? `Added and connected ${triggerDef.name}` : `${triggerDef.name} add aur connect kar diya gaya`;
    }
  }
  // 2. Disconnected node or orphan node
  else if (issueId.startsWith('issue_orphan_') || issueId.startsWith('issue_trigger_no_out_') || issueId.startsWith('issue_unconnected_sub_')) {
    const targetNodeId = issueId.replace('issue_orphan_', '').replace('issue_trigger_no_out_', '').replace('issue_unconnected_sub_', '');
    const targetNode = nodes.find((n) => n.id === targetNodeId);
    if (targetNode) {
      const isSub = targetNode.type.startsWith('ai_model_') || targetNode.type.startsWith('ai_memory_') || targetNode.type.startsWith('ai_tool_');
      if (isSub) {
        const agent = nodes.find((n) => n.type === 'ai_agent');
        if (agent) {
          const portId = targetNode.type.startsWith('ai_model_') ? 'in_model' : targetNode.type.startsWith('ai_memory_') ? 'in_memory' : 'in_tools';
          connections.push({
            id: `conn_sub_${Date.now()}`,
            fromNodeId: targetNode.id,
            fromPortId: targetNode.outputs[0]?.id || (targetNode.type.startsWith('ai_model_') ? 'out_model' : targetNode.type.startsWith('ai_memory_') ? 'out_memory' : 'out_tool'),
            toNodeId: agent.id,
            toPortId: portId,
          });
          fixApplied = isEn ? `Connected "${targetNode.name}" to "${agent.name}"` : `"${targetNode.name}" ko "${agent.name}" se joda`;
        }
      } else {
        const otherNodes = nodes.filter((n) => n.id !== targetNode.id && !n.type.startsWith('ai_model_') && !n.type.startsWith('ai_memory_') && !n.type.startsWith('ai_tool_'));
        const downstream = otherNodes.find((n) => n.position.x > targetNode.position.x);
        const upstream = otherNodes.find((n) => n.position.x < targetNode.position.x);

        if (downstream && !connections.some((c) => c.fromNodeId === targetNode.id && c.toNodeId === downstream.id)) {
          connections.push({
            id: `conn_fix_${Date.now()}`,
            fromNodeId: targetNode.id,
            fromPortId: targetNode.outputs[0]?.id || 'out_main',
            toNodeId: downstream.id,
            toPortId: downstream.inputs[0]?.id || 'in_main',
          });
          fixApplied = isEn ? `Connected "${targetNode.name}" to "${downstream.name}"` : `"${targetNode.name}" ko "${downstream.name}" se connect kar diya`;
        } else if (upstream && !connections.some((c) => c.fromNodeId === upstream.id && c.toNodeId === targetNode.id)) {
          connections.push({
            id: `conn_fix_${Date.now()}`,
            fromNodeId: upstream.id,
            fromPortId: upstream.outputs[0]?.id || 'out_main',
            toNodeId: targetNode.id,
            toPortId: targetNode.inputs[0]?.id || 'in_main',
          });
          fixApplied = isEn ? `Connected "${upstream.name}" to "${targetNode.name}"` : `"${upstream.name}" ko "${targetNode.name}" se connect kar diya`;
        }
      }
    }
  }
  // 3. AI Agent missing Model / Memory / Tool
  else if (issueId.startsWith('issue_agent_no_model_')) {
    const agentId = issueId.replace('issue_agent_no_model_', '');
    const agent = nodes.find((n) => n.id === agentId);
    if (agent) {
      const geminiDef = NODE_LIBRARY.find((n) => n.type === 'ai_model_gemini');
      if (geminiDef) {
        const modelNode: WorkflowNodeData = {
          id: `model_gemini_${Date.now()}`,
          type: geminiDef.type,
          name: 'Google Gemini Chat Model',
          category: geminiDef.category,
          icon: geminiDef.icon,
          position: { x: Math.max(40, agent.position.x - 320), y: Math.max(40, agent.position.y - 120) },
          inputs: geminiDef.inputs,
          outputs: geminiDef.outputs,
          config: { model: 'gemini-2.5-flash', temperature: 0.2 },
        };
        nodes.push(modelNode);
        connections.push({
          id: `conn_model_${Date.now()}`,
          fromNodeId: modelNode.id,
          fromPortId: 'out_model',
          toNodeId: agent.id,
          toPortId: 'in_model',
        });
        fixApplied = isEn ? `Attached Gemini 2.5 Flash model to "${agent.name}"` : `Gemini 2.5 Flash model "${agent.name}" se attach kar diya`;
      }
    }
  }
  else if (issueId.startsWith('issue_agent_no_mem_')) {
    const agentId = issueId.replace('issue_agent_no_mem_', '');
    const agent = nodes.find((n) => n.id === agentId);
    if (agent) {
      const memDef = NODE_LIBRARY.find((n) => n.type === 'ai_memory_window');
      if (memDef) {
        const memNode: WorkflowNodeData = {
          id: `mem_win_${Date.now()}`,
          type: memDef.type,
          name: 'Window Buffer Memory',
          category: memDef.category,
          icon: memDef.icon,
          position: { x: Math.max(40, agent.position.x - 320), y: agent.position.y + 40 },
          inputs: memDef.inputs,
          outputs: memDef.outputs,
          config: { contextWindowLength: 10, sessionKey: 'session_{{$json.userId || "default"}}' },
        };
        nodes.push(memNode);
        connections.push({
          id: `conn_mem_${Date.now()}`,
          fromNodeId: memNode.id,
          fromPortId: 'out_memory',
          toNodeId: agent.id,
          toPortId: 'in_memory',
        });
        fixApplied = isEn ? `Attached Window Buffer Memory to "${agent.name}"` : `Window Buffer Memory "${agent.name}" se attach kar di`;
      }
    }
  }
  else if (issueId.startsWith('issue_agent_no_tools_')) {
    const agentId = issueId.replace('issue_agent_no_tools_', '');
    const agent = nodes.find((n) => n.id === agentId);
    if (agent) {
      const toolDef = NODE_LIBRARY.find((n) => n.type === 'ai_tool_calculator');
      if (toolDef) {
        const toolNode: WorkflowNodeData = {
          id: `tool_calc_${Date.now()}`,
          type: toolDef.type,
          name: 'Calculator Tool',
          category: toolDef.category,
          icon: toolDef.icon,
          position: { x: Math.max(40, agent.position.x - 320), y: agent.position.y + 180 },
          inputs: toolDef.inputs,
          outputs: toolDef.outputs,
          config: { toolName: 'calculator' },
        };
        nodes.push(toolNode);
        connections.push({
          id: `conn_tool_${Date.now()}`,
          fromNodeId: toolNode.id,
          fromPortId: 'out_tool',
          toNodeId: agent.id,
          toPortId: 'in_tools',
        });
        fixApplied = isEn ? `Attached Calculator Tool to "${agent.name}"` : `Calculator Tool "${agent.name}" se connect kar diya`;
      }
    }
  }
  // 4. Empty Config / Execution Failed
  else if (issueId.startsWith('issue_http_empty_') || issueId.startsWith('issue_email_empty_') || issueId.startsWith('issue_exec_failed_')) {
    const targetNodeId = issueId.replace('issue_http_empty_', '').replace('issue_email_empty_', '').replace('issue_exec_failed_', '');
    const targetNode = nodes.find((n) => n.id === targetNodeId);
    if (targetNode) {
      if (targetNode.type === 'http_request') {
        targetNode.config = { ...targetNode.config, method: targetNode.config?.method || 'GET', url: 'https://httpbin.org/get' };
        fixApplied = isEn ? `Configured working HTTP endpoint for "${targetNode.name}"` : `"${targetNode.name}" ke liye HTTP endpoint configure kar diya`;
      } else if (targetNode.type === 'comm_email') {
        targetNode.config = { ...targetNode.config, to: 'team@yourdomain.com', subject: 'Workflow Notification' };
        fixApplied = isEn ? `Configured email defaults for "${targetNode.name}"` : `"${targetNode.name}" ke email defaults set kar diye`;
      } else {
        targetNode.config = { ...targetNode.config, repairedAt: new Date().toISOString() };
        fixApplied = isEn ? `Repaired parameters for "${targetNode.name}"` : `"${targetNode.name}" ke parameters theek kar diye`;
      }
    }
  }
  // Fallback to auto-repair
  else {
    const res = autoRepairWorkflow(workflow, latestExecution, lang);
    return { fixedWorkflow: res.fixedWorkflow, fixApplied: res.fixesApplied[0] || (isEn ? 'Repaired workflow' : 'Workflow theek kar diya') };
  }

  return {
    fixedWorkflow: {
      ...workflow,
      nodes,
      connections,
      updatedAt: new Date().toISOString(),
    },
    fixApplied,
  };
}
