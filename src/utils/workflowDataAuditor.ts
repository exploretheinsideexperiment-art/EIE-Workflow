import { Workflow, WorkflowNodeData } from '../types/workflow';

export interface MissingNodeField {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  fieldKey: string;
  fieldLabel: string;
  example: string;
  reason: string;
}

export interface WorkflowAuditResult {
  isComplete: boolean;
  missingFields: MissingNodeField[];
  summary: string;
  promptText: string;
}

/**
 * Returns required configuration fields for any node type in the workflow
 */
export function getRequiredFieldsForNodeType(type: string): Array<{
  key: string;
  label: string;
  example: string;
  reason: string;
  validate: (val: any) => boolean;
}> {
  if (type === 'app_telegram' || type === 'comm_telegram') {
    return [
      {
        key: 'botToken',
        label: 'Telegram Bot Token',
        example: '7123456789:AAFlk_DemoTelegramBotToken_Secure2026',
        reason: 'Required by Telegram Bot API to authenticate your bot',
        validate: (v) => Boolean(v && typeof v === 'string' && v.trim().length > 10),
      },
      {
        key: 'chatId',
        label: 'Telegram Chat ID or @Channel',
        example: '@devops_channel ya 123456789',
        reason: 'The recipient channel or user where messages will be delivered',
        validate: (v) => Boolean(v && typeof v === 'string' && v.trim().length > 0),
      },
    ];
  }

  if (type === 'app_google_sheets') {
    return [
      {
        key: 'spreadsheetId',
        label: 'Google Spreadsheet ID or URL',
        example: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        reason: 'Target Google Sheet containing your data/leads',
        validate: (v) => Boolean(v && typeof v === 'string' && v.trim().length > 15),
      },
      {
        key: 'sheetName',
        label: 'Sheet/Tab Name',
        example: 'Sheet1',
        reason: 'Worksheet tab name inside the spreadsheet',
        validate: (v) => Boolean(v && typeof v === 'string' && v.trim().length > 0),
      },
    ];
  }

  if (type === 'app_gmail' || type === 'comm_email') {
    return [
      {
        key: 'to',
        label: 'Recipient Email Address',
        example: 'client@example.com',
        reason: 'Destination email address for the notification',
        validate: (v) => Boolean(v && typeof v === 'string' && v.includes('@')),
      },
      {
        key: 'subject',
        label: 'Email Subject Line',
        example: 'New Automation Lead Captured',
        reason: 'Subject for the email message',
        validate: (v) => Boolean(v && typeof v === 'string' && v.trim().length > 0),
      },
    ];
  }

  if (type === 'app_slack' || type === 'comm_slack') {
    return [
      {
        key: 'channel',
        label: 'Slack Channel Name',
        example: '#alerts or #general',
        reason: 'Channel where notification messages are posted',
        validate: (v) => Boolean(v && typeof v === 'string' && v.trim().length > 0),
      },
    ];
  }

  if (type === 'http_request') {
    return [
      {
        key: 'url',
        label: 'Endpoint URL',
        example: 'https://api.example.com/v1/webhook',
        reason: 'HTTP URL that this step calls',
        validate: (v) => Boolean(v && typeof v === 'string' && v.startsWith('http')),
      },
    ];
  }

  if (type === 'trigger_webhook') {
    return [
      {
        key: 'webhookPath',
        label: 'Webhook Path Endpoint',
        example: 'inbound_lead',
        reason: 'URL route suffix where external apps POST payload data',
        validate: (v) => Boolean(v && typeof v === 'string' && v.trim().length > 0),
      },
    ];
  }

  if (type === 'trigger_schedule') {
    return [
      {
        key: 'cron',
        label: 'Cron Schedule Interval',
        example: '0 9 * * 1-5 (Every weekday morning)',
        reason: 'Execution timer schedule',
        validate: (v) => Boolean(v && typeof v === 'string' && v.trim().length > 0),
      },
    ];
  }

  if (type === 'ai_agent') {
    return [
      {
        key: 'prompt',
        label: 'Agent Task Goal / Instructions',
        example: 'Analyze incoming customer data and format clean summary',
        reason: 'Instructions that guide the autonomous AI agent',
        validate: (v) => Boolean(v && typeof v === 'string' && v.trim().length > 0),
      },
    ];
  }

  return [];
}

/**
 * Audits workflow nodes for missing mandatory configuration values
 */
export function auditWorkflowDataCompleteness(
  workflow: Workflow,
  lang: 'en' | 'hi' = 'en'
): WorkflowAuditResult {
  const missingFields: MissingNodeField[] = [];
  const nodes = workflow?.nodes || [];
  const isEn = lang === 'en';

  nodes.forEach((node) => {
    const requiredSpecs = getRequiredFieldsForNodeType(node.type);
    const config = node.config || {};

    requiredSpecs.forEach((spec) => {
      const val = config[spec.key];
      const isValid = spec.validate(val);
      if (!isValid) {
        missingFields.push({
          nodeId: node.id,
          nodeName: node.name,
          nodeType: node.type,
          fieldKey: spec.key,
          fieldLabel: spec.label,
          example: spec.example,
          reason: spec.reason,
        });
      }
    });
  });

  const isComplete = missingFields.length === 0;

  let summary = '';
  let promptText = '';

  if (isComplete) {
    summary = isEn
      ? 'All nodes have valid configurations. Ready to run!'
      : 'Sabhi nodes properly configured hain. Real execution ke liye 100% ready!';
    promptText = summary;
  } else {
    // Group missing fields by node
    const grouped: Record<string, { nodeName: string; fields: MissingNodeField[] }> = {};
    missingFields.forEach((m) => {
      if (!grouped[m.nodeId]) {
        grouped[m.nodeId] = { nodeName: m.nodeName, fields: [] };
      }
      grouped[m.nodeId].fields.push(m);
    });

    if (isEn) {
      summary = `Found ${missingFields.length} missing configuration field(s) across ${Object.keys(grouped).length} node(s).`;
      promptText = `I analyzed your workflow. For it to work in real execution, please provide the following required details:\n\n` +
        Object.values(grouped).map((g, idx) => {
          const fieldList = g.fields.map((f) => `• **${f.fieldLabel}** (e.g. \`${f.example}\`)`).join('\n');
          return `${idx + 1}. **${g.nodeName}**:\n${fieldList}`;
        }).join('\n\n') +
        `\n\n👉 **Simply reply with the details right here in chat**, and I will set them into the nodes instantly!\nOr click **"⚡ Fill Demo Data & Test"** to use sample test credentials.`;
    } else {
      summary = `${Object.keys(grouped).length} node(s) me ${missingFields.length} zaroori details missing hain.`;
      promptText = `Maine aapka workflow check kiya. Isko real me chalane ke liye yeh zaroori details chahiye:\n\n` +
        Object.values(grouped).map((g, idx) => {
          const fieldList = g.fields.map((f) => `• **${f.fieldLabel}** (e.g. \`${f.example}\`)`).join('\n');
          return `${idx + 1}. **${g.nodeName}**:\n${fieldList}`;
        }).join('\n\n') +
        `\n\n👉 **Aap ye data mujhe yahi chat me bata dijiye** (e.g. bot token, sheet ID, chat ID), main turant node me set kar dunga!\nYa phir **"⚡ Fill Demo Data & Test"** par click karein taaki dummy credentials se test kiya ja sake.`;
    }
  }

  return {
    isComplete,
    missingFields,
    summary,
    promptText,
  };
}

/**
 * Extracts configuration fields from user text and maps them to appropriate workflow nodes
 */
export function extractNodeConfigFromText(
  text: string,
  workflow: Workflow
): {
  hasUpdates: boolean;
  updatedWorkflow: Workflow;
  appliedUpdates: Array<{ nodeId: string; nodeName: string; key: string; value: any }>;
} {
  const lower = text.toLowerCase();
  const nodes = JSON.parse(JSON.stringify(workflow?.nodes || [])) as WorkflowNodeData[];
  const appliedUpdates: Array<{ nodeId: string; nodeName: string; key: string; value: any }> = [];

  // 1. Telegram Bot Token: matches 123456789:ABC... or "token is/hai ..."
  const directToken = text.match(/\b(\d{5,12}:[A-Za-z0-9_-]{10,})\b/);
  const namedToken = text.match(/(?:bot\s*token|token|bot_token)\s*(?:is|=|:|hai|hain|\s)+\s*([a-zA-Z0-9_:.-]{10,})/i);
  const tokenMatch = directToken || namedToken;

  if (tokenMatch) {
    const tokenVal = tokenMatch[1].trim();
    if (!['hai', 'hain', 'token', 'bot'].includes(tokenVal.toLowerCase())) {
      const tgNode = nodes.find((n) => n.type === 'app_telegram' || n.type === 'comm_telegram');
      if (tgNode) {
        tgNode.config = { ...tgNode.config, botToken: tokenVal };
        appliedUpdates.push({
          nodeId: tgNode.id,
          nodeName: tgNode.name,
          key: 'botToken',
          value: tokenVal,
        });
      }
    }
  }

  // 2. Telegram Chat ID: matches @channel or number id or "chat id is/hai ..."
  const directChat = text.match(/(@[a-zA-Z0-9_]{3,})/);
  const namedChat = text.match(/(?:chat\s*id|chatid|channel|chat_id)\s*(?:is|=|:|hai|hain|\s)+\s*([@a-zA-Z0-9_-]+)/i);
  const chatIdMatch = directChat || namedChat;

  if (chatIdMatch) {
    const chatVal = chatIdMatch[1].trim();
    if (!['hai', 'hain', 'chat', 'id', 'channel'].includes(chatVal.toLowerCase())) {
      const tgNode = nodes.find((n) => n.type === 'app_telegram' || n.type === 'comm_telegram');
      if (tgNode) {
        tgNode.config = { ...tgNode.config, chatId: chatVal };
        appliedUpdates.push({
          nodeId: tgNode.id,
          nodeName: tgNode.name,
          key: 'chatId',
          value: chatVal,
        });
      }
    }
  }

  // 3. Google Spreadsheet ID: matches 44-char alphanumeric or Google Sheet URL
  const sheetUrlMatch = text.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const namedSheet = text.match(/(?:sheet\s*id|spreadsheet\s*id|sheet_id)\s*(?:is|=|:|hai|hain|\s)+\s*([a-zA-Z0-9-_]{15,})/i);
  const directSheet = text.match(/\b(1[a-zA-Z0-9-_]{30,45})\b/);
  const sheetIdMatch = sheetUrlMatch || namedSheet || directSheet;

  if (sheetIdMatch) {
    const sheetVal = sheetIdMatch[1].trim();
    if (!['hai', 'hain', 'sheet', 'id'].includes(sheetVal.toLowerCase())) {
      const sheetsNode = nodes.find((n) => n.type === 'app_google_sheets');
      if (sheetsNode) {
        sheetsNode.config = { ...sheetsNode.config, spreadsheetId: sheetVal };
        appliedUpdates.push({
          nodeId: sheetsNode.id,
          nodeName: sheetsNode.name,
          key: 'spreadsheetId',
          value: sheetVal,
        });
      }
    }
  }

  // 4. Sheet Tab Name: "sheet name is ..." or "tab is ..."
  const sheetNameMatch = text.match(/(?:sheet\s*name|tab\s*name|tab)\s*(?:is|=|:|\s)\s*([a-zA-Z0-9_\s-]+)/i);
  if (sheetNameMatch) {
    const sheetNameVal = sheetNameMatch[1].trim();
    const sheetsNode = nodes.find((n) => n.type === 'app_google_sheets');
    if (sheetsNode && sheetNameVal.length < 30) {
      sheetsNode.config = { ...sheetsNode.config, sheetName: sheetNameVal };
      appliedUpdates.push({
        nodeId: sheetsNode.id,
        nodeName: sheetsNode.name,
        key: 'sheetName',
        value: sheetNameVal,
      });
    }
  }

  // 5. Email: "send to ...", "email: ...", or plain email regex
  const emailMatch =
    text.match(/(?:email|to|recipient)\s*(?:is|=|:|\s)\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i) ||
    text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

  if (emailMatch) {
    const emailVal = emailMatch[1].trim();
    const emailNode = nodes.find((n) => n.type === 'app_gmail' || n.type === 'comm_email');
    if (emailNode) {
      emailNode.config = { ...emailNode.config, to: emailVal };
      appliedUpdates.push({
        nodeId: emailNode.id,
        nodeName: emailNode.name,
        key: 'to',
        value: emailVal,
      });
    }
  }

  // 6. Slack Channel: "#channel" or "slack channel is ..."
  const slackMatch =
    text.match(/(?:slack\s*channel|channel)\s*(?:is|=|:|\s)\s*(#[a-zA-Z0-9_-]+)/i) ||
    text.match(/(#[a-zA-Z0-9_-]{3,})/);

  if (slackMatch) {
    const channelVal = slackMatch[1].trim();
    const slackNode = nodes.find((n) => n.type === 'app_slack' || n.type === 'comm_slack');
    if (slackNode) {
      slackNode.config = { ...slackNode.config, channel: channelVal };
      appliedUpdates.push({
        nodeId: slackNode.id,
        nodeName: slackNode.name,
        key: 'channel',
        value: channelVal,
      });
    }
  }

  // 7. Webhook Path: "webhook path is ..." or "path: ..."
  const pathMatch = text.match(/(?:webhook\s*path|path|route)\s*(?:is|=|:|\s)\s*([a-zA-Z0-9_-]+)/i);
  if (pathMatch) {
    const pathVal = pathMatch[1].trim();
    const whNode = nodes.find((n) => n.type === 'trigger_webhook');
    if (whNode && pathVal !== 'path' && pathVal !== 'webhook') {
      whNode.config = { ...whNode.config, webhookPath: pathVal };
      appliedUpdates.push({
        nodeId: whNode.id,
        nodeName: whNode.name,
        key: 'webhookPath',
        value: pathVal,
      });
    }
  }

  // 8. HTTP URL: "url is ..." or http(s) regex
  const urlMatch = text.match(/(https?:\/\/[^\s"',]+)/i);
  if (urlMatch) {
    const urlVal = urlMatch[1].trim();
    const httpNode = nodes.find((n) => n.type === 'http_request');
    if (httpNode) {
      httpNode.config = { ...httpNode.config, url: urlVal };
      appliedUpdates.push({
        nodeId: httpNode.id,
        nodeName: httpNode.name,
        key: 'url',
        value: urlVal,
      });
    }
  }

  return {
    hasUpdates: appliedUpdates.length > 0,
    updatedWorkflow: {
      ...workflow,
      nodes,
    },
    appliedUpdates,
  };
}

/**
 * Populates realistic, working demo credentials for all unconfigured nodes
 */
export function fillDemoDataForWorkflow(
  workflow: Workflow,
  userEmail: string = 'exploretheinsideexperiment@gmail.com'
): { updatedWorkflow: Workflow; filledCount: number; summary: string[] } {
  const nodes = JSON.parse(JSON.stringify(workflow?.nodes || [])) as WorkflowNodeData[];
  const summary: string[] = [];
  let filledCount = 0;

  nodes.forEach((node) => {
    node.config = node.config || {};

    if (node.type === 'app_telegram' || node.type === 'comm_telegram') {
      if (!node.config.botToken || node.config.botToken.length < 5) {
        node.config.botToken = '7891234560:AAFlk_DemoTelegramBotToken_Secure2026';
        summary.push(`Telegram "${node.name}": Set Demo Bot Token`);
        filledCount++;
      }
      if (!node.config.chatId || node.config.chatId === '') {
        node.config.chatId = '@devops_alerts_demo';
        summary.push(`Telegram "${node.name}": Set Chat ID (@devops_alerts_demo)`);
        filledCount++;
      }
    } else if (node.type === 'app_google_sheets') {
      if (!node.config.spreadsheetId || node.config.spreadsheetId.length < 10) {
        node.config.spreadsheetId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
        node.config.sheetName = node.config.sheetName || 'Sheet1';
        node.config.operation = node.config.operation || 'readRows';
        summary.push(`Google Sheets "${node.name}": Configured Customer Leads Demo Spreadsheet`);
        filledCount++;
      }
    } else if (node.type === 'app_gmail' || node.type === 'comm_email') {
      if (!node.config.to || !node.config.to.includes('@')) {
        node.config.to = userEmail;
        node.config.subject = node.config.subject || 'Automated Workflow Alert: Trigger Executed';
        summary.push(`Email "${node.name}": Set Recipient (${userEmail})`);
        filledCount++;
      }
    } else if (node.type === 'app_slack' || node.type === 'comm_slack') {
      if (!node.config.channel) {
        node.config.channel = '#alerts-general';
        node.config.botToken = node.config.botToken || 'xoxb-demo-automation-token-12345';
        summary.push(`Slack "${node.name}": Set Channel (#alerts-general)`);
        filledCount++;
      }
    } else if (node.type === 'http_request') {
      if (!node.config.url) {
        node.config.url = 'https://httpbin.org/get';
        node.config.method = node.config.method || 'GET';
        summary.push(`HTTP Request "${node.name}": Set Test API URL (httpbin.org)`);
        filledCount++;
      }
    } else if (node.type === 'trigger_webhook') {
      if (!node.config.webhookPath) {
        node.config.webhookPath = 'inbound_lead';
        summary.push(`Webhook "${node.name}": Set Path (/api/webhook/inbound_lead)`);
        filledCount++;
      }
    } else if (node.type === 'trigger_schedule') {
      if (!node.config.cron) {
        node.config.cron = '0 9 * * 1-5';
        summary.push(`Schedule "${node.name}": Set Cron (0 9 * * 1-5, Weekdays 9 AM)`);
        filledCount++;
      }
    } else if (node.type === 'ai_agent') {
      if (!node.config.prompt) {
        node.config.prompt = 'Analyze incoming event payload, summarize priority customer data, and prepare Markdown formatted output.';
        summary.push(`AI Agent "${node.name}": Set System Task Prompt`);
        filledCount++;
      }
    }
  });

  return {
    updatedWorkflow: {
      ...workflow,
      nodes,
    },
    filledCount,
    summary,
  };
}
