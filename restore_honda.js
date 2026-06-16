const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
require('dotenv').config();

// Simple sentiment analysis function (same as in server.js)
function analyzeSentiment(text) {
  const positiveWords = [
    'excellent', 'amazing', 'great', 'good', 'wonderful', 'fantastic', 'outstanding',
    'perfect', 'love', 'best', 'awesome', 'brilliant', 'superb', 'exceptional',
    'satisfied', 'happy', 'pleased', 'impressed', 'recommend', 'helpful', 'friendly',
    'professional', 'quick', 'fast', 'efficient', 'clean', 'modern', 'reliable',
    'honest', 'fair', 'reasonable', 'affordable', 'quality', 'service', 'experience'
  ];
  
  const negativeWords = [
    'terrible', 'awful', 'bad', 'horrible', 'worst', 'hate', 'disappointed', 'angry',
    'frustrated', 'slow', 'rude', 'unprofessional', 'dirty', 'expensive', 'overpriced',
    'cheat', 'scam', 'fraud', 'liar', 'dishonest', 'unfair', 'poor', 'broken',
    'damaged', 'defective', 'useless', 'waste', 'regret', 'avoid', 'never', 'worst'
  ];
  
  const textLower = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;
  
  // Count positive words
  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = textLower.match(regex);
    if (matches) positiveScore += matches.length;
  });
  
  // Count negative words
  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = textLower.match(regex);
    if (matches) negativeScore += matches.length;
  });
  
  // Calculate sentiment score (0-1, where 0.5+ is positive)
  const totalWords = positiveScore + negativeScore;
  if (totalWords === 0) return { sentiment: 0.5, label: 0 }; // Neutral
  
  const sentiment = positiveScore / totalWords;
  const label = sentiment > 0.5 ? 1 : 0; // 1 = positive, 0 = negative
  
  return { sentiment, label };
}

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

async function restoreHondaRingRoad() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_trust_meter';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find HONDA RingRoad dealership
    const dealership = await Dealership.findOne({ name: /HONDA RingRoad/i });
    if (!dealership) {
      console.log('HONDA RingRoad dealership not found');
      return;
    }

    console.log('Found dealership:', dealership.name);
    console.log('Current stats:', {
      totalReviews: dealership.totalReviews,
      positiveCount: dealership.positiveCount,
      negativeCount: dealership.negativeCount
    });

    // Delete existing reviews for this dealership
    await Review.deleteMany({ dealershipId: dealership._id });
    console.log('Deleted existing reviews');

    // Read and import original CSV data
    const csvPath = '/Users/Muhammad Fawad/Documents/Development/Smart Trust Meter/data/HONDA RingRoad_ready_for_labeling_analyzed.csv';
    const reviews = [];
    let positiveCount = 0;
    let negativeCount = 0;

    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          const sentiment = parseFloat(row.predicted_sentiment || 0.5);
          const label = parseInt(row.predicted_label || 0);
          
          if (label === 1) positiveCount++;
          else negativeCount++;
          
          reviews.push({
            dealershipId: dealership._id,
            dealershipName: dealership.name,
            reviewText: row.wiI7pd || row.review_text || '',
            predictedSentiment: sentiment,
            predictedLabel: label,
            userSubmitted: false
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`Read ${reviews.length} reviews from CSV`);
    console.log(`Positive: ${positiveCount}, Negative: ${negativeCount}`);

    // Save reviews to database
    await Review.insertMany(reviews);
    console.log('Saved reviews to database');

    // Update dealership stats
    dealership.totalReviews = reviews.length;
    dealership.positiveCount = positiveCount;
    dealership.negativeCount = negativeCount;
    dealership.overallTrustScore = dealership.totalReviews > 0 ? dealership.positiveCount / dealership.totalReviews : 0.5;
    dealership.updatedAt = new Date();
    
    await dealership.save();
    
    console.log('Updated dealership stats:');
    console.log(`Total Reviews: ${dealership.totalReviews}`);
    console.log(`Positive: ${dealership.positiveCount}, Negative: ${dealership.negativeCount}`);
    console.log(`Trust Score: ${(dealership.overallTrustScore * 100).toFixed(1)}%`);

    console.log('HONDA RingRoad data restored successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

restoreHondaRingRoad();
