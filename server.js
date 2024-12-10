const express = require("express");
const { MongoClient, ObjectID } = require("mongodb");

const app = express();
const PORT = 3000;

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
 
// MongoDB connection
const connectionURI = "mongodb+srv://svmaze27:SB1kZhm5GKvkFGfe@cluster0.tujxpsf.mongodb.net/";
let db;

async function connectToDB() {
    try {
        const client = new MongoClient(connectionURI, { useUnifiedTopology: true });
        await client.connect();
        console.log("Connected to MongoDB");
        // Select the database
        db = client.db("CWCST3144M00915320coursework");
        console.log("Database selected: CWCST3144M00915320coursework");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1); // Exit the process if the database connection fails
    }
}

// Middleware to handle collection routing
app.param("collectionName", (req, res, next, collectionName) => {
    try {
        if (!db) throw new Error("Database connection not established");
        const collection = db.collection(collectionName);
        if (!collection) throw new Error(`Collection ${collectionName} not found`);
        req.collection = collection;
        next();
    } catch (error) {
        next(error); // Pass error to error-handling middleware
    }
});

// Default route
app.get("/", (req, res) => {
    res.send("Welcome to the After School Club API! Use routes like /collection/Lesson or /collection/Order");
});

// Fetch all documents from a collection
app.get("/collection/:collectionName", async (req, res, next) => {
    try {
        const results = await req.collection.find({}).toArray();
        res.json(results);
    } catch (err) {
        next(err);
    }
});

// Add multiple products to the collection
app.post("/collection/:collectionName", async (req, res, next) => {
    try {
        const products = req.body;
        const result = await req.collection.insertMany(products);
        res.json({ insertedCount: result.insertedCount });
    } catch (err) {
        next(err);
    }
});

// Fetch a specific document by ID
app.get("/collection/:collectionName/:id", async (req, res, next) => {
    try {
        const result = await req.collection.findOne({ _id: new ObjectID(req.params.id) });
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// Update a specific document by ID
app.put("/collection/:collectionName/:id", async (req, res, next) => {
    try {
        const result = await req.collection.updateOne(
            { _id: new ObjectID(req.params.id) },
            { $set: req.body }
        );
        res.json(result.modifiedCount === 1 ? { msg: "success" } : { msg: "error" });
    } catch (err) {
        next(err);
    }
});

// Delete a specific document by ID
app.delete("/collection/:collectionName/:id", async (req, res, next) => {
    try {
        const result = await req.collection.deleteOne({ _id: new ObjectID(req.params.id) });
        res.json(result.deletedCount === 1 ? { msg: "success" } : { msg: "error" });
    } catch (err) {
        next(err);
    }
});

// Error-handling middleware
app.use((err, req, res, next) => {
    console.error("Error occurred:", err.message);
    res.status(500).json({ error: err.message });
});

// Error handler for unmatched routes
app.use((req, res) => {
    res.status(404).send("File not found!");
});

// Start the server
connectToDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
