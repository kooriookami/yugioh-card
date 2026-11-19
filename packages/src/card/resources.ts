import type { IImagePaint, ILeaferImage, IUI, IText } from '@leafer-ui/interface';
import { ImageManager, ImageEvent } from 'leafer-unified';
import { isBrowser } from '../utils/index.ts';
import { fontFamilies } from '../utils/font-loader.ts';
import { resourceError, type ResourceError } from '../utils/resource-error.ts';
import type { Card } from './index.ts';

type PaintAttr = 'fill' | 'stroke';
interface ImageTarget {
  node: IUI;
  attr: PaintAttr;
}

export type ImageRequirements = Map<string, { paint: IImagePaint; targets: ImageTarget[] }>;

interface ImageRecord {
  image: ILeaferImage;
  targets: ImageTarget[];
  status: 'loading' | 'loaded' | 'failed';
  error: ResourceError | null;
  loadId: number | undefined;
}

type CardResources = Pick<Card, 'leafer' | 'artworkStatusNode' | 'artworkNode' | 'drawArtworkStatus'>;

// 只遍历实际参与本卡预览的节点，状态占位图不属于导出所需资源。
export const visitVisible = (card: CardResources, visit: (node: IUI) => void) => {
  const walk = (node: IUI) => {
    if (node === card.artworkStatusNode || !node.visible || node.opacity === 0) return;
    visit(node);
    node.children?.forEach(walk);
  };
  card.leafer!.children.forEach(walk);
};

const collectNodeFonts = (node: IUI, families: Set<string>) => {
  if (node.tag === 'Text') {
    const { text, fontFamily } = node as IText;
    if (text !== '' && text != null) fontFamilies(fontFamily).forEach(family => families.add(family));
  }
};

const collectNodeImages = (node: IUI, images: ImageRequirements) => {
  for (const attr of ['fill', 'stroke'] as const) {
    const value = node[attr];
    const paints = Array.isArray(value) ? value : [value];
    for (const paint of paints) {
      if (!paint || typeof paint === 'string' || paint.type !== 'image' || !paint.url || paint.visible === false || paint.opacity === 0) continue;
      let item = images.get(paint.url);
      if (!item) images.set(paint.url, item = { paint, targets: [] });
      item.targets.push({ node, attr });
    }
  }
};

export const collectFonts = (card: CardResources) => {
  const families = new Set<string>();
  visitVisible(card, node => collectNodeFonts(node, families));
  return families;
};

const collectImages = (card: CardResources) => {
  const images: ImageRequirements = new Map();
  visitVisible(card, node => collectNodeImages(node, images));
  return images;
};

/** 同一轮绘制后的字体和图片依赖通过一次可见节点遍历获取。 */
export const collectResources = (card: CardResources) => {
  const fonts = new Set<string>();
  const images: ImageRequirements = new Map();
  visitVisible(card, node => { collectNodeFonts(node, fonts); collectNodeImages(node, images); });
  return { fonts, images };
};

/** 观察 Leafer 已有的图片加载，保留并释放自己的引用及回调。 */
export class CardImages {
  records = new Map<string, ImageRecord>();
  declare card: CardResources;
  declare changed: () => void;

  constructor(card: CardResources, changed: () => void) {
    this.card = card;
    this.changed = changed;
  }

  sync(retry = false, required = collectImages(this.card)) {
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
    if (this.card.artworkStatusNode && ![...this.records.values()].some(record => record.targets.some(({ node }) => node === this.card.artworkNode))) {
      this.card.artworkStatusNode.visible = false;
    }
  }

  load(url: string, record: ImageRecord) {
    const { image } = record;
    record.status = 'loading';
    record.error = null;
    // Leafer 会缓存失败；显式的新一轮更新才重试，不在错误回调中无限重试。
    (image as { error: ILeaferImage['error'] | null }).error = null;
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

  showStatus(record: ImageRecord, status: string) {
    const artworkNode = this.card.artworkNode;
    if (isBrowser && artworkNode && record.targets.some(({ node }) => node === artworkNode)) {
      this.card.drawArtworkStatus(artworkNode, status);
    }
  }

  remove(url: string, record: ImageRecord) {
    this.records.delete(url);
    if (record.loadId !== undefined) record.image.unload(record.loadId);
    ImageManager.recycle(record.image);
  }

  destroy() {
    for (const [url, record] of this.records) this.remove(url, record);
  }
}
