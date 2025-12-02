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
  "because it cropped out a Black climate activist Vanessa Nakate, erasing\nher presence while centering white activists.",
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
const galleryTrack = document.querySelector(".gallery-track");
const gallerySliderFill = document.querySelector(".gallery-slider-fill");

if (galleryTrack && gallerySliderFill) {
  // 👇 thumb가 전체 트랙의 몇 %를 차지할지 (CSS width랑 맞추면 깔끔)
  const SLIDER_THUMB_PERCENT = 20; // CSS width: 20% 와 매칭

  // 1) 가로 스크롤 진행도에 따라 민트 thumb 위치 업데이트
  const updateGallerySlider = () => {
    const maxScroll = galleryTrack.scrollWidth - galleryTrack.clientWidth;

    if (maxScroll <= 0) {
      // 스크롤할 내용 없을 때는 왼쪽에 고정
      gallerySliderFill.style.left = "0%";
      return;
    }

    const ratio = galleryTrack.scrollLeft / maxScroll; // 0 ~ 1

    // thumb가 움직일 수 있는 최대 범위: 슬라이더 너비(100%) - 셀 너비(20%) = 80%
    const maxOffset = 100 - SLIDER_THUMB_PERCENT;
    const leftPercent = ratio * maxOffset;

    gallerySliderFill.style.left = `${leftPercent}%`;
  };

  galleryTrack.addEventListener("scroll", updateGallerySlider);

  // 2) 데스크톱에서 휠 스크롤을 가로 스크롤로 변환
  const handleWheel = (e) => {
    if (window.innerWidth <= 768) return; // 모바일에서는 기본 세로 스크롤 유지

    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      galleryTrack.scrollLeft += e.deltaY;
    }
  };

  galleryTrack.addEventListener("wheel", handleWheel, { passive: false });

  // 초기 상태 계산
  window.addEventListener("load", updateGallerySlider);
  window.addEventListener("resize", updateGallerySlider);
}
