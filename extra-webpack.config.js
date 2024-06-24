const singleSpaAngularWebpack = require('single-spa-angular/lib/webpack').default;
const dotenv = require('dotenv');
const webpack = require('webpack');

// Cargar variables de entorno desde el archivo .env
const env = dotenv.config().parsed;

const envKeys = Object.keys(env).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
}, {});

module.exports = (config, options) => {
  const singleSpaWebpackConfig = singleSpaAngularWebpack(config, options);

  // Agregar DefinePlugin a los plugins existentes
  singleSpaWebpackConfig.plugins.push(
    new webpack.DefinePlugin(envKeys)
  );

  return singleSpaWebpackConfig;
};
