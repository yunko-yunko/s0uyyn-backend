import { randomUUID } from "node:crypto";

const RESOURCES = Object.freeze({
  "recent-cards": {
    table: "recent_cards",
    select: `id, title, content, image_url AS "imageUrl", position, is_active AS "isActive",
      created_at AS "createdAt", updated_at AS "updatedAt"`,
    columns: {
      title: "title",
      content: "content",
      imageUrl: "image_url",
      position: "position",
      isActive: "is_active"
    }
  },
  services: {
    table: "services",
    select: `id, title, developers AS devleoper, content, detail_content AS "detailContent",
      hashtags, image_url AS "imageUrl", link, position, is_active AS "isActive",
      created_at AS "createdAt", updated_at AS "updatedAt"`,
    columns: {
      title: "title",
      devleoper: "developers",
      content: "content",
      detailContent: "detail_content",
      hashtags: "hashtags",
      imageUrl: "image_url",
      link: "link",
      position: "position",
      isActive: "is_active"
    }
  },
  members: {
    table: "members",
    select: `id, name, role, image_url AS "imageUrl", position, is_active AS "isActive",
      created_at AS "createdAt", updated_at AS "updatedAt"`,
    columns: {
      name: "name",
      role: "role",
      imageUrl: "image_url",
      position: "position",
      isActive: "is_active"
    }
  },
  faqs: {
    table: "faqs",
    select: `id, question, answer, position, is_active AS "isActive",
      created_at AS "createdAt", updated_at AS "updatedAt"`,
    columns: {
      question: "question",
      answer: "answer",
      position: "position",
      isActive: "is_active"
    }
  }
});

function resourceConfig(resource) {
  const selected = RESOURCES[resource];
  if (!selected) throw new Error(`Unknown resource: ${resource}`);
  return selected;
}

export async function listResource(database, resource, { publicOnly = false } = {}) {
  const selected = resourceConfig(resource);
  const filter = publicOnly ? "WHERE is_active = TRUE" : "";
  const { rows } = await database.query(
    `SELECT ${selected.select} FROM ${selected.table} ${filter} ORDER BY position ASC, created_at ASC`
  );
  return rows;
}

export async function createEntity(database, resource, input) {
  const selected = resourceConfig(resource);
  const entries = Object.entries(input);
  const id = randomUUID();
  const columns = ["id", ...entries.map(([name]) => selected.columns[name])];
  const values = [id, ...entries.map(([, value]) => value)];
  const placeholders = values.map((_, index) => `$${index + 1}`);
  const { rows } = await database.query(
    `INSERT INTO ${selected.table} (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING ${selected.select}`,
    values
  );
  return rows[0];
}

export async function updateEntity(database, resource, id, input) {
  const selected = resourceConfig(resource);
  const entries = Object.entries(input);
  const assignments = entries.map(([name], index) => `${selected.columns[name]} = $${index + 2}`);
  const { rows } = await database.query(
    `UPDATE ${selected.table} SET ${assignments.join(", ")}, updated_at = NOW()
      WHERE id = $1 RETURNING ${selected.select}`,
    [id, ...entries.map(([, value]) => value)]
  );
  return rows[0] ?? null;
}

export async function deleteEntity(database, resource, id) {
  const selected = resourceConfig(resource);
  const result = await database.query(`DELETE FROM ${selected.table} WHERE id = $1`, [id]);
  return result.rowCount > 0;
}

export async function getSiteSettings(database) {
  const { rows } = await database.query(`
    SELECT organization_name AS "organizationName", english_name AS "englishName",
      intro_eyebrow AS "introEyebrow", intro_headline AS "introHeadline",
      intro_body AS "introBody", footer_description AS "footerDescription",
      copyright, updated_at AS "updatedAt"
    FROM site_settings WHERE singleton = TRUE
  `);
  return rows[0];
}

export async function updateSiteSettings(database, input) {
  const { rows } = await database.query(`
    UPDATE site_settings SET
      organization_name = $1, english_name = $2, intro_eyebrow = $3,
      intro_headline = $4, intro_body = $5, footer_description = $6,
      copyright = $7, updated_at = NOW()
    WHERE singleton = TRUE
    RETURNING organization_name AS "organizationName", english_name AS "englishName",
      intro_eyebrow AS "introEyebrow", intro_headline AS "introHeadline",
      intro_body AS "introBody", footer_description AS "footerDescription",
      copyright, updated_at AS "updatedAt"
  `, [
    input.organizationName,
    input.englishName,
    input.introEyebrow,
    input.introHeadline,
    input.introBody,
    input.footerDescription,
    input.copyright
  ]);
  return rows[0];
}

export async function getContent(database, { publicOnly = false } = {}) {
  const [site, recentCards, services, members, faqs] = await Promise.all([
    getSiteSettings(database),
    listResource(database, "recent-cards", { publicOnly }),
    listResource(database, "services", { publicOnly }),
    listResource(database, "members", { publicOnly }),
    listResource(database, "faqs", { publicOnly })
  ]);
  return { site, recentCards, services, members, faqs };
}

export async function findAdminByEmail(database, email) {
  const { rows } = await database.query(
    `SELECT id, email, password_hash AS "passwordHash", is_active AS "isActive" FROM admin_users WHERE email = $1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function findActiveAdminById(database, id) {
  const { rows } = await database.query(
    `SELECT id, email FROM admin_users WHERE id = $1 AND is_active = TRUE`,
    [id]
  );
  return rows[0] ?? null;
}

export async function recordAdminLogin(database, id) {
  await database.query("UPDATE admin_users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1", [id]);
}
