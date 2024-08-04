const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require('connect-flash'); // Import connect-flash

const app = express();

// Set up middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'secretKey', resave: false, saveUninitialized: true }));
app.use(flash()); // Use flash middleware
app.use(passport.initialize());
app.use(passport.session());

// Configure view engine
app.set('view engine', 'ejs');

// Dummy admin user
const adminUser = { username: 'admin', password: 'password' };

// Passport configuration
passport.use(new LocalStrategy(
  function (username, password, done) {
    if (username === adminUser.username && password === adminUser.password) {
      return done(null, adminUser);
    } else {
      return done(null, false, { message: 'Incorrect credentials.' });
    }
  }
));

passport.serializeUser(function (user, done) {
  done(null, user.username);
});

passport.deserializeUser(function (username, done) {
  if (username === adminUser.username) {
    done(null, adminUser);
  } else {
    done(new Error('User not found'));
  }
});

// Routes
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login', { message: req.flash('error') });
});

app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/admin',
    failureRedirect: '/login',
    failureFlash: true
  })
);

app.get('/admin', (req, res) => {
  if (req.isAuthenticated()) {
    res.send('Welcome to the admin page');
  } else {
    res.redirect('/login');
  }
});

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
