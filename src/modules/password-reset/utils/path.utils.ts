import path from 'path';
import { fileURLToPath } from 'url';

// For ES modules
const __filename = fileURLToPath(process.env.BASE_URL as string);
const __dirname = path.dirname(__filename);


export const getTemplatePath = (templateName: string) => {
  return path.join(__dirname, 'templates', 'emails', templateName);
};

// Or if you need the base templates directory
export const templatesDir = path.join(__dirname, 'templates', 'emails');