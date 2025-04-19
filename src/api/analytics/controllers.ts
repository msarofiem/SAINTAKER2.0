import { Request, Response } from 'express';
import { prisma } from '../../app';

export const getConversionHeatmap = async (req: Request, res: Response) => {
  try {
    const { period = 'day' } = req.query;
    
    let groupBy = '';
    let selectClause = '';
    
    if (period === 'hour') {
      groupBy = 'EXTRACT(HOUR FROM "createdAt")';
      selectClause = 'EXTRACT(HOUR FROM "createdAt") as time_slot';
    } else if (period === 'day') {
      groupBy = 'EXTRACT(DOW FROM "createdAt")';
      selectClause = 'EXTRACT(DOW FROM "createdAt") as time_slot';
    } else if (period === 'week') {
      groupBy = 'EXTRACT(WEEK FROM "createdAt")';
      selectClause = 'EXTRACT(WEEK FROM "createdAt") as time_slot';
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid period. Use hour, day, or week.'
      });
    }
    
    const conversionData = await prisma.$queryRaw`
      SELECT ${prisma.$raw(selectClause)}, COUNT(*) as total, 
      SUM(CASE WHEN status != 'New' THEN 1 ELSE 0 END) as converted
      FROM "Lead"
      GROUP BY ${prisma.$raw(groupBy)}
      ORDER BY ${prisma.$raw(groupBy)}
    `;
    
    return res.status(200).json({
      success: true,
      data: {
        period,
        conversionData
      }
    });
  } catch (error) {
    console.error('Error generating conversion heatmap:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate conversion heatmap'
    });
  }
};

export const getLeadTimeline = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        chaseLogs: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        uploads: {
          include: {
            signatures: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
    
    const timelineEvents = [
      {
        type: 'lead_created',
        date: lead.createdAt,
        description: 'Lead created'
      },
      ...lead.chaseLogs.map(log => ({
        type: 'chase',
        date: log.createdAt,
        description: `${log.type}: ${log.status}`,
        details: log
      })),
      ...lead.uploads.map(upload => ({
        type: 'document',
        date: upload.createdAt,
        description: `Document uploaded: ${upload.fileName}`,
        details: upload
      })),
      ...lead.uploads.flatMap(upload => 
        upload.signatures ? upload.signatures.map(sig => ({
          type: 'signature',
          date: sig.updatedAt,
          description: `Signature ${sig.status}`,
          details: sig
        })) : []
      )
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return res.status(200).json({
      success: true,
      data: {
        lead: {
          id: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          status: lead.status
        },
        timeline: timelineEvents
      }
    });
  } catch (error) {
    console.error('Error retrieving lead timeline:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve lead timeline'
    });
  }
};
