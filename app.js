require('dotenv/config');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

// require routes
const indexRoute = require('./routes/index');
const contactRoute = require('./routes/contact');

// middleware 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.use(indexRoute);
app.use(contactRoute);

app.get('*', (req, res) => {
	res.redirect('/');
});

app.listen(port, () => {
	console.log(`listening on port: ${port}`);
});