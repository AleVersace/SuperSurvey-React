"use strict" ;

// Import sqlite3
const sqlite = require('sqlite3');

// Open DB
const db = new sqlite.Database('database.db', (err) => {
    if (err)
        throw (err);
    else
        console.log("DB successfully opened.");
});

module.exports = db;