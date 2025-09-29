"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailIntegrationUtil = void 0;
const client_1 = require("@prisma/client");
class EmailIntegrationUtil {
    constructor() { }
    static parseIncidentEmail(payload) {
        const subject = payload.subject.trim();
        const bodyLines = payload.body
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
        const bodyData = {};
        for (const line of bodyLines) {
            const [key, ...rest] = line.split(":");
            if (key && rest.length) {
                bodyData[key.trim().toLowerCase()] = rest.join(":").trim();
            }
        }
        // Only handle Raise
        if (/^raise:/i.test(subject)) {
            return {
                action: "raise",
                incident: {
                    template: bodyData.template || "NONE",
                    reason: bodyData.reason || "",
                    priority: (this.normalizePriority(bodyData.priority) || "LOW").toUpperCase(),
                    username: bodyData.username || "",
                    assignedTo: bodyData.assignedto || "",
                    fromEmail: payload.from,
                },
            };
        }
        throw new Error("Unknown subject format. Must start with Raise:");
    }
    static normalizePriority(priority) {
        const priorityMap = {
            high: client_1.Priority.HIGH,
            medium: client_1.Priority.MEDIUM,
            low: client_1.Priority.LOW,
            critical: client_1.Priority.CRITICAL,
        };
        if (priority) {
            const key = priority.toLowerCase();
            return priorityMap[key] || null;
        }
        return null;
    }
}
exports.EmailIntegrationUtil = EmailIntegrationUtil;
