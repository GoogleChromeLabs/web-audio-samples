
## Extra config for Web Worker
1. Option 1: Update package `react-scripts` like this: [https://github.com/facebook/create-react-app/pull/5886](https://github.com/facebook/create-react-app/pull/5886).
    1. Install `worker-loader`
    2. Config `webpack.config.json`
    3. If met any issue on 'build' in production, see [this issue](https://github.com/webpack-contrib/worker-loader/issues/176#issuecomment-451893344).
2. Option 2 (currently using): Follow this link [use-web-worker-without-ejecting-react-create-app](https://medium.com/@danilog1905/how-to-use-web-workers-with-react-create-app-and-not-ejecting-in-the-attempt-3718d2a1166b) by installing `worker-loader` and `react-app-rewired` in the project DevDependencies. Then create a file called `config-overrides.js` to override the webpack config used in `react-scripts`.
    1. ReferenceError: window is not defined. Solution from the comments: add `config.output["globalObject"] = "this"` in `config-overrides.js`
3. Option 3: The `react-scripts@3.1` will add support for WebWorker. The current version is `@3.0.1`.
