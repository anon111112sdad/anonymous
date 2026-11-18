(() => {
  'use strict';
  const entries = window.ANONYMOUS_COMPARISONS || [];
  const grid = document.querySelector('#comparison-grid');
  if (!grid || !entries.length) return;
  const descriptions = {
    vdot: 'Three 5-second paired clips and one 30-second synthetic-world comparison. Left: VDOT. Right: ours. Each pair uses the same source, initial reference, prompt, and depth trajectory, with 4 sampling steps for VDOT and 8 for ours. The 30-second example uses rolling reference images for VDOT and history projection for ours. All videos play at their original speed.',
    training: 'Matched inputs and noise, with 8 sampling steps in both panels. Left: before additional training (DMD0). Right: after 250 training updates (DMD250). Each clip preserves the complete 14.375-second output.',
    continuation: 'Matched 30-second outputs with the same first window, depth, prompt, and sampling budget. Left: full per-step history projection. Right: boundary-image-only continuation. Differences appear after the shared first window (14.375s).'
  };
  entries.forEach(item => {
    const card = document.createElement('article');
    card.className = 'comparison-card';
    card.dataset.comparison = item.group;
    const header = document.createElement('div');
    header.className = 'comparison-card-heading';
    const title = document.createElement('h3');
    title.textContent = item.title;
    const length = document.createElement('span');
    length.textContent = `${Number(item.duration.toFixed(3))}s`;
    header.append(title, length);
    const player = document.createElement('div');
    player.className = 'comparison-player';
    const video = document.createElement('video');
    video.controls = false;
    video.playsInline = true;
    video.preload = 'none';
    video.poster = item.poster;
    video.setAttribute('aria-label', `${item.title}: ${item.labels.join(' versus ')}`);
    video.setAttribute('controlslist', 'nodownload noremoteplayback');
    video.disablePictureInPicture = true;
    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'anonymous-play';
    play.textContent = '▶ Play comparison';
    play.setAttribute('aria-label', `Play ${item.title}: ${item.labels.join(' versus ')}`);
    play.addEventListener('click', () => {
      if (!video.getAttribute('src')) video.src = item.src;
      video.controls = true;
      play.hidden = true;
      video.play().catch(() => { video.controls = false; play.hidden = false; });
    });
    video.addEventListener('play', () => {
      grid.querySelectorAll('video').forEach(other => { if (other !== video) other.pause(); });
      play.hidden = true;
    });
    video.addEventListener('error', () => {
      play.textContent = 'Retry playback';
      play.hidden = false;
      video.removeAttribute('src');
      video.load();
    });
    const labels = document.createElement('div');
    labels.className = 'comparison-labels';
    item.labels.forEach(label => {
      const text = document.createElement('span');
      text.textContent = label;
      labels.append(text);
    });
    player.append(video, play);
    card.append(header, player, labels);
    grid.append(card);
  });
  const buttons = [...document.querySelectorAll('.comparison-filter')];
  function select(group) {
    buttons.forEach(button => {
      const active = button.dataset.comparison === group;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    grid.querySelectorAll('.comparison-card').forEach(card => {
      card.hidden = card.dataset.comparison !== group;
      if (card.hidden) card.querySelector('video').pause();
    });
    document.querySelector('#comparison-description').textContent = descriptions[group];
  }
  buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.comparison)));
  select('vdot');
})();
