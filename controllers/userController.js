const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');

const filterObj = (obj, ...allowedFields) => {
  
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if(allowedFields.includes(el)) newObj[el]=obj[el]
  })
  return newObj
}

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  if (!users) {
    return next(new AppError('No users found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: users
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1.check is the POSTed data consist of password || passwordConfirm
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        'This route does not update PASSWORD, try /updatePassword',
        400
      )
    );
 
  // 2.UPDATE the user data
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filterObj(req.body,'name','email'), {
    new: true,
    runValidators: true
  });

  // 3.send the response 
  res.status('200').json({
    status: 'success',
    data: {
      updatedUser
    }
  })
});


exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false }) 
  
  res.status(204).json({
    status: 'success',
    data:'data deleted successfully'
  })
})