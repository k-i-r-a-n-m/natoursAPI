const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `invalid ${err.path}:${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateKeyErrorDB = err => {
  const message = `duplicate value for '${Object.keys(err.keyValue)} :  ${
    err.keyValue.name
  }' `;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const message = Object.keys(err.errors)
    .map(field => `${field}:${err.errors[field].message}`)
    .join('.  ');

  //   message = `invalid ${err.path}:${err.value}`;
  return new AppError(message, 400);
};

const handleJWTExpiredError = err =>
  new AppError('your token has EXPIRED please log in again', 401);

const handleJWTError = err => new AppError(`Your token is invalid!`, 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  //operational, trusted error: send message to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
    //  programming or other unknown error
    // don't leak error details to client in production environment
  } else {
    console.log('ERROR 😫\n', err);

    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
      error: err
    });
  }
};

module.exports = (err, req, res, next) => {
  console.error(process.env.NODE_ENV);
  console.log('inside error')
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    //   DEEP CLON OF AN OBJECT
    let error = JSON.parse(JSON.stringify(err));
    // console.log(error);
    if (error.name === 'CastError') error = handleCastErrorDB(error);

    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    if (error.name === 'TokenExpiredError')
      error = handleJWTExpiredError(error);

    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.code === 11000) error = handleDuplicateKeyErrorDB(error);

    sendErrorProd(error, res);
  }
};
