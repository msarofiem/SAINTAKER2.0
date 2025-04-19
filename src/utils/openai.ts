import { OpenAI } from 'openai';

const apiKey = process.env.OPENAI_API_KEY || '';
export const openai = new OpenAI({ apiKey });

/**
 * Generate a prompt for evaluating intake leads
 */
export const evaluationPrompt = (leadData: any) => {
  return `
You are an expert personal injury case evaluator. Based on the information provided, score this lead from 0-100 and provide a recommendation (Accept, Review, or Reject).

Lead information:
- Name: ${leadData.firstName} ${leadData.lastName}
- Type of accident: ${leadData.typeOfAccident}
- Date of accident: ${leadData.dateOfAccident}
- Injuries: ${leadData.injuries?.map((i: any) => i.bodyPart).join(', ') || 'None specified'}
- Police involved: ${leadData.policeInvolved ? 'Yes' : 'No'}
- Insurance: ${leadData.insurance || 'None specified'}
- Prior attorney: ${leadData.priorAttorney?.spokenTo ? 'Yes' : 'No'}

Provide your assessment in this JSON format:
{
  "score": 0-100,
  "recommendation": "Accept/Review/Reject",
  "redFlags": "List any red flags or concerns",
  "strengths": "List case strengths"
}
`;
};

/**
 * Generate a prompt for litigation strategy scoring
 */
export const litigationScorePrompt = (leadData: any) => {
  return `
You are an expert personal injury litigation strategist. Based on the case details provided, recommend the best strategy:
1. Settle - Early settlement is recommended
2. File - File lawsuit but aim to settle before trial
3. Trial - Take the case to trial

Provide percentage probabilities for each option, ensuring they sum to 100%.

Case details:
- Name: ${leadData.firstName} ${leadData.lastName}
- Accident type: ${leadData.typeOfAccident}
- Date of accident: ${leadData.dateOfAccident}
- Injuries: ${leadData.injuries?.map((i: any) => i.bodyPart).join(', ') || 'None specified'}
- Initial medical care: ${leadData.initialCare || 'Not specified'}
- Police involved: ${leadData.policeInvolved ? 'Yes' : 'No'}
- Insurance information: ${leadData.insurance || 'None specified'}
- UM/UIM coverage: ${leadData.hasUmUimCoverage ? 'Yes' : 'No'}
- Signed client: ${leadData.status.includes('Signed') ? 'Yes' : 'No'}

Provide your assessment in this JSON format:
{
  "recommendedAction": "Settle/File/Trial",
  "settleProbability": 0-100,
  "fileProbability": 0-100,
  "trialProbability": 0-100,
  "reasoning": "Brief explanation of your recommendation"
}
`;
};
