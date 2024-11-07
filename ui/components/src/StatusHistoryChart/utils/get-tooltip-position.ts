// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getTooltipPosition = (point: [number, number], params: any, dom: any, rect: any, size: any) => {
  // calculate the position to avoid overflow
  const [x, y] = point;
  const { contentSize, viewSize } = size;

  const posX = x + contentSize[0] > viewSize[0] ? x - contentSize[0] : x;
  const posY = y + contentSize[1] > viewSize[1] ? y - contentSize[1] : y;

  return [posX, posY];
};
