import dns from 'dns/promises';
import { v4 as uuidv4 } from 'uuid';

// Type definitions
interface AnalysisFinding {
  type: string;
  description: string;
  confidence: number;
  keywords?: string[];
}

interface DomainAnalysis {
  is_suspicious: boolean;
  findings: AnalysisFinding[];
}

interface SenderAnalysis {
  is_suspicious: boolean;
  findings: AnalysisFinding[];
}

interface ContentAnalysis {
  is_suspicious: boolean;
  findings: AnalysisFinding[];
}

interface Analysis {
  domain_analysis: DomainAnalysis;
  sender_analysis: SenderAnalysis;
  content_analysis: ContentAnalysis;
}

interface IOC {
  type: string;
  value: string;
  description: string;
  confidence: string;
}

interface RecommendedAction {
  action: string;
  description: string;
  automated: boolean;
}

interface AnalysisReport {
  request_id: string;
  timestamp: string;
  status: 'completed' | 'failed';
  risk_score: number;
  verdict: 'low_risk' | 'medium_risk' | 'high_risk';
  analysis: Analysis;
  iocs: IOC[];
  recommended_actions: RecommendedAction[];
}

interface EmailRequest {
  senderEmail: string;
  displayName: string;
  subject: string;
  content: string;
  legitimateDomains?: string[];
}

class EmailAnalyzer {
  private readonly URGENCY_KEYWORDS = [
    'urgent', 'immediate', 'wire transfer', 'confidential',
    'action required', 'verify account', 'sensitive'
  ];

  async analyzeEmail(request: EmailRequest): Promise<AnalysisReport> {
    const requestId = `bec-req-${uuidv4().substring(0, 10)}`;
    const timestamp = new Date().toISOString();
    
    const analysis: Analysis = {
      domain_analysis: { is_suspicious: false, findings: [] },
      sender_analysis: { is_suspicious: false, findings: [] },
      content_analysis: { is_suspicious: false, findings: [] }
    };

    try {
      const domain = request.senderEmail.split('@')[1];
      
      // Domain checks
      const domainChecks = await Promise.all([
        this.checkLookalikeDomain(domain, request.legitimateDomains || []),
        this.checkSPF(domain),
        this.checkDMARC(domain)
      ]);
      analysis.domain_analysis.findings.push(...domainChecks.flat());
      analysis.domain_analysis.is_suspicious = domainChecks.some(c => c.length > 0);

      // Sender checks
      const senderChecks = this.checkDisplayNameSpoofing(
        request.displayName, 
        request.senderEmail
      );
      analysis.sender_analysis.findings.push(...senderChecks);
      analysis.sender_analysis.is_suspicious = senderChecks.length > 0;

      // Content checks
      const contentChecks = this.checkContentIndicators(
        request.subject, 
        request.content
      );
      analysis.content_analysis.findings.push(...contentChecks);
      analysis.content_analysis.is_suspicious = contentChecks.length > 0;

      // Compile results
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
    } catch (error) {
      console.error('Analysis failed:', error);
      return {
        request_id: requestId,
        timestamp,
        status: 'failed',
        risk_score: 0,
        verdict: 'low_risk',
        analysis,
        iocs: [],
        recommended_actions: []
      };
    }
  }

  private async checkLookalikeDomain(domain: string, legitimateDomains: string[]): Promise<AnalysisFinding[]> {
    const findings: AnalysisFinding[] = [];
    
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

  private async checkSPF(domain: string): Promise<AnalysisFinding[]> {
    try {
      const records = await dns.resolveTxt(domain);
      const spfRecord = records.flat().some(r => r.startsWith('v=spf1'));
      
      if (!spfRecord) {
        return [{
          type: 'missing_spf',
          description: `No valid SPF record found for domain ${domain}`,
          confidence: 0.85
        }];
      }
    } catch (error) {
      return [{
        type: 'dns_error',
        description: `SPF check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0.75
      }];
    }
    return [];
  }

  private async checkDMARC(domain: string): Promise<AnalysisFinding[]> {
    try {
      const dmarcDomain = `_dmarc.${domain}`;
      const records = await dns.resolveTxt(dmarcDomain);
      const dmarcRecord = records.flat().some(r => r.startsWith('v=DMARC1'));
      
      if (!dmarcRecord) {
        return [{
          type: 'missing_dmarc',
          description: `No valid DMARC record found for domain ${domain}`,
          confidence: 0.8
        }];
      }
    } catch (error) {
      return [{
        type: 'dns_error',
        description: `DMARC check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0.7
      }];
    }
    return [];
  }

  private checkDisplayNameSpoofing(displayName: string, senderEmail: string): AnalysisFinding[] {
    // Implement actual contact matching logic in production
    const knownContacts = [
      { name: 'John Smith', email: 'john.smith@examplecorp.com' }
    ];
    
    const matchingContact = knownContacts.find(contact =>
      contact.name.toLowerCase() === displayName.toLowerCase() &&
      !senderEmail.endsWith(`@${contact.email.split('@')[1]}`)
    );

    return matchingContact ? [{
      type: 'display_name_spoofing',
      description: `Display name '${displayName}' matches known contact but from different domain`,
      confidence: 0.88
    }] : [];
  }

  private checkContentIndicators(subject: string, content: string): AnalysisFinding[] {
    const findings: AnalysisFinding[] = [];
    const foundKeywords = this.URGENCY_KEYWORDS.filter(keyword =>
      content.toLowerCase().includes(keyword.toLowerCase()) ||
      subject.toLowerCase().includes(keyword.toLowerCase())
    );

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

  private calculateRiskScore(analysis: Analysis): number {
    let score = 0;
    
    analysis.domain_analysis.findings.forEach(f => score += f.confidence * 40);
    analysis.sender_analysis.findings.forEach(f => score += f.confidence * 30);
    analysis.content_analysis.findings.forEach(f => score += f.confidence * 30);
    
    return Math.min(Math.round(score), 100);
  }

  private generateOutput(analysis: Analysis, domain: string, request: EmailRequest): 
    { verdict: 'low_risk' | 'medium_risk' | 'high_risk', iocs: IOC[], recommendedActions: RecommendedAction[] } {
    
    const iocs: IOC[] = [];
    const recommendedActions: RecommendedAction[] = [];
    let verdict: 'low_risk' | 'medium_risk' | 'high_risk' = 'low_risk';

    // Domain-related IOCs and actions
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

    // Sender-related IOCs
    if (analysis.sender_analysis.is_suspicious) {
      iocs.push({
        type: 'email',
        value: request.senderEmail,
        description: 'Suspected spoofed sender address',
        confidence: 'high'
      });
    }

    // Content-related IOCs
    if (analysis.content_analysis.is_suspicious) {
      iocs.push({
        type: 'pattern',
        value: `Subject line pattern: ${request.subject}`,
        description: 'Common BEC subject line pattern',
        confidence: 'medium'
      });

      recommendedActions.push(
        {
          action: 'alert_recipient',
          description: 'Alert recipient about suspected BEC attempt',
          automated: true
        },
        {
          action: 'add_to_watchlist',
          description: 'Add sender to BEC watchlist',
          automated: true
        }
      );
    }

    // Determine verdict
    const totalFindings = [
      ...analysis.domain_analysis.findings,
      ...analysis.sender_analysis.findings,
      ...analysis.content_analysis.findings
    ].length;

    if (totalFindings >= 2) {
      verdict = 'high_risk';
    } else if (totalFindings === 1) {
      verdict = 'medium_risk';
    }

    return { verdict, iocs, recommendedActions };
  }
}

// Example usage
const analyzer = new EmailAnalyzer();

const emailRequest: EmailRequest = {
  senderEmail: 'john.smith@example-corp.com',
  displayName: 'John Smith',
  subject: 'Urgent Wire Transfer Request',
  content: 'We need to immediately process a confidential wire transfer...',
  legitimateDomains: ['examplecorp.com']
};

analyzer.analyzeEmail(emailRequest).then(report => {
  console.log(JSON.stringify(report, null, 2));
});