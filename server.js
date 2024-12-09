const express = require("express");
const { MongoClient, ObjectID } = require("mongodb");

const app = express();
const PORT = 5050;

// Middleware for JSON parsing and CORS setup
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
    );
    next();
});

let db;


// Add multiple products to the collection
app.post("/collection/Lesson", (req, res, next) => {
    const products = req.body; // Assuming you send the data in the request body
    req.collection.insertMany(products, (err, result) => {
        if (err) return next(err);
        res.json({ insertedCount: result.insertedCount });
    });
});

// Fetch a specific document by ID
app.get("/collection/:collectionName/:id", (req, res, next) => {
    req.collection.findOne({ _id: new ObjectID(req.params.id) }, (err, result) => {
        if (err) return next(err);
        res.json(result);
    });
});

// Update a specific document by ID
app.put("/collection/:collectionName/:id", (req, res, next) => {
    req.collection.updateOne(
        { _id: new ObjectID(req.params.id) },
        { $set: req.body },
        { safe: true, multi: false },
        (err, result) => {
            if (err) return next(err);
            res.json(result.modifiedCount === 1 ? { msg: "success" } : { msg: "error" });
        }
    );
});

// Delete a specific document by ID
app.delete("/collection/:collectionName/:id", (req, res, next) => {
    req.collection.deleteOne({ _id: new ObjectID(req.params.id) }, (err, result) => {
        if (err) return next(err);
        res.json(result.deletedCount === 1 ? { msg: "success" } : { msg: "error" });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
