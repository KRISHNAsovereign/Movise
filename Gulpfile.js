const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const eslint = require('gulp-eslint');

// Define the 'start' task to run the application using nodemon
gulp.task('start', function () {
  nodemon({
    script: 'app.js', // Replace 'app.js' with the main file of your application
    ext: 'js',
    env: { 'NODE_ENV': 'development' }, // Set the environment to 'development'
    ignore: ['node_modules/**'],
  })
  .on('restart', function () {
    console.log('Restarting...');
  });
});

// Define the 'lint' task to lint JavaScript files using ESLint
gulp.task('lint', function () {
  return gulp.src(['**/*.js', '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

// Default Gulp task: runs both 'start' and 'lint' tasks in sequence
gulp.task('default', gulp.series('start', 'lint'));
