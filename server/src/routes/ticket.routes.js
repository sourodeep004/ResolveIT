
import { Router } from 'express';
import mongoose from 'mongoose';
import { body, query, param, validationResult } from 'express-validator';

import Ticket from '../models/Ticket.js';
import Comment from '../models/Comment.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { protect, allowRoles } from '../middleware/auth.js';

const router = Router();

router.use(protect);

const STATUSES = [
  'Open',
  'In Progress',
  'Pending',
  'Resolved',
  'Closed'
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const CATEGORIES = [
  'Hardware',
  'Software',
  'Network',
  'Access',
  'Other'
];

// SLA targets in calendar hours.
const SLA_HOURS = {
  Critical: 4,
  High: 8,
  Medium: 24,
  Low: 72
};

function calculateSlaDueAt(priority, from = new Date()) {
  const hours = SLA_HOURS[priority];

  if (!hours) {
    throw new Error(`Unsupported SLA priority: ${priority}`);
  }

  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

// Add an SLA deadline to older tickets that do not have one.
// Preserve existing deadlines.
async function ensureSlaDeadline(ticket) {
  if (!ticket.dueAt) {
    ticket.dueAt = calculateSlaDueAt(
      ticket.priority || 'Medium',
      ticket.createdAt || new Date()
    );

    await ticket.save();
  }

  return ticket;
}

function getSlaStatus(ticket, now = new Date()) {
  if (['Resolved', 'Closed'].includes(ticket.status)) {
    return 'Completed';
  }

  if (
    ticket.dueAt &&
    new Date(ticket.dueAt).getTime() < now.getTime()
  ) {
    return 'Overdue';
  }

  return 'Within SLA';
}

// Always include slaStatus in serialized ticket responses.
function serializeTicket(ticket) {
  const data =
    typeof ticket.toObject === 'function'
      ? ticket.toObject()
      : { ...ticket };

  data.slaStatus = getSlaStatus(data);

  return data;
}

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Invalid input.',
      errors: errors.array()
    });
  }

  next();
};

const sameId = (a, b) => {
  if (!a || !b) return false;

  const idA = a._id ?? a;
  const idB = b._id ?? b;

  return String(idA) === String(idB);
};

function canView(ticket, user) {
  if (user.role === 'admin') return true;

  if (user.role === 'employee') {
    return sameId(ticket.createdBy, user._id);
  }

  if (user.role === 'agent') {
    return sameId(ticket.assignedTo, user._id);
  }

  return false;
}

const transitions = {
  Open: ['In Progress'],
  'In Progress': ['Pending', 'Resolved'],
  Pending: ['In Progress', 'Resolved'],
  Resolved: ['Closed', 'In Progress'],
  Closed: []
};

function canTransition(from, to, role) {
  if (from === to) return true;

  if (from === 'Closed' && to === 'Open') {
    return role === 'admin';
  }

  return transitions[from]?.includes(to) ?? false;
}

async function writeAudit(ticketId, actorId, action, details) {
  await AuditLog.create({
    ticket: ticketId,
    actor: actorId,
    action,
    details
  });
}

// GET /api/tickets/meta/agents
// Return eligible assignees.
router.get(
  '/meta/agents',
  allowRoles('agent', 'admin'),
  async (req, res, next) => {
    try {
      const agents = await User.find({
        role: { $in: ['agent', 'admin'] }
      }).select('name email role');

      return res.json({ data: agents });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/tickets
// List tickets with filters, search, pagination and SLA status.
router.get(
  '/',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(STATUSES),
  query('priority').optional().isIn(PRIORITIES),
  query('search').optional().trim().isLength({ max: 200 }),
  validate,
  async (req, res, next) => {
    try {
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 10);
      const filter = {};

      if (req.query.status) {
        filter.status = req.query.status;
      }

      if (req.query.priority) {
        filter.priority = req.query.priority;
      }

      // Role-based ticket visibility.
      if (req.user.role === 'employee') {
        filter.createdBy = req.user._id;
      } else if (req.user.role === 'agent') {
        filter.assignedTo = req.user._id;
      }

      if (req.query.search?.trim()) {
        filter.$text = {
          $search: req.query.search.trim()
        };
      }

      const [tickets, total] = await Promise.all([
        Ticket.find(filter)
          .populate('createdBy', 'name email')
          .populate('assignedTo', 'name email')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),

        Ticket.countDocuments(filter)
      ]);

      // Backfill missing deadlines on existing tickets.
      for (const ticket of tickets) {
        await ensureSlaDeadline(ticket);
      }

      return res.json({
        data: tickets.map((ticket) => serializeTicket(ticket)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/tickets
// Create a ticket and calculate its SLA deadline.
router.post(
  '/',
  body('title').trim().isLength({ min: 5, max: 120 }),
  body('description').trim().isLength({ min: 10, max: 5000 }),
  body('category').optional().isIn(CATEGORIES),
  body('priority').optional().isIn(PRIORITIES),
  validate,
  async (req, res, next) => {
    try {
      const priority = req.body.priority || 'Medium';

      const ticket = await Ticket.create({
        title: req.body.title,
        description: req.body.description,
        category: req.body.category || 'Other',
        priority,
        createdBy: req.user._id,
        dueAt: calculateSlaDueAt(priority)
      });

      await writeAudit(
        ticket._id,
        req.user._id,
        'Ticket created',
        `Ticket created by ${req.user.role}`
      );

      await ticket.populate('createdBy', 'name email');

      return res.status(201).json({
        data: serializeTicket(ticket)
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/tickets/:id
// Return ticket details, comments and audit history.
router.get(
  '/:id',
  param('id').isMongoId(),
  validate,
  async (req, res, next) => {
    try {
      const ticket = await Ticket.findById(req.params.id)
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email');

      if (!ticket) {
        return res.status(404).json({
          message: 'Ticket not found.'
        });
      }

      if (!canView(ticket, req.user)) {
        return res.status(403).json({
          message: 'You cannot view this ticket.'
        });
      }

      await ensureSlaDeadline(ticket);

      const [comments, history] = await Promise.all([
        Comment.find({ ticket: ticket._id })
          .populate('author', 'name role')
          .sort({ createdAt: 1 }),

        AuditLog.find({ ticket: ticket._id })
          .populate('actor', 'name role')
          .sort({ createdAt: -1 })
      ]);

      return res.json({
        data: serializeTicket(ticket),
        comments,
        history
      });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/tickets/:id
// Update ticket fields, enforce role permissions and recalculate SLA.
router.patch(
  '/:id',
  param('id').isMongoId(),
  body('status').optional().isIn(STATUSES),
  body('priority').optional().isIn(PRIORITIES),
  body('category').optional().isIn(CATEGORIES),
  body('assignedTo')
    .optional({ nullable: true })
    .custom((value) => {
      // Accept null or an empty string to unassign a ticket.
      if (value === null || value === '') return true;

      return mongoose.Types.ObjectId.isValid(value);
    }),
  body('title').optional().trim().isLength({ min: 5, max: 120 }),
  body('description').optional().trim().isLength({ min: 10, max: 5000 }),
  validate,
  async (req, res, next) => {
    try {
      const ticket = await Ticket.findById(req.params.id);

      if (!ticket) {
        return res.status(404).json({
          message: 'Ticket not found.'
        });
      }

      const changes = Object.keys(req.body);

      if (changes.length === 0) {
        return res.status(400).json({
          message: 'Provide at least one field to update.'
        });
      }

      const role = req.user.role;

      if (role === 'employee') {
        if (!sameId(ticket.createdBy, req.user._id)) {
          return res.status(403).json({
            message: 'You cannot update this ticket.'
          });
        }

        const allowed = ['title', 'description', 'category'];

        if (changes.some((key) => !allowed.includes(key))) {
          return res.status(403).json({
            message: 'Employees can only edit their ticket details.'
          });
        }
      } else if (role === 'agent') {
        if (!sameId(ticket.assignedTo, req.user._id)) {
          return res.status(403).json({
            message: 'You can only update tickets assigned to you.'
          });
        }

        const allowed = ['status', 'priority'];

        if (changes.some((key) => !allowed.includes(key))) {
          return res.status(403).json({
            message: 'Agents can update status and priority only.'
          });
        }
      } else if (role !== 'admin') {
        return res.status(403).json({
          message: 'You do not have permission to update tickets.'
        });
      }

      if (
        Object.hasOwn(req.body, 'assignedTo') &&
        role !== 'admin'
      ) {
        return res.status(403).json({
          message: 'Only administrators can assign tickets.'
        });
      }

      // Normalize an empty assignee value to null.
      if (
        Object.hasOwn(req.body, 'assignedTo') &&
        (req.body.assignedTo === '' || req.body.assignedTo === null)
      ) {
        req.body.assignedTo = null;
      }

      if (
        Object.hasOwn(req.body, 'assignedTo') &&
        req.body.assignedTo
      ) {
        const assigneeExists = await User.exists({
          _id: req.body.assignedTo,
          role: { $in: ['agent', 'admin'] }
        });

        if (!assigneeExists) {
          return res.status(400).json({
            message:
              'Tickets can only be assigned to an agent or administrator.'
          });
        }
      }

      // Ensure an existing ticket has a deadline before updating it.
      if (
        !ticket.dueAt &&
        !(
          req.body.priority &&
          req.body.priority !== ticket.priority
        )
      ) {
        await ensureSlaDeadline(ticket);
      }

      if (
        req.body.status &&
        !canTransition(ticket.status, req.body.status, role)
      ) {
        return res.status(400).json({
          message:
            `Invalid status transition: ${ticket.status} -> ${req.body.status}.`
        });
      }

      const previousStatus = ticket.status;
      const previousPriority = ticket.priority;
      const auditEntries = [];

      for (const field of changes) {
        const previous = ticket[field];
        const nextValue = req.body[field];

        const previousValue =
          previous == null ? null : previous.toString();

        const nextComparable =
          nextValue == null ? null : nextValue.toString();

        if (previousValue === nextComparable) continue;

        ticket[field] = nextValue;

        auditEntries.push({
          action:
            field === 'assignedTo'
              ? 'Ticket reassigned'
              : field === 'status'
                ? 'Status changed'
                : field === 'priority'
                  ? 'Priority changed'
                  : 'Ticket field updated',

          details:
            `${field}: ${previousValue ?? 'none'} -> ${nextComparable ?? 'none'}`
        });
      }

      // Recalculate deadline when the priority changes.
      if (
        req.body.priority &&
        req.body.priority !== previousPriority
      ) {
        ticket.dueAt = calculateSlaDueAt(req.body.priority);

        auditEntries.push({
          action: 'SLA deadline updated',
          details:
            `dueAt recalculated for ${req.body.priority} priority ` +
            `(${SLA_HOURS[req.body.priority]} calendar hours)`
        });
      }

      // Track when a ticket becomes resolved.
      if (
        req.body.status &&
        req.body.status !== previousStatus
      ) {
        if (req.body.status === 'Resolved') {
          ticket.resolvedAt = new Date();
        } else {
          ticket.resolvedAt = null;
        }
      }

      await ticket.save();

      for (const entry of auditEntries) {
        await writeAudit(
          ticket._id,
          req.user._id,
          entry.action,
          entry.details
        );
      }

      await ticket.populate([
        { path: 'createdBy', select: 'name email' },
        { path: 'assignedTo', select: 'name email' }
      ]);

      return res.json({
        data: serializeTicket(ticket)
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/tickets/:id/comments
// Add a comment to a ticket.
router.post(
  '/:id/comments',
  param('id').isMongoId(),
  body('body').trim().isLength({ min: 1, max: 2000 }),
  validate,
  async (req, res, next) => {
    try {
      const ticket = await Ticket.findById(req.params.id);

      if (!ticket) {
        return res.status(404).json({
          message: 'Ticket not found.'
        });
      }

      if (!canView(ticket, req.user)) {
        return res.status(403).json({
          message: 'You cannot comment on this ticket.'
        });
      }

      const comment = await Comment.create({
        ticket: ticket._id,
        author: req.user._id,
        body: req.body.body
      });

      await writeAudit(
        ticket._id,
        req.user._id,
        'Comment added',
        'A comment was added to the ticket.'
      );

      await comment.populate('author', 'name role');

      return res.status(201).json({
        data: comment
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
