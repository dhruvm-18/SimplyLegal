#!/usr/bin/env python3
"""
AI Prompts for SimplyLegal
"""

SIMPLE_ANALYSIS_PROMPT = """
Analyze this legal document and provide:
1. Document type and purpose
2. Key parties involved
3. Main terms and conditions
4. Important dates and deadlines
5. Potential risks or concerns

Document content:
{content}
"""

DOCUMENT_ANALYSIS_PROMPT = SIMPLE_ANALYSIS_PROMPT

SIMPLE_SUMMARY_PROMPT = """
Provide a concise summary of this legal document in plain language:

{content}
"""

PLAIN_LANGUAGE_ANALYSIS_PROMPT = """
Explain this legal document in simple, plain language that anyone can understand:

{content}
"""

DEEP_ANALYSIS_PROMPT = """
Provide a detailed legal analysis of this document including:
1. Legal implications
2. Potential risks
3. Recommended actions
4. Key clauses to review

{content}
"""

QA_CONTEXT_PROMPT = """
Based on this legal document, answer the following question:

Document: {content}

Question: {question}
"""