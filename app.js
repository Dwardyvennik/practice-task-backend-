// 11 task
require('dotenv').config();

const { MongoClient, ObjectId } = require('mongodb');
const express = require('express');


const app = express();
const port = process.env.PORT || 3000; 
//midlewares
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});


const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
let productsCollection;

async function connectToDatabase() {
    await client.connect();
    const database = client.db('store');
    productsCollection = database.collection('products');
    console.log('Connected to MongoDB');
}

//routes
app.get('/', (req, res) => {
  res.send(`
    <h1>Products api</h1>
    <ul>
      <li><a href="/api/products">/api/products</a></li>
      <li><a href="/api/products/1">/api/products/:id</a></li>
    </ul>
  `);
});

// 10 task
app.get('/api/products', async (req, res) => {
  try {
    const { category, minPrice, sort, fields } = req.query;
    const filter = {};
    if (category) {
      filter.category = category;
    }
    if (minPrice) {
      filter.price = { $gte: Number(minPrice) };
    }
    let projection = {};
    if (fields) {
      fields.split(',').forEach(field => {
        projection[field] = 1;
      });
    }
    let query = productsCollection.find(filter);
    if (sort === 'price') {
      query = query.sort({ price: 1 });
    }
    if (fields) {
      query = query.project(projection);
    }

    const products = await query.toArray();

    res.json({
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/products', async (req, res) => {
  const { name, price, category } = req.body;
  if (!name || price === undefined || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const newProduct = {
    name,
    price,
    category
  };
  await productsCollection.insertOne(newProduct);
  res.status(201).json(newProduct);
});

app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});
async function startServer() {
  try {
    await connectToDatabase();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
  }
}
startServer();
