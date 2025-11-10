# n8n Validation Expert

## Purpose
Expert guide for interpreting and fixing n8n validation errors, understanding validation profiles, and ensuring workflow reliability.

## When to Use
- Workflow execution fails with validation errors
- Need to understand validation error messages
- Setting up data validation
- Troubleshooting node configuration issues

## Common Validation Error Types

### 1. Required Field Missing

**Error Message**:
```
"Field 'X' is required but was not provided"
```

**Causes**:
- Previous node didn't output expected field
- Field name typo in expression
- Conditional logic skipped data

**Solutions**:
```javascript
// Option 1: Provide default value
{{ $json.field ?? 'default_value' }}

// Option 2: Check field exists
{{ $json.hasOwnProperty('field') ? $json.field : '' }}

// Option 3: Add IF node before
IF ($json.field exists) → Continue → Skip
```

### 2. Invalid Data Type

**Error Message**:
```
"Expected number but got string"
"Expected string but got object"
```

**Solutions**:
```javascript
// String to Number
{{ parseInt($json.value) }}
{{ parseFloat($json.price) }}
{{ Number($json.count) }}

// Number to String
{{ String($json.id) }}
{{ $json.amount.toString() }}

// Object to String
{{ JSON.stringify($json.data) }}

// String to Object
{{ JSON.parse($json.jsonString) }}

// Array to String
{{ $json.items.join(', ') }}

// String to Array
{{ $json.csv.split(',') }}
```

### 3. Expression Syntax Error

**Error Message**:
```
"Invalid expression: ..."
"Unexpected token"
```

**Common Mistakes**:
```javascript
// ❌ Wrong
{{ $json.field }}  // Missing closing }}
{{$json.field}}   // No space after {{
{{ json.field }}  // Missing $

// ✅ Correct
{{ $json.field }}
{{ $json["field-with-dash"] }}
{{ $json.nested.field }}
```

### 4. Undefined Field Access

**Error Message**:
```
"Cannot read property 'X' of undefined"
"Cannot read property 'X' of null"
```

**Solutions**:
```javascript
// Option 1: Optional chaining
{{ $json.user?.name ?? 'Unknown' }}

// Option 2: Check existence
{{ $json.data && $json.data.field ? $json.data.field : 'default' }}

// Option 3: Safe access
{{ $json.items?.[0]?.name }}
```

### 5. Array Operation Errors

**Error Message**:
```
"map is not a function"
"Cannot access index of undefined"
```

**Solutions**:
```javascript
// Ensure it's an array
{{ Array.isArray($json.items) ? $json.items : [$json.items] }}

// Safe array access
{{ ($json.items || []).map(item => item.name) }}

// Check array length
{{ $json.items?.length > 0 ? $json.items[0] : null }}
```

## Validation Profiles

### Profile 1: API Response Validation

**Checklist**:
- [ ] Status code is 200-299
- [ ] Response contains expected fields
- [ ] Data types match expectations
- [ ] Arrays are not empty when required

**Implementation**:
```
HTTP Request
→ IF (status === 200)
→ IF (has required fields)
→ Continue
ELSE → Error Workflow
```

### Profile 2: Database Input Validation

**Checklist**:
- [ ] Required fields present
- [ ] Field lengths within limits
- [ ] Data types correct
- [ ] Foreign keys exist
- [ ] No SQL injection risks

**Implementation**:
```javascript
// Use Set node to validate
// Email format
{{ /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($json.email) }}

// Phone number
{{ /^\+?[\d\s-()]+$/.test($json.phone) }}

// Length check
{{ $json.username.length >= 3 && $json.username.length <= 20 }}
```

### Profile 3: Webhook Data Validation

**Checklist**:
- [ ] Request method correct
- [ ] Required headers present
- [ ] Body format valid (JSON/form)
- [ ] Authentication successful
- [ ] Rate limit not exceeded

**Implementation**:
```
Webhook
→ Code (validate structure)
→ IF (valid)
→ Process
ELSE → Respond (400 Bad Request)
```

## Validation Patterns

### Pattern 1: Early Validation

```
Trigger
→ Code (Validate Input) {
  if (!$json.email) throw new Error('Email required');
  if (!$json.name) throw new Error('Name required');
  return [$json];
}
→ Continue Processing
```

### Pattern 2: Validation with Set Node

```
Trigger
→ Set {
  isValid: {{ $json.email && $json.name && $json.age > 0 }}
  errors: {{ [...($json.email ? [] : ['Email missing']), ...($json.name ? [] : ['Name missing'])] }}
}
→ IF (isValid) → Process
```

### Pattern 3: Schema Validation

```javascript
// In Code node
const schema = {
  email: 'string',
  age: 'number',
  active: 'boolean'
};

const errors = [];
for (const [key, type] of Object.entries(schema)) {
  if (typeof $json[key] !== type) {
    errors.push(`${key} must be ${type}`);
  }
}

if (errors.length > 0) {
  throw new Error(errors.join(', '));
}

return [json];
```

## Error Handling Strategies

### Strategy 1: Error Trigger Node

```
Workflow
↓
[Any Node Error]
→ Error Trigger
→ Log Error (Set)
→ Notify (Slack/Email)
→ Store in Database
```

### Strategy 2: Try-Catch in Code Node

```javascript
try {
  // Risky operation
  const result = JSON.parse($json.data);
  return [{ success: true, data: result }];
} catch (error) {
  return [{
    success: false,
    error: error.message,
    originalData: $json.data
  }];
}
```

### Strategy 3: Validation Node Chain

```
Input
→ Validate Required Fields (IF)
→ Validate Data Types (Code)
→ Validate Business Rules (IF)
→ All Valid → Process
Any Fail → Error Handler
```

## Debugging Validation Issues

### Step 1: Inspect Input Data
```
Add Set node before problematic node:
- Copy all input: {{ $json }}
- Check field types: {{ typeof $json.field }}
- List all keys: {{ Object.keys($json) }}
```

### Step 2: Test Expressions Individually
```
In Set node, test each expression:
field1: {{ $json.value }}  // Does it work?
field2: {{ $json.nested.field }}  // Or this?
field3: {{ $json["complex-name"] }}  // Or this?
```

### Step 3: Check Previous Node Output
```
1. Execute previous node only
2. Check "Output" tab
3. Verify data structure matches expectations
4. Look for null/undefined values
```

### Step 4: Enable Detailed Error Messages
```
In Code nodes, add detailed logging:
console.log('Input:', JSON.stringify($input.all(), null, 2));
console.log('Field value:', $json.fieldName);
console.log('Field type:', typeof $json.fieldName);
```

## Common Validation Scenarios

### Scenario 1: Form Submission Validation
```javascript
// Code node validation
const errors = [];

// Email
if (!$json.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($json.email)) {
  errors.push('Valid email required');
}

// Phone
if (!$json.phone || !/^\+?[\d\s-()]+$/.test($json.phone)) {
  errors.push('Valid phone required');
}

// Age
if (!$json.age || $json.age < 18) {
  errors.push('Must be 18 or older');
}

if (errors.length > 0) {
  return [{ valid: false, errors }];
}

return [{ valid: true, data: $json }];
```

### Scenario 2: API Response Validation
```javascript
// Validate API response structure
const response = $json;

if (!response.success) {
  throw new Error(`API Error: ${response.message}`);
}

if (!Array.isArray(response.data)) {
  throw new Error('Expected data to be an array');
}

if (response.data.length === 0) {
  throw new Error('No data returned');
}

return response.data.map(item => ({
  id: item.id || null,
  name: item.name || 'Unknown',
  createdAt: item.created_at || new Date().toISOString()
}));
```

### Scenario 3: Database Record Validation
```javascript
// Before database insert
const record = $json;

// Check required fields
const required = ['name', 'email', 'userId'];
const missing = required.filter(field => !record[field]);

if (missing.length > 0) {
  throw new Error(`Missing required fields: ${missing.join(', ')}`);
}

// Validate data types
if (typeof record.userId !== 'number') {
  record.userId = parseInt(record.userId);
}

// Sanitize strings
record.name = record.name.trim().substring(0, 100);
record.email = record.email.toLowerCase().trim();

return [record];
```

## Validation Best Practices

### ✅ DO
- Validate early in the workflow
- Provide clear error messages
- Use default values for optional fields
- Log validation failures
- Test edge cases
- Use type coercion when appropriate
- Document validation rules

### ❌ DON'T
- Assume data always exists
- Skip validation for "trusted" sources
- Use complex nested expressions
- Ignore validation errors
- Hard-code validation rules
- Forget to handle null/undefined
- Skip testing with real data

## Quick Reference

| Error Type | Quick Fix |
|------------|-----------|
| Field missing | `{{ $json.field ?? 'default' }}` |
| Wrong type | `{{ Number($json.value) }}` |
| Undefined access | `{{ $json.field?.nested }}` |
| Array error | `{{ ($json.items || []) }}` |
| Expression syntax | Check `{{ }}` and `$json` |
| null/undefined | Add IF node or use `??` |

## Token Count
~3,664 tokens
