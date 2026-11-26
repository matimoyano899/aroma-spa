import { User } from '../models/user.model.js'

export const userRepository = {
  create: (data) => User.create(data),
  findForLogin: (email) => User.findOne({ email }).select('+passwordHash'),
  findById: (id) => User.findById(id),
  rotateVerification: (email, fields) =>
    User.findOneAndUpdate(
      { email, verifiedAt: null },
      { $set: fields },
      { returnDocument: 'after' },
    ),
  verify: (hash, now) =>
    User.findOneAndUpdate(
      { verificationHash: hash, verificationExpires: { $gt: now }, verifiedAt: null },
      {
        $set: { verifiedAt: now },
        $unset: { verificationHash: 1, verificationExpires: 1 },
      },
      { returnDocument: 'after' },
    ),
}
