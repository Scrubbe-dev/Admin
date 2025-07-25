-- AlterTable
ALTER TABLE "BusinessDashboard" ALTER COLUMN "colorAccent" SET DEFAULT '#4A90E2',
ALTER COLUMN "defaultDashboard" SET DEFAULT 'SCRUBBE_DASHBOARD_SOUR',
ALTER COLUMN "prefferedIntegration" SET DEFAULT ARRAY['JIRA']::"BusinessPrefferedIntegration"[],
ALTER COLUMN "notificationChannels" SET DEFAULT ARRAY['EMAIL']::"BusinessNotificationChannels"[],
ALTER COLUMN "defaultPriority" SET DEFAULT ARRAY['MEDIUM']::"Priority"[];
