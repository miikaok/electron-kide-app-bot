module.exports = function override(config, env) {
  console.log(env);
  config.module.rules.push({
    test: /\.worker\.js$/,
    use: { loader: "worker-loader" },
  });
  return config;
};
