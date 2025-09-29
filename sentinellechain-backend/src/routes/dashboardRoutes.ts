import { Router, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { protect, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

/**
 * Endpoint pour récupérer les statistiques agrégées pour le tableau de bord.
 * Actuellement, il retourne le nombre d'alertes par niveau de sévérité.
 */
router.get('/stats', protect, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const companyId = req.user?.companyId;

    if (!companyId) {
        res.status(403).json({ error: 'User company information is missing.' });
        return;
    }

    try {
        // 1. Agréger les alertes par sévérité
        const alertsBySeverity = await prisma.alert.groupBy({
            by: ['severity'],
            where: {
                companyId: companyId,
                status: { in: ['NEW', 'ACKNOWLEDGED'] } // Uniquement les alertes ouvertes
            },
            _count: {
                severity: true,
            },
        });

        // Formatter les données pour le graphique (ex: Recharts)
        const severityStats = alertsBySeverity.map(item => ({
            name: item.severity,
            value: item._count.severity,
        }));

        // 2. Agréger les alertes des 7 derniers jours
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const alertsOverTime = await prisma.alert.groupBy({
            by: ['createdAt'],
            where: {
                companyId: companyId,
                createdAt: {
                    gte: sevenDaysAgo,
                },
            },
            _count: {
                _all: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        // Regrouper par jour
        const dailyCounts = alertsOverTime.reduce((acc, item) => {
            const date = item.createdAt.toISOString().split('T')[0]; // Format YYYY-MM-DD
            acc[date] = (acc[date] || 0) + item._count._all;
            return acc;
        }, {} as Record<string, number>);

        const timeStats = Object.entries(dailyCounts).map(([date, count]) => ({
            date,
            count,
        }));


        res.status(200).json({
            severityStats,
            timeStats,
        });

    } catch (error) {
        console.error("Erreur lors de la récupération des statistiques du tableau de bord:", error);
        next(error);
    }
});

export default router;