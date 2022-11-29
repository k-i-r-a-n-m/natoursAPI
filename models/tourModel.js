const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel')
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      minLength: [5, 'minimum 5 characters'],
      maxLength: [50, 'maximum 10 characters']
    },

    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },

    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a grouop size']
    },

    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'difficulty must be either easy|medium|difficult'
      }
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating must be above 1.0'],
      max: [5, 'rating must be below 5.0']
    },

    ratingsQuantity: {
      type: Number,
      default: 0
    },

    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },

    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          return val < this.price;
        },
        message: 'discount{VALUE} must be lower than actual price'
      }
    },

    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must hvae description']
    },

    description: {
      type: String,
      trim: true
    },

    imageCover: {
      type: String,
      required: [true, 'A tour must have cover image']
    },

    images: [String],

    createdAt: {
      type: Date,
      default: Date.now()
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJson
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides:Array
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// DOCUMENT MIDDLEWARE

tourSchema.pre('save', function () {
  this.name = slugify(this.name, { lower: true })
  
})

// embedding the guides document into the tours document
tourSchema.pre('save', async function (next) {
  const guidesPromsies = this.guides.map(async id => await User.findById(id))
  this.guides = await Promise.all(guidesPromsies)
  next()
})
// tourSchema.post('save', function () {
//   console.log("doc..has been saved")

// })

// tourSchema.pre('save', function() {
//   console.log('doc');
// });

// QUERY MIDDLEWARE

tourSchema.pre(/^find/, function() {
  this.find({ secretTour: {$ne:true} });
  this.start = Date.now()
});

tourSchema.post(/^find/, function() {
  console.log(`query takes ${ Date.now() - this.start } sec`)

});

// Aggregate MIDDLEWARE

tourSchema.pre('aggregate', function() {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
});
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
