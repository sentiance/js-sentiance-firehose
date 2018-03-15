'use strict'

const gulp = require('gulp')
const concat = require('gulp-concat')
const uglify = require('gulp-uglify-es').default
const babel = require('gulp-babel')
const paths = {
    src: './src/*.js',
    dist: './dist/'
}

gulp.task('default', ['build'])

gulp.task('build', ['build-script', 'build-min-script'])

gulp.task('build-script', function () {
    gulp.src(paths.src)
        .pipe(concat('sentiance-firehose.js'))
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(gulp.dest(paths.dist))
})

gulp.task('build-min-script', function () {
    gulp.src(paths.src)
        .pipe(concat('sentiance-firehose.min.js'))
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(uglify())
        .pipe(gulp.dest(paths.dist))
})
