import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },

    actor: {
      id: { type: Number },
      email: { type: String },
      role: { type: String },
      ip: { type: String },
      userAgent: { type: String }
    },

    target: {
      type: { type: String },
      id: { type: String },
      label: { type: String }
    },

    changes: {
      before: { type: mongoose.Schema.Types.Mixed },
      after: { type: mongoose.Schema.Types.Mixed }
    },

    status: { type: String },
    requestId: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },

    userId: { type: Number },
    resourceType: { type: String },
    resourceId: { type: String },
    ip: { type: String },
    userAgent: { type: String },

    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ "actor.id": 1 });
auditLogSchema.index({ "target.type": 1 });
auditLogSchema.index({ action: 1 });

export default mongoose.model("AuditLog", auditLogSchema);
