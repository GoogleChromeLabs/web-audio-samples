# Steps to trace and visualize Vocoder

## Run Vocoder locally
```sh
$ cd demo/
$ git clone https://github.com/cwilso/Vocoder.git
$ cd Vocoder/
$ python -m SimpleHTTPServer
```
Then visit [localhost:8000](localhost:8000)

## Trace and visualize Vocoder
So far, the visualizer and Vocoder are running in separate pages. To detect and visualize the AudioNode creation, destruction and connection happening in Vocoder, we need to 1) trace the events, and 2) send the events to the visualizer. Since visualizer has hot-reload feature that is good for development, I decided to include Vocoder as an iframe of visualizer, instead of the opposite direction.

### Trace the events in Vocoder
1. A `tracing.js` is added into Vocoder `js/`, which is modified from https://github.com/hoch/canopy/blob/master/docs/spiral-elements/spiral-audiograph/spiral-audiograph.js.
2. Include `tracing.js` in `index.html`

### Send message from Vocoder to visualizer
1. Embed Vocoder as an iframe (http://localhost:8000). 
2. Use the `window.parent.postMessage()` method to send message from iframe to parent page.
3. Format the message into proper attributes that can be serialized and sent as message