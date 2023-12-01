const mongoose = require('mongoose');

const toySchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  age: { type: Number, required: true },
  description: { type: String, required: true },
  dateAdded: { type: Date, default: Date.now },
});

const Toy = mongoose.model('Toy', toySchema);

module.exports = Toy;
