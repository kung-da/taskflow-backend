// prisma/seed.js
// Seeds the database with sample todos for quick testing/demo.
// Run with: npm run prisma:seed

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleTodos = [
  { title: 'Complete the backend API', description: 'All 6 CRUD endpoints with validation', isCompleted: true },
  { title: 'Build the frontend UI', description: 'React components with Tailwind styling', isCompleted: false },
  { title: 'Write unit tests', description: 'Service layer and validators', isCompleted: true },
  { title: 'Write integration tests', description: 'API routes end-to-end', isCompleted: false },
  { title: 'Add search and filter', description: 'Debounced search, status filter tabs', isCompleted: false },
  { title: 'Handle edge cases', description: 'Empty titles, long text, rapid clicks', isCompleted: false },
  { title: 'Write README', description: 'Setup instructions, API docs, design decisions', isCompleted: false },
  { title: 'Set up Docker', description: 'Dockerfiles + docker-compose for full stack', isCompleted: true },
  { title: 'Deploy to production', description: 'Vercel for frontend, Render for backend', isCompleted: false },
  { title: 'Record demo video', description: 'Quick walkthrough of the application', isCompleted: false },
];

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.todo.deleteMany();

  // Insert sample data
  for (const todo of sampleTodos) {
    await prisma.todo.create({ data: todo });
  }

  const count = await prisma.todo.count();
  console.log(`Seeded ${count} todos.`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
