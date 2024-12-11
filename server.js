const express = require("express");
const { MongoClient, ObjectId } = require("mongodb"); // Use ObjectId for MongoDB ID
const cors = require("cors");
var path = require("path"); 
var fs = require("fs"); 

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware for JSON parsing, CORS setup, and logging
app.use(express.json()); // Parses incoming JSON requests
app.use(cors()); // Enable Cross-Origin Resource Sharing (CORS)

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
        console.log("Connected to MongoDB");
        db = client.db("CWCST3144M00915320coursework"); // Use the correct database name
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
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
        res.json(results);
    } catch (err) {
        next(err);
    }
});

// Fetch a specific document by ID from a collection
app.get("/collection/:collectionName/:id", async (req, res, next) => {
    try {
        const id = new ObjectId(req.params.id); // Convert string ID to MongoDB ObjectId
        const result = await req.collection.findOne({ _id: id });
        if (!result) return res.status(404).json({ error: "Document not found" });
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// Add a new document to a specified collection
app.post('/collection/:collectionName', async (req, res, next) => {
    try {
        const documents = req.body; // Expect an array of objects
        if (!Array.isArray(documents)) {
            return res.status(400).json({ error: "Request body should be an array of objects." });
        }
        const result = await req.collection.insertMany(documents);
        res.status(201).json(result.ops); // Return the inserted documents
    } catch (err) {
        next(err);
    }
});



// Add a new document to a collection
// app.post("/collection/order", async (req, res, next) => {
//     try {
//         const document = req.body; // Get data from the request body
//         const result = await req.collection.insertOne(document);
//         res.status(201).json(result.ops[0]);
//     } catch (err) {
//         next(err);
//     }
// });

// Retrieve a document by ID from a specified collection
const ObjectID = require('mongodb').ObjectID; 
app.get('/collection/:collectionName/:id', (req, res, next) => { 
    req.collection.findOne({ _id: new ObjectID(req.params.id) }, (e, result) => { 
        if (e) return next(e); 
        res.send(result); 
    }); 
    });

// Update a specific document by ID in a collection
app.put("/collection/:collectionName/:id", async (req, res, next) => {
    try {
        const id = new ObjectId(req.params.id);
        const updates = req.body;

        // Validate that the body is an object
        if (Array.isArray(updates)) {
            return res.status(400).json({ error: "Request body should be a single object, not an array." });
        }
        
        const result = await req.collection.updateOne(
            { _id: id },
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Document not found" });
        }
        res.json({ msg: "Document updated successfully" });
    } catch (err) {
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
    res.status(404); // Set status to 404
    res.send("File not found!"); 
    });

// Start the server
connectToDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
