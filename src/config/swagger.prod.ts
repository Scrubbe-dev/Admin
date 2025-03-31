// src/config/swagger.prod.ts
import { SwaggerDefinition } from 'swagger-jsdoc';

export const getSwaggerConfig = (): SwaggerDefinition => {
  const baseConfig = require('./swagger').swaggerDefinition;
  
  return {
    ...baseConfig,
    servers: [
      {
        url: 'https://api.yourdomain.com/v1',
        description: 'Production server'
      }
    ],
    components: {
      ...baseConfig.components,
      securitySchemes: {
        ...baseConfig.components.securitySchemes,
        MutualTLS: {
          type: 'mutualTLS'
        }
      }
    }
  };
};