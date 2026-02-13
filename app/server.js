const express = require('express');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const app = express();

// 1. Middleware: Crucial for reading the data sent from your Edit Profile form
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Database Configuration
// Use 'localhost' because the Node server is running on the host, talking to the Docker container
let mongoUrl = "mongodb://admin:password@localhost:27017/my-db?authSource=admin";
let mongoClientOptions = { useNewUrlParser: true, useUnifiedTopology: true };
let databaseName = "my-db";

// 3. Serve the frontend files
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
});

// 4. GET Profile Route
app.get('/get-profile', function (req, res) {
    MongoClient.connect(mongoUrl, mongoClientOptions, function (err, client) {
        if (err) {
            console.error("Connection Error:", err);
            return res.status(500).send(err);
        }

        let db = client.db(databaseName);
        let myquery = { userid: 1 };

        db.collection("users").findOne(myquery, function (err, result) {
            if (err) {
                console.error("Find Error:", err);
                client.close();
                return res.status(500).send(err);
            }

            client.close();
            // If result is null, send default values so UI doesn't break
            res.send(result ? result : { userid: 1, name: "Anna Smith", email: "anna.smith@example.com", interests: "coding" });
        });
    });
});

// 5. POST Update Profile Route
app.post('/update-profile', function (req, res) {
    let userObj = req.body; // Populated by express.json() middleware

    MongoClient.connect(mongoUrl, mongoClientOptions, function (err, client) {
        if (err) {
            console.error("DB Connection Error:", err);
            return res.status(500).send("Database connection failed");
        }

        let db = client.db(databaseName);
        userObj['userid'] = 1;
        let myquery = { userid: 1 };
        let newvalues = { $set: userObj };

        // Perform the update with upsert: true to create the user if they don't exist
        db.collection("users").updateOne(myquery, newvalues, { upsert: true }, function (err, result) {
            if (err) {
                console.error("Update Error:", err);
                client.close();
                return res.status(500).send("Update failed");
            }

            console.log("Successfully updated user 1");
            client.close();
            res.send(userObj); 
        });
    });
});

// 6. Start the Server
app.listen(3000, function () {
    console.log("App listening on port 3000!");
});
