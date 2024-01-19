
import Tesseract, { PSM, RecognizeResult, Rectangle } from "tesseract.js";
import { integerRects as integerRect, scaleRect } from "./grid";

const worker = await Tesseract.createWorker("eng", 1, {
  workerPath: "/node_modules/tesseract.js/dist/worker.min.js",
  corePath: "/node_modules/tesseract.js-core"
});
await worker.setParameters({
  tessedit_pageseg_mode: PSM.SINGLE_LINE
});

export type ImageBlobList = Array<string>;

export async function ocr_rects (
  rects: Rectangle[],
  img: string,
  progressCb?: (v: number)=>void
  ) {

  const results = new Array<string>();
  let i=0;
  let max = rects.length;
  let progress = 0;
  for (const rectangle of rects) {
    i++;
    progress = i/max;

    integerRect(rectangle);
    
    let res: RecognizeResult;
    try {
      res = await worker.recognize(img, {rectangle});
    } catch (ex) {
      console.warn(ex);
    }
    if (progressCb) {
      progressCb(progress);
    }
    results.push(
      res.data.text
    );
    
  }
  return results;
}
