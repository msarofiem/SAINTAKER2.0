import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const evaluateIntakePrompt = (intakeData: any) => {
  return `
You are an expert personal injury intake evaluator. Please analyze this intake data and provide:
1. A score from 0-100 based on case quality (0=reject, 50=review, 100=excellent)
2. A recommendation: "Accept", "Review", or "Reject"
3. Key strengths of the case
4. Any red flags or concerns

Intake data:
- Name: ${intakeData.firstName} ${intakeData.lastName}
- Accident type: ${intakeData.typeOfAccident}
- Date of accident: ${intakeData.dateOfAccident}
- Injuries: ${intakeData.injuries?.map((i: any) => i.bodyPart).join(', ') || 'None specified'}
- Police involved: ${intakeData.policeInvolved ? 'Yes' : 'No'}
- Insurance information: ${intakeData.insurance || 'None specified'}
- Prior attorney: ${intakeData.priorAttorney ? 'Yes' : 'No'}

Provide your evaluation in this JSON format:
{
  "score": (0-100),
  "recommendation": "Accept/Review/Reject",
  "strengths": ["strength1", "strength2", ...],
  "redFlags": ["redFlag1", "redFlag2", ...],
  "explanation": "Brief explanation of your evaluation"
}
`;
};
