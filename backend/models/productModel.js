const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, default: '📦' },
    stock: { type: Number, required: true, default: 0 },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    imageUrl: { type: String },
}, {
    timestamps: true,
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
