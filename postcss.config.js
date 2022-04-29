const cssNanoProductionOptions = {
  preset: [
    'default',
    {discardComments: {removeAll: true}}
  ]
};
  
module.exports = ({env}) => ({
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    cssnano: env === 'production' ? cssNanoProductionOptions : false
  }
});
