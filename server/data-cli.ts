import { randomBytes } from "node:crypto";
import { existsSync, lstatSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { openSecureDatabase } from "./secure-database.js";
import {
  createPortableBackup,
  exportBusinessJson,
  restorePortableBackup,
} from "./data-portability.js";
import { migratePrivateStorage } from "./private-storage.js";

function argumentsFor(args: string[]) {
  const values: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const name = args[i];
    if (!/^--[a-z-]+$/.test(name) || values[name] !== undefined)
      throw new Error("Geçersiz veya yinelenen komut seçeneği.");
    if (name === "--allow-plaintext") values[name] = "yes";
    else {
      if (!args[i + 1] || args[i + 1].startsWith("--"))
        throw new Error(name + " için değer girin.");
      values[name] = args[++i];
    }
  }
  return values;
}
function readMaster(file: string) {
  const path = resolve(file),
    info = lstatSync(path);
  if (!info.isFile() || info.isSymbolicLink() || info.size > 1024)
    throw new Error("Geçerli anahtar dosyası seçin.");
  const text = readFileSync(path, "utf8").trim();
  if (/^[a-f0-9]{64}$/i.test(text)) return Buffer.from(text, "hex");
  const bytes = Buffer.from(text, "base64");
  if (bytes.length !== 32 || bytes.toString("base64") !== text)
    throw new Error(
      "Anahtar 32 bayt standart base64 veya 64 haneli hex olmalıdır.",
    );
  return bytes;
}
async function main() {
  const [command, ...args] = process.argv.slice(2),
    values = argumentsFor(args);
  const required = (name: string) => {
    if (!values[name]) throw new Error(name + " seçeneği gerekli.");
    return values[name];
  };
  if (command === "keygen") {
    const out = resolve(required("--out"));
    writeFileSync(out, randomBytes(32).toString("base64") + "\n", {
      mode: 0o600,
      flag: "wx",
    });
    console.log(
      "Yeni anahtar dosyası oluşturuldu: " +
        out +
        ". Bu anahtarı mevcut şifreli verinin anahtarı yerine kullanmayın.",
    );
    return;
  }
  if (command === "restore") {
    const input = resolve(required("--file"));
    if (lstatSync(input).size > 190 * 1024 * 1024)
      throw new Error(
        "Yedek çok büyük; çevrimdışı veri dizini taşıma yöntemini kullanın.",
      );
    const manifest = restorePortableBackup(
      readFileSync(input),
      readMaster(required("--key-file")),
      required("--target"),
    );
    console.log(
      `Doğrulanan ${manifest.files.length} dosya yeni hedefe taşındı. Eski veri dizini değiştirilmedi. Sunucu başlangıcında DATA_DIR hedefini ve aynı anahtarı kullanın.`,
    );
    return;
  }
  if (!["backup", "export-json"].includes(command || ""))
    throw new Error(
      "Komutlar: keygen --out <anahtar>, backup --data <veri> --out <yedek>, restore --file <yedek> --key-file <anahtar> --target <YENI-klasor>, export-json --data <veri> --out <dosya> --allow-plaintext. Sunucuyu önce durdurun.",
    );
  const dataDir = resolve(required("--data")),
    out = resolve(required("--out"));
  if (!existsSync(dataDir)) throw new Error("Mevcut veri dizini bulunamadı.");
  if (values["--key-file"])
    process.env.DATA_ENCRYPTION_KEY_FILE = resolve(values["--key-file"]);
  const db = openSecureDatabase(dataDir, false);
  try {
    if (command === "backup") {
      migratePrivateStorage({ dataDir, production: false });
      writeFileSync(out, createPortableBackup(db, dataDir, false), {
        mode: 0o600,
        flag: "wx",
      });
      console.log(
        "Şifreli yedek oluşturuldu. Anahtarı yedekten ayrı bir yerde koruyun: " +
          out,
      );
    } else {
      if (values["--allow-plaintext"] !== "yes")
        throw new Error(
          "JSON kişisel verileri okunabilir biçimde içerir. Yalnız güvenli aktarım için --allow-plaintext verin; iş bitince güvenli biçimde kaldırın.",
        );
      writeFileSync(out, JSON.stringify(exportBusinessJson(db), null, 2), {
        mode: 0o600,
        flag: "wx",
      });
      console.log(
        "Kişisel veri içeren JSON dışa aktarıldı; parola/oturum sırları aktarılmadı. Dosyayı herkese açık dizine koymayın: " +
          out,
      );
    }
  } finally {
    db.close();
  }
}
void main().catch((error: Error) => {
  console.error("Veri işlemi durduruldu: " + error.message);
  process.exitCode = 1;
});
