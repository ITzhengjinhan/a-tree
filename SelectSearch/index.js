const path = require('path');
const files = require.context('./', true);
const modules = {};
files.keys().forEach((key) => {
  if (key.split('/').length === 2 && key.indexOf('SelectSearch') > -1) {
    const name = path.basename(key, '.vue');
    modules[name] = files(key).default || files(key);
  }
});

export default (Vue) => {
  // 注册弹窗组件
  Object.keys(modules).forEach((key) => {
    Vue.component(key, modules[key]);
  });
};
