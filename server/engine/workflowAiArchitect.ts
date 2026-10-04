import { GoogleGenAI } from '@google/genai';
import { Workflow, WorkflowNodeData, WorkflowConnection } from '../../src/types/workflow';
import {
  detectUserLanguage,
  isWorkflowGenerationPrompt,
  synthesizeWorkflowFromPrompt,
} from '../../src/utils/workflowSynthesizer';
import { autoRepairWorkflow } from '../../src/utils/workflowDoctor';
import {
  auditWorkflowDataCompleteness,
  extractNodeConfigFromText,
  fillDemoDataForWorkflow,
} from '../../src/utils/workflowDataAuditor';

export { detectUserLanguage, isWorkflowGenerationPrompt, synthesizeWorkflowFromPrompt };

export interface WorkflowAiResponse {
  action: 'chat' | 'build_workflow' | 'auto_repair' | 'update_node_config';
  reply: string;
  source: 'gemini' | 'local_architect';
  language: 'en' | 'hi';
  builtWorkflow?: {
    name: string;
    description: string;
    nodes: WorkflowNodeData[];
    connections: WorkflowConnection[];
  };
  nodeUpdates?: Array<{
    nodeId?: string;
    nodeType?: string;
    nodeName?: string;
    configUpdates: Record<string, any>;
  }>;
  actions?: Array<{
    label: string;
    actionType: 'auto_fix' | 'test_run' | 'apply_workflow' | 'create_new_workflow' | 'fill_demo_data';
  }>;
}

export interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

/**
 * Intelligent AI Fixer Architect & Troubleshooter Engine
 */
export async function handleEiDoctorChat(
  message: string,
  workflow: Workflow,
  latestExecution: any,
  requestedLanguage?: 'en' | 'hi',
  history?: ChatHistoryItem[]
): Promise<WorkflowAiResponse> {
  const lang = requestedLanguage || detectUserLanguage(message);
  const lowerMsg = (message || '').trim().toLowerCase();
  const isEn = lang === 'en';

  // 1. Explicit Auto-Repair Command ONLY (do NOT trap normal conversation or questions!)
  const isExplicitRepairCommand =
    lowerMsg === 'auto_fix' ||
    lowerMsg === 'auto fix' ||
    lowerMsg === 'repair all' ||
    lowerMsg === 'fix all issues' ||
    lowerMsg === 'sare issue thik kar do' ||
    lowerMsg === 'sabhi issues thik karo';

  if (isExplicitRepairCommand) {
    const { fixedWorkflow, fixesApplied } = autoRepairWorkflow(workflow as any, latestExecution, lang);
    const fixesText = fixesApplied.length > 0
      ? fixesApplied.map((f) => `• ${f}`).join('\n')
      : (isEn ? '• Validated all node ports, connections, and configurations.' : '• Sabhi node ports, connections aur parameters verify kar diye gaye.');

    const reply = isEn
      ? `🤖 **AI Fixer Auto-Repair Completed!**\n\nI have resolved the structural issues in your workflow:\n${fixesText}\n\n✨ Connections and structures are aligned. Next, provide any required credentials or click **Test Run**!`
      : `🤖 **AI Fixer Auto-Repair Complete!**\n\nMaine aapke workflow ke structural issues solve kar diye hain:\n${fixesText}\n\n✨ Connections aur layout sahi kar diye gaye hain.`;

    return {
      action: 'auto_repair',
      reply,
      source: 'local_architect',
      language: lang,
      builtWorkflow: {
        name: fixedWorkflow.name,
        description: fixedWorkflow.description,
        nodes: fixedWorkflow.nodes,
        connections: fixedWorkflow.connections,
      },
      actions: [
        { label: isEn ? '⚡ Fill Demo Data & Test' : '⚡ Fill Demo Data & Test', actionType: 'fill_demo_data' },
        { label: isEn ? '🧪 Test Run Workflow' : '🧪 Test Run Workflow', actionType: 'test_run' },
      ],
    };
  }

  // 2. Explicit Demo Data Fill Request
  const wantsDemoData =
    lowerMsg.includes('demo data') ||
    lowerMsg.includes('dummy data') ||
    lowerMsg.includes('test credential') ||
    lowerMsg.includes('sample data') ||
    lowerMsg.includes('dummy credential') ||
    lowerMsg.includes('demo credentials');

  if (wantsDemoData) {
    const { updatedWorkflow, filledCount, summary } = fillDemoDataForWorkflow(workflow);
    const reply = isEn
      ? `✓ **Demo & Test Data Successfully Configured!**\n\nI populated working demo configurations across ${filledCount} field(s):\n${summary.map((s) => `• ${s}`).join('\n')}\n\n🎉 Your workflow is now fully prepared to execute end-to-end. Click **"Test Run"** below to see it run live!`
      : `✓ **Demo & Test Data Successfully Set Ho Gaya!**\n\nMaine ${filledCount} fields me working test configurations bhar diye hain:\n${summary.map((s) => `• ${s}`).join('\n')}\n\n🎉 Ab aapka workflow real me execute hone ke liye 100% ready hai. Neeche **"Test Run"** par click karein aur live execution dekhein!`;

    return {
      action: 'update_node_config',
      reply,
      source: 'local_architect',
      language: lang,
      builtWorkflow: {
        name: updatedWorkflow.name,
        description: updatedWorkflow.description,
        nodes: updatedWorkflow.nodes,
        connections: updatedWorkflow.connections,
      },
      actions: [{ label: isEn ? '🧪 Test Run Workflow Now' : '🧪 Test Run Workflow Now', actionType: 'test_run' }],
    };
  }

  // 3. Check for Direct Parameter Assignment via Regex / Natural Language
  const localExtract = extractNodeConfigFromText(message, workflow);
  if (localExtract.hasUpdates) {
    const audit = auditWorkflowDataCompleteness(localExtract.updatedWorkflow, lang);
    const updateSummary = localExtract.appliedUpdates
      .map((u) => `• **${u.nodeName}**: \`${u.key}\` = "${u.value}"`)
      .join('\n');

    let reply = '';
    if (isEn) {
      reply = `✓ **Node Configuration Updated!**\n\nI have saved your parameters directly into the nodes:\n${updateSummary}\n\n`;
      if (audit.isComplete) {
        reply += `✨ **All required fields are now complete!** Your workflow is 100% configured for real execution. Click **"Test Run Workflow Now"** to test it live!`;
      } else {
        reply += audit.promptText;
      }
    } else {
      reply = `✓ **Node Configurations Update Ho Gaye!**\n\nMaine aapka data nodes me save kar diya hai:\n${updateSummary}\n\n`;
      if (audit.isComplete) {
        reply += `✨ **Sabhi required details ab complete hain!** Workflow real execution ke liye bilkul ready hai. Neeche **"Test Run"** par click karke test karein!`;
      } else {
        reply += audit.promptText;
      }
    }

    return {
      action: 'update_node_config',
      reply,
      source: 'local_architect',
      language: lang,
      builtWorkflow: {
        name: localExtract.updatedWorkflow.name,
        description: localExtract.updatedWorkflow.description,
        nodes: localExtract.updatedWorkflow.nodes,
        connections: localExtract.updatedWorkflow.connections,
      },
      actions: audit.isComplete
        ? [{ label: isEn ? '🧪 Test Run Workflow Now' : '🧪 Test Run Workflow Now', actionType: 'test_run' }]
        : [
            { label: isEn ? '⚡ Fill Remaining Demo Data' : '⚡ Fill Remaining Demo Data', actionType: 'fill_demo_data' },
            { label: isEn ? '🧪 Test Run Workflow' : '🧪 Test Run Workflow', actionType: 'test_run' },
          ],
    };
  }

  // 4. Missing Data Audit Check Query (e.g. "kya kami hai?", "check workflow", "kya data chahiye?")
  const wantsAudit =
    lowerMsg.includes('kya kami') ||
    lowerMsg.includes('kya missing') ||
    lowerMsg.includes('kya data chahiye') ||
    lowerMsg.includes('check workflow') ||
    lowerMsg.includes('kya kami hai') ||
    lowerMsg.includes('is it ready') ||
    lowerMsg.includes('ready to run') ||
    lowerMsg.includes('kya yeh chalega');

  if (wantsAudit) {
    const audit = auditWorkflowDataCompleteness(workflow, lang);
    return {
      action: 'chat',
      reply: audit.promptText,
      source: 'local_architect',
      language: lang,
      actions: audit.isComplete
        ? [{ label: isEn ? '🧪 Test Run Workflow Now' : '🧪 Test Run Workflow Now', actionType: 'test_run' }]
        : [
            { label: isEn ? '⚡ Fill Demo Data & Test' : '⚡ Fill Demo Data & Test', actionType: 'fill_demo_data' },
            { label: isEn ? '🧪 Test Run Workflow' : '🧪 Test Run Workflow', actionType: 'test_run' },
          ],
    };
  }

  // 5. Intelligent Gemini Orchestration
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

    for (const modelName of modelsToTry) {
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
        const audit = auditWorkflowDataCompleteness(workflow, lang);

        const systemInstruction = `You are "AI Fixer", the expert Autonomous Humanoid Robot Workflow Architect & Troubleshooter inside EIE-Workflow (an advanced n8n-style automation platform).

YOUR MISSION:
1. Provide accurate, intelligent, direct answers to the user's questions without canned repetition. Never repeat generic welcome boilerplate greetings.
2. When the user asks you to build or generate a workflow:
   - Synthesize a complete, logical, connected workflow.
   - AND explicitly identify what specific real data is required by the created nodes (e.g. Telegram Bot Token/Chat ID, Google Sheets ID, recipient email, etc.) and politely ask the user to provide that data right in the chat!
3. When the user provides configuration details or credentials (e.g. "my bot token is...", "sheet id: ...", "email: ...", "chat id: ..."):
   - Extract the parameters and specify which nodes they apply to via "nodeUpdates".
   - Confirm to the user that their data has been saved and the node is configured.
4. When the user asks what is missing in the workflow or asks for troubleshooting:
   - Identify real missing data fields or connection issues and give actionable, specific guidance.

LANGUAGE GUIDELINES:
- User Language: ${isEn ? 'ENGLISH' : 'HINDI / HINGLISH'}
- ${
  isEn
    ? 'CRITICAL: Respond 100% in natural, professional English. Do not include Hindi.'
    : 'CRITICAL: User ne Hindi/Hinglish me poocha hai. Aapko apna poora answer natural, friendly Hindi/Hinglish me hi dena hai. Sawal ka seedha aur behtareen jawab dein.'
}

CURRENT CANVAS WORKFLOW STATE:
- Workflow Name: "${workflow?.name || 'Untitled'}"
- Total Nodes: ${nodes.length}
- Current Nodes: ${nodes.map((n) => `[ID: ${n.id}, Name: "${n.name}", Type: "${n.type}", Config: ${JSON.stringify(n.config || {})}]`).join('; ')}
- Missing Required Fields: ${audit.missingFields.length > 0 ? JSON.stringify(audit.missingFields) : 'None (100% complete)'}
- Latest Execution Status: ${latestExecution?.status || 'none'}
${latestExecution?.error ? `- Latest Error: ${latestExecution.error}` : ''}

RESPONSE FORMAT:
You MUST respond ONLY with a single valid JSON object adhering to this schema:
{
  "action": "chat" | "build_workflow" | "update_node_config",
  "reply": "Your friendly, comprehensive markdown explanation and direct answer to the user.",
  "workflow": {
    "name": "Workflow Name",
    "description": "Workflow Description",
    "nodes": [
      {
        "id": "node_1",
        "name": "Step Name",
        "type": "trigger_webhook | trigger_schedule | app_google_sheets | app_telegram | app_gmail | app_slack | ai_agent | ai_model_gemini | http_request | logic_if",
        "category": "Triggers | Applications | AI | Core | Logic",
        "icon": "Webhook | Clock | FileSpreadsheet | Send | Mail | Bot | Cpu | Globe | GitBranch",
        "position": { "x": 100, "y": 220 },
        "inputs": [],
        "outputs": [{ "id": "out_main", "name": "main", "type": "main" }],
        "config": {}
      }
    ],
    "connections": [
      { "id": "c1", "fromNodeId": "node_1", "fromPortId": "out_main", "toNodeId": "node_2", "toPortId": "in_main" }
    ]
  },
  "nodeUpdates": [
    {
      "nodeId": "node_id_here",
      "nodeType": "app_telegram",
      "configUpdates": { "botToken": "value", "chatId": "value" }
    }
  ],
  "actions": [
    { "label": "🧪 Test Run Workflow Now", "actionType": "test_run" }
  ]
}

DO NOT wrap with markdown code blocks. Return raw JSON.`;

        // Format conversational history
        const formattedContents: any[] = [];
        if (history && Array.isArray(history)) {
          history.slice(-8).forEach((h) => {
            if (h.text && h.text.trim()) {
              formattedContents.push({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.text }],
              });
            }
          });
        }

        formattedContents.push({
          role: 'user',
          parts: [{ text: message }],
        });

        const response = await ai.models.generateContent({
          model: modelName,
          contents: formattedContents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.25,
          },
        });

        const responseText = response.text?.trim() || '';
        const parsed = JSON.parse(responseText);

        if (parsed.action === 'build_workflow' && parsed.workflow?.nodes?.length) {
          // Check if newly built workflow needs data
          const tempWf: Workflow = {
            ...workflow,
            name: parsed.workflow.name || 'AI Generated Workflow',
            description: parsed.workflow.description || '',
            nodes: parsed.workflow.nodes,
            connections: parsed.workflow.connections || [],
          };
          const builtAudit = auditWorkflowDataCompleteness(tempWf, lang);

          let reply = parsed.reply;
          if (!builtAudit.isComplete && !reply.includes('Telegram') && !reply.includes('Sheet')) {
            reply += `\n\n${builtAudit.promptText}`;
          }

          return {
            action: 'build_workflow',
            reply,
            source: 'gemini',
            language: lang,
            builtWorkflow: {
              name: tempWf.name,
              description: tempWf.description,
              nodes: tempWf.nodes,
              connections: tempWf.connections,
            },
            actions: [
              { label: isEn ? '⚡ Fill Demo Data & Test' : '⚡ Fill Demo Data & Test', actionType: 'fill_demo_data' },
              { label: isEn ? '🧪 Test Run Workflow' : '🧪 Test Run Workflow', actionType: 'test_run' },
            ],
          };
        }

        if (parsed.action === 'update_node_config' && Array.isArray(parsed.nodeUpdates) && parsed.nodeUpdates.length > 0) {
          // Merge updates into workflow
          const updatedNodes = JSON.parse(JSON.stringify(nodes)) as WorkflowNodeData[];
          parsed.nodeUpdates.forEach((up: any) => {
            const target = updatedNodes.find((n) => n.id === up.nodeId || n.type === up.nodeType);
            if (target && up.configUpdates) {
              target.config = { ...target.config, ...up.configUpdates };
            }
          });

          return {
            action: 'update_node_config',
            reply: parsed.reply || (isEn ? 'Node configurations updated successfully!' : 'Node configurations update ho gaye!'),
            source: 'gemini',
            language: lang,
            builtWorkflow: {
              name: workflow.name,
              description: workflow.description,
              nodes: updatedNodes,
              connections: workflow.connections,
            },
            nodeUpdates: parsed.nodeUpdates,
            actions: [{ label: isEn ? '🧪 Test Run Workflow Now' : '🧪 Test Run Workflow Now', actionType: 'test_run' }],
          };
        }

        // Standard direct answer to the user's question
        return {
          action: 'chat',
          reply: parsed.reply || responseText,
          source: 'gemini',
          language: lang,
          actions: parsed.actions || [
            { label: isEn ? '⚡ Fill Demo Data & Test' : '⚡ Fill Demo Data & Test', actionType: 'fill_demo_data' },
            { label: isEn ? '🧪 Test Run Workflow' : '🧪 Test Run Workflow', actionType: 'test_run' },
          ],
        };
      } catch (geminiErr: any) {
        console.warn(`[AI Fixer] Attempt with ${modelName} encountered issue:`, geminiErr?.message || geminiErr);
        // Continue to next fallback model
      }
    }
  }

  // 6. Context-Aware Local Fallback (Guaranteed zero static boilerplate repetition)
  if (isWorkflowGenerationPrompt(message)) {
    const synth = synthesizeWorkflowFromPrompt(message, lang);
    const tempWf: Workflow = {
      ...workflow,
      name: synth.name,
      description: synth.description,
      nodes: synth.nodes,
      connections: synth.connections,
    };
    const audit = auditWorkflowDataCompleteness(tempWf, lang);

    let reply = synth.explanation;
    if (!audit.isComplete) {
      reply += `\n\n${audit.promptText}`;
    }

    return {
      action: 'build_workflow',
      reply,
      source: 'local_architect',
      language: lang,
      builtWorkflow: {
        name: synth.name,
        description: synth.description,
        nodes: synth.nodes,
        connections: synth.connections,
      },
      actions: [
        { label: isEn ? '⚡ Fill Demo Data & Test' : '⚡ Fill Demo Data & Test', actionType: 'fill_demo_data' },
        { label: isEn ? '🧪 Test Run Workflow' : '🧪 Test Run Workflow', actionType: 'test_run' },
      ],
    };
  }

  // Contextual answer based on specific keywords and current workflow
  let reply = '';
  const nodeCount = workflow?.nodes?.length || 0;

  if (isEn) {
    if (lowerMsg.includes('telegram') || lowerMsg.includes('bot token')) {
      reply = `To configure Telegram for real messages:\n1. Open Telegram and search for **@BotFather**.\n2. Send \`/newbot\` to get your **Bot Token**.\n3. Add your bot to your channel or message it directly, and provide the **Chat ID** (e.g. \`@your_channel\`).\n\n👉 **You can paste your token & chat ID right here in this chat**, and I will set it up for you!`;
    } else if (lowerMsg.includes('sheet') || lowerMsg.includes('google sheet')) {
      reply = `To configure Google Sheets:\n1. Open your Google Sheet in browser.\n2. Copy the **Spreadsheet ID** from the URL (the long string between \`/d/\` and \`/edit\`).\n3. Provide the Tab/Sheet name (e.g. \`Sheet1\`).\n\n👉 **Paste the Sheet ID or URL right here**, and I will configure the node for you!`;
    } else if (lowerMsg.includes('repeat') || lowerMsg.includes('same')) {
      reply = `Understood! I will answer your questions directly and contextually without repeating past messages. Feel free to ask anything about nodes, triggers, API connections, or configuration values!`;
    } else {
      reply = `I am reviewing your workflow "${workflow.name}" with ${nodeCount} active node(s). Ask me to configure any node, build new steps, or test execution!`;
    }
  } else {
    if (lowerMsg.includes('telegram') || lowerMsg.includes('bot token') || lowerMsg.includes('token')) {
      reply = `Telegram node ko real me chalane ke liye 2 cheezein chahiye:\n1. **Bot Token**: Telegram par **@BotFather** se \`/newbot\` karke token milta hai.\n2. **Chat ID**: Jis channel ya group me message bhejna hai uska ID (jaise \`@my_channel\` ya \`123456789\`).\n\n👉 **Aap apna Token aur Chat ID yahi chat me likh kar bhej dijiye**, main turant node me configure kar dunga!`;
    } else if (lowerMsg.includes('sheet') || lowerMsg.includes('google sheet') || lowerMsg.includes('excel')) {
      reply = `Google Sheets node configure karne ke liye:\n1. Sheet ke URL me se \`/d/\` aur \`/edit\` ke beech ka **Spreadsheet ID** copy karein.\n2. Tab ka naam confirm karein (jaise \`Sheet1\`).\n\n👉 **Aap yahi chat me Sheet ID likhiye**, main turant node me save kar dunga!`;
    } else if (lowerMsg.includes('repeat') || lowerMsg.includes('baar baar') || lowerMsg.includes('ek baat') || lowerMsg.includes('dobara')) {
      reply = `Ji bilkul! Maine repeat karna band kar diya hai. Ab se main aapke har sawal ka direct, accurate aur fresh jawab doonga. Aap mujhse koi bhi sawal pooch sakte hain ya workflow banane aur configure karne ko kah sakte hain!`;
    } else {
      reply = `Maine aapka workflow "${workflow.name}" inspect kiya hai jisme ${nodeCount} node(s) hain. Aap mujhse kisi bhi node ka data set karne ko kahein, naya workflow banwayein ya test run karein!`;
    }
  }

  return {
    action: 'chat',
    reply,
    source: 'local_architect',
    language: lang,
    actions: [
      { label: isEn ? '⚡ Fill Demo Data & Test' : '⚡ Fill Demo Data & Test', actionType: 'fill_demo_data' },
      { label: isEn ? '🧪 Test Run Workflow' : '🧪 Test Run Workflow', actionType: 'test_run' },
    ],
  };
}
