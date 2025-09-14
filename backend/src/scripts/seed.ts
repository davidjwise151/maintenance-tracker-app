import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import { AppDataSource } from '../data-source';
import { User } from '../entity/User';
import { Task } from '../entity/Task';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding database at path:', process.env.DB_PATH);
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const taskRepo = AppDataSource.getRepository(Task);

  // Create 5 users
  const usersData = [
    { email: 'alice@example.com', password: 'Password!' },
    { email: 'bob@example.com', password: 'Password!' },
    { email: 'carol@example.com', password: 'Password!' },
    { email: 'dave@example.com', password: 'Password!' },
    { email: 'eve@example.com', password: 'Password!' },
  ];

  const users: User[] = [];
  for (const data of usersData) {
    const hashed = await bcrypt.hash(data.password, 10);
    const user = userRepo.create({ email: data.email, password: hashed });
    users.push(await userRepo.save(user));
  }

  // Create 10 tasks, 2 for each user, with varied assignments
  const now = Date.now();
  const tasksData = [
    {
      title: 'Check HVAC system',
      description: 'Routine check of heating and cooling.',
      status: 'Pending',
      category: 'Maintenance',
      dueDate: now + 86400000,
      user: users[0],
      assignee: users[1],
    },
    {
      title: 'Replace air filters',
      description: 'Replace all air filters in building.',
      status: 'In Progress',
      category: 'Maintenance',
      dueDate: now + 172800000,
      user: users[0],
      assignee: users[2],
    },
    {
      title: 'Inspect fire extinguishers',
      description: 'Annual fire safety inspection.',
      status: 'Completed',
      category: 'Safety',
      completedAt: now - 86400000,
      dueDate: now,
      user: users[1],
      assignee: users[0],
    },
    {
      title: 'Test emergency lights',
      description: 'Monthly emergency lighting test.',
      status: 'Pending',
      category: 'Safety',
      dueDate: now + 259200000,
      user: users[1],
      assignee: users[3],
    },
    {
      title: 'Clean gutters',
      description: 'Remove debris from gutters.',
      status: 'In Progress',
      category: 'Cleaning',
      dueDate: now + 345600000,
      user: users[2],
      assignee: users[4],
    },
    {
      title: 'Paint hallway',
      description: 'Repaint main hallway walls.',
      status: 'Pending',
      category: 'Renovation',
      dueDate: now + 432000000,
      user: users[2],
      assignee: users[1],
    },
    {
      title: 'Service elevator',
      description: 'Annual elevator maintenance.',
      status: 'Completed',
      category: 'Maintenance',
      completedAt: now - 172800000,
      dueDate: now + 604800000,
      user: users[3],
      assignee: users[2],
    },
    {
      title: 'Check plumbing',
      description: 'Inspect pipes for leaks.',
      status: 'Pending',
      category: 'Inspection',
      dueDate: now + 518400000,
      user: users[3],
      assignee: users[4],
    },
    {
      title: 'Test smoke alarms',
      description: 'Quarterly smoke alarm test.',
      status: 'In Progress',
      category: 'Safety',
      dueDate: now + 691200000,
      user: users[4],
      assignee: users[0],
    },
    {
      title: 'Replace light bulbs',
      description: 'Replace all burnt out bulbs.',
      status: 'Pending',
      category: 'Maintenance',
      dueDate: now + 777600000,
      user: users[4],
      assignee: users[3],
    },
  ];

  for (const data of tasksData) {
    const task = taskRepo.create(data);
    await taskRepo.save(task);
  }

  console.log('Seed data inserted successfully.');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
