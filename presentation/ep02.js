// One Reveal fragment per advance. Shared elements (especially the original
// comment) stay in the DOM so rewinding restores the same conversation.
(() => {
  const episode = document.getElementById('ep02');
  const parts = episode.querySelectorAll('[data-scenes]');
  const count = episode.querySelector('.scene-count');
  const total = 8;
  for (let index = 0; index < total - 1; index++) {
    const marker = document.createElement('span');
    marker.className = 'fragment scene-marker';
    marker.dataset.fragmentIndex = index;
    episode.append(marker);
  }

  function render() {
    const scene = String(1 + episode.querySelectorAll('.scene-marker.visible').length);
    episode.dataset.scene = scene;
    count.textContent = '장면 ' + scene + ' / ' + total;
    for (const part of parts) part.hidden = !part.dataset.scenes.split(' ').includes(scene);
  }

  render();
  for (const event of ['ready', 'slidechanged', 'fragmentshown', 'fragmenthidden']) {
    Reveal.on(event, () => { if (Reveal.getCurrentSlide() === episode) render(); });
  }
})();
