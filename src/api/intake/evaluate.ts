import { Request, Response } from 'express';
import { prisma } from '../../app';
import { openai, evaluationPrompt } from '../../utils/openai';

export const evaluateIntake = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        injuries: true,
        address: true,
        priorAttorney: true
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
        { role: 'system', content: 'You are an expert personal injury case evaluator.' },
        { role: 'user', content: evaluationPrompt(lead) }
      ],
      temperature: 0.2
    });
    
    const responseContent = gptResponse.choices[0].message?.content;
    let evaluation;
    
    try {
      evaluation = JSON.parse(responseContent || '{}');
    } catch (error) {
      console.error('Error parsing GPT response:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse AI evaluation'
      });
    }
    
    const intakeEvaluation = await prisma.intakeEvaluation.upsert({
      where: { 
        leadId 
      },
      update: {
        score: evaluation.score,
        recommendation: evaluation.recommendation,
        redFlags: evaluation.redFlags,
        strengths: evaluation.strengths,
        aiResponse: responseContent
      },
      create: {
        leadId,
        score: evaluation.score,
        recommendation: evaluation.recommendation,
        redFlags: evaluation.redFlags,
        strengths: evaluation.strengths,
        aiResponse: responseContent
      }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        evaluation: intakeEvaluation,
        fullResponse: evaluation
      }
    });
  } catch (error) {
    console.error('Error evaluating intake:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to evaluate intake'
    });
  }
};
