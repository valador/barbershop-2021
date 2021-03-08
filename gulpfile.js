// Initialize modules
// Importing specific gulp API functions lets us write them below as series() instead of gulp.series()
const { src, dest, watch, series, parallel } = require('gulp');
// Importing all the Gulp-related packages we want to use
const sourcemaps = require('gulp-sourcemaps');
const sass       = require('gulp-sass');
const concat     = require('gulp-concat');
// const uglify = require('gulp-uglify');
const postcss    = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano    = require('cssnano');
// var replace = require('gulp-replace');
const rename     = require('gulp-rename');
// notify = require('gulp-notify');
// const connect = require('gulp-connect');
// const imagemin = require("gulp-imagemin");
var babel        = require('gulp-babel');
const terser     = require("gulp-terser");
const webserver  = require('gulp-webserver');
const path       = require('path');
const del        = require('del'); // for Clean
const fs         = require('fs'); //for webserver

// File paths
// const sourceFiles = {
//     scssPath: 'src/scss/**/*.scss',
//     htmlPath: 'src/*.html',
//     fontPath: 'src/fonts/**/*.*',
//     jsPath:   'src/js/*.js',
//     imgPath: ['src/img/**/*.{gif,png,jpg,jpeg,ico}']
// }

// const destFiles = {
//   PubPath: 'pub',
//   scssPath: 'pub/css',
//   htmlPath: 'pub',
//   fontPath: 'pub/fonts',
//   jsPath:   'pub/js',
//   imgPath:  'pub/img'
// }

const paths = {
  scss:   {
      watch: './src/scss/**/*.scss',
      src:   './src/scss/main.scss',
      dest:  './pub/css'
  },
  js:     {
      watch: './src/js/**/*.js',
      src:   './src/js/**/*.js',
      dest:  './pub/js'
  },
  html:   {
      watch: './src/*.html',
      src:   './src/*.html',
      dest:  './pub'
  },
  img: {
      watch: './src/img/**/*',
      src:   ['src/img/**/*.{gif,png,jpg,jpeg,ico,svg}'],
      dest:  './pub/img'
  },
  fonts:  {
      watch: 'src/fonts/**/*.*',
      src:   'src/fonts/**/*.*',
      dest:  './pub/fonts'
  }
};
// var's
/**
 * @param err
 */
function handleError(err) {
  console.error(err);
}
/*****************************
TASKS
 ******************************/

/**
 * clean
 */
function cleanTask(cb) {
  del(['./pub/*'])
      .then(function () {
          cb();
      })
      .catch(handleError);
}
/**
 * Images
 */
function imagesTask() {
  return src(paths.img.src)
      .pipe(dest(paths.img.dest));
}

/**
 * Fonts
 */
function fontsTask() {
  return src(paths.fonts.src)
      .pipe(dest(paths.fonts.dest));
}

/**
 * HTML
 */
function htmlTask() {
  return src(paths.html.src)
    .pipe(dest(paths.html.dest));
    // .pipe(notify({ message: 'htmlTask task complete' }));
    // .pipe(connect.reload())
}
/**
 * JavaScript
 */
function jsTask() {
  return src(paths.js.src)
    .pipe(concat('main.js'))
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(terser())
    .pipe(dest(paths.js.dest));
    // .pipe(notify({ message: 'jsTask task complete' }));
    // .pipe(connect.reload())
}

/**
 * SCSS
 */
function scssTask() {
  return src(paths.scss.src)
      .pipe(sourcemaps.init()) // initialize sourcemaps first
      .pipe(sass().on('error', sass.logError)) // compile SCSS to CSS
      .pipe(postcss([ autoprefixer(), cssnano() ])) // PostCSS plugins
      .pipe(rename('main.css'))
      .pipe(sourcemaps.write('.')) // write sourcemaps file in current directory
      .pipe(dest(paths.scss.dest)); // put final CSS in dist folder
    //   .pipe(notify({ message: 'scssTask task complete' }));
      // .pipe(connect.reload())     // Make sure changes shows in browsers
}


/**
 * watch
 */
function watchTask() {
  watch(paths.scss.watch, series(scssTask));
  watch(paths.js.watch, series(jsTask));
  watch(paths.fonts.watch, series(fontsTask));
  watch(paths.html.watch, series(htmlTask));
  watch(paths.img.watch, series(imagesTask));
}

/**
 * webserver - ДОДЕЛАТЬ
 */
function webserverTask() {
  return src("./pub/")
        .pipe(webserver({
            port: 8089,
            open: false,
            host: '0.0.0.0',
            livereload: true,
            // fallback:"index.html",
            middleware: [
                (req,res)=>{
                    if(req.url==="/"){
                        let data = fs.readFileSync(path.join(__dirname,"./pub/index.html"),"utf8")
                        res.end(data)
                    } else if (path.extname(req.url)){
                        if(req.url ==="\favicon.ico"){
                            res.end("")
                        }
                        fs.readFile(path.join(__dirname,"pub",req.url),"utf8",(error,data)=>{
                            if(error){
                                return
                            }
                            res.end(data)
                        })
                    }
                }
            ]
        }))
}

const buildTask = series(cleanTask, parallel(scssTask, jsTask, htmlTask, imagesTask, fontsTask));

exports.clean   = cleanTask;
exports.scss    = scssTask;
exports.js      = jsTask;
exports.html    = htmlTask;
exports.images  = imagesTask;
exports.fonts   = fontsTask;
exports.dev     = series(buildTask, parallel(watchTask, webserverTask));
exports.watch   = series(buildTask, watchTask);
exports.web      = webserverTask;
exports.build   = buildTask;
exports.default = watchTask;
