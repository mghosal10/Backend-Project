# Backend-Project

1. Parsing Top 10 Holdings, Country Weights and Sector Weights, ETF name and fund description information for all requested SPDR ETFs from the website https://www.ssga.com/us/en/individual/etfs/fund-finder? and store them in a database. The information is updated daily.

2. Created an API using an authentication method OAuth0 using JWT. The endpoints includes:
a. Login authentication for API access
b. List of available ETF symbol
c. Get data for ETF by ticker

# Getting Started

1. Setting up the database
I have used MySql database for saving the etf data in the backend.

Install mySql database and execute the below DDL query -
1. create table etfdata(ticker varchar(50) not null primary key, etfname varchar(255), description varchar(5000));
2. create table etfholdings (holdkey varchar(700) primary key, ticker varchar(50) not null, holdingsname varchar(500), holdweight float);
3. create table sectors (sectorkey varchar(700) primary key, ticker varchar(50) not null, sectorname varchar(255), sectorweight float);
4. create table geography(geokey varchar(700) primary key, ticker varchar(50) not null, country varchar(255), geoweight float);

# Resources
https://www.youtube.com/watch?v=LoziivfAAjE
https://www.sitepoint.com/using-node-mysql-javascript-client/
https://auth0.com/blog/node-js-and-express-tutorial-building-and-securing-restful-apis/
