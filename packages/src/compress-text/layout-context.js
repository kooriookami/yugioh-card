let context = null;

export const getTextLayoutContext = () => context;

/** 内置卡片的 draw 是同步的；恢复上下文，避免影响独立使用的 CompressText。 */
export const withTextLayoutContext = (value, draw) => {
  const previous = context;
  context = value;
  try {
    return draw();
  } finally {
    context = previous;
  }
};
