import mysql from "mysql2/promise";

const globalForMysql = globalThis as unknown as {
  mysqlPool?: mysql.Pool;
};

export function getPool() {
  if (!globalForMysql.mysqlPool) {
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

    globalForMysql.mysqlPool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT ? Number(DB_PORT) : 3306,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      connectionLimit: 10
    });
  }

  return globalForMysql.mysqlPool;
}

export async function query<T = any>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const [rows] = await getPool().query(sql, params);
  return rows as T[];
}
