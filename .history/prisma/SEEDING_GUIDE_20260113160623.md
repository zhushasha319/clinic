# Database Seeding Guide

## Setup Instructions

### 1. Install Dependencies

First, ensure you have all required dependencies:

```bash
npm install -D ts-node
```

### 2. Configure Database

Create a `.env` file in the root directory with your database connection:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/clinic_db?schema=public"
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Run Database Migrations

Create the database schema:

```bash
npx prisma migrate dev --name init
```

### 5. Seed the Database

Run the seed script to populate initial data:

```bash
npx prisma db seed
```

## What Gets Seeded

The seed script (`prisma/seed.ts`) will insert the following data:

- ✅ **App Settings** (1 record)

  - Working hours: 9:00 AM - 5:00 PM
  - 2 slots per hour
  - 10-minute reservation duration

- ✅ **Working Days** (7 records)

  - Monday - Saturday: Working days
  - Sunday: Non-working day

- ✅ **Departments** (6 records)

  - Cardiology (Heart icon)
  - Neurology (Brain icon)
  - Pediatrics (Baby icon)
  - Orthopedics (Bone icon)
  - Dermatology (Sparkles icon)
  - Ophthalmology (Eye icon)

- ✅ **Banner Images** (1 record)

  - Welcome banner for homepage

- ✅ **Users** (7 records)
  - 3 Patients (John Doe, Jane Smith, Peter Jones)
  - 1 Admin (admin@clinic.com, password: 12345)
  - 3 Doctors (Dr. Alice Williams, Dr. Bob Brown, Dr. Carol Davis)

## Data Source

All seed data is imported from `db/dummydata2.ts`.

## Useful Commands

```bash
# View database in browser
npx prisma studio

# Reset database and re-seed
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

## Notes

- The seed script uses `upsert` operations, so it's safe to run multiple times
- User passwords are placeholder values - implement proper hashing before production
- Email is used as the unique identifier for users
- The script will output progress and a summary when complete
