require('dotenv').config();
const express = require('express');
const cors = require('cors');

const healthRoute = require('./routes/health');
const searchRoute = require('./routes/search');
const restrictionCheckRoute = require('./routes/restrictionCheck');
const companyRoute = require('./routes/company');
const mallRoute = require('./routes/mall');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api/health', healthRoute);
app.use('/api/search', searchRoute);
app.use('/api/restriction-check', restrictionCheckRoute);
app.use('/api/company', companyRoute);
app.use('/api/mall', mallRoute);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal error' });
});

module.exports = app;
