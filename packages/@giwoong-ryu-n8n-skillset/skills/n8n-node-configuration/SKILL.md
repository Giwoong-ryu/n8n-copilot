# n8n Node Configuration

## Purpose
Comprehensive guide for configuring n8n nodes correctly, understanding operation-specific attributes and dependencies.

## When to Use
- Setting up nodes for the first time
- Troubleshooting node configuration errors
- Understanding operation-specific requirements
- Optimizing node performance

## Common Node Types

### 1. HTTP Request Node

**Basic Configuration**:
```
Method: GET/POST/PUT/DELETE/PATCH
URL: https://api.example.com/endpoint
Authentication: None/Basic/OAuth2/Header
```

**Operation Dependencies**:
- **GET**: Query parameters, Headers
- **POST/PUT**: Body (JSON/Form/Raw), Content-Type header
- **Authentication**: Credentials must be set in credentials

**Common Issues**:
- ❌ Missing Content-Type header for POST
- ❌ Incorrect authentication method
- ✅ Always test with simple request first

### 2. Database Nodes (Supabase, PostgreSQL, MySQL)

**Insert Operation**:
```
Required:
- Table name
- Columns (mapping to input data)
- Values (from previous nodes)

Optional:
- Return fields
- On conflict behavior
```

**Update Operation**:
```
Required:
- Table name
- WHERE condition
- Columns to update
- New values

Important:
- Always include WHERE clause
- Use expression for dynamic values
```

**Query Operation**:
```
Required:
- SQL query or filters
- Return all/limit

Dependencies:
- Query depends on table structure
- Use parameterized queries
```

### 3. Code Node (JavaScript)

**Configuration**:
```javascript
// Input Data Access
const items = $input.all(); // All input items
const firstItem = $input.first(); // First item only
const json = $json; // Current item data

// Available Variables
$node // Current node info
$workflow // Workflow metadata
$helpers // Utility functions

// Output
return items; // Must return array of items
```

**Operation Modes**:
- **Run Once**: Process all items together
- **Run Once for Each Item**: Process items individually

**Dependencies**:
- Depends on input structure from previous nodes
- Must return items array
- Console.log won't show in UI (use $node)

### 4. Set Node

**Purpose**: Transform and structure data

**Field Configurations**:
```
String: {{ $json.field }}
Number: {{ parseInt($json.value) }}
Boolean: {{ $json.active === 'true' }}
Object: { "key": "{{ $json.value }}" }
Array: {{ $json.items.split(',') }}
```

**Common Patterns**:
```
# Rename fields
oldName → newName: {{ $json.oldName }}

# Calculate values
total: {{ $json.price * $json.quantity }}

# Format dates
formatted: {{ new Date($json.timestamp).toISOString() }}

# Conditional values
status: {{ $json.count > 0 ? 'active' : 'inactive' }}
```

### 5. IF Node

**Configuration**:
```
Conditions:
- String: equals/contains/starts with
- Number: equals/greater than/less than
- Boolean: is true/is false
- Exists: field exists/is empty

Combine Rules:
- ALL (AND logic)
- ANY (OR logic)
```

**Best Practices**:
```
✅ Use meaningful output names (true/false)
✅ Chain multiple IF nodes for complex logic
✅ Always handle both true and false branches
❌ Don't nest too many IFs (use Switch instead)
```

### 6. Loop Over Items

**Configuration**:
```
Input:
- Items to loop (array from previous node)

Output:
- Processes one item at a time
- Loop exits when all items processed

Dependencies:
- Requires array input
- Each iteration gets single item
```

**Common Usage**:
```
Pattern:
Previous Node (Array) → Loop Over Items → Process → HTTP Request → Loop End
```

### 7. Merge Node

**Operations**:
```
Append: Combine all inputs sequentially
Merge By Position: Merge items at same index
Merge By Key: Match items by field value

Configuration Dependencies:
- Merge By Key requires:
  * Input 1 field name
  * Input 2 field name
  * Match mode (keepMatches/keepNonMatches)
```

### 8. Split In Batches

**Configuration**:
```
Required:
- Batch Size: Number of items per batch

Output:
- Processes items in batches
- Automatically loops until all processed

Use Cases:
- API rate limiting
- Database bulk operations
- Memory optimization
```

## Node Configuration Checklist

### Before Connecting Nodes
- [ ] Check required fields
- [ ] Verify data format matches expected input
- [ ] Set up credentials if needed
- [ ] Review operation-specific requirements

### Testing Node Configuration
- [ ] Execute node individually
- [ ] Check output data structure
- [ ] Verify all required fields have values
- [ ] Test error scenarios

### Common Configuration Errors

**Error**: "Required field missing"
```
Solution:
1. Check node operation requirements
2. Verify previous node provides needed data
3. Add Set node to transform data if needed
```

**Error**: "Invalid expression"
```
Solution:
1. Check {{ }} syntax
2. Verify field names match input
3. Use $json.field for current item
```

**Error**: "Cannot read property of undefined"
```
Solution:
1. Check if field exists: {{ $json.field ?? 'default' }}
2. Add IF node to check data existence
3. Use optional chaining in expressions
```

## Operation-Specific Attributes

### HTTP Request
| Operation | Required Attributes | Optional |
|-----------|-------------------|----------|
| GET | URL | Query params, Headers |
| POST | URL, Body | Headers, Auth |
| PUT | URL, Body, ID | Headers, Auth |
| DELETE | URL, ID | Headers, Auth |

### Database Operations
| Operation | Required | Dependencies |
|-----------|----------|--------------|
| Insert | Table, Columns, Values | - |
| Update | Table, WHERE, Values | Must have WHERE |
| Delete | Table, WHERE | Must have WHERE |
| Query | Table or SQL | Return fields |

### AI Nodes (OpenAI, Anthropic)
| Operation | Required | Notes |
|-----------|----------|-------|
| Chat | Model, Messages | System prompt optional |
| Complete | Model, Prompt | Temperature affects creativity |
| Embed | Model, Input | For vector databases |

## Best Practices

### Configuration Management
```
✅ Use environment variables for API keys
✅ Name nodes descriptively
✅ Document complex expressions with notes
✅ Test each node before chaining
✅ Use error workflows for critical nodes
```

### Performance Optimization
```
✅ Batch operations when possible
✅ Use appropriate node execution order
✅ Minimize HTTP requests
✅ Cache frequently accessed data
✅ Use queue nodes for heavy operations
```

### Debugging Tips
```
1. Add Set nodes to inspect data
2. Use sticky notes for documentation
3. Execute nodes individually
4. Check execution data tab
5. Review error messages carefully
```

## Token Count
~4,258 tokens
