import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Try creating a server
const server = new Server({
  name: 'test',
  version: '1.0.0',
});

console.log('Server created:', server);
console.log('Server capabilities:', server.capabilities);

// Try setting tool handler
try {
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: [] };
  });
  console.log('Handler set successfully');
} catch (e) {
  console.log('Error:', e.message);
  
  // Try accessing capabilities differently
  console.log('\nServer methods:');
  const proto = Object.getPrototypeOf(server);
  for (let key of Object.getOwnPropertyNames(proto)) {
    if (key.toLowerCase().includes('tool') || key.toLowerCase().includes('capabil')) {
      console.log('Found method:', key);
    }
  }
}
