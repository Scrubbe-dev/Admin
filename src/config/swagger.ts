import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";


const option = {
    customCss:'.swagger-ui .topbar { display: none }',
}
 
const options: swaggerJSDoc.Options = {
   
  definition: {
    openapi: "3.0.0",
    info: {
        title: "SCRUBBE API Documentation",
        version: "1.0.0",
        description: "A complete documentation of scrubbe api",
    },
    servers: [
        {
           url: "https://admin-rul9.onrender.com",
            description: "Production development Server",
        },
    ],
},
apis: ["./src/modules/system/system.routes.ts","./src/modules/bec/bec.routes.ts","./src/modules/digitalpaymentfraud/fraud.route.ts","./src/modules/apikey/apikey.route.ts"],
};


const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec,option));
  console.log("✅ Swagger Docs available at: https://admin-rul9.onrender.com/api-docs");
}


// for Auth 
// app.use('/api-docs', basicAuth({ users: { 'admin': 'password' } }), swaggerUi.serve, swaggerUi.setup(specs));