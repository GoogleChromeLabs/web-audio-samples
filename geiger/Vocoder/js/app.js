chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create('index.html', {
	width: 980,
	height: 550
	})
})