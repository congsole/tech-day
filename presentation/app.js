/* Static file-safe deck. All runtime dependencies are bundled in vendor/. */
let speakerWindow;
const formatTime = seconds => `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;

function syncPresentation() {
  const slides = Reveal.getSlides();
  const slide = Reveal.getCurrentSlide();
  if (!slide) return;
  const index = Reveal.getIndices().h;
  const evidenceSlide = document.getElementById('slide-8');
  evidenceSlide.classList.toggle('has-evidence', Boolean(evidenceSlide.querySelector('.evidence.visible')));
  document.getElementById('position').textContent = `${String(index + 1).padStart(2, '0')} / ${slides.length}`;
  const fragments = [...slide.querySelectorAll('.fragment')];
  document.getElementById('previous').disabled = index === 0 && !fragments.some(item => item.classList.contains('visible'));
  document.getElementById('next').disabled = index === slides.length - 1 && fragments.every(item => item.classList.contains('visible'));
  if (!speakerWindow || speakerWindow.closed) return;
  const doc = speakerWindow.document;
  const elapsedPlan = slides.slice(0, index).reduce((sum, item) => sum + Number(item.dataset.timing), 0);
  doc.getElementById('heading').textContent = `${index + 1} / ${slides.length} · ${slide.dataset.title}`;
  doc.getElementById('timing').textContent = `이 장 ${slide.dataset.timing}초 · 계획 구간 ${formatTime(elapsedPlan)}–${formatTime(elapsedPlan + Number(slide.dataset.timing))}`;
  doc.getElementById('step').textContent = `순차 등장 ${fragments.filter(item => item.classList.contains('visible')).length} / ${fragments.length}`;
  // Notes are trusted static HTML authored in this project's index.html.
  doc.getElementById('notes').innerHTML = slide.querySelector('.notes').innerHTML;
  doc.getElementById('upcoming').textContent = slides[index + 1] ? `다음: ${slides[index + 1].dataset.title}` : '마지막 장 · 질문을 남기고 감사 인사';
  doc.getElementById('prev').disabled = document.getElementById('previous').disabled;
  doc.getElementById('advance').disabled = document.getElementById('next').disabled;
}

function openNotes() {
  if (speakerWindow && !speakerWindow.closed) { speakerWindow.focus(); return; }
  speakerWindow = window.open('', 'techday-speaker', 'width=900,height=800');
  if (!speakerWindow) { window.alert('발표자 노트를 열려면 이 파일의 팝업을 허용한 뒤 다시 눌러 주세요.'); return; }
  const total = Reveal.getSlides().reduce((sum, slide) => sum + Number(slide.dataset.timing), 0);
  speakerWindow.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>겸상 · 발표자 노트</title><style>
  body{font:20px/1.7 sans-serif;background:#f3f0e7;color:#242522;margin:30px}h1{font-size:27px;line-height:1.4;color:#bd4021}li{margin-bottom:16px}button{font:inherit;padding:8px 18px;margin-right:12px}a{color:#984026}#upcoming{border-top:1px solid #aaa;padding-top:16px}.meta{font-size:16px;color:#65695f}code{font-size:.9em}
  </style></head><body><h1 id="heading"></h1><p class="meta">본편 ${formatTime(total)} + 현장 여유 30초 · ← / → / Space로 제어</p><p id="timing"></p><p id="step" class="meta"></p><button id="prev">← 이전</button><button id="advance">다음 →</button><div id="notes"></div><p id="upcoming"></p></body></html>`);
  speakerWindow.document.close();
  speakerWindow.document.getElementById('prev').onclick = () => Reveal.prev();
  speakerWindow.document.getElementById('advance').onclick = () => Reveal.next();
  speakerWindow.onkeydown = event => {
    if (['BUTTON', 'A', 'INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;
    if (['ArrowRight', ' ', 'ArrowLeft'].includes(event.key)) {
      event.preventDefault();
      if (event.key === 'ArrowLeft') Reveal.prev(); else Reveal.next();
    }
  };
  syncPresentation();
}

Reveal.initialize({
  width: 1280, height: 720, margin: 0.08, center: false,
  hash: true, controls: false, progress: true, touch: true,
  transition: 'fade', transitionSpeed: 'fast',
  keyboard: {83: openNotes}, autoSlide: 0,
}).then(syncPresentation);
['slidechanged', 'fragmentshown', 'fragmenthidden'].forEach(event => Reveal.on(event, syncPresentation));
document.getElementById('notes-button').addEventListener('click', openNotes);
document.getElementById('previous').addEventListener('click', () => Reveal.prev());
document.getElementById('next').addEventListener('click', () => Reveal.next());
window.addEventListener('pagehide', () => { if (speakerWindow && !speakerWindow.closed) speakerWindow.close(); });
