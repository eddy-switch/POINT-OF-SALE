/*import { src, dest, watch } from 'gulp'
import * as dartSass from 'sass'
import gulpSass from 'gulp-sass'

const sass = gulpSass(dartSass);

export function css( done ){
  src('src/scss/app.scss')
    .pipe( sass() )
    .pipe( dest('build/css') )

  done()
} */

//export function dev() {
  //watch('src/scss/**/*.scss', css)
//}

const { src, dest, watch } = require('gulp');
const dartSass = require('sass');
const gulpSass = require('gulp-sass')(dartSass);

function css(done) {
  src('src/scss/app.scss')
    .pipe(gulpSass())
    .pipe(dest('build/css'));

  done();
}

function dev() {
  watch('src/scss/**/*.scss', css);
}

exports.css = css;
exports.dev = dev;
