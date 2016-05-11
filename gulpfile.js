var gulp = require('gulp');
var uglify = require('gulp-uglify');
var gzip = require('gulp-gzip');
 
gulp.task('js', function() {
	gulp.src(['dataValidator.js', 'lib/*.js', 'data/*.js'], { base: '.' })
		.pipe(uglify())
		.pipe(gzip())
		.pipe(gulp.dest('./public'));
});

gulp.task('cssAndHtml', function() {
	gulp.src(['normalize.css', 'main.css', 'index.html'])
		.pipe(gzip())
		.pipe(gulp.dest('./public'));
});

gulp.task('default', ['js', 'cssAndHtml']);
