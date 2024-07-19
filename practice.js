const axios = require('axios');

async function fetchMovieDetails(userId, movieTitle) {
  try {
    const apiKey = 'b6537c62c533651a959ae3522a985b59'; // Replace with your TMDb API key
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(movieTitle)}`;

    // Make a GET request to the TMDb API for movie search
    const searchResponse = await axios.get(searchUrl);
    const searchResults = searchResponse.data.results;

    if (searchResults.length === 0) {
      return {
        title: movieTitle.trim(),
        posterImageUrl: null,
        rating: null,
        overview: null,
        releaseDate: null,
        genres: [],
        cast: [],
        crew: [],
        trailerUrl: null
      };
    }

    const movieId = searchResults[0].id;
    const movieDetailsUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=images,credits,videos`;

    // Make a GET request to the TMDb API for movie details
    const detailsResponse = await axios.get(movieDetailsUrl);
    const movieDetails = detailsResponse.data;

    const title = movieDetails.title;
    const rating = movieDetails.vote_average;

    // Extract the poster image URL from the images section
    const posterImages = movieDetails.images.posters;
    const posterImageUrl = posterImages.length > 0 ? `https://image.tmdb.org/t/p/original${posterImages[0].file_path}` : null;

    // Create a movie object
    const movieData = {
      title,
      posterImageUrl,
      rating,
    };

    return movieData;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

async function fetchMovieDetailsForTitles(userId, movieTitles) {
  try {
    const movieDetails = [];

    for (const movieTitle of movieTitles) {
      const movieName = getMovieName(movieTitle);
      const movieData = await fetchMovieDetails(userId, movieName);
      movieDetails.push(movieData);
    }

    return movieDetails;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

function getMovieName(title) {
  if (!title) {
    return '';
  }
  const trimmedTitle = title.split('(')[0]; // Remove the part starting from the opening parenthesis
  return trimmedTitle.trim();
}

async function getMovieDetails(userId=550) {
  try {
    console.log("current userId : ",parseInt(userId));

 
    const response = await axios.post('http://127.0.0.1:5000/recommendations', {
      user_id:parseInt(userId)
     }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const movieDetails = response.data;
    // console.log("response data : ",movieDetails);
    console.log(" ...............................Recived  response data.................... ")
       recommendedMovieTitles = movieDetails.recommended_movies.map(movie => String(movie));
       watchedMovieTitles = movieDetails.favorite_movies.map(movie => String(movie));
       allMovieTitles = movieDetails.all_movies.map(movie => String(movie));

    //  console.log("pasing data : ",recommendedMovieTitles,watchedMovieTitles,allMovieTitles);
        console.log("\n.................................passing response  data to IMDB website.....................")
     const recommendedMovieDetails = await fetchMovieDetailsForTitles(userId, recommendedMovieTitles);
     const watchedMovieDetails = await fetchMovieDetailsForTitles(userId, watchedMovieTitles);
     const allMovieDetails = await fetchMovieDetailsForTitles(userId, allMovieTitles);

     console.log("movie details from imdb : \n recommends : ",recommendedMovieDetails,"\nwatched : ",watchedMovieDetails,"\n all movies",allMovieDetails);
    
    
    return {
      recommendMovies: recommendedMovieDetails,
      watchedMovies: watchedMovieDetails,
      allMovies: allMovieDetails
    };
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

module.exports = getMovieDetails;
