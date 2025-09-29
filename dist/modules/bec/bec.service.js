"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailAnalyzer = void 0;
const promises_1 = __importDefault(require("dns/promises"));
const uuid_1 = require("uuid");
const logger_1 = require("../../common/logger/logger");
class EmailAnalyzer {
    URGENCY_KEYWORDS = [
        'urgent', 'immediate', 'wire transfer', 'confidential',
        'action required', 'verify account', 'sensitive'
    ];
    async analyzeEmail(request) {
        const requestId = `bec-req-${(0, uuid_1.v4)().substring(0, 10)}`;
        const timestamp = new Date().toISOString();
        const analysis = {
            domain_analysis: { is_suspicious: false, findings: [] },
            sender_analysis: { is_suspicious: false, findings: [] },
            content_analysis: { is_suspicious: false, findings: [] }
        };
        try {
            const domain = request.senderEmail.split('@')[1];
            // Domain checks
            const domainResults = await Promise.allSettled([
                this.checkLookalikeDomain(domain, request.legitimateDomains || []),
                this.checkSPF(domain),
                this.checkDMARC(domain)
            ]);
            analysis.domain_analysis.findings = this.processDomainResults(domainResults);
            analysis.domain_analysis.is_suspicious = analysis.domain_analysis.findings.length > 0;
            // Sender checks
            const senderFindings = this.checkDisplayNameSpoofing(request.displayName, request.senderEmail);
            analysis.sender_analysis.findings = senderFindings;
            analysis.sender_analysis.is_suspicious = senderFindings.length > 0;
            // Content checks
            const contentFindings = this.checkContentIndicators(request.subject, request.content);
            analysis.content_analysis.findings = contentFindings;
            analysis.content_analysis.is_suspicious = contentFindings.length > 0;
            // Generate final report
            const riskScore = this.calculateRiskScore(analysis);
            const { verdict, iocs, recommendedActions } = this.generateOutput(analysis, domain, request);
            return {
                request_id: requestId,
                timestamp,
                status: 'completed',
                risk_score: riskScore,
                verdict,
                analysis,
                iocs,
                recommended_actions: recommendedActions
            };
        }
        catch (error) {
            logger_1.logger.error(error, 'Email analysis failed');
            return {
                request_id: requestId,
                timestamp,
                status: 'failed',
                risk_score: 0,
                verdict: 'high_risk',
                analysis,
                iocs: [],
                recommended_actions: []
            };
        }
    }
    processDomainResults(results) {
        return results.reduce((acc, result) => {
            if (result.status === 'fulfilled' && result.value.length > 0) {
                acc.push(...result.value);
            }
            return acc;
        }, []);
    }
    async checkLookalikeDomain(domain, legitimateDomains) {
        const findings = [];
        for (const legitDomain of legitimateDomains) {
            const normalizedDomain = domain.replace(/-/g, '');
            const normalizedLegit = legitDomain.replace(/-/g, '');
            if (normalizedDomain === normalizedLegit && domain !== legitDomain) {
                findings.push({
                    type: 'lookalike_domain',
                    description: `Sender domain '${domain}' appears to be imitating legitimate domain '${legitDomain}'`,
                    confidence: 0.92
                });
            }
        }
        return findings;
    }
    async checkSPF(domain) {
        try {
            const records = await promises_1.default.resolveTxt(domain);
            const spfRecord = records.flat().some(r => r.startsWith('v=spf1'));
            if (!spfRecord) {
                return [{
                        type: 'missing_spf',
                        description: `No valid SPF record found for domain ${domain}`,
                        confidence: 0.85
                    }];
            }
        }
        catch (error) {
            logger_1.logger.warn(`SPF check failed for ${domain}: ${error}`);
            return [{
                    type: 'dns_error',
                    description: `SPF check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    confidence: 0.75
                }];
        }
        return [];
    }
    async checkDMARC(domain) {
        try {
            const dmarcDomain = `_dmarc.${domain}`;
            const records = await promises_1.default.resolveTxt(dmarcDomain);
            const dmarcRecord = records.flat().some(r => r.startsWith('v=DMARC1'));
            if (!dmarcRecord) {
                return [{
                        type: 'missing_dmarc',
                        description: `No valid DMARC record found for domain ${domain}`,
                        confidence: 0.8
                    }];
            }
        }
        catch (error) {
            logger_1.logger.warn(`DMARC check failed for ${domain}: ${error}`);
            return [{
                    type: 'dns_error',
                    description: `DMARC check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    confidence: 0.7
                }];
        }
        return [];
    }
    checkDisplayNameSpoofing(displayName, senderEmail) {
        // In production, this would query a user directory
        const knownContacts = [
            { name: 'John Smith', email: 'john.smith@examplecorp.com' }
        ];
        const matchingContact = knownContacts.find(contact => contact.name.toLowerCase() === displayName.toLowerCase() &&
            !senderEmail.endsWith(`@${contact.email.split('@')[1]}`));
        return matchingContact ? [{
                type: 'display_name_spoofing',
                description: `Display name '${displayName}' matches known contact but from different domain`,
                confidence: 0.88
            }] : [];
    }
    checkContentIndicators(subject, content) {
        const findings = [];
        const foundKeywords = this.URGENCY_KEYWORDS.filter(keyword => content.toLowerCase().includes(keyword.toLowerCase()) ||
            subject.toLowerCase().includes(keyword.toLowerCase()));
        if (foundKeywords.length > 0) {
            findings.push({
                type: 'urgency_indicators',
                description: 'Email uses urgent language commonly seen in BEC attacks',
                confidence: Math.min(0.75 + (foundKeywords.length * 0.1), 0.95),
                keywords: foundKeywords
            });
        }
        return findings;
    }
    calculateRiskScore(analysis) {
        const weights = {
            domain: 0.4,
            sender: 0.3,
            content: 0.3
        };
        const domainScore = analysis.domain_analysis.findings
            .reduce((sum, finding) => sum + finding.confidence, 0) * weights.domain;
        const senderScore = analysis.sender_analysis.findings
            .reduce((sum, finding) => sum + finding.confidence, 0) * weights.sender;
        const contentScore = analysis.content_analysis.findings
            .reduce((sum, finding) => sum + finding.confidence, 0) * weights.content;
        return Math.min(Math.round((domainScore + senderScore + contentScore) * 100), 100);
    }
    generateOutput(analysis, domain, request) {
        const iocs = [];
        const recommendedActions = [];
        let verdict = 'low_risk';
        if (analysis.domain_analysis.is_suspicious) {
            iocs.push({
                type: 'domain',
                value: domain,
                description: 'Suspected lookalike domain',
                confidence: 'high'
            });
            recommendedActions.push({
                action: 'block_sender',
                description: 'Block emails from this sender domain',
                automated: false
            });
        }
        if (analysis.sender_analysis.is_suspicious) {
            iocs.push({
                type: 'email',
                value: request.senderEmail,
                description: 'Suspected spoofed sender address',
                confidence: 'high'
            });
        }
        if (analysis.content_analysis.is_suspicious) {
            iocs.push({
                type: 'pattern',
                value: `Subject line pattern: ${request.subject}`,
                description: 'Common BEC subject line pattern',
                confidence: 'medium'
            });
            recommendedActions.push({
                action: 'alert_recipient',
                description: 'Alert recipient about suspected BEC attempt',
                automated: true
            }, {
                action: 'add_to_watchlist',
                description: 'Add sender to BEC watchlist',
                automated: true
            });
        }
        // Determine verdict based on risk score thresholds
        const riskScore = this.calculateRiskScore(analysis);
        verdict = riskScore >= 70 ? 'high_risk' :
            riskScore >= 40 ? 'medium_risk' :
                'low_risk';
        return { verdict, iocs, recommendedActions };
    }
}
exports.EmailAnalyzer = EmailAnalyzer;
