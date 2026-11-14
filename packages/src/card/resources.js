import { ImageManager, ImageEvent } from 'leafer-unified';
import { isBrowser } from '../utils/index.js';
import { fontFamilies } from '../utils/font-loader.js';
import { resourceError } from '../utils/resource-error.js';

// 只遍历实际参与本卡预览的节点，状态占位图不属于导出所需资源。
export const visitVisible = (card, visit) => {
  const walk = node => {
    if (node === card.imageStatusLeaf || !node.visible || node.opacity === 0) return;
    visit(node);
    node.children?.forEach(walk);
  };
  card.leafer.children.forEach(walk);
};

export const collectFonts = card => {
  const families = new Set();
  visitVisible(card, node => {
    if (node.tag === 'Text' && node.text !== '' && node.text != null) {
      fontFamilies(node.fontFamily).forEach(family => families.add(family));
    }
  });
  return families;
};

const collectImages = card => {
  const images = new Map();
  visitVisible(card, node => {
    for (const attr of ['fill', 'stroke']) {
      const paints = Array.isArray(node[attr]) ? node[attr] : [node[attr]];
      for (const paint of paints) {
        if (paint?.type !== 'image' || !paint.url || paint.visible === false || paint.opacity === 0) continue;
        let item = images.get(paint.url);
        if (!item) images.set(paint.url, item = { paint, targets: [] });
        item.targets.push({ node, attr });
      }
    }
  });
  return images;
};

/** 观察 Leafer 已有的图片加载，保留并释放自己的引用及回调。 */
export class CardImages {
  records = new Map();

  constructor(card, changed) {
    this.card = card;
    this.changed = changed;
  }

  sync(retry = false) {
    const required = collectImages(this.card);
    for (const [url, record] of this.records) {
      if (!required.has(url)) this.remove(url, record);
    }
    for (const [url, { paint, targets }] of required) {
      let record = this.records.get(url);
      if (!record) {
        const image = ImageManager.get(paint);
        record = { image, targets, status: 'loading', error: null, loadId: undefined };
        this.records.set(url, record);
        if (image.ready) {
          record.status = 'loaded';
          this.showStatus(record, ImageEvent.LOADED);
        } else if (image.error && !retry) {
          record.status = 'failed';
          record.error = resourceError('image', url, image.error);
        } else this.load(url, record);
      } else {
        record.targets = targets;
        if (record.image.ready) {
          if (record.status !== 'loaded') this.showStatus(record, ImageEvent.LOADED);
          record.status = 'loaded';
          record.error = null;
        } else if (retry && record.status === 'failed') this.load(url, record);
      }
    }
    if (this.card.imageStatusLeaf && ![...this.records.values()].some(record => record.targets.some(({ node }) => node === this.card.imageLeaf))) {
      this.card.imageStatusLeaf.visible = false;
    }
  }

  load(url, record) {
    const { image } = record;
    record.status = 'loading';
    record.error = null;
    // Leafer 会缓存失败；显式的新一轮更新才重试，不在错误回调中无限重试。
    image.error = null;
    this.showStatus(record, ImageEvent.LOAD);
    record.loadId = image.load(() => {
      if (this.records.get(url) !== record) return;
      record.loadId = undefined;
      record.status = 'loaded';
      record.targets.forEach(({ node, attr }) => node.forceUpdate(attr));
      this.showStatus(record, ImageEvent.LOADED);
      this.changed();
    }, cause => {
      if (this.records.get(url) !== record) return;
      record.loadId = undefined;
      record.status = 'failed';
      record.error = resourceError('image', url, cause);
      this.showStatus(record, ImageEvent.ERROR);
      this.changed();
    });
  }

  showStatus(record, status) {
    if (isBrowser && record.targets.some(({ node }) => node === this.card.imageLeaf)) {
      this.card.drawImageStatus(this.card.imageLeaf, status);
    }
  }

  remove(url, record) {
    this.records.delete(url);
    if (record.loadId !== undefined) record.image.unload(record.loadId);
    ImageManager.recycle(record.image);
  }

  destroy() {
    for (const [url, record] of this.records) this.remove(url, record);
  }
}
