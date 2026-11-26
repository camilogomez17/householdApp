CREATE TABLE IF NOT EXISTS groceries (
  id uuid PRIMARY KEY,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  quantity text NOT NULL DEFAULT '' CHECK (char_length(quantity) <= 40),
  status text NOT NULL CHECK (status IN ('buy', 'maintain', 'remove')),
  claimed_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status = 'buy' OR claimed_by IS NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS groceries_unique_name ON groceries (lower(name));

CREATE TABLE IF NOT EXISTS chores (
  id uuid PRIMARY KEY,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  assignee text,
  due_on date,
  reward_cents integer NOT NULL CHECK (reward_cents BETWEEN 0 AND 1000000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'paid')),
  paid_at timestamptz,
  paid_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status = 'open' OR assignee IS NOT NULL),
  CHECK ((status = 'paid') = (paid_at IS NOT NULL AND paid_by IS NOT NULL)),
  CHECK (status <> 'paid' OR reward_cents > 0)
);

CREATE TABLE IF NOT EXISTS schedule (
  id uuid PRIMARY KEY,
  member_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('home', 'away')),
  starts_at timestamp NOT NULL,
  ends_at timestamp NOT NULL,
  note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 100),
  CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS schedule_start_idx ON schedule (starts_at);
