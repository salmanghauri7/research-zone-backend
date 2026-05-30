import { SchemaType } from "@google/generative-ai";
export function buildRadarPrompt(newPapers, savedPapers) {
  return `
You are a research assistant helping academics stay on top of new literature.

You will be given:
1. NEW PAPERS — recently published papers from arXiv
2. SAVED PAPERS — papers a researcher has already saved to their library

Your job is to analyze each new paper against the saved papers and detect:

RELEVANCE: The new paper is clearly about the same topic, problem, or domain as the saved papers.

CONTRADICTION: The new paper makes a claim, presents findings, or uses methodology that directly conflicts with something stated in a saved paper.
- This must be a specific, concrete conflict — not just a different approach
- Example: saved paper claims "method A outperforms method B", new paper shows "method B outperforms method A"
- Do NOT mark something as contradiction just because it studies a similar topic differently

For each new paper return a result. If a new paper is neither relevant nor contradictory, still include it with both flags as false.

NEW PAPERS:
${newPapers.map((p, i) => `
[${i + 1}] arxivId: ${p.id}
Title: ${p.title}
Authors: ${p.authors}
Abstract: ${p.summary}
`).join("\n")}

SAVED PAPERS (researcher's library):
${savedPapers.map((p, i) => `
[${i + 1}] Title: ${p.title}
Authors: ${p.authors}
Abstract: ${p.summary?.slice(0, 400) || ""}
`).join("\n")}

Analyze each new paper carefully against all saved papers.
`;
}

export const responseSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {

      arxivId: {
        type: SchemaType.STRING,
        description: "The arxiv ID of the new paper being analyzed",
      },

      isRelevant: {
        type: SchemaType.BOOLEAN,
        description: "True if this new paper is relevant to the researcher's saved library",
      },

      relevanceExplanation: {
        type: SchemaType.STRING,
        description: "One sentence explaining why it is relevant. Empty string if not relevant.",
      },

      hasContradiction: {
        type: SchemaType.BOOLEAN,
        description: "True if this new paper contradicts a specific claim in a saved paper",
      },

      contradictionDetail: {
        type: SchemaType.OBJECT,
        properties: {
          savedPaperTitle: {
            type: SchemaType.STRING,
            description: "Title of the saved paper being contradicted. Empty string if no contradiction.",
          },
          explanation: {
            type: SchemaType.STRING,
            description: "Specific explanation of what claim is being contradicted and how. Empty string if no contradiction.",
          },
        },
        required: ["savedPaperTitle", "explanation"],
      },

      confidence: {
        type: SchemaType.NUMBER,
        description: "Your confidence in this analysis from 0.0 to 1.0",
      },

    },
    required: [
      "arxivId",
      "isRelevant",
      "relevanceExplanation",
      "hasContradiction",
      "contradictionDetail",
      "confidence",
    ],
  },
};
