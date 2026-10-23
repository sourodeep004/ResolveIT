
import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 120,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },

    category: {
      type: String,
      enum: ['Hardware', 'Software', 'Network', 'Access', 'Other'],
      default: 'Other',
    },

    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },

    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'],
      default: 'Open',
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    dueAt: {
      type: Date,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// 1. Optimize employee ticket lists sorted by newest first.
ticketSchema.index({
  createdBy: 1,
  createdAt: -1,
});

// 2. Optimize agent ticket lists sorted by newest first.
ticketSchema.index({
  assignedTo: 1,
  createdAt: -1,
});

// 3. Support combined status and priority filtering.
ticketSchema.index({
  status: 1,
  priority: 1,
  createdAt: -1,
});

// 4. Support text searches across ticket titles and descriptions.
ticketSchema.index({
  title: 'text',
  description: 'text',
});

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
