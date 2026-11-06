/* Static file-safe deck. All runtime dependencies are bundled in vendor/. */
let speakerWindow;
const formatTime = seconds => `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;

function syncPresentation() {
  const slides = Reveal.getSlides();
  const slide = Reveal.getCurrentSlide();
  if (!slide) return;
  const index = Reveal.getIndices().h;
  const evidenceSlide = document.getElementById('slide-16');
  evidenceSlide.classList.toggle('has-evidence', Boolean(evidenceSlide.querySelector('.evidence.visible')));
  const retroSlide = document.getElementById('slide-21');
  retroSlide.classList.toggle('has-haesol', Boolean(retroSlide.querySelector('.haesol.visible')));
  retroSlide.classList.toggle('has-question', Boolean(retroSlide.querySelector('.retro-question.visible')));
  document.getElementById('position').textContent = `${String(index + 1).padStart(2, '0')} / ${slides.length}`;
  const fragments = [...slide.querySelectorAll('.fragment')];
  document.getElementById('previous').disabled = index === 0 && !fragments.some(item => item.classList.contains('visible'));
  document.getElementById('next').disabled = index === slides.length - 1 && fragments.every(item => item.classList.contains('visible'));
  if (!speakerWindow || speakerWindow.closed) return;
  const doc = speakerWindow.document;
  const elapsedPlan = slides.slice(0, index).reduce((sum, item) => sum + Number(item.dataset.timing), 0);
  doc.getElementById('heading').textContent = `${index + 1} / ${slides.length} · ${slide.dataset.title}`;
  doc.getElementById('timing').textContent = `이 장 ${slide.dataset.timing}초 · 계획 구간 ${formatTime(elapsedPlan)}–${formatTime(elapsedPlan + Number(slide.dataset.timing))}`;
  const stage = Math.max(0, (Reveal.getIndices().f ?? -1) + 1);
  const stageCount = new Set(fragments.map(item => item.dataset.fragmentIndex)).size;
  const notes = doc.getElementById('notes');
  const slideChanged = notes.dataset.slideId !== slide.id;
  const stageChanged = notes.dataset.stage !== String(stage);
  // Authored static HTML: spoken text and direction cues share the slide's fragment order.
  // Keep the current DOM while reading so scrolling and reference details stay open.
  if (slideChanged) {
    notes.innerHTML = slide.querySelector('.notes').innerHTML;
    notes.dataset.slideId = slide.id;
  }
  notes.dataset.stage = String(stage);
  const activeStep = notes.querySelector(`[data-step="${stage}"]`);
  notes.querySelectorAll('.script-step').forEach(item => {
    const active = item === activeStep;
    item.classList.toggle('is-current', active);
    if (active) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
  doc.getElementById('step').textContent = stage === 0
    ? `현재: 시작 화면 · 이 장의 클릭 ${stageCount}회`
    : `현재: 클릭 ${stage} / ${stageCount} 이후`;
  if (activeStep && (slideChanged || stageChanged)) {
    if (stage === 0) notes.scrollTop = 0;
    else notes.scrollTop += activeStep.getBoundingClientRect().top - notes.getBoundingClientRect().top - 12;
  }
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
  *{box-sizing:border-box}body{font:20px/1.7 sans-serif;background:#f3f0e7;color:#242522;margin:0;padding:20px;height:100vh;display:flex;flex-direction:column;overflow:hidden}
  h1{font-size:24px;line-height:1.4;color:#bd4021;margin:0 0 8px}h2{font-size:20px;margin:0 0 14px}p{margin:10px 0}li{margin-bottom:16px}
  button{font:inherit;padding:8px 18px;margin-right:12px;cursor:pointer}button:disabled{opacity:.4}button:focus-visible,a:focus-visible{outline:2px solid #bd4021;outline-offset:2px}a{color:#984026}
  #notes{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:12px 14px 24px 0}#notes:focus-visible{outline:2px solid #bd4021}
  #upcoming{border-top:1px solid #aaa;padding-top:10px;margin:6px 0 0;font-size:16px;flex-shrink:0}.meta{font-size:14px;color:#65695f;margin:4px 0}code{font-size:.9em}
  .speaker-toolbar{flex-shrink:0;border-bottom:1px solid #b6b7ae;padding-bottom:12px}#timing{font-size:16px;margin:4px 0}#step{font-size:17px;color:#984026;font-weight:bold}
  .script-step{padding:18px 22px;margin:16px 0;border-left:4px solid #b6b7ae;background:#eeeae0}
  .script-step.is-current{border-color:#bd4021;background:#fffdf7}.script-step.is-current h2::before{content:"현재 · ";color:#bd4021}
  .screen-cue,.stage-direction,.direction-intent{font-size:16px;color:#555b50;line-height:1.6}.direction-intent{padding:12px 0}
  .stage-direction{padding:10px 12px;background:#e9e6dc}.spoken{font-size:22px;line-height:1.85;word-break:keep-all}.next-cue{font-size:16px;font-weight:bold;color:#984026;border-top:1px solid #ddd5c7;padding-top:12px}
  .source-notes{font-size:16px;margin-top:24px}.source-notes summary{cursor:pointer}.source-notes p{font-size:16px}
  @media(max-height:600px){body{padding:10px}.speaker-toolbar h1{font-size:20px}.speaker-toolbar>.meta:first-of-type{display:none}.spoken{font-size:20px}}
  </style></head><body><header class="speaker-toolbar"><h1 id="heading"></h1><p class="meta">본편 ${formatTime(total)} + 현장 여유 40초 · ← / → / Space로 제어</p><p id="timing"></p><p id="step" class="meta" aria-live="polite"></p><button id="prev">← 이전</button><button id="advance">다음 →</button></header><div id="notes" tabindex="0" aria-label="현재 슬라이드 단계별 발표 대본"></div><p id="upcoming"></p></body></html>`);
  speakerWindow.document.close();
  speakerWindow.document.getElementById('prev').onclick = () => Reveal.prev();
  speakerWindow.document.getElementById('advance').onclick = () => Reveal.next();
  speakerWindow.onkeydown = event => {
    if (['A', 'INPUT', 'TEXTAREA', 'SELECT', 'SUMMARY'].includes(event.target.tagName)) return;
    if (event.target.tagName === 'BUTTON' && event.key === ' ') return;
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
