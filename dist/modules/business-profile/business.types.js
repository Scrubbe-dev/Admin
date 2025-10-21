"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationChannels = exports.PrefferedIntegration = exports.DashboardType = exports.AccessPermissions = void 0;
var AccessPermissions;
(function (AccessPermissions) {
    AccessPermissions["VIEW_DASHBOARD"] = "VIEW_DASHBOARD";
    AccessPermissions["MODIFY_DASHBOARD"] = "MODIFY_DASHBOARD";
    AccessPermissions["EXECUTE_ACTIONS"] = "EXECUTE_ACTIONS";
    AccessPermissions["MANAGE_USERS"] = "MANAGE_USERS";
})(AccessPermissions || (exports.AccessPermissions = AccessPermissions = {}));
var DashboardType;
(function (DashboardType) {
    DashboardType["SCRUBBE_DASHBOARD_SIEM"] = "SCRUBBE_DASHBOARD_SIEM";
    DashboardType["SCRUBBE_DASHBOARD_SOUR"] = "SCRUBBE_DASHBOARD_SOUR";
    DashboardType["CUSTOM"] = "CUSTOM";
})(DashboardType || (exports.DashboardType = DashboardType = {}));
var PrefferedIntegration;
(function (PrefferedIntegration) {
    PrefferedIntegration["JIRA"] = "JIRA";
    PrefferedIntegration["FRESH_DESK"] = "FRESH_DESK";
    PrefferedIntegration["SERVICE_NOW"] = "SERVICE_NOW";
})(PrefferedIntegration || (exports.PrefferedIntegration = PrefferedIntegration = {}));
var NotificationChannels;
(function (NotificationChannels) {
    NotificationChannels["SLACK"] = "SLACK";
    NotificationChannels["MICROSOFT_TEAMS"] = "MICROSOFT_TEAMS";
    NotificationChannels["EMAIL"] = "EMAIL";
    NotificationChannels["SMS"] = "SMS";
})(NotificationChannels || (exports.NotificationChannels = NotificationChannels = {}));
// businessId: "f0f0829c-f5bc-48b1-8831-8871bda36eeb"
// email: "sanivi6981@fixwap.com"
// firstName: "micheal"
// lastName: "fred"
// password: "Goodboy2"
