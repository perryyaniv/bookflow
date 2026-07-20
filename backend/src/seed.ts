import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User';
import Branch from './models/Branch';
import AppSettings from './models/AppSettings';

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookflow');
  console.log('Connected');

  const existing = await User.findOne({ username: 'admin' });
  if (!existing) {
    await User.create({
      name: 'מנהל',
      username: 'admin',
      password: 'admin',
      role: 'admin',
      forcePasswordChange: false,
    });
    console.log('Created admin user (username: admin, password: admin)');
  }

  const branches = ['סניף 1', 'סניף 2'];
  for (const name of branches) {
    await Branch.findOneAndUpdate({ name }, { name }, { upsert: true });
  }

  const existingSettings = await AppSettings.findOne();
  if (!existingSettings) {
    await AppSettings.create({});
    console.log('Created default settings');
  }

  console.log('Seed complete');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
