-- =============================================
-- PlayStation Klub - Supabase jadvallar
-- Bu SQL ni Supabase Dashboard > SQL Editor da bajaring
-- =============================================

-- 1. Xonalar (bo'sh xonalar)
CREATE TABLE IF NOT EXISTS rooms (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Oddiy',
  price INTEGER NOT NULL DEFAULT 8000,
  capacity INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Faol seanslar (band xonalar)
CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
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

-- 3. Mijozlar
CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  sessions_count INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bronlar
CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY,
  room TEXT NOT NULL,
  client TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  hours INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'Kutilmoqda',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Xodimlar
CREATE TABLE IF NOT EXISTS staff (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Operator',
  phone TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'Ishda',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Xarajatlar (avanslar)
CREATE TABLE IF NOT EXISTS expenses (
  id BIGSERIAL PRIMARY KEY,
  staff_id BIGINT REFERENCES staff(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT 'Obed uchun',
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Mahsulotlar (Menyu)
CREATE TABLE IF NOT EXISTS menu_items (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Kommunal to'lovlar
CREATE TABLE IF NOT EXISTS utilities (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'electricity', 'gas', 'light', 'water'
  amount INTEGER NOT NULL DEFAULT 0,
  month TEXT NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. To'lov tarixi
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  room_name TEXT NOT NULL,
  client TEXT NOT NULL,
  room_cost INTEGER NOT NULL DEFAULT 0,
  orders_cost INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  paid_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Boshlang'ich ma'lumotlar (Menyu)
-- =============================================
INSERT INTO menu_items (name, price) VALUES
  ('Cola 0.5', 6000),
  ('Fanta 0.5', 6000),
  ('Pepsi 0.5', 6000),
  ('Choy (idish)', 4000),
  ('Kofe', 5000),
  ('Chips (Lays)', 12000),
  ('Sementer', 3000);

-- =============================================
-- Boshlang'ich ma'lumotlar (Xonalar)
-- =============================================
INSERT INTO rooms (name, type, price, capacity) VALUES
  ('VIP 1', 'VIP', 15000, 4),
  ('VIP 2', 'VIP', 15000, 4),
  ('VIP 3', 'VIP', 15000, 4),
  ('Xona 1', 'Oddiy', 8000, 2),
  ('Xona 2', 'Oddiy', 8000, 2),
  ('Xona 3', 'Oddiy', 8000, 2),
  ('Xona 4', 'Oddiy', 8000, 2),
  ('Xona 5', 'Oddiy', 8000, 2),
  ('Xona 6', 'Oddiy', 8000, 2);

-- =============================================
-- RLS (Row Level Security) - hamma o'qiy va yoza olsin
-- =============================================
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Hamma uchun ochiq (anon key bilan ishlash uchun)
CREATE POLICY "public_all" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON utilities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON payments FOR ALL USING (true) WITH CHECK (true);
