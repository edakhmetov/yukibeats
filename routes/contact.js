const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const mailGun = require('nodemailer-mailgun-transport');

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

router.get('/contact', (req, res) => {
	res.render('contact');
});

router.post('/contact/submit', (req, res) => {
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

module.exports = router;