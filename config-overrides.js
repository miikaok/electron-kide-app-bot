module.exports = function override(config) {
  //This is required to make the worker-loader work with create-react-app
  config.module.rules.push({
    test: /\.worker\.js$/,
    use: { loader: "worker-loader" },
  });
  return config;
};
