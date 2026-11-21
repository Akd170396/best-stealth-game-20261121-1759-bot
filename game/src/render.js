// Rendering: everything drawn on the canvas. The night vault is drawn dark so
// the guards' lantern cones read as the dangerous light, crates read as cover,
// and the green exit door and cyan gem are findable at a glance. Cones are
// drawn from the raycast polygons in guards.js, so what you see is exactly
// what can see you.

import { COLOURS, GUARD, PLAYER, VIEW } from './config.js';
import { visionConePolygon } from './guards.js';

const TILE = VIEW.tile;

export function playfieldOffset(level) {
  return {
    x: Math.round((VIEW.width - level.widthPx) / 2),
    y: VIEW.hudTop + Math.round((VIEW.height - VIEW.hudTop - level.heightPx) / 2),
  };
}

function drawFloor(ctx, level, off) {
  for (let row = 0; row < level.rows; row++) {
    for (let col = 0; col < level.cols; col++) {
      const ch = level.grid[row][col];
      const x = off.x + col * TILE;
      const y = off.y + row * TILE;
      if (ch === '#') continue;
      ctx.fillStyle = (col + row) % 2 === 0 ? COLOURS.floorA : COLOURS.floorB;
      ctx.fillRect(x, y, TILE, TILE);
      if (ch === 'r') {
        ctx.fillStyle = COLOURS.rug;
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
      }
    }
  }
  ctx.strokeStyle = COLOURS.floorLine;
  ctx.lineWidth = 1;
  for (let col = 0; col <= level.cols; col++) {
    ctx.beginPath();
    ctx.moveTo(off.x + col * TILE, off.y);
    ctx.lineTo(off.x + col * TILE, off.y + level.heightPx);
    ctx.stroke();
  }
  for (let row = 0; row <= level.rows; row++) {
    ctx.beginPath();
    ctx.moveTo(off.x, off.y + row * TILE);
    ctx.lineTo(off.x + level.widthPx, off.y + row * TILE);
    ctx.stroke();
  }
}

function drawWallsAndCrates(ctx, level, off) {
  for (let row = 0; row < level.rows; row++) {
    for (let col = 0; col < level.cols; col++) {
      const ch = level.grid[row][col];
      const x = off.x + col * TILE;
      const y = off.y + row * TILE;
      if (ch === '#') {
        ctx.fillStyle = COLOURS.wall;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = COLOURS.wallTop;
        ctx.fillRect(x, y, TILE, 9);
        ctx.strokeStyle = COLOURS.wallEdge;
        ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      } else if (ch === 'C') {
        ctx.fillStyle = COLOURS.crate;
        ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
        ctx.fillStyle = COLOURS.crateTop;
        ctx.fillRect(x + 2, y + 2, TILE - 4, 10);
        ctx.strokeStyle = COLOURS.crateLine;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 3);
        ctx.lineTo(x + TILE - 3, y + TILE - 3);
        ctx.moveTo(x + TILE - 3, y + 3);
        ctx.lineTo(x + 3, y + TILE - 3);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }
  }
}

function drawExit(ctx, level, off, open, time) {
  const e = level.exit;
  if (!e) return;
  const x = off.x + e.col * TILE;
  const y = off.y + e.row * TILE;
  const pulse = 0.65 + 0.35 * Math.sin(time * 3);
  ctx.fillStyle = open ? COLOURS.exit : '#1d7a4c';
  ctx.globalAlpha = open ? pulse : 1;
  ctx.fillRect(x + 4, y + 2, TILE - 8, TILE - 4);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#b8ffd9';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 4, y + 2, TILE - 8, TILE - 4);
  ctx.lineWidth = 1;
  ctx.fillStyle = '#eafff3';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', x + TILE / 2, y + TILE / 2 + 4);
}

function drawGem(ctx, level, off, time) {
  const g = level.gem;
  if (!g || g.taken) return;
  const x = off.x + g.x;
  const y = off.y + g.y + Math.sin(time * 2.4) * 2;
  const glow = ctx.createRadialGradient(x, y, 2, x, y, 26);
  glow.addColorStop(0, 'rgba(83, 224, 255, 0.5)');
  glow.addColorStop(1, 'rgba(83, 224, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 26, y - 26, 52, 52);
  ctx.fillStyle = COLOURS.gem;
  ctx.beginPath();
  ctx.moveTo(x, y - 11);
  ctx.lineTo(x + 8, y - 2);
  ctx.lineTo(x, y + 11);
  ctx.lineTo(x - 8, y - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLOURS.gemCore;
  ctx.beginPath();
  ctx.moveTo(x, y - 6);
  ctx.lineTo(x + 4, y - 1);
  ctx.lineTo(x, y + 5);
  ctx.lineTo(x - 4, y - 1);
  ctx.closePath();
  ctx.fill();
}

function drawCone(ctx, guard, level, off, detection) {
  const poly = visionConePolygon(guard, level);
  const alarming = detection.alarm && guard.state === 'chase';
  const suspicious = guard.state === 'suspicious' || (detection.seenNow && detection.meter > 0.35);
  ctx.beginPath();
  ctx.moveTo(off.x + poly[0].x, off.y + poly[0].y);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(off.x + poly[i].x, off.y + poly[i].y);
  ctx.closePath();
  const gradient = ctx.createRadialGradient(
    off.x + guard.x, off.y + guard.y, 10,
    off.x + guard.x, off.y + guard.y, GUARD.coneRange,
  );
  if (alarming) {
    gradient.addColorStop(0, COLOURS.coneAlarm);
    gradient.addColorStop(1, 'rgba(255, 80, 70, 0.05)');
    ctx.fillStyle = gradient;
    ctx.strokeStyle = COLOURS.coneAlarmEdge;
  } else if (suspicious) {
    gradient.addColorStop(0, COLOURS.coneSuspicious);
    gradient.addColorStop(1, 'rgba(255, 170, 80, 0.05)');
    ctx.fillStyle = gradient;
    ctx.strokeStyle = COLOURS.coneCalmEdge;
  } else {
    gradient.addColorStop(0, COLOURS.coneCalm);
    gradient.addColorStop(1, 'rgba(255, 214, 120, 0.04)');
    ctx.fillStyle = gradient;
    ctx.strokeStyle = COLOURS.coneCalmEdge;
  }
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.lineWidth = 1;
}

function drawFigure(ctx, x, y, facing, radius, body, trim, isPlayer) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facing);
  // Lantern / hood point showing facing.
  ctx.fillStyle = trim;
  ctx.beginPath();
  ctx.moveTo(radius + 7, 0);
  ctx.lineTo(radius - 3, -5);
  ctx.lineTo(radius - 3, 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.stroke();
  ctx.fillStyle = trim;
  ctx.beginPath();
  ctx.arc(radius * 0.25, 0, radius * 0.45, 0, Math.PI * 2);
  ctx.fill();
  if (isPlayer) {
    ctx.fillStyle = '#0b2e27';
    ctx.beginPath();
    ctx.arc(radius * 0.45, 0, radius * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawNoiseRing(ctx, player, off, time) {
  if (!player.moving || player.sneaking) return;
  const x = off.x + player.x;
  const y = off.y + player.y;
  const r = PLAYER.noiseRadius * (0.92 + 0.08 * Math.sin(time * 6));
  ctx.strokeStyle = 'rgba(159, 232, 210, 0.35)';
  ctx.setLineDash([6, 7]);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawHud(ctx, state) {
  ctx.fillStyle = COLOURS.hudBar;
  ctx.fillRect(0, 0, VIEW.width, VIEW.hudTop);
  ctx.fillStyle = COLOURS.text;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('THE QUIET VAULT', 18, 28);
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = COLOURS.textDim;
  ctx.fillText(state.level.name, 18, 50);

  // Detection meter: an eye bar that fills toward the alarm.
  const meterW = 320;
  const meterX = VIEW.width / 2 - meterW / 2;
  ctx.fillStyle = '#1c2338';
  ctx.fillRect(meterX, 16, meterW, 16);
  const fill = state.detection.meter;
  ctx.fillStyle = state.detection.alarm ? COLOURS.meterHot : COLOURS.meterFill;
  ctx.fillRect(meterX, 16, meterW * fill, 16);
  ctx.strokeStyle = '#39415c';
  ctx.strokeRect(meterX + 0.5, 16.5, meterW - 1, 15);
  ctx.fillStyle = COLOURS.text;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const label = state.detection.alarm
    ? 'ALARM — BREAK THEIR LINE OF SIGHT'
    : state.detection.seenNow
      ? 'SEEN — GET BEHIND COVER'
      : 'UNSEEN';
  ctx.fillText(label, VIEW.width / 2, 52);

  ctx.textAlign = 'right';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillStyle = COLOURS.text;
  const objective = state.player.hasGem ? 'Reach the EXIT' : 'Take the gem';
  ctx.fillText(objective, VIEW.width - 18, 28);
  ctx.fillStyle = COLOURS.textDim;
  ctx.font = '13px system-ui, sans-serif';
  const mins = Math.floor(state.elapsed / 60);
  const secs = Math.floor(state.elapsed % 60).toString().padStart(2, '0');
  ctx.fillText(`Time ${mins}:${secs} · Alarms ${state.detection.timesAlarmed}`, VIEW.width - 18, 50);
  ctx.textAlign = 'left';
}

function drawFooter(ctx) {
  ctx.fillStyle = COLOURS.textDim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    'WASD / arrows move · Shift sneak (silent) · walking is audible · crates and walls block lantern light',
    VIEW.width / 2,
    VIEW.height - 12,
  );
  ctx.textAlign = 'left';
}

// A sheet of night over the playfield with the lantern cones cut out of it,
// so the light itself shows where it is dangerous and the dark where it is safe.
let darknessCanvas = null;
function drawDarkness(ctx, state, off) {
  const { level, guards } = state;
  if (!darknessCanvas) {
    darknessCanvas = document.createElement('canvas');
    darknessCanvas.width = VIEW.width;
    darknessCanvas.height = VIEW.height;
  }
  const dctx = darknessCanvas.getContext('2d');
  dctx.clearRect(0, 0, VIEW.width, VIEW.height);
  dctx.fillStyle = 'rgba(2, 4, 12, 0.46)';
  dctx.fillRect(off.x, off.y, level.widthPx, level.heightPx);
  dctx.globalCompositeOperation = 'destination-out';
  for (const guard of guards) {
    const poly = visionConePolygon(guard, level);
    const gradient = dctx.createRadialGradient(
      off.x + guard.x, off.y + guard.y, 8,
      off.x + guard.x, off.y + guard.y, GUARD.coneRange,
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(0.75, 'rgba(0, 0, 0, 0.85)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
    dctx.fillStyle = gradient;
    dctx.beginPath();
    dctx.moveTo(off.x + poly[0].x, off.y + poly[0].y);
    for (let i = 1; i < poly.length; i++) dctx.lineTo(off.x + poly[i].x, off.y + poly[i].y);
    dctx.closePath();
    dctx.fill();
  }
  dctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(darknessCanvas, 0, 0);
}

export function drawGame(ctx, state) {
  const { level, player, guards, detection, time } = state;
  const off = playfieldOffset(level);
  ctx.fillStyle = COLOURS.page;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx, level, off);
  drawExit(ctx, level, off, player.hasGem, time);
  drawGem(ctx, level, off, time);
  drawDarkness(ctx, state, off);
  for (const guard of guards) drawCone(ctx, guard, level, off, detection);
  drawWallsAndCrates(ctx, level, off);
  drawNoiseRing(ctx, player, off, time);
  for (const guard of guards) {
    drawFigure(ctx, off.x + guard.x, off.y + guard.y, guard.facing, GUARD.radius, COLOURS.guardCoat, COLOURS.guardTrim, false);
    if (guard.state === 'suspicious') {
      ctx.fillStyle = '#ffb347';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', off.x + guard.x, off.y + guard.y - GUARD.radius - 8);
      ctx.textAlign = 'left';
    }
    if (detection.alarm && guard.state === 'chase') {
      ctx.fillStyle = '#ff5a4e';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', off.x + guard.x, off.y + guard.y - GUARD.radius - 8);
      ctx.textAlign = 'left';
    }
  }
  drawFigure(ctx, off.x + player.x, off.y + player.y, player.facing, PLAYER.radius, COLOURS.playerCloak, COLOURS.playerTrim, true);
  if (player.hasGem) {
    ctx.fillStyle = COLOURS.gem;
    ctx.beginPath();
    ctx.arc(off.x + player.x + 10, off.y + player.y - 10, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // A pale ring keeps the thief findable in the dark at a glance.
  ctx.strokeStyle = 'rgba(232, 236, 246, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(off.x + player.x, off.y + player.y, PLAYER.radius + 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  drawHud(ctx, state);
  drawFooter(ctx);
}

function centreText(ctx, lines) {
  ctx.textAlign = 'center';
  let y = VIEW.height / 2 - (lines.length - 1) * 26;
  for (const [text, size, colour, bold] of lines) {
    ctx.font = `${bold ? 'bold ' : ''}${size}px system-ui, sans-serif`;
    ctx.fillStyle = colour;
    ctx.fillText(text, VIEW.width / 2, y);
    y += size + 14;
  }
  ctx.textAlign = 'left';
}

export function drawTitle(ctx, state) {
  drawGame(ctx, state);
  ctx.fillStyle = 'rgba(4, 6, 12, 0.72)';
  ctx.fillRect(0, VIEW.hudTop, VIEW.width, VIEW.height - VIEW.hudTop);
  centreText(ctx, [
    ['THE QUIET VAULT', 52, COLOURS.text, true],
    ['A stealth heist in three floors', 20, COLOURS.textDim, false],
    ['Slip past the lantern guards, take the gem, reach the exit unseen.', 17, COLOURS.text, false],
    ['WASD / arrows to move · Shift to sneak · walking makes noise', 15, COLOURS.textDim, false],
    ['Press Enter to begin', 20, COLOURS.gem, true],
  ]);
}

export function drawCaught(ctx, state) {
  drawGame(ctx, state);
  ctx.fillStyle = 'rgba(20, 4, 4, 0.68)';
  ctx.fillRect(0, VIEW.hudTop, VIEW.width, VIEW.height - VIEW.hudTop);
  centreText(ctx, [
    ['CAUGHT', 48, '#ff7a6e', true],
    ['A lantern found you. The vault keeps its gem — this time.', 17, COLOURS.text, false],
    ['Press Enter to try the floor again', 19, COLOURS.gem, true],
  ]);
}

export function drawClear(ctx, state, isFinal) {
  drawGame(ctx, state);
  ctx.fillStyle = 'rgba(3, 18, 10, 0.66)';
  ctx.fillRect(0, VIEW.hudTop, VIEW.width, VIEW.height - VIEW.hudTop);
  const ghost = state.detection.timesAlarmed === 0;
  centreText(ctx, [
    [isFinal ? 'THE VAULT IS YOURS' : 'FLOOR CLEARED', 44, COLOURS.exit, true],
    [ghost ? 'A perfect ghost: never once alarmed.' : `Alarms raised: ${state.detection.timesAlarmed}`, 17, COLOURS.text, false],
    [isFinal ? 'Press Enter to play again' : 'Press Enter for the next floor', 19, COLOURS.gem, true],
  ]);
}
