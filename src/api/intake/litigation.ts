import { Request, Response } from 'express';
import { prisma } from '../../app';
import { openai, litigationScorePrompt } from '../../utils/openai';

export const generateLitigationScore = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        injuries: true,
        address: true,
        uploads: true
      }
    });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
    
    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert personal injury litigation strategist.' },
        { role: 'user', content: litigationScorePrompt(lead) }
      ],
      temperature: 0.2
    });
    
    const responseContent = gptResponse.choices[0].message?.content;
    let assessment;
    
    try {
      assessment = JSON.parse(responseContent || '{}');
    } catch (error) {
      console.error('Error parsing GPT response:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse AI assessment'
      });
    }
    
    const litigationAssessment = await prisma.litigationAssessment.upsert({
      where: { 
        leadId 
      },
      update: {
        recommendedAction: assessment.recommendedAction,
        settleProbability: assessment.settleProbability,
        fileProbability: assessment.fileProbability,
        trialProbability: assessment.trialProbability,
        reasoning: assessment.reasoning,
        aiResponse: responseContent
      },
      create: {
        leadId,
        recommendedAction: assessment.recommendedAction,
        settleProbability: assessment.settleProbability,
        fileProbability: assessment.fileProbability,
        trialProbability: assessment.trialProbability,
        reasoning: assessment.reasoning,
        aiResponse: responseContent
      }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        assessment: litigationAssessment,
        fullResponse: assessment
      }
    });
  } catch (error) {
    console.error('Error generating litigation score:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate litigation score'
    });
  }
};
