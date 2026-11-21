// Moonlit Post — everything drawn on the canvas: the moonlit garden, the
// lantern cones, the courier and sentries, the HUD, and the title and
// end-of-level overlays. World coordinates are garden pixels; the painter
// shifts them down by the HUD strip height.

import { TILE, COLS, ROWS, HUD_H, VIEW_W, VIEW_H, PALETTE, TILE_CHARS } from './settings.js';
import { conePolygon } from './sight.js';
import { SENTRY_MODES } from './sentries.js';

function drawTile(ctx, ch, col, row) {
  const x = col * TILE;
  const y = row * TILE;
  // Moonlit grass with mow stripes.
  ctx.fillStyle = (col + row) % 2 === 0 ? PALETTE.grassA : PALETTE.grassB;
  ctx.fillRect(x, y, TILE, TILE);

  if (ch === TILE_CHARS.WALL) {
    ctx.fillStyle = PALETTE.wallStone;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(x, y, TILE, 7);
    ctx.strokeStyle = 'rgba(10, 15, 30, 0.35)';
    ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
  } else if (ch === TILE_CHARS.HEDGE) {
    ctx.fillStyle = PALETTE.hedgeDark;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = PALETTE.hedgeLight;
    ctx.beginPath();
    ctx.arc(x + 9, y + 11, 7, 0, Math.PI * 2);
    ctx.arc(x + 22, y + 9, 6, 0, Math.PI * 2);
    ctx.arc(x + 16, y + 20, 8, 0, Math.PI * 2);
    ctx.arc(x + 26, y + 23, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (ch === TILE_CHARS.CRATE) {
    ctx.fillStyle = PALETTE.crateWood;
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    ctx.strokeStyle = PALETTE.crateEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 3);
    ctx.lineTo(x + TILE - 3, y + TILE - 3);
    ctx.moveTo(x + TILE - 3, y + 3);
    ctx.lineTo(x + 3, y + TILE - 3);
    ctx.stroke();
    ctx.lineWidth = 1;
  } else if (ch === TILE_CHARS.POND) {
    ctx.fillStyle = PALETTE.pondDeep;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = PALETTE.pondShine;
    ctx.beginPath();
    ctx.arc(x + 11, y + 12, 5, 0.3, 2.4);
    ctx.arc(x + 22, y + 22, 4, 0.3, 2.4);
    ctx.stroke();
  }
}

function drawGarden(ctx, grid) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      drawTile(ctx, grid[row][col], col, row);
    }
  }
}

function drawGate(ctx, gate, time) {
  const pulse = 0.75 + 0.25 * Math.sin(time * 2.4);
  ctx.save();
  ctx.translate(gate.x, gate.y);
  ctx.fillStyle = PALETTE.gateGlow;
  ctx.beginPath();
  ctx.arc(0, 0, 26 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.gateGold;
  ctx.fillRect(-11, -14, 22, 28);
  ctx.fillStyle = '#8a6a1f';
  ctx.fillRect(-11, -14, 22, 5);
  ctx.fillRect(-2, -14, 4, 28);
  ctx.fillStyle = '#fff7dd';
  ctx.font = 'bold 8px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('POST', 0, 3);
  ctx.restore();
}

function drawCone(ctx, grid, sentry, alarmed) {
  const points = conePolygon(grid, sentry.x, sentry.y, sentry.facing);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = alarmed ? PALETTE.lanternGlowHot : PALETTE.lanternGlow;
  ctx.fill();
}

function drawSentry(ctx, sentry) {
  ctx.save();
  ctx.translate(sentry.x, sentry.y);
  // Lantern held out front.
  const lx = Math.cos(sentry.facing) * 13;
  const ly = Math.sin(sentry.facing) * 13;
  ctx.fillStyle = '#ffdf8a';
  ctx.beginPath();
  ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a6a1f';
  ctx.stroke();
  // Coat and cap.
  ctx.fillStyle = PALETTE.sentryCoat;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.sentryTrim;
  ctx.beginPath();
  ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Mood marker: ? while suspicious, ! while chasing or searching.
  let marker = null;
  if (sentry.mode === SENTRY_MODES.SUSPICIOUS) marker = '?';
  if (sentry.mode === SENTRY_MODES.CHASE || sentry.mode === SENTRY_MODES.SEARCH) marker = '!';
  if (marker) {
    ctx.fillStyle = marker === '!' ? PALETTE.meterAlarm : PALETTE.meterWarn;
    ctx.font = 'bold 17px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(marker, sentry.x, sentry.y - 16);
  }
}

function drawCourier(ctx, courier) {
  ctx.save();
  ctx.translate(courier.x, courier.y);
  const bob = courier.moving ? Math.sin(courier.stepPhase * Math.PI) * 1.4 : 0;
  ctx.translate(0, bob * 0.4);
  // Cloak.
  ctx.fillStyle = PALETTE.courierCloak;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  // Satchel slung toward the facing side.
  const sx = Math.cos(courier.facing + 2.2) * 8;
  const sy = Math.sin(courier.facing + 2.2) * 8;
  ctx.fillStyle = PALETTE.courierTrim;
  ctx.fillRect(sx - 4, sy - 3, 8, 6);
  // Hood.
  ctx.fillStyle = '#5a3ec9';
  ctx.beginPath();
  ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHud(ctx, state) {
  ctx.fillStyle = PALETTE.nightSky;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = PALETTE.hudInk;
  ctx.font = '16px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(state.levelName, 14, 20);
  ctx.font = '12px Georgia, serif';
  ctx.fillText('WASD / arrows: move    Shift: sneak    R: restart level', 14, 39);

  ctx.textAlign = 'right';
  ctx.font = '16px Georgia, serif';
  ctx.fillText(`Letters delivered: ${state.delivered} / ${state.levelCount}`, VIEW_W - 14, 20);
  ctx.font = '12px Georgia, serif';
  const status = state.alarm.active ? 'ALARM — break their line of sight!' : 'Reach the golden POST gate unseen';
  ctx.fillStyle = state.alarm.active ? PALETTE.meterAlarm : PALETTE.hudInk;
  ctx.fillText(status, VIEW_W - 14, 39);

  // Detection meter, centred.
  const meterW = 260;
  const meterX = (VIEW_W - meterW) / 2;
  ctx.fillStyle = '#232c47';
  ctx.fillRect(meterX, 14, meterW, 12);
  const m = Math.max(0, Math.min(1, state.meter));
  ctx.fillStyle = m > 0.75 ? PALETTE.meterAlarm : m > 0.45 ? PALETTE.meterWarn : PALETTE.meterCalm;
  ctx.fillRect(meterX, 14, meterW * m, 12);
  ctx.strokeStyle = PALETTE.hudInk;
  ctx.strokeRect(meterX + 0.5, 14.5, meterW - 1, 11);
  ctx.fillStyle = PALETTE.hudInk;
  ctx.font = '11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('DETECTION', VIEW_W / 2, 39);
}

function drawOverlay(ctx, title, lines) {
  ctx.fillStyle = 'rgba(6, 9, 20, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = PALETTE.hudInk;
  ctx.textAlign = 'center';
  ctx.font = '44px Georgia, serif';
  ctx.fillText(title, VIEW_W / 2, 300);
  ctx.font = '18px Georgia, serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, 344 + i * 26);
  });
}

// Draw one whole frame of the game.
export function drawFrame(ctx, state) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.save();
  ctx.translate(0, HUD_H);
  drawGarden(ctx, state.grid);
  drawGate(ctx, state.gate, state.time);
  for (const sentry of state.sentries) {
    drawCone(ctx, state.grid, sentry, state.alarm.active);
  }
  for (const sentry of state.sentries) {
    drawSentry(ctx, sentry);
  }
  drawCourier(ctx, state.courier);
  ctx.restore();
  drawHud(ctx, state);

  if (state.phase === 'title') {
    drawOverlay(ctx, 'Moonlit Post', [
      'You are the night courier. Cross each moonlit garden and reach',
      'the golden POST gate without being caught in lantern light.',
      'Hedges and crates block the light. Ponds do not.',
      'Sneak with Shift to slip past. Break line of sight to cool the alarm.',
      '',
      'Press Enter to begin',
    ]);
  } else if (state.phase === 'caught') {
    drawOverlay(ctx, 'Caught!', [
      'A sentry grabbed your satchel strap.',
      '',
      'Press Enter to try this garden again',
    ]);
  } else if (state.phase === 'levelComplete') {
    drawOverlay(ctx, 'Letter delivered', [
      `${state.levelName} — crossed unseen.`,
      '',
      'Press Enter for the next garden',
    ]);
  } else if (state.phase === 'gameComplete') {
    drawOverlay(ctx, 'All letters delivered', [
      'Every garden crossed, every letter posted.',
      'The estate sleeps on, none the wiser.',
      '',
      'Press Enter to play again',
    ]);
  }
}
