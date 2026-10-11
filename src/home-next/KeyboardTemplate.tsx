import { keyboardRows, type KeyLegend } from './keyboardLayout';

function Keycap({ id, width = 1, kind }: KeyLegend) {
  return <span data-key-id={id} className={`seamless-macbook__key${kind ? ` seamless-macbook__key--${kind}` : ''}`} style={{ flex: width }} />;
}
export default function KeyboardTemplate() {
  const bottom = keyboardRows[5];
  return <div className="seamless-macbook__keyboard">
    {keyboardRows.slice(0, 5).map((row, index) => <div className="seamless-macbook__key-row" key={index}>
      {row.map(key => <Keycap {...key} key={key.id} />)}
    </div>)}
    <div className="seamless-macbook__key-row">
      {bottom.slice(0, 7).map(key => <Keycap {...key} key={key.id} />)}
      <div className="seamless-macbook__arrows">
        <Keycap {...bottom[7]} />
        <span className="seamless-macbook__arrow-pair"><Keycap {...bottom[8]} /><Keycap {...bottom[9]} /></span>
        <Keycap {...bottom[10]} />
      </div>
    </div>
  </div>;
}
