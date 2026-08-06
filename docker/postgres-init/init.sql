-- LMS SaaS PostgreSQL initialization script
-- This script runs when the PostgreSQL container is first created.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Note: Tables will be created by EF Core migrations.
-- This script is for initial database setup and extensions only.