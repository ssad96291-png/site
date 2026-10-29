import type { Express, RequestHandler, Response } from "express";
import type { DatabaseSync } from "node:sqlite";

/** A single ASCII mailbox suitable for an unquoted email recipient header.
 * Display names, address lists and quoted local parts are intentionally excluded.
 */
export function validProjectEmail(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 254) return false;
  const parts = value.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (
    !local ||
    local.length > 64 ||
    !/^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/.test(local)
  )
    return false;
  if (local.startsWith(".") || local.endsWith(".") || local.includes(".."))
    return false;
  const labels = domain.split(".");
  if (
    labels.length < 2 ||
    labels.some(
      (label) => !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label),
    )
  )
    return false;
  return /^[A-Za-z]{2,63}$/.test(labels.at(-1)!);
}

export interface ProjectMetadata {
  inquiryId: string;
  requestType: "price" | "project";
  phoneRequested: boolean;
  replyEmail: string;
  name: string;
  createdAt: string;
}
export interface ProjectFile {
  id: string;
  inquiryId: string;
  name: string;
  extension: string;
  size: number;
  createdAt: string;
  downloadUrl: string;
}
/** Shared authorization and notification functions owned by the customer portal.
 * New features never infer identity from submitted email addresses.
 */
export interface ProjectContext {
  app: Express;
  db: DatabaseSync;
  dataDir: string;
  production: boolean;
  requireCustomer: RequestHandler;
  requireStaff: RequestHandler;
  customer: (req: any) => any;
  getOwned: (req: any, id: string) => { inq: any; s: any };
  getManaged: (req: any, id: string) => { inq: any; s: any };
  allManaged: (req: any) => any[];
  onInquiryCreated: (
    req: any,
    res: Response,
    inq: any,
  ) => {
    trackingToken?: string;
    trackingUrl?: string;
  };
  notify: (
    customerId: string | null,
    inquiryId: string | null,
    kind: string,
    title: string,
    message: string,
    external?: boolean,
  ) => void;
  audit: (actor: string, action: string, target: string) => void;
  consume: (
    scope: string,
    key: string,
    max?: number,
    minutes?: number,
  ) => boolean;
  dispatchPending: () => Promise<void>;
  getProject: (id: string) => ProjectMetadata | undefined;
  listProjectFiles: (id: string, admin?: boolean) => ProjectFile[];
}
