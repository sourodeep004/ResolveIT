import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true, maxlength: 100 },
  details: { type: String, default: '', maxlength: 1000 }
}, { timestamps: true });

export default mongoose.model('AuditLog', auditLogSchema);
