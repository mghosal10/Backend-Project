# Backend-Project
1. Parsing Top 10 Holdings, Country Weights and Sector Weights, ETF name and fund description information for all requested SPDR ETFs from the website https://www.ssga.com/us/en/individual/etfs/fund-finder? and store them in a database. The information is updated daily.
2. Created an API using an authentication method OAuth0 using JWT. The endpoints includes:
    a. Login authentication for API access
    b. List of available ETF symbol
    c. Get data for ETF by ticker

# Getting Started

A. Setting up the database  

I have used MySql database for saving the etf data in the backend.
Install mySql database and execute the below DDL query -
    1. create table etfdata(ticker varchar(50) not null primary key, etfname varchar(255), description varchar(5000), date timestamp not null);
    2. create table etfholdings (holdkey varchar(700) primary key, ticker varchar(50) not null, holdingsname varchar(500), holdweight float, date timestamp not null);
    3. create table sectors (sectorkey varchar(700) primary key, ticker varchar(50) not null, sectorname varchar(255), sectorweight float, date timestamp not null);
    4. create table geography(geokey varchar(700) primary key, ticker varchar(50) not null, country varchar(255), geoweight float, date timestamp not null);


B. Running the REST API through Postman    
1. Run the file api.js through the terminal by executing the command "node api.js" (Be sure to be in the directory where you have the api.js located)
2. Go to Postman -  
Step 1 - Select request method as "POST" and url as "http://localhost:3001/api/login". After you do a "Send" we would receive a token which remains active only for 60seconds. After 60seconds the token will expire and we will have to generate a new token.  
Step 2 - In another window, select request method as "GET" and url as "http://localhost:3001/api/etfsymbols". Go to the "Headers" tab and add the "Key" as "Authorization" and "value" as "Bearer <Token>". If the value returned is "Forbidden", it means your token has expired and you need to replace the expired token with another active token. This would return the list of existing etf symbols in the database.   
Step 3 - In another window, select request method as "GET" and url as "http://localhost:3001/api/etfdata". Go to the "Headers" tab and add the "Key" as "Authorization" and "value" as "Bearer <Token>". If the value returned is "Forbidden", it means your token has expired and you need to replace the expired token with another active token. This endpoint would return the list of etfs and their assosciated data.

**Please Note: This webservice needs to be deployed on a server to be accessed remotely. Currently this code is configured to be executed on localhost, hence without setting up the database and starting the localhost server the code will not run. **   

# Postman API Documentation
https://documenter.getpostman.com/view/421412/SWT8hzVi?version=latest

# Resources
https://www.youtube.com/watch?v=LoziivfAAjE .    
https://www.sitepoint.com/using-node-mysql-javascript-client/     
https://auth0.com/blog/node-js-and-express-tutorial-building-and-securing-restful-apis/
