# Miky Sound Systems & Electronics — store

Next.js + TypeScript (strict) + Tailwind + PostgreSQL + Prisma 7.

## First-time setup
1. Install Node 22+ and PostgreSQL. Create an empty database named `miky`.
2. `npm install`
3. `cp .env.example .env` and set `DATABASE_URL`.
4. `npx prisma validate` then `npx prisma generate`
5. `npx prisma migrate dev --name init`
6. `npx prisma migrate dev --create-only --name constraints`, then paste the contents of
   `prisma/sql/constraints.sql` into the new empty migration file and run `npx prisma migrate dev`.
7. Create the owner (one time): set `OWNER_NAME`, `OWNER_USERNAME`, `OWNER_PASSWORD` (12+ chars) in your shell, then `npm run owner`.
8. `npm run dev`

Status: schema and constraints are written but NOT yet validated against a live PostgreSQL. Step 4-6 are the first verification.
