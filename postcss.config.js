const cssNanoProductionOptions = {
  preset: [
    'default',
    {discardComments: {removeAll: true}}
  ]
};
  
module.exports = ({env}) => ({
  plugins: {
    "@tailwindcss/postcss": {},
    // cssnano: env === 'production' ? cssNanoProductionOptions : false
  }
});
