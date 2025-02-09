
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const httpStatusText = require('./utils/httpStatusText');
const url = process.env.MONGO_URL;
console.log('Connecting to:', url); 

mongoose.connect(url).then(() => {
    console.log('MongoDB server started');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

app.use(cors())
app.use(express.json());
app.use((req, res, next) => {
    console.log(`🟢 Received ${req.method} request at ${req.url}`);
    next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const usersRouter = require('./routes/userRoute');
const categoriesRouter = require('./routes/admin/categoreRotue');
const unitRouter = require('./routes/admin/unit_route');
const productRouter = require('./routes/admin/productRoute');
const orderRouter = require('./routes/orderRoute');
const copounRouter = require('./routes/copounRoute');
app.use('/api/categories', categoriesRouter)
app.use('/api/products', productRouter)
app.use('/api/units', unitRouter)
app.use('/api/users', usersRouter) 
app.use('/api/orders', orderRouter)
app.use('/api/coupons', copounRouter)


// global middleware for not found router
app.all('*', (req, res, next) => {
    return res.status(404).json({ 
        status: httpStatusText.ERROR, 
        message: `This resource is not available: ${req.originalUrl}`
    });
});


// global error handler
app.use((error, req, res, next) => {
    res.status(error.statusCode || 500).json({status: error.statusText || httpStatusText.ERROR, message: error.message, code: error.statusCode || 500, data: null});
})

app.listen(process.env.PORT || 4000, () => {
    console.log('listening on port: 4000');
});