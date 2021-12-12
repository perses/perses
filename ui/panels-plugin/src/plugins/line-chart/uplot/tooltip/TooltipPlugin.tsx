import { usePlotContext } from '../UPlotContext';
import { useGraphCursorPosition, useOverlappingSeries } from './graph-cursor';
import TooltipContent from './TooltipContent';

/**
 * Listens for update to current Cursor position and renders a Tooltip with the relevant data
 */
function TooltipPlugin() {
  const { data, getSeries } = usePlotContext();
  const cursor = useGraphCursorPosition();
  const focusedSeries = useOverlappingSeries(cursor, getSeries(), data);

  if (!cursor) {
    return null;
  }

  const { focusedSeriesIdx, focusedPointIdx, coords } = cursor;
  if (!focusedPointIdx || !focusedSeriesIdx) {
    return null;
  }

  const x = data[0][focusedPointIdx] ?? 0;
  return <TooltipContent top={coords.plotCanvas.y} left={coords.plotCanvas.x} x={x} focusedSeries={focusedSeries} />;
}

export default TooltipPlugin;
