// src/cloudinary/cloudinary.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import crypto from "crypto";

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private apiKey: string | undefined;
  private apiSecret: string | undefined;
  private cloudName: string | undefined;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>("CLOUDINARY_API_KEY");
    this.apiSecret = this.config.get<string>("CLOUDINARY_API_SECRET");
    this.cloudName = this.config.get<string>("CLOUDINARY_CLOUD_NAME");

    if (!this.apiKey || !this.apiSecret || !this.cloudName) {
      this.logger.warn("Cloudinary incomplete config — signed uploads will fail until env vars are set.");
    }
  }

  /** deterministic param string (sorted keys) */
  private buildToSign(params: Record<string, string | number | boolean>) {
    const pairs = Object.keys(params)
      .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== "")
      .sort()
      .map((k) => `${k}=${String(params[k])}`);
    return pairs.join("&");
  }

  /** compute signature using API secret */
  generateSignature(params: Record<string, string | number | boolean>) {
    if (!this.apiSecret) throw new Error("CLOUDINARY_API_SECRET not configured");
    const toSign = this.buildToSign(params);
    return crypto.createHash("sha1").update(toSign + this.apiSecret).digest("hex");
  }

  /**
   * Create signed payload for client.
   * - allowedFolderWhitelist: if you want to restrict permitted folders, configure here or via env.
   * - extraParams: include any params you intend to lock (e.g. folder, public_id, eager, max_file_size).
   */
  createSignedUploadPayload(options?: { folder?: string; extra?: Record<string, string | number | boolean> }) {
    if (!this.apiKey || !this.cloudName) throw new Error("Cloudinary API key or cloud name not configured");
    const timestamp = Math.floor(Date.now() / 1000);

    // Only include parameters you want the client to be able to set.

const paramsToSign: Record<string, string|number|boolean> = { timestamp };
if (options?.folder) paramsToSign.folder = options.folder;
if (options?.extra) {
  for (const k of Object.keys(options.extra)) paramsToSign[k] = options.extra[k];
}

const signature = this.generateSignature(paramsToSign);

return {
  cloudName: this.cloudName,
  apiKey: this.apiKey,
  timestamp,
  signature,
  // echo back what was signed so client can send the exact same params
  params: paramsToSign,
  ...(options?.folder ? { folder: options.folder } : {}),
  ...(options?.extra ? { extra: options.extra } : {}),
};

  }
}
