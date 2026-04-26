require('dotenv').config();
const db = require('./db');

const products = [
  {
    name: 'Acoustic Guitar',
    description: 'Beginner-friendly acoustic guitar for Bangla music practice and live performance.',
    price: 8500,
    stock: 8,
    image: null,
  },
  {
    name: 'Electric Guitar',
    description: 'Electric guitar suitable for band performance and stage shows.',
    price: 18500,
    stock: 5,
    image: null,
  },
  {
    name: 'Tabla Set',
    description: 'Traditional tabla set for classical, folk and fusion music.',
    price: 7200,
    stock: 10,
    image: null,
  },
  {
    name: 'Harmonium',
    description: 'Portable harmonium for vocal practice, folk songs and classical performance.',
    price: 12000,
    stock: 6,
    image: null,
  },
  {
    name: 'Stage Microphone',
    description: 'Dynamic microphone for live concert and studio practice.',
    price: 3500,
    stock: 15,
    image: null,
  },
  {
    name: 'Wireless Microphone Set',
    description: 'Wireless microphone set for concert organizers and stage performers.',
    price: 14500,
    stock: 4,
    image: null,
  },
  {
    name: 'Keyboard Piano',
    description: 'Electronic keyboard for music composition and live stage support.',
    price: 22000,
    stock: 3,
    image: null,
  },
  {
    name: 'Music Album Disk',
    description: 'Physical music disk collection for Bangla music lovers.',
    price: 450,
    stock: 40,
    image: null,
  },
  {
    name: 'Guitar Pick Set',
    description: 'Pack of guitar picks for acoustic and electric guitar players.',
    price: 180,
    stock: 60,
    image: null,
  },
  {
    name: 'Concert Sound Cable Pack',
    description: 'Audio cable pack for organizers, sound engineers and performers.',
    price: 1250,
    stock: 20,
    image: null,
  },
];

async function seedMarketplaceProducts() {
  try {
    const [owners] = await db.query(
      `SELECT u_id, unique_username, role
       FROM \`USER\`
       WHERE role IN ('singer', 'organizer')
       AND account_status = 'approved'
       ORDER BY u_id ASC
       LIMIT 1`
    );

    if (!owners.length) {
      console.log('No approved singer or organizer found. Create or approve one first.');
      process.exit(0);
    }

    const ownerId = owners[0].u_id;

    for (const product of products) {
      const [existing] = await db.query(
        `SELECT product_id
         FROM \`MERCH_PRODUCT\`
         WHERE name = ?
         AND owner_id = ?`,
        [product.name, ownerId]
      );

      if (existing.length) {
        console.log(`Skipped existing product: ${product.name}`);
        continue;
      }

      await db.query(
        `INSERT INTO \`MERCH_PRODUCT\`
         (owner_id, event_id, name, description, price, stock, image, is_active)
         VALUES (?, NULL, ?, ?, ?, ?, ?, TRUE)`,
        [
          ownerId,
          product.name,
          product.description,
          product.price,
          product.stock,
          product.image,
        ]
      );

      console.log(`Added product: ${product.name}`);
    }

    console.log('Default marketplace music products added successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seed marketplace products error:', err);
    process.exit(1);
  }
}

seedMarketplaceProducts();
