// required imports
const request = require('request');
const cheerio = require('cheerio');
let mysql = require('mysql');

// declarations
const HOME_URL = 'https://www.ssga.com/bin/v1/ssmp/fund/fundfinder?country=us&language=en&role=individual&product=etfs&ui=fund-finder';

let etfArr = [];
let holdingsArr = [];
let sectorArr = [];
let geoArr = [];
let arrHoldData = [];
let arrSectorData = [];
let arrCountries = [];

//sql queries
let etfSql = "replace into etfdata (ticker, etfname, description) values ?";
let holdingsSql = "replace into etfholdings (holdkey, ticker, holdingsname, weight) values ?";
let sectorsSql = "replace into sectors (sectorkey, ticker, sectorname, weight) values ?";
let countriesSql = "replace into geography (geokey, ticker, country, weight) values ?";


//getting json data from the home page url
request(HOME_URL, { json: true }, (error, response, body) => {

	if(!error && response.statusCode === 200)
	{
		const fundDetails = body.data.us.funds.etfs.overview.datas;
		for(let i=0; i<fundDetails.length ;i++)
		{
			const fundTicker = fundDetails[i].fundTicker;
			const fundName = fundDetails[i].fundName;
			const fundUrl = "https://www.ssga.com"+fundDetails[i].fundUri; 

			// sending a request to next level URL to get other details of the etfs
			request(fundUrl, (detail_error, detail_response, html) => {
				if(!detail_error && detail_response.statusCode === 200)
				{
					// send html response to cheerio to create DOM
					const $ = cheerio.load(html);

					//create etf data array
					let fundDescription = getDescription($);
					const fundsArr = [fundTicker, fundName, fundDescription];
					etfArr.push(fundsArr);
					
					//create holdings array
				    arrHoldData = getHoldings($, fundTicker)
				    if (arrHoldData.length !== 0 || arrHoldData !== undefined) {
				    	for (let i=0; i<=arrHoldData.length; i++) {
				    		if (arrHoldData[i] !== undefined) {
				    			holdingsArr.push(arrHoldData[i]);
				    		}
				    	}
				    } 
			
					//create sectors array
					arrSectorData = getSectorDetails($, fundTicker);
					if(arrSectorData.length !== 0 || arrSectorData !== undefined)
					{
						for (let i=0; i<=arrSectorData.length; i++) {
				    		if (arrSectorData[i] !== undefined) {
				    			sectorArr.push(arrSectorData[i]);
				    		}
				    	}
					}

					arrCountries = getCountryDetails($, fundTicker);
					if(arrCountries !== undefined)
					{
						for (let i=0; i<=arrCountries.length; i++) {
				    		if (arrCountries[i] !== undefined) {
				    			geoArr.push(arrCountries[i]);
				    		}
				    	}
					}
					
				  	// insert data into the etfdata table
					if (i === fundDetails.length - 1 && etfArr.length > 0) {
						addToTable(etfArr, etfSql);
					}
						
					// insert holding data into the holding data table
					if (i === fundDetails.length - 1 && holdingsArr.length > 0) {
						addToTable(holdingsArr, holdingsSql);
					}
					
					// insert sector data into the sector table
					if (i === fundDetails.length - 1 && sectorArr.length > 0) {
						addToTable(sectorArr, sectorsSql);
					}

					// insert sector data into the geography table
					if (i === fundDetails.length - 1 && geoArr.length > 0) {
						addToTable(geoArr, countriesSql);
					}					
				}
			});
			// end of inner request			
		}	
	}
});
// end of outer request



function getCountryDetails($, fundTicker)
{
	let countryArr = []; 
	let getGeoId = $('#fund-geographical-breakdown').val();
	
	if(getGeoId!==undefined)
	{
		let json = JSON.parse(getGeoId);
		let jsonVals = json.attrArray;
		for(let i=0; i<jsonVals.length; i++)
		{
			let countries = [];
			let countryname = jsonVals[i].name.value;
			let countryweight = jsonVals[i].weight.value.split('%');
			let geoKey = fundTicker+","+countryname;
			countries.push(geoKey);
			countries.push(fundTicker);
			countries.push(countryname);
			countries.push(countryweight[0]);
			countryArr.push(countries);
		}

		countryArr.sort((a,b) => b[2] - a[2]);
		let top10Countries = countryArr.slice(0,10);
	
		return top10Countries;
	}
}

// retrieve sector details
function getSectorDetails($, fundTicker)
{
	let sectorArr = [];
	let sectors = [];
	let weightArr = [];

	$('.fund-sector-breakdown .data-table td.label').map(function(index, element){	
		let sector = $(element).text();
		sectors.push(sector);
	});

	$('.fund-sector-breakdown  .data-table td.data').map(function(index, element){	
		let weight = $(element).text();
		weightArr.push(weight);
	});

	for(let i=0; i<sectors.length; i++)
	{
		let sectorObj = [];
		let weight = weightArr[i].split('%');
		let sectorKey = fundTicker+","+sectors[i];
		sectorObj.push(sectorKey);
		sectorObj.push(fundTicker);
		sectorObj.push(sectors[i]);
		sectorObj.push(weight[0]);
		sectorArr.push(sectorObj);
	}

	// sort array and pick up top 10 records
	sectorArr.sort((a,b) => b[3] - a[3]);
	let top10Sectors = sectorArr.slice(0,10);
	
	return top10Sectors;
}

// retrieve holdings details
function getHoldings($, fundTicker)
{
	let labelArr = [];
	let weightArr = [];
	let holdsArr = [];

	//create an array of holding names
	$('.fund-top-holdings td.label').map(function(index, element){	
		let label = $(element).text();
		labelArr.push(label);
	});

	//create an array of weights
	$('.fund-top-holdings td.weight').map(function(index, element){	
		let weight = $(element).text();
		weightArr.push(weight);
	});

	// creating a holdingObj that has fund ticker, name, holding name and holding weight values. Then insert each object into an array
	for(let i=0; i<labelArr.length; i++)
	{
		let holdingObj = [];
		let weight = weightArr[i].split('%');
		let holdingKey = fundTicker+","+labelArr[i];
		holdingObj.push(holdingKey);
		holdingObj.push(fundTicker);
		holdingObj.push(labelArr[i]);
		holdingObj.push(weight[0]);
		holdsArr.push(holdingObj);
	}

	// sort array and pick up top 10 records
	holdsArr.sort((a,b) => b[3] - a[3]);
	let top10Holdings = holdsArr.slice(0,10);
	
	// returning an array that has holding data for every fund ticker
	return top10Holdings;
}


// retrieve fund description
function getDescription($)
{
	let paraArr = [];

	$('.content').map(function(index, element){	
		const text = $(element).find('p').text();
		paraArr.push(text);
	});
	fundDescription = paraArr[3]; 
	return fundDescription;
}


function addToTable(arr, sql) {
	//creating a connection to mysql database
	var con = mysql.createConnection({
	  host: "127.0.0.1",//"localhost",
	  user: "root",
	  password: "admin12345",
	  database: "etf"
	});

	con.connect(function(err) {
		if (err) throw err;
		console.log("SQL Connected!");

		//inserting data into tables
		con.query(sql,[arr],function(err, result) 
		{
			if(err) throw err;
			console.log("Query Executed");
		});
	});
}





