"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Impact = exports.Source = exports.Status = exports.IncidentTemplate = void 0;
var IncidentTemplate;
(function (IncidentTemplate) {
    IncidentTemplate["NONE"] = "NONE";
    IncidentTemplate["PHISHING"] = "PHISHING";
    IncidentTemplate["MALWARE"] = "MALWARE";
})(IncidentTemplate || (exports.IncidentTemplate = IncidentTemplate = {}));
// export type IncidentRequest = {
//   template: IncidentTemplate;
//   reason: string;
//   priority: Priority;
//   username: string;
//   assignedTo: string;
//   createdFrom?: string;
// };
var Status;
(function (Status) {
    Status["OPEN"] = "OPEN";
    Status["ACKNOWLEDGED"] = "ACKNOWLEDGED";
    Status["INVESTIGATION"] = "INVESTIGATION";
    Status["MITIGATED"] = "MITIGATED";
    Status["RESOLVED"] = "RESOLVED";
    Status["CLOSED"] = "CLOSED";
})(Status || (exports.Status = Status = {}));
var Source;
(function (Source) {
    Source["EMAIL"] = "EMAIL";
    Source["SLACK"] = "SLACK";
    Source["PORTAL"] = "PORTAL";
    Source["PHONE"] = "PHONE";
    Source["OTHERS"] = "OTHERS";
})(Source || (exports.Source = Source = {}));
var Impact;
(function (Impact) {
    Impact["LOW"] = "LOW";
    Impact["MEDIUM"] = "MEDIUM";
    Impact["HIGH"] = "HIGH";
    Impact["CRITICAL"] = "CRITICAL";
})(Impact || (exports.Impact = Impact = {}));
