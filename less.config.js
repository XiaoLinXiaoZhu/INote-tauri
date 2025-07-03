module.exports = {
  // 增加编译超时时间
  javascriptEnabled: true,
  math: 'always',
  // 通过环境变量可以传递更多配置
  paths: ['./src/less'],
  // 增加到120秒
  timeout: 120000,
};
