import { defineConfig } from 'vitepress';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const repository = 'https://github.com/kooriookami/yugioh-card';
const base = '/yugioh-card/';

const buildLocale = (prefix, lang, label, labels) => {
  const url = route => `${prefix}/${route}`;
  const guide = [
    { text: labels.install, link: url('guide/') },
    { text: labels.resources, link: url('guide/resources') },
    { text: labels.browser, link: url('guide/browser') },
    { text: labels.node, link: url('guide/node') },
    { text: labels.migration, link: url('migration/') },
  ];
  const guideSidebar = [{ text: labels.guide, items: guide }];
  const reference = [
    { text: labels.common, link: url('reference/') },
    { text: labels.yugioh, link: url('reference/cards/yugioh') },
    { text: labels.rush, link: url('reference/cards/rush-duel') },
    { text: labels.back, link: url('reference/cards/yugioh-back') },
    { text: labels.field, link: url('reference/cards/field-center') },
    { text: labels.series2, link: url('reference/cards/yugioh-series-2') },
  ];

  return {
    lang,
    label,
    description: labels.description,
    themeConfig: {
      nav: [
        { text: labels.guide, link: url('guide/'), activeMatch: url('(?:guide|migration)/') },
        { text: labels.reference, link: url('reference/'), activeMatch: url('reference/') },
        { text: 'Playground', link: url('playground/'), activeMatch: url('playground/') },
      ],
      sidebar: {
        [url('guide/')]: guideSidebar,
        [url('reference/')]: [{ text: labels.reference, items: reference }],
        [url('migration/')]: guideSidebar,
      },
      editLink: { pattern: `${repository}/edit/master/docs/:path`, text: labels.edit },
      outline: { label: labels.outline },
      docFooter: { prev: labels.previous, next: labels.next },
      sidebarMenuLabel: labels.menu,
      returnToTopLabel: labels.top,
      darkModeSwitchLabel: labels.appearance,
      langMenuLabel: labels.language,
    },
  };
};

export default defineConfig({
  title: 'Yugioh Card',
  base,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', sizes: 'any', href: `${base}favicon.svg` }]],
  themeConfig: {
    socialLinks: [{ icon: 'github', link: repository, ariaLabel: 'Yugioh Card on GitHub' }],
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
              modal: {
                displayDetails: '显示详情', resetButtonTitle: '清除搜索', backButtonTitle: '关闭搜索',
                noResultsText: '没有找到结果',
                footer: { selectText: '打开', navigateText: '切换', closeText: '关闭' },
              },
            },
          },
          ja: {
            translations: {
              button: { buttonText: 'ドキュメントを検索', buttonAriaLabel: 'ドキュメントを検索' },
              modal: {
                displayDetails: '詳細を表示', resetButtonTitle: '検索をクリア', backButtonTitle: '検索を閉じる',
                noResultsText: '検索結果がありません',
                footer: { selectText: '開く', navigateText: '移動', closeText: '閉じる' },
              },
            },
          },
        },
      },
    },
  },
  locales: {
    root: buildLocale('', 'zh-CN', '简体中文', {
      description: '用于浏览器和 Node.js 的游戏王卡片渲染库',
      guide: '使用指南', install: '安装', resources: '静态资源', browser: '浏览器', node: 'Node.js',
      reference: 'API 参考', common: '公共 API', yugioh: '游戏王', rush: '超速决斗', back: '游戏王卡背',
      field: '场地中心卡', series2: '游戏王第 2 期', migration: '从 1.x 升级',
      edit: '在 GitHub 上编辑此页', outline: '本页目录', previous: '上一页', next: '下一页',
      menu: '菜单', top: '返回顶部', appearance: '外观', language: '语言',
    }),
    en: buildLocale('/en', 'en', 'English', {
      description: 'Render Yu-Gi-Oh! cards in the browser and Node.js',
      guide: 'Guide', install: 'Installation', resources: 'Assets', browser: 'Browser', node: 'Node.js',
      reference: 'API Reference', common: 'Shared API', yugioh: 'Yu-Gi-Oh!', rush: 'Rush Duel', back: 'Yu-Gi-Oh! Card Back',
      field: 'Field Center Card', series2: 'Yu-Gi-Oh! Series 2', migration: 'Upgrade from 1.x',
      edit: 'Edit this page on GitHub', outline: 'On this page', previous: 'Previous', next: 'Next',
      menu: 'Menu', top: 'Return to top', appearance: 'Appearance', language: 'Language',
    }),
    ja: buildLocale('/ja', 'ja', '日本語', {
      description: 'ブラウザと Node.js で遊戯王カードを描画するライブラリ',
      guide: 'ガイド', install: 'インストール', resources: '静的リソース', browser: 'ブラウザ', node: 'Node.js',
      reference: 'API リファレンス', common: '共通 API', yugioh: '遊戯王', rush: 'ラッシュデュエル', back: '遊戯王カードの裏面',
      field: 'フィールドセンターカード', series2: '遊戯王 第2期', migration: '1.x からの移行',
      edit: 'GitHub でこのページを編集', outline: 'このページの目次', previous: '前へ', next: '次へ',
      menu: 'メニュー', top: 'トップに戻る', appearance: '表示設定', language: '言語',
    }),
  },
  vite: {
    plugins: [
      viteStaticCopy({
        targets: [
          {
            src: '../src/assets/yugioh-card/**/*',
            dest: 'card-assets',
            rename: { stripBase: 3 },
          },
          {
            src: '../src/assets/image/banner.jpg',
            dest: '.',
            rename: { stripBase: 3 },
          },
        ],
      }),
    ],
  },
});
