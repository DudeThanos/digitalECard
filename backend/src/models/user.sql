-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    photo_url VARCHAR(500),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    department VARCHAR(100),
    designation VARCHAR(100),
    company VARCHAR(100),
    branch VARCHAR(100),
    address TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add first_name and last_name columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_name') THEN
        ALTER TABLE users ADD COLUMN first_name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_name') THEN
        ALTER TABLE users ADD COLUMN last_name VARCHAR(255);
    END IF;
END $$;

-- Migrate existing name data to first_name and last_name
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id, name FROM users WHERE first_name IS NULL OR last_name IS NULL LOOP
        IF user_record.name IS NOT NULL AND user_record.name != '' THEN
            -- Split name into first and last name
            IF position(' ' in user_record.name) > 0 THEN
                -- Has space, split into first and last
                UPDATE users 
                SET first_name = split_part(user_record.name, ' ', 1),
                    last_name = substring(user_record.name from position(' ' in user_record.name) + 1)
                WHERE id = user_record.id;
            ELSE
                -- No space, put everything in first_name
                UPDATE users 
                SET first_name = user_record.name,
                    last_name = ''
                WHERE id = user_record.id;
            END IF;
        ELSE
            -- Empty name, set both to empty
            UPDATE users 
            SET first_name = '',
                last_name = ''
            WHERE id = user_record.id;
        END IF;
    END LOOP;
END $$;

-- Add branch column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'branch') THEN
        ALTER TABLE users ADD COLUMN branch VARCHAR(100);
    END IF;
END $$;

-- Add audit trail columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_edited_by') THEN
        ALTER TABLE users ADD COLUMN last_edited_by VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_edited_at') THEN
        ALTER TABLE users ADD COLUMN last_edited_at TIMESTAMP;
    END IF;
END $$;

-- Add must_change_password boolean column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'must_change_password') THEN
        ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Add permissions JSONB column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'permissions') THEN
        ALTER TABLE users ADD COLUMN permissions JSONB DEFAULT '{"can_backup": true, "can_manage_users": true, "can_view_audit": false}';
    END IF;
END $$;

-- Note: TOTP columns removed - TOTP is now only for superuser via system config

-- To auto-update updated_at on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column(); 

CREATE TABLE IF NOT EXISTS admin_audit_log (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 