-- ═══════════════════════════════════════════════════════════════════════════
--   GaanBajna — SEED DATA
--   University of Dhaka & IIT-DU Focused Concerts + Marketplace
--   FILE LOCATION: db/seed.sql
--   RUN: mysql -u root -p gaanbajna < db/seed.sql
-- ═══════════════════════════════════════════════════════════════════════════

USE gaanbajna;

-- ─────────────────────────────────────────────────────────────────────────────
--  SEED ORGANIZER & SINGER USERS (approved)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT IGNORE INTO users (name, email, password_hash, role, status, profile_pic, bio, created_at) VALUES
('IIT-DU Events Committee',  'iitdu.events@du.ac.bd',    '$2b$10$abcdefghijklmnopqrstuuVGZk0kB7b3HtCNkqXVDlRwkDRb5.aK', 'organizer', 'approved', 'https://images.unsplash.com/photo-1562774053-701939374585?w=200&auto=format&fit=crop', 'Official event committee of IIT, University of Dhaka', NOW()),
('DU Cultural Society',      'culture@du.ac.bd',          '$2b$10$abcdefghijklmnopqrstuuVGZk0kB7b3HtCNkqXVDlRwkDRb5.aK', 'organizer', 'approved', 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=200&auto=format&fit=crop', 'Cultural society of University of Dhaka', NOW()),
('TSC Cultural Wing',        'tsc.culture@du.ac.bd',      '$2b$10$abcdefghijklmnopqrstuuVGZk0kB7b3HtCNkqXVDlRwkDRb5.aK', 'organizer', 'approved', 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=200&auto=format&fit=crop', 'TSC Cultural Wing, DU', NOW()),
('Aurthohin',                'aurthohin.band@gmail.com',  '$2b$10$abcdefghijklmnopqrstuuVGZk0kB7b3HtCNkqXVDlRwkDRb5.aK', 'singer',    'approved', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&auto=format&fit=crop', 'Legendary Bangladeshi rock band', NOW()),
('Hawa Band',                'hawa.band@gmail.com',       '$2b$10$abcdefghijklmnopqrstuuVGZk0kB7b3HtCNkqXVDlRwkDRb5.aK', 'singer',    'approved', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=200&auto=format&fit=crop', 'Indie folk band from Dhaka', NOW()),
('Cryptic Fate',             'crypticfate@gmail.com',     '$2b$10$abcdefghijklmnopqrstuuVGZk0kB7b3HtCNkqXVDlRwkDRb5.aK', 'singer',    'approved', 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=200&auto=format&fit=crop', 'Bangladesh heavy metal pioneers', NOW()),
('Shironamhin',              'shironamhin@gmail.com',     '$2b$10$abcdefghijklmnopqrstuuVGZk0kB7b3HtCNkqXVDlRwkDRb5.aK', 'singer',    'approved', 'https://images.unsplash.com/photo-1571266028243-d220c6a23e6c?w=200&auto=format&fit=crop', 'Rock band from Dhaka', NOW());

-- ─────────────────────────────────────────────────────────────────────────────
--  EVENTS / CONCERTS  (20 rich entries)
-- ─────────────────────────────────────────────────────────────────────────────
-- Using organizer_id=1 (IIT-DU Events), 2 (DU Cultural), 3 (TSC)

INSERT INTO events (
  title, description, organizer_id, singer_id,
  venue, event_date, event_time, duration_minutes,
  banner_image, genre, status,
  ticket_price_general, ticket_price_vip, ticket_price_student,
  total_tickets_general, total_tickets_vip, total_tickets_student,
  sold_tickets_general, sold_tickets_vip, sold_tickets_student,
  is_featured, custom_url, created_at
) VALUES

-- 1 ── IIT Tech Fest Mega Concert
(
  'IIT-DU Tech Fest 2025 — Mega Night',
  'The grandest concert in IIT-DU history! Celebrate the annual Tech Fest with three legendary bands performing live on the iconic TSC grounds. An electrifying night of Bangladeshi rock, metal, and indie music that will shake the pillars of Curzon Hall. 5000+ students from DU, BUET, NSU and beyond are expected. Gates open 5 PM. Don't miss the laser show and fire performance during the finale.',
  1, 4,
  'TSC Auditorium Ground, University of Dhaka',
  '2025-12-20', '18:00:00', 240,
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop',
  'Rock / Metal', 'upcoming',
  400, 1200, 200,
  2000, 300, 1000,
  1450, 280, 820,
  TRUE, 'iitdu-techfest-2025', NOW()
),

-- 2 ── DU Founding Day Concert
(
  'University of Dhaka 104th Founding Day Concert',
  'Marking 104 glorious years of the University of Dhaka! Join us on July 1st for a spectacular musical evening at the Botomul grounds. This historic celebration brings together the finest musicians of Bangladesh to honor the legacy of our beloved শতবর্ষী বিশ্ববিদ্যালয়। The evening will feature classical Rabindra Sangeet, Nazrul Geeti, and modern Bangladeshi music. The backdrop of Curzon Hall illuminated at night makes this an unforgettable cultural milestone.',
  2, 7,
  'Botomul (Banyan Tree Ground), University of Dhaka',
  '2025-07-01', '17:30:00', 210,
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&auto=format&fit=crop',
  'Classical / Cultural', 'upcoming',
  300, 1000, 150,
  3000, 500, 2000,
  2100, 400, 1600,
  TRUE, 'du-founding-day-2025', NOW()
),

-- 3 ── Pohela Boishakh TSC Concert
(
  'Pohela Boishakh 1432 — TSC Grand Festival',
  'Welcome Bangla New Year 1432 with the biggest Baishakhi celebration on campus! TSC erupts with colour, music and joy as we celebrate our Bengali heritage together. The concert features baul music, folk songs, Lalon geeti and the beloved songs of our independence movement. Wear your finest white and red, bring your family and friends, and let's usher in নববর্ষ together under the open sky of our beloved বিশ্ববিদ্যালয়।',
  3, 5,
  'TSC Cafeteria Ground, University of Dhaka',
  '2025-04-14', '07:00:00', 480,
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop',
  'Folk / Baul / Cultural', 'upcoming',
  0, 500, 0,
  5000, 200, 3000,
  3800, 180, 2900,
  TRUE, 'pohela-boishakh-1432', NOW()
),

-- 4 ── IIT-DU Night of Code & Music
(
  'IIT-DU: Night of Code & Music 2025',
  'A unique fusion of hackathon and live music! After 24 hours of intense coding at IIT-DU, wind down with an exclusive midnight concert. Hawa Band performs their soulful indie set while coders celebrate their creations. This intimate concert is exclusively for IIT-DU students, faculty and hackathon participants. The courtyard of the IIT building transforms into a magical stage with fairy lights and acoustic vibes.',
  1, 5,
  'IIT-DU Courtyard, University of Dhaka',
  '2025-11-15', '22:00:00', 150,
  'https://images.unsplash.com/photo-1501386761578-eaa54b915e8e?w=1200&auto=format&fit=crop',
  'Indie / Acoustic', 'upcoming',
  200, 600, 100,
  500, 100, 300,
  320, 80, 240,
  FALSE, 'iitdu-night-code-music', NOW()
),

-- 5 ── Victory Day Rock Concert
(
  'Victory Day Rock Concert — বিজয় উৎসব 2025',
  'In honor of the 54th Victory Day of Bangladesh, GaanBajna and DU Cultural Society present the মহান বিজয় দিবস Rock Concert. Cryptic Fate and Shironamhin headline this patriotic night, performing songs of liberation, freedom and the spirit of 1971. The concert begins with a tribute to the Shaheed Minar and a candlelight procession through the campus. Feel the pride of being Bangladeshi under the open sky of Dhaka University.',
  2, 6,
  'Central Shaheed Minar, University of Dhaka',
  '2025-12-16', '17:00:00', 180,
  'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200&auto=format&fit=crop',
  'Rock / Patriotic', 'upcoming',
  350, 1100, 150,
  2500, 400, 1500,
  1800, 350, 1200,
  TRUE, 'victory-day-rock-2025', NOW()
),

-- 6 ── Autumn Fest
(
  'DU Autumn Music Festival — শরতের সুর',
  'As the kaash phool blooms across Bangladesh, DU Cultural Society hosts শরতের সুর — an autumn music festival celebrating the beauty of the season. Under the golden afternoon light filtering through the trees of TS campus, artists perform Rabindra Sangeet, Nazrul Geeti, and contemporary Bangla songs. A gorgeous open-air event where music meets the natural splendor of the DU campus.',
  2, 7,
  'Shaheed Intellectuals Memorial, DU',
  '2025-10-05', '16:00:00', 180,
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&auto=format&fit=crop',
  'Classical / Rabindra Sangeet', 'upcoming',
  250, 800, 120,
  1500, 250, 1000,
  900, 180, 700,
  FALSE, 'du-autumn-festival-2025', NOW()
),

-- 7 ── IIT-DU Alumni Night
(
  'IIT-DU Alumni Grand Reunion Concert 2025',
  'IIT-DU alumni from across the world come home! The annual reunion concert brings together graduates from every batch for a magical night of nostalgia, friendship and incredible music. Aurthohin performs a special set of their greatest hits while alumni relive their college days. The night features a photo exhibition of IIT-DU through the years and heartfelt speeches from batch representatives.',
  1, 4,
  'Curzon Hall Lawn, University of Dhaka',
  '2025-09-27', '19:00:00', 210,
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&auto=format&fit=crop',
  'Rock / Nostalgic', 'upcoming',
  600, 1800, 300,
  1000, 200, 500,
  750, 160, 400,
  FALSE, 'iitdu-alumni-2025', NOW()
),

-- 8 ── Independence Day
(
  'Independence Day Sunrise Concert — ২৬শে মার্চ ভোরের সুর',
  'Greet the dawn of Bangladesh\'s 55th Independence Day with music at the iconic Suhrawardy Udyan. Starting at 6 AM with the first rays of sunlight, artists perform patriotic songs, folk music and songs of the Language Movement. A deeply emotional and historically resonant experience for every Bangladeshi student at the University of Dhaka. Free entry for all DU students with valid ID.',
  3, 5,
  'Suhrawardy Udyan, Near DU Campus',
  '2026-03-26', '06:00:00', 240,
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&auto=format&fit=crop',
  'Patriotic / Folk', 'upcoming',
  0, 800, 0,
  10000, 300, 5000,
  7200, 250, 4000,
  TRUE, 'independence-day-2026', NOW()
),

-- 9 ── International Mother Language Day
(
  'Ekushey February — Language Martyrs Night Concert',
  'On the eve of International Mother Language Day, GaanBajna hosts a solemn and beautiful tribute concert at the Central Shaheed Minar. The concert begins at midnight as the nation wakes to honor the language martyrs of 1952. Artists perform Ekushey songs, আমার ভাইয়ের রক্তে রাঙানো classics, and contemporary tributes to the Bangla language. Barefoot walk to Shaheed Minar followed by live music.',
  3, 7,
  'Central Shaheed Minar, DU',
  '2026-02-21', '00:01:00', 300,
  'https://images.unsplash.com/photo-1519682577862-22b62b24e493?w=1200&auto=format&fit=crop',
  'Cultural / Memorial', 'upcoming',
  0, 600, 0,
  8000, 200, 5000,
  6500, 180, 4200,
  TRUE, 'ekushey-february-2026', NOW()
),

-- 10 ── Freshers Welcome
(
  'IIT-DU Freshers Welcome Night 2025-26',
  'Welcome to the family! IIT-DU welcomes the batch of 2025-26 with the grandest freshers welcome night. Senior students, faculty and the new batch celebrate together with a full concert, cultural performances and the legendary রাগিং-free welcome tradition of IIT-DU. Hawa Band sets the mood with their best songs while first-year students discover what makes IIT-DU the most vibrant department at the University of Dhaka.',
  1, 5,
  'IIT-DU Seminar Hall & Lawn',
  '2025-08-10', '19:30:00', 180,
  'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=1200&auto=format&fit=crop',
  'Pop / Indie', 'upcoming',
  0, 0, 0,
  800, 0, 800,
  620, 0, 620,
  FALSE, 'iitdu-freshers-2025', NOW()
),

-- 11 ── Baishakhi Mela (completed)
(
  'Baishakhi Mela Concert 1431 — DU',
  'The beloved annual Baishakhi Mela at University of Dhaka campus. A full day of music, dance, drama and traditional Bengali food. Folk bands, baul singers and modern artists took the stage for 8 hours of non-stop celebration. Over 8000 attendees enjoyed this iconic celebration on the DU grounds.',
  2, 5,
  'TSC Ground, University of Dhaka',
  '2024-04-14', '08:00:00', 480,
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&auto=format&fit=crop',
  'Folk / Cultural', 'completed',
  0, 400, 0,
  8000, 300, 4000,
  8000, 300, 4000,
  FALSE, 'baishakhi-mela-1431', NOW()
),

-- 12 ── DU Jazz Night
(
  'DU Jazz & Blues Night — Monsoon Melodies',
  'A rare treat for jazz lovers in Dhaka! The first-ever Jazz & Blues night at the University of Dhaka features fusion artists blending Western jazz with Bangla folk. As the monsoon rains fall on the DU campus, let the smooth notes of jazz saxophone carry you through a dreamy August night. Intimate seating, candlelit tables, and premium experience for 300 guests.',
  3, NULL,
  'DUCSU Cafeteria, TSC, DU',
  '2025-08-25', '20:00:00', 150,
  'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=1200&auto=format&fit=crop',
  'Jazz / Blues / Fusion', 'upcoming',
  500, 1500, 250,
  200, 50, 100,
  120, 35, 80,
  FALSE, 'du-jazz-blues-2025', NOW()
),

-- 13 ── IIT DU Winter Carnival
(
  'IIT-DU Winter Carnival & Concert 2025',
  'The most anticipated event of the IIT-DU calendar — the Winter Carnival! A 3-day festival ending with a spectacular night concert. Tech exhibitions, robotics showcase, gaming tournament, food stalls and then the grand finale concert. Cryptic Fate closes out the carnival with an explosive metal performance. Temperature drops, energy skyrockets. এটাই IIT-DU!',
  1, 6,
  'IIT-DU Building & Lawn, DU Campus',
  '2025-12-05', '18:30:00', 210,
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop',
  'Metal / Rock', 'upcoming',
  350, 1000, 180,
  1500, 250, 800,
  980, 200, 620,
  FALSE, 'iitdu-winter-carnival-2025', NOW()
),

-- 14 ── Eid Special
(
  'Eid Reunion Concert — DU Alumni & Current Students',
  'After Eid ul-Fitr, DU alumni flock back to campus for the annual Eid reunion. GaanBajna hosts the sweetest concert of the year — featuring soulful Bangla songs, ghazals and joyful melodies that resonate with the spirit of Eid. Shironamhin performs an acoustic set under the stars of the DU campus. Families welcome, traditional food stalls open all evening.',
  2, 7,
  'Madhur Canteen Ground, DU',
  '2025-04-05', '20:00:00', 180,
  'https://images.unsplash.com/photo-1598387993441-a364f854cfdc?w=1200&auto=format&fit=crop',
  'Acoustic / Ghazal', 'upcoming',
  300, 900, 150,
  1200, 200, 800,
  800, 150, 600,
  FALSE, 'eid-reunion-du-2025', NOW()
),

-- 15 ── DU Film & Music Festival
(
  'DU International Film & Music Festival 2025',
  'A prestigious 3-day cultural extravaganza at the University of Dhaka. Celebrating Bangladeshi cinema and music simultaneously — film screenings at TSC followed by live concert performances each night. Directors, actors, and musicians all under one roof at DU. The night concert features emerging indie artists from across Bangladesh sharing their original compositions.',
  2, NULL,
  'TSC Auditorium & Ground, University of Dhaka',
  '2025-11-28', '17:00:00', 240,
  'https://images.unsplash.com/photo-1527736947477-2790e28f3443?w=1200&auto=format&fit=crop',
  'Indie / Experimental', 'upcoming',
  450, 1400, 200,
  1800, 350, 1000,
  1100, 280, 780,
  FALSE, 'du-film-music-fest-2025', NOW()
),

-- 16 ── Midnight Acoustic (IIT-DU)
(
  'IIT-DU Midnight Acoustic Sessions — October',
  'Every October, IIT-DU hosts its legendary Midnight Acoustic Sessions — an intimate, unplugged concert where students and faculty sit on the grass and listen to music under the stars. No stage, no smoke machine, just artists and their instruments in the quiet courtyard of IIT. A deeply personal experience that every IIT-DU student remembers for life. Limited seats — only 200 students.',
  1, NULL,
  'IIT-DU Rooftop / Courtyard',
  '2025-10-18', '23:00:00', 120,
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop',
  'Acoustic / Unplugged', 'upcoming',
  150, 0, 100,
  150, 0, 100,
  98, 0, 87,
  FALSE, 'iitdu-midnight-acoustic-oct', NOW()
),

-- 17 ── Bangla Band Fiesta
(
  'Bangla Band Fiesta — ব্যান্ড মেলা at DU',
  'All the great Bangla bands on one stage! GaanBajna presents the most ambitious music event at University of Dhaka — a full day Band Mela featuring 8 Bangladeshi bands performing back-to-back. From morning acoustic sessions to midnight rock finale, experience every genre of Bangladeshi music. Food stalls, merchandise, fan zones and a guitar workshop by Aurthohin\'s lead guitarist.',
  3, 4,
  'DU Central Field (Khela Matha)',
  '2025-09-13', '11:00:00', 480,
  'https://images.unsplash.com/photo-1619983081563-430f63602796?w=1200&auto=format&fit=crop',
  'Multi-genre', 'upcoming',
  350, 1100, 180,
  4000, 500, 2000,
  2800, 420, 1500,
  TRUE, 'bangla-band-fiesta-2025', NOW()
),

-- 18 ── DU Spring Musical
(
  'DU Spring Musical Evening — বসন্তের গান',
  'Celebrate the arrival of spring with the DU Spring Musical Evening. As পলাশ and শিমুল flowers bloom across Bangladesh, DU Cultural Society hosts a gorgeous open-air musical evening on the Arts Faculty lawn. Traditional Bengali songs of spring, Holi celebration songs, and modern compositions about love and renewal. Come in your brightest spring colors!',
  2, 5,
  'Arts Faculty Lawn, University of Dhaka',
  '2026-02-14', '16:30:00', 180,
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&auto=format&fit=crop',
  'Folk / Classical', 'upcoming',
  200, 700, 100,
  2000, 300, 1500,
  1200, 200, 1000,
  FALSE, 'du-spring-musical-2026', NOW()
),

-- 19 ── IIT-DU Graduation Night
(
  'IIT-DU Graduation Night Concert 2025',
  'The night every IIT-DU student dreams of. As the graduating batch of 2021 receives their degrees, the night explodes into a spectacular concert and celebration. Tears, laughter, group photos and unforgettable music — this is graduation night at IIT-DU. Senior students perform their own compositions on stage, followed by a surprise performance by a special guest artist. A night to treasure forever.',
  1, NULL,
  'IIT-DU Main Hall & Lawn',
  '2025-12-28', '19:00:00', 300,
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop',
  'Mixed / Emotional', 'upcoming',
  500, 1500, 0,
  600, 100, 0,
  480, 85, 0,
  FALSE, 'iitdu-graduation-2025', NOW()
),

-- 20 ── DU Sufi Night
(
  'Sufi Night at DU — আত্মার সুর',
  'A deeply spiritual and emotionally rich Sufi music night at the University of Dhaka. Qawwali maestros, Lalon-inspired baul musicians and contemporary Sufi artists perform in the serene ambiance of the DU mosque gardens. The performance begins after Isha prayer and continues until midnight. Experience the mystical world of Sufi music surrounded by the century-old trees of DU.',
  3, NULL,
  'DU Mosque Garden & Central Mosque Area',
  '2025-11-01', '21:00:00', 180,
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&auto=format&fit=crop',
  'Sufi / Spiritual / Baul', 'upcoming',
  200, 700, 100,
  1000, 150, 700,
  650, 110, 490,
  FALSE, 'du-sufi-night-2025', NOW()
),

-- 21 ── Hawa Band Exclusive
(
  'Hawa Band — An Exclusive DU Night',
  'Hawa Band, the most sought-after indie band of Bangladesh, plays an exclusive ticketed concert only for the DU community! Their soulful melodies, heartbreaking lyrics about Dhaka city life, and unique sound make every performance a once-in-a-lifetime experience. Featuring songs from their debut album plus unreleased tracks performed live for the first time.',
  2, 5,
  'TSC Indoor Auditorium, University of Dhaka',
  '2025-10-25', '19:30:00', 150,
  'https://images.unsplash.com/photo-1501386761578-eaa54b915e8e?w=1200&auto=format&fit=crop',
  'Indie / Alternative', 'upcoming',
  400, 1200, 200,
  800, 150, 400,
  620, 130, 340,
  TRUE, 'hawa-exclusive-du-2025', NOW()
),

-- 22 ── Aurthohin 25th Anniversary
(
  'Aurthohin 25th Anniversary — A Night of Legends at DU',
  '25 years of Aurthohin! Bangladesh\'s most iconic rock band celebrates their silver jubilee with a historic concert at the University of Dhaka. Every song from every album — a 5-hour journey through Bangladeshi rock history. Special appearances by former members, surprise collaborations, and a tribute video featuring fans from across the nation. If you see only one concert this year, make it this one.',
  3, 4,
  'TSC Ground, University of Dhaka',
  '2025-12-31', '20:00:00', 300,
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&auto=format&fit=crop',
  'Rock / Classic', 'upcoming',
  500, 1500, 250,
  3000, 500, 1500,
  2700, 460, 1300,
  TRUE, 'aurthohin-25-anniversary', NOW()
);


-- ─────────────────────────────────────────────────────────────────────────────
--  MARKETPLACE ITEMS  (35 rich entries)
-- ─────────────────────────────────────────────────────────────────────────────
-- seller_id references users table above (IDs may vary — adjust if needed)

INSERT INTO marketplace_items (
  title, description, price, original_price, category,
  image_url, condition_status, seller_id,
  seller_name, seller_dept, seller_contact, seller_hall,
  stock, is_available, is_featured, tags, created_at
) VALUES

-- BOOKS & NOTES
(
  'IIT-DU Data Structures & Algorithms — Complete Handwritten Notes',
  'Full semester handwritten notes for CSE 2101 Data Structures course at IIT, University of Dhaka. Covers arrays, linked lists, trees, graphs, sorting, hashing — everything with diagrams and exam tips. Written by a student who scored A+ in the course. 120 pages, clear handwriting.',
  250, 400,
  'Books & Notes',
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop',
  'Good', 1, 'Rafiqul Islam', 'IIT, DU', '01712345601', 'Salimullah Muslim Hall',
  3, TRUE, TRUE, 'IIT-DU,notes,algorithms,CSE', NOW()
),
(
  'University of Dhaka Admission Guide 2025-26 — Full Set',
  'Complete admission preparation package for University of Dhaka: past 10 years question papers with solutions for all units (Ka, Kha, Ga, Gha, Cha). Includes IIT-DU admission tips, seat plan guidance, and subject-wise preparation strategy. Used by 50+ successful DU students.',
  350, 600,
  'Books & Notes',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop',
  'Good', 2, 'Sumaiya Khanam', 'Computer Science, DU', '01813456702', 'Rokeya Hall',
  5, TRUE, TRUE, 'DU,admission,preparation,books', NOW()
),
(
  'Fundamentals of Database Systems — Ramez Elmasri (Original)',
  'Original English edition of Fundamentals of Database Systems by Ramez Elmasri & Shamkant Navathe. Hardcover, 7th edition. Perfect for IIT-DU Database Management course. Minor highlights in first 3 chapters only. Original price 4,500 BDT at Nilkhet.',
  1800, 4500,
  'Books & Notes',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&auto=format&fit=crop',
  'Good', 1, 'Md. Jahangir Alam', 'IIT, DU', '01911234503', 'Jagannath Hall',
  1, TRUE, FALSE, 'database,textbook,IIT-DU,English', NOW()
),
(
  'Operating Systems — Silberschatz, Galvin (Dinosaur Book)',
  'The famous "Dinosaur Book" — Operating System Concepts by Silberschatz. 10th edition, original. Used one semester at IIT-DU. All chapters intact, cover slightly worn. Essential for OS course. Selling because course completed.',
  1400, 3800,
  'Books & Notes',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&auto=format&fit=crop',
  'Good', 1, 'Tanvir Hossain', 'IIT, DU', '01612345812', 'SM Hall',
  1, TRUE, FALSE, 'OS,operating systems,textbook,IIT-DU', NOW()
),
(
  'DU Law Faculty — Constitutional Law Notes (বাংলায়)',
  'Complete Constitutional Law notes in Bangla for DU Law Faculty students. Covers all chapters of the Bangladesh Constitution, Supreme Court judgements, and exam-format answers. A+ grade notes from 3rd year student. Includes MCQ guide for departmental exam.',
  300, 500,
  'Books & Notes',
  'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop',
  'Like New', 2, 'Nusrat Jahan', 'Law, DU', '01712349901', 'Shamsunnahar Hall',
  4, TRUE, FALSE, 'Law,DU,constitutional,notes,bangla', NOW()
),
(
  'IIT-DU Machine Learning — Printed Lecture Slides + Notes',
  'Complete printed lecture slides from Dr. [Professor]\'s ML course at IIT-DU, supplemented with personal notes. Covers Linear Regression, SVM, Neural Networks, Decision Trees, Clustering. Spiral bound, 200+ pages. Very useful for final exam prep.',
  400, 650,
  'Books & Notes',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop',
  'Good', 1, 'Arafat Rahman', 'IIT, DU', '01811239901', 'Haji Muhammad Muhsin Hall',
  2, TRUE, TRUE, 'ML,machine learning,IIT-DU,notes,AI', NOW()
),

-- ELECTRONICS
(
  'Walton Laptop — 8GB RAM, 256GB SSD (IIT-DU Student Selling)',
  'Walton Talon X1 laptop, 1.5 years old. Purchased new for IIT-DU coursework. Core i5 10th gen, 8GB RAM, 256GB SSD, 15.6" FHD display. Battery life 4-5 hours. No physical damage. Selling because upgrading. Comes with original charger and carry bag.',
  28000, 45000,
  'Electronics',
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop',
  'Good', 1, 'Imtiaz Ahmed', 'IIT, DU', '01712345609', 'SM Hall',
  1, TRUE, TRUE, 'laptop,Walton,IIT-DU,electronics,computer', NOW()
),
(
  'Scientific Calculator — Casio FX-991EX (Original)',
  'Casio ClassWiz FX-991EX scientific calculator. Original, purchased from Nilkhet. Used for 2 semesters at IIT-DU. All functions working perfectly. Ideal for engineering students, physics, mathematics and statistics courses at DU.',
  1200, 1800,
  'Electronics',
  'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&auto=format&fit=crop',
  'Good', 1, 'Sabbir Hossain', 'IIT, DU', '01611239801', 'SM Hall',
  1, TRUE, FALSE, 'calculator,Casio,IIT-DU,math,science', NOW()
),
(
  'Arduino Uno Starter Kit — Complete Set',
  'Arduino Uno R3 complete starter kit: Arduino board, breadboard, jumper wires, LEDs, sensors, LCD display, motor driver. Used for one IIT-DU project. Everything works. Perfect for juniors starting microcontroller projects or IoT assignments at DU.',
  1500, 2500,
  'Electronics',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop',
  'Good', 1, 'Mahbubur Rahman', 'IIT, DU', '01912349812', 'Zahurul Haq Hall',
  2, TRUE, TRUE, 'Arduino,electronics,IoT,IIT-DU,project', NOW()
),
(
  'Headphones — Sony WH-1000XM4 (Noise Cancelling)',
  'Sony WH-1000XM4 premium noise-cancelling headphones. Used 6 months, perfect condition. Ideal for coding sessions, concerts and late-night study. Selling because got earbuds. Comes with original box, cable and carry case.',
  12000, 22000,
  'Electronics',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop',
  'Like New', 2, 'Fahmida Sultana', 'CSE, DU', '01712348801', 'Rokeya Hall',
  1, TRUE, FALSE, 'headphones,Sony,electronics,music,study', NOW()
),

-- CLOTHING
(
  'IIT-DU Official Batch T-Shirt 2021 — Limited Edition',
  'Official IIT-DU batch T-shirt from the graduating class of 2021. Navy blue with gold IIT-DU logo and batch year. Size L. Only 5 pieces remaining. A collector\'s item for IIT-DU students and alumni. High-quality cotton, screen-printed logo.',
  450, 700,
  'Clothing',
  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop',
  'Like New', 1, 'IIT-DU Events Committee', 'IIT, DU', '01700001001', 'N/A',
  5, TRUE, TRUE, 'IIT-DU,tshirt,batch,clothing,limited', NOW()
),
(
  'University of Dhaka Hoodie — Official DU Merchandise',
  'Official University of Dhaka hoodie with embroidered DU logo and "Est. 1921" text. Dark maroon color, size M and L available. Thick cotton blend, perfect for DU\'s winter mornings. Limited stock from DU souvenir store.',
  800, 1200,
  'Clothing',
  'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&auto=format&fit=crop',
  'New', 2, 'DU Cultural Society', 'DU', '01700002002', 'N/A',
  8, TRUE, TRUE, 'DU,University of Dhaka,hoodie,clothing,souvenir', NOW()
),
(
  'Pohela Boishakh Panjabi — Handwoven Cotton (White & Red)',
  'Traditional white and red cotton panjabi perfect for Pohela Boishakh celebrations at DU campus. Handwoven fabric from Tangail, beautiful red embroidery on collar and sleeves. Size 40. Worn only once to TSC Baishakhi event.',
  700, 1400,
  'Clothing',
  'https://images.unsplash.com/photo-1594938298603-c8148c4b4f7f?w=800&auto=format&fit=crop',
  'Like New', 3, 'Kamruzzaman', 'Arts, DU', '01712341901', 'Jagannath Hall',
  1, TRUE, FALSE, 'panjabi,boishakh,traditional,clothing,DU', NOW()
),
(
  'GaanBajna Concert Official Merchandise — Cap + Tee Bundle',
  'Official GaanBajna concert merchandise bundle: Logo cap (adjustable) + concert T-shirt (size M). From the IIT Tech Fest 2024 concert. Very limited stock. The perfect memorabilia for music lovers at DU.',
  600, 950,
  'Clothing',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop',
  'New', 1, 'IIT-DU Events Committee', 'IIT, DU', '01700001001', 'N/A',
  10, TRUE, TRUE, 'GaanBajna,merch,concert,cap,tshirt', NOW()
),

-- FOOD & SNACKS
(
  'Homemade Chitoi Pitha — অর্ডার করুন (Dhaka University Area)',
  'Fresh homemade Chitoi Pitha made by a DU Arts faculty student. Available every Thursday and Friday. Minimum order 12 pieces. Made with finest rice flour and coconut filling. Delivery available within DU campus. Perfect for dorm room snacking!',
  120, 180,
  'Food & Snacks',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&auto=format&fit=crop',
  'New', 2, 'Afroza Begum', 'Fine Arts, DU', '01812348801', 'Rokeya Hall',
  50, TRUE, FALSE, 'pitha,homemade,food,DU,snacks', NOW()
),
(
  'Madhur Canteen Style Khichuri Recipe Pack',
  'Miss Madhur Canteen\'s legendary khichuri? We\'ve got the spice pack! Curated blend of spices exactly like DU\'s iconic Madhur Canteen khichuri recipe. Makes 10 servings. Instructions included. Perfect for homesick DU alumni and current students in dormitories.',
  180, 280,
  'Food & Snacks',
  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop',
  'New', 2, 'Nurul Islam', 'Economics, DU', '01611238903', 'SM Hall',
  20, TRUE, TRUE, 'khichuri,food,DU,Madhur Canteen,spices', NOW()
),
(
  'Handmade Chocolate Box — DU Concert Special',
  'Beautiful handmade Belgian-style chocolates crafted by a DU student entrepreneur. Box of 16 pieces: dark, milk and white chocolate with Bangladeshi flavors (নারকেল, এলাচ, জাফরান). Perfect gift for concerts, Valentine\'s, or just because. Order 2 days in advance.',
  350, 500,
  'Food & Snacks',
  'https://images.unsplash.com/photo-1606312619070-d48b7c7a0745?w=800&auto=format&fit=crop',
  'New', 3, 'Mitu Akter', 'Business, DU', '01712345001', 'Shamsunnahar Hall',
  15, TRUE, FALSE, 'chocolate,homemade,gift,DU,sweet', NOW()
),

-- STATIONERY
(
  'DU-Themed Notebook Set — 3 Pcs (Handmade Cover)',
  'Beautiful set of 3 A5 notebooks with handmade covers featuring iconic DU landmarks: Curzon Hall, Shaheed Minar, and Aparajeyo Bangla. 100gsm paper, 100 pages each. Dotted, lined, and blank. Perfect gift for DU students and alumni.',
  380, 550,
  'Stationery',
  'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&auto=format&fit=crop',
  'New', 2, 'Shimul Akter', 'Fine Arts, DU', '01812348701', 'Rokeya Hall',
  12, TRUE, TRUE, 'notebook,stationery,DU,gift,handmade', NOW()
),
(
  'Mechanical Keyboard — Redragon K552 (Gaming / Coding)',
  'Redragon K552 TKL mechanical keyboard with Outemu Blue switches. Excellent for coding and typing. Used at IIT-DU computer lab for personal coding sessions. Clean and functional. RGB backlight works perfectly.',
  2200, 3500,
  'Electronics',
  'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop',
  'Good', 1, 'Rakibul Hassan', 'IIT, DU', '01712345099', 'Haji Muhsin Hall',
  1, TRUE, FALSE, 'keyboard,mechanical,coding,IIT-DU,gaming', NOW()
),
(
  'Calligraphy Set — Arabic & Bangla Script',
  'Professional calligraphy pen set with 12 nibs, 3 ink bottles (black, gold, red), watercolor brushes. Perfect for IIT-DU design students and fine arts students at DU. Ideal for making concert posters and event banners.',
  650, 1000,
  'Art & Crafts',
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop',
  'Like New', 3, 'Anisur Rahman', 'Fine Arts, DU', '01812349201', 'Jagannath Hall',
  3, TRUE, FALSE, 'calligraphy,art,design,DU,bangla', NOW()
),

-- HOSTEL ITEMS
(
  'Mini Electric Kettle — Russell Hobbs (Perfect for Dorms)',
  'Russell Hobbs 0.5L mini electric kettle. Perfect for DU dormitory use. Instant hot water for tea, coffee, noodles. Used 6 months, no issues. Very compact, fits on any dorm room desk. Selling because leaving campus.',
  800, 1500,
  'Hostel Items',
  'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop',
  'Good', 3, 'Farzana Khanam', 'Social Science, DU', '01912340001', 'Rokeya Hall',
  1, TRUE, FALSE, 'kettle,hostel,dorm,DU,kitchen', NOW()
),
(
  'Study Table Lamp — LED (Eye-protective, Good for Late Night Study)',
  'USB-powered LED study lamp with 3 brightness levels and warm/cool light modes. Used in SM Hall dorm for 1 semester. Eye-protective technology, no flicker. Perfect for late-night studies in DU hostels where ceiling lights are harsh.',
  600, 1000,
  'Hostel Items',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&auto=format&fit=crop',
  'Good', 1, 'Mahmudul Hasan', 'IIT, DU', '01712346001', 'SM Hall',
  2, TRUE, FALSE, 'lamp,LED,hostel,study,DU', NOW()
),
(
  'Prayer Mat + Tasbeeh Set — DU Mosque Shop',
  'Premium prayer mat (জায়নামাজ) with compass and Tasbeeh set. Bought from DU mosque shop. Mat has floral pattern, thick foam base. Tasbeeh counter is electronic. Selling because received as gift — have duplicate.',
  550, 900,
  'Hostel Items',
  'https://images.unsplash.com/photo-1584286595398-a59511a6d2b7?w=800&auto=format&fit=crop',
  'Like New', 2, 'Abdullah Al Mamun', 'Islamic Studies, DU', '01812340201', 'Muazzem Hall',
  1, TRUE, FALSE, 'prayer,hostel,DU,mosque,Islamic', NOW()
),

-- SERVICES
(
  'CV Writing & LinkedIn Profile — by IIT-DU Senior',
  'Professional CV writing service by a final-year IIT-DU student with 2 internship experiences at top Bangladeshi tech firms. ATS-optimized resume, LinkedIn profile optimization, cover letter included. Delivery 48 hours. 20+ satisfied clients at DU.',
  400, 700,
  'Services',
  'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop',
  'New', 1, 'Mehedi Hasan', 'IIT, DU', '01712345501', 'SM Hall',
  20, TRUE, TRUE, 'CV,resume,service,IIT-DU,career', NOW()
),
(
  'Tutoring Service — IIT-DU Level Programming (C, Python, Java)',
  'Personalized tutoring by IIT-DU 4th year student. 1-on-1 sessions for C, C++, Python, Java, Data Structures. Specializes in helping DU students struggling with programming fundamentals. Sessions at DU campus or online. 500 BDT/hour. Trial session 200 BDT.',
  500, 800,
  'Services',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop',
  'New', 1, 'Towhidul Islam', 'IIT, DU', '01912345601', 'Haji Muhsin Hall',
  10, TRUE, TRUE, 'tutoring,programming,service,IIT-DU,coding', NOW()
),
(
  'DU Campus Photography Service — Events & Portraits',
  'Professional photography service by a DU Mass Communication student with 3 years experience. Concert photography, graduation portraits, departmental events, canteen photoshoots. Covers TSC, Curzon Hall, Shaheed Minar, all iconic DU locations. Edited photos delivered within 24 hrs.',
  1500, 2500,
  'Services',
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop',
  'New', 2, 'Riyad Hossain', 'Mass Communication, DU', '01812345601', 'Jagannath Hall',
  5, TRUE, TRUE, 'photography,DU,events,service,portrait', NOW()
),

-- ART & CRAFTS
(
  'Handpainted Curzon Hall Canvas — 16x12 inches',
  'Original oil painting of the iconic Curzon Hall, University of Dhaka by a Fine Arts department student. 16x12 inch canvas, warm golden evening light setting. Certificate of authenticity provided. Makes a stunning gift for DU lovers and alumni.',
  2500, 4000,
  'Art & Crafts',
  'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=800&auto=format&fit=crop',
  'New', 2, 'Nasrin Akter', 'Fine Arts, DU', '01712341801', 'Taposhi Hall',
  1, TRUE, TRUE, 'art,painting,Curzon Hall,DU,canvas', NOW()
),
(
  'Aparajeyo Bangla Miniature Sculpture — Resin',
  'Handcrafted resin miniature of the iconic Aparajeyo Bangla sculpture at DU. 8 inches tall, hand-painted, detailed finish. A beautiful desk decoration and gift for DU students and graduates. Limited pieces made by fine arts senior.',
  1800, 3000,
  'Art & Crafts',
  'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800&auto=format&fit=crop',
  'New', 2, 'Parisa Begum', 'Fine Arts, DU', '01812341901', 'Taposhi Hall',
  3, TRUE, TRUE, 'sculpture,Aparajeyo Bangla,DU,gift,art', NOW()
),
(
  'Concert Poster Design Service — GaanBajna Style',
  'Professional digital concert poster and event banner design service. Specialized in GaanBajna event posters, DU cultural event banners, IIT-DU Tech Fest graphics. Delivered as high-res print-ready PDF + social media sizes. 24-48hr turnaround.',
  800, 1400,
  'Art & Crafts',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
  'New', 1, 'Shafiqul Alam', 'IIT, DU', '01712348901', 'Haji Muhsin Hall',
  15, TRUE, FALSE, 'design,poster,concert,IIT-DU,GaanBajna', NOW()
),

-- SPORTS
(
  'Cricket Bat — SG Scorer Classic (Used, Good Condition)',
  'SG Scorer Classic cricket bat, half cleft. Used for DU inter-department cricket tournament. Weight 1.15 kg, full size. Good edges, minor surface scratches only. Comes with grip tape. Perfect for cricket enthusiasts on DU campus.',
  1200, 2800,
  'Sports',
  'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop',
  'Good', 3, 'Shamsul Huda', 'Physical Education, DU', '01712345201', 'SM Hall',
  1, TRUE, FALSE, 'cricket,bat,sports,DU,tournament', NOW()
),
(
  'Badminton Racket Set — Yonex (2 Rackets + Shuttlecocks)',
  'Yonex badminton set: 2 rackets (Voltric series) + 3 tubes of shuttlecocks. Used for TSC badminton court sessions. Good condition, string tension still holds. Perfect for DU students who play at TSC courts regularly.',
  1800, 3200,
  'Sports',
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop',
  'Good', 2, 'Tanvir Alam', 'PE Dept, DU', '01812345001', 'Haji Muhsin Hall',
  1, TRUE, FALSE, 'badminton,Yonex,sports,DU,TSC', NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
--  COMPLETION MESSAGE
-- ─────────────────────────────────────────────────────────────────────────────
SELECT CONCAT('✅ Seed complete! Events: ', (SELECT COUNT(*) FROM events), ' | Marketplace: ', (SELECT COUNT(*) FROM marketplace_items), ' items') AS result;
