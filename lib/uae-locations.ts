// ============================================================
// lib/uae-locations.ts
// UAE emirates/areas data, mirroring lib/nigerian-locations.ts's
// pattern exactly — plain module (no "use client") so it's usable
// from server code too. Nothing imports this yet; it exists purely
// as ready-to-use data for whichever form gets UAE support wired in
// next. The UAE has no LGA-equivalent tier — "Area" here means a
// well-known district/neighborhood within the emirate (e.g. Jumeirah
// within Dubai), the closest real-world analog.
// ============================================================

export const UAE_EMIRATES = [
  "Abu Dhabi",
  "Dubai",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
]

export const UAE_AREAS: Record<string, string[]> = {
  "Abu Dhabi": [
    "Abu Dhabi City", "Al Ain", "Al Reem Island", "Al Raha", "Khalifa City",
    "Yas Island", "Saadiyat Island", "Mussafah", "Al Shamkha", "Madinat Zayed",
    "Al Ruwais", "Liwa", "Al Bahia", "Al Falah", "Al Nahyan",
  ],
  "Dubai": [
    "Deira", "Bur Dubai", "Downtown Dubai", "Business Bay", "Jumeirah",
    "Al Barsha", "Dubai Marina", "Jumeirah Lake Towers (JLT)", "Jumeirah Village Circle (JVC)",
    "Al Quoz", "Dubai Silicon Oasis", "International City", "Mirdif", "Al Nahda",
    "Al Qusais", "Karama", "Satwa", "Discovery Gardens", "Dubai Investment Park",
    "Dubai South", "Arabian Ranches", "The Springs / The Meadows", "Al Furjan", "Dubailand",
  ],
  "Sharjah": [
    "Sharjah City", "Al Nahda (Sharjah)", "Al Majaz", "Al Taawun", "Muwaileh",
    "Al Qasimia", "Al Khan", "University City", "Al Nuaimiya",
  ],
  "Ajman": [
    "Ajman City", "Al Nuaimiya", "Al Rashidiya", "Al Jurf", "Al Rawda",
  ],
  "Umm Al Quwain": [
    "Umm Al Quwain City", "Al Salamah", "Al Ramlah",
  ],
  "Ras Al Khaimah": [
    "Ras Al Khaimah City", "Al Nakheel", "Al Hamra", "Al Marjan Island", "Al Rams",
  ],
  "Fujairah": [
    "Fujairah City", "Dibba Al-Fujairah", "Masafi", "Al Bidyah",
  ],
}
