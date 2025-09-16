import { AppDataSource } from '../data-source';
import { User } from '../entity/User';
import { Task } from '../entity/Task';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });


// This file contains the actual seeding logic for users and tasks.
// It can be run as a script (CLI) or called from the API endpoint.

export async function seedDatabase() {
  // Initialize DB connection if not already done (for API endpoint usage)
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  const userRepo = AppDataSource.getRepository(User);
  const taskRepo = AppDataSource.getRepository(Task);



  // --- Admin accounts ---
  // Always ensure main admin exists and is admin
  const adminAccounts = [
    { email: 'david@example.com', password: 'Password!' },
    { email: 'admin@example.com', password: 'Password!' },
  ];
  const admins: User[] = [];
  for (const admin of adminAccounts) {
    let user = await userRepo.findOneBy({ email: admin.email });
    if (!user) {
      const hashed = await bcrypt.hash(admin.password, 10);
      user = userRepo.create({ email: admin.email, password: hashed, role: 'admin' });
      user = await userRepo.save(user);
    } else if (user.role !== 'admin') {
      user.role = 'admin';
      user = await userRepo.save(user);
    }
    admins.push(user);
  }

  // --- Regular users ---
  const userAccounts = [
    { email: 'alice@example.com', password: 'Password!' },
    { email: 'bob@example.com', password: 'Password!' },
    { email: 'carol@example.com', password: 'Password!' },
    { email: 'dave@example.com', password: 'Password!' },
    { email: 'eve@example.com', password: 'Password!' },
  ];
  const users: User[] = [...admins];
  for (const account of userAccounts) {
    let user = await userRepo.findOneBy({ email: account.email });
    if (!user) {
      const hashed = await bcrypt.hash(account.password, 10);
      user = userRepo.create({ email: account.email, password: hashed });
      user = await userRepo.save(user);
    }
    users.push(user);
  }

  // --- Tasks: cover all statuses, categories, due dates, assignments ---
  const now = Date.now();
  const tasksData = [
    // Maintenance
    { title: 'Check HVAC system', description: 'Routine check of heating and cooling.', status: 'Pending', category: 'Maintenance', dueDate: now + 86400000, user: admins[0], assignee: users[2] },
    { title: 'Replace air filters', description: 'Replace all air filters in building.', status: 'In Progress', category: 'Maintenance', dueDate: now + 172800000, user: admins[1], assignee: users[3] },
    { title: 'Service elevator', description: 'Annual elevator maintenance.', status: 'Done', category: 'Maintenance', completedAt: now - 172800000, dueDate: now + 604800000, user: users[2], assignee: admins[0] },

    // Safety
    { title: 'Inspect fire extinguishers', description: 'Annual fire safety inspection.', status: 'Completed', category: 'Safety', completedAt: now - 86400000, dueDate: now, user: users[3], assignee: admins[1] },
    { title: 'Test emergency lights', description: 'Monthly emergency lighting test.', status: 'Pending', category: 'Safety', dueDate: now + 259200000, user: users[4], assignee: users[5] },
    { title: 'Test smoke alarms', description: 'Quarterly smoke alarm test.', status: 'Accepted', category: 'Safety', dueDate: now + 691200000, user: users[5], assignee: admins[0] },

    // Cleaning
    { title: 'Clean gutters', description: 'Remove debris from gutters.', status: 'In Progress', category: 'Cleaning', dueDate: now + 345600000, user: users[2], assignee: users[4] },

    // Renovation
    { title: 'Paint hallway', description: 'Repaint main hallway walls.', status: 'Pending', category: 'Renovation', dueDate: now + 432000000, user: users[3], assignee: users[1] },

  // Inspection (Overdue)
  { title: 'Check plumbing', description: 'Inspect pipes for leaks.', status: 'Pending', category: 'Inspection', dueDate: now - 86400000, user: users[4], assignee: users[2] },

    // More variety
    { title: 'Replace light bulbs', description: 'Replace all burnt out bulbs.', status: 'Pending', category: 'Maintenance', dueDate: now + 777600000, user: users[5], assignee: users[3] },
    { title: 'Window cleaning', description: 'Clean all exterior windows.', status: 'Done', category: 'Cleaning', completedAt: now - 432000000, dueDate: now - 259200000, user: admins[1], assignee: users[4] },
    { title: 'Roof inspection', description: 'Annual roof check.', status: 'Completed', category: 'Inspection', completedAt: now - 604800000, dueDate: now - 604800000, user: users[1], assignee: admins[0] },
    { title: 'Fire drill', description: 'Quarterly fire drill.', status: 'Accepted', category: 'Safety', dueDate: now + 345600000, user: users[2], assignee: admins[1] },
    { title: 'Lobby renovation', description: 'Renovate lobby area.', status: 'In Progress', category: 'Renovation', dueDate: now + 1209600000, user: users[3], assignee: users[5] },
  { title: 'Basement cleaning', description: 'Deep clean basement.', status: 'In-Progress', category: 'Cleaning', dueDate: now - 172800000, user: users[4], assignee: users[1] },
  // More overdue tasks for reminders testing
  { title: 'Overdue Safety Inspection', description: 'Missed annual safety check.', status: 'Accepted', category: 'Safety', dueDate: now - 259200000, user: users[1], assignee: users[3] },
  { title: 'Overdue HVAC Filter', description: 'Forgotten filter replacement.', status: 'Pending', category: 'Maintenance', dueDate: now - 345600000, user: admins[0], assignee: users[2] },
  { title: 'Overdue Painting', description: 'Missed painting schedule.', status: 'Pending', category: 'Renovation', dueDate: now - 604800000, user: users[3], assignee: users[1] },
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
