const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  numToys: { type: Number, default: 0 },
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
