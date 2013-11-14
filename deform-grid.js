/**
 * javascript-deform-grid, a Javascript library for deforming 2D grid.
 *
 * @version 0.000, http://isprogrammingeasy.blogspot.no/2012/08/angular-degrees-versioning-notation.html
 * @license GNU Lesser General Public License, http://www.gnu.org/copyleft/lesser.html
 * @author  Sven Nilsen, http://www.cutoutpro.com
 * @link    http://www.github.com/bvssvni/javascript-deform-grid
 *
 */

/***************************************************

  Deforms 2D grid using two or more control pivots

  EXAMPLE

  // Create a flat grid.
  var grid = Deform_grid(0.0, 0.0, 1.0, 1.0, 0.1);

  // Specify initial and current control pivots.
  var baseCoords = [
    0.5, 0.0,
    0.5, 1.0,
  ];
  var controlCoords = [
    0.7, 0.0,
    0.5, 1.0,
  ];

  // Update the grid vertices using the pivots.
  Deform_compute(baseCoords, controlCoords, grid);

***************************************************/

/*

  Deform_grid(x, y, w, h, units);

    x - The x coordinate of the upper left corner.

    y - The y coordinate of the upper left corner.

    w - The width of the grid.

    h - The height of the grid.

  The grid coordinates are listed from left to right then top to bottom.

  Returns

    {
      .vertices,
      .textureCoords,
      .indices,
      .x,
      .y,
      .w,
      .h,
      .units
    }

*/
function Deform_grid(x, y, w, h, units) {
  if (!(typeof x === "number")) {throw "Deform_grid: x is not set";}
  if (!(typeof y === "number")) {throw "Deform_grid: y is not set";}
  if (!(typeof w === "number")) {throw "Deform_grid: w is not set";}
  if (!(typeof h === "number")) {throw "Deform_grid: h is not set";}
  if (!(typeof units === "number")) {throw "Deform_grid: uits is not set";}

  var vertices = [];
  var textureCoords = [];
  var nx = Math.ceil(w / units + 1);
  var ny = Math.ceil(h / units + 1);
  for (var iy = 0; iy < ny; iy++) {
    for (var ix = 0; ix < nx; ix++) {
      vertices.push(x + ix * units);
      vertices.push(y + iy * units);
      textureCoords.push(ix * units / w);
      textureCoords.push(iy * units / h);
    }
  }

  var indices = [];
  for (var iy = 0; iy < ny - 1; iy++) {
    for (var ix = 0; ix < nx - 1; ix++) {
      indices.push(ix + iy * nx);
      indices.push((ix + 1) + iy * nx);
      indices.push(ix + (iy + 1) * nx);

      indices.push(ix + (iy + 1) * nx);
      indices.push((ix + 1) + iy * nx);
      indices.push((ix + 1) + (iy + 1) * nx);
    }
  }

  return {
    vertices: vertices,
    textureCoords: textureCoords,
    indices: indices,
    x: x,
    y: y,
    w: w,
    h: h,
    units: units,
  };
}

/*

  Deform_compute(ps, qs, grid);

    ps - Initial position of control points.

    qs - Current position of control points.

    grid - Grid object created with 'Deform_grid'.

  Notice that this function manipulates the vertices in the grid object.
  The current position of the vertices are ignored and overwritten.

*/
function Deform_compute(ps, qs, grid) {
  var x = grid.x;  var y = grid.y;
  var w = grid.w;  var h = grid.h;
  var units = grid.units;
  var fr = grid.vertices;
  var pStarX, pStarY, qStarX, qStarY;
  var pix, piy, qix, qiy;
  var vx, vy;
  var i;
  var wis = new Array(ps.length);
  var sumWi;
  var ai11, ai12, ai21, ai22;
  var piHatX, piHatY, qiHatX, qiHatY;
  var vpx, vpy;
  var gridWidth = Math.ceil(w / units + 1), gridHeight = Math.ceil(h / units + 1);
  var m, n;
  var vl = 0.0, fl = 0.0;
  var ip = 0;
  var num = ps.length / 2;
  var eps = 0.00001; 

  for (m = 0; m < gridWidth; m++) {
    for (n = 0; n < gridHeight; n++) {
      ip = 2 * (m + n * gridWidth);
      vx = m * units + x;  vy = n * units + y;
      sumWi = 0.0;
      pStarX = 0.0;  pStarY = 0.0;
      qStarX = 0.0;  qStarY = 0.0;
      for (i = 0; i < num; i++) {
        pix = ps[i * 2]; piy = ps[i * 2 + 1];
        qix = qs[i * 2]; qiy = qs[i * 2 + 1];
        vl = (pix - vx) * (pix - vx) + (piy - vy) * (piy - vy);
	wis[i] = vl < eps && vl > -eps ? 1.0 / eps : 1.0 / vl;
        sumWi += wis[i];
        pStarX += wis[i] * pix;  pStarY += wis[i] * piy;
        qStarX += wis[i] * qix;  qStarY += wis[i] * qiy;
      }

      pStarX /= sumWi;  pStarY /= sumWi;
      qStarX /= sumWi;  qStarY /= sumWi;
      fr[ip] = 0.0;  fr[ip + 1] = 0.0;
      vpx = -(vy - pStarY);  vpy = vx - pStarX;
      for (i = 0; i < num; i++) {
        pix = ps[i * 2];  piy = ps[i * 2 + 1];
        qix = qs[i * 2];  qiy = qs[i * 2 + 1];
        piHatX = pix - pStarX;  piHatY = piy - pStarY;
        qiHatX = qix - qStarX;  qiHatY = qiy - qStarY;
        ai11 = pix * (vx - pStarX) + piy * (vy - pStarY);
        ai21 = piHatY * (vx - pStarX) - piHatX * (vy - pStarY);
        ai12 = pix * (-vpx) + piy * (-vpy);
        ai22 = piHatY * (-vpx) - piHatX * (-vpy);
        fr[ip] += wis[i] * (qiHatX * ai11 + qiHatY * ai21);
        fr[ip + 1] += wis[i] * (qiHatX * ai12 + qiHatY * ai22);
      }

      vl = (vx - pStarX) * (vx - pStarX) + (vy - pStarY) * (vy - pStarY);
      fl = (fr[ip] * fr[ip] + fr[ip + 1] * fr[ip + 1]);
      vl = fl === 0.0 ? 0.0 : Math.sqrt(vl / fl);
      fr[ip] = fr[ip] * vl + qStarX;
      fr[ip + 1] = fr[ip + 1] * vl + qStarY;
    }
  }
}

