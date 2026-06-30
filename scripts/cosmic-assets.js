'use strict';

hexo.extend.injector.register('head_end', () => {
  return '<link rel="stylesheet" href="/css/cosmic.css">';
});

hexo.extend.injector.register('body_begin', () => {
  return '<canvas id="cosmic-particles" aria-hidden="true"></canvas><div class="cosmic-veil" aria-hidden="true"></div>';
});

hexo.extend.injector.register('body_end', () => {
  return '<script src="/js/cosmic.js"></script>';
});
