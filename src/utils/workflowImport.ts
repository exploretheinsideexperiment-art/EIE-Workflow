import { Workflow, WorkflowNodeData, WorkflowConnection } from '../types/workflow';
import { NODE_LIBRARY } from '../constants/nodeLibrary';

// Mapping table from official n8n node types to our internal node catalog
const N8N_TYPE_MAP: Record<string, string> = {
  'n8n-nodes-base.telegram': 'app_telegram',
  'n8n-nodes-base.webhook': 'trigger_webhook',
  'n8n-nodes-base.scheduleTrigger': 'trigger_schedule',
  'n8n-nodes-base.code': 'core_code',
  'n8n-nodes-base.if': 'logic_if',
  'n8n-nodes-base.switch': 'flow_switch',
  'n8n-nodes-base.httpRequest': 'core_http',
  'n8n-nodes-base.set': 'core_edit_fields',
  'n8n-nodes-base.slack': 'app_slack',
  'n8n-nodes-base.discord': 'app_discord',
  'n8n-nodes-base.gmail': 'app_gmail',
  'n8n-nodes-base.postgres': 'db_postgres',
  'n8n-nodes-base.mySql': 'db_mysql',
  'n8n-nodes-base.openAi': 'app_openai',
  '@n8n/n8n-nodes-langchain.agent': 'ai_agent',
  '@n8n/n8n-nodes-langchain.lmChatOpenAi': 'ai_model_openai',
  '@n8n/n8n-nodes-langchain.lmChatAnthropic': 'ai_model_anthropic',
  '@n8n/n8n-nodes-langchain.lmChatGoogleGemini': 'ai_model_gemini',
  '@n8n/n8n-nodes-langchain.memoryBufferWindow': 'ai_memory_window',
  '@n8n/n8n-nodes-langchain.toolCalculator': 'ai_tool_calculator',
  '@n8n/n8n-nodes-langchain.toolHttpRequest': 'ai_tool_http',
  '@n8n/n8n-nodes-langchain.toolCustom': 'ai_tool_custom',
};

export function normalizeImportedWorkflow(
  rawInput: any,
  workspaceId: string = 'ws_explore'
): Workflow {
  let root = rawInput;
  if (typeof rawInput === 'string') {
    try {
      root = JSON.parse(rawInput);
    } catch (e) {
      throw new Error('Invalid JSON format');
    }
  }

  // Handle wrappers like { workflow: { ... } } or { data: { ... } }
  if (root.workflow && typeof root.workflow === 'object') {
    root = root.workflow;
  } else if (root.data && typeof root.data === 'object' && root.data.nodes) {
    root = root.data;
  }

  // Name & Description
  const workflowName = root.name ? String(root.name).trim() : 'Imported Workflow';
  const workflowDescription = root.description ? String(root.description).trim() : '';

  // Extract raw nodes array
  let rawNodes: any[] = [];
  if (Array.isArray(root.nodes)) {
    rawNodes = root.nodes;
  } else if (Array.isArray(root)) {
    rawNodes = root;
  }

  // Map to index by node ID and node Name for connection mapping
  const nodeIdByName = new Map<string, string>();
  const nodes: WorkflowNodeData[] = [];

  rawNodes.forEach((rawNode, idx) => {
    const rawId = rawNode.id || `node_${Date.now()}_${idx}`;
    const rawName = rawNode.name || `Node ${idx + 1}`;
    nodeIdByName.set(rawName, rawId);

    // Determine type
    const rawType = rawNode.type || 'core_code';
    const mappedType = N8N_TYPE_MAP[rawType] || rawType;
    const libDef =
      NODE_LIBRARY.find((n) => n.type === mappedType) ||
      NODE_LIBRARY.find((n) => n.type.toLowerCase() === mappedType.toLowerCase()) ||
      NODE_LIBRARY.find((n) => mappedType.includes(n.type)) ||
      NODE_LIBRARY[0];

    // Determine position {x, y}
    let posX = 200 + idx * 260;
    let posY = 200;
    if (Array.isArray(rawNode.position) && rawNode.position.length >= 2) {
      posX = Number(rawNode.position[0]) || posX;
      posY = Number(rawNode.position[1]) || posY;
    } else if (rawNode.position && typeof rawNode.position === 'object') {
      posX = Number(rawNode.position.x) ?? posX;
      posY = Number(rawNode.position.y) ?? posY;
    }

    // Determine ports
    const inputs =
      Array.isArray(rawNode.inputs) && rawNode.inputs.length > 0
        ? rawNode.inputs
        : libDef.inputs || [{ id: 'in_main', name: 'main', type: 'main' }];
    const outputs =
      Array.isArray(rawNode.outputs) && rawNode.outputs.length > 0
        ? rawNode.outputs
        : libDef.outputs || [{ id: 'out_main', name: 'main', type: 'main' }];

    // Merge config and parameters
    const config = {
      ...(libDef.defaultConfig || {}),
      ...(rawNode.parameters || {}),
      ...(rawNode.config || {}),
    };

    nodes.push({
      id: String(rawId),
      type: mappedType,
      name: rawName,
      category: libDef.category || 'Core',
      icon: libDef.icon || 'Box',
      position: { x: posX, y: posY },
      inputs,
      outputs,
      config,
      credentialId: rawNode.credentialId || rawNode.credentials?.id,
      disabled: Boolean(rawNode.disabled),
      notes: rawNode.notes || rawNode.notesInFlow,
      packageIdentifier: rawNode.type,
    });
  });

  // Extract and normalize connections
  const connections: WorkflowConnection[] = [];

  if (Array.isArray(root.connections)) {
    // Already an array of connections
    root.connections.forEach((conn: any, i: number) => {
      if (conn.fromNodeId && conn.toNodeId) {
        connections.push({
          id: conn.id || `conn_${Date.now()}_${i}`,
          fromNodeId: String(conn.fromNodeId),
          fromPortId: conn.fromPortId || 'out_main',
          toNodeId: String(conn.toNodeId),
          toPortId: conn.toPortId || 'in_main',
        });
      }
    });
  } else if (root.connections && typeof root.connections === 'object') {
    // Standard connection mapping dictionary:
    // { "SourceNode": { "main": [ [ { "node": "TargetNode", "type": "main", "index": 0 } ] ] } }
    Object.entries(root.connections).forEach(([sourceName, connGroup]: [string, any]) => {
      const sourceId = nodeIdByName.get(sourceName);
      if (!sourceId) return;

      if (connGroup && typeof connGroup === 'object') {
        Object.entries(connGroup).forEach(([outputGroupType, routes]: [string, any]) => {
          if (!Array.isArray(routes)) return;

          routes.forEach((routeGroup: any, groupIdx: number) => {
            if (!Array.isArray(routeGroup)) return;

            routeGroup.forEach((dest: any) => {
              if (!dest || !dest.node) return;
              const targetId = nodeIdByName.get(dest.node);
              if (!targetId) return;

              // Find source node and default output port
              const srcNode = nodes.find((n) => n.id === sourceId);
              const destNode = nodes.find((n) => n.id === targetId);

              const fromPortId =
                srcNode?.outputs[groupIdx]?.id ||
                srcNode?.outputs[0]?.id ||
                'out_main';
              const toPortId =
                destNode?.inputs[dest.index || 0]?.id ||
                destNode?.inputs[0]?.id ||
                'in_main';

              connections.push({
                id: `conn_${sourceId}_${targetId}_${groupIdx}_${dest.index || 0}`,
                fromNodeId: sourceId,
                fromPortId,
                toNodeId: targetId,
                toPortId,
              });
            });
          });
        });
      }
    });
  }

  // Calculate centered viewport
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  if (nodes.length > 0) {
    nodes.forEach((n) => {
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + 280);
      maxY = Math.max(maxY, n.position.y + 160);
    });
  }

  const viewport = {
    x: isFinite(minX) ? Math.max(40, 100 - minX * 0.8) : 100,
    y: isFinite(minY) ? Math.max(40, 100 - minY * 0.8) : 100,
    zoom: 1,
  };

  return {
    id: root.id ? String(root.id) : `wf_${Date.now()}`,
    name: workflowName,
    description: workflowDescription,
    active: Boolean(root.active),
    nodes,
    connections,
    viewport,
    createdAt: root.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    executionCount: Number(root.executionCount) || 0,
    workspaceId,
  };
}
