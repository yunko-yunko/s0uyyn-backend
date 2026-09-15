export class ValidationError extends Error {
  constructor(message, fields = {}) {
    super(message);
    this.name = "ValidationError";
    this.fields = fields;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function string(value, name, { min = 0, max = 10_000, trim = true } = {}) {
  if (typeof value !== "string") throw new ValidationError(`${name} must be a string.`, { [name]: "invalid_type" });
  const parsed = trim ? value.trim() : value;
  if (parsed.length < min || parsed.length > max) {
    throw new ValidationError(`${name} must be between ${min} and ${max} characters.`, { [name]: "invalid_length" });
  }
  return parsed;
}

function url(value, name) {
  const parsed = string(value, name, { min: 1, max: 2_000 });
  let result;
  try {
    result = new URL(parsed);
  } catch {
    throw new ValidationError(`${name} must be a valid URL.`, { [name]: "invalid_url" });
  }
  if (!["http:", "https:"].includes(result.protocol)) {
    throw new ValidationError(`${name} must use HTTP or HTTPS.`, { [name]: "invalid_url" });
  }
  return result.href;
}

function stringArray(value, name, maxItems = 20) {
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new ValidationError(`${name} must be an array with no more than ${maxItems} items.`, { [name]: "invalid_array" });
  }
  const parsed = value.map((item, index) => string(item, `${name}[${index}]`, { min: 1, max: 80 }));
  return [...new Set(parsed)];
}

function integer(value, name) {
  if (!Number.isInteger(value) || value < 0 || value > 100_000) {
    throw new ValidationError(`${name} must be an integer between 0 and 100000.`, { [name]: "invalid_integer" });
  }
  return value;
}

function boolean(value, name) {
  if (typeof value !== "boolean") throw new ValidationError(`${name} must be a boolean.`, { [name]: "invalid_type" });
  return value;
}

const common = {
  position: (value) => integer(value, "position"),
  isActive: (value) => boolean(value, "isActive")
};

export const entitySchemas = Object.freeze({
  "recent-cards": {
    title: (value) => string(value, "title", { min: 1, max: 160 }),
    content: (value) => string(value, "content", { max: 1_000, trim: false }),
    imageUrl: (value) => url(value, "imageUrl"),
    ...common
  },
  services: {
    title: (value) => string(value, "title", { min: 1, max: 160 }),
    devleoper: (value) => stringArray(value, "devleoper"),
    content: (value) => string(value, "content", { max: 2_000, trim: false }),
    detailContent: (value) => string(value, "detailContent", { max: 10_000, trim: false }),
    hashtags: (value) => stringArray(value, "hashtags").map((tag) => tag.replace(/^#+/, "").trim()).filter(Boolean),
    imageUrl: (value) => url(value, "imageUrl"),
    link: (value) => url(value, "link"),
    ...common
  },
  members: {
    name: (value) => string(value, "name", { min: 1, max: 120 }),
    role: (value) => string(value, "role", { max: 200 }),
    imageUrl: (value) => url(value, "imageUrl"),
    ...common
  },
  faqs: {
    question: (value) => string(value, "question", { min: 1, max: 500 }),
    answer: (value) => string(value, "answer", { min: 1, max: 5_000, trim: false }),
    ...common
  }
});

export function parseEntity(resource, body) {
  if (!isPlainObject(body)) throw new ValidationError("Request body must be a JSON object.");
  const schema = entitySchemas[resource];
  if (!schema) throw new ValidationError("Unknown resource.");
  const unknown = Object.keys(body).filter((key) => !Object.hasOwn(schema, key));
  if (unknown.length) throw new ValidationError(`Unknown fields: ${unknown.join(", ")}.`);

  const parsed = {};
  for (const [name, parser] of Object.entries(schema)) {
    const defaultValue = name === "position" ? 0 : name === "isActive" ? true : undefined;
    const value = Object.hasOwn(body, name) ? body[name] : defaultValue;
    if (value === undefined) throw new ValidationError(`${name} is required.`, { [name]: "required" });
    parsed[name] = parser(value);
  }
  return parsed;
}

export function parseSiteSettings(body) {
  if (!isPlainObject(body)) throw new ValidationError("Request body must be a JSON object.");
  const fields = {
    organizationName: [1, 160],
    englishName: [0, 160],
    introEyebrow: [0, 160],
    introHeadline: [1, 500],
    introBody: [1, 5_000],
    footerDescription: [0, 500],
    copyright: [0, 200]
  };
  const unknown = Object.keys(body).filter((key) => !Object.hasOwn(fields, key));
  if (unknown.length) throw new ValidationError(`Unknown fields: ${unknown.join(", ")}.`);
  return Object.fromEntries(Object.entries(fields).map(([name, [min, max]]) => {
    if (body[name] === undefined) throw new ValidationError(`${name} is required.`, { [name]: "required" });
    return [name, string(body[name], name, { min, max, trim: false })];
  }));
}

export function parseLogin(body) {
  if (!isPlainObject(body)) throw new ValidationError("Request body must be a JSON object.");
  const email = string(body.email, "email", { min: 3, max: 320 }).toLowerCase();
  if (!/^[a-z0-9._@+-]+$/.test(email)) {
    throw new ValidationError("Administrator ID contains invalid characters.", { email: "invalid_id" });
  }
  return { email, password: string(body.password, "password", { min: 1, max: 200, trim: false }) };
}
