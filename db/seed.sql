-- ─── Seed Users ───────────────────────────────────────────────────────────────
-- password = "Password123" (bcrypt hashed)
INSERT INTO USER (unique_username, email, password, role, status) VALUES
('iitdu_events',   'iitdu@du.ac.bd',       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uOn7ZRsWS', 'organizer', 'active'),
('du_cultural',    'cultural@du.ac.bd',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uOn7ZRsWS', 'organizer', 'active'),
('tsc_wing',       'tsc@du.ac.bd',         '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uOn7ZRsWS', 'organizer', 'active'),
('aurthohin_band', 'aurthohin@gmail.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uOn7ZRsWS', 'singer',    'active'),
('hawa_band',      'hawa@gmail.com',       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uOn7ZRsWS', 'singer',    'active'),
('cryptic_fate',   'cryptic@gmail.com',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uOn7ZRsWS', 'singer',    'active'),
('shironamhin',    'shiro@gmail.com',      '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uOn7ZRsWS', 'singer',    'active');

-- ─── Seed Events (into real EVENT table) ──────────────────────────────────────
-- organizer_id=1 (iitdu_events), organizer_id=2 (du_cultural), organizer_id=3 (tsc_wing)
-- singer_id=4 (aurthohin), singer_id=5 (hawa), singer_id=6 (cryptic), singer_id=7 (shiro)
INSERT INTO EVENT (organizer_id, singer_id, title, description, poster, date, time, venue, city, fee, status, tier1_price, tier1_quantity, tier2_price, tier2_quantity, tier3_price, tier3_quantity) VALUES

(1, 4, 'IIT-DU Tech Fest 2025 — Mega Night',
 'The grand concert night of IIT-DU Annual Tech Fest 2025. Featuring Aurthohin with their iconic rock anthems. A night of technology and music.',
 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&auto=format&fit=crop',
 '2025-12-20', '19:00:00', 'TSC Auditorium Ground, University of Dhaka', 'Dhaka',
 500.00, 'approved', 200.00, 300, 350.00, 200, 500.00, 100),

(2, 7, 'University of Dhaka 104th Founding Day Concert',
 'Celebrate the 104th founding anniversary of University of Dhaka with a special cultural concert at the iconic Botomul.',
 'https://images.unsplash.com/photo-1501386761578-eaa54b9dd8c8?w=800&auto=format&fit=crop',
 '2025-07-01', '18:00:00', 'Botomul, University of Dhaka', 'Dhaka',
 400.00, 'approved', 150.00, 400, 250.00, 300, 400.00, 150),

(3, 5, 'পহেলা বৈশাখ ১৪৩২ — TSC Grand Festival',
 'Welcome the Bengali New Year 1432 with the grand Pohela Boishakh festival at TSC. Free entry for all DU students.',
 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop',
 '2025-04-14', '08:00:00', 'TSC Ground, University of Dhaka', 'Dhaka',
 0.00, 'ended', 0.00, 1000, 0.00, 0, 0.00, 0),

(1, 6, 'IIT-DU Night of Code & Music 2025',
 'A unique fusion event combining hackathon results with live rock music. Celebrating innovation and art together.',
 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop',
 '2025-11-15', '20:00:00', 'IIT Building Lawn, University of Dhaka', 'Dhaka',
 300.00, 'approved', 150.00, 200, 250.00, 150, 350.00, 50),

(2, 7, 'Victory Day Rock Concert — বিজয় উৎসব 2025',
 'Celebrate the 54th Victory Day of Bangladesh with a powerful rock concert at the Central Shaheed Minar.',
 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&auto=format&fit=crop',
 '2025-12-16', '17:00:00', 'Central Shaheed Minar, University of Dhaka', 'Dhaka',
 200.00, 'approved', 150.00, 500, 250.00, 300, 350.00, 100),

(3, 4, 'DU Autumn Music Festival — শরতের সুর',
 'Experience the beauty of autumn through music. A multi-genre festival featuring top Bangladeshi artists.',
 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop',
 '2025-10-05', '17:00:00', 'Kala Bhaban Field, University of Dhaka', 'Dhaka',
 350.00, 'approved', 180.00, 350, 280.00, 250, 400.00, 100),

(1, 5, 'IIT-DU Alumni Grand Reunion Concert 2025',
 'A grand reunion night for IIT-DU alumni. Reconnect, celebrate, and enjoy an exclusive concert at Curzon Hall Lawn.',
 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&auto=format&fit=crop',
 '2025-09-20', '19:00:00', 'Curzon Hall Lawn, University of Dhaka', 'Dhaka',
 600.00, 'approved', 300.00, 200, 450.00, 150, 600.00, 50),

(2, 6, 'Independence Day Sunrise Concert — ২৬শে মার্চ',
 'Greet the dawn of Independence Day with a special sunrise concert. Free entry for all. Celebrate Bangladesh.',
 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&auto=format&fit=crop',
 '2026-03-26', '06:00:00', 'Botomul, University of Dhaka', 'Dhaka',
 0.00, 'approved', 0.00, 2000, 0.00, 0, 0.00, 0),

(3, 7, 'Ekushey February — Language Martyrs Night Concert',
 'A solemn and celebratory night honoring the Language Martyrs of 1952. Free entry. শহীদদের স্মরণে।',
 'https://images.unsplash.com/photo-1468359601543-843bfaef291a?w=800&auto=format&fit=crop',
 '2026-02-21', '20:00:00', 'Central Shaheed Minar, University of Dhaka', 'Dhaka',
 0.00, 'approved', 0.00, 3000, 0.00, 0, 0.00, 0),

(1, 4, 'IIT-DU Freshers Welcome Night 2025-26',
 'Welcome to the new batch of IIT-DU students! A special night of music and celebration for freshers. Free entry.',
 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop',
 '2025-08-10', '19:00:00', 'IIT Auditorium, University of Dhaka', 'Dhaka',
 0.00, 'ended', 0.00, 500, 0.00, 0, 0.00, 0),

(2, 5, 'Bangla Band Fiesta — ব্যান্ড মেলা at DU',
 'The biggest Bangla band festival at University of Dhaka. Multiple bands, one epic night. Rock, pop, folk fusion.',
 'https://images.unsplash.com/photo-1604079628040-94301bb21b91?w=800&auto=format&fit=crop',
 '2025-12-31', '18:00:00', 'TSC Ground, University of Dhaka', 'Dhaka',
 400.00, 'approved', 200.00, 400, 350.00, 300, 500.00, 100),

(3, 6, 'Hawa Band Exclusive DU Night',
 'An exclusive concert by the iconic Hawa Band. Experience their unique sound live at the University of Dhaka.',
 'https://images.unsplash.com/photo-1571266028243-e8e4f9a2e8a0?w=800&auto=format&fit=crop',
 '2025-11-28', '20:00:00', 'TSC Auditorium, University of Dhaka', 'Dhaka',
 450.00, 'live', 200.00, 300, 350.00, 200, 500.00, 80),

(1, 4, 'Aurthohin 25th Anniversary at DU',
 'Celebrate 25 years of Aurthohin — the legend of Bangladeshi rock. রজতজয়ন্তী উদযাপন at University of Dhaka.',
 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop',
 '2025-12-28', '19:30:00', 'Botomul, University of Dhaka', 'Dhaka',
 500.00, 'approved', 250.00, 350, 400.00, 250, 550.00, 100);

-- ─── Seed Marketplace Items (into real ITEM table) ────────────────────────────
INSERT INTO ITEM (seller_id, event_id, name, type, description, price, stock_quantity, photo) VALUES

-- Books & Notes
(4, NULL, 'CSE 3rd Year Complete Notes Bundle — IIT-DU',
 'Books & Notes',
 'Complete handwritten notes for all CSE 3rd year subjects. Algorithms, OS, Database, Networking. Very helpful for exams.',
 350.00, 5,
 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&auto=format&fit=crop'),

(5, NULL, 'Data Structures & Algorithms — Cormen (Original)',
 'Books & Notes',
 'Original CLRS book. Introduction to Algorithms, 3rd Edition. Like new condition. Selling because I graduated.',
 1200.00, 1,
 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&auto=format&fit=crop'),

(6, NULL, 'IIT-DU Previous Year Question Papers 2019–2024',
 'Books & Notes',
 'Complete collection of IIT-DU entrance and semester exam question papers from 2019 to 2024. Printed and organized.',
 200.00, 10,
 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop'),

(7, NULL, 'University Physics — Sears & Zemansky',
 'Books & Notes',
 'University Physics 14th Edition. Good condition, a few highlights. Essential for 1st year physics.',
 800.00, 2,
 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&auto=format&fit=crop'),

-- Electronics
(4, NULL, 'Xiaomi Redmi Buds 4 — Brand New Sealed',
 'Electronics',
 'Brand new sealed Xiaomi Redmi Buds 4 wireless earbuds. Active noise cancellation, 28hr battery. Gift item, keeping original.',
 1800.00, 2,
 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop'),

(5, NULL, 'Mechanical Keyboard — Keychron K2 (Brown Switches)',
 'Electronics',
 'Keychron K2 TKL mechanical keyboard. Brown switches, wireless BT + USB-C. Used 6 months. Perfect condition.',
 4500.00, 1,
 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop'),

(6, NULL, 'Logitech MX Master 3 Mouse',
 'Electronics',
 'Logitech MX Master 3 wireless mouse. Electromagnetic scroll, USB-C charging. Used 1 year, works perfectly.',
 3200.00, 1,
 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&auto=format&fit=crop'),

-- Clothing
(7, NULL, 'IIT-DU Official Hoodie 2024 — L size',
 'Clothing',
 'Official IIT-DU hoodie from 2024 batch. Navy blue with IIT-DU logo. Size L. Worn twice, excellent condition.',
 650.00, 3,
 'https://images.unsplash.com/photo-1601063476271-a159c71ab0b3?q=80&w=652&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),

(4, NULL, 'DU Cultural Week T-Shirt Collection (3 pcs)',
 'Clothing',
 'Set of 3 University of Dhaka cultural week t-shirts. Sizes M, L, XL. Different years. All good condition.',
 450.00, 2,
 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&auto=format&fit=crop'),

-- Food & Snacks
(5, NULL, 'Homemade Pitha Box — 12 pcs Assorted',
 'Food & Snacks',
 'Freshly made traditional Bengali pitha. Chitoi, Patishapta, Bhapa pitha. Order minimum 2 days in advance.',
 280.00, 20,
 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&auto=format&fit=crop'),

(6, NULL, 'DU TSC Special Biriyani Pack',
 'Food & Snacks',
 'Famous TSC-style chicken biriyani pack. Serves 2. Freshly cooked. Available for pickup near TSC every Friday.',
 180.00, 15,
 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop'),

-- Services
(7, NULL, 'Python & Django Tutoring — IIT-DU Senior',
 'Services',
 'One-on-one Python and Django tutoring by IIT-DU 4th year student. 2hrs/session. 5 sessions package available.',
 800.00, 10,
 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop'),

(4, NULL, 'Graphic Design Service — Logos, Posters, Banners',
 'Services',
 'Professional graphic design by IIT-DU student. Event posters, logos, social media banners. Fast delivery.',
 500.00, 20,
 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&auto=format&fit=crop'),

-- Hostel Items
(5, NULL, 'Table Fan — Walton 16 inch (Excellent Condition)',
 'Hostel Items',
 'Walton 16 inch table fan. 3 speed settings. Used 1 semester in Shaheed Smrity Hall. Works perfectly.',
 950.00, 1,
 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop'),

(6, NULL, 'Study Lamp + Extension Board Bundle',
 'Hostel Items',
 'LED study lamp (adjustable brightness) + 4-socket extension board. Both in excellent condition. Hostel essential.',
 550.00, 3,
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop'),

-- Art & Crafts
(7, NULL, 'Handmade Rickshaw Art — University of Dhaka',
 'Art & Crafts',
 'Beautiful handmade rickshaw art painting depicting University of Dhaka. Canvas 12x16 inch. Perfect wall decor.',
 1200.00, 5,
 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&auto=format&fit=crop'),

-- Band Merch (linked to events)
(4, 1, 'Aurthohin IIT-DU Tech Fest 2025 Official T-Shirt',
 'Band Merchandise',
 'Official concert merchandise for IIT-DU Tech Fest 2025. Aurthohin logo on front, event details on back. Limited edition.',
 600.00, 50,
 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&auto=format&fit=crop'),

(5, 12, 'Hawa Band DU Night Official Tote Bag',
 'Band Merchandise',
 'Official tote bag for Hawa Band Exclusive DU Night. Canvas material with band artwork. Limited stock.',
 350.00, 30,
 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&auto=format&fit=crop');
