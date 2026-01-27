const mongoose = require("mongoose");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect("mongodb+srv://achraf:lafkiri@cluster0.lcme2ix.mongodb.net/", {
      bufferCommands: false,
    }).then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  console.log("✅ MongoDB connected");
  return cached.conn;
};

module.exports = connectDB;