
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const accounts = [
  {
    name: 'ResolveIT Test Agent',
    email: 'resolveit.agent@example.com',
    role: 'agent',
    department: 'IT Support',
    password: process.env.AGENT_PASSWORD
  },
  {
    name: 'ResolveIT Test Admin',
    email: 'resolveit.admin@example.com',
    role: 'admin',
    department: 'IT Administration',
    password: process.env.ADMIN_PASSWORD
  }
];

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing from server/.env');
  }

  for (const account of accounts) {
    if (!account.password || account.password.length < 8) {
      throw new Error(
        `Set a password of at least 8 characters for ${account.role}.`
      );
    }
  }

  await mongoose.connect(process.env.MONGODB_URI);

  for (const account of accounts) {
    let user = await User.findOne({ email: account.email });

    if (user) {
      user.name = account.name;
      user.role = account.role;
      user.department = account.department;
      // Preserve the existing password for an existing account.
      await user.save();
      console.log(`Updated role for ${account.email}: ${account.role}`);
    } else {
      await User.create(account);
      console.log(`Created ${account.email}: ${account.role}`);
    }
  }
}

main()
  .catch((error) => {
    console.error('Seed script failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
