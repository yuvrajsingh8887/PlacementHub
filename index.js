const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const User = require('./models/User');

const app = express();


// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/myapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'secretKey',
  resave: true,
  saveUninitialized: true
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
// Route to render index.ejs
app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});
let islogedIn = (req,res,next)=>{
  if(req.session.user){
    res.redirect('/')
  }
  else{

   next();
  }
}
// Route to render login.ejs
app.get('/login', islogedIn,(req, res) => {
  res.render('login', { user: req.session.user });
});

app.get('/signup', (req, res) => {
  res.render('signup', { user: req.session.user });
});

// Route to render engineering.ejs
app.get('/engineering', (req, res) => {
  res.render('engineering', { user: req.session.user });
});


app.get('/index', (req, res) => {
  res.render('index', { user: req.session.user });
});

// Route to render page specific to Computer Science branch
app.get('/cse-branch', (req, res) => {
  res.render('cse', { user: req.session.user }); 
});



// Define routes for each year
app.get('/first_year', (req, res) => {
  res.render('first_year', { user: req.session.user }); 
});

app.get('/second_year', (req, res) => {
  res.render('second_year', { user: req.session.user });
});

app.get('/third_year', (req, res) => {
  res.render('third_year', { user: req.session.user });
});

app.get('/fourth_year', (req, res) => {
  res.render('fourth_year', { user: req.session.user });
});




// Route to handle signup form submission
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).send('Email already in use');
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.redirect('/login');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


// Route to handle login form submission
app.post('/login', async (req, res) => {
  try {
      const { username, password } = req.body;

      // Check if user exists in the database
      const user = await User.findOne({ username });

      if (!user) {
          // User not found
          return res.send('<script>alert("Invalid username or password"); window.location.href = "/login";</script>');
      }

      // Validate password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
          // Password is incorrect
          return res.send('<script>alert("Invalid username or password"); window.location.href = "/login";</script>');
      }

      // Authentication successful, set session
      req.session.user = user;

      // Redirect to a dashboard or home page
      res.redirect('/profile'); // Redirect to profile page after login
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});


// Route to handle user logout
app.get('/logout', (req, res) => {
  // Destroy user session
  req.session.destroy((err) => {
      if (err) {
          console.error(err);
          res.status(500).send('Internal Server Error');
      } else {
          res.redirect('/login');
      }
  });
});



//these routes run after the login and signup routes

// Route to render the user's profile
app.get('/profile', (req, res) => {
  // Check if user is logged in
  if (req.session.user) {
      res.render('profile', { user: req.session.user });
  } else {
      res.redirect('/login');
  }
});

// Route to render the edit profile form
app.get('/edit-profile', (req, res) => {
  // Check if user is logged in
  if (req.session.user) {
      res.render('edit-profile', { user: req.session.user });
  } else {
      res.redirect('/login');
  }
});

// Route to handle editing the user's profile
app.post('/edit-profile', async (req, res) => {
  // Check if user is logged in
  if (req.session.user) {
      try {
          const { username, email } = req.body;
          // Update user's profile in the database
          await User.findByIdAndUpdate(req.session.user._id, { username, email });
          // Fetch updated user data
          const updatedUser = await User.findById(req.session.user._id);
          // Update user session with new data
          req.session.user = updatedUser;
          res.redirect('/profile');
      } catch (error) {
          console.error(error);
          res.status(500).send('Internal Server Error');
      }
  } else {
      res.redirect('/login');
  }
});



// Server run 
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

