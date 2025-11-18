require("dotenv").config();

const express = require('express');
const app = express();
const morgan = require("morgan");
const cors = require('cors')
const connectDB = require("./config/db");
app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan("dev"));

//database connection
connectDB();

//routes

app.get("/api", (req, res) => {
    res.send("Server is awake and running.");
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/workspaces', require('./routes/workspaceRoutes'));
app.use('/api/lessons', require('./routes/lessonRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/progress', require('./routes/progressRoutes'));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})

module.exports = app;