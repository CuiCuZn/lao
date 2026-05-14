function onIdle(me, enemy, game) {
  var pos = me.tank.position;
  var dir = me.tank.direction;
  var e = enemy.tank;
  var b = enemy.bullet;
  var m = game.map;
  var W = m.length;
  var H = m[0].length;
  var center = [Math.floor(W/2), Math.floor(H/2)];

  if (e) {
    onIdle.lastE = e.position.slice();
    onIdle.lastEDir = e.direction;
  }

  if (b && threatens(pos, b)) {
    var d = dodgeDir(pos, dir, b, m, W, H);
    if (d) {
      if (dir === d) me.go();
      else me.turn(d);
      return;
    }
  }

  if (e) {
    var ep = e.position;
    if (aligned(pos, ep) && losClear(pos, ep, m)) {
      var aim = toDir(pos, ep);
      if (dir === aim) {
        me.fire();
        return;
      }
      me.turn(aim);
      return;
    }
    var moveDir = getAlignDir(pos, ep, dir, m, W, H);
    if (moveDir) {
      if (dir === moveDir) me.go();
      else me.turn(moveDir);
      return;
    }
  }

  if (game.star) {
    var nx = bfsNext(pos, game.star, m, W, H);
    if (nx) {
      var gd = toDir(pos, nx);
      if (dir === gd) me.go();
      else me.turn(gd);
      return;
    }
  }

  if (me.skill && me.skill.type === "boost" && me.skill.remainingCooldownFrames === 0 && !me.status.boosted && !b) {
    var tgt = game.star || center;
    if (manhattan(pos, tgt) >= 4 && !edgePos(pos, W, H)) {
      me.boost();
    }
  }

  if (!b && nearCenter(pos, W, H)) {
    var grassDir = findGrassDir(pos, dir, m, W, H);
    if (grassDir) {
      if (dir === grassDir) {
        me.fire();
        return;
      }
      var np = step(pos, dir);
      if (safe(np, m, W, H) && countOpenAhead(pos, dir, m, W, H, 5) >= 3) {
        me.fire();
        return;
      }
      me.turn(grassDir);
      return;
    }
  }

  if (onIdle.lastE) {
    var nx = bfsNext(pos, onIdle.lastE, m, W, H);
    if (nx && !edgePos(nx, W, H)) {
      var gd = toDir(pos, nx);
      if (dir === gd) me.go();
      else me.turn(gd);
      return;
    }
  }

  patrolCenter(pos, dir, m, W, H, center, me);
}

function nearCenter(pos, W, H) {
  var cx = Math.floor(W/2), cy = Math.floor(H/2);
  return Math.abs(pos[0]-cx) <= 5 && Math.abs(pos[1]-cy) <= 5;
}

function findGrassDir(pos, dir, m, W, H) {
  var dirs = ["up","down","left","right"];
  var best = null, bestScore = -1;
  for (var i = 0; i < 4; i++) {
    var d = dirs[i];
    var np = step(pos, d);
    if (!safe(np, m, W, H)) continue;
    var score = countOpenAhead(pos, d, m, W, H, 10);
    if (d === dir) score += 2;
    if (score > bestScore) { bestScore = score; best = d; }
  }
  return best;
}

function countOpenAhead(pos, d, m, W, H, maxDist) {
  var s = dirD(d);
  var p = [pos[0]+s[0], pos[1]+s[1]];
  var count = 0;
  while (count < maxDist && p[0] >= 0 && p[1] >= 0 && p[0] < W && p[1] < H) {
    var tile = m[p[0]][p[1]];
    if (tile === "x") break;
    count++;
    p = [p[0]+s[0], p[1]+s[1]];
  }
  return count;
}

function getAlignDir(pos, tpos, dir, m, W, H) {
  var dirs = ["up","down","left","right"];
  var best = null, bestS = -1;
  for (var i = 0; i < 4; i++) {
    var d = dirs[i];
    var np = step(pos, d);
    if (!safe(np, m, W, H) || edgePos(np, W, H)) continue;
    var s = 0;
    if (np[0] === tpos[0] || np[1] === tpos[1]) s += 10;
    if (manhattan(np, tpos) < manhattan(pos, tpos)) s += 3;
    if (d === dir) s += 2;
    if (s > bestS) { bestS = s; best = d; }
  }
  return best;
}

function edgePos(p, W, H) {
  return p[0] <= 1 || p[0] >= W-2 || p[1] <= 1 || p[1] >= H-2;
}

function threatens(p, b) {
  var bp = b.position, bd = b.direction;
  if (bp[0] !== p[0] && bp[1] !== p[1]) return false;
  if (bd === "right" && bp[1] === p[1] && bp[0] < p[0]) return true;
  if (bd === "left" && bp[1] === p[1] && bp[0] > p[0]) return true;
  if (bd === "down" && bp[0] === p[0] && bp[1] < p[1]) return true;
  if (bd === "up" && bp[0] === p[0] && bp[1] > p[1]) return true;
  return false;
}

function dodgeDir(p, d, b, m, W, H) {
  var bd = b.direction;
  var perp = (bd === "up" || bd === "down") ? ["left","right"] : ["up","down"];
  for (var i = 0; i < perp.length; i++) {
    var np = step(p, perp[i]);
    if (safe(np, m, W, H) && !edgePos(np, W, H)) return perp[i];
  }
  for (var i = 0; i < perp.length; i++) {
    if (safe(step(p, perp[i]), m, W, H)) return perp[i];
  }
  var away = opp(bd);
  if (safe(step(p, away), m, W, H)) return away;
  return null;
}

function bfsNext(s, g, m, W, H) {
  var q = [{p:s,f:null}];
  var v = {};
  v[s[0]+","+s[1]] = true;
  var ds = ["up","down","left","right"];
  while (q.length) {
    var c = q.shift();
    if (c.p[0]===g[0] && c.p[1]===g[1]) return c.f;
    for (var i=0;i<4;i++) {
      var np = step(c.p, ds[i]);
      var k = np[0]+","+np[1];
      if (v[k]||!safe(np,m,W,H)) continue;
      v[k]=true;
      q.push({p:np,f:c.f||np});
    }
  }
  return null;
}

function patrolCenter(pos, dir, m, W, H, center, me) {
  var dirs = ["up","down","left","right"];
  var best = null, bestS = -999;
  for (var i = 0; i < 4; i++) {
    var d = dirs[i];
    var np = step(pos, d);
    if (!safe(np, m, W, H)) continue;
    var s = 0;
    if (d === dir) s += 3;
    var cd = manhattan(pos, center), nd = manhattan(np, center);
    if (nd < cd) s += 5;
    else if (nd > cd) s -= 3;
    if (edgePos(np, W, H)) s -= 10;
    if (s > bestS) { bestS = s; best = d; }
  }
  if (best) {
    if (dir === best) me.go();
    else me.turn(best);
  } else {
    me.turn(right90(dir));
  }
}

function aligned(a,b){return a[0]===b[0]||a[1]===b[1];}
function losClear(f,t,m){var s=dirD(toDir(f,t));var p=[f[0]+s[0],f[1]+s[1]];while(p[0]!==t[0]||p[1]!==t[1]){if(!safe(p,m,999,999))return false;p=[p[0]+s[0],p[1]+s[1]];}return true;}
function safe(p,m,W,H){if(p[0]<0||p[1]<0||p[0]>=W||p[1]>=H)return false;if(!m[p[0]]||!m[p[0]][p[1]])return false;return m[p[0]][p[1]]!=="x";}
function step(p,d){var s=dirD(d);return [p[0]+s[0],p[1]+s[1]];}
function dirD(d){if(d==="up")return [0,-1];if(d==="down")return [0,1];if(d==="left")return [-1,0];return [1,0];}
function toDir(a,b){if(b[0]>a[0])return "right";if(b[0]<a[0])return "left";if(b[1]>a[1])return "down";return "up";}
function opp(d){if(d==="up")return "down";if(d==="down")return "up";if(d==="left")return "right";return "left";}
function right90(d){if(d==="up")return "right";if(d==="right")return "down";if(d==="down")return "left";return "up";}
function manhattan(a,b){return Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);}
