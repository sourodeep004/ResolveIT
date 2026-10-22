import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false });
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid input.', errors: errors.array() });
  next();
};
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role, department: user.department });
const issueToken = (user) => jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '8h' });

router.post('/register', authLimiter,
  body('name').trim().isLength({ min: 2, max: 80 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must contain at least 8 characters.'),
  body('department').optional().trim().isLength({ max: 80 }),
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password, department } = req.body;
      if (await User.exists({ email })) return res.status(409).json({ message: 'An account with this email already exists.' });
      // Public registration always creates an employee. Elevated roles must be assigned by an administrator.
      const user = await User.create({ name, email, password, department });
      res.status(201).json({ token: issueToken(user), user: publicUser(user) });
    } catch (err) { next(err); }
  }
);

router.post('/login', authLimiter,
  body('email').isEmail().normalizeEmail(), body('password').isString().notEmpty(), validate,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email }).select('+password');
      if (!user || !(await user.comparePassword(req.body.password))) {
        return res.status(401).json({ message: 'Email or password is incorrect.' });
      }
      res.json({ token: issueToken(user), user: publicUser(user) });
    } catch (err) { next(err); }
  }
);

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

export default router;
