var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var paths = {
  src: './src/*.js',
  dist: './dist/'
};

gulp.task('default', ['build']);

gulp.task('build', ['build-script', 'build-min-script']);

gulp.task('build-script', function () {
  gulp.src(paths.src)
    .pipe(concat('sentiance-firehose.js'))
    .pipe(gulp.dest(paths.dist));
});

gulp.task('build-min-script', function () {
  gulp.src(paths.src)
    .pipe(concat('sentiance-firehose.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(paths.dist));
});