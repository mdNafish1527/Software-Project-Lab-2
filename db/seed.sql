-- ============================================================
-- GaanBajna Seed Data — Run after schema.sql
-- All passwords are: Password@123
-- ============================================================
USE gaanbajna;

-- ============================================================
-- USERS
-- ============================================================
INSERT INTO USER (unique_username, email, password, role, status, profile_picture) VALUES
-- Admin
('admin', 'admin@gaanbajna.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe5aBTZi', 'admin', 'active', 'https://i.pravatar.cc/150?img=1'),

-- Singers
('rafi_hossain', 'rafi@gaanbajna.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe5aBTZi', 'singer', 'active', 'https://i.pravatar.cc/150?img=11'),
('nandita_roy', 'nandita@gaanbajna.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe5aBTZi', 'singer', 'active', 'https://i.pravatar.cc/150?img=5'),
('arman_alif', 'arman@gaanbajna.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe5aBTZi', 'singer', 'active', 'https://i.pravatar.cc/150?img=12'),
('tahsan_rahman', 'tahsan@gaanbajna.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe5aBTZi', 'singer', 'active', 'https://i.pravatar.cc/150?img=15'),
('mithila_hasan', 'mithila@gaanbajna.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe5aBTZi', 'singer', 'active', 'https://i.pravatar.cc/150?img=9'),

-- Organizers
('soundwave_events', 'soundwave@gaanbajna.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe5aBTZi', 'organizer', 'active', 'https://i.pravatar.cc/150?img=20'),
('dhaka_live', 'dhakalive@gaanbajna.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe5aBTZi', 'organizer', 'active', 'https://i.pravatar.cc/150?img=21'),
('stage_craft', 'stagecraft@gaanbajna.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe5aBTZi', 'organizer', 'active', 'https://i.pravatar.cc/150?img=22'),

-- Audience
('zahid_fan', 'zahid@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe5aBTZi', 'audience', 'active', 'https://i.pravatar.cc/150?img=30'),
('priya_music', 'priya@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe5aBTZi', 'audience', 'active', 'https://i.pravatar.cc/150?img=31');

-- ============================================================
-- SINGER PROFILES
-- ============================================================
INSERT INTO SINGER_PROFILE (singer_id, bio, fixed_fee, availability, genre) VALUES
(2, 'Rafi Hossain is a soulful Bangla pop and R&B artist from Dhaka. Known for his velvety voice and heartfelt lyrics, he has captivated audiences across Bangladesh with chart-topping hits.', 75000.00, 'available', 'Bangla Pop / R&B'),
(3, 'Nandita Roy is a versatile playback and live performer celebrated for blending classical Bangladeshi music with modern sounds. Her performances are an unforgettable journey.', 90000.00, 'available', 'Classical Fusion'),
(4, 'Arman Alif rose to fame with his acoustic storytelling style. His songs about love, loss, and life resonate deeply with millions of listeners across the country.', 80000.00, 'available', 'Acoustic / Folk'),
(5, 'Tahsan Rahman is an icon of Bangladeshi music — a multi-talented singer, actor, and composer whose romantic anthems have defined a generation.', 120000.00, 'unavailable', 'Bangla Pop / Romantic'),
(6, 'Mithila Hasan is a rising star blending Baul folk traditions with contemporary beats, bringing the heart of rural Bangladesh to urban stages.', 60000.00, 'available', 'Baul Folk / Contemporary');

-- ============================================================
-- BOOKING REQUESTS (paid)
-- ============================================================
INSERT INTO BOOKING_REQUEST (organizer_id, singer_id, date, venue, city, status, payment_status) VALUES
(7, 2, '2026-04-15', 'Bangladesh National Museum Auditorium', 'Dhaka', 'accepted', 'paid'),
(8, 3, '2026-04-22', 'Chittagong Convention Hall', 'Chittagong', 'accepted', 'paid'),
(9, 4, '2026-05-01', 'Bashundhara Convention City', 'Dhaka', 'accepted', 'paid'),
(7, 6, '2026-05-10', 'Sylhet International Cricket Stadium', 'Sylhet', 'accepted', 'paid'),
(8, 5, '2026-06-05', 'Army Stadium', 'Dhaka', 'accepted', 'paid');

-- ============================================================
-- EVENTS (Live concerts for showcase)
-- ============================================================
INSERT INTO EVENT (organizer_id, singer_id, title, description, poster, date, time, venue, city, fee, status, dynamic_pricing_enable, tier1_price, tier1_quantity, tier2_price, tier2_quantity, tier3_price, tier3_quantity, launch) VALUES

(7, 2, 'Rafi Unplugged — Acoustic Night',
'An intimate evening with Rafi Hossain performing his greatest hits in a raw, acoustic setting. Expect emotional storytelling through music you have never heard this way before. Limited seats available for a truly personal experience.',
'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
'2026-04-15', '19:00:00', 'Bangladesh National Museum Auditorium', 'Dhaka',
75000.00, 'live', FALSE,
500.00, 150, 1000.00, 100, 1500.00, 50, TRUE),

(8, 3, 'Nandita — Classical Fusion Night',
'Nandita Roy brings together the finest traditions of Bangladeshi classical music and modern arrangements in a spectacular one-night showcase. A cultural experience not to be missed.',
'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800',
'2026-04-22', '18:30:00', 'Chittagong Convention Hall', 'Chittagong',
90000.00, 'live', TRUE,
600.00, 200, 1200.00, 120, 2000.00, 60, TRUE),

(9, 4, 'Arman Alif — Golpo Gaan',
'Arman Alif takes the stage for an extraordinary night of storytelling through song. Each track is a chapter, each verse a feeling. Come be part of the story.',
'https://images.unsplash.com/photo-1501612780327-45045538702b?w=800',
'2026-05-01', '20:00:00', 'Bashundhara Convention City', 'Dhaka',
80000.00, 'live', FALSE,
400.00, 300, 800.00, 150, 1200.00, 80, TRUE),

(7, 6, 'Mithila — Baul by the River',
'Experience the soulful sounds of Mithila Hasan as she celebrates the timeless Baul folk tradition of Bangladesh. An open-air concert under the stars in the heart of Sylhet.',
'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
'2026-05-10', '17:30:00', 'Sylhet International Cricket Stadium', 'Sylhet',
60000.00, 'live', FALSE,
300.00, 400, 600.00, 200, 900.00, 100, TRUE),

(8, 5, 'Tahsan Live — The Grand Concert',
'The most anticipated concert of the year! Tahsan Rahman returns to the stage for a massive live show featuring all his greatest hits spanning two decades of iconic Bangladeshi music.',
'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800',
'2026-06-05', '20:30:00', 'Army Stadium', 'Dhaka',
120000.00, 'live', TRUE,
800.00, 500, 1500.00, 250, 3000.00, 100, TRUE);

-- ============================================================
-- MARKETPLACE ITEMS
-- ============================================================
INSERT INTO ITEM (seller_id, event_id, name, type, description, price, stock_quantity, photo) VALUES

-- Rafi's merch (event 1)
(2, 1, 'Rafi Unplugged Official T-Shirt', 'T-Shirt',
'Limited edition official concert t-shirt. 100% cotton, unisex sizing. Features Rafi''s signature artwork on the back.',
850.00, 120,
'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'),

(2, 1, 'Rafi Hossain — Signed Album "Nishitto"', 'Album',
'The debut studio album by Rafi Hossain, hand-signed by the artist himself. Includes 12 original tracks and a personal note.',
1200.00, 50,
'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400'),

(2, NULL, 'Rafi Acoustic Guitar Pick Set', 'Accessory',
'A set of 5 custom guitar picks used by Rafi during live performances. Comes in a collectible tin case.',
350.00, 200,
'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400'),

-- Nandita's merch (event 2)
(3, 2, 'Nandita Classical Fusion Poster — A2 Print', 'Poster',
'High-quality A2 glossy art print featuring Nandita Roy from her Classical Fusion Night tour. Perfect for framing.',
450.00, 80,
'https://images.unsplash.com/photo-1619983081563-430f63602796?w=400'),

(3, 2, 'Nandita Fusion Night Hoodie', 'Hoodie',
'Premium quality hoodie with embroidered GaanBajna and Nandita Roy logo. Available in black and navy.',
1500.00, 60,
'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400'),

-- Arman's merch (event 3)
(4, 3, 'Arman Alif "Golpo Gaan" Limited Vinyl', 'Vinyl Record',
'A limited run of 200 vinyl records featuring Arman Alif''s most beloved acoustic tracks. Each numbered and signed.',
2500.00, 40,
'https://images.unsplash.com/photo-1593787406988-ce1ad31d4b49?w=400'),

(4, 3, 'Arman Alif Concert Tote Bag', 'Bag',
'Canvas tote bag with hand-drawn artwork by Arman Alif. Eco-friendly and spacious. A must-have for any fan.',
600.00, 150,
'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'),

-- Mithila's merch
(6, 4, 'Mithila Baul Ektar — Handcrafted', 'Instrument',
'A traditional one-stringed Baul instrument (Ektar) handcrafted by artisans in Kushtia, endorsed by Mithila Hasan.',
3500.00, 20,
'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'),

(6, NULL, 'Mithila Hasan — Folk Songs CD Collection', 'Album',
'A 3-disc collection of Mithila''s folk song recordings. Includes rare early recordings and studio favourites.',
900.00, 75,
'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400'),

-- Tahsan's merch (event 5)
(5, 5, 'Tahsan Official Cap — Grand Concert Edition', 'Cap',
'Official snapback cap from Tahsan''s Grand Concert. Embroidered logo and limited run of 500 pieces.',
750.00, 100,
'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400'),

(5, 5, 'Tahsan 20th Anniversary Photo Book', 'Book',
'A stunning 200-page hardcover photo book celebrating 20 years of Tahsan''s music career. Behind-the-scenes, rare photos, and personal messages.',
2200.00, 35,
'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'),

-- Organizer merch
(7, NULL, 'GaanBajna Official Merchandise Bundle', 'Bundle',
'The ultimate GaanBajna fan bundle — includes a T-shirt, cap, tote bag, and exclusive sticker pack.',
2000.00, 50,
'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400');

-- ============================================================
-- Done! Use these accounts to test:
-- 
-- Admin:     admin@gaanbajna.com      / Password@123
-- Singer:    rafi@gaanbajna.com       / Password@123
-- Organizer: soundwave@gaanbajna.com  / Password@123
-- Audience:  zahid@gmail.com          / Password@123
-- ============================================================
