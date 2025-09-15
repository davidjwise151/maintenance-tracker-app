import { AppDataSource } from '../data-source';
import { User } from '../entity/User';
import { Task } from '../entity/Task';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });


// This file contains the actual seeding logic for users and tasks.
// It can be run as a script (CLI) or called from the API endpoint.
export async function seedDatabase() {
  // Only initialize if not already initialized (for API endpoint usage)
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  const userRepo = AppDataSource.getRepository(User);
  const taskRepo = AppDataSource.getRepository(Task);

  // Create or update test admin user
  let adminUser = await userRepo.findOneBy({ email: 'david@example.com' });
  if (!adminUser) {
    const hashed = await bcrypt.hash('Password!', 10);
    adminUser = userRepo.create({ email: 'david@example.com', password: hashed, role: 'admin' });
    await userRepo.save(adminUser);
  } else if (adminUser.role !== 'admin') {
    adminUser.role = 'admin';
    await userRepo.save(adminUser);
  }

  // Create 5 other users
  const usersData = [
    { email: 'alice@example.com', password: 'Password!' },
    { email: 'bob@example.com', password: 'Password!' },
    { email: 'carol@example.com', password: 'Password!' },
    { email: 'dave@example.com', password: 'Password!' },
    { email: 'eve@example.com', password: 'Password!' },
  ];

  const users: User[] = [adminUser];
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

  // Only destroy if running as a script, not from API
  if (require.main === module) {
    await AppDataSource.destroy();
  }
}

if (require.main === module) {
  seedDatabase().then(() => {
    console.log('Seeding complete');
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
}
