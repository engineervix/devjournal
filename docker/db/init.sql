SELECT 'CREATE DATABASE devjournal' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'devjournal')\gexec
SELECT 'CREATE DATABASE test' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'test')\gexec
