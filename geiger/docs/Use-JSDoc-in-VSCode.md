

## Reference a class in a different file
Problems: JSDoc 3.0 introduces a way to [define ES6 module](https://devdocs.io/jsdoc/howto-es2015-modules) by 
```js
/** @module my/module */
class SomeClass {...}
```
 and 
```js
/** @param {module:my/module.SomeClass} */
```
However, it does not work in VSCode.

Solution: [https://github.com/Microsoft/TypeScript/issues/14377#issuecomment-379935736](https://github.com/Microsoft/TypeScript/issues/14377#issuecomment-379935736).
The idea is to use 
```js
/** @typedef {import("path/file").SomeClass} SomeClass */
```
or
```js
/** @type {import("path/file").SomeClass} */
```

