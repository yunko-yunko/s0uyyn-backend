CREATE TABLE site_settings (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  organization_name VARCHAR(160) NOT NULL,
  english_name VARCHAR(160) NOT NULL DEFAULT '',
  intro_eyebrow VARCHAR(160) NOT NULL DEFAULT '',
  intro_headline VARCHAR(500) NOT NULL,
  intro_body TEXT NOT NULL,
  footer_description VARCHAR(500) NOT NULL DEFAULT '',
  copyright VARCHAR(200) NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_users (
  id UUID PRIMARY KEY,
  email VARCHAR(320) NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT admin_users_email_lowercase CHECK (email = LOWER(email))
);
CREATE UNIQUE INDEX admin_users_email_unique ON admin_users (LOWER(email));

CREATE TABLE recent_cards (
  id UUID PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE services (
  id UUID PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  developers TEXT[] NOT NULL DEFAULT '{}',
  content TEXT NOT NULL DEFAULT '',
  detail_content TEXT NOT NULL DEFAULT '',
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT NOT NULL,
  link TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE members (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  role VARCHAR(200) NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE faqs (
  id UUID PRIMARY KEY,
  question VARCHAR(500) NOT NULL,
  answer TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX recent_cards_public_order ON recent_cards (position, created_at) WHERE is_active;
CREATE INDEX services_public_order ON services (position, created_at) WHERE is_active;
CREATE INDEX members_public_order ON members (position, created_at) WHERE is_active;
CREATE INDEX faqs_public_order ON faqs (position, created_at) WHERE is_active;
