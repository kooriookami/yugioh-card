import { contextBridge } from 'electron';

/**
 * 向渲染进程暴露 resourcePath：
 * - 开发模式：Vite dev server 从 src/ 提供文件
 * - 生产模式：assets 在打包输出目录
 */
contextBridge.exposeInMainWorld('__YG__', {
  resourcePath: process.env.VITE_DEV_SERVER_URL
    ? '/src/assets/yugioh-card'
    : './assets/src/assets/yugioh-card',
});
