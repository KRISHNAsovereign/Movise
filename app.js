const express = require('express');
const path = require('path');
const ejsmate = require('ejs-mate');
const session = require('express-session'); // Add this line
const getMovieDetails = require('./practice');
const userMovieDetails = require('./userMovieDetails'); // Replace './userMovieDetails' with the correct path to your file


const app = express();

app.engine('ejs', ejsmate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuring static file serving to application
app.use(express.static(path.join(__dirname, 'public')));

// Add session middleware
// Add session middleware
app.use(session({
  secret: 'your-secret-key', // Replace with a random secret key
  resave: false,
  saveUninitialized: true,
}));

let currentUserId;

function getRandomMovies(movieDetailsArray, count) {
  const shuffledArray = movieDetailsArray.sort(() => 0.5 - Math.random());
  return shuffledArray.slice(0, count);
}

// Middleware to check and set user ID in the session
function setUserIdInSession(req, res, next) {
  if (!req.session.userId) {
    req.session.userId = Math.floor(Math.random() * 500) + 1;
  }
  currentUserId = req.session.userId;
  next();
}

// Function to store movie details for a user ID in userMovieDetails object
function storeUserMovieDetails(userId, movieDetails) {
  const watchedMovies =  movieDetails.watchedMovies;
  const recommendMovies =  movieDetails.recommendMovies;
  const allMovies =  movieDetails.allMovies;

  userMovieDetails[userId] = {
    watchedMovies,
    recommendMovies,
    allMovies,
  };
}


app.use(setUserIdInSession);


 

app.get('/index', async (req, res) => {
  const userId = currentUserId;
  
  // Check if movie details are available for the current user in userMovieDetails object
  if (!userMovieDetails[userId]) {
    // Movie details are not available, fetch them from the API and store in userMovieDetails
    const movieDetails = await getMovieDetails(userId);
    storeUserMovieDetails(userId, movieDetails);
  }

  // Get the movie details from userMovieDetails object for the current user
  const { watchedMovies, recommendMovies, allMovies } = userMovieDetails[userId];

  // Get a random set of 5 movies for each category to display
  const randomWatchedMovies = getRandomMovies(watchedMovies, 5);
  const randomRecommendMovies = getRandomMovies(recommendMovies, 5);
  const randomAllMovies = getRandomMovies(allMovies, 5);

  res.render('index', {
    watchedMovies: randomWatchedMovies,
    recommendMovies: randomRecommendMovies,
    allMovies: randomAllMovies,
  });
});

// Rest of your routes...




app.get('/recommend', async (req, res) => {
  // Check if movie details are available for the current user
  if (userMovieDetails[currentUserId]) {
    const recommendMovies = userMovieDetails[currentUserId].recommendMovies;
    res.render('recommend', {
      recommendMovies,
    });
  } else {
    // If movie details are not available, redirect the user to the index page
    res.redirect('index');
  }
});

app.get('/movies', async (req, res) => {
  // Check if movie details are available for the current user
  if (userMovieDetails[currentUserId]) {
    const allMovies = userMovieDetails[currentUserId].allMovies;
    res.render('movies', {
      allMovies,
    });
  } else {
    // If movie details are not available, redirect the user to the index page
    res.redirect('index');
  }
});

app.get('/watched', async (req, res) => {
  // Check if movie details are available for the current user
  if (userMovieDetails[currentUserId]) {
    const watchedMovies = userMovieDetails[currentUserId].watchedMovies;
    res.render('watched', {
      watchedMovies,
    });
  } else {
    // If movie details are not available, redirect the user to the index page
    res.redirect('index');
  }
});

app.get('/top_rated', async (req, res) => {
  // Check if movie details are available for the current user
  if (userMovieDetails[currentUserId]) {
    const recommendMovies = userMovieDetails[currentUserId].recommendMovies;
    res.render('top_rated', {
      recommendMovies,
    });
  } else {
    // If movie details are not available, redirect the user to the index page
    res.redirect('index');
  }
});

app.get('/', async (req, res) => {
  const userId = currentUserId;
  
  // Check if movie details are available for the current user in userMovieDetails object
  if (!userMovieDetails[userId]) {
    // Movie details are not available, fetch them from the API and store in userMovieDetails
    const movieDetails = await getMovieDetails(userId);
    storeUserMovieDetails(userId, movieDetails);
  }

  // Get the movie details from userMovieDetails object for the current user
  const { watchedMovies, recommendMovies, allMovies } = userMovieDetails[userId];

  // Get a random set of 5 movies for each category to display
  const randomWatchedMovies = getRandomMovies(watchedMovies, 5);
  const randomRecommendMovies = getRandomMovies(recommendMovies, 5);
  const randomAllMovies = getRandomMovies(allMovies, 5);

  res.render('index', {
    watchedMovies: randomWatchedMovies,
    recommendMovies: randomRecommendMovies,
    allMovies: randomAllMovies,
  });
});


app.listen(3000, () => {
  console.log("Running on port 3000...");
});
