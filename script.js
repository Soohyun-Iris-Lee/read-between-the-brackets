const sections = document.querySelectorAll(".section");
const dots = document.querySelectorAll(".nav-dot");

// Dot click → scroll
dots.forEach(dot => {
  dot.addEventListener("click", () => {
    const target = document.querySelector(dot.dataset.target);
    if (target) target.scrollIntoView({ behavior: "smooth" });
  });
});

// Intersection Observer
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    const id = "#" + entry.target.id;

    // 섹션 애니메이션
    entry.target.querySelector(".section-animate")?.classList.add("visible");

    // 도트 active
    dots.forEach(dot => {
      dot.classList.toggle("active", dot.dataset.target === id);
    });

    // body 색 모드
    const body = document.body;
    body.classList.remove("section-dark", "section-ivory", "section-mint");

    if (entry.target.classList.contains("section--dark")) {
      body.classList.add("section-dark");
    } else if (entry.target.classList.contains("section--ivory")) {
      body.classList.add("section-ivory");
    } else if (entry.target.classList.contains("section--mint")) {
      body.classList.add("section-mint");
    }
  });
}, {
  threshold: 0.4
});

sections.forEach(section => observer.observe(section));

/* ========================
   Media / Phrase animation
======================== */
const mediaList = [
  "./media_01.png",
  "./media_02.png",
  "./media_03.png",
  "./media_04.png",
  "./media_05.png"
];

const phrases = [
  "fabricates reality.",
  "has bias.",
  "exploits uncertainty.",
  "is misleading.",
  "shapes perception."
];
const supportTexts = [
  "because it cropped out a Black climate activist Vanessa Nakate,\nerasing her presence while centering white activists.",
"because it was an AI-generated image depicting\nPope Francis in a luxury coat he never wore.",
  "because it was an AI-generated image that went viral\nduring the Hurricance Sandy to amply fear.",
  "because it promotes the false belief that a cloud formation\npredicts an earthquake, despite no scientific support.",
  "because the model was AI-generated, it subtly steered\nviewers’ perceptions toward an artificial beauty standard.",
];

const mediaShell   = document.getElementById("mediaShell");
const mediaImage   = document.getElementById("mediaImage");
const mediaFrame   = document.getElementById("mediaFrame");
const phraseText   = document.getElementById("phraseText");
const highlightBar = document.getElementById("highlightBar");
const supportTextEl = document.getElementById("supportText");


const CLOSE_DURATION     = 400;
const EXTRA_CLOSED_TIME  = 250;
const HIGHLIGHT_DELAY    = 650;
const HIGHLIGHT_ANIM_MS  = 450;   // CSS transition 시간과 맞추기
const CYCLE_INTERVAL     = 7000;

let index = 0;
let highlightTargetWidth = 0;
let typingTimeoutId = null;


/* 🔹 phrase 실제 렌더 폭 + 여유 8px 계산 */
function updateHighlightTargetWidth() {
  const textWidth = phraseText.offsetWidth;
  highlightTargetWidth = textWidth + 8;   // ← 여유 길이: 8px (원하면 4~12로 조정)
}


function playCycle() {
  // 0) 이전 하이라이트를 끝에서 0으로 "줄어들게"
  highlightBar.style.width = "0px";

  // 🔹 supporting sentence fade-out
  supportTextEl.style.opacity = 0;

  // 1) 브래킷 + 미디어 가로 수축
  mediaShell.classList.add("media-shell--closed");
  mediaFrame.classList.add("media-frame--closed");

  // 2) 미디어 / phrase 교체
  setTimeout(() => {
    index = (index + 1) % phrases.length;

    // 이미지 페이드 교체
    mediaImage.style.opacity = 0;
    setTimeout(() => {
      mediaImage.src = mediaList[index];
      mediaImage.style.opacity = 1;
    }, 200);

    // phrase 교체
    phraseText.textContent = phrases[index];

    // 새 phrase 기준 하이라이트 길이 계산
    updateHighlightTargetWidth();
  }, CLOSE_DURATION);

  // 3) 브래킷 / 미디어 다시 펼치기
  setTimeout(() => {
    mediaShell.classList.remove("media-shell--closed");
    mediaFrame.classList.remove("media-frame--closed");
  }, CLOSE_DURATION + EXTRA_CLOSED_TIME);

  // 4) 하이라이트 확장 시작
  const highlightStartTime = CLOSE_DURATION + EXTRA_CLOSED_TIME + HIGHLIGHT_DELAY;

  setTimeout(() => {
    // 0 → targetWidth로 확장
    highlightBar.style.width = `${highlightTargetWidth}px`;

    // 하이라이트 애니메이션이 끝난 직후에 타입라이터 시작
    setTimeout(() => {
      const support = supportTexts[index];
      startTypewriter(support);
    }, HIGHLIGHT_ANIM_MS);
  }, highlightStartTime);
}




function startTypewriter(text) {
  // 이전 타이핑 중이면 중단
  if (typingTimeoutId) {
    clearTimeout(typingTimeoutId);
    typingTimeoutId = null;
  }

  const full = text;
  let charIndex = 0;

  // 🔹 모바일일 때는 타이핑 전에 2줄에 맞게 폰트 미리 계산
  prefitSupportTextForMobile(full);

  // 새 문장 시작: 내용 비우고 opacity 올리기
  supportTextEl.innerHTML = "";
  supportTextEl.style.opacity = 1;

  function step() {
    const partial = full.slice(0, charIndex);
    supportTextEl.innerHTML = partial.replace(/\n/g, "<br>");

    if (charIndex < full.length) {
      charIndex++;
      typingTimeoutId = setTimeout(step, 28); // 타이핑 속도
    } else {
      typingTimeoutId = null;
    }
  }

  step();
}


// 🔹 모바일에서 서포팅 텍스트가 항상 2줄 안에 들어가도록
function prefitSupportTextForMobile(text) {
  if (window.innerWidth > 768) {
    // 데스크탑은 건드리지 않음
    supportTextEl.style.fontSize = "";
    return;
  }

  // 기본 폰트로 초기화
  supportTextEl.style.fontSize = "";
  supportTextEl.style.opacity = 0;   // 계산용 상태는 안 보이게

  // 전체 텍스트를 먼저 넣고 줄 수 측정
  supportTextEl.innerHTML = text.replace(/\n/g, "<br>");

  let computed = window.getComputedStyle(supportTextEl);
  let fontSize = parseFloat(computed.fontSize);
  let lineHeight = parseFloat(computed.lineHeight);

  const maxLines = 2;
  let safety = 0;

  // scrollHeight가 2줄(lineHeight * 2)을 넘으면 폰트를 줄이기
  while (
    supportTextEl.scrollHeight > lineHeight * maxLines &&
    fontSize > 10 &&
    safety < 12
  ) {
    fontSize -= 1;
    supportTextEl.style.fontSize = fontSize + "px";

    computed = window.getComputedStyle(supportTextEl);
    lineHeight = parseFloat(computed.lineHeight);
    safety++;
  }

  // 계산 끝났으면 내용은 다시 비우고, opacity는 typewriter에서 다시 1로
  supportTextEl.innerHTML = "";
}


window.addEventListener("load", () => {
  updateHighlightTargetWidth();
  highlightBar.style.width = "0px";
  supportTextEl.style.opacity = 1;

  playCycle();
  setInterval(playCycle, CYCLE_INTERVAL);
});

/* ========================
   Section 3 – Gallery slider
======================== */
/* ========================
   Section 3 – Gallery slider
======================== */
/* ========================
   Gallery sliders (section3 + section5)
======================== */

const galleryTracks = document.querySelectorAll(".gallery-track");

const SLIDER_THUMB_PERCENT = 20; // CSS width: 20%와 매칭

galleryTracks.forEach((track) => {
  const fill = track.parentElement.querySelector(".gallery-slider-fill");
  if (!fill) return;

  const updateGallerySlider = () => {
    const maxScroll = track.scrollWidth - track.clientWidth;

    if (maxScroll <= 0) {
      fill.style.left = "0%";
      return;
    }

    const ratio = track.scrollLeft / maxScroll; // 0 ~ 1
    const maxOffset = 100 - SLIDER_THUMB_PERCENT;
    const leftPercent = ratio * maxOffset;

    fill.style.left = `${leftPercent}%`;
  };

  // 가로 스크롤에 따라 thumb 위치 업데이트
  track.addEventListener("scroll", updateGallerySlider);

  // 데스크톱에서 세로 휠을 가로 스크롤로 변환
  const handleWheel = (e) => {
    if (window.innerWidth <= 768) return; // 모바일에서는 기본 동작 유지

    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      track.scrollLeft += e.deltaY;
    }
  };

  track.addEventListener("wheel", handleWheel, { passive: false });

  // 초기 상태 계산
  window.addEventListener("load", updateGallerySlider);
  window.addEventListener("resize", updateGallerySlider);
});

/* ========================
   Sticker pack download
======================== */

const downloadBtn = document.getElementById("downloadStickerBtn");

if (downloadBtn) {
  // ✅ 여기에 실제 스티커 이미지 파일 경로를 넣어주면 돼
  // 예시: 프로젝트 루트에 /stickers 폴더 만들고 그 안에 저장
  const stickerFiles = [
    "./readbetweenthebrackets_stickers-01.png",
   "./readbetweenthebrackets_stickers-02.png",
   "./readbetweenthebrackets_stickers-03.png",
   "./readbetweenthebrackets_stickers-04.png",
   "./readbetweenthebrackets_stickers-05.png",
   "./readbetweenthebrackets_stickers-06.png",
   "./readbetweenthebrackets_stickers-07.png",
   "./readbetweenthebrackets_stickers-08.png",
   "./readbetweenthebrackets_stickers-09.png",
   "./readbetweenthebrackets_stickers-10.png",
   "./readbetweenthebrackets_stickers-11.png",
   "./readbetweenthebrackets_stickers-12.png",
   "./readbetweenthebrackets_stickers-13.png",
   "./readbetweenthebrackets_stickers-14.png",
   "./readbetweenthebrackets_stickers-15.png",
   "./readbetweenthebrackets_stickers-16.png",

  ];

  const triggerDownload = (url) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = "";           // 파일명은 URL에서 자동으로 추론
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  downloadBtn.addEventListener("click", () => {
    // 여러 파일을 순차적으로 다운로드 (약간 딜레이 줘서 브라우저 부담 줄이기)
    stickerFiles.forEach((fileUrl, idx) => {
      setTimeout(() => triggerDownload(fileUrl), idx * 150);
    });
  });
}
/* ========================
   Gallery lightbox (zoom on click – img + video)
======================== */

document.addEventListener("DOMContentLoaded", () => {
  const lightboxOverlay = document.getElementById("lightboxOverlay");
  const lightboxImage   = document.getElementById("lightboxImage");
  const lightboxVideo   = document.getElementById("lightboxVideo");

  if (!lightboxOverlay || !lightboxImage || !lightboxVideo) return;

  // 섹션 3 + 5 안의 모든 이미지/비디오 대상
  const galleryMedia = document.querySelectorAll(
    ".gallery-item img, .gallery-item video"
  );

  galleryMedia.forEach((mediaEl) => {
    mediaEl.style.cursor = "zoom-in";

    mediaEl.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // 매번 열기 전에 둘 다 비활성화 & 비디오 정리
      lightboxImage.classList.remove("is-active");
      lightboxVideo.classList.remove("is-active");
      lightboxVideo.pause();
      lightboxVideo.removeAttribute("src");

      // 이미지 클릭인 경우
      if (mediaEl.tagName.toLowerCase() === "img") {
        const imgSrc = mediaEl.getAttribute("src");
        if (!imgSrc) return;

        lightboxImage.src = imgSrc;
        lightboxImage.classList.add("is-active");
      }

      // 비디오 클릭인 경우
      if (mediaEl.tagName.toLowerCase() === "video") {
        let videoSrc = mediaEl.getAttribute("src");

        // <video><source src="..."></video> 구조인 경우
        if (!videoSrc) {
          const sourceEl = mediaEl.querySelector("source");
          if (sourceEl) {
            videoSrc = sourceEl.getAttribute("src");
          }
        }

        if (!videoSrc) return;

        lightboxVideo.src = videoSrc;
        lightboxVideo.classList.add("is-active");

        // 자동 재생 (브라우저 정책 때문에 mute가 켜져 있어야 잘 됨)
        lightboxVideo.play().catch(() => {});
      }

      // 오버레이 열기
      lightboxOverlay.classList.add("is-open");
    });
  });

  // 배경 클릭 → 닫기 (안쪽 박스 클릭 시 유지)
  lightboxOverlay.addEventListener("click", (e) => {
    const inside = e.target.closest(".lightbox-inner");
    if (!inside) {
      closeLightbox();
    }
  });

  // ESC 키로 닫기
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" || e.key === "Esc") {
      if (lightboxOverlay.classList.contains("is-open")) {
        closeLightbox();
      }
    }
  });

  function closeLightbox() {
    lightboxOverlay.classList.remove("is-open");

    // 이미지 정리
    lightboxImage.classList.remove("is-active");
    lightboxImage.src = "";

    // 비디오 정리
    lightboxVideo.classList.remove("is-active");
    lightboxVideo.pause();
    lightboxVideo.removeAttribute("src");
  }
});
