-- Unify CASHIER and WAITRESS into STAFF
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'STAFF');

ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING (
  CASE
    WHEN "role"::text IN ('CASHIER', 'WAITRESS') THEN 'STAFF'::"UserRole_new"
    ELSE "role"::text::"UserRole_new"
  END
);

DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
