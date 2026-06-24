import { Jimp, rgbaToInt } from 'jimp';
import path from 'path';

// Kangaroo 39x40 grid templates derived from user image
const STAND_TEMPLATE = [
  "                          #         ## ", // 0
  "                         ####      ### ", // 1
  "                         ##.###   #.## ", // 2
  "                          #...## #..#  ", // 3
  "                          ##...######  ", // 4
  "                           #..#...##   ", // 5
  "                            ###....#   ", // 6
  "                            #...##..#  ", // 7
  "                            #...##..## ", // 8
  "                            ##......###", // 9
  "                            ###....####", // 10
  "                            #..####.###", // 11
  "                            #.....#### ", // 12
  "                           ##.....##   ", // 13
  "                          ##......##   ", // 14
  "                      ####.........#   ", // 15
  "                   ####............#   ", // 16
  "                  ##...............#   ", // 17
  "                 ##..........#.....#   ", // 18
  "                ##.......##..#....##   ", // 19
  "               ##........##.##....##   ", // 20
  "               #.........##.##....#    ", // 21
  "              ##..####...##..#...##    ", // 22
  "              #.......##..##..#.###    ", // 23
  "              #.......###..##..##.#    ", // 24
  "             ##........##...####..#    ", // 25
  "             #.........##...#######    ", // 26
  "             #.#........#...#######    ", // 27
  "             #.#........#...### ##     ", // 28
  "             #.##......##..#.#         ", // 29
  "             #.##......##.##.#         ", // 30
  "             #...#....##.##.##         ", // 31
  "            ##...##...#.#..##          ", // 32
  "            #.....##.####..#           ", // 33
  "           #.....##..####.##           ", // 34
  "############....## ..# ##.#            ", // 35
  "##########.....##  ..####.#####        ", // 36
  " ###..........#   #...#####...####     ", // 37
  "   ###########    #.......########     ", // 38
  "      ######      ################     "  // 39
];

const BLINK_TEMPLATE = [...STAND_TEMPLATE];

const RUN_1_TEMPLATE = [...STAND_TEMPLATE];
RUN_1_TEMPLATE[35] = "############....## ..# ##.#            ";
RUN_1_TEMPLATE[36] = "##########.....##  ..####.#####        ";
RUN_1_TEMPLATE[37] = " ###..........#   #...#####...         ";
RUN_1_TEMPLATE[38] = "   ###########    #.......             ";
RUN_1_TEMPLATE[39] = "      ######      ########             ";

const RUN_2_TEMPLATE = [...STAND_TEMPLATE];
RUN_2_TEMPLATE[35] = "############....## ..#                 ";
RUN_2_TEMPLATE[36] = "##########.....##  ..####              ";
RUN_2_TEMPLATE[37] = " ###..........#   #...#####...####     ";
RUN_2_TEMPLATE[38] = "   ###########    #.......########     ";
RUN_2_TEMPLATE[39] = "      ######      ################     ";

const JUMP_TEMPLATE = [...STAND_TEMPLATE];
JUMP_TEMPLATE[36] = "##########.....##  ..####.             ";
JUMP_TEMPLATE[37] = " ###..........#   #...#####...         ";
JUMP_TEMPLATE[38] = "   ###########    #.......             ";
JUMP_TEMPLATE[39] = "      ######      #####                ";

const CRASH_TEMPLATE = [...STAND_TEMPLATE];
CRASH_TEMPLATE[0] = "                                       ";
CRASH_TEMPLATE[1] = "                         #####    #### "; 
CRASH_TEMPLATE[2] = "                         ######  ##### ";

// Color #535353 (RGB 83, 83, 83, Alpha 255)
const SPRITE_COLOR = rgbaToInt(83, 83, 83, 255);
const TRANSPARENT_COLOR = rgbaToInt(0, 0, 0, 0);

// Corrected drawDinoKangaroo function (baseX and baseY are not multiplied by scale)
function drawDinoKangaroo(image, template, baseX, baseY, scale, isDuck, isCrash, isBlink) {
  const height = template.length;
  const width = template[0].length;
  
  const frameWidth = isDuck ? 59 : 44;
  const frameHeight = 47;
  
  const padX = Math.floor((frameWidth - width) / 2) * scale;
  const padY = (frameHeight - height) * scale;
  
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const char = template[r][c];
      
      let isEye = false;
      if (!isBlink) {
        if (!isDuck) {
          if ((r === 2 || r === 3) && (c === 28 || c === 29)) {
            isEye = true;
          }
        } else {
          if ((r === 5 || r === 6) && (c === 41 || c === 42)) {
            isEye = true;
          }
        }
      }
      
      const px = baseX + padX + c * scale;
      const py = baseY + padY + r * scale;
      
      if (isEye) {
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            image.setPixelColor(TRANSPARENT_COLOR, px + dx, py + dy);
          }
        }
      } else if (isCrash && !isDuck && (r === 2 || r === 3) && (c === 28 || c === 29)) {
        // Draw crossed eyes for Crash
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const isCross = (dx === dy) || (dx === scale - 1 - dy);
            const color = isCross ? SPRITE_COLOR : TRANSPARENT_COLOR;
            image.setPixelColor(color, px + dx, py + dy);
          }
        }
      } else if (char === '#' || char === '.') {
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            image.setPixelColor(SPRITE_COLOR, px + dx, py + dy);
          }
        }
      }
    }
  }
}

// Clears a rectangular area in Jimp image
function clearArea(image, x, y, width, height) {
  for (let cy = y; cy < y + height; cy++) {
    for (let cx = x; cx < x + width; cx++) {
      image.setPixelColor(TRANSPARENT_COLOR, cx, cy);
    }
  }
}

async function main() {
  const assetsDir = path.join('assets');
  
  // ----------------------------------------------------
  // 1. Process 1x Spritesheet
  // ----------------------------------------------------
  console.log('Loading 1x spritesheet...');
  const sprite1xPath = path.join(assetsDir, 'default_100_percent', '100-offline-sprite.png');
  const img1x = await Jimp.read(sprite1xPath);
  
  console.log('Clearing T-Rex frames in 1x sheet...');
  clearArea(img1x, 848, 2, 262, 47); // Wait/Jump/Run/Crash frames
  clearArea(img1x, 1112, 2, 118, 47); // Ducking frames
  
  console.log('Drawing Kangaroo in 1x sheet...');
  drawDinoKangaroo(img1x, JUMP_TEMPLATE, 848, 2, 1, false, false, false);      // Jumping / Wait 2 (offset 0)
  drawDinoKangaroo(img1x, STAND_TEMPLATE, 892, 2, 1, false, false, false);     // Waiting 1 (offset 44)
  drawDinoKangaroo(img1x, RUN_1_TEMPLATE, 936, 2, 1, false, false, false);     // Running 1 (offset 88)
  drawDinoKangaroo(img1x, RUN_2_TEMPLATE, 980, 2, 1, false, false, false);     // Running 2 (offset 132)
  drawDinoKangaroo(img1x, CRASH_TEMPLATE, 1068, 2, 1, false, true, false);     // Crashed (offset 220)
  // Draw standing kangaroo in ducking frames since ducking is disabled
  drawDinoKangaroo(img1x, STAND_TEMPLATE, 1112, 2, 1, true, false, false);    // Ducking 1 (offset 264)
  drawDinoKangaroo(img1x, STAND_TEMPLATE, 1171, 2, 1, true, false, false);    // Ducking 2 (offset 323)
  
  await img1x.write(sprite1xPath);
  console.log('Successfully updated 1x spritesheet!');

  // ----------------------------------------------------
  // 2. Process 2x Spritesheet
  // ----------------------------------------------------
  console.log('Loading 2x spritesheet...');
  const sprite2xPath = path.join(assetsDir, 'default_200_percent', '200-offline-sprite.png');
  const img2x = await Jimp.read(sprite2xPath);
  
  console.log('Clearing T-Rex frames in 2x sheet...');
  clearArea(img2x, 1678, 2, 524, 94); // Wait/Jump/Run/Crash frames
  clearArea(img2x, 2206, 2, 236, 94); // Ducking frames
  
  console.log('Drawing Kangaroo in 2x sheet...');
  drawDinoKangaroo(img2x, JUMP_TEMPLATE, 1678, 2, 2, false, false, false);      // Jumping / Wait 2 (offset 0)
  drawDinoKangaroo(img2x, STAND_TEMPLATE, 1766, 2, 2, false, false, false);     // Waiting 1 (offset 88)
  drawDinoKangaroo(img2x, RUN_1_TEMPLATE, 1854, 2, 2, false, false, false);     // Running 1 (offset 176)
  drawDinoKangaroo(img2x, RUN_2_TEMPLATE, 1942, 2, 2, false, false, false);     // Running 2 (offset 264)
  drawDinoKangaroo(img2x, CRASH_TEMPLATE, 2118, 2, 2, false, true, false);     // Crashed (offset 440)
  drawDinoKangaroo(img2x, STAND_TEMPLATE, 2206, 2, 2, true, false, false);    // Ducking 1 (offset 528)
  drawDinoKangaroo(img2x, STAND_TEMPLATE, 2324, 2, 2, true, false, false);    // Ducking 2 (offset 646)
  
  await img2x.write(sprite2xPath);
  console.log('Successfully updated 2x spritesheet!');
}

main().catch(err => {
  console.error('Error:', err);
});
