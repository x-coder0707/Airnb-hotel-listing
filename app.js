if(process.env.NODE_ENV != "production"){
  require('dotenv').config();
};


const express = require("express");
const app = express();
app.use(express.json());
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");

const listingsRouter = require("./Routes/listing.js");
const reviewsRouter = require("./Routes/review.js");
const userRouter = require("./Routes/user.js");


const coockieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require('connect-mongo').default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })
const { GoogleGenerativeAI } =
require("@google/generative-ai");



// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderLust";
const dbUrl = process.env.ATLASDB_URL;

//Gemini AI Client
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);


main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
});

async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

app.use(coockieParser("screctcode"));

// app.get("/getSignedCookie", (req, res) => {
//   res.cookie("Made-in", "India", {signed: true});
//   res.send("signed cookie sent");
// });

// app.get("/verify", (req, res) => {
//   console.log(req.signedCookies);
//   res.send("verified");
// });

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("Error in mongo session store", err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  }
};



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// app.get("/", (req, res) => {
//   res.send("Hi I* am root");
// });


app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});


// app.use("/listings", listingsRouter);
// app.use("/listings/:id/reviews", reviewsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/listings", listingsRouter);
app.use("/", userRouter);

//Gemini Ai
app.post("/chat", async (req, res) => {

  try {

    const userMessage = req.body.message;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const result =
      await model.generateContent(userMessage);

    const reply =
      result.response.text();

    res.json({
      reply: reply,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      reply: "Something went wrong",
    });
  }
});


app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

//Error Middleware
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong!" } = err;
  //res.status(statusCode).send(message);

  res.status(statusCode).render("error.ejs", { message });
});


app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
