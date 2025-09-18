import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const option = {
  customCss: ".swagger-ui .topbar { display: none }",
};

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
  apis: [
    "./src/modules/system/system.routes.ts",
    "./src/modules/bec/bec.routes.ts",
    "./src/modules/digitalpaymentfraud/fraud.route.ts",
    "./src/modules/apikey/apikey.route.ts",
    "./src/modules/auth/routes/auth.routes.ts",
    "./src/modules/business-profile/business.router.ts",
    "./src/modules/ezra-chat/ezra.route.ts",
    "./src/modules/fingerprint/fingerprint.route.ts",
    "./src/modules/data-visualization/data-visual.route.ts",
    "./src/modules/incident-ticket/incident.route.ts",
    "./src/modules/3rd-party-configurables/whatsapp/whatsapp.route.ts",
    "./src/modules/3rd-party-configurables/sms/sms.route.ts",
    "./src/modules/3rd-party-configurables/google/google-meet/meet.route.ts",
    "./src/modules/3rd-party-configurables/slack/slack.router.ts",
    "./src/modules/3rd-party-configurables/github/github.router.ts",
    "./src/modules/3rd-party-configurables/gitlab/gitlab.router.ts",
    "./src/modules/3rd-party-configurables/email-integration/email-integration.router.ts",
    "./src/modules/3rd-party-configurables/text2pdf/text2pdf.route.ts",
    "./src/modules/tickets/routes.ts",
    "./src/modules/integrations/integration.route.ts",
    "./src/modules/intel/intel.route.ts",
    "./src/modules/escalate/escalate.route.ts",
    "./src/modules/playbook/playbook.route.ts",
    "./src/modules/ims-setup/ims.router.ts",
    "./src/modules/password-reset/reset.route.ts",
    "./src/modules/incidentStatus/incidentstatus.routes.ts",
    "./src/modules/postmortem/postmortem.route.ts",
    "./src/modules/pricing/pricing.route.ts"
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, option));
  console.log(
    "✅ Swagger Docs available at: https://admin-rul9.onrender.com/api-docs"
  );
}

// for Auth
// app.use('/api-docs', basicAuth({ users: { 'admin': 'password' } }), swaggerUi.serve, swaggerUi.setup(specs));
