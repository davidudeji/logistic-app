import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { config } from './env.js';

const { Pool } = pg;
const pool = new Pool({
  connectionString: config.databaseUrl || 'postgresql://localhost:5432/alm_logistics',
});

export const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});
