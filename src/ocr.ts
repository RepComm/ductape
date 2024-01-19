
import Tesseract, { PSM, RecognizeResult, Rectangle } from "tesseract.js";

const worker = await Tesseract.createWorker("eng", 1, {
  workerPath: "/node_modules/tesseract.js/dist/worker.min.js",
  corePath: "/node_modules/tesseract.js-core"
});
await worker.setParameters({
  tessedit_pageseg_mode: PSM.SINGLE_LINE
});

export type ImageBlobList = Array<string>;

/**floor every value in obj o if it is a number*/
function floor_obj (o: any) {
  for (const key in o) {
    const value = o[key];
    if (typeof(value) === "number") {
      o[key] = Math.floor(value);
    }
  }
}

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

    floor_obj(rectangle);
    
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
