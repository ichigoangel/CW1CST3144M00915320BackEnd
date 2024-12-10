const express = require("express");
const { MongoClient, ObjectID } = require("mongodb");
const morgan = require("morgan");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5050;  // Make sure the backend uses the right port

// Middleware for JSON parsing, CORS setup, and logging
app.use(morgan("dev")); // Logs all incoming requests
app.use(express.json());  // Parses incoming JSON requests
app.use(cors());  // Enable Cross-Origin Resource Sharing (CORS)

// MongoDB connection URI
const connectionURI = "mongodb+srv://svmaze27:SB1kZhm5GKvkFGfe@cluster0.tujxpsf.mongodb.net/CWCST3144M00915320coursework";
let db;

// Connect to MongoDB
async function connectToDB() {
    try {
        const client = new MongoClient(connectionURI, { useUnifiedTopology: true });
        await client.connect();
        console.log("Connected to MongoDB");
        db = client.db("CWCST3144M00915320coursework");  // Use the correct database name
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);  // Exit if the connection fails
    }
}

// Middleware for dynamic collection routing (for fetching and interacting with specific collections)
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

// Serve static images from the /images folder
app.use("/images", express.static("images"));  // Make sure to have an images folder in your backend

// Default route for the API
app.get("/", (req, res) => {
    res.send("Welcome to the After School Club API! Use routes like /lessons to view lessons or /orders to place orders.");
});

// Fetch all lessons from the "Lessons" collection
app.get("/collection/:collectionName", async (req, res, next) => {
    try {
        const results = await req.collection.find({}).toArray();
        res.json(results);  // Send the lessons data back in JSON format
    } catch (err) {
        next(err);  // Pass the error to the error-handling middleware
    }
});

// Add a new order to the "Orders" collection
app.post("/orders", async (req, res, next) => {
    try {
        const order = req.body;  // Get the order data from the request body
        const result = await db.collection("Orders").insertOne(order);  // Insert the order into the "Orders" collection
        res.json({ insertedCount: result.insertedCount });  // Send back a success response
    } catch (err) {
        next(err);  // Pass any error to the error-handling middleware
    }
});

// Update a specific lesson's availability (spaces) after an order is placed
app.put("/lessons/:id", async (req, res, next) => {
    try {
        const result = await req.collection.updateOne(
            { _id: new ObjectID(req.params.id) },  // Find the lesson by its ID
            { $set: { spaces: req.body.spaces } }  // Update the number of available spaces
        );
        res.json(result.modifiedCount === 1 ? { msg: "success" } : { msg: "error" });  // Return success or error based on the result
    } catch (err) {
        next(err);  // Pass the error to the error-handling middleware
    }
});

// Error-handling middleware for uncaught errors
app.use((err, req, res, next) => {
    console.error("Error occurred:", err.message);  // Log the error
    res.status(500).json({ error: err.message });  // Send a 500 status code with the error message
});

// Error handler for unmatched routes (404)
app.use((req, res) => {
    res.status(404).send("File not found!");  // If no route matches, return a 404 error
});

// Start the server
connectToDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);  // Start the server on the specified port
    });
});
