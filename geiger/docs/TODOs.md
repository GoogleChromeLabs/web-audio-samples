## TODOs:

* In RandomGraph generation, when the max level increases, remember to remove existing edges connecting to the destination, and connect the new last level to the destination
* Optimize the layout speed
    1. 06/25/19. Throttle a batch of updates via `requestAnimationFrame()`
    2. 06/25/19. Measure the performance and identify the bottleneck => `layout()`
    3. 06/25/19. Propose some potential ideas.
    4. 06/26/19. Study `dagre` source code to see what we can do to make it faster.
* Optimize the render speed
    1. Rewrite `updateEdge()`, possibly `ctx.bezierCurveTo()`
    2. Try Pixi.js, `Graphics.bezierCurveTo()`
* Zoom-to-fit the entire graph into canvas
* When auto-layout, the selected node is still at the original visible position
* Once zoomed in, the text becomes blurry
    1. Idea: change the pixel ratio
    2. https://stackoverflow.com/questions/15661339/how-do-i-fix-blurry-text-in-my-html5-canvas
* Add a pane to show detailed properties
* Make zoom as smooth as possible
* Support Merger and Splitter


## DONE:
* 07/02/19. Use a button to toggle the iframe in a floating container
* 07/02/19. Trace Vocoder and embed as iframe.
* 06/26/19. Text is blurry => Math.round() the position
* 06/26/19. Remove nodes and links
    1. The graph maintains in and out edges for each node
    2. Collection can track enter and exit
* 06/25/19. Update existing graph; measure the performance of layouting and rendering.
* 06/24/19. Auto-generate random graph
    1. Implement a random number generator with seed
    2. For each click, add nodes by Gaussian
    3. Add edges based on levels
* 06/13/19-06/21/19. Basic feature.
    1. Mock message communication.
    2. Implement Graph model.
    3. Use `Dagre` for layouting
    4. Use `Fabric.js` for rendering.
