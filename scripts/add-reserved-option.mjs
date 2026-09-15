import fs from "node:fs";
const path = "client/src/pages/AdminDashboard.tsx";
const source = fs.readFileSync(path, "utf8");
const from = '<option value="one_of_one">One of one</option><option value="coming_soon">';
const to = '<option value="one_of_one">One of one</option><option value="reserved">Reserved</option><option value="coming_soon">';
if (!source.includes(from)) throw new Error("Canvas status option not found");
fs.writeFileSync(path, source.replace(from, to));
