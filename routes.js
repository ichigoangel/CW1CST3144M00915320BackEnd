const express = require("express");
const { ObjectID } = require("mongodb");
const router = express.Router();

// GET all lessons
router.get("/lessons", async (req, res) => {
    try {
        const lessons = await req.collection.find({}).toArray();  // Fetch all lessons from MongoDB
        res.json(lessons);  // Return the lessons as JSON
    } catch (err) {
        res.status(500).json({ message: err.message });  // If there's an error, return 500 with the error message
    }
});

// POST a new lesson
router.post("/lessons", async (req, res) => {
    const lesson = req.body;  // Get the lesson details from the request body
    try {
        const result = await req.collection.insertOne(lesson);  // Insert the new lesson into the "Lessons" collection
        res.status(201).json(result.ops[0]);  // Return the inserted lesson
    } catch (err) {
        res.status(400).json({ message: err.message });  // Return error if insertion fails
    }
});

// PUT to update lesson (reduce available spaces)
router.put("/lessons/:id", async (req, res) => {
    const { id } = req.params;  // Get the lesson ID from the URL parameter
    const { spaces } = req.body;  // Get the updated spaces count from the request body
    try {
        const result = await req.collection.updateOne(
            { _id: new ObjectID(id) },  // Find the lesson by ID
            { $set: { spaces: spaces } }  // Update the number of available spaces
        );
        if (result.modifiedCount === 1) {
            res.json({ msg: "success" });  // If the lesson was updated, return success message
        } else {
            res.status(404).json({ msg: "Lesson not found" });  // If no lesson was found with that ID
        }
    } catch (err) {
        res.status(500).json({ message: err.message });  // Return error if update fails
    }
});

// POST a new order
router.post("/orders", async (req, res) => {
    const order = req.body;  // Get the order details from the request body
    try {
        const result = await req.collection.insertOne(order);  // Insert the order into the "Orders" collection
        res.status(201).json(result.ops[0]);  // Return the created order
    } catch (err) {
        res.status(400).json({ message: err.message });  // Return error if order insertion fails
    }
});

module.exports = router;
