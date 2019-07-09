This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Getting Started

In the project directory, you can run:

1. `yarn start` - Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
2. `yarn test` - Runs tests.
3. `yarn build` - Builds the app for production to the `build` folder.

## Run Vocoder as Test Case
```sh
$ cd Vocoder
$ python -m SimpleHTTPServer
```
This serves Vocoder locally at [localhost:8000](http://localhost:8000). In our case, Vocoder is embeded as an iframe within the graph visualizer. Also, you can view it in a separate tab.

## Extra config
1. [Trace Vocoder](./docs/how-to-trace-Vocoder.md)
2. [Use Web Worker](./docs/config-web-worker.md)
