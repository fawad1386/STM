const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, 'backend/.env') });
const { analyzeSentiment } = require('./backend/lib/sentiment');

// Schemas
const reviewSchema = new mongoose.Schema({
  dealershipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealership', required: true },
  dealershipName: String,
  reviewText: { type: String, required: true },
  predictedSentiment: Number,
  predictedLabel: Number,
  userSubmitted: { type: Boolean, default: false },
  userName: String,
  userEmail: String,
  createdAt: { type: Date, default: Date.now }
});

const dealershipSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: String,
  overallTrustScore: { type: Number, default: 0.5 },
  totalReviews: { type: Number, default: 0 },
  positiveCount: { type: Number, default: 0 },
  negativeCount: { type: Number, default: 0 },
  aspects: {
    pricing: { score: Number, mentions: Number, positivePct: Number },
    service_quality: { score: Number, mentions: Number, positivePct: Number },
    parts_availability: { score: Number, mentions: Number, positivePct: Number },
    time_efficiency: { score: Number, mentions: Number, positivePct: Number },
    repair_quality: { score: Number, mentions: Number, positivePct: Number },
    cleanliness: { score: Number, mentions: Number, positivePct: Number },
    expertise: { score: Number, mentions: Number, positivePct: Number },
    communication: { score: Number, mentions: Number, positivePct: Number }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', reviewSchema);
const Dealership = mongoose.model('Dealership', dealershipSchema);

async function fixReview() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_trust_meter';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the review that needs fixing
    const reviewId = '68e55a7cfce920176ff4b52b';
    const review = await Review.findById(reviewId);
    
    if (!review) {
      console.log('Review not found');
      return;
    }

    console.log('Original review:', review.reviewText);
    console.log('Original sentiment:', review.predictedSentiment, 'label:', review.predictedLabel);

    // Re-analyze sentiment
    const sentimentAnalysis = await analyzeSentiment(review.reviewText);
    console.log('New sentiment analysis:', sentimentAnalysis);

    // Update the review
    review.predictedSentiment = sentimentAnalysis.sentiment;
    review.predictedLabel = sentimentAnalysis.label;
    await review.save();

    // Update dealership stats
    const dealership = await Dealership.findById(review.dealershipId);
    if (dealership) {
      // Recalculate counts
      const allReviews = await Review.find({ dealershipId: review.dealershipId });
      let positiveCount = 0;
      let negativeCount = 0;
      
      allReviews.forEach(r => {
        if (r.predictedLabel === 1) positiveCount++;
        else negativeCount++;
      });

      dealership.positiveCount = positiveCount;
      dealership.negativeCount = negativeCount;
      dealership.totalReviews = allReviews.length;
      dealership.overallTrustScore = dealership.totalReviews > 0 ? dealership.positiveCount / dealership.totalReviews : 0.5;
      
      await dealership.save();
      
      console.log('Updated dealership stats:');
      console.log(`Total Reviews: ${dealership.totalReviews}`);
      console.log(`Positive: ${dealership.positiveCount}, Negative: ${dealership.negativeCount}`);
      console.log(`Trust Score: ${(dealership.overallTrustScore * 100).toFixed(1)}%`);
    }

    console.log('Review fixed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixReview();
