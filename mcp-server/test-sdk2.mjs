import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Try creating a server
const server = new Server({
  name: 'test',
  version: '1.0.0',
});

console.log('Before registerCapabilities:');
console.log('_capabilities:', server._capabilities);

// Try registering capabilities
console.log('\nTrying registerCapabilities...');
server.registerCapabilities({
  tools: {},
});

console.log('After registerCapabilities:');
console.log('_capabilities:', server._capabilities);

// Try setting tool handler
try {
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: [] };
  });
  console.log('\nHandler set successfully!');
} catch (e) {
  console.log('\nError:', e.message);
}
