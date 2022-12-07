const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No such document found with that ID', 404));
    }

    console.log(doc);
    res.status(204).json({
      status: 'success',
      data: null
    });
  });
