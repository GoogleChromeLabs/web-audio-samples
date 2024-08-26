![Google Summer of Code logo](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ay9k3nf86inhwwvt32bv.png)

**Organization:** Chromium
**Projects Overview:**
- [Web Audio Test and Live Suite](https://github.com/GoogleChromeLabs/web-audio-samples/blob/main/src/tests/playwright/README.md)
- Rainfly: Audio Worklets Playground

# Projects
## Web Audio Test and Live Suite
The Web Audio Test Suite is comprised of performance and benchmark tests for Web Audio. These tests can be run either through Playwright or the Live Suite. Playwright is a browser automation testing framework that runs via CLI or CI. This is useful for automated testing across different browsers or browser versions. Web Audio Test Live Suite is an interactive webpage for running tests locally in your browser and monitoring runtime.
### Contributions
My contribution to the Web Audio Test and Live Suite centered around its creation, design, and development with [@terryzfeng](https://github.com/terryzfeng). After researching between Puppeteer and Playwright, we decided to use Playwright due to its testing capabilities in addition to its browser automation, which we could use for CI.
### Documentation
#### The original draft PR for integrating the Web Audio Test Suite into `web-audio-samples`
{% github https://github.com/GoogleChromeLabs/web-audio-samples/pull/368 %}
#### The first PR to introduce the Web Audio Test and Live Suite
{% github https://github.com/GoogleChromeLabs/web-audio-samples/pull/372 %}
#### Adding documentation to the Test and Live Suites, allowing for more crowdsourced tests
{% github https://github.com/GoogleChromeLabs/web-audio-samples/pull/381 %}
#### Overcoming cold start on the Test and Live Suites by porting performance tests from WPT
{% github https://github.com/GoogleChromeLabs/web-audio-samples/pull/384 %}
#### Fix an issue where the build process did not include all relevant files
{% github https://github.com/GoogleChromeLabs/web-audio-samples/pull/385 %}
#### Linking the Live Suite to the index page of `web-audio-samples`
{% github https://github.com/GoogleChromeLabs/web-audio-samples/pull/386 %}

## Rainfly
Rainfly is an Audio Worklet playground, useful for inspecting, developing, and rapid prototyping of Audio Worklet code.
### Contributions
Along with [@terryzfeng](https://github.com/terryzfeng), we created, designed, and developed an MVP of Rainfly using SvelteKit and TailwindCSS.
### Documentation
#### Figma med-fi prototype
[![Figma prototype](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/eosafuca9s69ur78yr8z.png)](https://www.figma.com/proto/NrpvA1wwQNoc4hnKTAORIg/Rainfly?node-id=1-2&t=VBSHkeRFtwhvNIfU-0&scaling=scale-down&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=1%3A2)
#### The original MVP hosted on a separate repository due to separate framework and development environment
{% github https://github.com/Kizjkre/rainfly %}
#### Introducing Rainfly into `web-audio-samples`
{% github https://github.com/GoogleChromeLabs/web-audio-samples/pull/395 %}

## Other Miscellaneous Work
### Onboarding PR to familiarize myself with Google standards
{% github https://github.com/GoogleChromeLabs/web-audio-samples/pull/359 %}
### Fixing linter issues
{% github https://github.com/GoogleChromeLabs/web-audio-samples/pull/373 %}
