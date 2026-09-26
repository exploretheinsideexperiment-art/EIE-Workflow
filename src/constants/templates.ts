import { Workflow } from '../types/workflow';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  workflow: Omit<Workflow, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt' | 'executionCount' | 'lastExecutedAt'>;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'tpl_webhook_ai_email',
    name: 'Webhook → AI Agent → Smart Email Alert',
    description: 'Intercepts incoming webhook payloads, executes Gemini AI analysis with structured entity extraction, and dispatches dynamic email notifications.',
    category: 'AI & Ingestion',
    tags: ['Webhook', 'Gemini AI', 'Email', 'Trending'],
    workflow: {
      name: 'Webhook → AI Agent → Smart Email Alert',
      description: 'Intercepts incoming webhook payloads, executes Gemini AI analysis with structured entity extraction, and dispatches dynamic email notifications.',
      active: true,
      viewport: { x: 80, y: 150, zoom: 0.95 },
      nodes: [
        {
          id: 'n_wh',
          type: 'trigger_webhook',
          name: 'Customer Inbound Webhook',
          category: 'Triggers',
          icon: 'Webhook',
          position: { x: 80, y: 220 },
          inputs: [],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Payload' }],
          config: {
            webhookPath: 'inbound_lead',
            method: 'POST',
            samplePayload: '{\n  "leadName": "Elena Vance",\n  "company": "Quantum Innovations",\n  "requirement": "Enterprise security with SOC2 compliance and 100k API triggers per hour.",\n  "budget": "$15,000/mo"\n}'
          }
        },
        {
          id: 'n_ai',
          type: 'ai_agent',
          name: 'Gemini AI Lead Scorer',
          category: 'AI',
          icon: 'Sparkles',
          position: { x: 440, y: 180 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Analysis' }],
          config: {
            model: 'gemini-3.8-flash',
            systemPrompt: 'You are an enterprise sales qualification AI. Return JSON with leadScore (1-100), urgencyLevel (Critical, High, Medium, Low), and executiveSummary.',
            userPromptTemplate: 'Analyze enterprise lead:\nName: {{$json.leadName}}\nCompany: {{$json.company}}\nRequirement: {{$json.requirement}}\nBudget: {{$json.budget}}',
            temperature: 0.1,
            responseFormat: 'json'
          }
        },
        {
          id: 'n_if',
          type: 'logic_if',
          name: 'High Value Threshold',
          category: 'Logic',
          icon: 'GitBranch',
          position: { x: 800, y: 220 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
          outputs: [
            { id: 'out_true', name: 'true', type: 'true', label: 'Score >= 80' },
            { id: 'out_false', name: 'false', type: 'false', label: 'Standard' }
          ],
          config: {
            fieldPath: 'leadScore',
            operator: '>=',
            value: '80'
          }
        },
        {
          id: 'n_email',
          type: 'comm_email',
          name: 'VIP Sales Executive Alert',
          category: 'Communication',
          icon: 'Mail',
          position: { x: 1140, y: 140 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Sent' }],
          config: {
            to: 'enterprise-sales@eie-workflow.internal',
            subject: '🌟 HIGH VALUE LEAD: {{$node["Customer Inbound Webhook"].json.company}} (Score: {{$json.leadScore}})',
            bodyHtml: '<h3>High Priority Enterprise Inbound</h3><p><strong>Executive Summary:</strong> {{$node["Gemini AI Lead Scorer"].json.executiveSummary}}</p><p><strong>Urgency:</strong> {{$node["Gemini AI Lead Scorer"].json.urgencyLevel}}</p>'
          }
        },
        {
          id: 'n_slack',
          type: 'comm_slack',
          name: 'Standard Lead Channel',
          category: 'Communication',
          icon: 'MessageSquare',
          position: { x: 1140, y: 340 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Posted' }],
          config: {
            channel: '#standard-inbound',
            messageText: 'Standard lead queued: {{$node["Customer Inbound Webhook"].json.company}} - {{$node["Gemini AI Lead Scorer"].json.executiveSummary}}'
          }
        }
      ],
      connections: [
        { id: 'c1', fromNodeId: 'n_wh', fromPortId: 'out_main', toNodeId: 'n_ai', toPortId: 'in_main' },
        { id: 'c2', fromNodeId: 'n_ai', fromPortId: 'out_main', toNodeId: 'n_if', toPortId: 'in_main' },
        { id: 'c3', fromNodeId: 'n_if', fromPortId: 'out_true', toNodeId: 'n_email', toPortId: 'in_main' },
        { id: 'c4', fromNodeId: 'n_if', fromPortId: 'out_false', toNodeId: 'n_slack', toPortId: 'in_main' }
      ]
    }
  },
  {
    id: 'tpl_api_monitor',
    name: 'Scheduled API Health Monitor → Telegram Alert',
    description: 'Polls mission-critical HTTP microservices on a scheduled cadence and pings DevOps via Telegram Bot if uptime checks fail.',
    category: 'DevOps & Reliability',
    tags: ['Schedule', 'HTTP Request', 'IF', 'Telegram'],
    workflow: {
      name: 'Scheduled API Health Monitor → Telegram Alert',
      description: 'Polls mission-critical HTTP microservices on a scheduled cadence and alerts on latency or failure.',
      active: true,
      viewport: { x: 80, y: 150, zoom: 1 },
      nodes: [
        {
          id: 'm_sched',
          type: 'trigger_schedule',
          name: 'Every 5 Minutes',
          category: 'Triggers',
          icon: 'Clock',
          position: { x: 100, y: 200 },
          inputs: [],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Tick' }],
          config: { interval: 'every_5_minutes' }
        },
        {
          id: 'm_http',
          type: 'http_request',
          name: 'Probe API Health',
          category: 'HTTP',
          icon: 'Globe',
          position: { x: 420, y: 200 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Run' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Response' }],
          config: {
            method: 'GET',
            url: 'https://httpbin.org/status/200',
            timeoutMs: 5000
          }
        },
        {
          id: 'm_if',
          type: 'logic_if',
          name: 'Check Status Code',
          category: 'Logic',
          icon: 'GitBranch',
          position: { x: 760, y: 200 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
          outputs: [
            { id: 'out_true', name: 'true', type: 'true', label: 'Healthy (200)' },
            { id: 'out_false', name: 'false', type: 'false', label: 'Outage (!=200)' }
          ],
          config: {
            fieldPath: 'statusCode',
            operator: '==',
            value: '200'
          }
        },
        {
          id: 'm_tg',
          type: 'comm_telegram',
          name: 'Telegram Emergency Alert',
          category: 'Communication',
          icon: 'Send',
          position: { x: 1080, y: 300 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Alert' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Sent' }],
          config: {
            chatId: '@infra_oncall',
            message: '🚨 CRITICAL API OUTAGE: Microservice probe returned status {{$json.statusCode}}! Immediate intervention required.'
          }
        }
      ],
      connections: [
        { id: 'mc1', fromNodeId: 'm_sched', fromPortId: 'out_main', toNodeId: 'm_http', toPortId: 'in_main' },
        { id: 'mc2', fromNodeId: 'm_http', fromPortId: 'out_main', toNodeId: 'm_if', toPortId: 'in_main' },
        { id: 'mc3', fromNodeId: 'm_if', fromPortId: 'out_false', toNodeId: 'm_tg', toPortId: 'in_main' }
      ]
    }
  },
  {
    id: 'tpl_csv_etl',
    name: 'Data Transformation & PostgreSQL Ingestion',
    description: 'Accepts raw tabular data, cleans and normalizes fields via JavaScript sandbox, and commits structured records to PostgreSQL.',
    category: 'Data & ETL',
    tags: ['Data', 'Code (JS)', 'PostgreSQL', 'ETL'],
    workflow: {
      name: 'Data Transformation & PostgreSQL Ingestion',
      description: 'Cleans, normalizes, and enriches data via JavaScript sandbox and commits to database.',
      active: false,
      viewport: { x: 80, y: 150, zoom: 1 },
      nodes: [
        {
          id: 'e_manual',
          type: 'trigger_manual',
          name: 'Manual Ingest Trigger',
          category: 'Triggers',
          icon: 'PlayCircle',
          position: { x: 100, y: 200 },
          inputs: [],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Records' }],
          config: {
            samplePayload: '{\n  "batchId": "b_9918",\n  "rawEmail": "  SARAH.CONNOR@SKYNET.COM  ",\n  "totalSpend": "1420.50"\n}'
          }
        },
        {
          id: 'e_code',
          type: 'data_code',
          name: 'Cleanse & Sanitize',
          category: 'Data',
          icon: 'Code2',
          position: { x: 440, y: 200 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Clean Data' }],
          config: {
            code: 'return {\n  batchId: $json.batchId,\n  normalizedEmail: ($json.rawEmail || "").trim().toLowerCase(),\n  numericSpend: parseFloat($json.totalSpend || 0),\n  isVip: parseFloat($json.totalSpend || 0) > 1000,\n  processedAt: new Date().toISOString()\n};'
          }
        },
        {
          id: 'e_pg',
          type: 'db_postgres',
          name: 'Upsert into PostgreSQL',
          category: 'Database',
          icon: 'Database',
          position: { x: 800, y: 200 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'DB Result' }],
          config: {
            operation: 'INSERT',
            table: 'customer_profiles',
            query: 'INSERT INTO customer_profiles (email, spend, is_vip, ingested_at) VALUES (\'{{$json.normalizedEmail}}\', {{$json.numericSpend}}, {{$json.isVip}}, \'{{$json.processedAt}}\') ON CONFLICT (email) DO UPDATE SET spend = EXCLUDED.spend;'
          }
        }
      ],
      connections: [
        { id: 'ec1', fromNodeId: 'e_manual', fromPortId: 'out_main', toNodeId: 'e_code', toPortId: 'in_main' },
        { id: 'ec2', fromNodeId: 'e_code', fromPortId: 'out_main', toNodeId: 'e_pg', toPortId: 'in_main' }
      ]
    }
  }
];
