const mongoose = require('mongoose');
const mongo_url = process.env.MONGODB_URL

mongoose.connect(mongo_url)
    .then(() => {
        console.log("DataBase connected.........");
    }).catch((err) => {
        console.log("MongoDb Conaction error", err.message);
    })  