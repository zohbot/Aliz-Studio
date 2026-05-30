import { rm } from "fs/promises";
import path from "path";

export default async function globalSetup() {
  await rm(path.join(process.cwd(), "data", "appointments.json"), { force: true });
}
