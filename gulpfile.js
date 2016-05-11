var gulp = require('gulp');
var uglify = require('gulp-uglify');
var gzip = require('gulp-gzip');
 
var dest = './public';
 
gulp.task('js', function() {
	gulp.src(['dataValidator.js', 'lib/*.js', 'data/*.js'], { base: '.' })
		.pipe(uglify())
		.pipe(gulp.dest(dest))
		.pipe(gzip())
		.pipe(gulp.dest(dest));
});

gulp.task('cssAndHtml', function() {
	gulp.src(['normalize.css', 'main.css', 'index.html'])
		.pipe(gulp.dest(dest))
		.pipe(gzip())
		.pipe(gulp.dest(dest));
});

gulp.task('default', ['js', 'cssAndHtml']);
