import { GoogleGenAI } from '@google/genai';
import { Workflow, WorkflowNodeData, WorkflowConnection } from '../db';
import {
  detectUserLanguage,
  isWorkflowGenerationPrompt,
  synthesizeWorkflowFromPrompt,
} from '../../src/utils/workflowSynthesizer';

export { detectUserLanguage, isWorkflowGenerationPrompt, synthesizeWorkflowFromPrompt };

export interface WorkflowAiResponse {
  action: 'chat' | 'build_workflow' | 'auto_repair';
  reply: string;
  source: 'gemini' | 'local_architect';
  language: 'en' | 'hi';
  builtWorkflow?: {
    name: string;
    description: string;
    nodes: WorkflowNodeData[];
    connections: WorkflowConnection[];
  };
}

/**
 * Main AI Architect Handler
 */
export async function handleEiDoctorChat(
  message: string,
  workflow: Workflow,
  latestExecution: any,
  requestedLanguage?: 'en' | 'hi'
): Promise<WorkflowAiResponse> {
  const lang = requestedLanguage || detectUserLanguage(message);
  const wantsWorkflowBuild = isWorkflowGenerationPrompt(message);
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const nodes = workflow?.nodes || [];
      const connections = workflow?.connections || [];
      const nodeCount = nodes.length;

      const systemInstruction = `You are "Ei-Doctor", the expert AI Workflow Architect and Troubleshooter inside EIE-Workflow (an n8n-style automation platform).

CRITICAL LANGUAGE REQUIREMENT:
The user language is STRICTLY: ${lang === 'en' ? 'ENGLISH' : 'HINDI / HINGLISH'}.
${
  lang === 'en'
    ? 'CRITICAL: You MUST write your entire response 100% in natural, professional English. Never include any Hindi, Hinglish, or Devanagari words under any circumstances.'
    : 'CRITICAL: Aapko apna poora response natural, friendly Hindi / Hinglish me hi dena hai.'
}

TASK MODES:
1. WORKFLOW GENERATION:
If the user is asking to create, build, generate, or automate a workflow (e.g. "build a workflow for...", "create workflow to...", "ek workflow banao jo..."):
You MUST return a JSON object with this EXACT structure:
{
  "action": "build_workflow",
  "reply": "${lang === 'en' ? 'Clear explanation in English of the steps and why they work together' : 'Hindi me explanation jo workflow create kiya gaya hai'}",
  "workflow": {
    "name": "Meaningful Workflow Name",
    "description": "Clear workflow description",
    "nodes": [
      {
        "id": "node_1",
        "name": "Step Name",
        "type": "chat_trigger | chat_message | chat_ai | chat_memory | chat_sentiment | core_edit_fields | core_wait | core_stop_error | core_code | core_datetime | core_crypto | flow_router | flow_split_batches | flow_filter | flow_merge | chain_llm | chain_qa_retrieval | chain_summarize | chain_router | condition_if | condition_switch | condition_validator | condition_rate_limit | trigger_webhook | trigger_schedule | trigger_manual | app_google_sheets | app_gmail | app_slack | ai_agent | http_request",
        "category": "Chat | Core | Flow | Chain | Condition | Triggers | Applications | AI | HTTP",
        "icon": "MessageSquare | Send | Bot | Brain | Cpu | Clock | Edit3 | Terminal | Workflow | Layers | Filter | GitMerge | Sparkles | BookOpen | FileText | GitBranch | Sliders | CheckSquare | Gauge | Webhook | Mail | FileSpreadsheet",
        "position": { "x": 100, "y": 220 },
        "inputs": [{ "id": "in_main", "name": "main", "type": "main" }],
        "outputs": [{ "id": "out_main", "name": "main", "type": "main" }],
        "config": {}
      }
    ],
    "connections": [
      { "id": "c1", "fromNodeId": "node_1", "fromPortId": "out_main", "toNodeId": "node_2", "toPortId": "in_main" }
    ]
  }
}
Note: For triggers (trigger_webhook, trigger_schedule, trigger_manual), inputs MUST be []. Position nodes horizontally starting around x: 100, y: 220, spaced by 280px.

2. TROUBLESHOOTING & GENERAL HELP:
If the user asks a question about fixing an error, why something failed, or how nodes work:
Return JSON:
{
  "action": "chat",
  "reply": "Clear, concise diagnostic advice in ${lang === 'en' ? 'English' : 'Hindi'}"
}

Current Workflow Canvas State:
- Workflow Name: "${workflow?.name || 'Untitled'}"
- Total Nodes: ${nodeCount}
- Nodes: ${nodes.map((n: any) => `${n.name} (${n.type})`).join(', ')}
- Latest Status: ${latestExecution?.status || 'none'}
${latestExecution?.error ? `- Error: ${latestExecution.error}` : ''}

Respond ONLY with valid JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: message }] }],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text?.trim() || '';
      try {
        const parsed = JSON.parse(responseText);
        if (parsed.action === 'build_workflow' && parsed.workflow?.nodes?.length) {
          return {
            action: 'build_workflow',
            reply: parsed.reply || (lang === 'en' ? 'Here is the workflow I created for you.' : 'Yeh raha aapka taiyar workflow.'),
            source: 'gemini',
            language: lang,
            builtWorkflow: {
              name: parsed.workflow.name || 'AI Generated Workflow',
              description: parsed.workflow.description || 'Automated by Ei-Doctor',
              nodes: parsed.workflow.nodes,
              connections: parsed.workflow.connections || [],
            },
          };
        }

        return {
          action: 'chat',
          reply: parsed.reply || responseText,
          source: 'gemini',
          language: lang,
        };
      } catch {
        // If not JSON, return responseText as chat
        return {
          action: 'chat',
          reply: responseText,
          source: 'gemini',
          language: lang,
        };
      }
    } catch (err: any) {
      console.warn('[Ei-Doctor] Gemini call failed, using local architect engine:', err?.message || err);
    }
  }

  // --- LOCAL ARCHITECT FALLBACK ---
  if (wantsWorkflowBuild) {
    const synth = synthesizeWorkflowFromPrompt(message, lang);
    return {
      action: 'build_workflow',
      reply: synth.explanation,
      source: 'local_architect',
      language: lang,
      builtWorkflow: {
        name: synth.name,
        description: synth.description,
        nodes: synth.nodes,
        connections: synth.connections,
      },
    };
  }

  // Contextual Chat Fallback
  const lowerMsg = message.toLowerCase();
  let reply = '';
  const nodeCount = workflow?.nodes?.length || 0;
  const connectionCount = workflow?.connections?.length || 0;

  if (lang === 'en') {
    if (lowerMsg.includes('fix') || lowerMsg.includes('repair') || lowerMsg.includes('solve') || lowerMsg.includes('issue') || lowerMsg.includes('error')) {
      reply = `I have inspected your workflow **"${workflow?.name || 'Workflow'}"**. 
It currently contains ${nodeCount} node(s) and ${connectionCount} connection(s).

You can click the **"⚡ Auto-Fix All Problems"** button below to immediately repair disconnected ports, missing triggers, or incomplete node parameters!`;
    } else if (lowerMsg.includes('model') || lowerMsg.includes('gemini') || lowerMsg.includes('ai agent')) {
      reply = `Autonomous AI Agents require an attached **Chat Model (Purple port)** to function. 
Connect a **Google Gemini 2.5 Flash** model so the agent can reason and formulate answers. Would you like me to auto-connect it for you?`;
    } else if (lowerMsg.includes('test') || lowerMsg.includes('run')) {
      reply = `To test your workflow, click the **"Test Run"** button in the canvas header bar, or test any single node via its hover play icon.`;
    } else {
      reply = `Hello! I am **Ei-Doctor** 🩺, your AI Workflow Doctor and Architect. 
I can diagnose workflow errors, fix broken connections, and automatically build complete workflows from your prompts. 

Try asking: *"Build a workflow for customer support with Webhook and Slack"* or click **"Auto-Fix"**!`;
    }
  } else {
    if (lowerMsg.includes('thik') || lowerMsg.includes('fix') || lowerMsg.includes('galti') || lowerMsg.includes('problem')) {
      reply = `Namaste! Maine aapke workflow **"${workflow?.name || 'Workflow'}"** ka checkup kiya hai.
Isme ${nodeCount} node(s) aur ${connectionCount} connection(s) hain.

Aap niche diye gaye **"⚡ Auto-Fix All Problems"** par click karke sabhi issues ko ek click me turant theek kar sakte hain!`;
    } else if (lowerMsg.includes('model') || lowerMsg.includes('gemini') || lowerMsg.includes('ai agent')) {
      reply = `AI Agent ko execute karne ke liye **Chat Model (Purple port)** ki zaroorat hoti hai. 
Aap **Google Gemini Chat Model** connect karein taaki agent queries samajh sake.`;
    } else {
      reply = `Namaste! Main hoon **Ei-Doctor** 🩺, aapka AI Workflow Doctor aur Architect. 
Main aapke workflow ki galtiya theek kar sakta hoon aur naye prompt se pura workflow automatically build bhi kar sakta hoon. 

Aap mujhse pooch sakte hain: *"Ek naya workflow banao jo Google Sheets se lead padhe aur Gmail bheje"* ya "Auto-Fix" dabayein!`;
    }
  }

  return {
    action: 'chat',
    reply,
    source: 'local_architect',
    language: lang,
  };
}
