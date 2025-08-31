"""
Gemini AI Prompts Template for SimplyLegal
Contains all prompts used for document processing and analysis
"""

# Main Document Analysis Prompt
DOCUMENT_ANALYSIS_PROMPT = """
You are an expert legal document analyzer. Analyze the following legal document and extract ALL specific information directly from the document content. DO NOT use generic or placeholder text - extract ONLY what is actually present in the document.

Document: {filename}
Content:
{text}

CRITICAL REQUIREMENTS:
1. Extract ONLY information that is explicitly present in the document text
2. Do NOT use generic phrases like "Parties to be identified" or "Terms require legal review"
3. If information is not present in the document, use empty arrays [] or "Not specified"
4. Be extremely specific and detailed in your analysis
5. Quote exact text from the document when possible

Please provide analysis in the following JSON format:

{{
    "summary": "Detailed summary of what the document actually contains (3-4 sentences)",
    "document_type": "Specific type of legal document based on content",
    "parties_involved": ["Exact names/entities mentioned in the document"],
    "key_terms": ["Specific terms, conditions, or clauses found in the document"],
    "legal_implications": ["Specific legal implications mentioned or implied in the document"],
    "compliance_issues": ["Specific compliance requirements or issues mentioned"],
    "negotiation_points": ["Specific terms that could be negotiated based on document content"],
    "clauses": [
        {{
            "id": "clause-1",
            "title": "Actual clause title or section name from document",
            "plainEnglish": "Detailed explanation of what this clause actually says",
            "riskLevel": "low/medium/high based on specific content analysis",
            "riskReasons": ["Specific reasons from the document text that indicate risk"],
            "actions": [
                {{
                    "task": "Specific action required based on this clause",
                    "dueDate": "YYYY-MM-DD if mentioned, otherwise null"
                }}
            ],
            "evidence": [{{"start": 0, "end": 200}}],
            "originalText": "Exact text from the document for this clause"
        }}
    ],
    "risks": [
        {{
            "id": "risk-1",
            "title": "Specific risk identified from document content",
            "level": "low/medium/high",
            "description": "Detailed description of the risk based on document text",
            "clauseId": "clause-1",
            "evidence": "Exact text from document that indicates this risk"
        }}
    ],
    "checklist": [
        {{
            "id": "task-1",
            "task": "Specific task required based on document content",
            "dueDate": "YYYY-MM-DD if mentioned, otherwise null",
            "completed": false,
            "priority": "low/medium/high",
            "source": "Specific document section that requires this action"
        }}
    ],
    "recommendations": ["Specific recommendations based on actual document analysis"],
    "ai_generated": true,
    "analysis_timestamp": "{timestamp}",
    "model_used": "gemini-2.5-flash"
}}

EXAMPLES OF WHAT TO AVOID:
- "Parties to be identified" → Use actual party names from document
- "Terms require legal review" → Use specific terms found in document
- "Document requires legal review" → Use specific legal issues mentioned
- Generic placeholder text → Use specific content from the document

EXAMPLES OF WHAT TO DO:
- Extract actual company names, person names, dates, amounts
- Quote specific clauses and terms
- Identify specific risks based on document language
- List actual requirements and obligations mentioned
"""

# Simple Summary Extraction Prompt
SIMPLE_SUMMARY_PROMPT = """
Create a simple, plain language summary of this legal document. Write as if explaining to someone who knows nothing about legal documents:

Document: {filename}
Content:
{text}

Write a summary that:
- Uses everyday language (no legal jargon)
- Explains what the document is about in simple terms
- Mentions the main parties involved
- Describes the key points or obligations
- Is 2-3 sentences long
- Focuses on what the document actually says

Simple Summary:
"""

# Document Type Classification Prompt
DOCUMENT_TYPE_PROMPT = """
Classify this legal document into a specific type:

Document: {filename}
Content:
{text}

Choose from these common types:
- Employment Contract
- Service Agreement
- Non-Disclosure Agreement (NDA)
- Partnership Agreement
- License Agreement
- Purchase Agreement
- Lease Agreement
- Loan Agreement
- Settlement Agreement
- Other Legal Document

Respond with only the document type:
"""

# Plain Language Document Analysis Prompt
PLAIN_LANGUAGE_ANALYSIS_PROMPT = """
You are a helpful assistant that analyzes legal documents in simple terms. Please analyze the following document and provide a comprehensive summary in plain English.

Document: {filename}
Content:
{text}

Please respond with ONLY a valid JSON object in this exact format (no additional text before or after):

{{
    "summary": "A detailed 4-6 sentence summary explaining what this document is about, who it involves, what it requires, and its main purpose in everyday language. Include key obligations, rights, and important details.",
    "document_type": "The type of legal document (e.g., Employment Contract, Service Agreement, Lease Agreement)",
    "parties_involved": ["List of the main people or companies mentioned in the document"],
    "key_terms": ["5-8 most important terms or conditions found in the document"],
    "main_points": ["5-8 main points about what this document does or requires"],
    "overall_risk_level": "low/medium/high",
    "risk_assessment": {{
        "primary_risks": [
            {{
                "risk": "Specific risk identified from the document content",
                "level": "low/medium/high",
                "impact": "Detailed explanation of what this risk means for the parties involved",
                "mitigation": "Specific steps to reduce or eliminate this risk",
                "evidence": "Exact quote or reference from the document that indicates this risk",
                "clause_reference": "Which section or clause this risk relates to"
            }}
        ],
        "risk_factors": [
            "Specific factors from the document that contribute to the overall risk level",
            "Unfair terms or conditions found in the document",
            "Excessive obligations or restrictions mentioned",
            "Unclear or ambiguous language that could cause problems",
            "Missing protections or safeguards for the parties"
        ],
        "detailed_risk_analysis": [
            {{
                "category": "Contractual Risks",
                "risks": [
                    {{
                        "title": "Specific contractual risk title",
                        "description": "Detailed description of the risk based on document content",
                        "severity": "low/medium/high",
                        "likelihood": "low/medium/high",
                        "document_evidence": "Exact text from document showing this risk",
                        "business_impact": "How this risk affects business operations or interests",
                        "legal_implications": "Potential legal consequences if this risk materializes",
                        "recommended_actions": ["Specific actions to address this risk"]
                    }}
                ]
            }},
            {{
                "category": "Financial Risks",
                "risks": [
                    {{
                        "title": "Specific financial risk title",
                        "description": "Detailed description of financial risks found in the document",
                        "severity": "low/medium/high",
                        "likelihood": "low/medium/high",
                        "document_evidence": "Exact text from document showing this risk",
                        "business_impact": "Financial impact on the business or parties",
                        "legal_implications": "Legal consequences related to financial obligations",
                        "recommended_actions": ["Specific actions to address this risk"]
                    }}
                ]
            }},
            {{
                "category": "Operational Risks",
                "risks": [
                    {{
                        "title": "Specific operational risk title",
                        "description": "Detailed description of operational risks in the document",
                        "severity": "low/medium/high",
                        "likelihood": "low/medium/high",
                        "document_evidence": "Exact text from document showing this risk",
                        "business_impact": "Impact on day-to-day operations",
                        "legal_implications": "Legal implications for operational requirements",
                        "recommended_actions": ["Specific actions to address this risk"]
                    }}
                ]
            }},
            {{
                "category": "Compliance Risks",
                "risks": [
                    {{
                        "title": "Specific compliance risk title",
                        "description": "Detailed description of compliance risks in the document",
                        "severity": "low/medium/high",
                        "likelihood": "low/medium/high",
                        "document_evidence": "Exact text from document showing this risk",
                        "business_impact": "Impact on regulatory compliance",
                        "legal_implications": "Legal consequences of non-compliance",
                        "recommended_actions": ["Specific actions to address this risk"]
                    }}
                ]
            }}
        ],
        "recommendations": [
            "Specific, actionable recommendations to address the identified risks",
            "Legal review recommendations based on document content",
            "Negotiation points that could reduce risk exposure",
            "Protective measures to implement",
            "Monitoring and oversight recommendations"
        ],
        "risk_summary": "A comprehensive summary of the overall risk profile, including the most critical risks and their potential impact on the parties involved."
    }}
}}

CRITICAL REQUIREMENTS FOR RISK ASSESSMENT:
1. Extract ONLY risks that are explicitly mentioned or clearly implied in the document text
2. Provide exact quotes or specific references from the document as evidence
3. Categorize risks by type (Contractual, Financial, Operational, Compliance)
4. Assess both severity (impact) and likelihood for each risk
5. Provide specific, actionable recommendations for each risk
6. Include business impact and legal implications for each risk
7. Ensure all risk descriptions are based on actual document content
8. If no specific risks are found, explain why and provide general risk considerations

Rules:
1. Use simple, everyday language that a non-lawyer can understand
2. Extract actual names, dates, and amounts from the document
3. Avoid legal jargon
4. If information is not present in the document, use "Not specified" or empty arrays []
5. Respond with ONLY the JSON object, no other text
6. Make sure the JSON is properly formatted and valid
7. Assess risk based on: unfair terms, excessive obligations, unclear language, missing protections, unreasonable restrictions
8. Overall risk level should reflect the highest risk found in the document
9. The summary should be comprehensive and detailed, not just 2-3 sentences
10. For detailed_risk_analysis, ensure each category has at least one risk if applicable
11. Provide specific document evidence for each risk identified
12. Include practical business impact assessments for each risk
"""

# Deep Analysis Extraction Prompt
DEEP_ANALYSIS_PROMPT = """
You are a legal document analysis expert. Please perform a comprehensive deep analysis of the following document and extract structured information for detailed analysis.

Document: {filename}
Content:
{text}

Please respond with ONLY a valid JSON object in this exact format (no additional text before or after):

{{
    "deep_analysis": {{
        "key_clauses": [
            {{
                "title": "Name or title of the clause",
                "description": "What this clause does in simple terms",
                "importance": "high/medium/low",
                "original_text": "Exact text from the document (first 200 characters)",
                "implications": "What this means for the parties involved"
            }}
        ],
        "obligations": [
            {{
                "party": "Who has this obligation (e.g., 'Employer', 'Employee', 'Company')",
                "obligation": "What they must do",
                "deadline": "When this must be done (if specified)",
                "consequences": "What happens if not fulfilled"
            }}
        ],
        "rights": [
            {{
                "party": "Who has this right",
                "right": "What they are entitled to",
                "conditions": "Any conditions for exercising this right",
                "limitations": "Any limitations on this right"
            }}
        ],
        "financial_terms": [
            {{
                "type": "Type of financial term (e.g., 'Salary', 'Payment', 'Penalty', 'Bonus')",
                "amount": "The amount or calculation method",
                "frequency": "How often this applies",
                "conditions": "Conditions for payment or application"
            }}
        ],
        "timeline": [
            {{
                "event": "What event or deadline",
                "date": "When it occurs",
                "importance": "high/medium/low",
                "consequences": "What happens if missed"
            }}
        ],
        "termination_conditions": [
            {{
                "condition": "What condition allows termination",
                "notice_required": "How much notice is required",
                "who_can_terminate": "Who can initiate termination",
                "consequences": "What happens after termination"
            }}
        ],
        "dispute_resolution": [
            {{
                "method": "How disputes are resolved (e.g., 'Arbitration', 'Mediation', 'Court')",
                "venue": "Where disputes are resolved",
                "governing_law": "Which law applies",
                "costs": "Who pays for resolution"
            }}
        ],
        "penalties": [
            {{
                "violation": "What violation triggers the penalty",
                "penalty": "What the penalty is",
                "who_pays": "Who pays the penalty",
                "enforcement": "How the penalty is enforced"
            }}
        ],
        "compliance_requirements": [
            {{
                "requirement": "What compliance is required",
                "deadline": "When it must be completed",
                "responsible_party": "Who is responsible",
                "verification": "How compliance is verified"
            }}
        ],
        "confidentiality": [
            {{
                "scope": "What information is confidential",
                "duration": "How long confidentiality lasts",
                "exceptions": "Any exceptions to confidentiality",
                "breach_consequences": "What happens if confidentiality is breached"
            }}
        ],
        "intellectual_property": [
            {{
                "type": "Type of IP (e.g., 'Patents', 'Copyrights', 'Trade Secrets')",
                "ownership": "Who owns the IP",
                "usage_rights": "Who can use the IP",
                "protection": "How the IP is protected"
            }}
        ]
    }}
}}

Rules:
1. Extract ONLY information that is explicitly stated in the document
2. Use clear, simple language for descriptions
3. If information is not present, use "Not specified" or empty arrays []
4. Be thorough but accurate - don't infer information not in the document
5. For amounts and dates, extract the exact values from the document
6. Categorize information logically and consistently
7. Respond with ONLY the JSON object, no other text
8. Make sure the JSON is properly formatted and valid
9. Focus on actionable and important information for business decisions
10. Include specific details that would be relevant for legal review or negotiation
"""



# Key Terms Extraction Prompt
KEY_TERMS_PROMPT = """
Extract the most important terms and conditions from this legal document:

Document: {filename}
Content:
{text}

Requirements:
- Extract 5-10 key terms maximum
- Focus on the most important clauses
- Use simple language to describe each term
- Include terms that affect rights, obligations, or risks

Key Terms:
"""

# Risk Assessment Prompt
RISK_ASSESSMENT_PROMPT = """
Assess the risks in this legal document:

Document: {filename}
Content:
{text}

For each identified risk, provide:
1. Risk title
2. Risk level (low/medium/high)
3. Description of the risk
4. Specific evidence from the document
5. Which clause it relates to

Focus on:
- Unfair terms
- Excessive obligations
- Unclear language
- Missing protections
- Unreasonable restrictions

Risk Assessment:
"""

# Q&A Context Prompt
QA_CONTEXT_PROMPT = """
You are a legal document expert. Answer the following question about this specific document:

Question: {question}

Document content:
{text}

Relevant sections:
{relevant_chunks}

Instructions:
1. Answer ONLY based on the document content provided
2. Use clear, structured markdown formatting
3. Quote specific text from the document when relevant using **bold** for emphasis
4. If the information is not in the document, say so clearly
5. Provide detailed, helpful explanations with proper headings and lists
6. Include specific clause references when possible
7. Use bullet points and numbered lists for better organization
8. Highlight important terms and concepts using **bold** or *italic*

Format your response using markdown:
- Use **##** for main headings
- Use **###** for subheadings
- Use **-** for bullet points
- Use **1.** for numbered lists
- Use **bold** for emphasis on key terms
- Use *italic* for definitions or clarifications
- Use `code` for specific clause numbers or legal terms
- Use > blockquotes for direct document excerpts

Example structure:
## Answer Summary
Brief overview of the answer

## Key Findings
- Point 1 with **bold emphasis**
- Point 2 with *italic clarification*

## Document References
> "Exact quote from document" - Clause 3.2

## Recommendations
1. First recommendation
2. Second recommendation

Please provide a well-structured, markdown-formatted answer that is easy to read and understand.
"""

# Document Comparison Prompt
DOCUMENT_COMPARISON_PROMPT = """
Compare these two legal documents and identify key differences:

Document 1: {doc1_name}
Content: {doc1_content}

Document 2: {doc2_name}
Content: {doc2_content}

Compare:
1. Document types and purposes
2. Key terms and conditions
3. Risk levels
4. Parties involved
5. Main differences in obligations
6. Which document is more favorable

Provide comparison in JSON format:
{{
    "similarities": ["List of similar terms/conditions"],
    "differences": [
        {{
            "aspect": "Term being compared",
            "doc1_value": "Value in document 1",
            "doc2_value": "Value in document 2",
            "significance": "Why this difference matters"
        }}
    ],
    "recommendations": ["Recommendations based on comparison"]
}}
"""

# Compliance Check Prompt
COMPLIANCE_CHECK_PROMPT = """
Check this legal document for compliance issues:

Document: {filename}
Content: {text}

Check for compliance with:
1. Employment laws (if applicable)
2. Data protection regulations
3. Anti-discrimination laws
4. Consumer protection laws
5. Industry-specific regulations

Provide compliance analysis in JSON format:
{{
    "compliance_issues": [
        {{
            "issue": "Description of compliance issue",
            "severity": "low/medium/high",
            "regulation": "Relevant law/regulation",
            "recommendation": "How to fix the issue"
        }}
    ],
    "overall_compliance": "compliant/needs_review/non_compliant",
    "recommendations": ["List of compliance recommendations"]
}}
"""

# Document Simplification Prompt
DOCUMENT_SIMPLIFICATION_PROMPT = """
Simplify this legal document section into plain English:

Original Text:
{text}

Requirements:
- Use simple, everyday language
- Keep the same meaning
- Make it easy to understand
- Break down complex sentences
- Explain legal terms

Simplified Version:
"""

# Action Items Extraction Prompt
ACTION_ITEMS_PROMPT = """
You are an expert legal risk analyst specializing in identifying actionable recommendations to reduce risk factors in legal documents. Your task is to analyze the following document and extract SPECIFIC, ACTIONABLE recommendations for risk mitigation, legal consultation, negotiation strategies, and compliance improvements.

Document: {filename}
Content: {text}

IMPORTANT: You MUST identify at least 5-10 actionable items from ANY legal document. Even if the document appears straightforward, there are ALWAYS opportunities for risk mitigation, legal review, or improvement.

Please respond with ONLY a valid JSON object in this exact format (no additional text before or after):

{{
    "action_items": [
        {{
            "id": "action-1",
            "task": "Specific, actionable risk mitigation step or legal recommendation",
            "description": "Detailed explanation of what should be done and why it's important",
            "due_date": "YYYY-MM-DD if specified in document, otherwise null",
            "priority": "high/medium/low based on risk level and urgency",
            "category": "legal_consultation/negotiation/compliance/risk_mitigation/documentation/other",
            "responsible_party": "Who should handle this action (e.g., 'Legal Team', 'Negotiator', 'Compliance Officer', 'Management')",
            "source_section": "Which part of the document this recommendation is based on",
            "status": "pending",
            "completed": false,
            "notes": "Additional context, legal reasoning, or strategic considerations",
            "consequences": "What risks or negative outcomes could occur if this action is not taken",
            "risk_reduction_impact": "How this action will reduce risk or improve legal position",
            "legal_basis": "Legal principle or regulation that supports this recommendation",
            "negotiation_leverage": "How this could be used in negotiations or discussions",
            "dependencies": ["List of other actions that should be completed first"],
            "evidence": "Exact text from document that indicates the risk or issue"
        }}
    ],
    "summary": {{
        "total_actions": "Number of risk mitigation actions found",
        "high_priority": "Number of high priority risk actions",
        "legal_consultation_needed": "Number of items requiring legal consultation",
        "negotiation_points": "Number of potential negotiation items",
        "compliance_issues": "Number of compliance-related actions"
    }},
    "categories": {{
        "legal_consultation": "Number of items requiring legal review/consultation",
        "negotiation": "Number of items that should be negotiated",
        "compliance": "Number of compliance-related actions",
        "risk_mitigation": "Number of risk reduction actions",
        "documentation": "Number of documentation improvements needed",
        "other": "Number of other action types"
    }},
    "ai_generated": true,
    "analysis_timestamp": "{timestamp}",
    "model_used": "gemini-2.5-flash"
}}

MANDATORY ACTION ITEMS TO IDENTIFY (at least 5-10 items):

1. **Legal Consultation Actions:**
   - "Consult legal counsel on [specific clause/section]"
   - "Have attorney review [specific terms] for compliance"
   - "Seek legal advice on [specific risk area]"

2. **Negotiation Actions:**
   - "Negotiate more favorable [specific terms]"
   - "Request modification of [specific clause]"
   - "Propose alternative [specific provision]"

3. **Risk Mitigation Actions:**
   - "Add [specific protection] to reduce liability"
   - "Include [specific clause] for risk management"
   - "Implement [specific safeguard]"

4. **Compliance Actions:**
   - "Review compliance with [specific regulation]"
   - "Ensure adherence to [specific legal requirement]"
   - "Update procedures for [specific compliance need]"

5. **Documentation Actions:**
   - "Document [specific agreement/understanding] in writing"
   - "Create records for [specific requirement]"
   - "Establish procedures for [specific process]"

UNIVERSAL RISK MITIGATION ACTIONS (apply to ANY legal document):
- "Consult legal counsel for comprehensive review"
- "Negotiate more favorable terms where possible"
- "Add dispute resolution clause if missing"
- "Review termination provisions for fairness"
- "Ensure proper indemnification protections"
- "Add confidentiality provisions if applicable"
- "Review liability limitation clauses"
- "Consider adding force majeure protection"
- "Document all verbal agreements in writing"
- "Establish clear communication protocols"

CRITICAL REQUIREMENTS:
1. You MUST identify at least 5-10 actionable items - this is mandatory
2. Focus on SPECIFIC actions, not general observations
3. Every legal document has risks that can be mitigated
4. Include both immediate actions and long-term strategies
5. Provide specific legal reasoning for each recommendation
6. Assess priority based on potential impact and urgency
7. Include exact text from the document as evidence
8. Consider both party perspectives and interests
9. Focus on practical, implementable recommendations
10. Ensure all actions address real legal risks or compliance needs

EXAMPLES OF SPECIFIC ACTION ITEMS:
- "Consult legal counsel on the non-compete clause duration and geographic scope"
- "Negotiate more favorable payment terms from 30 days to 15 days"
- "Add force majeure clause to protect against unforeseen events"
- "Review compliance with local employment law requirements"
- "Document all performance expectations in writing"
- "Request limitation of liability clause to cap potential damages"
- "Add confidentiality provisions to protect proprietary information"
- "Establish clear dispute resolution process with mediation option"
- "Review termination notice requirements for compliance"
- "Create written procedures for contract performance monitoring"

REMEMBER: Every legal document contains opportunities for risk mitigation and improvement. Your job is to identify these opportunities and provide specific, actionable recommendations.
"""

# Export Summary Prompt
EXPORT_SUMMARY_PROMPT = """
Create a comprehensive summary for export:

Document: {filename}
Analysis: {analysis}

Create a detailed summary including:
1. Document overview
2. Key findings
3. Risk assessment
4. Action items
5. Recommendations
6. Important dates
7. Parties involved

Format for export:
""" 