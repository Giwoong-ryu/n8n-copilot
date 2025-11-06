# n8n MCP Tools Expert

## Purpose
Expert guide for using n8n Model Context Protocol (MCP) tools: search_nodes, validate, and create workflows programmatically.

## When to Use
- Searching for specific nodes in n8n
- Validating workflow configurations
- Creating workflows programmatically
- Automating workflow management
- Building n8n integrations

## Available MCP Tools

### 1. search_nodes

**Purpose**: Find n8n nodes by functionality, operation, or name

**Syntax**:
```javascript
search_nodes({
  query: "search term",
  category: "category_name",  // optional
  limit: 10                   // optional
})
```

**Parameters**:
- `query` (string, required): Search term for nodes
- `category` (string, optional): Filter by category (Core, Communication, Database, etc.)
- `limit` (number, optional): Maximum results (default: 10)

**Examples**:

```javascript
// Search for HTTP nodes
search_nodes({ query: "http request" })

// Search in specific category
search_nodes({
  query: "database",
  category: "Database"
})

// Limit results
search_nodes({
  query: "transform",
  limit: 5
})

// Search for specific operations
search_nodes({ query: "send email" })
search_nodes({ query: "webhook" })
search_nodes({ query: "json" })
```

**Response Format**:
```json
{
  "nodes": [
    {
      "name": "HTTP Request",
      "displayName": "HTTP Request",
      "description": "Makes an HTTP request and returns the response data",
      "category": "Core",
      "operations": ["GET", "POST", "PUT", "DELETE", "PATCH"],
      "credentials": ["httpBasicAuth", "oAuth2", "headerAuth"]
    }
  ]
}
```

**Use Cases**:
- Finding the right node for a task
- Discovering node capabilities
- Understanding available operations
- Checking required credentials

### 2. validate

**Purpose**: Validate n8n workflow configuration and node settings

**Syntax**:
```javascript
validate({
  workflow: workflowObject,
  strict: true  // optional
})
```

**Parameters**:
- `workflow` (object, required): Workflow JSON configuration
- `strict` (boolean, optional): Enable strict validation (default: false)

**Examples**:

```javascript
// Basic validation
validate({
  workflow: {
    nodes: [
      {
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        position: [250, 300],
        parameters: {
          path: "test-webhook"
        }
      }
    ],
    connections: {}
  }
})

// Strict validation (checks all requirements)
validate({
  workflow: myWorkflow,
  strict: true
})
```

**Response Format**:
```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    {
      "node": "HTTP Request",
      "message": "Missing authentication credentials",
      "severity": "warning"
    }
  ]
}
```

**Common Validation Errors**:

1. **Missing Required Fields**
```json
{
  "error": "Node 'HTTP Request' missing required parameter 'url'"
}
```

2. **Invalid Node Type**
```json
{
  "error": "Unknown node type 'invalid-node'"
}
```

3. **Broken Connections**
```json
{
  "error": "Connection references non-existent node 'Node123'"
}
```

4. **Invalid Parameter Values**
```json
{
  "error": "Parameter 'method' must be one of: GET, POST, PUT, DELETE"
}
```

### 3. create

**Purpose**: Create n8n workflows programmatically

**Syntax**:
```javascript
create({
  name: "Workflow Name",
  nodes: [...],
  connections: {...},
  settings: {...},  // optional
  active: false     // optional
})
```

**Parameters**:
- `name` (string, required): Workflow name
- `nodes` (array, required): Array of node configurations
- `connections` (object, required): Node connections
- `settings` (object, optional): Workflow settings
- `active` (boolean, optional): Activate immediately (default: false)

**Node Structure**:
```javascript
{
  name: "Unique Node Name",
  type: "n8n-nodes-base.nodeName",
  typeVersion: 1,
  position: [x, y],
  parameters: {
    // Node-specific parameters
  },
  credentials: {
    // If required
  }
}
```

**Connection Structure**:
```javascript
{
  "Source Node": {
    "main": [
      [
        {
          "node": "Target Node",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
}
```

**Examples**:

#### Example 1: Simple Webhook to Slack
```javascript
create({
  name: "Webhook to Slack",
  nodes: [
    {
      name: "Webhook",
      type: "n8n-nodes-base.webhook",
      position: [250, 300],
      parameters: {
        path: "slack-notification",
        httpMethod: "POST",
        responseMode: "onReceived"
      }
    },
    {
      name: "Slack",
      type: "n8n-nodes-base.slack",
      position: [450, 300],
      parameters: {
        operation: "post",
        channel: "#general",
        text: "={{ $json.message }}"
      },
      credentials: {
        slackApi: {
          id: "1",
          name: "Slack account"
        }
      }
    }
  ],
  connections: {
    "Webhook": {
      "main": [[{ "node": "Slack", "type": "main", "index": 0 }]]
    }
  },
  active: false
})
```

#### Example 2: HTTP API to Database
```javascript
create({
  name: "API to Database",
  nodes: [
    {
      name: "Schedule",
      type: "n8n-nodes-base.scheduleTrigger",
      position: [250, 300],
      parameters: {
        rule: {
          interval: [{ field: "hours", hoursInterval: 1 }]
        }
      }
    },
    {
      name: "HTTP Request",
      type: "n8n-nodes-base.httpRequest",
      position: [450, 300],
      parameters: {
        url: "https://api.example.com/data",
        method: "GET",
        responseFormat: "json"
      }
    },
    {
      name: "Set",
      type: "n8n-nodes-base.set",
      position: [650, 300],
      parameters: {
        values: {
          string: [
            {
              name: "processed_at",
              value: "={{ new Date().toISOString() }}"
            }
          ]
        }
      }
    },
    {
      name: "Supabase",
      type: "n8n-nodes-base.supabase",
      position: [850, 300],
      parameters: {
        operation: "insert",
        table: "api_data",
        columns: "id,data,processed_at"
      },
      credentials: {
        supabaseApi: {
          id: "2",
          name: "Supabase account"
        }
      }
    }
  ],
  connections: {
    "Schedule": {
      "main": [[{ "node": "HTTP Request", "type": "main", "index": 0 }]]
    },
    "HTTP Request": {
      "main": [[{ "node": "Set", "type": "main", "index": 0 }]]
    },
    "Set": {
      "main": [[{ "node": "Supabase", "type": "main", "index": 0 }]]
    }
  }
})
```

#### Example 3: Error Handling Workflow
```javascript
create({
  name: "With Error Handling",
  nodes: [
    {
      name: "Webhook",
      type: "n8n-nodes-base.webhook",
      position: [250, 300],
      parameters: { path: "process" }
    },
    {
      name: "Process Data",
      type: "n8n-nodes-base.code",
      position: [450, 300],
      parameters: {
        jsCode: `
          const items = $input.all();
          return items.map(item => ({
            json: {
              processed: true,
              data: item.json
            }
          }));
        `
      }
    },
    {
      name: "Error Trigger",
      type: "n8n-nodes-base.errorTrigger",
      position: [450, 500],
      parameters: {}
    },
    {
      name: "Send Error Notification",
      type: "n8n-nodes-base.slack",
      position: [650, 500],
      parameters: {
        operation: "post",
        channel: "#errors",
        text: "={{ $json.error.message }}"
      }
    }
  ],
  connections: {
    "Webhook": {
      "main": [[{ "node": "Process Data", "type": "main", "index": 0 }]]
    },
    "Error Trigger": {
      "main": [[{ "node": "Send Error Notification", "type": "main", "index": 0 }]]
    }
  }
})
```

## Advanced Patterns

### Pattern 1: Dynamic Workflow Generation

```javascript
// Generate workflow based on user input
function createCustomWorkflow(config) {
  const nodes = [
    {
      name: "Trigger",
      type: `n8n-nodes-base.${config.triggerType}`,
      position: [250, 300],
      parameters: config.triggerParams
    }
  ];

  // Add processing nodes based on config
  config.processors.forEach((processor, index) => {
    nodes.push({
      name: processor.name,
      type: processor.type,
      position: [450 + (index * 200), 300],
      parameters: processor.params
    });
  });

  // Generate connections
  const connections = {};
  for (let i = 0; i < nodes.length - 1; i++) {
    connections[nodes[i].name] = {
      main: [[{
        node: nodes[i + 1].name,
        type: "main",
        index: 0
      }]]
    };
  }

  return create({
    name: config.workflowName,
    nodes,
    connections
  });
}
```

### Pattern 2: Workflow Templates

```javascript
const templates = {
  emailToSlack: (config) => create({
    name: "Email to Slack Forwarder",
    nodes: [
      {
        name: "Email Trigger",
        type: "n8n-nodes-base.emailReadImap",
        position: [250, 300],
        parameters: {
          mailbox: "INBOX",
          options: { markSeen: true }
        },
        credentials: config.emailCredentials
      },
      {
        name: "Filter",
        type: "n8n-nodes-base.if",
        position: [450, 300],
        parameters: {
          conditions: {
            string: [{
              value1: "={{ $json.from }}",
              operation: "contains",
              value2: config.allowedSender
            }]
          }
        }
      },
      {
        name: "Slack",
        type: "n8n-nodes-base.slack",
        position: [650, 300],
        parameters: {
          operation: "post",
          channel: config.slackChannel,
          text: "={{ $json.subject }}\n\n={{ $json.text }}"
        },
        credentials: config.slackCredentials
      }
    ],
    connections: {
      "Email Trigger": {
        "main": [[{ "node": "Filter", "type": "main", "index": 0 }]]
      },
      "Filter": {
        "main": [[{ "node": "Slack", "type": "main", "index": 0 }]]
      }
    }
  })
};
```

### Pattern 3: Workflow Validation Before Creation

```javascript
async function createValidatedWorkflow(workflowConfig) {
  // First, validate
  const validation = await validate({
    workflow: workflowConfig,
    strict: true
  });

  if (!validation.valid) {
    console.error("Validation errors:", validation.errors);
    return {
      success: false,
      errors: validation.errors
    };
  }

  // Show warnings
  if (validation.warnings.length > 0) {
    console.warn("Validation warnings:", validation.warnings);
  }

  // Create workflow
  const result = await create(workflowConfig);

  return {
    success: true,
    workflowId: result.id,
    warnings: validation.warnings
  };
}
```

## Best Practices

### ✅ DO
- Always validate workflows before creation
- Use descriptive node names
- Add error handling nodes
- Test workflows before activating
- Document complex workflows
- Use environment variables for credentials
- Version control workflow JSON

### ❌ DON'T
- Don't hardcode sensitive data
- Don't skip validation
- Don't create overly complex workflows
- Don't forget error handling
- Don't activate workflows immediately
- Don't reuse node names in same workflow

## Common Use Cases

### 1. Bulk Workflow Creation
```javascript
const workflowConfigs = [
  { name: "Monitor API 1", endpoint: "/api1" },
  { name: "Monitor API 2", endpoint: "/api2" }
];

workflowConfigs.forEach(config => {
  create({
    name: config.name,
    nodes: generateMonitoringNodes(config),
    connections: generateConnections()
  });
});
```

### 2. Workflow Migration
```javascript
// Export from one instance
const existingWorkflow = await getWorkflow(workflowId);

// Import to another instance
const validated = await validate({ workflow: existingWorkflow });
if (validated.valid) {
  await create(existingWorkflow);
}
```

### 3. Template-Based Workflows
```javascript
// User selects template and fills parameters
const template = templates[userSelection];
const workflow = template(userParameters);
await createValidatedWorkflow(workflow);
```

## Troubleshooting

### Issue: "Node type not found"
**Solution**: Use `search_nodes` to find correct node type
```javascript
const results = await search_nodes({ query: "desired functionality" });
console.log(results.nodes[0].type); // Use this type
```

### Issue: "Invalid connection"
**Solution**: Ensure node names match exactly
```javascript
// ❌ Wrong
connections: {
  "webhook": { ... }  // lowercase
}

// ✅ Correct
connections: {
  "Webhook": { ... }  // matches node name exactly
}
```

### Issue: "Missing required parameters"
**Solution**: Use `search_nodes` to see required parameters
```javascript
const nodeInfo = await search_nodes({ query: "node name" });
console.log(nodeInfo.nodes[0].parameters); // See required params
```

## Token Count
~3,188 tokens
