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
      if (item.group === 'comparison') {
        grid.querySelector('.anonymous-sync-toggle')?.click();
        return;
      }
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
    const groupIndex = item.group ? entries.slice(0, index).filter(entry => entry.group === item.group).length : -1;
    title.textContent = item.title || (item.group === 'comparison' ? `Video ${number} - ${groupIndex === 0 ? 'A' : 'B'}` : `Video ${number}`);
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
        heading.textContent = item.group === 'engine' ? 'Videos 14-16' : 'Videos 17-18 · Synchronized comparison';
        group.append(heading);
        grid.append(group);
        groups.set(item.group, group);
      }
      group.append(card);
    }
  });

  const comparisonGroup = groups.get('comparison');
  if (comparisonGroup) {
    const videos = [...comparisonGroup.querySelectorAll('video')];
    const controls = document.createElement('div');
    controls.className = 'anonymous-sync-controls';
    controls.innerHTML = '<button type="button" class="anonymous-sync-toggle" aria-label="Play videos 17 and 18 together">Play together</button><input type="range" min="0" max="14" step="0.05" value="0" aria-label="Synchronized comparison position"><span class="anonymous-sync-time" aria-live="off">0:00 / 0:14</span>';
    comparisonGroup.append(controls);
    const toggle = controls.querySelector('button');
    const seek = controls.querySelector('input');
    const clock = controls.querySelector('.anonymous-sync-time');
    const formatTime = value => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
    let requestedPlay = false;
    const master = videos[0];
    const updateClock = () => {
      const current = Number.isFinite(master.currentTime) ? master.currentTime : 0;
      const end = Math.max(0, ...videos.map(video => Number.isFinite(video.duration) ? video.duration : 0));
      seek.max = end || 14;
      seek.value = current;
      clock.textContent = `${formatTime(current)} / ${formatTime(end || 14)}`;
    };
    const setPlaying = async playing => {
      requestedPlay = playing;
      toggle.textContent = playing ? 'Pause together' : 'Play together';
      toggle.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} videos 17 and 18 together`);
      if (!playing) {
        videos.forEach(video => video.pause());
        return;
      }
      if (master.ended) videos.forEach(video => { video.currentTime = 0; });
      videos.forEach(video => {
        video.hidden = false;
        const player = video.closest('.anonymous-player');
        player.querySelector('.anonymous-play').hidden = true;
        if (video.dataset.initialized !== 'true') {
          video.preload = 'auto';
          video.load();
          video.dataset.initialized = 'true';
        }
      });
      const results = await Promise.allSettled(videos.map(video => video.play()));
      if (results.some(result => result.status === 'rejected')) setPlaying(false);
    };
    toggle.addEventListener('click', () => setPlaying(!requestedPlay));
    let pendingSeek = null;
    seek.addEventListener('input', () => {
      pendingSeek = Number(seek.value);
      videos.forEach(video => {
        if (video.readyState >= 1) video.currentTime = pendingSeek;
        else video.load();
      });
      updateClock();
    });
    videos.forEach(video => video.addEventListener('loadedmetadata', () => {
      if (pendingSeek !== null) video.currentTime = pendingSeek;
      updateClock();
    }));
    master.addEventListener('timeupdate', () => {
      videos.slice(1).forEach(video => {
        if (video.readyState >= 2 && Math.abs(video.currentTime - master.currentTime) > 0.15) video.currentTime = master.currentTime;
      });
      updateClock();
    });
    master.addEventListener('seeking', () => videos.slice(1).forEach(video => {
      if (video.readyState >= 1) video.currentTime = master.currentTime;
    }));
    master.addEventListener('pause', () => { if (requestedPlay && !master.ended) setPlaying(false); });
    master.addEventListener('ended', () => setPlaying(false));
    updateClock();
  }

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
