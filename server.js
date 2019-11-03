var express = require('express');
var cors = require('cors');
var dotenv = require('dotenv');
dotenv.config();

// bring in the models
var db = require('./models');

//initialize express
var app = express();

//address cors
app.use(cors());

//setup for stripe and other for other req parsing
app.use(require('body-parser').text());

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//direct to routes
var routes = require('./routes');
app.use(routes);

var server = null;
// listen on port 3001
var PORT = process.env.PORT || 3001;
if (!process.env.APPLICATION_NAME) {
	db.sequelize.sync().then(function() {
		// Plaid.getTransactions()
		// Checkout();
		server = app.listen(PORT, function() {
			console.log('App now listening on port:', PORT);
		});
	});
}
