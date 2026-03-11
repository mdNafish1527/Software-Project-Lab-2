-- ============================================================
--  GaanBajna — seed.sql
--  Run AFTER schema.sql:
--    source /path/to/db/schema.sql
--    source /path/to/db/seed.sql
-- ============================================================

USE gaanbajna;

-- ============================================================
-- 1. USERS
--    Passwords below are bcrypt hashes of "Password123!"
--    Replace with real hashes if you change the password.
--    status = 'approved'  → required for singers & organizers
--    status = 'active'    → for audience & admin
-- ============================================================

INSERT INTO users (name, email, password_hash, role, status, is_verified) VALUES

-- Admin
('Admin GaanBajna',   'admin@gaanbajna.com',
 '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
 'admin', 'active', 1),

-- Singers (must be approved to appear on /singers page)
('Arif Alvi',         'arif@gaanbajna.com',
 '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
 'singer', 'approved', 1),

('Nnancy',            'nancy@gaanbajna.com',
 '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
 'singer', 'approved', 1),

('Imran',             'imran@gaanbajna.com',
 '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
 'singer', 'approved', 1),

('Kona',              'kona@gaanbajna.com',
 '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
 'singer', 'approved', 1),

('Habib Wahid',       'habib@gaanbajna.com',
 '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
 'singer', 'approved', 1),

-- Organizers (must be approved to create events)
('SoundWave Events',  'soundwave@gaanbajna.com',
 '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
 'organizer', 'approved', 1),

('Dhaka Live',        'dhakalive@gaanbajna.com',
 '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
 'organizer', 'approved', 1),

-- Audience
('Rahim Hossain',     'rahim@example.com',
 '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
 'audience', 'active', 1),

('Sumaiya Akter',     'sumaiya@example.com',
 '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
 'audience', 'active', 1);


-- ============================================================
-- 2. SINGER PROFILES
--    Linked to users by user_id (adjust IDs if needed)
--    availability = 1 → available for booking
-- ============================================================

-- Get singer user IDs (assuming auto-increment started at 1):
--   admin=1, arif=2, nancy=3, imran=4, kona=5, habib=6
--   soundwave=7, dhakalive=8, rahim=9, sumaiya=10

INSERT INTO singer_profiles (user_id, bio, genre, fee, availability) VALUES
(2, 'Award-winning Bangladeshi folk-fusion artist with 15+ years on stage.', 'Folk / Fusion', 50000, 1),
(3, 'Pop sensation known for soulful ballads and high-energy live shows.',   'Pop',           40000, 1),
(4, 'Chart-topping modern Bangla pop artist loved by millions.',             'Pop / R&B',     45000, 1),
(5, 'Queen of Bangla indie — her voice is unmistakable.',                    'Indie / Soul',  38000, 1),
(6, 'Legendary fusion maestro blending Rabindra sangeet with jazz.',         'Fusion / Jazz', 60000, 1);


-- ============================================================
-- 3. EVENTS / CONCERTS
--    status = 'live'  → REQUIRED to appear on /concerts page
--    organizer_id must match an organizer user
-- ============================================================

INSERT INTO events
  (title, description, date, venue, organizer_id, status, custom_url,
   total_tickets, tickets_sold, is_dynamic_pricing)
VALUES

('Dhaka Music Fiesta 2025',
 'The biggest open-air music festival in Dhaka featuring top Bangladeshi artists. Two stages, food stalls, and non-stop music from 4 PM.',
 '2025-12-20 16:00:00', 'Bashundhara City Convention Hall, Dhaka',
 7, 'live', 'dhaka-music-fiesta-2025',
 1000, 120, 0),

('Eid Special Night Concert',
 'Celebrate Eid with a magical evening of music, featuring Habib Wahid and special guests.',
 '2025-04-01 19:00:00', 'Army Stadium, Dhaka',
 7, 'live', 'eid-special-night',
 2000, 450, 0),

('Bangla Rock Night',
 'A high-energy rock night showcasing Bangladesh\'s best bands and solo artists. Expect an unforgettable night of riffs and rhythms.',
 '2025-11-15 18:00:00', 'International Convention City Bashundhara, Dhaka',
 8, 'live', 'bangla-rock-night',
 800, 200, 1),

('Kolkata–Dhaka Friendship Concert',
 'A cross-border musical celebration bringing together artists from Kolkata and Dhaka on one stage.',
 '2025-10-10 17:00:00', 'Bangladesh National Museum Auditorium, Dhaka',
 8, 'live', 'kolkata-dhaka-friendship',
 500, 80, 0),

('Acoustic Evenings Vol. 3',
 'An intimate acoustic session featuring Kona and Nancy in a cozy venue — perfect for music lovers who appreciate raw, unplugged performances.',
 '2025-09-05 18:30:00', 'The Daily Star Centre, Dhaka',
 7, 'live', 'acoustic-evenings-vol-3',
 300, 60, 0);


-- ============================================================
-- 4. TICKET TIERS
--    Each event gets up to 3 tiers (as per schema)
-- ============================================================

-- Event 1: Dhaka Music Fiesta 2025
INSERT INTO ticket_tiers (event_id, tier_name, price, total_seats, seats_sold) VALUES
(1, 'General',  500,  600, 80),
(1, 'Premium',  1200, 300, 35),
(1, 'VIP',      2500, 100, 5);

-- Event 2: Eid Special Night
INSERT INTO ticket_tiers (event_id, tier_name, price, total_seats, seats_sold) VALUES
(2, 'General',  800,  1200, 300),
(2, 'Premium',  1800,  600, 120),
(2, 'VIP',      3500,  200, 30);

-- Event 3: Bangla Rock Night
INSERT INTO ticket_tiers (event_id, tier_name, price, total_seats, seats_sold) VALUES
(3, 'General',  600,  500, 150),
(3, 'Premium',  1500, 200, 40),
(3, 'VIP',      3000, 100, 10);

-- Event 4: Kolkata–Dhaka Friendship
INSERT INTO ticket_tiers (event_id, tier_name, price, total_seats, seats_sold) VALUES
(4, 'General',  700,  300, 60),
(4, 'Premium',  1600, 150, 18),
(4, 'VIP',      3200,  50, 2);

-- Event 5: Acoustic Evenings
INSERT INTO ticket_tiers (event_id, tier_name, price, total_seats, seats_sold) VALUES
(5, 'General',  400,  200, 45),
(5, 'Premium',  900,   80, 13),
(5, 'VIP',      1800,  20, 2);


-- ============================================================
-- 5. EVENT SINGERS (which singers perform at which event)
--    Assumes a junction table event_singers(event_id, singer_id)
--    singer_id = user_id of the singer
-- ============================================================

INSERT INTO event_singers (event_id, singer_id) VALUES
(1, 2), (1, 3), (1, 4),   -- Fiesta: Arif, Nancy, Imran
(2, 6), (2, 3),            -- Eid: Habib, Nancy
(3, 4), (3, 2),            -- Rock: Imran, Arif
(4, 5), (4, 6),            -- Friendship: Kona, Habib
(5, 5), (5, 3);            -- Acoustic: Kona, Nancy


-- ============================================================
-- 6. MARKETPLACE ITEMS (Products)
--    seller_id must be a valid user (singer or organizer)
--    status = 'active' to appear in marketplace listing
-- ============================================================

INSERT INTO marketplace_items
  (seller_id, name, description, price, stock, category, status)
VALUES

-- Arif Alvi (singer, id=2)
(2, 'Arif Alvi Signed Poster',
 'Limited edition A2 concert poster, hand-signed by Arif Alvi. Perfect for your music room.',
 850, 50, 'Merchandise', 'active'),

(2, 'Folk Fusion Acoustic CD',
 'Arif Alvi\'s latest studio album "Mati O Sur" — physical CD with exclusive booklet.',
 499, 100, 'Music', 'active'),

-- Nancy (singer, id=3)
(3, 'Nancy Concert T-Shirt',
 'Premium cotton T-shirt with Nancy\'s signature Eid Concert 2025 artwork. Sizes S–XXL.',
 699, 200, 'Apparel', 'active'),

(3, 'Nancy Tote Bag',
 'Eco-friendly canvas tote bag with Nancy\'s iconic logo print.',
 350, 150, 'Merchandise', 'active'),

-- Imran (singer, id=4)
(4, 'Imran Autographed Album Cover',
 'Printed album cover of "Valobasha Korbo" autographed by Imran himself.',
 600, 75, 'Merchandise', 'active'),

(4, 'Pop Hits Collection USB',
 'All of Imran\'s hit tracks loaded on a branded USB drive. Plug and play!',
 799, 60, 'Music', 'active'),

-- Kona (singer, id=5)
(5, 'Kona Indie Vinyl Record',
 'Limited run vinyl of Kona\'s debut album "Nil Akash" — collector\'s edition.',
 1200, 30, 'Music', 'active'),

(5, 'Kona Wristband Set',
 'Set of 3 silicone wristbands from the Acoustic Evenings tour.',
 199, 300, 'Merchandise', 'active'),

-- Habib Wahid (singer, id=6)
(6, 'Habib Wahid Guitar Pick Set',
 'Pack of 10 custom guitar picks used and signed by Habib Wahid during live shows.',
 450, 80, 'Merchandise', 'active'),

(6, 'Jazz Fusion Live CD',
 'Live recording of Habib Wahid\'s sold-out Friendship Concert performance.',
 550, 120, 'Music', 'active'),

-- SoundWave Events (organizer, id=7)
(7, 'GaanBajna Festival Hoodie',
 'Official GaanBajna 2025 festival hoodie — thick fleece, unisex sizing.',
 1500, 100, 'Apparel', 'active'),

(7, 'VIP Lanyard & Wristband Combo',
 'Genuine VIP lanyard and wristband from Dhaka Music Fiesta 2025.',
 299, 200, 'Merchandise', 'active'),

-- Dhaka Live (organizer, id=8)
(8, 'Bangla Rock Night Poster (Framed)',
 'Official Bangla Rock Night 2025 gig poster in a premium wooden frame. Ready to hang.',
 1800, 25, 'Merchandise', 'active'),

(8, 'Concert Photography Print Pack',
 'Set of 5 high-quality 8×10 prints from Dhaka Live\'s best concert moments.',
 999, 40, 'Photography', 'active');


-- ============================================================
-- QUICK VERIFICATION QUERIES
-- Run these to confirm data is correctly inserted:
--
--   SELECT id, name, role, status FROM users;
--   SELECT id, title, status, date FROM events;
--   SELECT id, name, price, stock, status FROM marketplace_items;
--   SELECT sp.user_id, u.name, sp.genre, sp.fee FROM singer_profiles sp JOIN users u ON sp.user_id = u.id;
-- ============================================================
