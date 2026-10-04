import { WorkflowNodeData, NodePort, WorkflowConnection } from '../types/workflow';

export type PortType =
  | 'main'
  | 'true'
  | 'false'
  | 'error'
  | 'branch'
  | 'model'
  | 'memory'
  | 'tool'
  | 'outputParser';

export interface PortColorDef {
  border: string;
  bg: string;
  hover: string;
  ring: string;
  hex: string;
  glow: string;
  name: string;
  shortLabel: string;
}

export const PORT_COLORS: Record<string, PortColorDef> = {
  model: {
    border: 'border-purple-400',
    bg: 'bg-purple-400',
    hover: 'hover:border-purple-300',
    ring: 'ring-purple-400 shadow-purple-500/50',
    hex: '#c084fc',
    glow: 'drop-shadow(0 0 10px rgba(192, 132, 252, 0.85))',
    name: 'AI Model (Purple)',
    shortLabel: 'Model',
  },
  memory: {
    border: 'border-amber-400',
    bg: 'bg-amber-400',
    hover: 'hover:border-amber-300',
    ring: 'ring-amber-400 shadow-amber-500/50',
    hex: '#fbbf24',
    glow: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.85))',
    name: 'AI Memory (Amber)',
    shortLabel: 'Memory',
  },
  tool: {
    border: 'border-emerald-400',
    bg: 'bg-emerald-400',
    hover: 'hover:border-emerald-300',
    ring: 'ring-emerald-400 shadow-emerald-500/50',
    hex: '#34d399',
    glow: 'drop-shadow(0 0 10px rgba(52, 211, 153, 0.85))',
    name: 'AI Tool (Green)',
    shortLabel: 'Tool',
  },
  true: {
    border: 'border-emerald-400',
    bg: 'bg-emerald-400',
    hover: 'hover:border-emerald-300',
    ring: 'ring-emerald-400 shadow-emerald-500/50',
    hex: '#10b981',
    glow: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.8))',
    name: 'True Condition (Green)',
    shortLabel: 'TRUE',
  },
  false: {
    border: 'border-rose-400',
    bg: 'bg-rose-400',
    hover: 'hover:border-rose-300',
    ring: 'ring-rose-400 shadow-rose-500/50',
    hex: '#f43f5e',
    glow: 'drop-shadow(0 0 8px rgba(244, 63, 94, 0.8))',
    name: 'False Condition (Rose)',
    shortLabel: 'FALSE',
  },
  branch: {
    border: 'border-indigo-400',
    bg: 'bg-indigo-400',
    hover: 'hover:border-indigo-300',
    ring: 'ring-indigo-400 shadow-indigo-500/50',
    hex: '#818cf8',
    glow: 'drop-shadow(0 0 8px rgba(129, 140, 248, 0.8))',
    name: 'Branch (Indigo)',
    shortLabel: 'Branch',
  },
  outputParser: {
    border: 'border-pink-400',
    bg: 'bg-pink-400',
    hover: 'hover:border-pink-300',
    ring: 'ring-pink-400 shadow-pink-500/50',
    hex: '#f472b6',
    glow: 'drop-shadow(0 0 8px rgba(244, 114, 182, 0.8))',
    name: 'Output Parser (Pink)',
    shortLabel: 'Parser',
  },
  main: {
    border: 'border-cyan-400',
    bg: 'bg-cyan-400',
    hover: 'hover:border-cyan-300',
    ring: 'ring-cyan-400 shadow-cyan-500/50',
    hex: '#38bdf8',
    glow: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.8))',
    name: 'Data Flow (Cyan)',
    shortLabel: 'Data',
  },
};

export function getPortColorDef(portType?: string): PortColorDef {
  if (!portType) return PORT_COLORS.main;
  return PORT_COLORS[portType] || PORT_COLORS.main;
}

/**
 * Determine port type from a node and portId safely
 */
export function getPortTypeFromNode(
  node: WorkflowNodeData | undefined,
  portId: string,
  isOutput: boolean
): string {
  if (!node) return 'main';

  const ports = isOutput ? node.outputs : node.inputs;
  const port = ports?.find((p) => p.id === portId);
  if (port?.type) return port.type;

  // Fallback by node type & port conventions
  if (isOutput) {
    if (node.type.startsWith('ai_model_')) return 'model';
    if (node.type.startsWith('ai_memory_')) return 'memory';
    if (node.type.startsWith('ai_tool_')) return 'tool';
    if (portId === 'out_true') return 'true';
    if (portId === 'out_false') return 'false';
    return 'main';
  } else {
    if (node.type === 'ai_agent') {
      if (portId === 'in_model') return 'model';
      if (portId === 'in_memory') return 'memory';
      if (portId === 'in_tools' || portId.startsWith('in_tools')) return 'tool';
      return 'main';
    }
    return 'main';
  }
}

/**
 * Check if an output port type can connect to a target input port type.
 * RULES (As requested by user):
 * 1. Chat Model node (outType === 'model'): ONLY connects to AI Agent's Chat Model terminal (inType === 'model')
 * 2. Memory node (outType === 'memory'): ONLY connects to AI Agent's Memory terminal (inType === 'memory')
 * 3. AI Agent's Chat terminal (inType === 'model'): ONLY accepts Chat Model nodes
 * 4. AI Agent's Memory terminal (inType === 'memory'): ONLY accepts Memory nodes
 * 5. AI Agent's Tools terminal (inType === 'tool'): ALL other nodes can connect to tools terminal!
 * 6. Regular In and Out ports: User can freely connect any node's output to any node's input!
 */
export function isPortCompatible(
  outType: string,
  inType: string,
  isTargetOutput: boolean = false
): boolean {
  // Output port cannot connect to another output port
  if (isTargetOutput) return false;

  // 1. Chat Model (Purple):
  // Chat node ka connection sirf AI Agent ke Chat terminal se ho!
  if (outType === 'model' || inType === 'model') {
    return outType === 'model' && inType === 'model';
  }

  // 2. Memory (Amber):
  // Memory node ka connection sirf AI Agent ke Memory terminal se ho!
  if (outType === 'memory' || inType === 'memory') {
    return outType === 'memory' && inType === 'memory';
  }

  // 3. AI Agent Tools Terminal (Green):
  // Baki jitne bhi node hai vo sab tools terminal par connect ho sakte hain!
  if (inType === 'tool') {
    return outType !== 'model' && outType !== 'memory';
  }

  // 4. Output Parser (Pink)
  if (outType === 'outputParser' || inType === 'outputParser') {
    return outType === 'outputParser' && inType === 'outputParser';
  }

  // 5. In aur Out ka connection (Ham apne hisab se connect karenge):
  // Any regular node output can connect to any input freely!
  return outType !== 'model' && outType !== 'memory';
}

export interface ValidationResult {
  valid: boolean;
  errorMessage?: string;
  sourceColor?: string;
  targetColor?: string;
}

/**
 * Validate a connection between two ports with clear Hindi + English error explanation.
 */
export function validateConnection(
  fromNode: WorkflowNodeData,
  fromPort: NodePort | undefined,
  toNode: WorkflowNodeData,
  toPort: NodePort | undefined,
  existingConnections?: WorkflowConnection[]
): ValidationResult {
  // 1. Self connection forbidden
  if (fromNode.id === toNode.id) {
    return {
      valid: false,
      errorMessage: 'Self-connection not allowed / Ek node ko usi se connect nahi kiya ja sakta.',
    };
  }

  const outType = fromPort?.type || getPortTypeFromNode(fromNode, fromPort?.id || '', true);
  const inType = toPort?.type || getPortTypeFromNode(toNode, toPort?.id || '', false);

  const outColorDef = getPortColorDef(outType);
  const inColorDef = getPortColorDef(inType);

  // 2. Chat Model Node / Chat Terminal (Purple)
  // Memory aur chat node ka connection sirf ai agent ke memory aur chat terminal se ho!
  // Ai agent me chat model aur memory par sirf ek hi baar connection bane!
  if (outType === 'model' || inType === 'model') {
    if (outType !== 'model') {
      return {
        valid: false,
        sourceColor: outColorDef.hex,
        targetColor: inColorDef.hex,
        errorMessage: `❌ Invalid Connection: AI Agent ka Chat Model terminal (${inColorDef.name}) sirf Chat Model node (Google Gemini, OpenAI, Claude) se hi connect ho sakta hai.`,
      };
    }
    if (inType !== 'model' || toNode.type !== 'ai_agent') {
      return {
        valid: false,
        sourceColor: outColorDef.hex,
        targetColor: inColorDef.hex,
        errorMessage: `❌ Invalid Connection: Chat Model node (${outColorDef.name}) sirf AI Agent ke Chat Model terminal (${PORT_COLORS.model.name}) par hi connect ho sakta hai!`,
      };
    }
    // Sirf ek hi baar connection ban sakta hai
    if (existingConnections && existingConnections.length > 0) {
      const alreadyConnected = existingConnections.find(
        (c) => c.toNodeId === toNode.id && c.toPortId === 'in_model' && c.fromNodeId !== fromNode.id
      );
      if (alreadyConnected) {
        return {
          valid: false,
          sourceColor: outColorDef.hex,
          targetColor: inColorDef.hex,
          errorMessage: `❌ AI Agent me Chat Model par sirf ek hi baar connection ban sakta hai! Pehle se judhe model ko disconnect karein.`,
        };
      }
    }
    return { valid: true };
  }

  // 3. Memory Node / Memory Terminal (Amber)
  // Memory node ka connection sirf ai agent ke memory terminal se ho!
  // Ai agent me memory par sirf ek hi baar connection bane!
  if (outType === 'memory' || inType === 'memory') {
    if (outType !== 'memory') {
      return {
        valid: false,
        sourceColor: outColorDef.hex,
        targetColor: inColorDef.hex,
        errorMessage: `❌ Invalid Connection: AI Agent ka Memory terminal (${inColorDef.name}) sirf Memory node (Window Buffer Memory) se connect ho sakta hai.`,
      };
    }
    if (inType !== 'memory' || toNode.type !== 'ai_agent') {
      return {
        valid: false,
        sourceColor: outColorDef.hex,
        targetColor: inColorDef.hex,
        errorMessage: `❌ Invalid Connection: Memory node (${outColorDef.name}) sirf AI Agent ke Memory terminal (${PORT_COLORS.memory.name}) par hi connect ho sakta hai!`,
      };
    }
    // Sirf ek hi baar connection ban sakta hai
    if (existingConnections && existingConnections.length > 0) {
      const alreadyConnected = existingConnections.find(
        (c) => c.toNodeId === toNode.id && c.toPortId === 'in_memory' && c.fromNodeId !== fromNode.id
      );
      if (alreadyConnected) {
        return {
          valid: false,
          sourceColor: outColorDef.hex,
          targetColor: inColorDef.hex,
          errorMessage: `❌ AI Agent me Memory par sirf ek hi baar connection ban sakta hai! Pehle se judhi memory ko disconnect karein.`,
        };
      }
    }
    return { valid: true };
  }

  // 4. AI Agent Tools Terminal (Green / in_tools)
  // Baki jitne bhi node hai vo sab tools terminal par hi ho!
  if (toNode.type === 'ai_agent' && (toPort?.id === 'in_tools' || inType === 'tool')) {
    if (outType === 'model' || fromNode.type.startsWith('ai_model_')) {
      return {
        valid: false,
        sourceColor: outColorDef.hex,
        targetColor: inColorDef.hex,
        errorMessage: `❌ Chat Model ko sirf AI Agent ke Chat Model terminal (${PORT_COLORS.model.name}) se connect karein.`,
      };
    }
    if (outType === 'memory' || fromNode.type.startsWith('ai_memory_')) {
      return {
        valid: false,
        sourceColor: outColorDef.hex,
        targetColor: inColorDef.hex,
        errorMessage: `❌ Memory node ko sirf AI Agent ke Memory terminal (${PORT_COLORS.memory.name}) se connect karein.`,
      };
    }
    // Any other node (Calculator, Web Search, Code, Slack, Email, Webhook, HTTP, Sheets, Custom Tool) CAN connect as a tool!
    return { valid: true };
  }

  // 5. In aur Out ka connection (Ham apne hisab se connect karenge):
  // Any node's output can connect to any node's input in the main workflow!
  if (outType === 'model') {
    return {
      valid: false,
      errorMessage: `❌ Chat Model sirf AI Agent ke Chat Model terminal se connect ho sakta hai.`,
    };
  }
  if (outType === 'memory') {
    return {
      valid: false,
      errorMessage: `❌ Memory node sirf AI Agent ke Memory terminal se connect ho sakta hai.`,
    };
  }

  return { valid: true };
}

/**
 * Automatically finds the best compatible pair of ports between two nodes.
 * Used for effortless click-to-connect.
 */
export function findBestCompatiblePorts(
  fromNode: WorkflowNodeData,
  toNode: WorkflowNodeData,
  preferredFromPortId?: string,
  preferredToPortId?: string,
  existingConnections?: WorkflowConnection[]
): { fromPort: NodePort; toPort: NodePort } | null {
  if (fromNode.id === toNode.id) return null;

  const fromPorts = fromNode.outputs || [];
  const toPorts = toNode.inputs || [];

  if (fromPorts.length === 0 || toPorts.length === 0) return null;

  // 1. If preferred fromPort provided
  if (preferredFromPortId) {
    const fPort = fromPorts.find((p) => p.id === preferredFromPortId);
    if (fPort) {
      if (preferredToPortId) {
        const tPort = toPorts.find((p) => p.id === preferredToPortId);
        if (tPort && isPortCompatible(fPort.type, tPort.type)) {
          return { fromPort: fPort, toPort: tPort };
        }
      }
      const match = toPorts.find((t) => isPortCompatible(fPort.type, t.type));
      if (match) return { fromPort: fPort, toPort: match };
    }
  }

  // 2. If preferred toPort provided
  if (preferredToPortId) {
    const tPort = toPorts.find((p) => p.id === preferredToPortId);
    if (tPort) {
      const match = fromPorts.find((f) => isPortCompatible(f.type, tPort.type));
      if (match) return { fromPort: match, toPort: tPort };
    }
  }

  // 3. AI Agent intelligent slot matching (Only 1 connection for model & memory)
  if (toNode.type === 'ai_agent') {
    if (fromNode.type.startsWith('ai_model_')) {
      const alreadyHasModel = existingConnections?.some(
        (c) => c.toNodeId === toNode.id && c.toPortId === 'in_model'
      );
      if (!alreadyHasModel) {
        const modelIn = toPorts.find((p) => p.id === 'in_model');
        if (modelIn) return { fromPort: fromPorts[0], toPort: modelIn };
      }
    }
    if (fromNode.type.startsWith('ai_memory_')) {
      const alreadyHasMemory = existingConnections?.some(
        (c) => c.toNodeId === toNode.id && c.toPortId === 'in_memory'
      );
      if (!alreadyHasMemory) {
        const memIn = toPorts.find((p) => p.id === 'in_memory');
        if (memIn) return { fromPort: fromPorts[0], toPort: memIn };
      }
    }
    if (fromNode.type.startsWith('ai_tool_') || fromNode.category === 'AI Tools') {
      const toolIn = toPorts.find((p) => p.id === 'in_tools');
      if (toolIn) return { fromPort: fromPorts[0], toPort: toolIn };
    }
  }

  // 4. Try main -> main first (most common data flow)
  const mainOut = fromPorts.find((p) => p.id === 'out_main' || p.type === 'main');
  const mainIn = toPorts.find((p) => p.id === 'in_main' || p.type === 'main');
  if (mainOut && mainIn && isPortCompatible(mainOut.type, mainIn.type)) {
    return { fromPort: mainOut, toPort: mainIn };
  }

  // 4. Try any compatible pair
  for (const f of fromPorts) {
    for (const t of toPorts) {
      if (isPortCompatible(f.type, t.type)) {
        return { fromPort: f, toPort: t };
      }
    }
  }

  return null;
}

