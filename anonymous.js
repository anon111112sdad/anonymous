(() => {
  'use strict';
  const media = window.ANONYMOUS_VIDEOS;
  const grid = document.querySelector('#anonymous-grid');
  if (!media || !grid) return;

  const entries = [...media, ...(window.ANONYMOUS_DMD250_VIDEOS || [])];
  const category = item => item.category;
  const duration = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

  const groups = new Map();
  entries.forEach((item, index) => {
    const card = document.createElement('article');
    card.className = 'anonymous-video';
    card.dataset.category = category(item);
    card.dataset.group = item.group || '';
    const number = String(index + 1).padStart(2, '0');
    const video = document.createElement('video');
    video.controls = item.group !== 'comparison';
    video.playsInline = true;
    video.preload = 'none';
    video.poster = item.poster;
    video.hidden = true;
    video.setAttribute('controlslist', 'nofullscreen nodownload noremoteplayback');
    video.disablePictureInPicture = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('aria-label', item.title || `Anonymous video ${number}`);
    const preview = document.createElement('img');
    preview.className = 'anonymous-poster';
    preview.src = item.poster;
    preview.alt = `Preview of ${item.title || `video ${number}`}`;
    preview.loading = index < 6 ? 'eager' : 'lazy';
    preview.decoding = 'async';
    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'anonymous-play';
    play.setAttribute('aria-label', `Play ${item.title || `video ${number}`}`);
    play.innerHTML = '<span aria-hidden="true">&#9654;</span><span>Play</span>';
    const player = document.createElement('div');
    player.className = 'anonymous-player';
    video.addEventListener('loadeddata', () => { preview.hidden = true; });
    video.addEventListener('error', () => {
      video.hidden = true;
      preview.hidden = false;
      play.hidden = false;
    });
    play.addEventListener('click', () => {
      video.hidden = false;
      video.preload = 'auto';
      play.hidden = true;
      video.load();
      video.play().catch(() => {});
    });
    const source = document.createElement('source');
    source.src = item.src;
    source.type = 'video/mp4';
    video.append(source);
    player.append(video, preview, play);
    const caption = document.createElement('div');
    caption.className = 'anonymous-caption';
    const title = document.createElement('h2');
    title.textContent = item.title || `Video ${number}`;
    const length = document.createElement('span');
    length.textContent = duration(item.duration);
    caption.append(title, length);
    card.append(player, caption);
    if (!item.group) grid.append(card);
    else {
      let group = groups.get(item.group);
      if (!group) {
        group = document.createElement('div');
        group.className = `anonymous-group anonymous-group-${item.group}`;
        const heading = document.createElement('h2');
        heading.className = 'anonymous-group-title';
        heading.textContent = 'Engine controls';
        group.append(heading);
        grid.append(group);
        groups.set(item.group, group);
      }
      group.append(card);
    }
  });

  const filters = [...document.querySelectorAll('.anonymous-filter')];
  const cards = [...grid.querySelectorAll('.anonymous-video')];
  const count = document.querySelector('#anonymous-count');
  function update(filter) {
    let visible = 0;
    cards.forEach(card => {
      card.hidden = filter !== 'all' && card.dataset.category !== filter;
      if (!card.hidden) visible++;
    });
    groups.forEach(group => { group.hidden = [...group.querySelectorAll('.anonymous-video')].every(card => card.hidden); });
    count.textContent = `${visible} videos`;
  }
  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    update(button.dataset.filter);
  }));
  update('all');
})();
