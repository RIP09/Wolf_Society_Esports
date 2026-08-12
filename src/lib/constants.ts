/** Esports titles played competitively worldwide, across every major genre. */
export const GAMES = [
  // FPS
  "Valorant",
  "Counter-Strike 2",
  "Apex Legends",
  "Overwatch 2",
  "Rainbow Six Siege",
  "Call of Duty: Warzone",
  "Call of Duty: Black Ops 6",
  "Call of Duty: Modern Warfare III",
  "Fortnite",
  "PUBG: Battlegrounds",
  "Escape from Tarkov",
  "XDefiant",
  "CrossFire",
  "Sudden Attack",
  "Point Blank",
  "Halo Infinite",
  "Destiny 2",
  "The Finals",
  "Splitgate",
  "Team Fortress 2",
  // MOBA
  "League of Legends",
  "Dota 2",
  "Mobile Legends: Bang Bang",
  "Honor of Kings",
  "Arena of Valor",
  "League of Legends: Wild Rift",
  "Smite",
  "Heroes of the Storm",
  "Pokémon Unite",
  // Battle Royale
  "Free Fire",
  "Brawl Stars",
  "Call of Duty: Mobile",
  "Naraka: Bladepoint",
  "Super People",
  // Fighting
  "Street Fighter 6",
  "Tekken 8",
  "Mortal Kombat 1",
  "Super Smash Bros. Ultimate",
  "Guilty Gear Strive",
  "Dragon Ball FighterZ",
  "The King of Fighters XV",
  "Granblue Fantasy Versus",
  "Injustice 2",
  "Melty Blood: Type Lumina",
  // Sports & Racing
  "EA Sports FC 25",
  "eFootball 2025",
  "Rocket League",
  "NBA 2K25",
  "Madden NFL 25",
  "F1 24",
  "MLB The Show 24",
  "iRacing",
  "Gran Turismo 7",
  "Forza Motorsport",
  "Assetto Corsa Competizione",
  "eCricket",
  "FIFAe World Cup",
  "eBaseball: Pro Yakyuu Spirits",
  // RTS & Strategy
  "StarCraft II",
  "Age of Empires IV",
  "Age of Empires II: Definitive Edition",
  "Warcraft III: Reforged",
  "Teamfight Tactics",
  "Clash Royale",
  "Clash of Clans",
  // Card & Tabletop
  "Hearthstone",
  "Legends of Runeterra",
  "Magic: The Gathering Arena",
  "Marvel Snap",
  "Shadowverse",
  // Party & Platform
  "Brawlhalla",
  "Fall Guys",
  "Trackmania",
  "Splatoon 3",
  "Minecraft Championship",
  "Genshin Impact",
  "World of Warcraft Arena",
  "Paladins",
  "Chess.com",
  "Rocket Racing",
] as const;

export type Game = (typeof GAMES)[number];

/** Every competitive region used by worldwide esports circuits. */
export const REGIONS = [
  "North America",
  "South America",
  "Brazil",
  "LATAM",
  "Europe",
  "Western Europe",
  "Eastern Europe",
  "CIS",
  "Middle East",
  "MENA",
  "Africa",
  "South Africa",
  "India",
  "South Asia",
  "Southeast Asia",
  "East Asia",
  "South Korea",
  "China",
  "Japan",
  "Taiwan",
  "Oceania",
  "Australia",
  "New Zealand",
  "Worldwide",
] as const;

/** In-game roles across every esports genre, worldwide. */
export const IN_GAME_ROLES = [
  // FPS roles
  "Duelist",
  "Initiator",
  "Controller",
  "Sentinel",
  "IGL (In-Game Leader)",
  "Entry Fragger",
  "Support",
  "AWPer",
  "Rifler",
  "Lurker",
  "Sniper",
  "Shot Caller",
  "Clutch Player",
  "Coach",
  "Analyst",
  "Substitute",
  "Stand-in",
  // MOBA roles
  "Top Laner",
  "Jungler",
  "Mid Laner",
  "ADC / Bot",
  "Support (Mage)",
  "Offlaner",
  "Carry",
  "Roamer",
  "Drafter",
  "Flex Player",
  "Tank",
  "Healer",
  // Fighting game archetypes
  "Zoner",
  "Rushdown",
  "Grappler",
  "Footsies Specialist",
  // Battle Royale / FPS-Tactics
  "Fragger",
  "IGL (Battle Royale)",
  "Anchor",
  "Pathfinder",
  // Racing
  "Time Trial Specialist",
  "Race Strategist",
  // Team / generic
  "Captain",
  "Flex",
  "Team Manager",
  "Content Creator",
] as const;

export const MATCH_TYPES = ["scrim", "tournament", "ranked", "tryout"] as const;

export const PRIORITIES = ["info", "important", "urgent"] as const;

/** Roles that can be granted through the management access page. */
export const MANAGEMENT_ROLES = [
  "Super Admin",
  "Director",
  "General Manager",
  "Team Manager",
  "Operations Manager",
  "Coach",
  "Assistant Coach",
  "Analyst",
  "Data Analyst",
  "Talent Scout",
  "Media & Content Manager",
  "Content Creator",
  "Social Media Manager",
  "Community Manager",
  "Event Manager",
  "Finance Officer",
  "Broadcast Producer",
] as const;

/** Content categories for the public portal CMS. */
export const CONTENT_CATEGORIES = [
  "News",
  "Match Reports",
  "Interviews",
  "Announcements",
  "Recruiting",
  "Guides",
  "Media",
] as const;

/** Sponsor tiers shown on the public sponsors page. */
export const SPONSOR_TIERS = ["platinum", "gold", "silver", "partner"] as const;

// ---------------------------------------------------------------------------
// Registration form: worldwide countries + dial codes, game roles, options
// ---------------------------------------------------------------------------

/**
 * Every country in the world with its dial code, for the phone-number
 * country-code picker and the "where do you live" question.
 */
export const COUNTRIES = [
  { name: "Afghanistan", code: "AF", dial: "+93" },
  { name: "Albania", code: "AL", dial: "+355" },
  { name: "Algeria", code: "DZ", dial: "+213" },
  { name: "American Samoa", code: "AS", dial: "+1-684" },
  { name: "Andorra", code: "AD", dial: "+376" },
  { name: "Angola", code: "AO", dial: "+244" },
  { name: "Anguilla", code: "AI", dial: "+1-264" },
  { name: "Antigua and Barbuda", code: "AG", dial: "+1-268" },
  { name: "Argentina", code: "AR", dial: "+54" },
  { name: "Armenia", code: "AM", dial: "+374" },
  { name: "Aruba", code: "AW", dial: "+297" },
  { name: "Australia", code: "AU", dial: "+61" },
  { name: "Austria", code: "AT", dial: "+43" },
  { name: "Azerbaijan", code: "AZ", dial: "+994" },
  { name: "Bahamas", code: "BS", dial: "+1-242" },
  { name: "Bahrain", code: "BH", dial: "+973" },
  { name: "Bangladesh", code: "BD", dial: "+880" },
  { name: "Barbados", code: "BB", dial: "+1-246" },
  { name: "Belarus", code: "BY", dial: "+375" },
  { name: "Belgium", code: "BE", dial: "+32" },
  { name: "Belize", code: "BZ", dial: "+501" },
  { name: "Benin", code: "BJ", dial: "+229" },
  { name: "Bermuda", code: "BM", dial: "+1-441" },
  { name: "Bhutan", code: "BT", dial: "+975" },
  { name: "Bolivia", code: "BO", dial: "+591" },
  { name: "Bosnia and Herzegovina", code: "BA", dial: "+387" },
  { name: "Botswana", code: "BW", dial: "+267" },
  { name: "Brazil", code: "BR", dial: "+55" },
  { name: "British Virgin Islands", code: "VG", dial: "+1-284" },
  { name: "Brunei", code: "BN", dial: "+673" },
  { name: "Bulgaria", code: "BG", dial: "+359" },
  { name: "Burkina Faso", code: "BF", dial: "+226" },
  { name: "Burundi", code: "BI", dial: "+257" },
  { name: "Cambodia", code: "KH", dial: "+855" },
  { name: "Cameroon", code: "CM", dial: "+237" },
  { name: "Canada", code: "CA", dial: "+1" },
  { name: "Cape Verde", code: "CV", dial: "+238" },
  { name: "Cayman Islands", code: "KY", dial: "+1-345" },
  { name: "Central African Republic", code: "CF", dial: "+236" },
  { name: "Chad", code: "TD", dial: "+235" },
  { name: "Chile", code: "CL", dial: "+56" },
  { name: "China", code: "CN", dial: "+86" },
  { name: "Colombia", code: "CO", dial: "+57" },
  { name: "Comoros", code: "KM", dial: "+269" },
  { name: "Congo (DRC)", code: "CD", dial: "+243" },
  { name: "Congo (Republic)", code: "CG", dial: "+242" },
  { name: "Cook Islands", code: "CK", dial: "+682" },
  { name: "Costa Rica", code: "CR", dial: "+506" },
  { name: "Côte d'Ivoire", code: "CI", dial: "+225" },
  { name: "Croatia", code: "HR", dial: "+385" },
  { name: "Cuba", code: "CU", dial: "+53" },
  { name: "Cyprus", code: "CY", dial: "+357" },
  { name: "Czech Republic", code: "CZ", dial: "+420" },
  { name: "Denmark", code: "DK", dial: "+45" },
  { name: "Djibouti", code: "DJ", dial: "+253" },
  { name: "Dominica", code: "DM", dial: "+1-767" },
  { name: "Dominican Republic", code: "DO", dial: "+1-809" },
  { name: "Ecuador", code: "EC", dial: "+593" },
  { name: "Egypt", code: "EG", dial: "+20" },
  { name: "El Salvador", code: "SV", dial: "+503" },
  { name: "Equatorial Guinea", code: "GQ", dial: "+240" },
  { name: "Eritrea", code: "ER", dial: "+291" },
  { name: "Estonia", code: "EE", dial: "+372" },
  { name: "Eswatini", code: "SZ", dial: "+268" },
  { name: "Ethiopia", code: "ET", dial: "+251" },
  { name: "Falkland Islands", code: "FK", dial: "+500" },
  { name: "Faroe Islands", code: "FO", dial: "+298" },
  { name: "Fiji", code: "FJ", dial: "+679" },
  { name: "Finland", code: "FI", dial: "+358" },
  { name: "France", code: "FR", dial: "+33" },
  { name: "French Guiana", code: "GF", dial: "+594" },
  { name: "French Polynesia", code: "PF", dial: "+689" },
  { name: "Gabon", code: "GA", dial: "+241" },
  { name: "Gambia", code: "GM", dial: "+220" },
  { name: "Georgia", code: "GE", dial: "+995" },
  { name: "Germany", code: "DE", dial: "+49" },
  { name: "Ghana", code: "GH", dial: "+233" },
  { name: "Gibraltar", code: "GI", dial: "+350" },
  { name: "Greece", code: "GR", dial: "+30" },
  { name: "Greenland", code: "GL", dial: "+299" },
  { name: "Grenada", code: "GD", dial: "+1-473" },
  { name: "Guadeloupe", code: "GP", dial: "+590" },
  { name: "Guam", code: "GU", dial: "+1-671" },
  { name: "Guatemala", code: "GT", dial: "+502" },
  { name: "Guinea", code: "GN", dial: "+224" },
  { name: "Guinea-Bissau", code: "GW", dial: "+245" },
  { name: "Guyana", code: "GY", dial: "+592" },
  { name: "Haiti", code: "HT", dial: "+509" },
  { name: "Honduras", code: "HN", dial: "+504" },
  { name: "Hong Kong", code: "HK", dial: "+852" },
  { name: "Hungary", code: "HU", dial: "+36" },
  { name: "Iceland", code: "IS", dial: "+354" },
  { name: "India", code: "IN", dial: "+91" },
  { name: "Indonesia", code: "ID", dial: "+62" },
  { name: "Iran", code: "IR", dial: "+98" },
  { name: "Iraq", code: "IQ", dial: "+964" },
  { name: "Ireland", code: "IE", dial: "+353" },
  { name: "Israel", code: "IL", dial: "+972" },
  { name: "Italy", code: "IT", dial: "+39" },
  { name: "Jamaica", code: "JM", dial: "+1-876" },
  { name: "Japan", code: "JP", dial: "+81" },
  { name: "Jordan", code: "JO", dial: "+962" },
  { name: "Kazakhstan", code: "KZ", dial: "+7" },
  { name: "Kenya", code: "KE", dial: "+254" },
  { name: "Kiribati", code: "KI", dial: "+686" },
  { name: "Kosovo", code: "XK", dial: "+383" },
  { name: "Kuwait", code: "KW", dial: "+965" },
  { name: "Kyrgyzstan", code: "KG", dial: "+996" },
  { name: "Laos", code: "LA", dial: "+856" },
  { name: "Latvia", code: "LV", dial: "+371" },
  { name: "Lebanon", code: "LB", dial: "+961" },
  { name: "Lesotho", code: "LS", dial: "+266" },
  { name: "Liberia", code: "LR", dial: "+231" },
  { name: "Libya", code: "LY", dial: "+218" },
  { name: "Liechtenstein", code: "LI", dial: "+423" },
  { name: "Lithuania", code: "LT", dial: "+370" },
  { name: "Luxembourg", code: "LU", dial: "+352" },
  { name: "Macau", code: "MO", dial: "+853" },
  { name: "Madagascar", code: "MG", dial: "+261" },
  { name: "Malawi", code: "MW", dial: "+265" },
  { name: "Malaysia", code: "MY", dial: "+60" },
  { name: "Maldives", code: "MV", dial: "+960" },
  { name: "Mali", code: "ML", dial: "+223" },
  { name: "Malta", code: "MT", dial: "+356" },
  { name: "Marshall Islands", code: "MH", dial: "+692" },
  { name: "Martinique", code: "MQ", dial: "+596" },
  { name: "Mauritania", code: "MR", dial: "+222" },
  { name: "Mauritius", code: "MU", dial: "+230" },
  { name: "Mexico", code: "MX", dial: "+52" },
  { name: "Micronesia", code: "FM", dial: "+691" },
  { name: "Moldova", code: "MD", dial: "+373" },
  { name: "Monaco", code: "MC", dial: "+377" },
  { name: "Mongolia", code: "MN", dial: "+976" },
  { name: "Montenegro", code: "ME", dial: "+382" },
  { name: "Morocco", code: "MA", dial: "+212" },
  { name: "Mozambique", code: "MZ", dial: "+258" },
  { name: "Myanmar", code: "MM", dial: "+95" },
  { name: "Namibia", code: "NA", dial: "+264" },
  { name: "Nauru", code: "NR", dial: "+674" },
  { name: "Nepal", code: "NP", dial: "+977" },
  { name: "Netherlands", code: "NL", dial: "+31" },
  { name: "New Caledonia", code: "NC", dial: "+687" },
  { name: "New Zealand", code: "NZ", dial: "+64" },
  { name: "Nicaragua", code: "NI", dial: "+505" },
  { name: "Niger", code: "NE", dial: "+227" },
  { name: "Nigeria", code: "NG", dial: "+234" },
  { name: "North Korea", code: "KP", dial: "+850" },
  { name: "North Macedonia", code: "MK", dial: "+389" },
  { name: "Norway", code: "NO", dial: "+47" },
  { name: "Oman", code: "OM", dial: "+968" },
  { name: "Pakistan", code: "PK", dial: "+92" },
  { name: "Palau", code: "PW", dial: "+680" },
  { name: "Palestine", code: "PS", dial: "+970" },
  { name: "Panama", code: "PA", dial: "+507" },
  { name: "Papua New Guinea", code: "PG", dial: "+675" },
  { name: "Paraguay", code: "PY", dial: "+595" },
  { name: "Peru", code: "PE", dial: "+51" },
  { name: "Philippines", code: "PH", dial: "+63" },
  { name: "Poland", code: "PL", dial: "+48" },
  { name: "Portugal", code: "PT", dial: "+351" },
  { name: "Puerto Rico", code: "PR", dial: "+1-787" },
  { name: "Qatar", code: "QA", dial: "+974" },
  { name: "Réunion", code: "RE", dial: "+262" },
  { name: "Romania", code: "RO", dial: "+40" },
  { name: "Russia", code: "RU", dial: "+7" },
  { name: "Rwanda", code: "RW", dial: "+250" },
  { name: "Saint Kitts and Nevis", code: "KN", dial: "+1-869" },
  { name: "Saint Lucia", code: "LC", dial: "+1-758" },
  { name: "Saint Vincent", code: "VC", dial: "+1-784" },
  { name: "Samoa", code: "WS", dial: "+685" },
  { name: "San Marino", code: "SM", dial: "+378" },
  { name: "Saudi Arabia", code: "SA", dial: "+966" },
  { name: "Senegal", code: "SN", dial: "+221" },
  { name: "Serbia", code: "RS", dial: "+381" },
  { name: "Seychelles", code: "SC", dial: "+248" },
  { name: "Sierra Leone", code: "SL", dial: "+232" },
  { name: "Singapore", code: "SG", dial: "+65" },
  { name: "Slovakia", code: "SK", dial: "+421" },
  { name: "Slovenia", code: "SI", dial: "+386" },
  { name: "Solomon Islands", code: "SB", dial: "+677" },
  { name: "Somalia", code: "SO", dial: "+252" },
  { name: "South Africa", code: "ZA", dial: "+27" },
  { name: "South Korea", code: "KR", dial: "+82" },
  { name: "South Sudan", code: "SS", dial: "+211" },
  { name: "Spain", code: "ES", dial: "+34" },
  { name: "Sri Lanka", code: "LK", dial: "+94" },
  { name: "Sudan", code: "SD", dial: "+249" },
  { name: "Suriname", code: "SR", dial: "+597" },
  { name: "Sweden", code: "SE", dial: "+46" },
  { name: "Switzerland", code: "CH", dial: "+41" },
  { name: "Syria", code: "SY", dial: "+963" },
  { name: "Taiwan", code: "TW", dial: "+886" },
  { name: "Tajikistan", code: "TJ", dial: "+992" },
  { name: "Tanzania", code: "TZ", dial: "+255" },
  { name: "Thailand", code: "TH", dial: "+66" },
  { name: "Timor-Leste", code: "TL", dial: "+670" },
  { name: "Togo", code: "TG", dial: "+228" },
  { name: "Tonga", code: "TO", dial: "+676" },
  { name: "Trinidad and Tobago", code: "TT", dial: "+1-868" },
  { name: "Tunisia", code: "TN", dial: "+216" },
  { name: "Turkey", code: "TR", dial: "+90" },
  { name: "Turkmenistan", code: "TM", dial: "+993" },
  { name: "Turks and Caicos", code: "TC", dial: "+1-649" },
  { name: "Tuvalu", code: "TV", dial: "+688" },
  { name: "Uganda", code: "UG", dial: "+256" },
  { name: "Ukraine", code: "UA", dial: "+380" },
  { name: "United Arab Emirates", code: "AE", dial: "+971" },
  { name: "United Kingdom", code: "GB", dial: "+44" },
  { name: "United States", code: "US", dial: "+1" },
  { name: "Uruguay", code: "UY", dial: "+598" },
  { name: "Uzbekistan", code: "UZ", dial: "+998" },
  { name: "Vanuatu", code: "VU", dial: "+678" },
  { name: "Vatican City", code: "VA", dial: "+39" },
  { name: "Venezuela", code: "VE", dial: "+58" },
  { name: "Vietnam", code: "VN", dial: "+84" },
  { name: "Yemen", code: "YE", dial: "+967" },
  { name: "Zambia", code: "ZM", dial: "+260" },
  { name: "Zimbabwe", code: "ZW", dial: "+263" },
] as const;

/** Country names, for the "where do you live" question. */
export const COUNTRY_NAMES = COUNTRIES.map((c) => c.name) as readonly string[];

/** Options for the phone country-code MCQ, e.g. "+91 India". */
export const DIAL_CODE_OPTIONS = COUNTRIES.map((c) => `${c.dial} ${c.name}`) as readonly string[];

/** Pull the dial code out of an option string like "+91 India". */
export function dialFromOption(option: string): string {
  const first = option.split(" ")[0] ?? "";
  return first.startsWith("+") ? first : option;
}

/** Guess a dial code for a saved phone number like "+91 98765 43210". */
export function dialFromPhone(phone?: string): string {
  const match = phone?.match(/^\+([\d-]{1,4})/);
  if (!match) return "+1";
  return `+${match[1].replace(/-/g, "")}`;
}

/** The rest of the number after the dial code, e.g. "98765 43210". */
export function localFromPhone(phone?: string): string {
  const match = phone?.match(/^\+[\d-]+\s*(.*)$/);
  return (match?.[1] ?? phone ?? "").trim();
}

// --- Per-game roles ---------------------------------------------------------
// Every esports title in GAMES maps to the roles that actually exist for it.
// Picking a game in the registration form shows only that game's roles.

const FPS_ROLES = [
  "IGL (In-Game Leader)",
  "Entry Fragger",
  "AWPer / Sniper",
  "Rifler",
  "Support",
  "Lurker",
  "Clutch Player",
  "Shot Caller",
  "Anchor",
  "Team Captain",
  "Coach",
  "Analyst",
  "Substitute",
  "Stand-in",
  "Flex",
] as const;

const VALORANT_ROLES = [
  "Duelist",
  "Initiator",
  "Controller",
  "Sentinel",
  "Flex",
  "IGL (In-Game Leader)",
  "Shot Caller",
  "Clutch Player",
  "Coach",
  "Analyst",
  "Substitute",
  "Stand-in",
] as const;

const CS2_ROLES = [
  "IGL (In-Game Leader)",
  "AWPer",
  "Entry Fragger",
  "Rifler",
  "Support",
  "Lurker",
  "Clutch Player",
  "Team Captain",
  "Coach",
  "Analyst",
  "Substitute",
  "Stand-in",
  "Flex",
] as const;

const APEX_ROLES = [
  "IGL (Battle Royale)",
  "Fragger",
  "Support",
  "Anchor",
  "Rotator / Pathfinder",
  "Clutch Player",
  "Coach",
  "Analyst",
  "Substitute",
  "Flex",
] as const;

const OVERWATCH_ROLES = [
  "Main Tank",
  "Off-Tank",
  "Hitscan DPS",
  "Projectile DPS",
  "Flex Support",
  "Main Support",
  "Flex",
  "Shot Caller",
  "Coach",
  "Substitute",
] as const;

const R6_ROLES = [
  "IGL (In-Game Leader)",
  "Entry Fragger",
  "Support",
  "Anchor",
  "Hard Breach",
  "Soft Breach",
  "Clutch Player",
  "Coach",
  "Analyst",
  "Flex",
] as const;

const BR_ROLES = [
  "IGL (Battle Royale)",
  "Fragger",
  "Sniper",
  "Support",
  "Anchor",
  "Rotator",
  "Clutch Player",
  "Coach",
  "Analyst",
  "Substitute",
  "Flex",
] as const;

const MOBA_ROLES = [
  "Top Laner",
  "Jungler",
  "Mid Laner",
  "ADC / Bot",
  "Support",
  "Carry",
  "Roamer",
  "Drafter",
  "Team Captain",
  "Coach",
  "Analyst",
  "Substitute",
  "Stand-in",
  "Flex",
] as const;

const DOTA2_ROLES = [
  "Carry (Pos 1)",
  "Mid Laner (Pos 2)",
  "Offlaner (Pos 3)",
  "Soft Support (Pos 4)",
  "Hard Support (Pos 5)",
  "Drafter",
  "Team Captain",
  "Coach",
  "Analyst",
  "Substitute",
  "Flex",
] as const;

const POKEMON_UNITE_ROLES = [
  "Attacker",
  "Defender",
  "Support",
  "All-Rounder",
  "Speedster",
  "Jungler",
  "Lane Support",
  "Coach",
  "Flex",
] as const;

const FGC_ROLES = [
  "Zoner",
  "Rushdown",
  "Grappler",
  "Footsies Specialist",
  "Mixup Specialist",
  "Setplay Specialist",
  "Punish Specialist",
  "Coach",
  "Flex",
] as const;

const SMASH_ROLES = [
  "Spacing Specialist",
  "Rushdown",
  "Grappler",
  "Zoner",
  "Edgeguard Specialist",
  "Ledgetrap Specialist",
  "Coach",
  "Flex",
] as const;

const FOOTBALL_ROLES = [
  "Striker",
  "Winger",
  "Attacking Midfielder",
  "Defensive Midfielder",
  "Midfielder",
  "Fullback",
  "Centre Back",
  "Defender",
  "Goalkeeper",
  "Playmaker",
  "Team Captain",
  "Coach",
  "Substitute",
  "Flex",
] as const;

const ROCKET_LEAGUE_ROLES = [
  "1v1 Specialist",
  "2v2 Specialist",
  "3v3 Specialist",
  "Striker",
  "Playmaker",
  "Defender / Goalkeeper",
  "Rotations Specialist",
  "Mechanic Specialist",
  "Team Captain",
  "Coach",
  "Substitute",
  "Flex",
] as const;

const NBA_ROLES = [
  "Point Guard",
  "Shooting Guard",
  "Small Forward",
  "Power Forward",
  "Center",
  "Sixth Man",
  "3-and-D Specialist",
  "Team Captain",
  "Coach",
  "Substitute",
  "Flex",
] as const;

const MADDEN_ROLES = [
  "Quarterback",
  "Running Back",
  "Wide Receiver",
  "Tight End",
  "Offensive Line",
  "Defensive Line",
  "Linebacker",
  "Cornerback",
  "Safety",
  "Kicker",
  "Team Captain",
  "Coach",
  "Substitute",
] as const;

const MLB_ROLES = [
  "Starting Pitcher",
  "Relief Pitcher",
  "Closer",
  "Catcher",
  "First Baseman",
  "Infielder",
  "Outfielder",
  "Designated Hitter",
  "Flex",
] as const;

const CRICKET_ROLES = [
  "Opener",
  "Top Order",
  "Middle Order",
  "Finisher",
  "All-Rounder",
  "Spin Bowler",
  "Pace Bowler",
  "Wicketkeeper",
  "Captain",
  "Vice Captain",
] as const;

const RACING_ROLES = [
  "Time Trial Specialist",
  "Qualifying Specialist",
  "Race Strategist",
  "Fuel & Tire Strategist",
  "Overtake Specialist",
  "Consistency Driver",
  "Team Captain",
  "Coach",
  "Flex",
] as const;

const RTS_ROLES = [
  "Macro Specialist",
  "Micro Specialist",
  "Aggressive Player",
  "Defensive Player",
  "Scout Specialist",
  "All-Rounder",
  "Team Captain",
  "Coach",
  "Flex",
] as const;

const STARCRAFT_ROLES = [
  "Terran",
  "Zerg",
  "Protoss",
  "Random",
  "Macro Specialist",
  "Micro Specialist",
  "Cheese Specialist",
  "All-Rounder",
  "Coach",
  "Flex",
] as const;

const WARCRAFT_ROLES = [
  "Human",
  "Orc",
  "Undead",
  "Night Elf",
  "Random",
  "Macro Specialist",
  "Micro Specialist",
  "All-Rounder",
  "Coach",
  "Flex",
] as const;

const AUTO_BATTLER_ROLES = [
  "Composition Specialist",
  "Economy Manager",
  "Aggressive Player",
  "Late-Game Specialist",
  "Coach",
  "Substitute",
  "Flex",
] as const;

const CLASH_ROLES = [
  "Aggressive Player",
  "Defensive Player",
  "Strategist",
  "War Strategist",
  "Clan Leader",
  "Trophy Pusher",
  "Flex",
] as const;

const CARD_ROLES = [
  "Control",
  "Aggro",
  "Combo",
  "Midrange",
  "Tempo",
  "Value",
  "Coach",
  "Flex",
] as const;

const BRAWLHALLA_ROLES = [
  "Aggressive Player",
  "Defensive Player",
  "Spacing Specialist",
  "Weapon Rotation Specialist",
  "Coach",
  "Flex",
] as const;

const SPLATOON_ROLES = [
  "Slayer",
  "Support",
  "Anchor",
  "Splat Zones Specialist",
  "Tower Control Specialist",
  "Rainmaker Specialist",
  "Clam Blitz Specialist",
  "Coach",
  "Flex",
] as const;

const BRAWL_STARS_ROLES = [
  "Damage Dealer",
  "Tank",
  "Support",
  "Healer",
  "Thrower",
  "Controller",
  "Assassin",
  "Marksman",
  "Coach",
  "Flex",
] as const;

const WOW_ROLES = [
  "Ranged DPS",
  "Melee DPS",
  "Healer",
  "Tank",
  "Flex",
  "Coach",
  "Substitute",
] as const;

const GENSHIN_ROLES = [
  "Main DPS",
  "Sub-DPS",
  "Support",
  "Healer",
  "Shielder",
  "Flex",
] as const;

const CHESS_ROLES = [
  "Opening Specialist",
  "Middlegame Specialist",
  "Endgame Specialist",
  "Classical Specialist",
  "Rapid Specialist",
  "Blitz Specialist",
  "Bullet Specialist",
  "Online Specialist",
  "Coach",
  "Flex",
] as const;

const MC_ROLES = [
  "Speedrunner",
  "PvP Specialist",
  "Builder",
  "Redstone Engineer",
  "Team Captain",
  "Coach",
  "Flex",
] as const;

const NARAKA_ROLES = [
  "Aggressive Player",
  "Defensive Player",
  "Support",
  "Assassin",
  "Coordinator",
  "Flex",
] as const;

const FALL_GUYS_ROLES = [
  "Speedrunner",
  "Course Specialist",
  "Team Player",
  "Team Captain",
  "Flex",
] as const;

/** Roles for every esports title in GAMES. */
export const GAME_ROLES: Record<string, readonly string[]> = {
  // FPS
  "Valorant": VALORANT_ROLES,
  "Counter-Strike 2": CS2_ROLES,
  "Apex Legends": APEX_ROLES,
  "Overwatch 2": OVERWATCH_ROLES,
  "Rainbow Six Siege": R6_ROLES,
  "Call of Duty: Warzone": BR_ROLES,
  "Call of Duty: Black Ops 6": FPS_ROLES,
  "Call of Duty: Modern Warfare III": FPS_ROLES,
  "Fortnite": BR_ROLES,
  "PUBG: Battlegrounds": BR_ROLES,
  "Escape from Tarkov": FPS_ROLES,
  "XDefiant": FPS_ROLES,
  "CrossFire": FPS_ROLES,
  "Sudden Attack": FPS_ROLES,
  "Point Blank": FPS_ROLES,
  "Halo Infinite": FPS_ROLES,
  "Destiny 2": FPS_ROLES,
  "The Finals": FPS_ROLES,
  "Splitgate": FPS_ROLES,
  "Team Fortress 2": FPS_ROLES,
  // MOBA
  "League of Legends": MOBA_ROLES,
  "Dota 2": DOTA2_ROLES,
  "Mobile Legends: Bang Bang": MOBA_ROLES,
  "Honor of Kings": MOBA_ROLES,
  "Arena of Valor": MOBA_ROLES,
  "League of Legends: Wild Rift": MOBA_ROLES,
  "Smite": MOBA_ROLES,
  "Heroes of the Storm": MOBA_ROLES,
  "Pokémon Unite": POKEMON_UNITE_ROLES,
  // Battle Royale
  "Free Fire": BR_ROLES,
  "Brawl Stars": BRAWL_STARS_ROLES,
  "Call of Duty: Mobile": BR_ROLES,
  "Naraka: Bladepoint": NARAKA_ROLES,
  "Super People": BR_ROLES,
  // Fighting
  "Street Fighter 6": FGC_ROLES,
  "Tekken 8": FGC_ROLES,
  "Mortal Kombat 1": FGC_ROLES,
  "Super Smash Bros. Ultimate": SMASH_ROLES,
  "Guilty Gear Strive": FGC_ROLES,
  "Dragon Ball FighterZ": FGC_ROLES,
  "The King of Fighters XV": FGC_ROLES,
  "Granblue Fantasy Versus": FGC_ROLES,
  "Injustice 2": FGC_ROLES,
  "Melty Blood: Type Lumina": FGC_ROLES,
  // Sports & Racing
  "EA Sports FC 25": FOOTBALL_ROLES,
  "eFootball 2025": FOOTBALL_ROLES,
  "Rocket League": ROCKET_LEAGUE_ROLES,
  "NBA 2K25": NBA_ROLES,
  "Madden NFL 25": MADDEN_ROLES,
  "F1 24": RACING_ROLES,
  "MLB The Show 24": MLB_ROLES,
  "iRacing": RACING_ROLES,
  "Gran Turismo 7": RACING_ROLES,
  "Forza Motorsport": RACING_ROLES,
  "Assetto Corsa Competizione": RACING_ROLES,
  "eCricket": CRICKET_ROLES,
  "FIFAe World Cup": FOOTBALL_ROLES,
  "eBaseball: Pro Yakyuu Spirits": MLB_ROLES,
  // RTS & Strategy
  "StarCraft II": STARCRAFT_ROLES,
  "Age of Empires IV": RTS_ROLES,
  "Age of Empires II: Definitive Edition": RTS_ROLES,
  "Warcraft III: Reforged": WARCRAFT_ROLES,
  "Teamfight Tactics": AUTO_BATTLER_ROLES,
  "Clash Royale": CLASH_ROLES,
  "Clash of Clans": CLASH_ROLES,
  // Card & Tabletop
  "Hearthstone": CARD_ROLES,
  "Legends of Runeterra": CARD_ROLES,
  "Magic: The Gathering Arena": CARD_ROLES,
  "Marvel Snap": CARD_ROLES,
  "Shadowverse": CARD_ROLES,
  // Party & Platform
  "Brawlhalla": BRAWLHALLA_ROLES,
  "Fall Guys": FALL_GUYS_ROLES,
  "Trackmania": RACING_ROLES,
  "Splatoon 3": SPLATOON_ROLES,
  "Minecraft Championship": MC_ROLES,
  "Genshin Impact": GENSHIN_ROLES,
  "World of Warcraft Arena": WOW_ROLES,
  "Paladins": FPS_ROLES,
  "Chess.com": CHESS_ROLES,
  "Rocket Racing": RACING_ROLES,
};

/** The roles that apply to a given game (falls back to a sensible list). */
export function rolesForGame(game: string): readonly string[] {
  return GAME_ROLES[game] ?? IN_GAME_ROLES;
}

/** The device a player competes on. */
export const PLATFORMS = [
  "PC",
  "Console (PlayStation)",
  "Console (Xbox)",
  "Console (Nintendo Switch)",
  "Mobile",
  "Cross-platform",
] as const;

/** How seriously someone plays — in plain words. */
export const EXPERIENCE_LEVELS = [
  "New — under 1 year",
  "Casual — I play for fun",
  "Amateur — I play tournaments sometimes",
  "Semi-Pro — I take it seriously",
  "Professional — this is my job",
] as const;

/** How much practice time someone can commit each week. */
export const WEEKLY_HOURS = [
  "1–5 hours",
  "5–10 hours",
  "10–20 hours",
  "20–30 hours",
  "30+ hours",
  "Flexible — depends on my week",
] as const;
