import { Component, createRef, render } from 'preact';
import style from "./style.module.css";
import { useRef } from 'preact/hooks';
import { ocr_rects } from './ocr';
import { ImgTable } from './imgtable';

interface Props {

}
interface State {
  output?: string[];
  img?: HTMLImageElement;
  rowCount: number;
  colCount: number;
  whiteoutWidth: number;
  whiteoutHeight: number;
  tableStr?: string;
}

function selectElement(e: HTMLElement) {
  const range = document.createRange();
  const sel = window.getSelection();
  sel.removeAllRanges();
  try {
    range.selectNodeContents(e);
    sel.addRange(range);
  } catch (e) {
    range.selectNode(e);
    sel.addRange(range);
  }
}
function copyElement(e: HTMLElement) {
  selectElement(e);
  const text = window.getSelection().toString();
  try {
    navigator.clipboard.writeText(text);
    alert("Copied");
  } catch (ex) {
    alert(`Copy issue: ${ex}`);
  }
}
function copyText(str: string) {
  navigator.clipboard.writeText(str);
}
export function _2dTo1d(x: number, y: number, width: number) {
  return x + width * y;
}
export class Main extends Component<Props, State> {
  constructor() {
    super();
    this.state = {
      rowCount: 1,
      colCount: 1,
      whiteoutWidth: 0,
      whiteoutHeight: 0,
    };
  }

  renderTable() {
    const content = this.state.output;

    let col = 0;
    let row = 0;

    const rows = [];
    let cells = [];

    for (let i = 0; i < content.length; i++) {
      if (col >= this.state.colCount) {
        col = 0;
        row++;
        rows.push(<tr className={style.row}>{cells}</tr>);
        cells = [];
      }
      cells.push(<td className={style.cell}>{content[i]}</td>);

      col++;
    }
    rows.push(<tr className={style.row}>{cells}</tr>);

    const tableRef = useRef<HTMLTableElement>();
    return <div>
      <button onClick={() => {

        //impl 3
        const data = this.state.output;
        let text = "";
        for (let y = 0; y < this.state.rowCount; y++) {
          for (let x = 0; x < this.state.colCount; x++) {
            const idx = _2dTo1d(x, y, this.state.colCount);
            text += `${data[idx].trim()}\t`;
          }
          text += "\n";
        }
        copyText(text);

        //impl 2
        // copyElement(tableRef.current);


        //impl 1
        // let text = tableRef.current.innerText.trim();

        // try {
        //   navigator.clipboard.writeText(text);
        //   alert("Copied");
        // } catch (ex) {
        //   alert(`Copy issue: ${ex}`);
        // }
      }}>Copy Table</button>
      <table ref={tableRef} className={style.table}>
        {rows}
      </table>
    </div>
  }
  render() {
    const imgtblRef = createRef<ImgTable>();
    const genBtn = createRef<HTMLButtonElement>();

    return (
      <div className={style.main}>
        <div className={style.header}>
          <div className={style.menu_col}>

            <input type="file" onChange={(evt) => {
              const t = evt.target as HTMLInputElement;
              if (t.files.length < 1) return;
              const f = t.files[0];
              try {
                const img = new Image();
                const url = URL.createObjectURL(f);
                img.src = url;
                img.addEventListener("load", () => {
                  this.setState({ img });
                });
              } catch (ex) {
                alert(`Issue using file as image: ${ex}`);
              }
            }} />
            <button
              ref={genBtn}
              className={style.gen}
              onClick={() => {
                genBtn.current.disabled = true;
                const rects = imgtblRef.current.rects();
                const img = imgtblRef.current.img();

                ocr_rects(
                  rects,
                  img.src,
                  (v) => {
                    const p = Math.floor(v * 100);
                    if (p < 98) {
                      const bg = `linear-gradient(90deg, #082400 0%, #09793d ${p}%, #6c6c6c00 ${p + 5}%)`;
                      genBtn.current.style.background = bg;
                    } else {
                      genBtn.current.style.background = "unset";
                    }
                  }
                ).then((output) => {
                  genBtn.current.disabled = false;
                  this.setState({
                    output
                  });
                });
              }}>Generate</button>
          </div>
          <div className={style.menu_col}>
            <span># Rows</span>
            <input
              type="number"
              min="1"
              max="500"
              value={this.state.rowCount}
              onChange={(evt) => {
                const rowCount = (evt.target as HTMLInputElement).valueAsNumber;
                const diff = rowCount - this.state.rowCount;
                this.setState({
                  rowCount
                });
                if (diff > 0) {
                  imgtblRef.current.addRow();
                } else {
                  imgtblRef.current.removeRow();
                }
              }}
            />
          </div>
          <div className={style.menu_col}>

            <span className={style.col_item}># Columns</span>
            <input
              className={style.col_item}
              type="number"
              min="1"
              max="32"
              value={this.state.colCount}
              onChange={(evt) => {
                const colCount = (evt.target as HTMLInputElement).valueAsNumber;
                const diff = colCount - this.state.colCount;
                this.setState({
                  colCount
                });
                if (diff > 0) {
                  imgtblRef.current.addCol();
                } else {
                  imgtblRef.current.removeCol();
                }
              }}
            />
          </div>
          <div className={style.menu_col}>
            <span>Border Whiteout</span>
            <div className={style.menu_row}>
              <span>Height:</span>
              <input
                type="number"
                min="0"
                max="30"
                value={this.state.whiteoutHeight}
                onChange={(evt) => {
                  const whiteoutHeight = (evt.target as HTMLInputElement).valueAsNumber;
                  this.setState({
                    whiteoutHeight
                  });
                  imgtblRef.current.state.whiteout.h = whiteoutHeight;
                }}
              />
            </div>
            <div className={style.menu_row}>
              <span>Width:</span>
              <input
                type="number"
                min="0"
                max="30"
                value={this.state.whiteoutWidth}
                onChange={(evt) => {
                  const whiteoutWidth = (evt.target as HTMLInputElement).valueAsNumber;
                  this.setState({
                    whiteoutWidth
                  });
                  imgtblRef.current.state.whiteout.w = whiteoutWidth;
                }}
              />
            </div>
          </div>
        </div>
        <div className={style.tool}>
          <ImgTable
            ref={imgtblRef}
            img={this.state.img}
            colCount={this.state.colCount}
            rowCount={this.state.rowCount}
          />
          <div className={style.output}>
            {this.state.output && this.renderTable()}
          </div>
        </div>
      </div>
    );
  }
}

const app = document.getElementById("app");
app.className = style.app;
render(<Main />, app);
