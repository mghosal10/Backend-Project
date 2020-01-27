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
const cron = require('node-cron');
const d3 = require('d3');
let shell = require("shelljs");


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
	  host: "127.0.0.1",
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
			connection.query('select etf.ticker, etf.etfname, etf.description, hold.holdingsname, hold.holdweight, sec.sectorname, sec.sectorweight , geo.country, geo.geoweight from etfdata etf left join etfholdings hold on etf.ticker = hold.ticker left join sectors sec on etf.ticker = sec.ticker left join geography geo on etf.ticker = geo.ticker', function (error, results, fields) {
				if (error) throw error;
				
				// create lookup to get etf name and desc
				let tickerLookup = {};
				d3.nest()
					.key(d => d.ticker)
					.entries(results)
					.forEach(d => {
						tickerLookup[d.key] = {
							ticker: d.key,
							etfname: d.values[0].etfname,
							description: d.values[0].description
						}
					});

				// lookup to get sector object (name and weight) by ticker
				let sectorLookup = {};
				d3.nest()
					.key(d => d.ticker)
					.key(d => d.sectorname)
					.entries(results)
					.forEach(d => {
						sectorLookup[d.key] = d.values.map(e => {
								return {
									"name": e.key,
									"weight": e.values[0].sectorweight	
								}
							})
					});

				// lookup to get country object (name and weight) by ticker
				let countryLookup = {};
				d3.nest()
					.key(d => d.ticker)
					.key(d => d.country)
					.entries(results)
					.forEach(d => {
						countryLookup[d.key] = d.values.map(e => {
								return {
									"name": e.key,
									"weight": e.values[0].geoweight	
								}
							})
					});

				// construct final return object (ticker, etfname, desc, holding, sector, country)
				const nestedData = d3.nest()
				.key(d => d.ticker)
				.key(d => d.holdingsname)
				.entries(results)
				.map(d => {
					let obj = {};
					obj['ticker'] = d.key
					obj['etfname'] = tickerLookup[d.key]['etfname']
					obj['description'] = tickerLookup[d.key]['description']
					obj['holdings'] = d.values.map(e => {
						return {
							"name": e.key,
							"weight": e.values[0].holdweight	
						}
					})
					obj['sector'] = sectorLookup[d.key]
					obj['country'] = countryLookup[d.key]
					return obj;
				})
				
				res.json(nestedData);
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

//running the data.js file everyday at 12am
cron.schedule('0 0 * * *', function(){
	let date = Date.now();
	if(shell.exec("node data.js").code !== 0){}
	console.log("running cron job on " +date);
});


