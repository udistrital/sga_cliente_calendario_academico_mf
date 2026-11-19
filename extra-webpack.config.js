const singleSpaAngularWebpack = require('single-spa-angular/lib/webpack').default;

module.exports = (config, options) => {
  const singleSpaWebpackConfig = singleSpaAngularWebpack(config, options);

  const angularSourceMaps = singleSpaWebpackConfig.plugins.some(
    (plugin) => plugin.constructor.name === 'SourceMapDevToolPlugin'
  );
  if (angularSourceMaps) {
    singleSpaWebpackConfig.devtool = false;
  }

  singleSpaWebpackConfig.devServer = singleSpaWebpackConfig.devServer || {};
  singleSpaWebpackConfig.devServer.headers = {
    ...singleSpaWebpackConfig.devServer.headers,
    'Access-Control-Allow-Origin': '*',
  };

  // Feel free to modify this webpack config however you'd like to
  return singleSpaWebpackConfig;
};
