const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB connected ^-^");
    } catch (err) {
        console.error(`Error connecting to db: ${err.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;