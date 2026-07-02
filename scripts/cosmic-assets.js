'use strict';

hexo.extend.injector.register('head_end', () => {
  return '<link rel="stylesheet" href="/css/cosmic.css">';
});

hexo.extend.injector.register('body_begin', () => {
  return '<div class="site-backdrop" aria-hidden="true"></div>';
});
