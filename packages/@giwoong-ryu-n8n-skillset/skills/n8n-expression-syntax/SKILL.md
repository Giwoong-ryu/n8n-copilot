# n8n Expression Syntax

## Purpose
Comprehensive guide for using {{ }} expressions in n8n, including webhook data access, multi-input handling, and error fixing.

## When to Use
- Setting node parameters dynamically
- Accessing data from previous nodes
- Transforming data inline
- Conditional values
- String manipulation

## Basic Syntax

### Expression Format
```javascript
// Basic format
{{ $json.fieldName }}

// With spaces (recommended)
{{ $json.fieldName }}

// Multiple expressions in one field
{{ $json.firstName }} {{ $json.lastName }}

// Inside strings
"Hello {{ $json.name }}, welcome!"
```

## Data Access

### Current Item ($json)

```javascript
// Simple field
{{ $json.name }}

// Nested field
{{ $json.user.address.city }}

// Array access
{{ $json.items[0] }}
{{ $json.tags[2] }}

// Dynamic array access
{{ $json.data[$json.index] }}
```

### Previous Node Data ($node)

```javascript
// Access specific node
{{ $node["HTTP Request"].json.data }}
{{ $node["Webhook"].json.body }}

// Multiple nodes
{{ $node["Node 1"].json.value1 + $node["Node 2"].json.value2 }}

// Node with spaces in name
{{ $node["My Custom Node"].json.result }}
```

### Input Data ($input)

```javascript
// First item from input
{{ $input.first().json.name }}

// All items (returns array)
{{ $input.all() }}

// Item by index
{{ $input.item(0).json.field }}
```

## Webhook Data Access

### GET Request Parameters

```javascript
// Query parameters
{{ $json.query.param1 }}
{{ $json.query.search }}

// Example: /webhook?search=test&page=1
{{ $json.query.search }}  // "test"
{{ $json.query.page }}    // "1"
```

### POST Request Body

```javascript
// JSON body
{{ $json.body.name }}
{{ $json.body.email }}
{{ $json.body.data.nested }}

// Form data
{{ $json.body["field-name"] }}
{{ $json.body.username }}
```

### Headers

```javascript
// Access headers
{{ $json.headers.authorization }}
{{ $json.headers["content-type"] }}
{{ $json.headers["x-custom-header"] }}

// User agent
{{ $json.headers["user-agent"] }}
```

### Full Request Data

```javascript
// Method
{{ $json.method }}  // "GET", "POST", etc.

// URL
{{ $json.url }}
{{ $json.path }}

// IP Address
{{ $json.headers["x-forwarded-for"] || $json.headers["x-real-ip"] }}
```

## Multi-Input Handling

### Merge Node Output

```javascript
// Access merged data
{{ $json.input1Field }}  // From input 1
{{ $json.input2Field }}  // From input 2

// When merged by position
{{ $json.mergedData }}

// When merged by key
{{ $json.matchedField }}
```

### Multiple Paths

```javascript
// Data from IF node branches
// True branch
{{ $node["IF"].json.trueData }}

// False branch
{{ $node["IF1"].json.falseData }}

// Access original data before split
{{ $node["Before IF"].json.originalValue }}
```

## String Operations

```javascript
// Concatenation
{{ $json.firstName + " " + $json.lastName }}

// Template literals
{{ `Hello ${$json.name}, you are ${$json.age} years old` }}

// Uppercase/Lowercase
{{ $json.name.toUpperCase() }}
{{ $json.email.toLowerCase() }}

// Trim whitespace
{{ $json.text.trim() }}

// Replace
{{ $json.text.replace("old", "new") }}
{{ $json.email.replace(/@.*/, "@newdomain.com") }}

// Substring
{{ $json.text.substring(0, 10) }}
{{ $json.text.slice(0, 10) }}

// Split
{{ $json.csv.split(",") }}
{{ $json.tags.split(";") }}

// Check contains
{{ $json.text.includes("search") }}

// Starts with / Ends with
{{ $json.filename.startsWith("test") }}
{{ $json.url.endsWith(".pdf") }}
```

## Number Operations

```javascript
// Basic math
{{ $json.price * $json.quantity }}
{{ $json.total - $json.discount }}
{{ $json.sum / $json.count }}
{{ $json.base + $json.increment }}

// Rounding
{{ Math.round($json.value) }}
{{ Math.floor($json.price) }}
{{ Math.ceil($json.amount) }}

// To fixed decimals
{{ $json.price.toFixed(2) }}
{{ Number($json.amount).toFixed(3) }}

// Parse strings to numbers
{{ parseInt($json.stringNumber) }}
{{ parseFloat($json.decimalString) }}
{{ Number($json.value) }}

// Min/Max
{{ Math.min($json.value1, $json.value2) }}
{{ Math.max($json.price, 0) }}

// Absolute value
{{ Math.abs($json.difference) }}

// Power
{{ Math.pow($json.base, 2) }}
{{ $json.value ** 2 }}
```

## Date Operations

```javascript
// Current date/time
{{ new Date().toISOString() }}
{{ new Date().toLocaleString() }}
{{ Date.now() }}

// Parse date string
{{ new Date($json.dateString) }}

// Format date
{{ new Date($json.date).toLocaleDateString() }}
{{ new Date($json.date).toLocaleTimeString() }}

// Get date parts
{{ new Date($json.date).getFullYear() }}
{{ new Date($json.date).getMonth() + 1 }}  // Month is 0-indexed
{{ new Date($json.date).getDate() }}
{{ new Date($json.date).getHours() }}

// Add days
{{ new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }}

// Subtract days
{{ new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }}
```

## Conditional Expressions

```javascript
// Ternary operator
{{ $json.age >= 18 ? "Adult" : "Minor" }}
{{ $json.status === "active" ? "✅" : "❌" }}

// Nullish coalescing
{{ $json.name ?? "Unknown" }}
{{ $json.value ?? 0 }}

// Logical OR default
{{ $json.customValue || "default" }}

// Check existence
{{ $json.field ? $json.field : "N/A" }}

// Multiple conditions
{{ $json.score >= 90 ? "A" : $json.score >= 80 ? "B" : $json.score >= 70 ? "C" : "F" }}

// Boolean logic
{{ $json.active && $json.verified }}
{{ $json.role === "admin" || $json.role === "moderator" }}
```

## Array Operations

```javascript
// Array length
{{ $json.items.length }}

// Join array
{{ $json.tags.join(", ") }}
{{ $json.names.join(" | ") }}

// Access first/last
{{ $json.items[0] }}
{{ $json.items[$json.items.length - 1] }}

// Check if array
{{ Array.isArray($json.data) }}

// Map (returns array)
{{ $json.users.map(u => u.name) }}

// Filter
{{ $json.items.filter(item => item.active) }}

// Find
{{ $json.users.find(u => u.id === 123) }}

// Some/Every
{{ $json.items.some(item => item.price > 100) }}
{{ $json.items.every(item => item.inStock) }}
```

## Object Operations

```javascript
// Check property exists
{{ $json.hasOwnProperty("email") }}
{{ "email" in $json }}

// Get keys
{{ Object.keys($json) }}

// Get values
{{ Object.values($json) }}

// Stringify object
{{ JSON.stringify($json.data) }}
{{ JSON.stringify($json, null, 2) }}

// Parse JSON string
{{ JSON.parse($json.jsonString) }}

// Merge objects
{{ Object.assign({}, $json, {newField: "value"}) }}
```

## Safe Access (Preventing Errors)

```javascript
// Optional chaining
{{ $json.user?.address?.city }}
{{ $json.items?.[0]?.name }}
{{ $json.data?.value ?? "default" }}

// Check before access
{{ $json.data && $json.data.field ? $json.data.field : "N/A" }}

// Default values
{{ $json.name ?? "Anonymous" }}
{{ $json.count || 0 }}

// Ensure type
{{ String($json.value ?? "") }}
{{ Number($json.amount ?? 0) }}
{{ Boolean($json.active ?? false) }}
```

## Regular Expressions

```javascript
// Test pattern
{{ /^[A-Z]/.test($json.name) }}  // Starts with uppercase
{{ /\d+/.test($json.text) }}     // Contains digits

// Extract matches
{{ $json.email.match(/@(.+)$/)?.[1] }}  // Domain from email

// Replace with regex
{{ $json.text.replace(/\s+/g, "-") }}  // Spaces to dashes
{{ $json.phone.replace(/\D/g, "") }}   // Remove non-digits

// Validate formats
{{ /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($json.email) }}  // Email
{{ /^\+?\d{10,}$/.test($json.phone) }}                 // Phone
{{ /^https?:\/\/.+/.test($json.url) }}                 // URL
```

## Common Error Fixes

### Error: "Cannot read property 'X' of undefined"
```javascript
// ❌ Wrong
{{ $json.user.name }}

// ✅ Fix 1: Optional chaining
{{ $json.user?.name }}

// ✅ Fix 2: Check existence
{{ $json.user && $json.user.name ? $json.user.name : "N/A" }}

// ✅ Fix 3: Default value
{{ $json.user?.name ?? "Unknown" }}
```

### Error: "X is not a function"
```javascript
// ❌ Wrong (field is not an array)
{{ $json.notAnArray.map(x => x) }}

// ✅ Fix: Check if array
{{ Array.isArray($json.field) ? $json.field.map(x => x) : [] }}
```

### Error: "Unexpected token"
```javascript
// ❌ Wrong syntax
{{ json.field }}           // Missing $
{{$json.field}}           // No spaces
{{ $json.field }          // Missing }

// ✅ Correct
{{ $json.field }}
```

### Error: "Cannot access field"
```javascript
// ❌ Field name has special characters
{{ $json.field-name }}      // Interpreted as subtraction

// ✅ Use bracket notation
{{ $json["field-name"] }}
{{ $json["field.with.dots"] }}
{{ $json["field with spaces"] }}
```

## Best Practices

### ✅ DO
```javascript
// Use descriptive field names
{{ $json.customerEmail }}

// Provide defaults
{{ $json.name ?? "Guest" }}

// Format consistently
{{ $json.price.toFixed(2) }}

// Validate data types
{{ Number($json.value) || 0 }}

// Use optional chaining
{{ $json.data?.nested?.field }}
```

### ❌ DON'T
```javascript
// Don't access undefined
{{ $json.undefined.field }}  // ❌

// Don't forget type conversion
{{ $json.stringNumber + 10 }}  // ❌ "510" not 60

// Don't chain too deep
{{ $json.a.b.c.d.e.f }}  // ❌ Use code node

// Don't use complex logic
{{ $json.items.filter(x => x.active).map(x => x.price).reduce((a,b) => a+b, 0) }}
// ❌ Use Code node instead
```

## Quick Reference

| Task | Expression |
|------|------------|
| Access field | `{{ $json.field }}` |
| Default value | `{{ $json.field ?? "default" }}` |
| Concatenate | `{{ $json.first + " " + $json.last }}` |
| Number math | `{{ $json.price * 1.1 }}` |
| Conditional | `{{ $json.age >= 18 ? "Yes" : "No" }}` |
| Safe access | `{{ $json.user?.email }}` |
| Array length | `{{ $json.items.length }}` |
| Join array | `{{ $json.tags.join(", ") }}` |
| Current date | `{{ new Date().toISOString() }}` |
| Uppercase | `{{ $json.text.toUpperCase() }}` |

## Token Count
~2,400 tokens
