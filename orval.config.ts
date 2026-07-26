// orval.config.ts
import { defineConfig } from 'orval';

export default defineConfig({
  myApi: {
    input: 'http://localhost:9090/api/v3/api-docs', // Your Spring backend
    output: {
      mode: 'tags-split',
      target: 'api/endpoints', 
      schemas: 'api/models',
      client: 'react-query',
      mock: false,
      override: {
        mutator: {
          path: './lib/axios.ts', 
          name: 'customInstance', // 👈 CHANGE THIS to match the exported wrapper function
        },
      },
    },
  },
});