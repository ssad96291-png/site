import { randomUUID } from "node:crypto";
import {
  createWriteStream,
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readSync,
  readdirSync,
  renameSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import type {
  ProjectContext,
  ProjectFile,
  ProjectMetadata,
} from "./project-context.js";
import { validProjectEmail } from "./project-context.js";

const MiB = 1024 * 1024;
export const projectLimits = {
  maxFiles: 3,
  maxFileBytes: 20 * MiB,
  maxTotalBytes: 60 * MiB,
  ownerBytes: 256 * MiB,
  globalBytes: 1024 * MiB,
  extensions: [
    "pdf",
    "jpg",
    "jpeg",
    "png",
    "webp",
    "dwg",
    "dxf",
    "ifc",
    "step",
    "stp",
  ],
};
const fail = (status: number, message: string) =>
  Object.assign(new Error(message), { status });
const stamp = () => new Date().toISOString();
function field(value: unknown, name: string, max: number): string {
  if (value === undefined) return "";
  if (typeof value !== "string" || value.length > max)
    throw fail(
      400,
      `${name} geçerli metin olmalıdır (en fazla ${max} karakter).`,
    );
  return value.trim();
}
function safeName(value: string) {
  const name = value.normalize("NFKC");
  if (
    name.length < 3 ||
    name.length > 160 ||
    name.startsWith(".") ||
    /[\\/:\x00-\x1f\x7f]|\p{Cf}|%[0-9a-f]{2}/iu.test(name)
  )
    throw fail(
      400,
      "Dosya adında yol, gizli veya kontrol karakteri kullanmayın.",
    );
  if (
    /\.(?:exe|com|bat|cmd|scr|ps1|js|mjs|cjs|vbs|vbe|hta|html?|svg|sh|jar|msi|dll|lnk|url)(?:\.|$)/i.test(
      name,
    )
  )
    throw fail(400, "Çalıştırılabilir içerik adı taşıyan dosya kabul edilmez.");
  const extension = name.split(".").at(-1)!.toLowerCase();
  if (!projectLimits.extensions.includes(extension))
    throw fail(
      400,
      "Desteklenen dosyalar: PDF, JPG, PNG, WebP, DWG, DXF, IFC ve STEP. Arşiv yüklemeyin.",
    );
  return { name, extension };
}

/** Format checks are deliberately bounded and never parse/execute CAD content.
 * Downloads are attachments. These checks are not an antivirus scanner.
 */
function validateFile(file: Express.Multer.File, extension: string) {
  if (!file.size || file.size > projectLimits.maxFileBytes)
    throw fail(
      413,
      "Her dosya 20 MB sınırında ve boş olmayan bir dosya olmalıdır.",
    );
  const fd = openSync(file.path, "r");
  try {
    const head = Buffer.alloc(Math.min(file.size, 65_536));
    readSync(fd, head, 0, head.length, 0);
    const tail = Buffer.alloc(Math.min(file.size, 65_536));
    readSync(fd, tail, 0, tail.length, file.size - tail.length);
    const ascii = head.toString("latin1");
    let valid = false;
    if (extension === "png") {
      valid =
        head.length >= 24 &&
        head
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
        head.subarray(12, 16).toString() === "IHDR" &&
        tail.length >= 12 &&
        tail.subarray(-8, -4).toString() === "IEND";
      if (valid) {
        const width = head.readUInt32BE(16),
          height = head.readUInt32BE(20);
        valid =
          width > 0 &&
          height > 0 &&
          width <= 16_000 &&
          height <= 16_000 &&
          width * height <= 64_000_000;
      }
    } else if (extension === "jpg" || extension === "jpeg") {
      valid =
        head.length > 10 &&
        head[0] === 255 &&
        head[1] === 216 &&
        head[2] === 255 &&
        tail.at(-2) === 255 &&
        tail.at(-1) === 217;
    } else if (extension === "webp") {
      valid =
        head.length > 16 &&
        head.subarray(0, 4).toString() === "RIFF" &&
        head.subarray(8, 12).toString() === "WEBP" &&
        head.readUInt32LE(4) + 8 === file.size;
    } else if (extension === "pdf") {
      valid =
        head.length >= 12 &&
        ascii.startsWith("%PDF-") &&
        /%%EOF\s*$/.test(tail.toString("latin1"));
    } else if (extension === "dwg") {
      valid = /^AC10\d{2}/.test(ascii) && file.size >= 32;
    } else if (extension === "dxf") {
      valid =
        ascii.startsWith("AutoCAD Binary DXF\r\n\x1a\0") ||
        (/^\s*0\s+SECTION\b/i.test(ascii) &&
          /\bENDSEC\b/i.test(tail.toString("latin1")) &&
          /\b0\s+EOF\s*$/i.test(tail.toString("latin1")));
    } else if (["ifc", "step", "stp"].includes(extension)) {
      valid =
        /^\s*ISO-10303-21\s*;/i.test(ascii) &&
        /\bHEADER\s*;/i.test(ascii) &&
        /FILE_SCHEMA\s*\(/i.test(ascii) &&
        /END-ISO-10303-21\s*;\s*$/i.test(tail.toString("latin1"));
      if (extension === "ifc")
        valid = valid && /FILE_SCHEMA\s*\(\s*\(\s*['"]IFC/i.test(ascii);
    }
    if (!valid)
      throw fail(
        400,
        "Dosyanın içeriği seçilen dosya türüyle eşleşmiyor veya dosya tamamlanmamış.",
      );
    if (["pdf", "dxf", "ifc", "step", "stp"].includes(extension)) {
      const chunk = Buffer.alloc(65_536);
      let position = 0,
        overlap = "";
      while (position < file.size) {
        const count = readSync(
          fd,
          chunk,
          0,
          Math.min(chunk.length, file.size - position),
          position,
        );
        if (!count) break;
        const source = overlap + chunk.subarray(0, count).toString("latin1");
        const decoded = source.replace(/#([0-9a-f]{2})/gi, (_s, code: string) =>
          String.fromCharCode(parseInt(code, 16)),
        );
        if (
          /<\s*(?:script|html|svg|iframe|object|body)\b/i.test(decoded) ||
          (extension === "pdf" &&
            /\/(?:JavaScript|JS|Launch|EmbeddedFile|OpenAction|AA|RichMedia)\b/i.test(
              decoded,
            ))
        )
          throw fail(400, "Etkin içerik içeren belge kabul edilmedi.");
        overlap = source.slice(-512);
        position += count;
      }
    }
  } finally {
    closeSync(fd);
  }
}

export function installProjectRequests(ctx: ProjectContext) {
  const { app, db } = ctx;
  const directory = join(ctx.dataDir, "project-files");
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  // A restart has no live uploads; remove only our fixed-format unfinished files.
  for (const name of readdirSync(directory))
    if (/^[a-f0-9-]{36}\.tmp$/.test(name)) unlinkSync(join(directory, name));
  db.exec(`CREATE TABLE IF NOT EXISTS project_requests(inquiryId TEXT PRIMARY KEY,data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS project_files(id TEXT PRIMARY KEY,inquiryId TEXT NOT NULL,filename TEXT NOT NULL,size INTEGER NOT NULL,data TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS project_files_inquiry_idx ON project_files(inquiryId);`);
  const getProject = (id: string): ProjectMetadata | undefined => {
    const row = db
      .prepare("SELECT data FROM project_requests WHERE inquiryId=?")
      .get(id) as any;
    return row ? JSON.parse(row.data) : undefined;
  };
  const listFiles = (id: string, admin = false): ProjectFile[] =>
    db
      .prepare(
        "SELECT id,data FROM project_files WHERE inquiryId=? ORDER BY rowid",
      )
      .all(id)
      .map((row: any) => ({
        ...JSON.parse(row.data),
        downloadUrl: `/api/${admin ? "admin" : "customer"}/project-files/${row.id}/download`,
      }));
  const response = (id: string, admin = false) => ({
    project: getProject(id) || null,
    files: listFiles(id, admin),
    limits: projectLimits,
  });
  const requiresProject = (id: string) => {
    if (!getProject(id)) throw fail(404, "Proje/fiyat talebi bulunamadı.");
  };
  const hasPublishedOffer = (id: string) =>
    !!db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='portal_offers'",
      )
      .get() &&
    !!db
      .prepare(
        "SELECT id FROM portal_offers WHERE inquiryId=? AND status='published' LIMIT 1",
      )
      .get(id);
  const assertMutable = (id: string) => {
    if (hasPublishedOffer(id))
      throw fail(
        409,
        "Yayımlanmış teklifin dayanağı olan dosyalar müşteri tarafından değiştirilemez. Yeni revize talebi için mesaj gönderin.",
      );
  };
  const editorBlock = (req: any, _res: Response, next: NextFunction) =>
    req.portalActor?.role === "editor"
      ? next(fail(403, "İçerik editörü proje dosyalarına erişemez."))
      : next();
  const requestGuard = (req: any, _res: Response, next: NextFunction) => {
    try {
      ctx.getManaged(req, String(req.params.id));
      requiresProject(String(req.params.id));
      next();
    } catch (e) {
      next(e);
    }
  };
  app.post("/api/project-requests", (req: any, res, next) => {
    try {
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body))
        throw fail(400, "Geçerli başvuru gönderin.");
      if (!ctx.consume("project-create", req.ip || "", 8, 15))
        throw fail(429, "Çok fazla başvuru. Daha sonra tekrar deneyin.");
      if (body.website) return res.status(201).json({ id: "received" });
      const name = field(body.name, "Ad soyad", 100),
        signed = ctx.customer(req),
        replyEmail = (
          field(body.email, "E-posta", 254) ||
          signed?.customer?.email ||
          ""
        ).toLowerCase(),
        phone = field(body.phone, "Telefon", 50),
        message = field(body.message, "Açıklama", 5000);
      if (
        body.phoneRequested !== undefined &&
        typeof body.phoneRequested !== "boolean"
      )
        throw fail(400, "Telefonla aranma seçimini doğru biçimde gönderin.");
      const phoneRequested = body.phoneRequested === true;
      if (
        name.length < 2 ||
        message.length < 10 ||
        !validProjectEmail(replyEmail) ||
        body.consent !== true
      )
        throw fail(
          400,
          "Adınızı, geçerli e-postanızı, en az 10 karakter açıklamanızı ve aydınlatma onayını kontrol edin.",
        );
      if (
        (phoneRequested && !phone) ||
        (phone &&
          (!/^[+()\d\s.-]+$/.test(phone) ||
            phone.replace(/\D/g, "").length < 7 ||
            phone.replace(/\D/g, "").length > 15))
      )
        throw fail(400, "Aranmak için geçerli telefon numarası girin.");
      if (!["price", "project"].includes(body.requestType))
        throw fail(400, "Fiyat bilgisi veya proje teklifi türünü seçin.");
      if (
        (
          db
            .prepare("SELECT count(*) AS count FROM project_requests")
            .get() as any
        ).count >= 10000
      )
        throw fail(
          503,
          "Başvuru kapasitesi dolu; doğrudan iletişim kanalımızı kullanın.",
        );
      const id = randomUUID(),
        createdAt = stamp();
      const inquiry = {
        id,
        name,
        email: replyEmail,
        phone,
        message,
        requestType: body.requestType,
        phoneRequested,
        subject:
          body.requestType === "project"
            ? "Proje dosyalı teklif talebi"
            : "Fiyat bilgisi talebi",
        product: field(body.product, "Ürün", 200),
        district: field(body.district, "İlçe", 100),
        dimensions: field(body.dimensions, "Ölçü", 200),
        service: field(body.service, "Hizmet", 200),
        budget: field(body.budget, "Bütçe", 100),
        preferredContact: "email",
        consent: true,
        notes: "",
        priority: "normal",
        followUpDate: "",
        status: "new",
        createdAt,
      };
      const project: ProjectMetadata = {
        inquiryId: id,
        requestType: body.requestType,
        phoneRequested,
        replyEmail,
        name,
        createdAt,
      };
      let tracking;
      db.exec("BEGIN IMMEDIATE");
      try {
        db.prepare("INSERT INTO inquiries(id,data) VALUES(?,?)").run(
          id,
          JSON.stringify(inquiry),
        );
        db.prepare(
          "INSERT INTO project_requests(inquiryId,data) VALUES(?,?)",
        ).run(id, JSON.stringify(project));
        tracking = ctx.onInquiryCreated(req, res, inquiry);
        db.exec("COMMIT");
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
      res.status(201).json({ id, project, ...tracking });
    } catch (e) {
      next(e);
    }
  });

  app.get(
    "/api/customer/inquiries/:id/project-files",
    ctx.requireCustomer,
    (req: any, res, next) => {
      try {
        ctx.getOwned(req, String(req.params.id));
        res.json(response(String(req.params.id)));
      } catch (e) {
        next(e);
      }
    },
  );
  const activeUploads = new Map<
    string,
    { owner: string; bytes: number; paths: Set<string> }
  >();
  const storage: multer.StorageEngine = {
    _handleFile(req: any, file, callback) {
      try {
        safeName(file.originalname);
      } catch (e) {
        callback(e as Error);
        return;
      }
      const pending = req.portalProjectUpload as
        { owner: string; bytes: number; paths: Set<string> } | undefined;
      if (!pending || activeUploads.get(String(req.params.id)) !== pending) {
        callback(fail(409, "Yükleme oturumu bulunamadı."));
        return;
      }
      const filename = randomUUID() + ".tmp",
        path = join(directory, filename);
      pending.paths.add(path);
      const output = createWriteStream(path, { flags: "wx", mode: 0o600 });
      let size = 0,
        called = false;
      const done = (err?: Error) => {
        if (called) return;
        called = true;
        req.off("aborted", aborted);
        if (err) {
          // createWriteStream opens asynchronously: an aborted request can arrive
          // before its file exists. Also clean after close so that late opens do
          // not leave an unfinished file behind.
          output.once("close", () => {
            if (existsSync(path)) unlinkSync(path);
          });
          output.destroy();
          if (existsSync(path)) unlinkSync(path);
          callback(err);
        } else callback(null, { path, filename, size });
      };
      const aborted = () => done(fail(400, "Yükleme bağlantısı kesildi."));
      req.once("aborted", aborted);
      file.stream.on("data", (chunk: Buffer) => {
        size += chunk.length;
      });
      file.stream.on("error", (e) => done(e));
      output.on("error", (e) => done(e));
      output.on("finish", () => done());
      file.stream.pipe(output);
    },
    _removeFile(_req, file, callback) {
      try {
        if (file.path && existsSync(file.path)) unlinkSync(file.path);
        callback(null);
      } catch (e) {
        callback(e as Error);
      }
    },
  };
  const upload = multer({
    storage,
    preservePath: true,
    limits: {
      files: projectLimits.maxFiles,
      fileSize: projectLimits.maxFileBytes,
      fields: 0,
      parts: projectLimits.maxFiles,
    },
  }).array("files", projectLimits.maxFiles);
  app.post(
    "/api/customer/inquiries/:id/project-files",
    ctx.requireCustomer,
    (req: any, res, next) => {
      const id = String(req.params.id),
        owner = req.portalCustomer.customer.id;
      try {
        ctx.getOwned(req, id);
        requiresProject(id);
        assertMutable(id);
        if (activeUploads.has(id))
          throw fail(409, "Bu talep için bir dosya yüklemesi sürüyor.");
        const existing = listFiles(id);
        if (existing.length >= projectLimits.maxFiles)
          throw fail(409, "Bir talebe en fazla 3 dosya ekleyebilirsiniz.");
        if (
          !ctx.consume("project-upload-owner", owner, 12, 60) ||
          !ctx.consume("project-upload-ip", req.ip || "", 20, 60)
        )
          throw fail(429, "Çok fazla dosya yükleme denemesi.");
        const reserve =
          (projectLimits.maxFiles - existing.length) *
          projectLimits.maxFileBytes;
        const total = Number(
          (
            db
              .prepare(
                "SELECT COALESCE(sum(size),0) AS bytes FROM project_files",
              )
              .get() as any
          ).bytes,
        );
        const own = Number(
          (
            db
              .prepare(
                "SELECT COALESCE(sum(f.size),0) AS bytes FROM project_files f JOIN portal_inquiries p ON p.inquiryId=f.inquiryId WHERE p.customerId=?",
              )
              .get(owner) as any
          ).bytes,
        );
        const pendingTotal = [...activeUploads.values()].reduce(
            (sum, p) => sum + p.bytes,
            0,
          ),
          pendingOwn = [...activeUploads.values()]
            .filter((p) => p.owner === owner)
            .reduce((sum, p) => sum + p.bytes, 0);
        if (
          total + pendingTotal + reserve > projectLimits.globalBytes ||
          own + pendingOwn + reserve > projectLimits.ownerBytes
        )
          throw fail(
            413,
            "Dosya saklama kotası dolu. Önceki dosyaları gözden geçirin veya firmayla iletişime geçin.",
          );
        const pending = { owner, bytes: reserve, paths: new Set<string>() };
        activeUploads.set(id, pending);
        req.portalProjectUpload = pending;
        const cleanup = () => {
          for (const path of pending.paths)
            if (existsSync(path)) unlinkSync(path);
          if (activeUploads.get(id) === pending) activeUploads.delete(id);
        };
        req.once("aborted", cleanup);
        upload(req, res, (uploadError) => {
          const created: string[] = [];
          try {
            if (uploadError) {
              if (uploadError instanceof multer.MulterError) {
                if (uploadError.code === "LIMIT_FILE_SIZE")
                  throw fail(413, "Her proje dosyası en fazla 20 MB olabilir.");
                throw fail(
                  400,
                  "Bir seferde en fazla 3 proje dosyası yükleyin; yalnızca dosya alanı gönderin.",
                );
              }
              throw uploadError;
            }
            const currentCustomer = ctx.customer(req);
            if (!currentCustomer)
              throw fail(
                401,
                "Oturumunuz sona erdi veya hesabınızın erişimi değişti. Yeniden giriş yapın.",
              );
            req.portalCustomer = currentCustomer;
            ctx.getOwned(req, id);
            requiresProject(id);
            assertMutable(id);
            const files = req.files as Express.Multer.File[];
            if (!Array.isArray(files) || files.length === 0)
              throw fail(400, "En az bir dosya seçin.");
            const current = listFiles(id);
            const bytes = files.reduce((sum, f) => sum + f.size, 0);
            if (
              current.length + files.length > projectLimits.maxFiles ||
              current.reduce((sum, f) => sum + f.size, 0) + bytes >
                projectLimits.maxTotalBytes
            )
              throw fail(
                409,
                "Bir talepte en fazla 3 dosya ve toplam 60 MB saklanabilir.",
              );
            const prepared = files.map((file) => {
              const named = safeName(file.originalname);
              validateFile(file, named.extension);
              return { file, ...named };
            });
            db.exec("BEGIN IMMEDIATE");
            try {
              const count = Number(
                (
                  db
                    .prepare(
                      "SELECT count(*) AS count FROM project_files WHERE inquiryId=?",
                    )
                    .get(id) as any
                ).count,
              );
              if (count + prepared.length > projectLimits.maxFiles)
                throw fail(409, "Dosya sınırına ulaşıldı.");
              const storedTotal = Number(
                (
                  db
                    .prepare(
                      "SELECT COALESCE(sum(size),0) AS bytes FROM project_files",
                    )
                    .get() as any
                ).bytes,
              );
              const storedOwn = Number(
                (
                  db
                    .prepare(
                      "SELECT COALESCE(sum(f.size),0) AS bytes FROM project_files f JOIN portal_inquiries p ON p.inquiryId=f.inquiryId WHERE p.customerId=?",
                    )
                    .get(owner) as any
                ).bytes,
              );
              if (
                storedTotal + bytes > projectLimits.globalBytes ||
                storedOwn + bytes > projectLimits.ownerBytes
              )
                throw fail(413, "Dosya saklama kotası dolu.");
              for (const entry of prepared) {
                const fileId = randomUUID(),
                  filename = fileId + ".bin",
                  destination = join(directory, filename);
                renameSync(entry.file.path, destination);
                created.push(destination);
                pending.paths.delete(entry.file.path);
                const data = {
                  id: fileId,
                  inquiryId: id,
                  name: entry.name,
                  extension: entry.extension,
                  size: entry.file.size,
                  createdAt: stamp(),
                };
                db.prepare(
                  "INSERT INTO project_files(id,inquiryId,filename,size,data) VALUES(?,?,?,?,?)",
                ).run(fileId, id, filename, data.size, JSON.stringify(data));
              }
              ctx.audit(owner, "PROJECT_FILE_UPLOAD", id);
              ctx.notify(
                null,
                id,
                "project_file",
                "Yeni proje dosyası",
                `${prepared.length} dosya inceleme bekliyor.`,
              );
              db.exec("COMMIT");
            } catch (e) {
              db.exec("ROLLBACK");
              throw e;
            }
            res.status(201).json(response(id));
          } catch (e) {
            for (const path of created) if (existsSync(path)) unlinkSync(path);
            next(e);
          } finally {
            req.off("aborted", cleanup);
            cleanup();
          }
        });
      } catch (e) {
        next(e);
      }
    },
  );

  app.get(
    "/api/admin/project-requests",
    ctx.requireStaff,
    editorBlock,
    (req: any, res) => {
      const requests = ctx
        .allManaged(req)
        .filter((inq) => !!getProject(inq.id))
        .map((inq) => {
          const project = getProject(inq.id)!;
          const files = listFiles(inq.id, true);
          const offersAvailable = !!db
            .prepare(
              "SELECT name FROM sqlite_master WHERE type='table' AND name='portal_offers'",
            )
            .get();
          const offerCount = offersAvailable
            ? Number(
                (
                  db
                    .prepare(
                      "SELECT count(*) AS count FROM portal_offers WHERE inquiryId=?",
                    )
                    .get(inq.id) as any
                ).count,
              )
            : 0;
          const publishedOfferCount = offersAvailable
            ? Number(
                (
                  db
                    .prepare(
                      "SELECT count(*) AS count FROM portal_offers WHERE inquiryId=? AND status='published'",
                    )
                    .get(inq.id) as any
                ).count,
              )
            : 0;
          return {
            ...inq,
            project,
            requestType: project.requestType,
            phoneRequested: project.phoneRequested,
            replyEmail: project.replyEmail,
            fileCount: files.length,
            projectFiles: files,
            offerCount,
            publishedOfferCount,
          };
        });
      res.json({ requests });
    },
  );
  app.get(
    "/api/admin/project-requests/:id/project-files",
    ctx.requireStaff,
    editorBlock,
    requestGuard,
    (req, res) => res.json(response(String(req.params.id), true)),
  );
  const download =
    (admin: boolean) => (req: any, res: Response, next: NextFunction) => {
      try {
        const row = db
          .prepare("SELECT * FROM project_files WHERE id=?")
          .get(String(req.params.fileId)) as any;
        if (!row) throw fail(404, "Dosya bulunamadı.");
        if (admin) ctx.getManaged(req, row.inquiryId);
        else ctx.getOwned(req, row.inquiryId);
        const path = join(directory, row.filename);
        if (
          !/^[a-f0-9-]{36}\.bin$/.test(row.filename) ||
          !existsSync(path) ||
          !lstatSync(path).isFile()
        )
          throw fail(404, "Dosya bulunamadı.");
        const data = JSON.parse(row.data);
        res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
        res.setHeader("Cache-Control", "private, no-store");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Content-Type", "application/octet-stream");
        ctx.audit(
          admin ? req.portalActor.username : req.portalCustomer.customer.id,
          "PROJECT_FILE_DOWNLOAD",
          row.id,
        );
        res.download(path, data.name);
      } catch (e) {
        next(e);
      }
    };
  app.get(
    "/api/customer/project-files/:fileId/download",
    ctx.requireCustomer,
    download(false),
  );
  app.get(
    "/api/admin/project-files/:fileId/download",
    ctx.requireStaff,
    editorBlock,
    download(true),
  );
  const remove =
    (admin: boolean) => (req: any, res: Response, next: NextFunction) => {
      try {
        const row = db
          .prepare("SELECT * FROM project_files WHERE id=?")
          .get(String(req.params.fileId)) as any;
        if (!row) throw fail(404, "Dosya bulunamadı.");
        if (admin) {
          ctx.getManaged(req, row.inquiryId);
          if (!["admin", "manager"].includes(req.portalActor.role))
            throw fail(403, "Dosya kaldırmak için yönetim yetkisi gerekir.");
        } else {
          ctx.getOwned(req, row.inquiryId);
          assertMutable(row.inquiryId);
        }
        if (activeUploads.has(row.inquiryId))
          throw fail(409, "Dosya yükleme işlemi sürüyor.");
        db.prepare("DELETE FROM project_files WHERE id=?").run(row.id);
        const path = join(directory, row.filename);
        if (/^[a-f0-9-]{36}\.bin$/.test(row.filename) && existsSync(path))
          unlinkSync(path);
        ctx.audit(
          admin ? req.portalActor.username : req.portalCustomer.customer.id,
          "PROJECT_FILE_DELETE",
          row.id,
        );
        res.json({ ok: true });
      } catch (e) {
        next(e);
      }
    };
  app.delete(
    "/api/customer/project-files/:fileId",
    ctx.requireCustomer,
    remove(false),
  );
  app.delete(
    "/api/admin/project-files/:fileId",
    ctx.requireStaff,
    editorBlock,
    remove(true),
  );
  return {
    getProject,
    listFiles,
    cleanupInquiry(id: string) {
      const files = db
        .prepare("SELECT filename FROM project_files WHERE inquiryId=?")
        .all(id) as any[];
      db.prepare("DELETE FROM project_files WHERE inquiryId=?").run(id);
      db.prepare("DELETE FROM project_requests WHERE inquiryId=?").run(id);
      for (const row of files)
        if (
          /^[a-f0-9-]{36}\.bin$/.test(row.filename) &&
          existsSync(join(directory, row.filename))
        )
          unlinkSync(join(directory, row.filename));
    },
  };
}
