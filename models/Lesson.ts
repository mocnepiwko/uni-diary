// models/Lesson.ts
import mongoose, { Schema, model, models } from 'mongoose';

export interface ILesson {
  title: string;
  teacher: string;
  room: string;
  type: 'lecture' | 'practice' | 'lab' | 'exam';
  
 
  day?: string; 
  
  specificDate?: Date; 
  
  startTime: string;
  endTime: string;
  isCustom: boolean;
  createdAt: Date;
}

const LessonSchema = new Schema<ILesson>(
  {
    title: { type: String, required: true },
    teacher: { type: String, required: true },
    room: { type: String, required: true },
    type: { type: String, required: true },
    
    day: { type: String }, 
    specificDate: { type: Date },

    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isCustom: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Lesson = models.Lesson || model<ILesson>('Lesson', LessonSchema);

export default Lesson;