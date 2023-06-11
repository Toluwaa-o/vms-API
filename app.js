//external packages
require('dotenv').config()
require('express-async-errors')

// package imports
const fileUpload = require('express-fileupload')
const cookieParser = require('cookie-parser')
const express = require('express')
const mongoSanitize = require('express-mongo-sanitize')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const cloudinary = require('cloudinary').v2

//cloudinary (for image/video uploads) configuration
cloudinary.config({
    api_key: process.env.CLOUDINARY_KEY,
    cloud_name: process.env.CLOUDINARY_NAME,
    api_secret: process.env.CLOUDINARY_SECRET
})

//Database connection function import
const connectDB = require('./DB/connectDB')

//Middleware
const {auth} = require('./Middleware/authentication')
const notFound = require('./Middleware/not-found')
const errorHandler = require('./Middleware/error-handler')

//Routes
const reportsRoutes = require('./Routes/reportsRoutes')
const authRoutes = require('./Routes/authRoutes')
const userRoutes = require('./Routes/userRoutes')

//Express app initialization
const app = express()

//Invoking Middleware
app.use(express.json())
app.use(express.static('./Public'))
app.use(fileUpload({useTempFiles: true}))
app.use(cookieParser(process.env.JWT_SECRET))
app.use(morgan('tiny'))

//security middleware
app.set('trust proxy', 1)
app.use(cors({
    origin: true,
    credentials: true
}))
app.use(helmet({
    crossOriginResourcePolicy: {policy: "cross-origin"},
    crossOriginEmbedderPolicy: false
}))
app.use(mongoSanitize())

//Setting up routes
app.use('/cms-api/auth', authRoutes)
app.use('/cms-api/users', auth, userRoutes)
app.use('/cms-api/reports', auth, reportsRoutes)

//Error handling routes
app.use(notFound)
app.use(errorHandler)

//Port setup
const port = process.env.PORT || 3000

//function for starting the app
const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI)
        app.listen(port, () => console.log(`Server is listening on port ${port}...`))
    } catch (error) {
        console.log(error)
    }
}

//Invoking start
start()