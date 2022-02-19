const mysql = require('mysql2')
require('dotenv').config()
module.exports = mysql.createConnection({
    host: process.env.hostName_db,
    user: process.env.userName_db,
    password: process.env.password_db,
    database: process.env.db
})