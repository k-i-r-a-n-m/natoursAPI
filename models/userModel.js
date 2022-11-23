const crypto = require('crypto');

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { nextTick } = require('process');

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'admin', 'guide', 'lead-guide'],
    default: 'user'
  },
  name: {
    type: String,
    required: [true, 'A user must have name!']
  },
  email: {
    type: String,
    required: [true, "Email can't be emply"],
    validate: [validator.isEmail, 'please provide a valid email'],
    unique: true
  },
  photo: String,
  password: {
    type: String,
    required: [true, "Password can't be emply"],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, "Confirmation of password can't be empty"],
    validate: {
      validator: function(val) {
        return val === this.password;
      },
      message: 're-confirm the password'
    }
  },
  active: {
    type: String,
    defalut: true,
    select: false
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
});

// MIDDLEWARE HOOKES----------------------------------------
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
});

userSchema.pre('save', function() {
  if (!this.isModified('password') || this.isNew) return;
  this.passwordChangedAt = Date.now() - 1000;
  //saving to database is sometime SLOWER so jwtExpires < passwordChangedAt
  //so we delay the passwordChangedAt by 1000ms
});


userSchema.pre(/^find/, function() {
  this.find({ active: { $ne: false } });
  // next()
});

//INSTANCE METHODS----------------------------------------------

//NOTE: since the select:false --> passwrod 'this.password' keyword is not possible
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000);
    // console.log(JWTTimestamp, changedTimestamp);
    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = new mongoose.model('User', userSchema);
