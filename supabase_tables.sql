-- ===============================================================
-- PlayStation Klublar Tarmog'i (Multi-Branch / Multi-Tenant SaaS)
-- Supabase SQL Editor da bir marta bajaring
-- ===============================================================

-- 0. Filiallar (Klublar) jadvali
CREATE TABLE IF NOT EXISTS clubs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  pin TEXT NOT NULL DEFAULT '1111',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Xonalar (har bir filial uchun alohida)
CREATE TABLE IF NOT EXISTS rooms (
  id BIGSERIAL PRIMARY KEY,
  club_id TEXT NOT NULL DEFAULT 'club_1',
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Oddiy',
  price INTEGER NOT NULL DEFAULT 8000,
  capacity INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rooms_club_id ON rooms(club_id);

-- 2. Faol seanslar (band xonalar)
CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  club_id TEXT NOT NULL DEFAULT 'club_1',
  room_id BIGINT NOT NULL,
  room_name TEXT NOT NULL,
  room_type TEXT NOT NULL,
  room_price INTEGER NOT NULL,
  client TEXT NOT NULL DEFAULT 'Nomalum',
  start_time BIGINT NOT NULL,
  end_time BIGINT,
  total_seconds INTEGER DEFAULT 0,
  is_open BOOLEAN DEFAULT FALSE,
  orders JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_club_id ON sessions(club_id);

-- 3. Mijozlar
CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  club_id TEXT NOT NULL DEFAULT 'club_1',
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  sessions_count INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clients_club_id ON clients(club_id);

-- 4. Bronlar
CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY,
  club_id TEXT NOT NULL DEFAULT 'club_1',
  room TEXT NOT NULL,
  client TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  hours INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'Kutilmoqda',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bookings_club_id ON bookings(club_id);

-- 5. Xodimlar
CREATE TABLE IF NOT EXISTS staff (
  id BIGSERIAL PRIMARY KEY,
  club_id TEXT NOT NULL DEFAULT 'club_1',
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Operator',
  phone TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'Ishda',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_club_id ON staff(club_id);

-- 6. Xarajatlar (avanslar)
CREATE TABLE IF NOT EXISTS expenses (
  id BIGSERIAL PRIMARY KEY,
  club_id TEXT NOT NULL DEFAULT 'club_1',
  staff_id BIGINT,
  staff_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT 'Obed uchun',
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expenses_club_id ON expenses(club_id);

-- 7. Mahsulotlar (Menyu)
CREATE TABLE IF NOT EXISTS menu_items (
  id BIGSERIAL PRIMARY KEY,
  club_id TEXT NOT NULL DEFAULT 'club_1',
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_menu_items_club_id ON menu_items(club_id);

-- 8. Kommunal to'lovlar
CREATE TABLE IF NOT EXISTS utilities (
  id BIGSERIAL PRIMARY KEY,
  club_id TEXT NOT NULL DEFAULT 'club_1',
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  month TEXT NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_utilities_club_id ON utilities(club_id);

-- 9. To'lov tarixi (Kassa hisoboti)
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  club_id TEXT NOT NULL DEFAULT 'club_1',
  room_name TEXT NOT NULL,
  client TEXT NOT NULL,
  room_cost INTEGER NOT NULL DEFAULT 0,
  orders_cost INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  paid_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_club_id ON payments(club_id);

-- ===============================================================
-- Boshlang'ich Filiallarni kiritish
-- ===============================================================
INSERT INTO clubs (id, name, address, phone, pin) VALUES
  ('club_1', '1-Filial (Markaziy)', 'Chilonzor tumani, Bunyodkor shoh ko‘chasi', '+998 90 123 45 67', '1111'),
  ('club_2', '2-Filial (Yunusobod)', 'Yunusobod tumani, Amir Temur ko‘chasi', '+998 90 234 56 78', '2222'),
  ('club_3', '3-Filial (Sergeli)', 'Sergeli tumani, Yangi Sergeli ko‘chasi', '+998 90 345 67 89', '3333')
ON CONFLICT (id) DO NOTHING;

-- 1-filial uchun boshlang'ich menyu
INSERT INTO menu_items (club_id, name, price) VALUES
  ('club_1', 'Cola 0.5', 6000),
  ('club_1', 'Fanta 0.5', 6000),
  ('club_1', 'Pepsi 0.5', 6000),
  ('club_1', 'Choy (idish)', 4000),
  ('club_1', 'Kofe', 5000),
  ('club_1', 'Chips (Lays)', 12000),
  ('club_1', 'Sementer', 3000);

-- 1-filial uchun boshlang'ich xonalar
INSERT INTO rooms (club_id, name, type, price, capacity) VALUES
  ('club_1', 'VIP 1', 'VIP', 15000, 4),
  ('club_1', 'VIP 2', 'VIP', 15000, 4),
  ('club_1', 'VIP 3', 'VIP', 15000, 4),
  ('club_1', 'Xona 1', 'Oddiy', 8000, 2),
  ('club_1', 'Xona 2', 'Oddiy', 8000, 2),
  ('club_1', 'Xona 3', 'Oddiy', 8000, 2),
  ('club_1', 'Xona 4', 'Oddiy', 8000, 2),
  ('club_1', 'Xona 5', 'Oddiy', 8000, 2),
  ('club_1', 'Xona 6', 'Oddiy', 8000, 2);

-- ===============================================================
-- RLS (Row Level Security) - Anon key bilan ishlash uchun
-- ===============================================================
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all" ON clubs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON utilities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON payments FOR ALL USING (true) WITH CHECK (true);
