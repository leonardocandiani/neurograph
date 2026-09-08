"use client";
/**
 * <Neurograph /> — single-file build: engine + anatomical geometry in one file.
 *
 * Drop it anywhere and go. Same props as the split build
 * (src/neurograph.js + src/Neurograph.jsx).
 *
 *   import Neurograph from "./Neurograph.standalone.jsx";
 *   <Neurograph count={1100} followSulci={0.6} colorA="#34d399" colorB="#0ea5e9" />
 *
 * Props
 *  shape        'brain' | 'network' | 'globe'  (default 'brain')
 *  count        number of nodes                (default 1100)
 *  linkDistance max connection distance in px  (default 46)
 *  followSulci  0..1 — share of nodes born on the real sulci (default .6)
 *  cohesion     0..1 — spring holding each node near its anchor (default .35)
 *  speed        0..2                           (default .45)
 *  pulses       synapses travelling at once    (default 26)
 *  glow         0..1                           (default .55)
 *  anatomy      0..1 — outline + sulci opacity, 0 hides them (default .28)
 *  colorA/colorB  gradient endpoints
 *  interactive  mouse repulsion + click wave   (default true)
 *  flip         mirror the brain horizontally  (default false)
 *  className / style
 *
 * The canvas fills 100% of its parent, so give the parent a height.
 */
import { useEffect, useRef } from "react";

/* Embedded anatomical geometry. Integers 0..1000 are relative to the brain width. */
const SHAPE = {"aspect":0.8406,"outline":["476 0 503 1 530 8 590 9 645 19 705 37 761 60 805 97 826 122 831 134 837 140 870 158 885 171 901 217 942 264 952 285 973 315 983 351 995 381 994 417 1000 463 1000 491 996 510 984 537 937 599 920 606 883 607 881 627 871 656 847 695 823 715 802 724 765 728 734 735 695 736 658 743 661 768 677 811 679 831 662 841 627 841 609 826 587 783 547 731 532 703 481 654 463 627 449 623 417 635 395 635 378 631 349 636 324 636 292 628 271 620 214 587 205 578 194 542 182 529 167 524 141 523 118 518 69 487 47 464 40 448 38 434 11 403 6 388 9 355 0 320 0 303 19 244 32 218 62 185 62 181 67 179 83 153 105 131 151 100 163 96 195 66 231 49 292 30 312 29 367 14 403 13 476 1"],"sulci":["378 19 408 18 439 33 452 46 459 61 458 79 462 92 442 138 404 174 391 194 386 212 386 233 391 262 396 261 391 230 395 199 407 179 447 140 468 93 494 67 492 63 486 65 466 87 463 71 469 52 480 40 502 32 612 35 627 42 630 60 623 61 590 50 566 58 545 78 536 94 533 113 525 118 514 109 489 97 493 105 514 115 520 123 478 193 470 184 435 167 431 169 441 178 467 189 476 201 470 234 471 266 474 266 476 227 488 184 504 164 520 129 535 117 561 109 589 109 614 115 646 131 667 147 670 143 653 128 689 126 708 131 710 136 715 135 731 145 792 207 810 219 813 215 785 192 810 190 829 195 854 215 865 241 870 239 870 234 908 256 916 264 922 283 944 324 967 392 976 450 975 454 960 429 937 405 913 393 912 349 900 328 889 317 881 316 897 333 908 354 908 419 911 421 914 418 914 400 930 406 957 433 976 468 970 511 952 543 931 571 916 583 878 600 838 599 712 580 658 583 611 599 533 585 511 585 491 595 449 595 353 630 319 630 298 625 249 602 283 602 313 594 354 616 356 613 339 600 293 581 280 568 274 543 292 501 311 498 336 488 347 506 357 532 357 519 341 485 358 477 396 477 427 461 444 483 443 473 432 458 435 455 447 450 497 450 528 441 537 441 554 451 570 451 601 440 593 449 597 452 666 387 685 361 702 328 721 338 747 340 745 337 715 331 703 323 710 303 707 297 691 339 671 372 642 405 609 430 568 446 556 446 533 435 493 445 449 445 439 429 439 407 436 405 433 426 442 445 403 470 358 472 344 443 341 442 339 447 351 474 331 484 308 493 286 496 250 482 247 484 256 492 285 501 270 535 269 552 279 576 302 590 301 592 282 597 239 596 211 577 196 535 180 522 182 496 190 476 205 457 249 409 282 390 368 388 373 401 371 422 374 424 380 406 373 386 416 362 455 355 478 342 493 338 527 341 561 357 563 352 541 341 566 315 588 268 583 267 560 315 537 338 517 333 484 334 478 311 460 295 457 299 475 318 479 336 453 350 427 353 405 362 404 345 400 333 372 306 370 309 397 339 400 360 395 368 359 384 287 384 273 340 262 285 246 254 239 250 258 290 267 337 282 382 280 386 261 394 236 411 198 375 153 349 143 344 140 346 142 350 194 379 233 416 195 461 145 455 127 444 112 426 108 414 119 385 120 367 102 315 99 319 115 370 103 418 117 439 97 437 67 414 57 395 55 375 60 352 72 326 69 324 66 328 60 341 35 329 24 308 27 283 35 269 50 256 96 239 88 275 92 280 110 213 129 174 148 154 176 153 185 134 194 126 218 117 260 110 319 109 343 114 355 122 330 148 316 172 250 132 241 132 315 177 311 190 311 244 295 230 277 224 231 225 226 213 228 174 225 173 221 216 226 227 212 236 195 264 175 246 166 225 164 234 169 246 194 269 173 292 128 305 130 308 151 306 181 293 191 283 219 236 239 229 267 228 295 236 308 249 311 258 313 303 317 311 319 180 334 151 376 109 373 105 359 117 352 112 354 99 365 76 395 50 397 45 385 49 368 65 371 52 389 34 409 27 409 22 386 29 368 48 366 30 361 29 364 57 361 58 358 49 355 55 357 69 362 71 350 93 347 110 312 102 256 105 258 87 256 76 251 73 253 96 248 107 197 118 180 132 173 148 152 148 140 153 123 174 113 194 99 234 64 244 44 254 31 266 19 294 19 310 27 329 14 344 20 344 33 333 57 346 50 372 55 403 76 431 96 442 55 429 42 429 30 419 12 391 15 360 6 323 6 301 27 238 43 213 70 183 87 177 105 176 98 186 68 213 73 217 100 191 123 161 135 135 137 120 133 123 127 143 110 171 78 174 89 154 118 127 153 105 166 101 193 75 219 60 281 40 285 56 245 61 220 69 187 89 174 103 172 105 177 107 194 90 217 76 248 66 305 58 326 45 337 33 337 28 378 19","484 0 527 8 587 9 637 18 708 38 762 61 813 105 839 142 872 159 883 170 903 222 944 268 950 284 970 311 995 382 994 423 1000 467 995 512 983 538 939 597 917 606 883 605 872 653 860 677 844 699 821 717 801 724 658 743 659 761 676 808 679 831 659 841 628 841 608 824 588 784 548 732 535 706 484 656 462 626 446 623 415 635 375 631 328 636 277 622 213 586 206 579 195 545 184 530 168 524 120 518 66 484 45 459 38 433 12 404 6 386 9 352 0 305 15 256 31 221 68 177 79 158 102 133 131 112 166 95 194 68 233 49 290 32 319 28 369 14 405 13 458 2 483 1","655 589 687 595 707 604 740 628 764 654 752 649 764 657 811 666 831 666 827 673 806 670 824 675 816 685 798 683 772 673 736 667 815 687 811 692 776 688 732 672 765 687 809 695 798 704 786 703 728 681 693 672 724 681 775 702 795 705 782 713 731 698 679 673 673 674 718 693 719 695 713 697 662 684 560 678 546 656 565 651 630 661 692 665 648 671 570 669 570 672 656 672 707 663 752 661 678 663 586 653 571 649 594 636 564 651 538 654 519 636 565 636 597 628 723 637 693 611 654 590","547 15 592 16 657 29 708 49 743 69 788 107 804 136 803 143 772 126 757 112 746 94 742 97 753 115 770 131 811 152 815 166 827 179 836 183 849 183 859 178 863 181 878 202 883 234 864 224 857 211 833 192 812 185 780 187 736 142 717 129 723 113 723 98 714 86 695 79 637 66 709 70 709 65 636 60 632 41 617 32 585 27 527 27 547 16","775 278 780 279 799 321 810 318 811 323 799 329 775 377 764 390 788 414 799 433 808 439 848 439 886 424 886 430 865 439 877 467 886 505 883 508 880 505 871 464 859 441 833 446 805 442 813 476 813 520 808 523 808 480 800 447 787 422 760 393 737 403 725 438 713 457 682 486 668 496 664 494 708 454 722 431 732 401 769 377 792 335 793 316 775 279","761 499 764 500 762 504 738 515 802 568 809 574 808 579 734 518 689 539 672 538 623 524 584 525 544 533 497 529 451 553 396 553 359 578 357 579 355 574 395 548 445 549 496 524 553 527 571 522 618 518 668 532 693 533 760 499","596 604 658 614 678 621 692 634 605 627 620 616 605 625 579 632 517 635 509 622 538 630 569 630 599 618 610 608 600 616 573 627 540 628 509 621 508 615 527 622 559 623 604 607 563 621 539 622 509 614 506 610 508 605 538 614 566 614 595 605","543 695 582 720 599 749 625 782 629 779 591 725 651 741 655 767 674 823 672 831 659 836 638 837 623 832 608 814 578 759 547 721 543 696","720 50 754 63 776 78 809 109 834 145 873 167 885 182 888 202 897 221 895 238 890 240 886 207 876 187 852 166 812 147 805 124 789 100 754 70 720 50","537 664 565 695 602 712 627 715 693 717 736 710 764 710 782 715 762 723 718 725 594 719 569 707 545 689 533 676 537 664","604 133 631 147 659 172 666 187 660 207 653 214 646 215 620 200 573 202 558 194 558 174 563 158 568 156 562 181 562 189 568 195 622 195 643 209 651 209 656 203 661 189 655 176 604 133","975 352 981 360 990 385 989 427 995 471 994 495 984 526 940 586 954 548 973 519 979 499 980 431 964 371 975 354","542 656 570 689 601 703 645 707 726 697 752 707 717 714 637 714 605 710 584 704 561 690 541 666 538 658 542 657","45 434 59 435 106 450 80 463 81 468 102 460 121 446 142 460 154 462 167 477 181 481 176 520 125 514 91 496 56 467 47 452 44 435","583 57 602 58 646 75 684 81 710 90 718 100 712 127 678 120 645 125 612 109 581 102 559 104 539 110 542 93 551 78 570 61 583 58","831 243 837 244 855 261 878 295 876 334 861 362 866 382 859 378 856 361 871 333 870 319 849 298 811 275 816 272 833 282 831 244","932 469 935 470 933 478 917 505 939 525 935 527 919 512 911 509 880 528 873 535 872 542 895 566 893 570 867 543 867 535 877 524 912 502 931 470","593 208 607 209 620 215 638 232 645 257 643 288 638 287 636 241 623 224 606 214 592 213 575 218 544 239 538 237 559 220 592 209","465 600 487 600 484 614 490 625 508 633 532 656 529 679 540 699 540 707 481 645 474 633 474 614 466 601","669 587 695 592 724 605 754 628 779 658 769 657 745 631 709 604 688 594 662 589 668 587","702 186 731 187 751 197 768 221 779 249 776 251 773 248 757 212 739 194 703 190 671 202 670 197 676 194 702 187","686 586 710 587 740 602 782 641 793 658 781 658 760 632 723 602 682 587 685 586","468 6 499 6 536 14 518 25 498 27 480 34 467 46 461 56 457 45 444 30 418 16 467 7","712 587 740 589 767 612 801 651 804 658 796 658 756 614 734 596 713 587","603 635 677 646 717 645 739 640 739 642 708 647 669 647 604 636","571 681 658 685 702 697 679 702 628 700 601 694 571 682","743 589 757 591 785 614 820 654 807 658 789 633 744 590","605 646 652 652 740 652 741 654 674 654 606 647","644 592 651 591 677 602 720 635 710 636 695 621 668 607 623 600 643 592","762 593 800 599 815 614 833 645 835 651 823 656 800 627 762 594","617 602 653 605 677 612 694 622 706 634 694 635 683 622 668 615 612 605 616 602","901 228 942 277 942 288 935 297 919 261 898 244 901 230","947 289 968 318 973 330 974 342 964 361 962 363 959 357 950 325 939 304 946 290","563 681 607 698 646 703 602 702 575 690 564 682","507 597 593 603 570 611 539 612 514 606 507 602 507 598","837 253 859 273 873 298 872 312 862 301 841 287 838 254","803 599 841 604 845 634 842 646 837 652 821 620 803 600","940 566 932 594 915 601 891 599 922 585 940 566","512 591 530 590 576 599 514 595 509 593 512 591","846 218 851 220 852 243 871 263 869 267 865 266 847 244 846 220","331 30 317 45 296 55 288 51 289 41 293 37 331 30","431 607 434 607 413 627 395 628 386 623 430 607","452 602 460 601 465 609 427 623 442 606 451 602","818 156 855 175 848 178 833 177 824 170 818 158","835 654 839 654 836 659 829 664 800 660 834 654","500 599 502 599 501 614 505 627 494 622 489 610 490 605 499 600","847 604 878 605 875 617 857 615 849 611 847 605","844 654 852 653 862 660 855 672 837 666 844 655","849 613 876 619 874 627 860 627 850 624 849 614","849 639 860 640 868 645 863 658 846 650 849 640","830 677 845 685 841 694 836 699 825 686 829 678","836 669 853 672 855 675 851 681 847 685 833 676 836 669"]};

const decode = (arr) =>
  arr.map((s) => {
    const n = s.split(" ");
    const pts = [];
    for (let i = 0; i < n.length; i += 2) pts.push([+n[i] / 1000, +n[i + 1] / 1000]);
    return pts;
  });
const OUTLINE_N = decode(SHAPE.outline);
const SULCI_N = decode(SHAPE.sulci);

export default function Neurograph({
  shape = "brain",
  count = 1100,
  linkDistance = 46,
  followSulci = 0.6,
  cohesion = 0.35,
  speed = 0.45,
  pulses = 26,
  glow = 0.55,
  anatomy = 0.28,
  colorA = "#22d3ee",
  colorB = "#a855f7",
  interactive = true,
  flip = false,
  className = "",
  style,
}) {
  const ref = useRef(null);
  const opts = useRef({});
  opts.current = { shape, count, linkDistance, followSulci, cohesion, speed, pulses, glow, anatomy, colorA, colorB, interactive, flip };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0, raf = 0, rot = 0, last = performance.now();
    let BRAIN = null, nodes = [], live = [], ripple = null;
    const mouse = { x: -9999, y: -9999, on: false };

    const rnd = (a, b) => a + Math.random() * (b - a);
    const hex2rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    const mix = (a, b, t) => [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t),
    ];

    function buildBrain() {
      const S = Math.min(W, H / SHAPE.aspect) * 0.92;
      const ox = (W - S) / 2, oy = (H - S * SHAPE.aspect) / 2;
      const fx = opts.current.flip;
      const map = (polys) => polys.map((p) => p.map(([x, y]) => [ox + (fx ? 1 - x : x) * S, oy + y * S]));
      const outline = map(OUTLINE_N), sulci = map(SULCI_N);

      const path = new Path2D();
      for (const p of outline) {
        path.moveTo(p[0][0], p[0][1]);
        for (let i = 1; i < p.length; i++) path.lineTo(p[i][0], p[i][1]);
        path.closePath();
      }
      const sPath = new Path2D();
      for (const p of sulci) {
        sPath.moveTo(p[0][0], p[0][1]);
        for (let i = 1; i < p.length; i++) sPath.lineTo(p[i][0], p[i][1]);
      }

      // one "rail" per sulcus, with cumulative arc length
      const rails = [];
      for (const p of sulci) {
        const segs = []; let total = 0;
        for (let i = 1; i < p.length; i++) {
          const L = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
          if (L < 0.5) continue;
          total += L; segs.push({ a: p[i - 1], b: p[i], acc: total });
        }
        if (total > S * 0.02) rails.push({ segs, total });
      }

      let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
      for (const p of outline) for (const [x, y] of p) {
        if (x < minX) minX = x; if (y < minY) minY = y;
        if (x > maxX) maxX = x; if (y > maxY) maxY = y;
      }
      BRAIN = { path, sPath, rails, bbox: { x: minX, y: minY, w: maxX - minX, h: maxY - minY }, S };
    }

    const inside = (x, y) => ctx.isPointInPath(BRAIN.path, x, y, "nonzero");

    /* constant spacing along the sulci = uniform linear density */
    function sampleRails(n) {
      const rails = BRAIN.rails;
      if (!rails.length || n <= 0) return [];
      const totalLen = rails.reduce((s, r) => s + r.total, 0);
      const step = totalLen / n, j = BRAIN.S * 0.004, pts = [];
      for (const r of rails) {
        let si = 0;
        for (let d = Math.random() * step; d < r.total; d += step) {
          while (si < r.segs.length - 1 && r.segs[si].acc < d) si++;
          const s = r.segs[si];
          const segLen = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]) || 1;
          const u = 1 - Math.min(1, (s.acc - d) / segLen);
          pts.push([s.a[0] + (s.b[0] - s.a[0]) * u + rnd(-j, j), s.a[1] + (s.b[1] - s.a[1]) * u + rnd(-j, j)]);
        }
      }
      return pts;
    }

    const mkNode = (x, y) => ({ x, y, ox: x, oy: y, vx: rnd(-0.7, 0.7), vy: rnd(-0.7, 0.7), r: rnd(0.8, 2.3), t: Math.random() * 6.283, tone: Math.random(), z: 1 });

    function build() {
      const o = opts.current;
      nodes = []; live = [];
      if (o.shape === "brain") {
        for (const p of sampleRails(Math.round(o.count * o.followSulci))) {
          if (inside(p[0], p[1])) nodes.push(mkNode(p[0], p[1]));
        }
        let guard = 0;
        while (nodes.length < o.count && guard < o.count * 400) {
          guard++;
          const b = BRAIN.bbox;
          const x = rnd(b.x, b.x + b.w), y = rnd(b.y, b.y + b.h);
          if (inside(x, y)) nodes.push(mkNode(x, y));
        }
      } else if (o.shape === "globe") {
        const R = Math.min(W, H) * 0.33;
        for (let i = 0; i < o.count; i++) {
          const k = i + 0.5;
          const phi = Math.acos(1 - (2 * k) / o.count), th = Math.PI * (1 + Math.sqrt(5)) * k;
          const n = mkNode(0, 0);
          n.sx = Math.cos(th) * Math.sin(phi); n.sy = Math.sin(th) * Math.sin(phi); n.sz = Math.cos(phi); n.R = R;
          nodes.push(n);
        }
      } else {
        for (let i = 0; i < o.count; i++) nodes.push(mkNode(rnd(0, W), rnd(0, H)));
      }
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      if (!W || !H) return;
      canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildBrain(); build();
    }

    function spawn() {
      const a = nodes[(Math.random() * nodes.length) | 0]; if (!a) return;
      let best = null, bd = Infinity;
      for (let i = 0; i < 16; i++) {
        const b = nodes[(Math.random() * nodes.length) | 0]; if (b === a) continue;
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        if (d < bd && d > 4) { bd = d; best = b; }
      }
      if (best && bd < opts.current.linkDistance * 2.2) live.push({ a, b: best, t: 0, sp: rnd(0.012, 0.03), tone: Math.random() });
    }

    function frame(now) {
      const o = opts.current;
      const RA = hex2rgb(o.colorA), RB = hex2rgb(o.colorB);
      const dt = Math.min(32, now - last); last = now;
      rot += 0.00022 * dt * (0.3 + o.speed);
      ctx.clearRect(0, 0, W, H);

      if (o.shape === "brain" && o.anatomy > 0) {
        ctx.lineJoin = "round";
        ctx.lineWidth = 1.3;
        ctx.strokeStyle = `rgba(${RA.join(",")},${(0.55 * o.anatomy).toFixed(3)})`;
        ctx.stroke(BRAIN.path);
        ctx.lineWidth = 0.9;
        ctx.strokeStyle = `rgba(${RB.join(",")},${(0.42 * o.anatomy).toFixed(3)})`;
        ctx.stroke(BRAIN.sPath);
      }

      for (const n of nodes) {
        if (o.shape === "globe") {
          const cs = Math.cos(rot), sn = Math.sin(rot);
          const X = n.sx * cs - n.sz * sn, Z = n.sx * sn + n.sz * cs, pp = 1 / (1.9 - Z);
          n.x = W / 2 + X * n.R * pp * 1.6; n.y = H / 2 + n.sy * n.R * pp * 1.6; n.z = (Z + 1) / 2;
        } else {
          if (o.shape === "brain") {
            const k = 0.0022 + o.cohesion * 0.02;
            n.vx = (n.vx + (n.ox - n.x) * k) * 0.995;
            n.vy = (n.vy + (n.oy - n.y) * k) * 0.995;
          }
          n.x += n.vx * o.speed * 0.5; n.y += n.vy * o.speed * 0.5;
          if (o.shape === "brain") {
            if (!inside(n.x, n.y)) {
              n.x -= n.vx * o.speed * 0.5; n.y -= n.vy * o.speed * 0.5;
              n.vx = -n.vx * 0.6; n.vy = -n.vy * 0.6;
            }
          } else {
            if (n.x < 0 || n.x > W) n.vx *= -1;
            if (n.y < 0 || n.y > H) n.vy *= -1;
          }
          n.z = 1;
        }
        if (o.interactive && mouse.on) {
          const dx = n.x - mouse.x, dy = n.y - mouse.y, d = Math.hypot(dx, dy);
          if (d < 150 && d > 0.001) { const f = (1 - d / 150) * 1.6; n.x += (dx / d) * f; n.y += (dy / d) * f; }
        }
        n.t += 0.02 + n.r * 0.004;
      }

      if (ripple) { ripple.r += 9; ripple.a *= 0.965; if (ripple.a < 0.02) ripple = null; }

      const cell = o.linkDistance, grid = new Map(), key = (i, j) => i + "," + j;
      nodes.forEach((n, idx) => {
        const k = key(Math.floor(n.x / cell), Math.floor(n.y / cell));
        (grid.get(k) || grid.set(k, []).get(k)).push(idx);
      });
      ctx.lineWidth = 1;
      for (const n of nodes) {
        const ci = Math.floor(n.x / cell), cj = Math.floor(n.y / cell);
        for (let i = ci; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) {
          if (i === ci && j < cj) continue;
          const bucket = grid.get(key(i, j)); if (!bucket) continue;
          for (const bi of bucket) {
            const m = nodes[bi]; if (m === n) continue;
            const d = Math.hypot(m.x - n.x, m.y - n.y); if (d > cell) continue;
            let a = (1 - d / cell) * 0.55;
            if (o.shape === "globe") a *= n.z * 0.7 + 0.3;
            if (o.interactive && mouse.on) {
              const md = Math.hypot((n.x + m.x) / 2 - mouse.x, (n.y + m.y) / 2 - mouse.y);
              if (md < 150) a += (1 - md / 150) * 0.5;
            }
            if (ripple) {
              const rd = Math.abs(Math.hypot(n.x - ripple.x, n.y - ripple.y) - ripple.r);
              if (rd < 60) a += (1 - rd / 60) * ripple.a;
            }
            const c = mix(RA, RB, (n.tone + m.tone) / 2);
            ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${Math.min(a, 1).toFixed(3)})`;
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
          }
        }
      }

      ctx.shadowBlur = 14 * o.glow;
      for (const n of nodes) {
        const c = mix(RA, RB, n.tone);
        const puls = 0.75 + Math.sin(n.t) * 0.35;
        const a = (o.shape === "globe" ? n.z * 0.85 + 0.15 : 1) * (0.55 + 0.45 * puls);
        ctx.shadowColor = `rgba(${c[0]},${c[1]},${c[2]},${0.9 * o.glow})`;
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * puls * (o.shape === "globe" ? 0.6 + n.z * 0.9 : 1), 0, 6.283);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      let tries = 0;
      while (live.length < o.pulses && tries++ < 40) spawn();
      for (let i = live.length - 1; i >= 0; i--) {
        const p = live[i];
        p.t += p.sp * (0.4 + o.speed);
        if (p.t >= 1 || live.length > o.pulses) { live.splice(i, 1); continue; }
        const x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
        const c = mix(RA, RB, p.tone), fade = Math.sin(p.t * Math.PI);
        const g = ctx.createLinearGradient(p.a.x, p.a.y, x, y);
        g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0)`);
        g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},${0.55 * fade})`);
        ctx.strokeStyle = g; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(p.a.x, p.a.y); ctx.lineTo(x, y); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.shadowBlur = 16 * o.glow; ctx.shadowColor = `rgb(${c.join(",")})`;
        ctx.fillStyle = `rgba(255,255,255,${0.9 * fade})`;
        ctx.beginPath(); ctx.arc(x, y, 2.1, 0, 6.283); ctx.fill();
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(frame);
    }

    const onMove = (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true; };
    const onLeave = () => { mouse.on = false; mouse.x = mouse.y = -9999; };
    const onDown = (e) => {
      if (!opts.current.interactive) return;
      const r = canvas.getBoundingClientRect();
      ripple = { x: e.clientX - r.left, y: e.clientY - r.top, r: 0, a: 0.9 };
      for (let i = 0; i < 25; i++) spawn();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onDown);
    if (reduced) frame(performance.now()), cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
    };
  }, [shape, count, followSulci, flip]);

  return <canvas ref={ref} className={className} style={{ display: "block", width: "100%", height: "100%", ...style }} />;
}
