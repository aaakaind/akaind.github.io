# Examples

This directory contains code examples and integration samples for the AKA Industries platform.

## Widget Integration

**File:** `widget-integration.html`

Demonstrates how to embed AKA Industries widgets into third-party websites:

```bash
# Open in browser
open widget-integration.html
```

Features:
- Product demo widget
- Pricing calculator widget
- Usage metrics dashboard
- Custom styling and theming
- Event handling

## SDK Usage

**File:** `sdk-usage.ts`

Comprehensive examples of using the TypeScript SDK:

```bash
# Run examples
ts-node examples/sdk-usage.ts
```

Examples include:
- User management
- Tenant operations
- API key management
- Usage metrics
- Webhooks
- MCP sessions
- Content personalization
- Error handling
- Pagination

## Quick Start

### Widget Integration

```html
<!-- Add to your website -->
<div id="my-widget"></div>
<script src="https://cdn.akaind.ca/widget-loader.js"></script>
<script>
  AKAWidget.load('product-demo', {
    container: '#my-widget',
    apiKey: 'your-api-key-here',
    theme: 'light'
  });
</script>
```

### SDK Usage

```typescript
import { AKAClient } from '@akaind/sdk-core';

const client = new AKAClient({
  apiKey: 'your-api-key-here'
});

// List users
const users = await client.listUsers();
console.log(users.data);
```

## More Examples

For more examples and documentation, visit:
- **Developer Hub:** https://developers.akaind.ca
- **API Documentation:** https://docs.akaind.ca/api
- **GitHub:** https://github.com/aaakaind/akaind.github.io
