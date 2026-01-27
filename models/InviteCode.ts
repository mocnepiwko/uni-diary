// models/InviteCode.ts
import mongoose, { Schema, model, models } from 'mongoose';

export interface IInviteCode {
  code: string;
  role: string;
  isUsed: boolean;
  usedBy?: string; 
  createdAt: Date;
}

const InviteCodeSchema = new Schema<IInviteCode>({
  code: { type: String, required: true, unique: true },
  role: { type: String, default: 'teacher' },
  isUsed: { type: Boolean, default: false },
  usedBy: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const InviteCode = models.InviteCode || model<IInviteCode>('InviteCode', InviteCodeSchema);

export default InviteCode;