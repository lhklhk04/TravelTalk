/* =========================================================
   TravelTalk — 저장한 표현 (localStorage)

   저장 형식: localStorage["traveltalk.saved"] = [
     {
       phraseId: "fr-cafe-03",
       cityId: "paris" | null,       // 저장할 때 있던 도시 (없으면 null)
       city: { id, name_ko, name_en, country, country_ko, country_en, lat, lng } | null,
                                     // 도시 이름·좌표 사본 (저장 지도에 핀을 찍을 때 사용)
       language: "fr",
       placeType: "cafe",
       savedAt: 1764000000000,
       snapshot: { phrase, meaning_ko, pronunciation_ko, fallback_english }
     }, ...
   ]
   - 같은 표현이라도 도시가 다르면 따로 저장돼요.
   - snapshot은 나중에 phrases.json에서 그 표현이 지워져도 보여 주기 위한 사본이에요.
   ========================================================= */
const SAVED_KEY = "traveltalk.saved";

function loadSaved() {
  try {
    const list = JSON.parse(localStorage.getItem(SAVED_KEY));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeSaved(list) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(list));
}

const sameEntry = (e, phraseId, cityId) =>
  e.phraseId === phraseId && (e.cityId || null) === (cityId || null);

function isSaved(phraseId, cityId) {
  return loadSaved().some((e) => sameEntry(e, phraseId, cityId));
}

// city: cities.json의 도시 객체 (없으면 null)
function addSaved(phrase, city) {
  const cityId = city?.id || null;
  const list = loadSaved();
  if (list.some((e) => sameEntry(e, phrase.id, cityId))) return;
  list.push({
    phraseId: phrase.id,
    cityId,
    city: city
      ? {
          id: city.id,
          name_ko: city.name_ko, name_en: city.name_en,
          country: city.country, country_ko: city.country_ko, country_en: city.country_en,
          lat: city.lat, lng: city.lng,
        }
      : null,
    language: phrase.language,
    placeType: phrase.placeType,
    savedAt: Date.now(),
    snapshot: {
      phrase: phrase.phrase,
      meaning_ko: phrase.meaning_ko,
      meaning_en: phrase.meaning_en,
      pronunciation_ko: phrase.pronunciation_ko,
      pronunciation_en: phrase.pronunciation_en,
      fallback_english: phrase.fallback_english,
    },
  });
  writeSaved(list);
}

// 지운 항목을 돌려줌 (되돌리기에 사용)
function removeSaved(phraseId, cityId) {
  const list = loadSaved();
  const index = list.findIndex((e) => sameEntry(e, phraseId, cityId));
  if (index === -1) return null;
  const [removed] = list.splice(index, 1);
  writeSaved(list);
  return removed;
}

function restoreSaved(entry) {
  const list = loadSaved();
  if (list.some((e) => sameEntry(e, entry.phraseId, entry.cityId))) return;
  list.push(entry);
  writeSaved(list);
}
