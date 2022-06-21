# Package Maintenance (04/29/2022)

brew doctor
brew update --verbose
brew upgrade
brew doctor && brew cleanup

# Log

## 4/29/2022
- Set up packages. npm run start now works.

## 5/4/2022
- The landing page structure is completed.

## 5/23/2022
- TODO: AudioWorklet pages

## 5/31/2022
- mld tutorial almost finished

## 6/6/2022
- AudioWorklet pages done
- hello audio worklet finished

## 6/7/2022
- DONE: node options, message port, noise generator
- all audioworklet basic example first pass done

## 6/13/2022
- DONE: design pattern
- TODO: supersaw example is still messy. let's clean up.

## 6/14/2022
- DONE: supersaw example is still messy. let's clean up.

## 6/16/2022
- Also google style lint https://www.npmjs.com/package/eslint-config-google
- HTML prettify https://www.npmjs.com/package/pretty
- DONE add npm run comment for lint
- DONE html prettify on site/{audio-worklet}

## 6/17/2022
- README.md gets built to html. don't do that [DONE]
- Build
  - Translate
    - njk -> directory/index.html [DONE]
  - Passthrough
    - **/README.md (do not translate) [DONE]
    - **/*.js [DONE]
    - ./archive [DONE]
- Lint/Format
  - Ignore
    - **/*.wasmmodule.js [DONE]
    - **/*.wasm.js [DONE]
    - ./archive [DONE]


## 06/20/2022
- [DONE]: *.njk file shouldn't passthrough
- [DONE]: npm run format now works on audio-worklet directory
- [DONE]: "target=blank" is everywhere. let's fix that

---

## TODO
- TODO: Some legacy examples should work: Wavetable Synth, Box2D stress test, 
    AnalyserNode visualization, panning, 8ball with 3D audio
- TODO: remove old demo collection
- TODO: https://github.com/marketplace/actions/push-git-subdirectory-as-branch
- TODO: SAb example needs to go to Netlify (do we have a tier-account?)
