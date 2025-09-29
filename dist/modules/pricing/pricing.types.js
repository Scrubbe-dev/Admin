"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingCycle = exports.PlanType = void 0;
var PlanType;
(function (PlanType) {
    PlanType["STARTER"] = "starter";
    PlanType["GROWTH"] = "growth";
    PlanType["PRO"] = "pro";
    PlanType["ENTERPRISE"] = "enterprise";
})(PlanType || (exports.PlanType = PlanType = {}));
var BillingCycle;
(function (BillingCycle) {
    BillingCycle["MONTHLY"] = "month";
    BillingCycle["YEARLY"] = "year";
})(BillingCycle || (exports.BillingCycle = BillingCycle = {}));
