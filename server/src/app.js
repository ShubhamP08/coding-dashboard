const express = require('express');
const cors=require('cors');

const profilesRoutes = require('./routes/profile.routes.js');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Profiles API!' });
});

app.use('/api/profiles', profilesRoutes);

module.exports = app;