(function () {
  'use strict';

  var canvas = document.getElementById('cosmic-particles');
  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  var ctx = canvas.getContext('2d');
  var particles = [];
  var width = 0;
  var height = 0;
  var pixelRatio = 1;
  var pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    active: false
  };
  var palette = [
    { r: 114, g: 247, b: 255 },
    { r: 143, g: 180, b: 255 },
    { r: 183, g: 140, b: 255 },
    { r: 255, g: 122, b: 182 },
    { r: 248, g: 215, b: 123 }
  ];

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function resize() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    createParticles();
  }

  function createParticles() {
    var count = Math.min(170, Math.max(86, Math.floor((width * height) / 9800)));
    particles = [];

    for (var i = 0; i < count; i += 1) {
      var color = palette[Math.floor(Math.random() * palette.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: random(-0.28, 0.28),
        vy: random(-0.22, 0.22),
        base: random(0.75, 1.85),
        alpha: random(0.46, 0.92),
        phase: Math.random() * Math.PI * 2,
        color: color
      });
    }
  }

  function updateParticle(particle) {
    var dx = pointer.x - particle.x;
    var dy = pointer.y - particle.y;
    var distanceSq = dx * dx + dy * dy;
    var radius = pointer.active ? 190 : 80;

    if (distanceSq < radius * radius) {
      var distance = Math.sqrt(distanceSq) || 1;
      var strength = (1 - distance / radius) * (pointer.active ? 0.055 : 0.012);
      particle.vx += (dx / distance) * strength;
      particle.vy += (dy / distance) * strength;
    }

    particle.phase += 0.01;
    particle.vx += Math.cos(particle.phase) * 0.0025;
    particle.vy += Math.sin(particle.phase * 0.8) * 0.002;
    particle.vx *= 0.992;
    particle.vy *= 0.992;
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < -30) particle.x = width + 30;
    if (particle.x > width + 30) particle.x = -30;
    if (particle.y < -30) particle.y = height + 30;
    if (particle.y > height + 30) particle.y = -30;
  }

  function rgba(color, alpha) {
    return 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', ' + alpha + ')';
  }

  function drawParticle(particle) {
    var pulse = Math.sin(particle.phase) * 0.22 + 0.92;
    var size = particle.base * pulse;

    ctx.fillStyle = rgba(particle.color, particle.alpha);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
    ctx.fill();

    if (particle.alpha > 0.58) {
      ctx.fillStyle = rgba(particle.color, 0.16);
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, size * 6.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawConnections() {
    for (var i = 0; i < particles.length; i += 1) {
      var a = particles[i];

      for (var j = i + 1; j < particles.length; j += 1) {
        var b = particles[j];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 118) {
          ctx.strokeStyle = 'rgba(164, 197, 255, ' + (0.16 * (1 - distance / 118)) + ')';
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
  }

  function drawPointerHalo() {
    if (!pointer.active) return;

    var glow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 150);
    glow.addColorStop(0, 'rgba(114, 247, 255, 0.12)');
    glow.addColorStop(0.42, 'rgba(143, 180, 255, 0.045)');
    glow.addColorStop(1, 'rgba(114, 247, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, 150, 0, Math.PI * 2);
    ctx.fill();
  }

  function tick() {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
    drawPointerHalo();
    ctx.globalCompositeOperation = 'lighter';

    for (var i = 0; i < particles.length; i += 1) {
      updateParticle(particles[i]);
      drawParticle(particles[i]);
    }

    drawConnections();
    window.requestAnimationFrame(tick);
  }

  function updatePointer(x, y, active) {
    pointer.x = x;
    pointer.y = y;
    pointer.active = active;
    document.documentElement.style.setProperty('--cursor-x', x + 'px');
    document.documentElement.style.setProperty('--cursor-y', y + 'px');
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', function (event) {
    updatePointer(event.clientX, event.clientY, true);
  });
  window.addEventListener('mouseleave', function () {
    pointer.active = false;
  });
  window.addEventListener('touchmove', function (event) {
    if (event.touches && event.touches[0]) {
      updatePointer(event.touches[0].clientX, event.touches[0].clientY, true);
    }
  }, { passive: true });

  resize();
  tick();
}());
