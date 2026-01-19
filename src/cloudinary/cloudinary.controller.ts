// src/cloudinary/cloudinary.controller.ts
import { Controller, Get, Query, UseGuards, BadRequestException } from "@nestjs/common";
import { CloudinaryService } from "./cloudinary.service";


@Controller("cloudinary")
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   * GET /cloudinary/signature?folder=clients
   *
   * Returns a signed payload for the client to use in a browser upload.
   *
   * NOTE: protect this endpoint with an auth guard (admins only).
   */
  @Get("signature")
  // @UseGuards(AuthGuard)    // <- uncomment/replace with your guard
  getSignature(@Query("folder") folder?: string) {
    // optional validation: only allow certain folder names
    if (folder && typeof folder !== "string") {
      throw new BadRequestException("Invalid folder");
    }

    // Optional: whitelist permitted folders (recommended)
    const allowedFolders = (process.env.CLOUDINARY_ALLOWED_FOLDERS ?? "clients,uploads").split(",").map(s => s.trim()).filter(Boolean);
    if (folder && !allowedFolders.includes(folder)) {
      // you can choose to either reject or ignore the folder param; reject for stricter control:
      throw new BadRequestException("Requested folder not allowed");
    }

    // Optionally lock additional params (e.g., max_file_size) to prevent misuse — include them in the signed params
    const extra: Record<string, string | number | boolean> = {};
    // example: lock file size to 6 MB (Cloudinary expects bytes)
    const maxBytes = Number(process.env.CLOUDINARY_MAX_BYTES ?? 6 * 1024 * 1024);
    if (maxBytes > 0) extra.max_file_size = maxBytes;

    const payload = this.cloudinaryService.createSignedUploadPayload({ folder, extra });
    return payload;
  }
}
