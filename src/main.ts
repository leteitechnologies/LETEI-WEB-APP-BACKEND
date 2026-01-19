// backend/src/main.ts
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import dotenv from "dotenv";
import { AppModule } from "./app.module";

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // read a comma-separated list of allowed origins from env
const raw =
  process.env.FRONTEND_ORIGIN ||
  "http://localhost:3001,http://localhost:3002,http://192.168.8.12:3001,http://192.168.8.12:3002,http://localhost:3000";


  const allowed = raw.split(",").map(s => s.trim()).filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // allow non-browser (server-to-server) requests without origin (curl, Postman)
      if (!origin) return callback(null, true);
      // if wildcard present, allow all (only for dev)
      if (allowed.includes("*")) return callback(null, true);
      if (allowed.includes(origin)) return callback(null, true);
      console.warn(`CORS blocked origin: ${origin}. Allowed: ${allowed.join(", ")}`);
      return callback(new Error("CORS not allowed"), false);
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization,Accept",
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = Number(process.env.PORT ?? 4001);
  // bind to 0.0.0.0 so it's reachable from other hosts (WSL / Docker)
  await app.listen(port, "0.0.0.0");
  console.log(`Nest CMS backend listening on http://0.0.0.0:${port}`);
}
bootstrap();
