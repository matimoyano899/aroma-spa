import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 80 },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    verifiedAt: { type: Date, default: null },
    role: { type: String, enum: ['client', 'admin'], default: 'client' },
    verificationHash: { type: String, select: false },
    verificationExpires: { type: Date, select: false },
  },
  { timestamps: true },
)

userSchema.index({ verificationHash: 1 }, { unique: true, sparse: true })
export const User = mongoose.model('User', userSchema)
