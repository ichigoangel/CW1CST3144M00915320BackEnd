const express = require("express");
const { MongoClient, ObjectId } = require("mongodb"); // Use ObjectId for MongoDB ID
const cors = require("cors");
var path = require("path"); 
var fs = require("fs"); 

const app = express();
const PORT = process.env.PORT || 5050;

// Simple Logger Function
const logger = (level, message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
};

// Middleware for JSON parsing, CORS setup, and logging
app.use(express.json()); // Parses incoming JSON requests
app.use(cors()); // Enable Cross-Origin Resource Sharing (CORS)

// Middleware for logging incoming requests
app.use((req, res, next) => {
    logger("info", `Incoming request: ${req.method} ${req.originalUrl}`);
    next();
});

// Middleware for enabling Cross-Origin Resource Sharing (CORS)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    next();
});
// MongoDB connection URI
const connectionURI = "mongodb+srv://svmaze27:SB1kZhm5GKvkFGfe@cluster0.tujxpsf.mongodb.net/CWCST3144M00915320coursework";
let db;

// Connect to MongoDB
async function connectToDB() {
    try {
        const client = new MongoClient(connectionURI, { useUnifiedTopology: true });
        await client.connect();
        logger("info", "Connected to MongoDB");
        db = client.db("CWCST3144M00915320coursework"); // Use the correct database name
    } catch (error) {
        logger("error", `Error connecting to MongoDB: ${error}`);
        process.exit(1); // Exit if the connection fails
    }
}

// Middleware for dynamic collection routing
app.param("collectionName", (req, res, next, collectionName) => {
    try {
        if (!db) throw new Error("Database connection not established");
        const collection = db.collection(collectionName);
        if (!collection) throw new Error(`Collection ${collectionName} not found`);
        req.collection = collection;
        next();
    } catch (error) {
        logger("error", error.message);
        next(error);
    }
});

// Serve static images from the /images folder
app.use("/images", express.static("images")); // Ensure an "images" folder exists in the backend

// Default route for the API
app.get("/", (req, res) => {
    res.send("Welcome to the After School Lesson API! Use routes like /collection/Lessons or /collection/Orders");
});

// Fetch all documents from a collection (e.g., Lessons)
app.get("/collection/:collectionName", async (req, res, next) => {
    try {
        const results = await req.collection.find({}).toArray();
        logger("info", `Fetched all documents from collection: ${req.params.collectionName}`);
        res.json(results);
    } catch (err) {
        logger("error", `Error fetching documents from collection: ${req.params.collectionName}`);
        next(err);
    }
});

// Fetch a specific document by ID from a collection
app.get("/collection/:collectionName/:id", async (req, res, next) => {
    try {
        const id = new ObjectId(req.params.id); // Convert string ID to MongoDB ObjectId
        const result = await req.collection.findOne({ _id: id });
        if (!result){
            logger("warn", `Document with ID ${req.params.id} not found in collection: ${req.params.collectionName}`);
             return res.status(404).json({ error: "Document not found" });
        }
             res.json(result);
    } catch (err) {
        next(err);
    }
});

// Corrected single POST endpoint for inserting orders
app.post('/collection/:collectionName', async (req, res, next) => {
    try {
        const newOrder = req.body;

        // Validate the request body
        if (!Array.isArray(newOrder)) {
            logger("warn", "Request body is not an array of objects");
            return res.status(400).json({ error: "Request body should be an array of objects." });
        }

        const result = await req.collection.insertMany(newOrder);
        logger("info", `Inserted new documents: ${JSON.stringify(result.insertedIds)}`);
        res.status(201).json(result.insertedIds); // Return the inserted IDs
    } catch (err) {
        logger("error", "Error inserting documents");
        res.status(500).json({ error: "Internal server error" });
    }
});


// Add a new order to the "order" collection
app.post('/collection/order', async (req, res, next) => {
    try {
        const newOrder = req.body;
        logger("info", `Received order data: ${JSON.stringify(newOrder)}`);

        if (!Array.isArray(newOrder)) {
            logger("warn", "Request body is not an array of objects");
            return res.status(400).json({ error: "Request body should be an array of objects." });
        }

        const result = await req.collection.insertMany(newOrder);
        logger("info", `Inserted order: ${JSON.stringify(result.ops)}`);
        res.status(201).json(result.ops);
    } catch (err) {
        logger("error", `Error inserting order: ${err}`);
        next(err);
    }
});

// Update a specific document by ID in a collection
app.put("/collection/:collectionName/:id", async (req, res, next) => {
    try {
        const id = new ObjectId(req.params.id);
        const updates = req.body;

        // Validate that the body is an object
        if (Array.isArray(updates)) {
            logger("warn", "Request body should be a single object, not an array.");
            return res.status(400).json({ error: "Request body should be a single object, not an array." });
        }
        
        const result = await req.collection.updateOne(
            { _id: id },
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            logger("warn", `Document with ID ${req.params.id} not found for update`);
            return res.status(404).json({ error: "Document not found" });
        }
        logger("info", `Document with ID ${req.params.id} updated successfully`);
        res.json({ msg: "Document updated successfully" });
    } catch (err) {
        logger("error", `Error updating document with ID ${req.params.id}: ${err}`);
        next(err);
    }
});

// Serve static files from the "image" directory
app.use(function(req, res, next) { 
    const filePath = path.join(__dirname, "images", req.url); 
    fs.stat(filePath, function(err, fileInfo) { 
        if (err) { 
            next(); 
            return; 
        } 
        if (fileInfo.isFile()) res.sendFile(filePath); 
        else next(); 
    }); 
});

 // Handle 404 errors for undefined routes
 app.use(function(req, res) { 
    logger("warn", `File not found: ${req.originalUrl}`);
    res.status(404); // Set status to 404
    res.send("File not found!"); 
    });

// Start the server
connectToDB().then(() => {
    app.listen(PORT, () => {
        logger("info", `Server running on http://localhost:${PORT}`);
    });
});
