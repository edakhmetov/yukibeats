const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const connection = mongoose.connection;

router.get('/', (req, res) => {
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            connection.db.collection("audios", function (err, collection) {
                collection.find({}).toArray(function (err, audios) {
                    res.render('index', { audios })
                })
            });
        })
        .catch(err => console.log(err));
});

module.exports = router;