const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;


app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Use secure: true in production with HTTPS
}));


app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Set up session management
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// In-memory data store
let cars = [];
let users = []; // Start with an empty array

// Middleware to check if user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.session.user) {
    return next(); // User is authenticated, proceed to the next middleware/route handler
  }
  res.render('login', { message: 'Please log in to access this page' });
}




// Route to render login page
app.get('/login', (req, res) => {
  res.render('login', { message: null });
});

// Handle login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user = user;
    res.redirect('/dashboard');
  } else {
    res.render('login', { message: 'Invalid credentials' });
  }
});

app.get('/', (req, res) => {
  res.render('login', { message: null }); // Ensure 'index.ejs' exists in the 'views' folder
});

app.get('/management', (req, res) => {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.redirect('/login');
  }
  res.render('management'); // Ensure 'management.ejs' exists in the 'views' folder
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  const totalCars = cars.length;
  res.render('dashboard', { cars, totalCars });
});


// Route to render signup page
app.get('/signup', (req, res) => {
  res.render('signup', { message: null });
});

app.get('/', (req, res) => {
  res.render('signup', { message: null }); // Ensure 'index.ejs' exists in the 'views' folder
});

// Handle signup
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  const existingUser = users.find(u => u.username === username);

  if (existingUser) {
    res.render('signup', { message: 'Username already exists' });
  } else {
    const hashedPassword = bcrypt.hashSync(password, 10);
    users.push({ username, password: hashedPassword });
    res.redirect('/login');
  }
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user = user;
    if (username === 'admin') { // Assuming 'admin' is the username for admin access
      req.session.user.isAdmin = true;
    }
    res.redirect('/dashboard');
  } else {
    res.render('login', { message: 'Invalid credentials' });
  }
});


// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log('Error destroying session:', err);
      return res.redirect('/dashboard');
    }
    res.redirect('/login');
  });
});


// Dashboard Route
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  
  const totalCars = cars.length;
  res.render('dashboard', { cars, totalCars });
});

// Car List for Users
app.get('/cars', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  
  res.render('cars', { cars });
});

// Admin-only routes
app.post('/cars', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const { name, year, price } = req.body;
  cars.push({ id: cars.length + 1, name, year, price });
  res.redirect('/cars');
});

app.get('/cars/edit/:id', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  
  const car = cars.find(c => c.id === parseInt(req.params.id));
  if (car) {
    res.render('edit', { car });
  } else {
    res.status(404).send('Car not found');
  }
});

app.post('/cars/edit/:id', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  
  const { id } = req.params;
  const { name, year, price } = req.body;
  const carIndex = cars.findIndex(c => c.id === parseInt(id));
  if (carIndex !== -1) {
    cars[carIndex] = { id: parseInt(id), name, year, price };
    res.redirect('/cars');
  } else {
    res.status(404).send('Car not found');
  }
});

app.post('/cars/delete/:id', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  
  const { id } = req.params;
  cars = cars.filter(c => c.id !== parseInt(id));
  res.redirect('/cars');
});

// Serve static files (like CSS)
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
