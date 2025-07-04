import { createRouter, createWebHashHistory } from 'vue-router';
import { RouteRecordRaw } from 'vue-router';
import main from '../views/main.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'main',
    component: main,
    children: [
      {
        path: '/',
        name: 'index',
        component: () => import('../views/index/index.vue'),
        meta: {
          title: 'I便笺'
        }
      },
      {
        path: '/editor',
        name: 'editor',
        component: () => import('../views/editor/index.vue'),
        meta: {
          title: ''
        }
      },
      {
        path: '/setting',
        name: 'setting',
        component: () => import('../views/setting/index.vue'),
        meta: {
          title: '设置'
        }
      }
    ]
  },
  {
    path: '/image-preview',
    name: 'imagePreview',
    component: () => import('../views/ImagePreview/index.vue'),
    meta: {
      title: '图片预览'
    }
  }
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
});

// 添加路由守卫用于调试
router.beforeEach((to, from, next) => {
  console.log('🚀 Navigating to:', to.path, 'from:', from.path);
  next();
});

router.afterEach((to) => {
  console.log('✅ Navigation completed to:', to.path);
});

router.onError((error) => {
  console.error('❌ Router error:', error);
});

export default router;
