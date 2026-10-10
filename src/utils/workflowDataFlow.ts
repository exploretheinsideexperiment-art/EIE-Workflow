import { Workflow, WorkflowNodeData, WorkflowConnection, Execution } from '../types/workflow';

/**
 * Resolves realistic sample output for any node type in the workflow
 */
export function getDefaultSampleOutputForNodeType(type: string, name?: string): any {
  if (type === 'trigger_webhook' || type === 'webhook') {
    return [
      {
        json: {
          id: 1042,
          leadName: 'Elena Vance',
          email: 'elena.vance@example.com',
          company: 'Acme Robotics',
          city: 'Berlin',
          revenue: 145000,
          timestamp: new Date().toISOString(),
        },
      },
    ];
  }

  if (type === 'trigger_schedule' || type === 'schedule') {
    return [
      {
        json: {
          triggerTime: new Date().toISOString(),
          cron: '0 9 * * 1',
          dayOfWeek: 'Monday',
          executionType: 'scheduled',
        },
      },
    ];
  }

  if (type === 'chat_trigger' || type.startsWith('chat_')) {
    return [
      {
        json: {
          message: 'Hello! I need an update on my order #9821.',
          sessionId: 'sess_9821_live',
          userId: 'usr_customer_44',
          userName: 'Alex Mercer',
          timestamp: new Date().toISOString(),
        },
      },
    ];
  }

  if (type === 'http_request') {
    return [
      {
        json: {
          status: 200,
          statusText: 'OK',
          data: {
            success: true,
            records: [
              { id: 1, city: 'Berlin', temperature: '18°C', condition: 'Sunny' },
              { id: 2, city: 'London', temperature: '14°C', condition: 'Cloudy' },
            ],
            total: 2,
          },
        },
      },
    ];
  }

  if (type === 'app_google_sheets') {
    return [
      {
        json: {
          rowNumber: 2,
          id: 'lead_88',
          city: 'San Francisco',
          client: 'TechCorp International',
          amount: 5200,
          status: 'Open',
        },
      },
      {
        json: {
          rowNumber: 3,
          id: 'lead_89',
          city: 'Tokyo',
          client: 'Nippon Media',
          amount: 8900,
          status: 'Pending',
        },
      },
    ];
  }

  if (type === 'comm_telegram' || type === 'app_telegram') {
    return [
      {
        json: {
          message_id: 8841,
          chat_id: 5102553052,
          sender: 'EIE_Bot',
          status: 'sent',
          deliveredAt: new Date().toISOString(),
        },
      },
    ];
  }

  if (type === 'comm_whatsapp' || type === 'app_whatsapp') {
    return [
      {
        json: {
          messageId: 'wamid_HB82910',
          to: '+14155552671',
          status: 'delivered',
          timestamp: new Date().toISOString(),
        },
      },
    ];
  }

  if (type === 'ai_agent') {
    return [
      {
        json: {
          output: 'The request has been processed and verified across all systems.',
          reasoningSteps: 3,
          modelUsed: 'gemini-2.5-flash',
          status: 'success',
        },
      },
    ];
  }

  // Fallback generic item
  return [
    {
      json: {
        step: name || type,
        status: 'success',
        data: 'Sample payload data',
        timestamp: new Date().toISOString(),
      },
    },
  ];
}

/**
 * Computes incoming input data for a specific node based on predecessor nodes and latest execution
 */
export function resolveNodeInputData(
  nodeId: string,
  workflow: Workflow,
  latestExecution?: Execution | null
): any {
  if (!nodeId || !workflow) return null;

  // Find all incoming connections to this node
  const incoming = (workflow.connections || []).filter((c) => c.toNodeId === nodeId);

  if (incoming.length === 0) {
    const currentNode = workflow.nodes.find((n) => n.id === nodeId);
    // If it's a trigger node, it starts the workflow and generates input
    if (
      currentNode?.category === 'Triggers' ||
      currentNode?.type.startsWith('trigger_') ||
      currentNode?.type === 'chat_trigger'
    ) {
      return (
        latestExecution?.nodeResults?.[nodeId]?.output ||
        currentNode.pinnedData ||
        getDefaultSampleOutputForNodeType(currentNode.type, currentNode.name)
      );
    }
    return null; // Truly no input data
  }

  // Collect input data from each connected predecessor node
  const collectedItems: any[] = [];

  for (const conn of incoming) {
    const pNode = workflow.nodes.find((n) => n.id === conn.fromNodeId);
    if (!pNode) continue;

    let pOutput: any = null;

    // 1. Check if predecessor node executed in latest execution
    if (latestExecution?.nodeResults?.[pNode.id]?.output !== undefined) {
      pOutput = latestExecution.nodeResults[pNode.id].output;
    }
    // 2. Check pinned data
    else if (pNode.pinnedData) {
      pOutput = pNode.pinnedData;
    }
    // 3. Fallback to default sample output for predecessor node
    else {
      pOutput = getDefaultSampleOutputForNodeType(pNode.type, pNode.name);
    }

    if (Array.isArray(pOutput)) {
      collectedItems.push(...pOutput);
    } else if (pOutput && typeof pOutput === 'object') {
      // If object already formatted with json key
      if (pOutput.json) {
        collectedItems.push(pOutput);
      } else {
        collectedItems.push({ json: pOutput });
      }
    } else if (pOutput !== null && pOutput !== undefined) {
      collectedItems.push({ json: { value: pOutput } });
    }
  }

  return collectedItems.length > 0 ? collectedItems : null;
}

/**
 * Resolves expressions in standard workflow format:
 * - {{ $json.myKey }}
 * - {{ $('Predecessor Node').all()[0].json.key }}
 * - {{ $input.all() }}
 */
export function evaluateExpressionInContext(
  exprStr: string,
  inputData: any,
  workflow?: Workflow,
  latestExecution?: Execution | null
): any {
  if (typeof exprStr !== 'string') return exprStr;
  
  // Clean leading '=' if n8n formula style like '={{ $json.text }}' or '=5102553052'
  const trimmed = exprStr.trim();
  const cleanExpr = trimmed.startsWith('=') ? trimmed.replace(/^=+/, '').trim() : trimmed;
  if (!cleanExpr) return '';

  if (!cleanExpr.includes('{{') && !cleanExpr.includes('$')) return cleanExpr;

  const incomingItems = Array.isArray(inputData)
    ? inputData
    : (inputData && Object.keys(inputData).length > 0 ? [{ json: inputData }] : []);

  const firstItem = incomingItems[0]?.json || incomingItems[0] || {};

  // Build nodes lookup
  const nodesLookup: Record<string, any> = {};
  if (workflow) {
    for (const node of workflow.nodes) {
      const res =
        latestExecution?.nodeResults?.[node.id]?.output ||
        node.pinnedData ||
        getDefaultSampleOutputForNodeType(node.type, node.name);
      nodesLookup[node.name] = {
        all: () => (Array.isArray(res) ? res : [{ json: res }]),
        first: () => (Array.isArray(res) ? res[0] : { json: res }),
        item: Array.isArray(res) ? res[0] : { json: res },
        json: Array.isArray(res) ? (res[0]?.json || res[0]) : (res?.json || res),
      };
      nodesLookup[node.id] = nodesLookup[node.name];
    }
  }

  // Exact match of single expression like "{{$json.data}}"
  const exactMatch = cleanExpr.match(/^\{\{\s*(.*?)\s*\}\}$/s);
  if (exactMatch) {
    const rawVal = resolveSubExpr(exactMatch[1].trim(), firstItem, incomingItems, nodesLookup, inputData, workflow, latestExecution);
    if (rawVal !== undefined && rawVal !== null && rawVal !== '') return rawVal;
    // Fallback across all incoming items if array
    if (incomingItems.length > 0) {
      const joined = incomingItems.map((it: any) => it.json?.text || it.text || it.json?.message || it.message || it.json?.title).filter(Boolean).join('\n\n');
      if (joined) return joined;
    }
  }

  // Replace {{ ... }}
  const replaced = cleanExpr.replace(/\{\{\s*(.*?)\s*\}\}/g, (_, expression) => {
    return resolveSubExpr(expression.trim(), firstItem, incomingItems, nodesLookup, inputData, workflow, latestExecution);
  });

  if (replaced && replaced.trim() !== '') return replaced;

  // Fallback if expression resolved to empty: extract from inputData
  if (incomingItems.length > 0) {
    const joined = incomingItems.map((it: any) => it.json?.text || it.text || it.json?.message || it.message || it.json?.title).filter(Boolean).join('\n\n');
    if (joined) return joined;
  }

  return firstItem?.message || firstItem?.text || firstItem?.headline || firstItem?.summary || '';
}

function resolveSubExpr(
  trimmed: string,
  firstItem: any,
  incomingItems: any[],
  nodesLookup: Record<string, any>,
  inputData: any,
  workflow?: Workflow,
  latestExecution?: Execution | null
): any {
  try {
    // Logical OR: expr1 || expr2
    if (trimmed.includes('||')) {
      const parts = trimmed.split('||');
      for (const part of parts) {
        const p = part.trim();
        if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'"))) {
          return p.slice(1, -1);
        }
        const evaluated = evaluateExpressionInContext(`{{${p}}}`, inputData, workflow, latestExecution);
        if (evaluated !== undefined && evaluated !== null && evaluated !== '') {
          return evaluated;
        }
      }
      return '';
    }

    // Exact $json or $input
    if (trimmed === '$json' || trimmed === '$input') {
      return typeof firstItem === 'object' ? JSON.stringify(firstItem, null, 2) : String(firstItem);
    }

    // Simple property path: $json.foo.bar or $json["foo"]
    if (trimmed.startsWith('$json.') || trimmed.startsWith('$json[')) {
      const path = trimmed.replace(/^\$json\./, '').replace(/^\$json/, '').replace(/\[['"]?(.*?)['"]?\]/g, '.$1').replace(/^\./, '');
      let val = path.split('.').reduce((acc: any, part: string) => acc?.[part], firstItem);
      if (val !== undefined && val !== null && val !== '') {
        return typeof val === 'object' ? JSON.stringify(val) : String(val);
      }
      // Fallback if wrapped in .json or .data
      if (firstItem?.json) {
        val = path.split('.').reduce((acc: any, part: string) => acc?.[part], firstItem.json);
        if (val !== undefined && val !== null && val !== '') {
          return typeof val === 'object' ? JSON.stringify(val) : String(val);
        }
      }
      // Try across items array
      for (const it of incomingItems) {
        const itemVal = path.split('.').reduce((acc: any, part: string) => acc?.[part], it.json || it);
        if (itemVal !== undefined && itemVal !== null && itemVal !== '') {
          return typeof itemVal === 'object' ? JSON.stringify(itemVal) : String(itemVal);
        }
      }
      return '';
    }

    // $('Node Name').all()[i].json.field or $('Node Name').item.json.field
    const nodeMatch = trimmed.match(/^\$\(['"](.*?)['"]\)\.(.*)$/);
    if (nodeMatch) {
      const nodeName = nodeMatch[1];
      const rest = nodeMatch[2];
      const targetNode = nodesLookup[nodeName];
      if (!targetNode) return '';

      // Safe evaluation
      const fn = new Function('$', '$json', '$input', `return $("${nodeName}").${rest};`);
      const val = fn(
        (name: string) => nodesLookup[name] || { all: () => [], first: () => ({ json: {} }), json: {} },
        firstItem,
        { all: () => (incomingItems.length > 0 ? incomingItems : [{ json: inputData }]), item: { json: firstItem } }
      );
      if (val !== undefined && val !== null) {
        return typeof val === 'object' ? JSON.stringify(val) : String(val);
      }
      return '';
    }

    // Generic expression fallback
    const fn = new Function('$', '$json', '$input', `return (${trimmed});`);
    const val = fn(
      (name: string) => nodesLookup[name] || { all: () => [], first: () => ({ json: {} }), json: {} },
      firstItem,
      { all: () => (incomingItems.length > 0 ? incomingItems : [{ json: inputData }]), item: { json: firstItem } }
    );
    if (val !== undefined && val !== null) {
      return typeof val === 'object' ? JSON.stringify(val) : String(val);
    }
    return '';
  } catch {
    return '';
  }
}
