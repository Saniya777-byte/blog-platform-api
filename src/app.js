const express = require('express')
const cors = require('cors')
const tagRoutes = require('./routes/tag.routes')
const postRoutes = require('./routes/post.routes')
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Blog Platform API is running...')
});



app.use('/api/tags', tagRoutes)
app.use('/api/posts', postRoutes);
module.exports = app;