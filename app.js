require('dotenv/config');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mailGun = require('nodemailer-mailgun-transport');

const app = express();
const port = 5000;

// middleware 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

const connection = mongoose.connection;

const auth = {
	 auth: {
		 api_key: process.env.API_KEY,
		 domain: process.env.DOMAIN
	 }
};

const transporter = nodemailer.createTransport(mailGun(auth));

const sendMail = (email, subject, message, cb) => {
	const mailOptions = {
		from: email,
		to: 'dodong16@gmail.com',
		subject: subject,
		text: message
	};

	transporter.sendMail(mailOptions, function(err, data) {
		if (err) {
			cb(err, null);
		} else {
			cb(null, data)
		}
	});
};



app.get('/', (req, res) => {
 mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => {
		connection.db.collection("audios", function(err, collection){
     	   collection.find({}).toArray(function(err, audios){
			   res.render('index', {audios})
    	    })
    	});
		// console.log('connected to mongodb');
	})
	.catch(err => console.log(err));
});

app.get('/contact', (req, res) => {
	res.render('contact');
});

app.post('/contact/submit', (req, res) => {
	const {email, subject, message} = req.body;
	sendMail(email, subject, message, function(err, data){
		if(err){
			console.log(err);
			res.status(500).json({message: 'Internal error'});
		} else {
			res.redirect('/')
		}
	})
});

app.get('*', (req, res) => {
	res.redirect('/');
});


app.listen(port, () => {
    console.log(`listening on port: ${port}`);
});