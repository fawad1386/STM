// server.js - Backend Server
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { analyzeSentiment } = require('./lib/sentiment');
const { requireAdmin } = require('./lib/adminAuth');

const app = express();
require("dotenv").config();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Middleware
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin ? { origin: corsOrigin.split(',').map((o) => o.trim()) } : {}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_trust_meter';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    const dbName = mongoose.connection.db.databaseName;
    const dealershipCount = await mongoose.connection.db.collection('dealerships').countDocuments();
    console.log(`MongoDB Connected → database: ${dbName} (${dealershipCount} dealerships)`);
  })
  .catch(err => console.error('MongoDB Connection Error:', err.message));

// ==================== SCHEMAS ====================

// Dealership Schema
const dealershipSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  location: String,
  totalReviews: { type: Number, default: 0 },
  overallTrustScore: { type: Number, default: 0 },
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

// Review Schema
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

const Dealership = mongoose.model('Dealership', dealershipSchema);
const Review = mongoose.model('Review', reviewSchema);

// ==================== ROUTES ====================

// Health Check
app.get('/api/health', async (req, res) => {
  let ml = { status: 'unknown' };
  try {
    const mlRes = await fetch(`${ML_SERVICE_URL}/health`);
    ml = await mlRes.json();
  } catch (err) {
    ml = { status: 'error', error: err.message };
  }

  res.json({
    status: 'OK',
    timestamp: new Date(),
    ml,
  });
});

// Model metrics for demo / report page
app.get('/api/model-metrics', (req, res) => {
  try {
    const metricsPath = path.join(__dirname, 'data', 'model_metrics.json');
    const data = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all dealerships
app.get('/api/dealerships', async (req, res) => {
  try {
    const dealerships = await Dealership.find()
      .select('name location overallTrustScore totalReviews positiveCount negativeCount aspects')
      .sort({ overallTrustScore: -1 });
    
    res.json({
      success: true,
      count: dealerships.length,
      data: dealerships
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single dealership by ID
app.get('/api/dealerships/:id', async (req, res) => {
  try {
    const dealership = await Dealership.findById(req.params.id);
    
    if (!dealership) {
      return res.status(404).json({ success: false, error: 'Dealership not found' });
    }
    
    // Get recent reviews
    const reviews = await Review.find({ dealershipId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({
      success: true,
      data: {
        dealership,
        recentReviews: reviews
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update dealership aspects
app.put('/api/dealerships/:id', async (req, res) => {
  try {
    const { aspects } = req.body;
    
    const dealership = await Dealership.findByIdAndUpdate(
      req.params.id,
      { 
        aspects: aspects,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!dealership) {
      return res.status(404).json({ success: false, error: 'Dealership not found' });
    }
    
    res.json({
      success: true,
      message: 'Dealership updated successfully',
      data: dealership
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search dealerships
app.get('/api/dealerships/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const dealerships = await Dealership.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } }
      ]
    }).sort({ overallTrustScore: -1 });
    
    res.json({
      success: true,
      count: dealerships.length,
      data: dealerships
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get reviews for a dealership
app.get('/api/dealerships/:id/reviews', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const reviews = await Review.find({ dealershipId: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Review.countDocuments({ dealershipId: req.params.id });
    
    res.json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalReviews: total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trust score trend over time (monthly buckets + cumulative)
app.get('/api/dealerships/:id/trust-trend', async (req, res) => {
  try {
    const reviews = await Review.find({ dealershipId: req.params.id })
      .select('predictedLabel createdAt')
      .sort({ createdAt: 1 });

    if (!reviews.length) {
      return res.json({ success: true, data: { trend: [] } });
    }

    const buckets = new Map();

    for (const review of reviews) {
      const d = new Date(review.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const isPositive = review.predictedLabel === 1 ? 1 : 0;

      if (!buckets.has(key)) {
        buckets.set(key, {
          label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          positive: 0,
          total: 0,
        });
      }

      const bucket = buckets.get(key);
      bucket.positive += isPositive;
      bucket.total += 1;
    }

    let runningPositive = 0;
    let runningTotal = 0;
    const trend = [...buckets.keys()].sort().map((key) => {
      const bucket = buckets.get(key);
      runningPositive += bucket.positive;
      runningTotal += bucket.total;

      return {
        period: key,
        label: bucket.label,
        monthlyScore: bucket.total > 0 ? bucket.positive / bucket.total : 0,
        cumulativeScore: runningTotal > 0 ? runningPositive / runningTotal : 0,
        count: bucket.total,
      };
    });

    res.json({ success: true, data: { trend } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit new feedback
app.post('/api/feedback', async (req, res) => {
  try {
    const { dealershipId, reviewText, userName, userEmail } = req.body;
    
    if (!dealershipId || !reviewText) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dealership ID and review text are required' 
      });
    }
    
    // Find dealership
    const dealership = await Dealership.findById(dealershipId);
    if (!dealership) {
      return res.status(404).json({ success: false, error: 'Dealership not found' });
    }
    
    const sentimentAnalysis = await analyzeSentiment(reviewText);
    
    // Create review with actual sentiment analysis
    const review = new Review({
      dealershipId,
      dealershipName: dealership.name,
      reviewText,
      userName: userName || 'Anonymous',
      userEmail: userEmail || null,
      userSubmitted: true,
      predictedSentiment: sentimentAnalysis.sentiment,
      predictedLabel: sentimentAnalysis.label
    });
    
    await review.save();
    
    // Update dealership stats
    dealership.totalReviews += 1;
    if (sentimentAnalysis.label === 1) {
      dealership.positiveCount += 1;
    } else {
      dealership.negativeCount += 1;
    }
    
    // Recalculate overall trust score
    const totalReviews = dealership.positiveCount + dealership.negativeCount;
    dealership.overallTrustScore = totalReviews > 0 ? dealership.positiveCount / totalReviews : 0.5;
    
    await dealership.save();
    
    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: review,
      sentiment: {
        score: sentimentAnalysis.sentiment,
        label: sentimentAnalysis.label,
        source: sentimentAnalysis.source,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Compare dealerships
app.post('/api/compare', async (req, res) => {
  try {
    const { dealershipIds } = req.body;
    
    if (!dealershipIds || dealershipIds.length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'At least 2 dealership IDs required' 
      });
    }
    
    const dealerships = await Dealership.find({ _id: { $in: dealershipIds } })
      .select('name location overallTrustScore totalReviews positiveCount negativeCount aspects');
    
    res.json({
      success: true,
      data: dealerships
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    const totalDealerships = await Dealership.countDocuments();
    
    // Calculate total reviews from dealership documents
    const reviewsAggregation = await Dealership.aggregate([
      { $group: { _id: null, totalReviews: { $sum: '$totalReviews' } } }
    ]);
    const totalReviews = reviewsAggregation[0]?.totalReviews || 0;
    
    const avgTrustScore = await Dealership.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$overallTrustScore' } } }
    ]);
    
    const topDealerships = await Dealership.find()
      .sort({ overallTrustScore: -1 })
      .limit(5)
      .select('name location overallTrustScore totalReviews');
    
    res.json({
      success: true,
      data: {
        totalDealerships,
        totalReviews,
        averageTrustScore: avgTrustScore[0]?.avgScore || 0,
        topDealerships
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== DATA IMPORT (One-time) ====================

// File upload for CSV import
const upload = multer({ dest: 'uploads/' });

app.post('/api/admin/import-dealership', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const { dealershipName, trustScore, aspects } = req.body;
    
    // Parse aspects JSON
    const aspectsData = aspects ? JSON.parse(aspects) : {};
    
    // Check if dealership exists
    let dealership = await Dealership.findOne({ name: dealershipName });
    
    if (!dealership) {
      dealership = new Dealership({
        name: dealershipName,
        overallTrustScore: parseFloat(trustScore),
        aspects: aspectsData
      });
    }
    
    // Read CSV and import reviews
    const reviews = [];
    let positiveCount = 0;
    let negativeCount = 0;
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const sentiment = parseFloat(row.predicted_sentiment || 0.5);
        const label = parseInt(row.predicted_label || 0);
        
        if (label === 1) positiveCount++;
        else negativeCount++;
        
        reviews.push({
          dealershipId: dealership._id,
          dealershipName: dealershipName,
          reviewText: row.wiI7pd || row.review_text || '',
          predictedSentiment: sentiment,
          predictedLabel: label,
          userSubmitted: false
        });
      })
      .on('end', async () => {
        // Save reviews
        await Review.insertMany(reviews);
        
        // Update dealership
        dealership.totalReviews = reviews.length;
        dealership.positiveCount = positiveCount;
        dealership.negativeCount = negativeCount;
        await dealership.save();
        
        // Delete uploaded file
        fs.unlinkSync(filePath);
        
        res.json({
          success: true,
          message: `Imported ${reviews.length} reviews for ${dealershipName}`,
          data: dealership
        });
      });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk import all dealerships
app.post('/api/admin/bulk-import', requireAdmin, async (req, res) => {
  try {
    const { dealerships } = req.body;
    
    for (const dealer of dealerships) {
      const dealership = new Dealership(dealer);
      await dealership.save();
    }
    
    res.json({
      success: true,
      message: `Imported ${dealerships.length} dealerships`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

module.exports = app;