import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { config } from "./config.js";
import { createAccessToken, hashPassword, verifyAccessToken, verifyPassword } from "./auth.js";
import { ValidationError, entitySchemas, parseEntity, parseLogin, parseSiteSettings } from "./validation.js";
import {
  createEntity,
  deleteEntity,
  findActiveAdminById,
  findAdminByEmail,
  getContent,
  getSiteSettings,
  listResource,
  recordAdminLogin,
  updateEntity,
  updateSiteSettings
} from "./repository.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const dummyPasswordHash = hashPassword("not-the-right-password");

function publicItem(item) {
  const { isActive, createdAt, updatedAt, ...visible } = item;
  return visible;
}

export async function buildApp({ database, logger = config.nodeEnv !== "test" }) {
  if (!database) throw new Error("A database client is required.");
  const app = Fastify({ logger, trustProxy: true, bodyLimit: 256 * 1024 });
  app.decorateRequest("admin", null);

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin.replace(/\/$/, ""))) callback(null, true);
      else callback(new Error("Origin is not allowed by CORS."), false);
    }
  });
  await app.register(rateLimit, { global: false });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ValidationError) {
      return reply.code(400).send({ error: { code: "VALIDATION_ERROR", message: error.message, fields: error.fields } });
    }
    if (error.statusCode === 429) {
      return reply.code(429).send({ error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } });
    }
    if (error.code === "23505") {
      return reply.code(409).send({ error: { code: "CONFLICT", message: "A record with the same unique value already exists." } });
    }
    if (error.message === "Origin is not allowed by CORS.") {
      return reply.code(403).send({ error: { code: "CORS_FORBIDDEN", message: error.message } });
    }
    request.log.error({ err: error }, "Unhandled request error");
    return reply.code(500).send({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } });
  });

  app.get("/health", async () => ({ status: "ok" }));
  app.get("/readyz", async (_request, reply) => {
    try {
      await database.query("SELECT 1");
      return { status: "ready" };
    } catch {
      return reply.code(503).send({ status: "not_ready" });
    }
  });

  app.get("/api/v1/content", async (_request, reply) => {
    reply.header("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    const content = await getContent(database, { publicOnly: true });
    return {
      ...content,
      recentCards: content.recentCards.map(publicItem),
      services: content.services.map(publicItem),
      members: content.members.map(publicItem),
      faqs: content.faqs.map(publicItem)
    };
  });

  app.get("/api/v1/content/site", async (_request, reply) => {
    reply.header("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return getSiteSettings(database);
  });

  for (const resource of Object.keys(entitySchemas)) {
    app.get(`/api/v1/content/${resource}`, async (_request, reply) => {
      reply.header("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
      return (await listResource(database, resource, { publicOnly: true })).map(publicItem);
    });
  }

  app.post("/api/v1/auth/login", {
    config: { rateLimit: { max: 8, timeWindow: "1 minute" } }
  }, async (request, reply) => {
    const credentials = parseLogin(request.body);
    const admin = await findAdminByEmail(database, credentials.email);
    const passwordMatches = verifyPassword(credentials.password, admin?.passwordHash ?? dummyPasswordHash);
    if (!admin || !admin.isActive || !passwordMatches) {
      return reply.code(401).send({ error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect." } });
    }
    await recordAdminLogin(database, admin.id);
    return {
      accessToken: createAccessToken(admin),
      tokenType: "Bearer",
      expiresIn: config.jwtTtlSeconds,
      user: { id: admin.id, email: admin.email }
    };
  });

  async function authenticate(request, reply) {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "A Bearer token is required." } });
    }
    try {
      const claims = verifyAccessToken(authorization.slice(7));
      const admin = await findActiveAdminById(database, claims.sub);
      if (!admin) throw new Error("Administrator is inactive.");
      request.admin = admin;
    } catch {
      return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "The access token is invalid or expired." } });
    }
  }

  app.register(async function adminRoutes(admin) {
    admin.addHook("onRequest", authenticate);

    admin.get("/me", async (request) => ({ user: request.admin }));
    admin.get("/content", async () => getContent(database));
    admin.put("/site", async (request) => updateSiteSettings(database, parseSiteSettings(request.body)));

    for (const resource of Object.keys(entitySchemas)) {
      admin.post(`/${resource}`, async (request, reply) => {
        const created = await createEntity(database, resource, parseEntity(resource, request.body));
        return reply.code(201).send(created);
      });
      admin.put(`/${resource}/:id`, async (request, reply) => {
        if (!uuidPattern.test(request.params.id)) throw new ValidationError("id must be a UUID.", { id: "invalid_uuid" });
        const updated = await updateEntity(database, resource, request.params.id, parseEntity(resource, request.body));
        if (!updated) return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Content item was not found." } });
        return updated;
      });
      admin.delete(`/${resource}/:id`, async (request, reply) => {
        if (!uuidPattern.test(request.params.id)) throw new ValidationError("id must be a UUID.", { id: "invalid_uuid" });
        const deleted = await deleteEntity(database, resource, request.params.id);
        if (!deleted) return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Content item was not found." } });
        return reply.code(204).send();
      });
    }
  }, { prefix: "/api/v1/admin" });

  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({ error: { code: "NOT_FOUND", message: "The requested endpoint does not exist." } });
  });

  return app;
}
