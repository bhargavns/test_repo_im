// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

// TODO - Include your API routes here
app.get('/', (req, res) => 
{
    res.redirect('/login');
});

//API routes for register
app.get('/register', (req, res) => 
{
  res.render('register');
});

app.post('/register', async (req, res) => 
{
  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    const query = 'INSERT INTO users (username, password) VALUES ($1, $2)';
    await db.none(query, [req.body.username, hash]);
    res.redirect('/login');
  } catch (error) {
    console.error('Registration error:', error);
    res.redirect('/register');
  }
});


//API routes for the login section
app.get('/login', (req, res) => {
  res.render('login.hbs');
});

app.post('/login', async (req, res) => {
  try {
      const { username, password } = req.body;
      const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);

      if (!user) {
          return res.redirect('/register');
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
          return res.render('login.hbs', { message: 'Incorrect username or password.' });
      }

      req.session.user = user;
      req.session.save(() => res.redirect('/discover'));
  } catch (error) {
      console.error(error);
      res.render('login.hbs', { message: 'An error occurred. Please try again.' });
  }
});

// Authentication Middleware.
const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};

// Authentication Required
app.use(auth);

// /discover route - GET
app.get('/discover', (req, res) => {
  const keyword = 'music';  // Example keyword, change as needed
  const size = 5;  // Number of results to return

  axios({
    url: 'https://app.ticketmaster.com/discovery/v2/events.json',
    method: 'GET',
    headers: {
      'Accept-Encoding': 'application/json',
    },
    params: {
      apikey: process.env.API_KEY,
      keyword: keyword,
      size: size,
    },
  })
    .then(response => {
      res.render('discover', {
        results: response.data._embedded ? response.data._embedded.events : [],
        message: '',
      });
    })
    .catch(error => {
      console.error(error);
      res.render('discover', {
        results: [],
        message: 'Failed to fetch data from Ticketmaster API. Please try again later.',
      });
    });
});

// API Route for Logout
app.get('/logout', (req, res) => 
{
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      return res.redirect('/discover');  // Redirect to discover page if an error occurs
    }
    // Render the logout page with the success message
    res.render('logout', {
      message: 'Logged out successfully.',
    });
  });
});

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
app.listen(3000);
console.log('Server is listening on port 3000');