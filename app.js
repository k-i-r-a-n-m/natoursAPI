const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();
//  GLOBAL MIDDLEWARES

// 1.Sets security Headers 
app.use(helmet());


//2.Development request logging 
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  windowMs: 1 * 60 * 6 * 1000,
  max: 3,
  message: 'Too many request from the ip address'
});

// 3.Limit the no.of request from same ip address
app.use('/api', limiter);

// 4.body parser...read  body into req.body
app.use(express.json({ limit: '10kb' }));

// 5.Data sanitization againt NOSQL query injection
app.use(mongoSanitize())

// 6.Data sanitization againt XSS
app.use(xss())

///////////////////////////////////////////////////////////////////////////////
// Servers the static webpage
app.use(express.static(`${__dirname}/public`));

// app.use((req, res, next) => {
//   console.log('Hello from the middleware 👋');
//   next();
// });

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

///////////////////////////////////////////////////////////////////////////////
// ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//UNHANDLED ROUTES..
app.all('*', (req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl} on the server`, 404));
});

////////////////////////////////////////////////////////////////////////////////
// EXPRESS GLOBAL ERROR HANDLING MIDDLEWARE
// ACCEPTS 4 AGRUMENTS
app.use(globalErrorHandler);
module.exports = app;
