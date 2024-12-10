// models/lessonOrder.js

const { ObjectID } = require("mongodb");

// Define the Lesson schema
const lessonSchema = {
    topic: { type: String, required: true },
    price: { type: Number, required: true },
    location: { type: String, required: true },
    spaces: { type: Number, required: true },  // Number of available spaces
};

// Define the Order schema
const orderSchema = {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    lessonIds: { type: [String], required: true },  // Array of lesson IDs
    spaces: { type: Number, required: true },  // Number of spaces ordered
};

module.exports = { lessonSchema, orderSchema };
