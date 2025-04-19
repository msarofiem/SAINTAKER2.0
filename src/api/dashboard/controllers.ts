import { Request, Response } from 'express';
import { prisma } from '../../app';

export const getLeads = async (req: Request, res: Response) => {
  try {
    const { status, source, specialist, page = '1', limit = '10' } = req.query;
    
    const filters = {
      where: {
        ...(status ? { status: status as string } : {}),
        ...(source ? { source: source as string } : {}),
      }
    };
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);
    
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        ...filters,
        skip,
        take,
        include: {
          address: true,
          injuries: true,
          priorAttorney: true,
          chaseLogs: {
            orderBy: {
              scheduledFor: 'desc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.lead.count(filters)
    ]);
    
    return res.status(200).json({
      success: true,
      data: leads,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch leads'
    });
  }
};

export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const [
      totalLeads,
      newLeads,
      inProgressLeads,
      completedLeads,
      referredLeads,
      rejectedLeads,
      leadsBySource,
      leadsByDay
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: 'New' } }),
      prisma.lead.count({ where: { status: 'In Progress' } }),
      prisma.lead.count({ where: { status: 'Completed' } }),
      prisma.lead.count({ where: { status: 'Referred' } }),
      prisma.lead.count({ where: { status: 'Rejected' } }),
      prisma.lead.groupBy({
        by: ['source'],
        _count: true,
        orderBy: {
          _count: {
            source: 'desc'
          }
        }
      }),
      prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM "Lead"
        WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `
    ]);
    
    return res.status(200).json({
      success: true,
      data: {
        totalLeads,
        newLeads,
        inProgressLeads,
        completedLeads,
        referredLeads,
        rejectedLeads,
        leadsBySource,
        leadsByDay
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard metrics'
    });
  }
};
