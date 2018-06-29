/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const gulp =          require('gulp');
const concatCss =     require('gulp-concat-css');
const runSequence =   require('run-sequence');
const del =           require('del');

gulp.task('clean-up', () => {
  del.sync(['assets/**', '!assets/']);
});

gulp.task('assets-lib', () => {
  return gulp.src('node_modules/lit-html/**/*')
      .pipe(gulp.dest('assets/lit-html/'));
});

gulp.task('assets-components', () => {
  return gulp.src('src/components/Components.js')
      .pipe(gulp.dest('assets/'));
});

gulp.task('assets-styles', () => {
  return gulp.src('src/styles/*.css')
    .pipe(concatCss('was-styles.css'))
    .pipe(gulp.dest('assets/'));
});

gulp.task('watch', () => {
  gulp.watch(['src/components/Components.js'], ['assets-components']);
  gulp.watch(['src/styles/*.css'], ['asset-style']);
});

gulp.task('default', () => {
  runSequence('clean-up', 'assets-lib', 'assets-components', 'assets-styles');
});