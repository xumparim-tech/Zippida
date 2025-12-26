const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    items: [
        {
            name: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: false // Allow null for deleted products
            },
        }
    ],
    details: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
    },
    total: { type: Number, required: true },
    status: { type: String, default: 'Jarayonda' },
    date: { type: String }, // Storing generated date string for simplicity
}, {
    timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
