/* =========================================================
   TravelTalk — 발음 듣기 (브라우저 내장 speechSynthesis)
   - 언어별로 기기에 설치된 목소리를 골라 읽어요.
   - 목소리 목록은 브라우저가 늦게 불러오는 경우가 있어 voiceschanged를 기다려요.
   ========================================================= */
const SPEECH_LANG = { fr: "fr-FR", ja: "ja-JP", es: "es-ES", ko: "ko-KR", en: "en-US" };

const speech = {
  supported: "speechSynthesis" in window && "SpeechSynthesisUtterance" in window,
  voices: [],
  rate: 0.9,
  currentButton: null,
};

function refreshVoices() {
  if (!speech.supported) return;
  speech.voices = window.speechSynthesis.getVoices();
}

if (speech.supported) {
  refreshVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", refreshVoices);
}

// 언어 코드(fr/ja/es)에 맞는 목소리. 정확히 fr-FR → 없으면 fr-* 아무거나
function findVoice(lang) {
  const full = SPEECH_LANG[lang];
  const norm = (v) => v.lang.replace("_", "-");
  return (
    speech.voices.find((v) => norm(v) === full) ||
    speech.voices.find((v) => norm(v).toLowerCase().startsWith(lang)) ||
    null
  );
}

function hasVoice(lang) {
  return Boolean(findVoice(lang));
}

/**
 * 문장 읽기
 * @param {string} text
 * @param {"fr"|"ja"|"es"} lang
 * @param {HTMLElement} [button] 재생 중 표시할 버튼
 * @returns {"ok"|"unsupported"|"no-voice"} no-voice여도 기본 목소리로 시도는 해요
 */
function speak(text, lang, button) {
  if (!speech.supported) return "unsupported";

  const synth = window.speechSynthesis;
  const sameButton = button && speech.currentButton === button && synth.speaking;
  synth.cancel();
  markPlaying(null);
  if (sameButton) return "ok"; // 재생 중인 버튼을 다시 누르면 멈춤

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = SPEECH_LANG[lang] || lang;
  utter.rate = speech.rate;
  const voice = findVoice(lang);
  if (voice) utter.voice = voice;

  utter.onend = utter.onerror = () => {
    if (speech.currentButton === button) markPlaying(null);
  };
  markPlaying(button);
  synth.speak(utter);
  return voice ? "ok" : "no-voice";
}

function markPlaying(button) {
  speech.currentButton?.classList.remove("is-playing");
  speech.currentButton = button || null;
  button?.classList.add("is-playing");
}

function stopSpeaking() {
  if (speech.supported) window.speechSynthesis.cancel();
  markPlaying(null);
}
