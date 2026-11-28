// 자동 생성 파일입니다. 직접 고치지 말고 data/tag-map.json을 고친 뒤
// python tools/sync_data.py 를 실행하세요.
window.TRAVELTALK_DATA = window.TRAVELTALK_DATA || {};
window.TRAVELTALK_DATA.tagMap = {
  "_doc": "OpenStreetMap 태그 → 장소 유형·추천 키워드. tag는 'key=value', 값 여러 개는 'a|b', 아무 값이나는 'key=*'. placeTypes는 위에서부터 처음 맞는 규칙 하나, modifiers는 맞는 것 모두 적용.",
  "placeTypes": [
    {
      "tag": "amenity=restaurant",
      "placeType": "restaurant",
      "ko": "식당",
      "en": "Restaurant",
      "keywords": [
        "주문",
        "메뉴"
      ]
    },
    {
      "tag": "amenity=fast_food",
      "placeType": "cafe",
      "ko": "패스트푸드",
      "en": "Fast food",
      "keywords": [
        "주문",
        "포장"
      ]
    },
    {
      "tag": "amenity=food_court",
      "placeType": "restaurant",
      "ko": "푸드코트",
      "en": "Food court",
      "keywords": [
        "주문"
      ]
    },
    {
      "tag": "amenity=bar|pub",
      "placeType": "restaurant",
      "ko": "바",
      "en": "Bar",
      "keywords": [
        "주문",
        "추천"
      ]
    },
    {
      "tag": "amenity=cafe",
      "placeType": "cafe",
      "ko": "카페",
      "en": "Café",
      "keywords": [
        "주문",
        "커피"
      ]
    },
    {
      "tag": "amenity=ice_cream",
      "placeType": "cafe",
      "ko": "아이스크림",
      "en": "Ice cream",
      "keywords": [
        "주문"
      ]
    },
    {
      "tag": "shop=bakery",
      "placeType": "cafe",
      "ko": "빵집",
      "en": "Bakery",
      "keywords": [
        "빵",
        "포장"
      ]
    },
    {
      "tag": "shop=pastry|confectionery",
      "placeType": "cafe",
      "ko": "디저트 가게",
      "en": "Pastry shop",
      "keywords": [
        "디저트",
        "포장"
      ]
    },
    {
      "tag": "shop=coffee|tea",
      "placeType": "cafe",
      "ko": "커피·차 가게",
      "en": "Coffee & tea shop",
      "keywords": [
        "커피"
      ]
    },
    {
      "tag": "shop=deli",
      "placeType": "cafe",
      "ko": "델리",
      "en": "Deli",
      "keywords": [
        "주문",
        "포장"
      ]
    },
    {
      "tag": "railway=station|halt",
      "placeType": "transport",
      "ko": "기차역",
      "en": "Train station",
      "keywords": [
        "표",
        "기차",
        "역"
      ]
    },
    {
      "tag": "railway=subway_entrance",
      "placeType": "transport",
      "ko": "지하철 입구",
      "en": "Subway entrance",
      "keywords": [
        "지하철",
        "역",
        "길"
      ]
    },
    {
      "tag": "railway=tram_stop",
      "placeType": "transport",
      "ko": "트램 정류장",
      "en": "Tram stop",
      "keywords": [
        "표",
        "방향"
      ]
    },
    {
      "tag": "amenity=bus_station",
      "placeType": "transport",
      "ko": "버스 터미널",
      "en": "Bus station",
      "keywords": [
        "버스",
        "표"
      ]
    },
    {
      "tag": "amenity=taxi",
      "placeType": "transport",
      "ko": "택시 승강장",
      "en": "Taxi stand",
      "keywords": [
        "택시",
        "주소"
      ]
    },
    {
      "tag": "amenity=ferry_terminal",
      "placeType": "transport",
      "ko": "페리 터미널",
      "en": "Ferry terminal",
      "keywords": [
        "표"
      ]
    },
    {
      "tag": "tourism=hotel|motel",
      "placeType": "hotel",
      "ko": "호텔",
      "en": "Hotel",
      "keywords": [
        "체크인",
        "예약"
      ]
    },
    {
      "tag": "tourism=hostel|guest_house|apartment",
      "placeType": "hotel",
      "ko": "숙소",
      "en": "Lodging",
      "keywords": [
        "체크인",
        "예약"
      ]
    },
    {
      "tag": "tourism=museum",
      "placeType": "sight",
      "ko": "박물관",
      "en": "Museum",
      "keywords": [
        "입장료",
        "표",
        "가이드"
      ]
    },
    {
      "tag": "tourism=gallery",
      "placeType": "sight",
      "ko": "미술관",
      "en": "Gallery",
      "keywords": [
        "입장료",
        "사진"
      ]
    },
    {
      "tag": "tourism=zoo|aquarium|theme_park",
      "placeType": "sight",
      "ko": "관람 시설",
      "en": "Attraction park",
      "keywords": [
        "표",
        "입장료"
      ]
    },
    {
      "tag": "tourism=attraction",
      "placeType": "sight",
      "ko": "명소",
      "en": "Attraction",
      "keywords": [
        "사진",
        "입장료"
      ]
    },
    {
      "tag": "tourism=viewpoint",
      "placeType": "sight",
      "ko": "전망대",
      "en": "Viewpoint",
      "keywords": [
        "사진"
      ]
    },
    {
      "tag": "tourism=artwork",
      "placeType": "sight",
      "ko": "예술 작품",
      "en": "Artwork",
      "keywords": [
        "사진"
      ]
    },
    {
      "tag": "tourism=information",
      "placeType": "sight",
      "ko": "관광 안내소",
      "en": "Tourist info",
      "keywords": [
        "가이드",
        "길"
      ]
    },
    {
      "tag": "amenity=place_of_worship",
      "placeType": "sight",
      "ko": "종교 시설",
      "en": "Place of worship",
      "keywords": [
        "사진",
        "허용"
      ]
    },
    {
      "tag": "amenity=theatre|cinema|arts_centre",
      "placeType": "sight",
      "ko": "공연장",
      "en": "Venue",
      "keywords": [
        "표",
        "시간"
      ]
    },
    {
      "tag": "amenity=university|college",
      "placeType": "sight",
      "ko": "대학교",
      "en": "University",
      "keywords": [
        "길",
        "화장실",
        "사진",
        "안내"
      ]
    },
    {
      "tag": "amenity=marketplace",
      "placeType": "shop",
      "ko": "시장",
      "en": "Market",
      "keywords": [
        "가격",
        "할인"
      ]
    },
    {
      "tag": "shop=clothes|fashion|boutique",
      "placeType": "shop",
      "ko": "옷 가게",
      "en": "Clothing store",
      "keywords": [
        "사이즈",
        "입어"
      ]
    },
    {
      "tag": "shop=shoes",
      "placeType": "shop",
      "ko": "신발 가게",
      "en": "Shoe store",
      "keywords": [
        "사이즈"
      ]
    },
    {
      "tag": "shop=gift|souvenir",
      "placeType": "shop",
      "ko": "기념품 가게",
      "en": "Gift shop",
      "keywords": [
        "가격",
        "면세"
      ]
    },
    {
      "tag": "shop=supermarket|convenience",
      "placeType": "shop",
      "ko": "마트·편의점",
      "en": "Grocery store",
      "keywords": [
        "가격",
        "계산",
        "봉투"
      ]
    },
    {
      "tag": "shop=department_store|mall",
      "placeType": "shop",
      "ko": "백화점",
      "en": "Department store",
      "keywords": [
        "면세",
        "사이즈"
      ]
    },
    {
      "tag": "shop=*",
      "placeType": "shop",
      "ko": "상점",
      "en": "Shop",
      "keywords": [
        "가격"
      ]
    }
  ],
  "modifiers": [
    {
      "tag": "cuisine=french",
      "ko": "프랑스 요리",
      "en": "French",
      "keywords": [
        "추천"
      ]
    },
    {
      "tag": "cuisine=japanese|sushi|ramen",
      "ko": "일본 요리",
      "en": "Japanese",
      "keywords": [
        "추천"
      ]
    },
    {
      "tag": "cuisine=spanish|tapas",
      "ko": "스페인 요리",
      "en": "Spanish",
      "keywords": [
        "추천"
      ]
    },
    {
      "tag": "cuisine=korean",
      "ko": "한국 요리",
      "en": "Korean",
      "keywords": [
        "추천"
      ]
    },
    {
      "tag": "cuisine=american|burger",
      "ko": "미국 요리",
      "en": "American",
      "keywords": [
        "추천"
      ]
    },
    {
      "tag": "cuisine=bagel",
      "ko": "베이글",
      "en": "Bagels",
      "keywords": [
        "주문",
        "포장"
      ]
    },
    {
      "tag": "cuisine=coffee_shop",
      "ko": "커피",
      "en": "Coffee",
      "keywords": [
        "커피"
      ]
    },
    {
      "tag": "cuisine=vegetarian|vegan",
      "ko": "채식",
      "en": "Vegetarian",
      "keywords": [
        "채식"
      ]
    },
    {
      "tag": "diet:vegetarian=yes|only",
      "ko": "채식 가능",
      "en": "Veggie-friendly",
      "keywords": [
        "채식"
      ]
    },
    {
      "tag": "diet:vegan=yes|only",
      "ko": "비건 가능",
      "en": "Vegan-friendly",
      "keywords": [
        "비건",
        "채식"
      ]
    },
    {
      "tag": "takeaway=yes|only",
      "ko": "포장 가능",
      "en": "Takeaway",
      "keywords": [
        "포장"
      ]
    },
    {
      "tag": "internet_access=wlan|yes",
      "ko": "와이파이",
      "en": "Wi-Fi",
      "keywords": [
        "와이파이"
      ]
    },
    {
      "tag": "fee=yes",
      "ko": "유료 입장",
      "en": "Paid entry",
      "keywords": [
        "입장료"
      ]
    }
  ]
};
