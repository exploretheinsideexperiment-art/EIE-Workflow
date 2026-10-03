import { WorkflowNodeData, NodePort } from '../types/workflow';

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
      if (portId === 'in_tools') return 'tool';
      return 'main';
    }
    return 'main';
  }
}

/**
 * Check if an output port type can connect to a target input port type.
 * STRICT ENFORCEMENT:
 * - Model (purple) -> Model input only
 * - Memory (amber) -> Memory input only
 * - Tool (green) -> Tool input only
 * - Main/Data/Condition (cyan/green/rose) -> Main input only
 */
export function isPortCompatible(
  outType: string,
  inType: string,
  isTargetOutput: boolean = false
): boolean {
  // Output port cannot connect to another output port
  if (isTargetOutput) return false;

  // 1. Model (Purple)
  if (outType === 'model' || inType === 'model') {
    return outType === 'model' && inType === 'model';
  }

  // 2. Memory (Amber)
  if (outType === 'memory' || inType === 'memory') {
    return outType === 'memory' && inType === 'memory';
  }

  // 3. Tool (Green)
  if (outType === 'tool' || inType === 'tool') {
    return outType === 'tool' && inType === 'tool';
  }

  // 4. Output Parser (Pink)
  if (outType === 'outputParser' || inType === 'outputParser') {
    return outType === 'outputParser' && inType === 'outputParser';
  }

  // 5. Data Flow (Cyan, True/False, Branch) -> Main input
  const isDataOut = ['main', 'true', 'false', 'branch'].includes(outType);
  const isDataIn = inType === 'main';

  return isDataOut && isDataIn;
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
  toPort: NodePort | undefined
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

  // 2. AI Model (Purple)
  if (outType === 'model' || inType === 'model') {
    if (outType !== 'model') {
      return {
        valid: false,
        sourceColor: outColorDef.hex,
        targetColor: inColorDef.hex,
        errorMessage: `❌ Invalid Connection: AI Agent ka Chat Model port (${inColorDef.name}) sirf AI Model node (Gemini/OpenAI/Claude) se connect ho sakta hai. Aap "${outColorDef.name}" connect kar rahe hain.`,
      };
    }
    if (inType !== 'model') {
      return {
        valid: false,
        sourceColor: outColorDef.hex,
        targetColor: inColorDef.hex,
        errorMessage: `❌ Invalid Connection: AI Model (${outColorDef.name}) sirf AI Agent ke Chat Model port (${PORT_COLORS.model.name}) par hi connect ho sakta hai!`,
      };
    }
    return { valid: true };
  }

  // 3. AI Memory (Amber)
  if (outType === 'memory' || inType === 'memory') {
    if (outType !== 'memory') {
      return {
        valid: false,
        sourceColor: outColorDef.hex,
        targetColor: inColorDef.hex,
        errorMessage: `❌ Invalid Connection: AI Agent ka Memory port (${inColorDef.name}) sirf Memory node (Window Buffer / Redis) se connect ho sakta hai. Aap "${outColorDef.name}" connect kar rahe hain.`,
      };
    }
    if (inType !== 'memory') {
      return {
        valid: false,
        sourceColor: outColorDef.hex,
        targetColor: inColorDef.hex,
        errorMessage: `❌ Invalid Connection: Memory node (${outColorDef.name}) sirf AI Agent ke Memory port (${PORT_COLORS.memory.name}) par hi connect ho sakta hai!`,
      };
    }
    return { valid: true };
  }

  // 4. AI Tool (Green)
  if (outType === 'tool' || inType === 'tool') {
    if (outType !== 'tool') {
      return {
        valid: false,
        sourceColor: outColorDef.hex,
        targetColor: inColorDef.hex,
        errorMessage: `❌ Invalid Connection: AI Agent ka Tools port (${inColorDef.name}) sirf Agent Tools (Calculator/Search/HTTP/Code) se connect ho sakta hai. Aap "${outColorDef.name}" connect kar rahe hain.`,
      };
    }
    if (inType !== 'tool') {
      return {
        valid: false,
        sourceColor: outColorDef.hex,
        targetColor: inColorDef.hex,
        errorMessage: `❌ Invalid Connection: Agent Tool (${outColorDef.name}) sirf AI Agent ke Tools port (${PORT_COLORS.tool.name}) par hi connect ho sakta hai!`,
      };
    }
    return { valid: true };
  }

  // 5. Output parser
  if (outType === 'outputParser' || inType === 'outputParser') {
    if (outType !== inType) {
      return {
        valid: false,
        errorMessage: '❌ Invalid Connection: Output Parser ports must match!',
      };
    }
    return { valid: true };
  }

  // 6. Data Flow ports (Cyan / True / False) -> Main input
  const isDataOut = ['main', 'true', 'false', 'branch'].includes(outType);
  const isDataIn = inType === 'main';

  if (!isDataOut || !isDataIn) {
    return {
      valid: false,
      sourceColor: outColorDef.hex,
      targetColor: inColorDef.hex,
      errorMessage: `❌ Port Type Mismatch: "${outColorDef.name}" port cannot connect to "${inColorDef.name}" port. Port color & type must match!`,
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
  preferredToPortId?: string
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

  // 3. Try main -> main first (most common data flow)
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

