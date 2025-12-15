import mongoose, { Schema, model, models } from 'mongoose';

export interface IHomework {
  subject: string;
  description: string;
  deadline: Date;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
  _id?: string;
}

const HomeworkSchema = new Schema<IHomework>(
  {
    subject: { type: String, required: true },
    description: { type: String, required: true },
    deadline: { type: Date, required: true },
    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Homework = models.Homework || model<IHomework>('Homework', HomeworkSchema);

export default Homework;