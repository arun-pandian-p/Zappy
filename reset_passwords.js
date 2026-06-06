import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "";
const envLocalContent = fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "";

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`${name}\\s*=\\s*["']?([^"'\r\n]+)["']?`));
  if (match) return match[1];
  const matchLocal = envLocalContent.match(new RegExp(`${name}\\s*=\\s*["']?([^"'\r\n]+)["']?`));
  return matchLocal ? matchLocal[1] : null;
};

const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
const supabaseKey = getEnvVar("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, supabaseKey);

async function reset() {
  const { data, error } = await supabase.auth.admin.updateUserById(
    "3823b015-4347-417b-b939-40f8403ece9e",
    { password: "SuperAdmin!123" }
  );
  if (error) console.error("Error updating superadmin:", error.message);
  else console.log("Updated zappyscan@gmail.com password to SuperAdmin!123");

  const { data: d2, error: e2 } = await supabase.auth.admin.updateUserById(
    "08016d6b-0645-4295-9e16-067e3561c87c",
    { password: "Admin!123" }
  );
  if (e2) console.error("Error updating admin:", e2.message);
  else console.log("Updated admin123@gmail.com password to Admin!123");
}
reset();
