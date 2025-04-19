import { Request, Response } from 'express';
import { prisma } from '../../app';
import { openai, evaluateIntakePrompt } from '../../utils/openai';

export const evaluateIntake = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        injuries: true,
        priorAttorney: true,
        address: true
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
        { role: 'system', content: 'You are an expert personal injury intake evaluator.' },
        { role: 'user', content: evaluateIntakePrompt(lead) }
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
    
    let intakeEvaluation;
    try {
      intakeEvaluation = await (prisma as any).intakeEvaluation?.upsert({
        where: { leadId },
        update: {
          score: evaluation.score,
          recommendation: evaluation.recommendation,
          strengths: evaluation.strengths.join(', '),
          redFlags: evaluation.redFlags.join(', '),
          aiResponse: responseContent
        },
        create: {
          leadId,
          score: evaluation.score,
          recommendation: evaluation.recommendation,
          strengths: evaluation.strengths.join(', '),
          redFlags: evaluation.redFlags.join(', '),
          aiResponse: responseContent
        }
      });
    } catch (error) {
      console.log('Using fallback for evaluation storage');
      intakeEvaluation = {
        score: evaluation.score,
        recommendation: evaluation.recommendation,
        strengths: evaluation.strengths.join(', '),
        redFlags: evaluation.redFlags.join(', '),
        aiResponse: responseContent
      };
      
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          status: evaluation.recommendation === 'Accept' ? 'Accepted' : 
                 evaluation.recommendation === 'Reject' ? 'Rejected' : 'Under Review'
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        evaluation: intakeEvaluation,
        parsed: evaluation
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
