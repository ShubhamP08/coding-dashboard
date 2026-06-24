const dotenv = require('dotenv');
const app=require('./app');
const connectDB = require('./config/db');

dotenv.config();

const PORT=process.env.PORT || 5001;

connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port localhost:${PORT}/`);
});