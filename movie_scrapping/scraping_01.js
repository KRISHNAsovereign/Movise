const axios = require('axios');

async function fetchMovieDetails(movieTitle) {
  try {
    const apiKey = '1305cd7d7abdf3532319c7084cc030fe'; // Replace with your TMDb API key
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
    const overview = movieDetails.overview;
    const releaseDate = movieDetails.release_date;
    const genres = movieDetails.genres.map(genre => genre.name);
    const cast = movieDetails.credits.cast.map(person => person.name);
    const crew = movieDetails.credits.crew.map(person => person.name);
    const trailerUrl = movieDetails.videos.results.length > 0 ? `https://www.youtube.com/watch?v=${movieDetails.videos.results[0].key}` : null;

    // Extract the poster image URL from the images section
    const posterImages = movieDetails.images.posters;
    const posterImageUrl = posterImages.length > 0 ? `https://image.tmdb.org/t/p/original${posterImages[0].file_path}` : null;

    // Create a movie object
    const movieData = {
      title,
      posterImageUrl,
      rating,
      overview,
      releaseDate,
      genres,
      cast,
      crew,
      trailerUrl
    };

    return movieData;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

async function fetchMovieDetailsForTitles(movieTitles) {
  try {
    const movieDetails = [];

    for (const movieTitle of movieTitles) {
      const movieData = await fetchMovieDetails(movieTitle);
      movieDetails.push(movieData);
    }

    return movieDetails;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

const recommendMovies = [
  "Pulp Fiction (1994)",
      "The Shawshank Redemption  (1994)",
      "Schindler's List (1993)",
      "The Matrix  (1999)",
      "American Beauty (1999)"

];

const watchedMovies = [
    "Pacific Heights (1990)",
      "the Sixth Sense (1999)",
      "Stir of Echoes (1999)",
      "the Bone Collector (1999)",
      "Creepshow (1982)"
];

const allMovies = [
   "Toy Story (1995)",
      "Star Wars: Episode IV - A New Hope (1977)",
      "the Shawshank Redemption (1994)",
      "Forrest Gump (1994)",
      "the Nightmare Before Christmas (1993)"
 ];

async function getMovieDetails() {
  const recommendedMovieDetails = await fetchMovieDetailsForTitles(recommendMovies);
  const watchedMovieDetails = await fetchMovieDetailsForTitles(watchedMovies);
  const allMovieDetails = await fetchMovieDetailsForTitles(allMovies);
  
  console.log("recommends", recommendedMovieDetails);
  console.log("watched:", watchedMovieDetails);
  console.log("all movies", allMovieDetails);

  return {
    recommendMovies: recommendedMovieDetails,
    watchedMovies: watchedMovieDetails,
    allMovies: allMovieDetails
  };
}

module.exports = getMovieDetails();
