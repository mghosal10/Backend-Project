/***
This is an API to retrieve ETF data from the website "https://www.ssga.com/us/en/individual/etfs/fund-finder?"
***/

// importing the dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');


const app = express();	// define the express app library
app.use(helmet());	// adding Helmet to enhance your API's security
app.use(bodyParser.json());		// using bodyParser to parse JSON bodies into JS objects
app.use(cors()); 	// enabling CORS for all requests
app.use(morgan('combined')); // adding morgan to log HTTP requests


// starting the server
app.listen(3001, () => {
  console.log('listening on port 3001');
});


// create a connection to the mysql server
let connection = mysql.createConnection({
	  host: "localhost",
	  user: "root",
	  password: "admin12345",
	  database: "etf"
});

connection.connect(function(err) {
	if (err) throw err;
	console.log("SQL Connected!");
});


// login to generate API authentication key
app.post('/api/login', (req, res) => {
	
	// creating a dummy user
	const user = {
		id : 1,
		username: "user1",
		email: "user1@gmail.com"
	}

	// sign-in to obtain a token which expires in 60seconds
	jwt.sign({user: user}, 'secretkey', {expiresIn: '60s'}, (err, token) => {
		res.json({
			token : token
		});
	});
});


// get list of all etf symbols after token verification
app.get('/api/etfsymbols', verifyToken, (req, res) => {
	jwt.verify(req.token, 'secretkey', (err, authData) => {
		if(err)
		{
			res.sendStatus(403);
		}
		else
		{
			// sql query to fetch ticker data from the database
			connection.query('select ticker from etfdata', function (error, results, fields) {
				if (error) throw error;
				res.json(results);
			});
		}
	});
});



// get list of all etf data after token verification
app.get('/api/etfdata', verifyToken, (req, res) => {
	jwt.verify(req.token, 'secretkey', (err, authData) => {
		if(err)
		{
			res.sendStatus(403);
		}
		else
		{
			// sql query to fetch ticker data from the database
			connection.query('select etf.ticker, etf.etfname, etf.description, hold.holdingsname, hold.weight, sec.sectorname, sec.weight, geo.country, geo.weight from etfdata etf, etfholdings hold, sectors sec, geography geo where etf.ticker = hold.ticker and etf.ticker = sec.ticker and etf.ticker = geo.ticker;', function (error, results, fields) {
				if (error) throw error;
				res.json(results);
			});
		}
	});
});


// token verification
function verifyToken(req, res, next)
{
	const bearerHeader = req.headers['authorization'];		// get auth header value
	if(typeof bearerHeader !== 'undefined')			
	{
		const bearer = bearerHeader.split(' ');
		const bearerToken = bearer[1];		// get token from the array
		req.token = bearerToken;		// set the token
		next();			// next middleware
	}
	else
	{
		res.sendStatus(403);
	}
}




