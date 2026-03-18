require('dotenv').config();

const express      = require('express');
const mongoose     = require('mongoose');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');

const app = express();

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

function requireDatabase(res) {
  return res.status(503).json({
    error: 'Database unavailable. Start MongoDB or update MONGO_URI.',
  });
}

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '20kb' }));

// Rate limiting: max 20 reports per hour per IP
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions from this IP. Please try again later.' },
});

// ── MongoDB connection ───────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/police_reports';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅  MongoDB connected:', MONGO_URI.replace(/\/\/.*@/, '//***@')))
  .catch(err => {
    console.error('❌  MongoDB connection failed:', err.message);
    console.error('   The API will stay online, but database-backed routes will return 503 until MongoDB is available.');
  });

// ── Mongoose Schema ──────────────────────────────────────────────────────────
const reportSchema = new mongoose.Schema({
  state:            { type: String, required: true, trim: true },
  cityRegion:       { type: String, default: '', trim: true, maxlength: 100 },
  incidentMonth:    { type: String, required: true },  // "YYYY-MM"
  timeOfDay:        { type: String, enum: ['Morning', 'Daytime', 'Evening', 'Night'], required: true },

  violenceTypes:    { type: [String], required: true },

  motivePresent:    { type: String, enum: ['No', 'Unsure', 'Yes'], required: true },
  motiveTypes:      { type: [String], default: [] },
  religiousDetails: { type: [String], default: [] },

  gender:           { type: String, required: true },
  ageGroup:         { type: String, default: 'Not specified' },

  context:          { type: String, required: true },
  officerCount:     { type: String, required: true },

  // Free text — stored but NEVER returned in any API response
  description:      { type: String, default: '', maxlength: 800 },

  submittedAt:      { type: Date, default: Date.now },
}, {
  versionKey: false,
  // Never expose description or raw _id
  toJSON: {
    transform(doc, ret) {
      delete ret.description;
      delete ret._id;
      return ret;
    },
  },
});

const Report = mongoose.model('Report', reportSchema);

// ── Validation helpers ───────────────────────────────────────────────────────
const VALID_STATES = [
  'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen',
  'Hamburg', 'Hesse', 'Mecklenburg-Vorpommern', 'Lower Saxony',
  'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland',
  'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia',
];

const VALID_TIMES    = ['Morning', 'Daytime', 'Evening', 'Night'];
const VALID_MOTIVES  = ['No', 'Unsure', 'Yes'];
const MONTH_REGEX    = /^\d{4}-(0[1-9]|1[0-2])$/;

function filterDescription(text = '') {
  return text
    .replace(/\b[A-ZÄÖÜ][a-zäöüß]{2,}\b/g, '[name]')   // German/English names
    .replace(/\b[A-Z]{2,}\d{3,}\b/g, '[id]')             // Badge-like IDs
    .replace(/\b\d{4,}\b/g, '[id]')                       // Long number sequences
    .slice(0, 800)
    .trim();
}

// ── POST /api/report ─────────────────────────────────────────────────────────
app.post('/api/report', reportLimiter, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return requireDatabase(res);
    }

    const {
      state, cityRegion, incidentMonth, timeOfDay,
      violenceTypes, motivePresent, motiveTypes, religiousDetails,
      gender, ageGroup, context, officerCount, description,
    } = req.body;

    // Required field validation
    if (!state || !VALID_STATES.includes(state))
      return res.status(400).json({ error: 'Invalid or missing state.' });

    if (!incidentMonth || !MONTH_REGEX.test(incidentMonth))
      return res.status(400).json({ error: 'Invalid incident month format.' });

    if (!timeOfDay || !VALID_TIMES.includes(timeOfDay))
      return res.status(400).json({ error: 'Invalid time of day.' });

    if (!Array.isArray(violenceTypes) || violenceTypes.length === 0)
      return res.status(400).json({ error: 'At least one violence type is required.' });

    if (!motivePresent || !VALID_MOTIVES.includes(motivePresent))
      return res.status(400).json({ error: 'Motive field is required.' });

    if (!gender)
      return res.status(400).json({ error: 'Gender field is required.' });

    if (!context)
      return res.status(400).json({ error: 'Context field is required.' });

    if (!officerCount)
      return res.status(400).json({ error: 'Officer count is required.' });

    // Build and save the report
    const report = new Report({
      state,
      cityRegion: cityRegion || '',
      incidentMonth,
      timeOfDay,
      violenceTypes,
      motivePresent,
      motiveTypes:      motivePresent === 'Yes' && Array.isArray(motiveTypes) ? motiveTypes : [],
      religiousDetails: (motiveTypes || []).includes('Religious') && Array.isArray(religiousDetails)
                          ? religiousDetails : [],
      gender,
      ageGroup: ageGroup || 'Not specified',
      context,
      officerCount,
      description: filterDescription(description),
    });

    await report.save();

    return res.status(201).json({
      success: true,
      message: 'Report submitted anonymously.',
    });

  } catch (err) {
    console.error('POST /api/report error:', err.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ── GET /api/stats ────────────────────────────────────────────────────────────
// Returns ONLY aggregated counts — no individual records ever exposed
app.get('/api/stats', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return requireDatabase(res);
    }

    const [
      total,
      byState,
      byViolence,
      byMotive,
      byMotiveType,
      byReligious,
      byTime,
      byGender,
      byAge,
      byContext,
    ] = await Promise.all([
      Report.countDocuments(),

      Report.aggregate([
        { $group: { _id: '$state', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Report.aggregate([
        { $unwind: '$violenceTypes' },
        { $group: { _id: '$violenceTypes', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Report.aggregate([
        { $group: { _id: '$motivePresent', count: { $sum: 1 } } },
      ]),

      Report.aggregate([
        { $match: { motivePresent: 'Yes' } },
        { $unwind: '$motiveTypes' },
        { $group: { _id: '$motiveTypes', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Report.aggregate([
        { $unwind: { path: '$religiousDetails', preserveNullAndEmptyArrays: false } },
        { $group: { _id: '$religiousDetails', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Report.aggregate([
        { $group: { _id: '$timeOfDay', count: { $sum: 1 } } },
      ]),

      Report.aggregate([
        { $group: { _id: '$gender', count: { $sum: 1 } } },
      ]),

      Report.aggregate([
        { $group: { _id: '$ageGroup', count: { $sum: 1 } } },
      ]),

      Report.aggregate([
        { $group: { _id: '$context', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return res.json({
      total,
      byState,
      byViolence,
      byMotive,
      byMotiveType,
      byReligious,
      byTime,
      byGender,
      byAge,
      byContext,
    });

  } catch (err) {
    console.error('GET /api/stats error:', err.message);
    return res.status(500).json({ error: 'Statistics unavailable.' });
  }
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => {
  res.json({
    status: 'ok',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 fallback ─────────────────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ error: 'Route not found.' }));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀  Backend running on http://localhost:${PORT}`);
  console.log(`    Health: http://localhost:${PORT}/api/health`);
});
