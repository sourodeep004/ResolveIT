import { Router } from 'express';
import { protect, allowRoles } from '../middleware/auth.js';
import Ticket from '../models/Ticket.js';

const router = Router();
router.use(protect, allowRoles('agent', 'admin'));
router.get('/summary', async (req, res, next) => {
  try {
    const [total, open, inProgress, resolved, critical, byStatus, byCategory] = await Promise.all([
      Ticket.countDocuments(), Ticket.countDocuments({ status: 'Open' }),
      Ticket.countDocuments({ status: 'In Progress' }), Ticket.countDocuments({ status: 'Resolved' }),
      Ticket.countDocuments({ priority: 'Critical', status: { $nin: ['Resolved', 'Closed'] } }),
      Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Ticket.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
    ]);
    const resolvedTickets = await Ticket.find({ resolvedAt: { $ne: null } }).select('createdAt resolvedAt');
    const averageResolutionHours = resolvedTickets.length
      ? Math.round(resolvedTickets.reduce((sum, t) => sum + (t.resolvedAt - t.createdAt) / 3600000, 0) / resolvedTickets.length * 10) / 10
      : null;
    res.json({ data: { total, open, inProgress, resolved, critical, averageResolutionHours, byStatus, byCategory } });
  } catch (err) { next(err); }
});
export default router;
