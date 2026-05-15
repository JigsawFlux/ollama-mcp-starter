import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Try creating a server
const server = new Server({
  name: 'test',
  version: '1.0.0',
});

console.log('Server created:', server);
console.log('Server properties:', Object.keys(server));
console.log('Server capabilities:', (server as any).capabilities);

// Try setting tool handler
try {
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: [] };
  });
  console.log('Handler set successfully');
} catch (e: any) {
  console.log('Error:', e.message);
  console.log('Server object:', server);
  
  // Try accessing capabilities differently
  console.log('\nTrying to access capabilities...');
  const serverAny = server;
  console.log('Type of server:', typeof server);
  console.log('Constructor name:', server.constructor.name);
  
  // Check if there's a method to declare capabilities
  for (let key of Object.getOwnPropertyNames(server)) {
    console.log('Property:', key);
  }
  
  for (let key of Object.getOwnPropertyNames(Object.getPrototypeOf(server))) {
    if (key.includes('tool') || key.includes('capabil')) {
      console.log('Found method:', key);
    }
  }
}
