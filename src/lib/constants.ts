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
