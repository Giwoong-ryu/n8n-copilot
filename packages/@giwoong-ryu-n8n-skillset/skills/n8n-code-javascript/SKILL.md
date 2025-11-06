# n8n Code Node JavaScript

## Purpose
Complete guide for writing JavaScript in n8n Code nodes, including $input, $json, $node, $helpers, and best practices.

## When to Use
- Custom data transformation
- Complex logic not possible with expressions
- API response processing
- Data validation and filtering
- Custom calculations

## Available Variables

### $input - Access Input Data

```javascript
// Get all input items
const items = $input.all();
// Returns: [{json: {data...}}, {json: {data...}}]

// Get first item
const first = $input.first();
// Returns: {json: {data...}}

// Get item by index
const item = $input.item(0);
// Alias for $input.all()[0]
```

**When to use**:
- Run Once mode: Process all items together
- Need to access multiple input items
- Aggregating or combining data

### $json - Current Item Data

```javascript
// In "Run Once for Each Item" mode
const name = $json.name;
const email = $json.email;

// Access nested data
const street = $json.address.street;

// Safe access
const city = $json.address?.city ?? 'Unknown';
```

**When to use**:
- Run Once for Each Item mode
- Processing items individually
- Simple transformations

### $node - Node Information

```javascript
// Get data from specific node
const webhookData = $node["Webhook"].json;
const httpResponse = $node["HTTP Request"].json;

// Get parameter value
const nodeParam = $node.parameter;

// Access binary data
const binary = $node["HTTP Request"].binary;
```

**When to use**:
- Need data from multiple input nodes
- Accessing specific node outputs
- Working with binary data

### $workflow - Workflow Metadata

```javascript
// Workflow information
const workflowId = $workflow.id;
const workflowName = $workflow.name;
const isActive = $workflow.active;

// Useful for logging
console.log(`Workflow ${workflowName} (${workflowId})`);
```

### $helpers - Utility Functions

```javascript
// HTTP requests
const response = await $helpers.httpRequest({
  method: 'GET',
  url: 'https://api.example.com/data',
  headers: { 'Authorization': 'Bearer token' }
});

// Get credentials
const credentials = await $helpers.getCredentials('myCredential');

// Return error
$helpers.returnJsonArray([{ error: 'Something went wrong' }]);
```

## Execution Modes

### Mode 1: Run Once for All Items

```javascript
// Process all items together
const items = $input.all();

// Transform all items
const transformed = items.map(item => ({
  ...item.json,
  processed: true
}));

// Return all items
return transformed.map(data => ({
  json: data
}));
```

**Use Cases**:
- Aggregating data (sum, average, count)
- Sorting items
- Removing duplicates
- Batch operations

### Mode 2: Run Once for Each Item

```javascript
// Access current item directly
const name = $json.name;
const email = $json.email;

// Transform current item
const transformed = {
  fullName: name,
  contact: email,
  timestamp: new Date().toISOString()
};

// Return single item
return {
  json: transformed
};
```

**Use Cases**:
- Individual item transformation
- Item-specific validation
- Simple calculations
- Field mapping

## Common Patterns

### Pattern 1: Data Transformation

```javascript
// Input: [{json: {firstName: 'John', lastName: 'Doe'}}]
const items = $input.all();

return items.map(item => ({
  json: {
    fullName: `${item.json.firstName} ${item.json.lastName}`,
    email: `${item.json.firstName.toLowerCase()}@example.com`,
    createdAt: new Date().toISOString()
  }
}));

// Output: [{json: {fullName: 'John Doe', email: 'john@example.com', ...}}]
```

### Pattern 2: Filtering Items

```javascript
const items = $input.all();

// Filter based on condition
const filtered = items.filter(item =>
  item.json.age > 18 && item.json.active === true
);

return filtered;
```

### Pattern 3: Aggregation

```javascript
const items = $input.all();

// Calculate total
const total = items.reduce((sum, item) => sum + item.json.amount, 0);

// Count by category
const counts = items.reduce((acc, item) => {
  const category = item.json.category;
  acc[category] = (acc[category] || 0) + 1;
  return acc;
}, {});

return [{
  json: {
    total,
    counts,
    itemCount: items.length
  }
}];
```

### Pattern 4: API Data Processing

```javascript
const items = $input.all();

// Process API response
const processed = items.flatMap(item => {
  const apiResponse = item.json;

  // Extract nested data
  if (Array.isArray(apiResponse.data)) {
    return apiResponse.data.map(record => ({
      json: {
        id: record.id,
        name: record.attributes.name,
        createdAt: record.attributes.created_at
      }
    }));
  }

  return [];
});

return processed;
```

### Pattern 5: Error Handling

```javascript
const items = $input.all();

return items.map(item => {
  try {
    // Risky operation
    const parsed = JSON.parse(item.json.data);

    return {
      json: {
        success: true,
        data: parsed
      }
    };
  } catch (error) {
    return {
      json: {
        success: false,
        error: error.message,
        originalData: item.json.data
      }
    };
  }
});
```

## Working with Dates

```javascript
// Current timestamp
const now = new Date();
const isoString = now.toISOString();

// Parse date
const date = new Date($json.dateString);

// Format date
const formatted = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}).format(date);

// Date calculations
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const daysAgo = (date) => {
  const diff = Date.now() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};
```

## Working with Arrays

```javascript
// Map
const names = items.map(item => item.json.name);

// Filter
const active = items.filter(item => item.json.active);

// Find
const found = items.find(item => item.json.id === 123);

// Reduce
const sum = items.reduce((total, item) => total + item.json.value, 0);

// Sort
const sorted = items.sort((a, b) => a.json.name.localeCompare(b.json.name));

// Unique values
const unique = [...new Set(items.map(item => item.json.category))];

// Flatten nested arrays
const flattened = items.flatMap(item => item.json.tags);

// Group by
const grouped = items.reduce((groups, item) => {
  const key = item.json.category;
  if (!groups[key]) groups[key] = [];
  groups[key].push(item);
  return groups;
}, {});
```

## Working with Objects

```javascript
// Merge objects
const merged = { ...obj1, ...obj2 };

// Pick specific fields
const picked = {
  name: $json.name,
  email: $json.email
};

// Omit fields
const { password, ...safe } = $json;

// Rename fields
const renamed = {
  fullName: $json.name,
  contactEmail: $json.email
};

// Nested update
const updated = {
  ...$json,
  address: {
    ...$json.address,
    city: 'New York'
  }
};

// Check property exists
const hasEmail = $json.hasOwnProperty('email');
const hasEmail2 = 'email' in $json;

// Get all keys
const keys = Object.keys($json);

// Get all values
const values = Object.values($json);

// Convert to entries
const entries = Object.entries($json);
```

## Advanced Techniques

### Async/Await with HTTP Requests

```javascript
const items = $input.all();

const results = [];

for (const item of items) {
  try {
    const response = await $helpers.httpRequest({
      method: 'GET',
      url: `https://api.example.com/users/${item.json.id}`,
      headers: { 'Authorization': 'Bearer token' }
    });

    results.push({
      json: {
        ...item.json,
        userData: response
      }
    });
  } catch (error) {
    results.push({
      json: {
        ...item.json,
        error: error.message
      }
    });
  }
}

return results;
```

### Parallel Requests

```javascript
const items = $input.all();

const promises = items.map(item =>
  $helpers.httpRequest({
    method: 'GET',
    url: `https://api.example.com/data/${item.json.id}`
  }).catch(error => ({ error: error.message }))
);

const responses = await Promise.all(promises);

return responses.map((response, index) => ({
  json: {
    ...items[index].json,
    apiData: response
  }
}));
```

### Custom Validation

```javascript
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^\+?[\d\s-()]+$/.test(phone);
}

const items = $input.all();

return items.map(item => {
  const errors = [];

  if (!validateEmail(item.json.email)) {
    errors.push('Invalid email');
  }

  if (!validatePhone(item.json.phone)) {
    errors.push('Invalid phone');
  }

  return {
    json: {
      ...item.json,
      isValid: errors.length === 0,
      errors
    }
  };
});
```

## Performance Tips

### ✅ DO
```javascript
// Use map instead of forEach + push
const result = items.map(item => transform(item));

// Cache array length
const len = items.length;
for (let i = 0; i < len; i++) { }

// Use early return
if (!$json.data) return [{ json: { error: 'No data' } }];

// Avoid nested loops when possible
const lookup = items.reduce((map, item) => {
  map[item.json.id] = item;
  return map;
}, {});
```

### ❌ DON'T
```javascript
// Don't modify input items directly
items[0].json.modified = true; // ❌

// Don't use synchronous sleep
for (let i = 0; i < 1000000; i++) {} // ❌

// Don't forget to return items
// return; // ❌ Missing return

// Don't use var
var x = 1; // ❌ Use const/let
```

## Debugging

```javascript
// Log to execution data
console.log('Debug:', $json);

// Inspect item structure
console.log('Keys:', Object.keys($json));
console.log('Type:', typeof $json.field);

// Check all input items
console.log('Items:', JSON.stringify($input.all(), null, 2));

// Add debug info to output
return [{
  json: {
    debug: {
      input: $json,
      itemCount: $input.all().length,
      nodeData: $node
    },
    ...yourData
  }
}];
```

## Token Count
~4,027 tokens
