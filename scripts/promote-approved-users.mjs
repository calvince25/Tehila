import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [result] = await connection.execute(
  "UPDATE users SET role = 'admin' WHERE isApproved = 1 AND isDefaultAdmin = 0"
);
console.log(`Promoted approved accounts: ${result.affectedRows}`);
await connection.end();
