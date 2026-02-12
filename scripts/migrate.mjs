import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  const {
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
  } = process.env;

  if (!DB_HOST || !DB_USER || !DB_NAME) {
    throw new Error("请在环境变量中配置 DB_HOST、DB_USER、DB_PASSWORD、DB_NAME");
  }

  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT ? Number(DB_PORT) : 3306,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true
  });

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_schema_migrations_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [rows] = await connection.query(
      "SELECT name FROM schema_migrations"
    );
    const applied = new Set(rows.map((r) => r.name));

    const migrationsDir = path.join(process.cwd(), "migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const fullPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(fullPath, "utf8");
      // eslint-disable-next-line no-console
      console.log(`Running migration ${file}...`);
      await connection.query(sql);
      await connection.query(
        "INSERT INTO schema_migrations (name) VALUES (?)",
        [file]
      );
    }

    const { SEED_ADMIN_USERNAME, SEED_ADMIN_PASSWORD } = process.env;
    if (SEED_ADMIN_USERNAME && SEED_ADMIN_PASSWORD) {
      const [users] = await connection.query(
        "SELECT id FROM users WHERE username = ? LIMIT 1",
        [SEED_ADMIN_USERNAME]
      );
      if (Array.isArray(users) && users.length === 0) {
        const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);
        await connection.query(
          "INSERT INTO users (username, password_hash, role, is_active, is_deleted) VALUES (?, ?, 'super_admin', 1, 0)",
          [SEED_ADMIN_USERNAME, passwordHash]
        );
        // eslint-disable-next-line no-console
        console.log("已创建初始超级管理员账号");
      }
    }

    // eslint-disable-next-line no-console
    console.log("数据库迁移完成");
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
