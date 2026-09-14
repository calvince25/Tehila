import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await connection.query("SELECT id, price FROM canvases LIMIT 100");
let updated = 0;
for (const row of rows) {
  const price = String(row.price ?? "");
  const match = price.match(/€\s*([\d,.]+)/);
  if (!match) continue;
  const euros = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(euros)) continue;
  const kes = Math.round(euros * 145);
  await connection.execute("UPDATE canvases SET price = ? WHERE id = ?", [`KSh ${kes.toLocaleString("en-KE")}`, row.id]);
  updated += 1;
}
console.log(`Updated ${updated} canvas prices to KSh.`);
await connection.end();
