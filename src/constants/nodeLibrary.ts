import { NodeDefinition, NodeCategory } from '../types/workflow';

export const CATEGORIES: NodeCategory[] = [
  'All Applications',
  'Triggers',
  'Chat',
  'Core',
  'Flow',
  'Chain',
  'Condition',
  'AI',
  'AI Tools',
  'Communication',
  'Database',
  'HTTP',
  'Logic',
  'Data',
  'Files',
  'Developer',
  'Utilities'
];

export const NODE_LIBRARY: NodeDefinition[] = [
  // ==========================================
  // 1. ALL APPLICATIONS (n8n Style)
  // ==========================================
  {
    type: 'app_google_sheets',
    name: 'Google Sheets',
    description: 'Read rows, append new records, update values, or query spreadsheet tables.',
    category: 'Applications',
    icon: 'FileSpreadsheet',
    accentColor: '#0F9D58',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input Data' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Sheet Data' }],
    defaultConfig: {
      operation: 'appendRow',
      sheetId: '',
      sheetName: 'Sheet1',
      range: 'A:Z'
    },
    requiresCredentials: true,
    credentialType: 'google_sheets'
  },
  {
    type: 'app_gmail',
    name: 'Gmail',
    description: 'Send emails, draft replies, search messages, or trigger on incoming Gmail emails.',
    category: 'Applications',
    icon: 'Mail',
    accentColor: '#EA4335',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Email Context' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Message Sent' }],
    defaultConfig: {
      operation: 'send',
      to: 'recipient@domain.com',
      subject: 'Automated Update: {{$json.event || "EIE Alert"}}',
      body: '<p>Hello,</p><p>Workflow completed: {{$json}}</p>'
    },
    requiresCredentials: true,
    credentialType: 'gmail'
  },
  {
    type: 'app_google_drive',
    name: 'Google Drive',
    description: 'Upload assets, create folders, download files, and search Cloud drive items.',
    category: 'Applications',
    icon: 'Folder',
    accentColor: '#4285F4',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'File Data' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Drive File' }],
    defaultConfig: {
      operation: 'upload',
      folderId: 'root'
    },
    requiresCredentials: true,
    credentialType: 'google_drive'
  },
  {
    type: 'app_google_calendar',
    name: 'Google Calendar',
    description: 'Create scheduled events, retrieve upcoming agenda meetings, or update time slots.',
    category: 'Applications',
    icon: 'Calendar',
    accentColor: '#34A853',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Event Details' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Calendar Event' }],
    defaultConfig: {
      operation: 'createEvent',
      summary: 'Automated Client Strategy Session',
      durationMinutes: 30
    },
    requiresCredentials: true,
    credentialType: 'google_calendar'
  },
  {
    type: 'app_slack',
    name: 'Slack',
    description: 'Post rich channel messages, send block-kit alerts, direct message users, or reply to threads.',
    category: 'Applications',
    icon: 'MessageSquare',
    accentColor: '#4A154B',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Payload' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Slack Response' }],
    defaultConfig: {
      operation: 'postMessage',
      channel: '#general',
      text: '🚀 EIE-Workflow Notification: {{$json.summary || "Process finished"}}'
    },
    requiresCredentials: true,
    credentialType: 'slack'
  },
  {
    type: 'app_discord',
    name: 'Discord',
    description: 'Broadcast webhook notifications, post rich embeds, and ping channels in Discord.',
    category: 'Applications',
    icon: 'Disc',
    accentColor: '#5865F2',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Embed Data' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Delivered' }],
    defaultConfig: {
      operation: 'sendWebhook',
      content: '⚡ EIE-Workflow: Event executed successfully.'
    }
  },
  {
    type: 'app_telegram',
    name: 'Telegram',
    description: 'Send messages, photos, documents, and interactive buttons via Telegram Bot API.',
    category: 'Applications',
    icon: 'Send',
    accentColor: '#229ED9',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Chat Message' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Sent Message' }],
    defaultConfig: {
      operation: 'sendMessage',
      botToken: '',
      tokenId: '',
      chatId: '@devops_channel',
      text: '{{$json.message || $json.text || $json.data || $json}}',
      parseMode: 'HTML',
      enableExternalWebhook: true,
      webhookPath: 'telegram'
    },
    requiresCredentials: true,
    credentialType: 'telegram'
  },
  {
    type: 'app_whatsapp',
    name: 'WhatsApp Business',
    description: 'Send WhatsApp Cloud API template notifications, media files, and customer messages with external webhook reception.',
    category: 'Applications',
    icon: 'MessageCircle',
    accentColor: '#25D366',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Message Data' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Delivery Status' }],
    defaultConfig: {
      operation: 'sendTemplate',
      tokenId: '',
      accessToken: '',
      phoneNumberId: '',
      businessAccountId: '',
      verifyToken: 'eie_whatsapp_verify_token',
      templateName: 'order_status_update',
      phoneNumber: '+10000000000',
      message: '{{$json.message || $json.text || $json.data || $json}}',
      enableExternalWebhook: true,
      webhookPath: 'whatsapp'
    },
    requiresCredentials: true,
    credentialType: 'whatsapp'
  },
  {
    type: 'app_twilio',
    name: 'Twilio',
    description: 'Send SMS text messages, initiate voice calls, or trigger 2FA phone verifications.',
    category: 'Applications',
    icon: 'PhoneCall',
    accentColor: '#F22F46',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'SMS Payload' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'SMS Receipt' }],
    defaultConfig: {
      operation: 'sendSms',
      to: '+10000000000',
      from: '+10000000001',
      body: 'Your automated alert: {{$json.text || "Status OK"}}'
    },
    requiresCredentials: true,
    credentialType: 'twilio'
  },
  {
    type: 'app_notion',
    name: 'Notion',
    description: 'Create database pages, query notion workspaces, append blocks, and update properties.',
    category: 'Applications',
    icon: 'BookOpen',
    accentColor: '#FFFFFF',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Page Data' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Notion Page' }],
    defaultConfig: {
      operation: 'createDatabasePage',
      databaseId: '',
      title: 'Automated Workflow Task'
    },
    requiresCredentials: true,
    credentialType: 'notion'
  },
  {
    type: 'app_airtable',
    name: 'Airtable',
    description: 'Search, list, create, update, or delete records in Airtable relational bases.',
    category: 'Applications',
    icon: 'Table',
    accentColor: '#FCB400',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Record Fields' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Records' }],
    defaultConfig: {
      operation: 'createRecord',
      baseId: '',
      table: 'Leads'
    },
    requiresCredentials: true,
    credentialType: 'airtable'
  },
  {
    type: 'app_github',
    name: 'GitHub',
    description: 'Create issues, trigger on push/PR events, manage releases, and query repository files.',
    category: 'Applications',
    icon: 'GitBranch',
    accentColor: '#F0F6FC',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Payload' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'GitHub Event' }],
    defaultConfig: {
      operation: 'createIssue',
      owner: 'exploretheinsideexperiment-art',
      repo: 'EIE-Workflow',
      title: 'Automated CI/CD Issue'
    },
    requiresCredentials: true,
    credentialType: 'github'
  },
  {
    type: 'app_jira',
    name: 'Jira Software',
    description: 'Create issues, transition sprint tickets, and assign development tasks in Atlassian Jira.',
    category: 'Applications',
    icon: 'CheckSquare',
    accentColor: '#0052CC',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Issue Data' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Jira Issue' }],
    defaultConfig: {
      operation: 'createIssue',
      projectKey: 'AUTO',
      issueType: 'Task',
      summary: 'Automated Ticket'
    },
    requiresCredentials: true,
    credentialType: 'jira'
  },
  {
    type: 'app_linear',
    name: 'Linear',
    description: 'Sync feedback, errors, and feature requests directly into Linear issues and cycles.',
    category: 'Applications',
    icon: 'CheckCircle2',
    accentColor: '#5E6AD2',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Issue Details' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Linear Issue' }],
    defaultConfig: {
      operation: 'createIssue',
      teamKey: 'ENG',
      title: 'Automated Task: {{$json.title || "New Request"}}'
    },
    requiresCredentials: true,
    credentialType: 'linear'
  },
  {
    type: 'app_trello',
    name: 'Trello',
    description: 'Create cards, move cards between lists, add checklists, and listen to board events.',
    category: 'Applications',
    icon: 'Columns3',
    accentColor: '#0079BF',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Card Data' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Card Result' }],
    defaultConfig: {
      operation: 'createCard',
      listId: '',
      name: 'New Kanban Item'
    },
    requiresCredentials: true,
    credentialType: 'trello'
  },
  {
    type: 'app_asana',
    name: 'Asana',
    description: 'Create tasks, assign team members, and update task deadlines in Asana workspaces.',
    category: 'Applications',
    icon: 'ListTodo',
    accentColor: '#F06A6A',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Task Info' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Asana Task' }],
    defaultConfig: {
      operation: 'createTask',
      workspaceId: '',
      name: 'Client Task'
    },
    requiresCredentials: true,
    credentialType: 'asana'
  },
  {
    type: 'app_clickup',
    name: 'ClickUp',
    description: 'Manage ClickUp tasks, custom fields, comments, and task statuses automatically.',
    category: 'Applications',
    icon: 'CheckSquare',
    accentColor: '#7B68EE',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Task Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Task Created' }],
    defaultConfig: {
      operation: 'createTask',
      listId: '',
      name: 'High Priority Automation Task'
    },
    requiresCredentials: true,
    credentialType: 'clickup'
  },
  {
    type: 'app_stripe',
    name: 'Stripe',
    description: 'Create customers, process payment charges, manage subscriptions, or capture invoices.',
    category: 'Applications',
    icon: 'CreditCard',
    accentColor: '#635BFF',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Payment Details' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Stripe Charge' }],
    defaultConfig: {
      operation: 'createCustomer',
      email: 'customer@domain.com',
      name: 'Enterprise Client'
    },
    requiresCredentials: true,
    credentialType: 'stripe'
  },
  {
    type: 'app_shopify',
    name: 'Shopify',
    description: 'Retrieve e-commerce store orders, create products, update inventory, and handle fulfillments.',
    category: 'Applications',
    icon: 'ShoppingBag',
    accentColor: '#96BF48',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Order / Product' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Shopify Data' }],
    defaultConfig: {
      operation: 'getOrders',
      status: 'any',
      limit: 10
    },
    requiresCredentials: true,
    credentialType: 'shopify'
  },
  {
    type: 'app_hubspot',
    name: 'HubSpot',
    description: 'Create contacts, update deal stages, log marketing activities, and sync CRM companies.',
    category: 'Applications',
    icon: 'Users',
    accentColor: '#FF7A59',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Lead Info' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'HubSpot Contact' }],
    defaultConfig: {
      operation: 'createContact',
      email: 'lead@enterprise.com',
      firstname: 'Elena',
      lastname: 'Vance'
    },
    requiresCredentials: true,
    credentialType: 'hubspot'
  },
  {
    type: 'app_salesforce',
    name: 'Salesforce',
    description: 'Query SOQL records, create enterprise leads, opportunities, and sync account details.',
    category: 'Applications',
    icon: 'Cloud',
    accentColor: '#00A1E0',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'CRM Record' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Salesforce Lead' }],
    defaultConfig: {
      operation: 'createLead',
      company: 'Quantum Corp',
      lastName: 'Vance'
    },
    requiresCredentials: true,
    credentialType: 'salesforce'
  },
  {
    type: 'app_zendesk',
    name: 'Zendesk',
    description: 'Create customer support tickets, update status, and assign inquiries to support agents.',
    category: 'Applications',
    icon: 'Headphones',
    accentColor: '#03363D',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Inquiry' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Ticket' }],
    defaultConfig: {
      operation: 'createTicket',
      subject: 'Inquiry from Workflow: {{$json.subject || "Help Needed"}}',
      comment: 'Ticket auto-created by EIE-Workflow.'
    },
    requiresCredentials: true,
    credentialType: 'zendesk'
  },
  {
    type: 'app_mailchimp',
    name: 'Mailchimp',
    description: 'Add subscribers to marketing lists, trigger automated drip campaigns, and manage tags.',
    category: 'Applications',
    icon: 'MailCheck',
    accentColor: '#FFE01B',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Subscriber' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Audience Member' }],
    defaultConfig: {
      operation: 'addMember',
      listId: '',
      email: 'subscriber@domain.com',
      status: 'subscribed'
    },
    requiresCredentials: true,
    credentialType: 'mailchimp'
  },
  {
    type: 'app_openai',
    name: 'OpenAI ChatGPT',
    description: 'Call GPT-4o, GPT-4o-mini, DALL-E, text embeddings, or chat completions.',
    category: 'Applications',
    icon: 'Bot',
    accentColor: '#10A37F',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Prompt' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'AI Completion' }],
    defaultConfig: {
      model: 'gpt-4o',
      prompt: 'Summarize the following payload: {{$json}}',
      temperature: 0.7
    },
    requiresCredentials: true,
    credentialType: 'openai'
  },
  {
    type: 'app_anthropic',
    name: 'Anthropic Claude',
    description: 'Leverage Claude 3.5 Sonnet for deep contextual reasoning, complex coding, and structured JSON.',
    category: 'Applications',
    icon: 'BrainCircuit',
    accentColor: '#D97706',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'System & Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Claude Response' }],
    defaultConfig: {
      model: 'claude-3-5-sonnet',
      prompt: 'Analyze and extract key parameters from {{$json}}'
    },
    requiresCredentials: true,
    credentialType: 'anthropic'
  },
  {
    type: 'app_supabase',
    name: 'Supabase',
    description: 'Perform CRUD operations on hosted PostgreSQL tables, query storage buckets, or listen to realtime changes.',
    category: 'Applications',
    icon: 'Database',
    accentColor: '#3ECF8E',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Row Data' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Query Results' }],
    defaultConfig: {
      operation: 'select',
      table: 'profiles',
      selectQuery: '*'
    },
    requiresCredentials: true,
    credentialType: 'supabase'
  },
  {
    type: 'app_aws_s3',
    name: 'Amazon S3',
    description: 'Upload files to S3 buckets, download assets, list objects, and generate presigned download URLs.',
    category: 'Applications',
    icon: 'Server',
    accentColor: '#FF9900',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Object / File' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'S3 Object' }],
    defaultConfig: {
      operation: 'uploadObject',
      bucket: 'my-bucket',
      key: 'uploads/file_{{Date.now()}}.json'
    },
    requiresCredentials: true,
    credentialType: 'aws_s3'
  },
  {
    type: 'app_zoom',
    name: 'Zoom',
    description: 'Automatically schedule Zoom video meetings, manage attendees, and listen to webinar recordings.',
    category: 'Applications',
    icon: 'Video',
    accentColor: '#2D8CFF',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Meeting Info' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Meeting Link' }],
    defaultConfig: {
      operation: 'createMeeting',
      topic: 'Automated Strategy Session',
      type: 2,
      duration: 45
    },
    requiresCredentials: true,
    credentialType: 'zoom'
  },
  {
    type: 'app_typeform',
    name: 'Typeform',
    description: 'Trigger on new form survey responses, extract answers, and route respondent leads.',
    category: 'Applications',
    icon: 'FileText',
    accentColor: '#262627',
    inputs: [],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Form Submission' }],
    defaultConfig: {
      formId: '',
      sampleResponse: '{\n  "name": "Alex Vance",\n  "score": 10\n}'
    },
    requiresCredentials: true,
    credentialType: 'typeform'
  },
  {
    type: 'app_webflow',
    name: 'Webflow',
    description: 'Publish CMS collection items, update live website data, and listen to site form triggers.',
    category: 'All Applications',
    icon: 'Globe',
    accentColor: '#4353FF',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'CMS Fields' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'CMS Item' }],
    defaultConfig: {
      operation: 'createItem',
      collectionId: '',
      live: true
    },
    requiresCredentials: true,
    credentialType: 'webflow'
  },
  {
    type: 'app_google_gemini',
    name: 'Google Gemini AI',
    description: 'Run multimodal Gemini 2.5 Flash, text generation, structured JSON extraction, and agents.',
    category: 'All Applications',
    icon: 'Sparkles',
    accentColor: '#1A73E8',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Prompt / Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'AI Output' }],
    defaultConfig: {
      model: 'gemini-2.5-flash',
      prompt: 'Summarize and extract key action items: {{$json}}',
      temperature: 0.2
    },
    requiresCredentials: true,
    credentialType: 'gemini'
  },
  {
    type: 'app_google_docs',
    name: 'Google Docs',
    description: 'Create Google Documents, append rich text content, insert tables, or export PDF files.',
    category: 'All Applications',
    icon: 'FileText',
    accentColor: '#4285F4',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Document Content' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Created Doc' }],
    defaultConfig: {
      operation: 'createDocument',
      title: 'Automated Report: {{$json.title || "Weekly Summary"}}',
      body: 'Document generated by EIE-Workflow.'
    },
    requiresCredentials: true,
    credentialType: 'google_docs'
  },
  {
    type: 'app_google_forms',
    name: 'Google Forms',
    description: 'Listen to incoming Google Forms submissions, poll responses, and trigger alerts.',
    category: 'All Applications',
    icon: 'FileCode',
    accentColor: '#7248B9',
    inputs: [],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Form Response' }],
    defaultConfig: {
      formId: '',
      pollInterval: '5m'
    },
    requiresCredentials: true,
    credentialType: 'google_forms'
  },
  {
    type: 'app_sendgrid',
    name: 'SendGrid',
    description: 'Deliver transactional emails, marketing newsletters, and monitor delivery analytics.',
    category: 'All Applications',
    icon: 'Send',
    accentColor: '#1A82E2',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Email Context' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Delivery Receipt' }],
    defaultConfig: {
      operation: 'sendEmail',
      to: 'recipient@client.com',
      from: 'noreply@eie-workflow.com',
      subject: 'Transaction Notice',
      content: '<p>Workflow processed successfully: {{$json}}</p>'
    },
    requiresCredentials: true,
    credentialType: 'sendgrid'
  },
  {
    type: 'app_paypal',
    name: 'PayPal',
    description: 'Generate customer invoices, check payment capture status, and process refunds.',
    category: 'All Applications',
    icon: 'CreditCard',
    accentColor: '#003087',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Invoice Details' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'PayPal Order' }],
    defaultConfig: {
      operation: 'createInvoice',
      amount: '99.00',
      currency: 'USD',
      recipientEmail: 'client@company.com'
    },
    requiresCredentials: true,
    credentialType: 'paypal'
  },
  {
    type: 'app_woocommerce',
    name: 'WooCommerce',
    description: 'Manage store orders, products, inventory count, and sync e-commerce customer records.',
    category: 'All Applications',
    icon: 'ShoppingBag',
    accentColor: '#96588A',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Order / Product' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'WooCommerce Data' }],
    defaultConfig: {
      operation: 'getOrders',
      status: 'processing'
    },
    requiresCredentials: true,
    credentialType: 'woocommerce'
  },
  {
    type: 'app_gitlab',
    name: 'GitLab',
    description: 'Manage merge requests, trigger CI/CD pipelines, create issues, and manage code branches.',
    category: 'All Applications',
    icon: 'GitBranch',
    accentColor: '#FC6D26',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Pipeline / Issue' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'GitLab Result' }],
    defaultConfig: {
      operation: 'createIssue',
      projectId: '',
      title: 'Automated Pipeline Issue'
    },
    requiresCredentials: true,
    credentialType: 'gitlab'
  },
  {
    type: 'app_monday',
    name: 'Monday.com',
    description: 'Create board items, update column values, move task stages, and notify team members.',
    category: 'All Applications',
    icon: 'Columns3',
    accentColor: '#FF3D57',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Item Data' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Board Item' }],
    defaultConfig: {
      operation: 'createItem',
      boardId: '',
      itemName: 'New Workflow Lead'
    },
    requiresCredentials: true,
    credentialType: 'monday'
  },
  {
    type: 'app_ms_teams',
    name: 'Microsoft Teams',
    description: 'Post adaptive cards to Teams channels, direct message colleagues, and manage meetings.',
    category: 'All Applications',
    icon: 'MessageSquare',
    accentColor: '#6264A7',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Message Payload' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Teams Response' }],
    defaultConfig: {
      operation: 'postMessage',
      channelId: '',
      message: '🚨 EIE-Workflow Alert: {{$json.title || "Execution Successful"}}'
    },
    requiresCredentials: true,
    credentialType: 'ms_teams'
  },
  {
    type: 'app_ms_outlook',
    name: 'Microsoft Outlook',
    description: 'Send emails, draft responses, manage calendar invitations, and monitor inbox messages.',
    category: 'All Applications',
    icon: 'Mail',
    accentColor: '#0078D4',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Email Content' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Outlook Sent' }],
    defaultConfig: {
      operation: 'sendMail',
      to: 'recipient@organization.com',
      subject: 'Automated Status Notification',
      body: 'Workflow notification delivered.'
    },
    requiresCredentials: true,
    credentialType: 'ms_outlook'
  },
  {
    type: 'app_ms_excel',
    name: 'Microsoft Excel 365',
    description: 'Read and append rows to cloud Excel workbooks, query tables, and format spreadsheets.',
    category: 'All Applications',
    icon: 'Table',
    accentColor: '#107C41',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Row Data' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Excel Output' }],
    defaultConfig: {
      operation: 'addRow',
      workbookId: '',
      worksheetName: 'Sheet1'
    },
    requiresCredentials: true,
    credentialType: 'ms_excel'
  },
  {
    type: 'app_postgres',
    name: 'PostgreSQL',
    description: 'Execute SQL queries, insert records, perform transactions, or listen to Postgres notifications.',
    category: 'All Applications',
    icon: 'Database',
    accentColor: '#336791',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'SQL Params' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Query Rows' }],
    defaultConfig: {
      operation: 'executeQuery',
      query: 'SELECT * FROM users WHERE active = true LIMIT 10;'
    },
    requiresCredentials: true,
    credentialType: 'postgres'
  },
  {
    type: 'app_mysql',
    name: 'MySQL',
    description: 'Query relational tables, execute stored procedures, and bulk insert rows in MySQL databases.',
    category: 'All Applications',
    icon: 'Database',
    accentColor: '#00758F',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'SQL Params' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'MySQL Rows' }],
    defaultConfig: {
      operation: 'executeQuery',
      query: 'SELECT id, status, updated_at FROM orders ORDER BY id DESC LIMIT 20;'
    },
    requiresCredentials: true,
    credentialType: 'mysql'
  },
  {
    type: 'app_mongodb',
    name: 'MongoDB',
    description: 'Insert documents, find collections, update BSON documents, or aggregate collections.',
    category: 'All Applications',
    icon: 'HardDrive',
    accentColor: '#47A248',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Document' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Mongo Result' }],
    defaultConfig: {
      operation: 'find',
      collection: 'customers',
      query: '{ "status": "active" }'
    },
    requiresCredentials: true,
    credentialType: 'mongodb'
  },
  {
    type: 'app_redis',
    name: 'Redis',
    description: 'Set cache keys with TTL, get values, push to lists, or publish messages to Redis Pub/Sub channels.',
    category: 'All Applications',
    icon: 'Cpu',
    accentColor: '#DC382D',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Key / Value' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Redis Output' }],
    defaultConfig: {
      operation: 'set',
      key: 'user:session:{{$json.id}}',
      value: '{{JSON.stringify($json)}}',
      ttlSeconds: 3600
    },
    requiresCredentials: true,
    credentialType: 'redis'
  },
  {
    type: 'app_pinecone',
    name: 'Pinecone Vector DB',
    description: 'Upsert dense embeddings, query top-k similar vectors, and manage RAG AI indexes.',
    category: 'All Applications',
    icon: 'BrainCircuit',
    accentColor: '#10B981',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Embedding Vector' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Nearest Neighbors' }],
    defaultConfig: {
      operation: 'queryVectors',
      indexName: 'enterprise-knowledge-base',
      topK: 5
    },
    requiresCredentials: true,
    credentialType: 'pinecone'
  },
  {
    type: 'app_dropbox',
    name: 'Dropbox',
    description: 'Upload files, share download links, organize cloud folders, and search assets.',
    category: 'All Applications',
    icon: 'Folder',
    accentColor: '#0061FF',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'File Data' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Dropbox File' }],
    defaultConfig: {
      operation: 'uploadFile',
      path: '/backups/workflow_{{Date.now()}}.json'
    },
    requiresCredentials: true,
    credentialType: 'dropbox'
  },
  {
    type: 'app_wordpress',
    name: 'WordPress',
    description: 'Publish blog posts, manage media uploads, update pages, and listen to site events.',
    category: 'All Applications',
    icon: 'Globe',
    accentColor: '#21759B',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Post Data' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Published Post' }],
    defaultConfig: {
      operation: 'createPost',
      title: 'Automated Insight: {{$json.title || "Industry Update"}}',
      status: 'publish'
    },
    requiresCredentials: true,
    credentialType: 'wordpress'
  },
  {
    type: 'app_twitter',
    name: 'Twitter / X',
    description: 'Post tweets, search tweets by hashtag or user, and listen to brand mentions.',
    category: 'All Applications',
    icon: 'Share2',
    accentColor: '#1DA1F2',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Tweet Content' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Tweet ID' }],
    defaultConfig: {
      operation: 'postTweet',
      text: '🚀 Automated launch update: {{$json.text || "Workflow active on EIE-Workflow"}}'
    },
    requiresCredentials: true,
    credentialType: 'twitter'
  },
  {
    type: 'app_linkedin',
    name: 'LinkedIn',
    description: 'Publish company page updates, share professional articles, and manage social reach.',
    category: 'All Applications',
    icon: 'Users',
    accentColor: '#0A66C2',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Post Text' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Share Result' }],
    defaultConfig: {
      operation: 'shareUpdate',
      text: 'Excited to announce our automated workflow integration.'
    },
    requiresCredentials: true,
    credentialType: 'linkedin'
  },

  // ==========================================
  // 2. TRIGGERS
  // ==========================================
  {
    type: 'trigger_manual',
    name: 'Manual Trigger',
    description: 'Triggers workflow execution manually with optional test payload data.',
    category: 'Triggers',
    icon: 'PlayCircle',
    accentColor: '#10b981', // emerald
    inputs: [],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Output' }],
    defaultConfig: {
      samplePayload: '{\n  "test": true,\n  "initiatedBy": "Engineer"\n}'
    }
  },
  {
    type: 'trigger_webhook',
    name: 'Webhook Trigger',
    description: 'Generates a unique HTTP webhook endpoint for inbound external event integration.',
    category: 'Triggers',
    icon: 'Webhook',
    accentColor: '#06b6d4', // cyan
    inputs: [],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Inbound Data' }],
    defaultConfig: {
      webhookPath: '',
      method: 'POST',
      responseCode: 200,
      samplePayload: '{\n  "event": "order_created",\n  "amount": 250,\n  "customer": "Apex Ltd"\n}'
    }
  },
  {
    type: 'trigger_schedule',
    name: 'Schedule Trigger',
    description: 'Executes workflows periodically (every minute, hourly, daily, or via cron).',
    category: 'Triggers',
    icon: 'Clock',
    accentColor: '#8b5cf6', // violet
    inputs: [],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Schedule Event' }],
    defaultConfig: {
      interval: 'hourly',
      cronExpression: '0 * * * *'
    }
  },
  {
    type: 'trigger_email',
    name: 'Email Trigger',
    description: 'Starts workflow when a configured inbox receives a qualifying message.',
    category: 'Triggers',
    icon: 'Inbox',
    accentColor: '#f59e0b', // amber
    inputs: [],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Email Event' }],
    defaultConfig: {
      filterSender: '',
      filterSubject: ''
    }
  },

  // 2. HTTP
  {
    type: 'http_request',
    name: 'HTTP Request',
    description: 'Executes outbound REST API calls with GET, POST, PUT, PATCH, DELETE and custom headers.',
    category: 'HTTP',
    icon: 'Globe',
    accentColor: '#3b82f6', // blue
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Trigger Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Response' }],
    defaultConfig: {
      method: 'GET',
      url: 'https://httpbin.org/get',
      headers: [{ key: 'Accept', value: 'application/json' }],
      body: '',
      timeoutMs: 15000
    }
  },

  // 3. ADVANCED AI & AGENTS (n8n LangChain Style)
  {
    type: 'ai_agent',
    name: 'AI Agent',
    description: 'Autonomous AI Agent with LLM reasoning, conversational memory, and multi-tool execution capabilities.',
    category: 'AI',
    icon: 'Bot',
    accentColor: '#9333ea', // purple
    inputs: [
      { id: 'in_main', name: 'main', type: 'main', label: 'Chat / Trigger Input' },
      { id: 'in_model', name: 'model', type: 'model', label: 'Chat Model' },
      { id: 'in_memory', name: 'memory', type: 'memory', label: 'Memory' },
      { id: 'in_tools', name: 'tool', type: 'tool', label: 'Tools' },
    ],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Agent Response' }],
    defaultConfig: {
      agentType: 'tools_agent',
      systemPrompt: 'You are an expert autonomous AI agent equipped with external tools. Analyze user queries, plan actions, invoke tools as needed, and return structured answers.',
      temperature: 0.2,
      maxIterations: 10,
      returnIntermediateSteps: true
    }
  },
  {
    type: 'ai_model_gemini',
    name: 'Google Gemini Chat Model',
    description: 'Provides Gemini 3.8 Flash or Gemini 2.5 Pro multimodal reasoning engine to AI Agents.',
    category: 'AI',
    icon: 'Sparkles',
    accentColor: '#1A73E8',
    inputs: [],
    outputs: [{ id: 'out_model', name: 'model', type: 'model', label: 'Model' }],
    defaultConfig: {
      model: 'gemini-2.5-flash',
      temperature: 0.2,
      maxOutputTokens: 2048
    },
    requiresCredentials: true,
    credentialType: 'gemini'
  },
  {
    type: 'ai_model_openai',
    name: 'OpenAI Chat Model',
    description: 'Connects GPT-4o, GPT-4o-mini, or o1 reasoning language model to the AI Agent.',
    category: 'AI',
    icon: 'Bot',
    accentColor: '#10A37F',
    inputs: [],
    outputs: [{ id: 'out_model', name: 'model', type: 'model', label: 'Model' }],
    defaultConfig: {
      model: 'gpt-4o',
      temperature: 0.7
    },
    requiresCredentials: true,
    credentialType: 'openai'
  },
  {
    type: 'ai_model_claude',
    name: 'Anthropic Claude Model',
    description: 'Connects Claude 3.5 Sonnet to AI Agent for deep code analysis and complex reasoning.',
    category: 'AI',
    icon: 'BrainCircuit',
    accentColor: '#D97706',
    inputs: [],
    outputs: [{ id: 'out_model', name: 'model', type: 'model', label: 'Model' }],
    defaultConfig: {
      model: 'claude-3-5-sonnet',
      temperature: 0.3
    },
    requiresCredentials: true,
    credentialType: 'anthropic'
  },
  {
    type: 'ai_memory_window',
    name: 'Window Buffer Memory',
    description: 'Keeps a rolling window of recent chat conversation turns for contextual memory in the AI Agent.',
    category: 'AI',
    icon: 'History',
    accentColor: '#F59E0B',
    inputs: [],
    outputs: [{ id: 'out_memory', name: 'memory', type: 'memory', label: 'Memory' }],
    defaultConfig: {
      sessionKey: 'user_session_{{$json.userId || "default"}}',
      contextWindowLength: 10
    }
  },
  {
    type: 'ai_memory_redis',
    name: 'Redis Chat Memory',
    description: 'Persists user session chat history into high-performance Redis cache for cross-session continuity.',
    category: 'AI',
    icon: 'Cpu',
    accentColor: '#DC382D',
    inputs: [],
    outputs: [{ id: 'out_memory', name: 'memory', type: 'memory', label: 'Memory' }],
    defaultConfig: {
      sessionKey: 'chat:{{$json.sessionId}}',
      ttlSeconds: 86400
    },
    requiresCredentials: true,
    credentialType: 'redis'
  },
  {
    type: 'ai_tool_calculator',
    name: 'Calculator Tool',
    description: 'Enables the AI Agent to execute precise mathematical, financial, and formula calculations.',
    category: 'AI Tools',
    icon: 'Activity',
    accentColor: '#10B981',
    inputs: [],
    outputs: [{ id: 'out_tool', name: 'tool', type: 'tool', label: 'Tool' }],
    defaultConfig: {
      toolName: 'calculator',
      toolDescription: 'Calculates mathematical equations and numerical operations with precision.'
    }
  },
  {
    type: 'ai_tool_search',
    name: 'Web Search Tool',
    description: 'Allows the AI Agent to search Google and live web engines for real-time information.',
    category: 'AI Tools',
    icon: 'Globe',
    accentColor: '#3B82F6',
    inputs: [],
    outputs: [{ id: 'out_tool', name: 'tool', type: 'tool', label: 'Tool' }],
    defaultConfig: {
      toolName: 'web_search',
      maxResults: 5
    }
  },
  {
    type: 'ai_tool_http',
    name: 'Custom HTTP Request Tool',
    description: 'Enables AI Agent to make arbitrary REST API calls to external microservices as a dynamic tool.',
    category: 'AI Tools',
    icon: 'Terminal',
    accentColor: '#06B6D4',
    inputs: [],
    outputs: [{ id: 'out_tool', name: 'tool', type: 'tool', label: 'Tool' }],
    defaultConfig: {
      toolName: 'api_caller',
      endpointUrl: 'https://api.example.com/data'
    }
  },
  {
    type: 'ai_tool_code',
    name: 'Custom Code Tool',
    description: 'Empowers the AI Agent to execute custom JavaScript/Python snippets on demand.',
    category: 'AI Tools',
    icon: 'Code2',
    accentColor: '#8B5CF6',
    inputs: [],
    outputs: [{ id: 'out_tool', name: 'tool', type: 'tool', label: 'Tool' }],
    defaultConfig: {
      toolName: 'custom_code_evaluator',
      codeSnippet: 'return { result: input.number * 2 };'
    }
  },
  {
    type: 'ai_tool_vector_store',
    name: 'Vector Store Tool',
    description: 'Connects Pinecone or Supabase vector embeddings to retrieve relevant documentation for RAG.',
    category: 'AI Tools',
    icon: 'Database',
    accentColor: '#14B8A6',
    inputs: [],
    outputs: [{ id: 'out_tool', name: 'tool', type: 'tool', label: 'Tool' }],
    defaultConfig: {
      toolName: 'knowledge_base_retriever',
      topK: 4
    }
  },
  {
    type: 'ai_classifier',
    name: 'Smart Classifier',
    description: 'Categorizes incoming data into defined buckets using prompt classification.',
    category: 'AI',
    icon: 'Tags',
    accentColor: '#d946ef', // fuchsia
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Text Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Category' }],
    defaultConfig: {
      categories: ['Sales', 'Technical Support', 'Billing', 'Spam'],
      fieldToClassify: 'message'
    }
  },

  // 4. LOGIC
  {
    type: 'logic_if',
    name: 'IF / Condition',
    description: 'Branches workflow execution into TRUE or FALSE paths based on rules.',
    category: 'Logic',
    icon: 'GitBranch',
    accentColor: '#f97316', // orange
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [
      { id: 'out_true', name: 'true', type: 'true', label: 'TRUE' },
      { id: 'out_false', name: 'false', type: 'false', label: 'FALSE' }
    ],
    defaultConfig: {
      fieldPath: 'status',
      operator: '==',
      value: 'active'
    }
  },
  {
    type: 'logic_switch',
    name: 'Switch Case',
    description: 'Routes data along multiple paths based on matching criteria.',
    category: 'Logic',
    icon: 'Network',
    accentColor: '#eab308', // yellow
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [
      { id: 'out_case1', name: 'case1', type: 'branch', label: 'Case 1' },
      { id: 'out_case2', name: 'case2', type: 'branch', label: 'Case 2' },
      { id: 'out_default', name: 'default', type: 'branch', label: 'Default' }
    ],
    defaultConfig: {
      switchField: 'type'
    }
  },
  {
    type: 'logic_wait',
    name: 'Wait / Delay',
    description: 'Pauses workflow execution for a specified duration in seconds.',
    category: 'Logic',
    icon: 'Hourglass',
    accentColor: '#64748b', // slate
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'After Wait' }],
    defaultConfig: {
      seconds: 2
    }
  },
  {
    type: 'logic_filter',
    name: 'Filter Items',
    description: 'Filters lists of items, only allowing elements that meet criteria to proceed.',
    category: 'Logic',
    icon: 'Filter',
    accentColor: '#0ea5e9',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'List' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Filtered' }],
    defaultConfig: {
      filterCondition: 'item.score > 50'
    }
  },
  {
    type: 'data_merge',
    name: 'Merge (Combine Branches)',
    description: 'Combines data from two or more branches using Append, Merge by Key, or Choose Branch.',
    category: 'Logic',
    icon: 'GitMerge',
    accentColor: '#8b5cf6',
    inputs: [
      { id: 'in_input1', name: 'input1', type: 'main', label: 'Input 1' },
      { id: 'in_input2', name: 'input2', type: 'main', label: 'Input 2' }
    ],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Merged Output' }],
    defaultConfig: {
      mode: 'append', // 'append' | 'merge_by_key' | 'choose_branch' | 'combine'
      joinKey: 'id',
      chosenInput: 'input1'
    }
  },
  {
    type: 'data_loop',
    name: 'Loop (Split In Batches)',
    description: 'Loops over an array of items in batches of size N until all items are processed.',
    category: 'Logic',
    icon: 'Repeat',
    accentColor: '#06b6d4',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Items to Loop' }],
    outputs: [
      { id: 'out_loop', name: 'loop', type: 'branch', label: 'Loop Step' },
      { id: 'out_done', name: 'done', type: 'branch', label: 'Done' }
    ],
    defaultConfig: {
      batchSize: 10,
      reset: false
    }
  },
  {
    type: 'respond_to_webhook',
    name: 'Respond to Webhook',
    description: 'Sends an immediate HTTP status code, headers, and body back to the caller of Webhook Trigger.',
    category: 'Triggers',
    icon: 'Reply',
    accentColor: '#10b981',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Response Data' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Next' }],
    defaultConfig: {
      responseCode: 200,
      responseBody: '{\n  "success": true,\n  "received": "{{$json}}"\n}',
      responseMode: 'json'
    }
  },
  {
    type: 'data_aggregate',
    name: 'Aggregate Items',
    description: 'Aggregates multiple items or table rows into a single list, count, or summary calculation.',
    category: 'Data',
    icon: 'Layers',
    accentColor: '#3b82f6',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Items' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Aggregated Data' }],
    defaultConfig: {
      aggregateType: 'to_array', // 'to_array' | 'count' | 'sum' | 'join_string'
      field: 'revenue'
    }
  },
  {
    type: 'data_sort_limit',
    name: 'Sort & Limit',
    description: 'Sorts items ascending/descending by a field and keeps top N items (n8n Limit node).',
    category: 'Data',
    icon: 'ArrowUpDown',
    accentColor: '#f59e0b',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Items' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Sorted Output' }],
    defaultConfig: {
      sortField: 'urgencyScore',
      sortOrder: 'desc',
      limit: 10,
      skip: 0
    }
  },

  // 5. DATA TRANSFORMATION
  {
    type: 'data_set',
    name: 'Set Data',
    description: 'Adds, overwrites, or computes key-value fields in workflow JSON data.',
    category: 'Data',
    icon: 'Edit3',
    accentColor: '#14b8a6', // teal
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Modified Data' }],
    defaultConfig: {
      fields: [
        { name: 'processedAt', value: '{{$now}}' },
        { name: 'status', value: 'approved' }
      ]
    }
  },
  {
    type: 'data_code',
    name: 'Code Sandbox (JS)',
    description: 'Runs custom JavaScript code to transform, map, aggregate, or clean data.',
    category: 'Data',
    icon: 'Code2',
    accentColor: '#6366f1', // indigo
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Code Output' }],
    defaultConfig: {
      code: '// $json is incoming object, $input is raw payload\nreturn {\n  ...$json,\n  computedHash: "id_" + Math.random().toString(36).substr(2, 9),\n  timestamp: new Date().toISOString()\n};'
    }
  },
  {
    type: 'data_transform',
    name: 'Text & JSON Formatter',
    description: 'Converts between string case formats, parses JSON, or formats dates.',
    category: 'Data',
    icon: 'Layers',
    accentColor: '#0284c7',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Formatted' }],
    defaultConfig: {
      transformation: 'json_parse'
    }
  },

  // 6. COMMUNICATION
  {
    type: 'comm_email',
    name: 'Send Email',
    description: 'Sends automated HTML/Text email notifications with dynamic variable bindings.',
    category: 'Communication',
    icon: 'Mail',
    accentColor: '#ef4444', // red
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Sent Result' }],
    defaultConfig: {
      to: 'alerts@eie-workflow.internal',
      subject: 'Notification: {{$json.event}}',
      bodyHtml: '<p>Hello,</p><p>Workflow event received: {{$json}}</p>'
    }
  },
  {
    type: 'comm_telegram',
    name: 'Telegram Bot',
    description: 'Dispatches real-time alerts or chat messages to a Telegram group or channel.',
    category: 'Communication',
    icon: 'Send',
    accentColor: '#22d3ee', // light cyan
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Delivered' }],
    defaultConfig: {
      botToken: '',
      tokenId: '',
      chatId: '@devops_channel',
      message: '🚨 EIE-Workflow Alert: {{$json.summary || "Trigger event detected"}}',
      enableExternalWebhook: true,
      webhookPath: 'telegram'
    }
  },
  {
    type: 'comm_slack',
    name: 'Slack Message',
    description: 'Posts formatted messages or blocks to a Slack channel via webhook.',
    category: 'Communication',
    icon: 'MessageSquare',
    accentColor: '#a855f7',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Sent' }],
    defaultConfig: {
      channel: '#general',
      messageText: 'EIE-Workflow Notification: {{$json.title || "Execution Finished"}}'
    }
  },
  {
    type: 'comm_discord',
    name: 'Discord Webhook',
    description: 'Sends rich embeds or text notifications to Discord channels.',
    category: 'Communication',
    icon: 'Disc',
    accentColor: '#5865F2',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Sent' }],
    defaultConfig: {
      content: '⚡ EIE-Workflow: Process completed successfully.'
    }
  },

  // 7. DATABASE
  {
    type: 'db_postgres',
    name: 'PostgreSQL',
    description: 'Executes parameterized queries, inserts, updates, and selects against PostgreSQL.',
    category: 'Database',
    icon: 'Database',
    accentColor: '#336791',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Query Results' }],
    defaultConfig: {
      operation: 'SELECT',
      table: 'leads',
      query: 'SELECT * FROM leads WHERE status = \'unassigned\' LIMIT 10;'
    }
  },
  {
    type: 'db_mysql',
    name: 'MySQL',
    description: 'Connects to MySQL databases for structured transactional querying.',
    category: 'Database',
    icon: 'HardDrive',
    accentColor: '#00758F',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Query Results' }],
    defaultConfig: {
      operation: 'SELECT',
      table: 'orders',
      query: 'SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;'
    }
  },
  {
    type: 'db_redis',
    name: 'Redis Cache',
    description: 'Performs high-speed cache operations: GET, SET, INCR, or PUBLISH.',
    category: 'Database',
    icon: 'Cpu',
    accentColor: '#DC382D',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Cache Output' }],
    defaultConfig: {
      command: 'SET',
      key: 'user:session:{{$json.id}}',
      ttlSeconds: 3600
    }
  },

  // 8. FILES
  {
    type: 'file_read_write',
    name: 'CSV / File Converter',
    description: 'Converts arrays of JSON objects to CSV strings or parses CSV lines into structured JSON.',
    category: 'Files',
    icon: 'FileSpreadsheet',
    accentColor: '#10b981',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input Array' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'CSV / File Data' }],
    defaultConfig: {
      mode: 'json_to_csv'
    }
  },

  // 9. DEVELOPER
  {
    type: 'dev_graphql',
    name: 'GraphQL Query',
    description: 'Executes GraphQL queries and mutations with variables and headers.',
    category: 'Developer',
    icon: 'Terminal',
    accentColor: '#e535ab',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Data' }],
    defaultConfig: {
      endpoint: 'https://api.github.com/graphql',
      query: 'query { viewer { login } }'
    }
  },

  // ==========================================
  // 10. CHAT NODES
  // ==========================================
  {
    type: 'chat_trigger',
    name: 'Chat Trigger',
    description: 'Listens for incoming chat messages from live webchat, bot widget, or client API.',
    category: 'Chat',
    icon: 'MessageSquare',
    accentColor: '#0284c7',
    inputs: [],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'User Chat Message' }],
    defaultConfig: {
      welcomeMessage: 'Hello! How can I assist your workflow today?',
      requireSession: true,
      streamingEnabled: true
    }
  },
  {
    type: 'chat_message',
    name: 'Send Chat Response',
    description: 'Sends a formatted response back to the active user chat session with markdown & action buttons.',
    category: 'Chat',
    icon: 'Send',
    accentColor: '#0ea5e9',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Message Data' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Chat Result' }],
    defaultConfig: {
      message: '{{$json.output || $json.reply || "Thank you for reaching out!"}}',
      role: 'assistant',
      showTypingIndicator: true
    }
  },
  {
    type: 'chat_ai',
    name: 'Interactive AI Chat',
    description: 'Conversational AI Chat node with multi-turn memory, persona prompt, and real-time generation.',
    category: 'Chat',
    icon: 'Bot',
    accentColor: '#6366f1',
    inputs: [
      { id: 'in_main', name: 'main', type: 'main', label: 'User Query' },
      { id: 'in_model', name: 'model', type: 'model', label: 'Chat Model' },
      { id: 'in_memory', name: 'memory', type: 'memory', label: 'Memory' }
    ],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Chat Reply' }],
    defaultConfig: {
      systemPrompt: 'You are an intelligent, helpful AI workflow assistant. Answer questions accurately and concisely.',
      temperature: 0.3,
      maxTokens: 1024
    }
  },
  {
    type: 'chat_memory',
    name: 'Chat Window Memory',
    description: 'Maintains conversational sliding window memory across chat interactions, summarizing or retaining past turns.',
    category: 'Chat',
    icon: 'Brain',
    accentColor: '#8b5cf6',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'New Message' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Context & History' }],
    defaultConfig: {
      windowSize: 10,
      memoryKey: 'chat_history',
      autoSummarize: true
    }
  },
  {
    type: 'chat_sentiment',
    name: 'Chat Sentiment & Intent',
    description: 'Analyzes user chat sentiment (positive/neutral/negative/urgent) and classifies customer intent for automated routing.',
    category: 'Chat',
    icon: 'Smile',
    accentColor: '#06b6d4',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'User Message' }],
    outputs: [
      { id: 'out_main', name: 'main', type: 'main', label: 'Analysis' },
      { id: 'out_urgent', name: 'urgent', type: 'branch', label: 'High Urgency / Escalation' }
    ],
    defaultConfig: {
      field: 'message',
      detectUrgency: true,
      sentimentThreshold: 0.5
    }
  },
  {
    type: 'chat_webhook',
    name: 'Live Webchat Receiver',
    description: 'Direct webhook endpoint for embeds, React chatbots, WhatsApp webhooks, and live customer support widgets.',
    category: 'Chat',
    icon: 'MessageCircle',
    accentColor: '#10b981',
    inputs: [],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Incoming Chat' }],
    defaultConfig: {
      widgetPath: 'support-chat',
      autoAcknowledge: true,
      greetingText: 'Connected to live workflow assistant.'
    }
  },

  // ==========================================
  // 11. CORE NODES (n8n Standard Core Suite)
  // ==========================================
  {
    type: 'core_edit_fields',
    name: 'Edit Fields (Set)',
    description: 'Set, update, rename, or compute field values on items (the n8n Edit Fields node).',
    category: 'Core',
    icon: 'Edit3',
    accentColor: '#f59e0b',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input Data' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Set Output' }],
    defaultConfig: {
      mode: 'set',
      keepOnlySet: false,
      assignments: [
        { name: 'processedAt', value: '{{$now}}' },
        { name: 'status', value: 'completed' }
      ]
    }
  },
  {
    type: 'core_wait',
    name: 'Wait / Delay',
    description: 'Pauses workflow execution for a given time duration (seconds, minutes, hours) or until a specific date.',
    category: 'Core',
    icon: 'Clock',
    accentColor: '#ec4899',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Resume' }],
    defaultConfig: {
      amount: 2,
      unit: 'seconds'
    }
  },
  {
    type: 'core_stop_error',
    name: 'Stop and Error',
    description: 'Halts the workflow execution intentionally with an explicit error message, status code, and reason.',
    category: 'Core',
    icon: 'AlertOctagon',
    accentColor: '#ef4444',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_error', name: 'error', type: 'error', label: 'Error' }],
    defaultConfig: {
      errorMessage: 'Workflow halted: Validation failed or unauthorized action detected.',
      statusCode: 400
    }
  },
  {
    type: 'core_execute_workflow',
    name: 'Execute Sub-Workflow',
    description: 'Executes another workflow as a sub-routine, passing arguments and receiving outputs.',
    category: 'Core',
    icon: 'Workflow',
    accentColor: '#8b5cf6',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Sub-Workflow Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Sub-Workflow Output' }],
    defaultConfig: {
      workflowName: 'Sub Automation Routine',
      passThrough: true
    }
  },
  {
    type: 'core_datetime',
    name: 'Date & Time',
    description: 'Format timestamps, add or subtract time intervals, calculate duration differences, and convert timezones.',
    category: 'Core',
    icon: 'Calendar',
    accentColor: '#10b981',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Formatted Date' }],
    defaultConfig: {
      operation: 'format',
      format: 'YYYY-MM-DD HH:mm:ss',
      timezone: 'UTC',
      addAmount: 0,
      addUnit: 'days'
    }
  },
  {
    type: 'core_crypto',
    name: 'Crypto & Hash',
    description: 'Generate MD5, SHA-256, HMAC cryptographic hashes, random UUIDs, or Base64 encode/decode.',
    category: 'Core',
    icon: 'Lock',
    accentColor: '#64748b',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Hashed / Encoded' }],
    defaultConfig: {
      operation: 'sha256',
      value: '{{$json.id || $json.email || "eie_secret"}}',
      encoding: 'hex'
    }
  },
  {
    type: 'core_code',
    name: 'Code (JS / TS)',
    description: 'Execute custom JavaScript or TypeScript code with full access to $json, $items, and external utilities.',
    category: 'Core',
    icon: 'Terminal',
    accentColor: '#38bdf8',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input Items' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Code Result' }],
    defaultConfig: {
      code: '// Process item data\nitem.processedAt = new Date().toISOString();\nitem.status = "SUCCESS";\nreturn item;'
    }
  },
  {
    type: 'core_variable',
    name: 'Workflow State Variable',
    description: 'Store, read, increment, or persist global state variables across workflow steps and loops.',
    category: 'Core',
    icon: 'Variable',
    accentColor: '#14b8a6',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Variable Output' }],
    defaultConfig: {
      action: 'set',
      variableName: 'counter',
      value: '1'
    }
  },
  {
    type: 'core_json_parse',
    name: 'JSON Parse & Serialize',
    description: 'Parse JSON strings into structured objects or serialize complex objects into formatted JSON strings.',
    category: 'Core',
    icon: 'FileJson',
    accentColor: '#a78bfa',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Data Input' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Processed JSON' }],
    defaultConfig: {
      operation: 'parse',
      field: 'raw_payload'
    }
  },

  // ==========================================
  // 12. FLOW NODES (Flow Control & Routing)
  // ==========================================
  {
    type: 'flow_router',
    name: 'Flow Router',
    description: 'Routes items dynamically across multiple custom named branch channels based on expressions.',
    category: 'Flow',
    icon: 'Network',
    accentColor: '#3b82f6',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input Items' }],
    outputs: [
      { id: 'out_route_1', name: 'route_1', type: 'branch', label: 'Route 1' },
      { id: 'out_route_2', name: 'route_2', type: 'branch', label: 'Route 2' },
      { id: 'out_route_3', name: 'route_3', type: 'branch', label: 'Route 3' },
      { id: 'out_fallback', name: 'fallback', type: 'branch', label: 'Fallback' }
    ],
    defaultConfig: {
      activeRoute: 'out_route_1',
      rules: [
        { routeId: 'out_route_1', field: 'type', op: '==', value: 'priority' },
        { routeId: 'out_route_2', field: 'type', op: '==', value: 'standard' },
        { routeId: 'out_route_3', field: 'type', op: '==', value: 'archive' }
      ]
    }
  },
  {
    type: 'flow_split_batches',
    name: 'Split In Batches (Loop)',
    description: 'Splits arrays or item collections into batches of N items and loops through them sequentially.',
    category: 'Flow',
    icon: 'Layers',
    accentColor: '#f97316',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input Array' }],
    outputs: [
      { id: 'out_loop', name: 'loop', type: 'branch', label: 'Loop (Batch)' },
      { id: 'out_done', name: 'done', type: 'main', label: 'Done (All Processed)' }
    ],
    defaultConfig: {
      batchSize: 10,
      reset: false
    }
  },
  {
    type: 'flow_filter',
    name: 'Filter Items',
    description: 'Filters lists of items based on conditions, outputting kept items on main port and discarded on branch.',
    category: 'Flow',
    icon: 'Filter',
    accentColor: '#06b6d4',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input Items' }],
    outputs: [
      { id: 'out_kept', name: 'kept', type: 'main', label: 'Kept (Passed)' },
      { id: 'out_discarded', name: 'discarded', type: 'branch', label: 'Discarded' }
    ],
    defaultConfig: {
      field: 'status',
      operator: '==',
      value: 'active'
    }
  },
  {
    type: 'flow_loop',
    name: 'Loop Over Items',
    description: 'Iterates through an array of items one by one, giving access to the current item and loop index.',
    category: 'Flow',
    icon: 'Repeat',
    accentColor: '#a855f7',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Items' }],
    outputs: [
      { id: 'out_item', name: 'item', type: 'branch', label: 'Current Item' },
      { id: 'out_done', name: 'done', type: 'main', label: 'Loop Done' }
    ],
    defaultConfig: {
      maxIterations: 100
    }
  },
  {
    type: 'flow_merge',
    name: 'Merge Flow Branches',
    description: 'Merges outputs from parallel workflow branches together by key, array append, or wait-for-both.',
    category: 'Flow',
    icon: 'GitMerge',
    accentColor: '#6366f1',
    inputs: [
      { id: 'in_branch_1', name: 'branch1', type: 'main', label: 'Branch 1' },
      { id: 'in_branch_2', name: 'branch2', type: 'main', label: 'Branch 2' }
    ],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Merged Output' }],
    defaultConfig: {
      mode: 'combine',
      joinKey: 'id'
    }
  },
  {
    type: 'flow_parallel',
    name: 'Parallel Fork',
    description: 'Forks single incoming item into multiple parallel asynchronous execution tracks.',
    category: 'Flow',
    icon: 'Split',
    accentColor: '#ec4899',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Source Item' }],
    outputs: [
      { id: 'out_track_a', name: 'trackA', type: 'branch', label: 'Parallel Track A' },
      { id: 'out_track_b', name: 'trackB', type: 'branch', label: 'Parallel Track B' }
    ],
    defaultConfig: {
      concurrency: 5
    }
  },

  // ==========================================
  // 13. CHAIN NODES (LangChain / LLM Chains)
  // ==========================================
  {
    type: 'chain_llm',
    name: 'Basic LLM Chain',
    description: 'Combines a prompt template with an attached AI Chat Model to generate structured outputs.',
    category: 'Chain',
    icon: 'Sparkles',
    accentColor: '#8b5cf6',
    inputs: [
      { id: 'in_main', name: 'main', type: 'main', label: 'Input Variables' },
      { id: 'in_model', name: 'model', type: 'model', label: 'Chat Model' }
    ],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Chain Output' }],
    defaultConfig: {
      promptTemplate: 'You are a senior data architect. Summarize the following payload into key actionable insights:\n\n{{$json}}'
    }
  },
  {
    type: 'chain_qa_retrieval',
    name: 'QA Retrieval Chain',
    description: 'Grounded question answering that queries vector search or knowledge docs and formulates answers with citations.',
    category: 'Chain',
    icon: 'BookOpen',
    accentColor: '#7c3aed',
    inputs: [
      { id: 'in_main', name: 'main', type: 'main', label: 'Question' },
      { id: 'in_model', name: 'model', type: 'model', label: 'Model' },
      { id: 'in_tools', name: 'tools', type: 'tool', label: 'Vector Store / Docs' }
    ],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Grounded Answer' }],
    defaultConfig: {
      query: '{{$json.query || $json.question || "How does the system work?"}}',
      returnSourceDocuments: true
    }
  },
  {
    type: 'chain_summarize',
    name: 'Summarization Chain',
    description: 'Compresses long text documents, chat logs, transcripts, or tables into structured bulleted summaries.',
    category: 'Chain',
    icon: 'FileText',
    accentColor: '#9333ea',
    inputs: [
      { id: 'in_main', name: 'main', type: 'main', label: 'Content' },
      { id: 'in_model', name: 'model', type: 'model', label: 'Model' }
    ],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Summary Output' }],
    defaultConfig: {
      format: 'bullet_points',
      maxBullets: 5
    }
  },
  {
    type: 'chain_sequential',
    name: 'Sequential Chain',
    description: 'Executes a multi-stage LLM pipeline where the output of one step feeds into the prompt of the next step.',
    category: 'Chain',
    icon: 'GitMerge',
    accentColor: '#c084fc',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Initial Payload' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Final Result' }],
    defaultConfig: {
      stages: [
        { name: 'Stage 1: Extract Entities', prompt: 'Extract entities from: {{$json}}' },
        { name: 'Stage 2: Generate Report', prompt: 'Create clean report based on: {{$json}}' }
      ]
    }
  },
  {
    type: 'chain_router',
    name: 'LLM Router Chain',
    description: 'Dynamically routes user input to specialized sub-chains or prompts by classifying query intent with an LLM.',
    category: 'Chain',
    icon: 'Compass',
    accentColor: '#d946ef',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'User Query' }],
    outputs: [
      { id: 'out_chain_a', name: 'chainA', type: 'branch', label: 'Technical Support' },
      { id: 'out_chain_b', name: 'chainB', type: 'branch', label: 'Sales / Pricing' },
      { id: 'out_fallback', name: 'fallback', type: 'branch', label: 'General / Fallback' }
    ],
    defaultConfig: {
      classificationPrompt: 'Classify the inquiry into: technical, sales, or general.',
      routes: ['technical', 'sales', 'general']
    }
  },
  {
    type: 'chain_transform',
    name: 'Schema Transform Chain',
    description: 'Extracts unstructured text or messy JSON and coerces it into a strictly typed, clean JSON target schema.',
    category: 'Chain',
    icon: 'Binary',
    accentColor: '#818cf8',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Unstructured Data' }],
    outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Clean JSON' }],
    defaultConfig: {
      targetSchema: '{\n  "name": "string",\n  "email": "string",\n  "sentiment": "string"\n}'
    }
  },

  // ==========================================
  // 14. CONDITION NODES (Logic & Rule Evaluation)
  // ==========================================
  {
    type: 'condition_if',
    name: 'Condition (IF / ELSE)',
    description: 'Evaluate multi-rule boolean conditions (equals, contains, regex, gt, lt, is empty) with AND/OR logic.',
    category: 'Condition',
    icon: 'GitBranch',
    accentColor: '#10b981',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input Data' }],
    outputs: [
      { id: 'out_true', name: 'true', type: 'true', label: 'True Branch' },
      { id: 'out_false', name: 'false', type: 'false', label: 'False Branch' }
    ],
    defaultConfig: {
      operator: '==',
      fieldPath: 'status',
      value: 'active',
      combine: 'AND'
    }
  },
  {
    type: 'condition_switch',
    name: 'Multi-Condition Switch',
    description: 'Routes execution through multiple matching rule cases with dedicated case ports and a fallback port.',
    category: 'Condition',
    icon: 'Sliders',
    accentColor: '#f59e0b',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input Data' }],
    outputs: [
      { id: 'out_case_0', name: 'case_0', type: 'branch', label: 'Case 1' },
      { id: 'out_case_1', name: 'case_1', type: 'branch', label: 'Case 2' },
      { id: 'out_case_2', name: 'case_2', type: 'branch', label: 'Case 3' },
      { id: 'out_fallback', name: 'fallback', type: 'branch', label: 'Fallback' }
    ],
    defaultConfig: {
      field: 'category',
      cases: [
        { value: 'support', port: 'out_case_0' },
        { value: 'sales', port: 'out_case_1' },
        { value: 'billing', port: 'out_case_2' }
      ]
    }
  },
  {
    type: 'condition_compare',
    name: 'Compare Datasets',
    description: 'Compares two datasets or payloads side-by-side to detect added, removed, or modified records.',
    category: 'Condition',
    icon: 'Columns',
    accentColor: '#6366f1',
    inputs: [
      { id: 'in_a', name: 'datasetA', type: 'main', label: 'Dataset A' },
      { id: 'in_b', name: 'datasetB', type: 'main', label: 'Dataset B' }
    ],
    outputs: [
      { id: 'out_same', name: 'same', type: 'main', label: 'Unchanged' },
      { id: 'out_different', name: 'different', type: 'branch', label: 'Changed / New' }
    ],
    defaultConfig: {
      matchKey: 'id',
      compareMode: 'deep'
    }
  },
  {
    type: 'condition_validator',
    name: 'Data Schema Validator',
    description: 'Validates input payload against required fields and regex formats. Branches to Valid or Invalid ports.',
    category: 'Condition',
    icon: 'CheckSquare',
    accentColor: '#059669',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Payload' }],
    outputs: [
      { id: 'out_valid', name: 'valid', type: 'main', label: 'Valid Payload' },
      { id: 'out_invalid', name: 'invalid', type: 'branch', label: 'Invalid / Errors' }
    ],
    defaultConfig: {
      requiredFields: ['email', 'name'],
      allowEmptyStrings: false
    }
  },
  {
    type: 'condition_rate_limit',
    name: 'Rate Limiter & Throttle',
    description: 'Throttles incoming execution rate per client or IP address, routing allowed vs rate-limited events.',
    category: 'Condition',
    icon: 'Gauge',
    accentColor: '#e11d48',
    inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Request' }],
    outputs: [
      { id: 'out_allowed', name: 'allowed', type: 'main', label: 'Within Limit' },
      { id: 'out_blocked', name: 'blocked', type: 'branch', label: 'Throttled (429)' }
    ],
    defaultConfig: {
      maxRequests: 60,
      windowSeconds: 60,
      keyField: 'ip'
    }
  }
];
