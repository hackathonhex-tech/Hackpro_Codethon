import mongoose from 'mongoose';
import { BaseRepository } from '../../utils/baseRepository.js';

const invitationLogSchema = new mongoose.Schema(
  {
    _id: { type: String },
    id: { type: String },
    contestId: { type: String, required: true, index: true },
    participantId: { type: String, required: true, index: true },
    email: { type: String, required: true },
    name: { type: String, default: 'Candidate' },
    rollNumber: { type: String, default: '—' },
    batchCode: { type: String, default: '—' },
    status: {
      type: String,
      enum: ['pending', 'delivered', 'failed'],
      default: 'pending',
    },
    messageId: { type: String },
    errorMsg: { type: String },
    sentAt: { type: String },
  },
  { timestamps: true, _id: false }
);

invitationLogSchema.pre('save', function (next) {
  if (!this._id && this.id) this._id = this.id;
  if (!this.id && this._id) this.id = this._id;
  next();
});

const InvitationLogModel =
  mongoose.models.InvitationLog || mongoose.model('InvitationLog', invitationLogSchema);

export class InvitationLogRepository extends BaseRepository {
  constructor() {
    super('invitation_logs', InvitationLogModel);
  }

  async findByContest(contestId) {
    return this.find({ contestId });
  }

  async findByContestAndParticipant(contestId, participantId) {
    return this.findOne({ contestId, participantId });
  }

  async upsertLog(contestId, participantId, data) {
    const existing = await this.findByContestAndParticipant(contestId, participantId);
    if (existing) {
      return this.update(existing.id || existing._id, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    }
    return this.create({
      contestId,
      participantId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

export const invitationLogRepository = new InvitationLogRepository();
