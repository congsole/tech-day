// Each entry is one manual scene. The opening scene is already on screen.
(() => {
  const scenes = [
    { day: '월요일', time: '10:03', author: 'A', line: '저 기능 구현 끝났어요! PR 올렸습니다. 확인 부탁드려요' },
    { day: '월요일', time: '10:04', author: 'B', line: '오 확인할게요! 잠시만요' },
    { day: '월요일', time: '10:04', status: 'B님이 오프라인 상태가 되었습니다.' },
    { day: '월요일', time: '16:47', jump: true, author: 'C', line: '지금 확인했습니다! 근데 이거 제가 작업한 부분이랑 충돌 나요' },
    { day: '월요일', time: '16:48', status: 'A님이 오프라인 상태가 되었습니다.' },
    { day: '화요일', time: '01:12', jump: true, author: 'C', line: '충돌 해결해서 다시 올렸어요. 리뷰 부탁드려요!', github: 'Pull request #42 — Review requested' },
    { day: '화요일', time: '09:32', jump: true, author: 'B', line: '어? 코드가 바뀌었네요? 어제 봤던 거랑 다른데요?' },
    { day: '화요일', time: '09:33', status: 'A님이 온라인 상태가 되었습니다.', online: true },
    { day: '화요일', time: '09:34', author: 'A', line: '아 이제 다 모였네요. 그럼 잠깐 얘기할까요?', status: 'B님이 오프라인 상태가 되었습니다.', ending: '세 명이 협업하는 데 필요한 것: 세 명이 동시에 존재하는 기적.' },
  ];
  const slide = document.getElementById('ep01');
  const thread = slide.querySelector('.ep-thread');

  function add(parent, tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    if (text) element.textContent = text;
    parent.append(element);
    return element;
  }

  scenes.forEach((scene, index) => {
    const group = add(thread, 'div', index ? 'ep-scene fragment' : 'ep-scene');
    if (index) group.dataset.fragmentIndex = index - 1;
    if (scene.jump || !index) add(group, 'div', 'ep-break', scene.day + ' · ' + scene.time);
    if (scene.author) {
      const row = add(group, 'div', 'ep-row');
      row.dataset.author = scene.author;
      add(row, 'span', 'ep-avatar', scene.author);
      const message = add(row, 'div', 'ep-message');
      add(message, 'div', 'ep-meta', '팀원 ' + scene.author + '  ·  ' + scene.time);
      add(message, 'p', 'ep-bubble', scene.line);
    }
    if (scene.status) {
      const notice = add(group, 'p', 'ep-status', scene.time + '  ·  ' + scene.status);
      if (scene.online) notice.classList.add('ep-online');
    }
    if (scene.github) {
      const notice = add(group, 'div', 'ep-github');
      add(notice, 'b', '', 'GitHub');
      add(notice, 'span', '', scene.github);
    }
    if (scene.ending) {
      group.classList.add('ep-finale');
      add(group, 'p', 'ep-ending', scene.ending);
    }
  });

  function updateClock() {
    if (Reveal.getCurrentSlide() !== slide) return;
    const index = thread.querySelectorAll('.fragment.visible').length;
    slide.querySelector('.ep-day').textContent = scenes[index].day;
    slide.querySelector('.ep-time').textContent = scenes[index].time;
    slide.querySelector('.ep-progress').textContent = '장면 ' + (index + 1) + ' / ' + scenes.length;
  }
  for (const event of ['ready', 'slidechanged', 'fragmentshown', 'fragmenthidden']) {
    Reveal.on(event, updateClock);
  }
})();
