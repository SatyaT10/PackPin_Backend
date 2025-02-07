require('dotenv').config();
require('./db.config');
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const cors = require('cors');
const morgan = require('morgan');
const PORT = process.env.PORT || 5050;
const path = require('path');

app.use('/Images', express.static(path.join(__dirname, 'Images')));

const errorHandler = require("./error/errorHandlers");
const CustomError = require("./error/CustomError");

const Admin = require('./Routers/adminRoute');

const User = require('./Routers/userRoute');


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use(morgan('dev'));

app.use('/admin', Admin)

app.use('/users', User)

app.all('*', (req, res) => {
    throw new CustomError(`Can't find ${req.originalUrl} on this server!`, 404);
});

app.use(errorHandler);
http.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});