"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapStatusResponse = void 0;
const mapStatusResponse = (statusResp) => {
    return [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Incident:* ${statusResp.ticketId}\n*Status:* *${statusResp.status}* :rotating_light:`,
            },
        },
        {
            type: "section",
            fields: [
                {
                    type: "mrkdwn",
                    text: `*Raised by:* ${statusResp.userName}`,
                },
                {
                    type: "mrkdwn",
                    text: `*Priority:* ${statusResp.priority}`,
                },
                {
                    type: "mrkdwn",
                    text: `*Assigned to:* ${statusResp.assignedToEmail || "Unassigned"}`,
                },
                {
                    type: "mrkdwn",
                    text: `*Risk Score:* ${statusResp.riskScore}`,
                },
            ],
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Reason:* ${statusResp.reason}`,
            },
        },
        {
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: `*Created:* ${new Date(statusResp.createdAt).toLocaleString()}`,
                },
            ],
        },
    ];
};
exports.mapStatusResponse = mapStatusResponse;
