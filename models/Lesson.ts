import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILesson extends Document {
  title: string;
  teacher: string;
  room: string;
  type: 'lecture' | 'practice' | 'lab' | 'exam'; 
  day: string;
  startTime: string;
  endTime: string;
  isCustom: boolean; 
  createdAt: Date;
}

const LessonSchema: Schema = new Schema({
  title: { type: String, required: true },
  teacher: { type: String, required: true },
  room: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['lecture', 'practice', 'lab', 'exam'], 
    default: 'lecture' 
  },
  day: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isCustom: { type: Boolean, default: false },
}, { timestamps: true });

const Lesson: Model<ILesson> = mongoose.models.Lesson || mongoose.model<ILesson>('Lesson', LessonSchema);

export default Lesson;