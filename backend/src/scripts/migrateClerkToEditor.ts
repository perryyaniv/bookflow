import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';

dotenv.config();

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookflow');
  const result = await User.updateMany({ role: 'clerk' }, { $set: { role: 'editor' } });
  console.log(`Migrated ${result.modifiedCount} user(s) from clerk to editor`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
