const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        // For development, don't exit if no DB, just warn
        console.warn('RUNNING WITHOUT MONGODB - DATA WILL NOT PERSIST');
    }
};

module.exports = connectDB;
