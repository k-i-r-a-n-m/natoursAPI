const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = async id => {
  return await jwt.sign({ id: id }, process.env.JWT_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};
const createSendToken = async (user, status, res) => {
  const token = await signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  // console.log(cookieOptions);

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  user.password = undefined;

  res.cookie('jwt', token, cookieOptions);
  res.status(status).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};
exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  // JWT TOKEN GENERATION
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1.CHECK IF EMAIL AND PASSWORD EXIST?
  if (!email || !password) {
    return next(new AppError('please provide email and password!', 400));
  }

  // 2.CHECK IF USER EXISTS && PASSWORD IS CORRECT?
  const user = await User.findOne({ email: email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect  email or password!', 401));
  }
  // 3.IF EVERYTHING OK, SEND TOKEN TO CLIENT
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1.Getting token and check of it's there
  // console.log(req.headers);
  let token;
  if (req.headers.authorization && req.headers.authorization.split(' ')[1]) {
    token = req.headers.authorization.split(' ')[1];
    // console.log(token);
  }

  if (!token) {
    return next(new AppError('please login to access the resource!', 401));
  }
  // 2.verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_KEY);
  // console.log(decoded);

  // 3.check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(`The user belongign to this token does no loger exist`, 401)
    );
  }
  // 4.check if user changed password afer the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! please log in again', 401)
    );
  }

  //GRANT ACCESS TO THE USER
  req.user = currentUser;
  next();
});

exports.restrict = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perfom this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1.Get user based on POSTED EMAIL ID
  const user = await User.findOne({ email: req.body.email });
  // console.log(user);
  if (!user) return next(new AppError('No user exist in that email id!', 404));

  // 2.Generate the random RESET TOKEN
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3.Send EMAIL to user with the RESET TOKEN
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to:
  ${resetURL}.\nIf you din't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'your password reset token(valid for 10 min)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.createPasswordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });
    // return next(
    //   new AppError(`There was an error sending email,Try later!`, 500)
    // );
    return next(err);
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1.Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2.if token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Either token expired or invalid token!', 404));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;

  // 3.update changePasswordAt property for the user
  await user.save(); //pre('save') HOOK is defined

  // 4.log the user in , send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1.Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2.check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError(`Incorrect password!`, 401));
  }
  // 3.if so, UPDATE password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4.LOG user in, send JWT
  createSendToken(user, 200, res);
});
