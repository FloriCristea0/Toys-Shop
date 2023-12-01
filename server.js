require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');
const path = require('path');
const mongoose = require('mongoose');
const Category = require('./models/category');
const Toy = require('./models/toy');
const app = express();
const port = 3000;

const mongoDBUri = process.env.MONGODB_URI;

mongoose.connect(mongoDBUri, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on('connected', () => {
  console.log('Conectat la MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('Eroare de conectare la MongoDB Atlas:', err);
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

app.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    const recentToys = await Toy.find().sort({ dateAdded: -1 }).limit(2); // Obții ultimele 2 jucării adăugate

    // Calculăm numărul total de jucării și actualizăm numărul de jucării pentru fiecare categorie
    const totalToys = await Toy.countDocuments();
    for (const category of categories) {
      category.numToys = await Toy.countDocuments({ category: category._id });
    }

    res.render('index', { categories, totalToys, recentToys });
  } catch (error) {
    console.error('Eroare la preluarea datelor:', error);
    res.status(500).send('Eroare la preluarea datelor');
  }
});


app.get('/category/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);
    const toysInCategory = await Toy.find({ category: categoryId });
    res.render('category', { category, toysInCategory });
  } catch (error) {
    console.error('Eroare la preluarea datelor:', error);
    res.status(500).send('Eroare la preluarea datelor');
  }
});

app.get('/toy/:id', async (req, res) => {
  try {
    const toyId = req.params.id;
    const toy = await Toy.findById(toyId);

    if (!toy) {
      return res.status(404).send('Jucărie negăsită');
    }

    res.render('toy', { toy });
  } catch (error) {
    console.error('Eroare la preluarea detaliilor jucăriei:', error);
    res.status(500).send('Eroare la preluarea datelor');
  }
});


app.get('/add-toy', async (req, res) => {
  try {
    console.log('Body:', req.body);  // Adaugă această linie
    const categories = await Category.find();
    res.render('add-toy', { categories });
  } catch (error) {
    console.error('Eroare la preluarea datelor:', error);
    res.status(500).send('Eroare la preluarea datelor');
  }
});

app.get('/edit-toy/:id', async (req, res) => {
  try {
    const toyId = req.params.id;
    const toy = await Toy.findById(toyId);
    const categories = await Category.find();
    if (toy) {
      res.render('edit-toy', { toy, categories });
    } else {
      res.status(404).send('Jucărie nu a fost găsită.');
    }
  } catch (error) {
    console.error('Eroare la preluarea datelor:', error);
    res.status(500).send('Eroare la preluarea datelor');
  }
});

app.get('/add-category', (req, res) => {
  res.render('add-category');
});

app.get('/edit-category/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);
    res.render('edit-category', { category });
  } catch (error) {
    console.error('Eroare la preluarea datelor:', error);
    res.status(500).send('Eroare la preluarea datelor');
  }
});

app.post('/add-toy', [
  body('title').notEmpty().withMessage('Titlul este obligatoriu'),
  body('category').notEmpty().withMessage('Categorie invalidă'),
  body('price').isFloat().withMessage('Prețul trebuie să fie un număr'),
  body('age').isInt().withMessage('Vârsta trebuie să fie un număr întreg'),
  body('description').notEmpty().withMessage('Descrierea este obligatorie')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const newToy = new Toy({
      title: req.body.title,
      category: req.body.category,
      price: req.body.price,
      age: req.body.age,
      description: req.body.description,
      dateAdded: new Date()
    });

    await newToy.save();
    await Category.findByIdAndUpdate(req.body.category, { $inc: { numToys: 1 } });

    res.redirect('/');
  } catch (error) {
    console.error('Eroare la adăugarea jucăriei:', error);
    res.status(500).send('Eroare la adăugarea jucăriei');
  }
});

app.post('/update-toy', async (req, res) => {
  try {
    const toyId = req.body.id;
    const toy = await Toy.findById(toyId);

    if (toy) {
      toy.title = req.body.title;
      toy.category = req.body.category;
      toy.price = req.body.price;
      toy.age = req.body.age;
      toy.description = req.body.description;
      await toy.save();
      res.redirect('/'); 
    } else {
      res.status(404).send('Jucăria nu a fost găsită');
    }
  } catch (error) {
    console.error('Eroare la actualizarea jucăriei:', error);
    res.status(500).send('Eroare la actualizarea jucăriei');
  }
});


app.post('/add-category', async (req, res) => {
  try {
    const newCategory = new Category({
      name: req.body.name,
      numToys: 0
    });

    await newCategory.save();
    res.redirect('/');
  } catch (error) {
    console.error('Eroare la adăugarea categoriei:', error);
    res.status(500).send('Eroare la adăugarea categoriei');
  }
});

app.post('/update-category/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);
    if (category) {
      await category.save();
      res.redirect('/');
    } else {
      res.status(404).send('Categoria nu a fost găsită');
    }
  } catch (error) {
    console.error('Eroare la actualizarea categoriei:', error);
    res.status(500).send('Eroare la actualizarea categoriei');
  }
});

app.post('/delete-toy/:id', async (req, res) => {
  try {
    const toyId = req.params.id;
    const deletedToy = await Toy.findByIdAndDelete(toyId);

    if (deletedToy) {
      // Actualizează numărul de jucării din categoria corespunzătoare
      await Category.findByIdAndUpdate(deletedToy.category, { $inc: { numToys: -1 } });

      res.redirect('/'); // Redirect către pagina de index
    } else {
      res.status(404).send('Jucărie nu a fost găsită.');
    }
  } catch (error) {
    console.error('Eroare la ștergerea jucăriei:', error);
    res.status(500).send('Eroare la ștergerea jucăriei');
  }
});

// Modificați de la Category.findByIdAndRemove la Category.findOneAndDelete
app.post('/delete-category/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    // Stergere categoria dupa ID
    const deletedCategory = await Category.findOneAndDelete({ _id: categoryId });

    // Șterge toate jucările din categoria ștearsă
    await Toy.deleteMany({ category: categoryId });

    res.redirect('/'); // Redirectează la pagina principală sau altă pagină relevantă
  } catch (error) {
    console.error('Eroare la ștergerea categoriei:', error);
    res.status(500).send('Eroare la ștergerea categoriei');
  }
});
