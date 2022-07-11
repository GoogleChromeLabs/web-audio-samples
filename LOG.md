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

## 06/21/2022
- [DONE]: Some legacy examples should work: Wavetable Synth, Box2D stress test, 
  AnalyserNode visualization, panning, 8ball with 3D audio

## 6/22/2022
- [DONE]: write README.md

## 6/23/2022
- [DONE]: weed out unused audio files

## 7/11/2022
- [DONE]: apply format/lint to demos/ - seems meaningless. This can be done by week-by-week basis.
- [TODO]: push _site directory to gh-pages branch

---

## TODO
- TODO: Make a TODO list for contributors
- TODO: clean up license all files.
- TODO: SAB examples need to be deployed to Netlify. (chrome web audio account?)
- TODO: https://github.com/marketplace/actions/push-git-subdirectory-as-branch
  - git subtree split --branch gh-pages --prefix _site/
    (see https://stackoverflow.com/questions/32616844/git-how-to-push-a-subdirectory-to-a-separate-branch-of-the-same-repository)

# Branches
- main: site source
- gh-pages: actual site
- archive: V2 and earlier projects/examples

