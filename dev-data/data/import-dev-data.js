const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fs = require('fs');

const Tour = require('./../../models/tourModel');

dotenv.config({ path: './config.env' });



mongoose
  .connect(process.env.DATABASE  )
  .then(con => {
    console.log('connected to mongodb 😍');
  });

// For simple data model
// const tours = JSON.parse(fs.readFileSync('./tours-simple.json'))

// For advanced data model
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`));

//IMPORT ALL DATA into DB

const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data LOADED');
  } catch (error) {
    console.error(error);
  }
  process.exit();
};

//DELETE ALL DATA from DB

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data DELETED');
  } catch (error) {
    console.error(error);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
