// IMS-specific email templates
export const imsTemplatesFiles = [
  {
    name: "ims-invitation",
    data: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{companyName}} - IMS Invitation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding: 20px 0;
            border-bottom: 1px solid #eaeaea;
        }
        .logo {
            max-width: 150px;
            height: auto;
        }
        .content {
            padding: 20px 0;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #45a049;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eaeaea;
            font-size: 12px;
            color: #777;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .details {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .detail-item {
            margin: 8px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{companyLogo}}" alt="{{companyName}}" class="logo">
            <h1>{{companyName}} IMS</h1>
        </div>
        <div class="content">
            <h2>{{greeting}}</h2>
            <p>{{message}}</p>
            
            <div class="details">
                <div class="detail-item"><strong>Company:</strong> {{companyName}}</div>
                <div class="detail-item"><strong>Your Role:</strong> {{role}}</div>
                <div class="detail-item"><strong>Access Level:</strong> {{level}}</div>
                <div class="detail-item"><strong>Invited By:</strong> {{inviterName}}</div>
            </div>

            <div class="button-container">
                <a href="{{acceptUrl}}" class="button">{{buttonText}}</a>
            </div>

            <p>If the button above doesn't work, copy and paste the following URL into your browser:</p>
            <p style="word-break: break-all;">{{acceptUrl}}</p>
            
            <p class="note">{{expiryNote}}</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{companyName}} Incident Management System. All rights reserved.</p>
            <p>If you have any questions, please contact your system administrator.</p>
        </div>
    </div>
</body>
</html>`
  },
  {
    name: "ims-incident-created",
    data: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{companyName}} - New Incident Created</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding: 20px 0;
            border-bottom: 1px solid #eaeaea;
        }
        .logo {
            max-width: 150px;
            height: auto;
        }
        .content {
            padding: 20px 0;
        }
        .incident-card {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid {{priorityColor}};
        }
        .priority-high { border-left-color: #dc3545; }
        .priority-medium { border-left-color: #ffc107; }
        .priority-low { border-left-color: #28a745; }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #0056b3;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eaeaea;
            font-size: 12px;
            color: #777;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{companyLogo}}" alt="{{companyName}}" class="logo">
            <h1>{{companyName}} IMS</h1>
        </div>
        <div class="content">
            <h2>New Incident Created</h2>
            <p>A new incident has been created and requires your attention.</p>
            
            <div class="incident-card priority-{{priority}}">
                <h3>{{incidentTitle}}</h3>
                <p><strong>Ticket ID:</strong> {{ticketId}}</p>
                <p><strong>Priority:</strong> {{priority}}</p>
                <p><strong>Status:</strong> {{status}}</p>
                <p><strong>Created At:</strong> {{createdAt}}</p>
                <p><strong>Description:</strong> {{description}}</p>
                {{#if assignee}}<p><strong>Assigned To:</strong> {{assignee}}</p>{{/if}}
            </div>

            <div class="button-container">
                <a href="{{incidentUrl}}" class="button">View Incident</a>
            </div>

            <p>Please take appropriate action based on the incident priority and type.</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{companyName}} Incident Management System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
  },
  {
    name: "ims-incident-update",
    data: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{companyName}} - Incident Update</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding: 20px 0;
            border-bottom: 1px solid #eaeaea;
        }
        .logo {
            max-width: 150px;
            height: auto;
        }
        .content {
            padding: 20px 0;
        }
        .update-card {
            background-color: #e7f3ff;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #007bff;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #0056b3;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eaeaea;
            font-size: 12px;
            color: #777;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{companyLogo}}" alt="{{companyName}}" class="logo">
            <h1>{{companyName}} IMS</h1>
        </div>
        <div class="content">
            <h2>Incident Update</h2>
            <p>The following incident has been updated:</p>
            
            <div class="update-card">
                <h3>{{incidentTitle}}</h3>
                <p><strong>Ticket ID:</strong> {{ticketId}}</p>
                <p><strong>Update Type:</strong> {{updateType}}</p>
                <p><strong>Updated By:</strong> {{updatedBy}}</p>
                <p><strong>Update Time:</strong> {{updateTime}}</p>
                <p><strong>Details:</strong> {{updateDetails}}</p>
                <p><strong>Current Status:</strong> {{currentStatus}}</p>
                <p><strong>Current Priority:</strong> {{currentPriority}}</p>
            </div>

            <div class="button-container">
                <a href="{{incidentUrl}}" class="button">View Updated Incident</a>
            </div>

            <p>Please review the updates and take any necessary actions.</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{companyName}} Incident Management System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
  },
  {
    name: "ims-escalation",
    data: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{companyName}} - Incident Escalation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #fff3cd;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border: 2px solid #ffc107;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding: 20px 0;
            border-bottom: 1px solid #eaeaea;
        }
        .logo {
            max-width: 150px;
            height: auto;
        }
        .content {
            padding: 20px 0;
        }
        .escalation-alert {
            background-color: #fff3cd;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #ffc107;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #dc3545;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #c82333;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eaeaea;
            font-size: 12px;
            color: #777;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .urgent {
            color: #dc3545;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{companyLogo}}" alt="{{companyName}}" class="logo">
            <h1>🚨 Incident Escalation</h1>
        </div>
        <div class="content">
            <h2 class="urgent">URGENT: Incident Requires Immediate Attention</h2>
            
            <div class="escalation-alert">
                <h3>{{incidentTitle}}</h3>
                <p><strong>Ticket ID:</strong> {{ticketId}}</p>
                <p><strong>Priority:</strong> <span class="urgent">{{priority}}</span></p>
                <p><strong>Escalation Reason:</strong> {{escalationReason}}</p>
                <p><strong>Escalated By:</strong> {{escalatedBy}}</p>
                <p><strong>Escalated To:</strong> {{escalatedTo}}</p>
                <p><strong>Time of Escalation:</strong> {{escalationTime}}</p>
                <p><strong>SLA Status:</strong> {{slaStatus}}</p>
            </div>

            <div class="button-container">
                <a href="{{incidentUrl}}" class="button">Take Action Now</a>
            </div>

            <p class="urgent">This incident has been escalated due to its critical nature or SLA breach. Immediate action is required.</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{companyName}} Incident Management System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
  }
];
