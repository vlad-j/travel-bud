import type { ImageSourcePropType } from 'react-native';
import { HERO_ALIASES } from './heroAliases';

export type DestinationHeroKey = keyof typeof ACTIVE_HEROES;

export type DestinationHeroConfig = {
  key: string;
  image: ImageSourcePropType | null;
  background: string;
  border: string;
  accent: string;
  text: string;
  pillBg: string;
  blobOne: string;
  blobTwo: string;
  hillBack: string;
  hillFront: string;
};

/*
  Travel Buddy Hero Registry
  --------------------------
  Save generated transparent PNG hero illustrations here:

    assets/hero/<key>.png

  IMPORTANT:
  React Native / Metro cannot safely require missing images.
  Only ACTIVE_HEROES should contain require(...) lines for PNG files that actually exist.

  When you generate a new hero:
  1. Save it in assets/hero/, for example: assets/hero/bali.png
  2. Move its config from HEROES_TO_GENERATE into ACTIVE_HEROES.
  3. Add the require(...) line.

  HomeScreen does not need to be changed.
*/

const DEFAULT_HERO: DestinationHeroConfig = {
  key: 'default',
  image: null,
  background: '#DFF3EC',
  border: 'rgba(76, 175, 80, 0.10)',
  accent: '#76C999',
  text: '#2E7D57',
  pillBg: 'rgba(255,255,255,0.72)',
  blobOne: '#FFF3D6',
  blobTwo: '#CFEDE4',
  hillBack: '#A7DCC3',
  hillFront: '#76C999',
};

export const ACTIVE_HEROES = {
  paris: {
    key: 'paris',
    image: require('../../assets/hero/paris.png'),
    background: '#FFF3EA',
    border: 'rgba(233, 168, 106, 0.22)',
    accent: '#E9A86A',
    text: '#7A4A1E',
    pillBg: 'rgba(255,255,255,0.74)',
    blobOne: '#FFE2C7',
    blobTwo: '#F8D7E7',
    hillBack: '#F4C69B',
    hillFront: '#E9A86A',
  },

  bangkok: {
    key: 'bangkok',
    image: require('../../assets/hero/bangkok.png'),
    background: '#EAF7FF',
    border: 'rgba(87, 183, 217, 0.20)',
    accent: '#57B7D9',
    text: '#226D8B',
    pillBg: 'rgba(255,255,255,0.76)',
    blobOne: '#FFF2C7',
    blobTwo: '#CDEEFF',
    hillBack: '#A9DCCB',
    hillFront: '#78C99B',
  },
} satisfies Record<string, DestinationHeroConfig>;

/*
  HEROES TO GENERATE
  ------------------
  These are ready-made config blocks. Keep them commented until the PNG exists.

  Example:
  - Generate assets/hero/bali.png
  - Copy the bali block into ACTIVE_HEROES
  - Uncomment the require line inside it
*/

/*
  bali: {
    key: 'bali',
    image: require('../../assets/hero/bali.png'),
    background: '#EAF8EF', border: 'rgba(76,175,80,0.18)', accent: '#4CAF50', text: '#2E7D32',
    pillBg: 'rgba(255,255,255,0.76)', blobOne: '#FFF3D6', blobTwo: '#D8F3DE', hillBack: '#A9DCC3', hillFront: '#76C999',
  },

  tokyo: {
    key: 'tokyo',
    image: require('../../assets/hero/tokyo.png'),
    background: '#FFF0F6', border: 'rgba(233,30,99,0.14)', accent: '#E88AAA', text: '#8A3154',
    pillBg: 'rgba(255,255,255,0.76)', blobOne: '#FFE0EC', blobTwo: '#E7F2FF', hillBack: '#F5BFD0', hillFront: '#E88AAA',
  },

  london: {
    key: 'london',
    image: require('../../assets/hero/london.png'),
    background: '#EEF4FF', border: 'rgba(80,120,180,0.16)', accent: '#6E91C8', text: '#2F4F7F',
    pillBg: 'rgba(255,255,255,0.76)', blobOne: '#E0EBFF', blobTwo: '#F3E8FF', hillBack: '#B8C9E6', hillFront: '#8EA9D6',
  },

  rome: {
    key: 'rome',
    image: require('../../assets/hero/rome.png'),
    background: '#FFF1E5', border: 'rgba(255,152,0,0.18)', accent: '#E8A15C', text: '#7A4C20',
    pillBg: 'rgba(255,255,255,0.76)', blobOne: '#FFE1C4', blobTwo: '#F5E1C8', hillBack: '#E9C18F', hillFront: '#D99A5E',
  },

  barcelona: {
    key: 'barcelona',
    image: require('../../assets/hero/barcelona.png'),
    background: '#FFF4EC', border: 'rgba(255,112,67,0.16)', accent: '#E9896A', text: '#8A3F2F',
    pillBg: 'rgba(255,255,255,0.76)', blobOne: '#FFE1CF', blobTwo: '#E9F5FF', hillBack: '#F3C59B', hillFront: '#E9896A',
  },

  amsterdam: {
    key: 'amsterdam',
    image: require('../../assets/hero/amsterdam.png'),
    background: '#EDF8FF', border: 'rgba(33,150,243,0.14)', accent: '#69A9D8', text: '#2E6388',
    pillBg: 'rgba(255,255,255,0.76)', blobOne: '#DFF1FF', blobTwo: '#FFE7C7', hillBack: '#A6D4E8', hillFront: '#78B6D7',
  },

  lisbon: {
    key: 'lisbon',
    image: require('../../assets/hero/lisbon.png'),
    background: '#FFF6E8', border: 'rgba(255,193,7,0.18)', accent: '#E5B64F', text: '#7A5A18',
    pillBg: 'rgba(255,255,255,0.76)', blobOne: '#FFE9B8', blobTwo: '#D9F2FF', hillBack: '#EBCB82', hillFront: '#DDAE45',
  },

  singapore: {
    key: 'singapore',
    image: require('../../assets/hero/singapore.png'),
    background: '#EAF9F6', border: 'rgba(0,150,136,0.16)', accent: '#4DB6AC', text: '#1F6F68',
    pillBg: 'rgba(255,255,255,0.76)', blobOne: '#D6F3EE', blobTwo: '#FFF3D6', hillBack: '#9FD8CE', hillFront: '#68C3B7',
  },

  dubai: {
    key: 'dubai',
    image: require('../../assets/hero/dubai.png'),
    background: '#FFF5E3', border: 'rgba(218,165,32,0.16)', accent: '#D7A64E', text: '#785A1D',
    pillBg: 'rgba(255,255,255,0.76)', blobOne: '#FFE6B8', blobTwo: '#F7DFC0', hillBack: '#E9C881', hillFront: '#D5A85A',
  },

  newyork: {
    key: 'newyork',
    image: require('../../assets/hero/newyork.png'),
    background: '#EEF6FF', border: 'rgba(33,150,243,0.14)', accent: '#5D9BD3', text: '#255A86',
    pillBg: 'rgba(255,255,255,0.76)', blobOne: '#DDEEFF', blobTwo: '#F4E8FF', hillBack: '#ABCBE8', hillFront: '#78A9D3',
  },
*/

export const HEROES_TO_GENERATE: Record<string, Omit<DestinationHeroConfig, 'image'>> = {
  london: colorPreset('london', '#EEF4FF', '#6E91C8', '#2F4F7F'),
  rome: colorPreset('rome', '#FFF1E5', '#E8A15C', '#7A4C20'),
  barcelona: colorPreset('barcelona', '#FFF4EC', '#E9896A', '#8A3F2F'),
  madrid: colorPreset('madrid', '#FFF4EC', '#E9896A', '#8A3F2F'),
  amsterdam: colorPreset('amsterdam', '#EDF8FF', '#69A9D8', '#2E6388'),
  lisbon: colorPreset('lisbon', '#FFF6E8', '#E5B64F', '#7A5A18'),
  prague: colorPreset('prague', '#F4F0FF', '#9275D8', '#59408D'),
  vienna: colorPreset('vienna', '#FFF0F5', '#D889A6', '#82405A'),
  budapest: colorPreset('budapest', '#F1F6FF', '#6E91C8', '#2F4F7F'),
  athens: colorPreset('athens', '#EEF8FF', '#6BAED6', '#2F6380'),
  santorini: colorPreset('santorini', '#EFF9FF', '#58A6D6', '#256382'),
  dubrovnik: colorPreset('dubrovnik', '#FFF1E5', '#DF8B58', '#7B4023'),
  kotor: colorPreset('kotor', '#EEF7F6', '#5FAFA6', '#2E6D67'),
  budva: colorPreset('budva', '#EEF7F6', '#5FAFA6', '#2E6D67'),
  oslo: colorPreset('oslo', '#EDF6FF', '#6EA5C9', '#2F637F'),
  stockholm: colorPreset('stockholm', '#EDF6FF', '#6EA5C9', '#2F637F'),
  copenhagen: colorPreset('copenhagen', '#EDF6FF', '#6EA5C9', '#2F637F'),
  reykjavik: colorPreset('reykjavik', '#EEF8FF', '#7DB8D8', '#315F78'),
  zurich: colorPreset('zurich', '#EFF8F4', '#75B89A', '#356B50'),
  swissalps: colorPreset('swissalps', '#EFF8F4', '#75B89A', '#356B50'),
  istanbul: colorPreset('istanbul', '#FFF1E8', '#D9926B', '#804A31'),
  dubai: colorPreset('dubai', '#FFF5E3', '#D7A64E', '#785A1D'),
  abudhabi: colorPreset('abudhabi', '#FFF5E3', '#D7A64E', '#785A1D'),
  cairo: colorPreset('cairo', '#FFF4DF', '#D8A64C', '#775918'),
  marrakech: colorPreset('marrakech', '#FFF0E8', '#D97958', '#7B3E2D'),
  capetown: colorPreset('capetown', '#EFF8F4', '#62B58D', '#2F6B4D'),
  chiangmai: colorPreset('chiangmai', '#EFF9EF', '#6CCB7E', '#2D7A42'),
  chiangrai: colorPreset('chiangrai', '#F4F1FF', '#9275D8', '#59408D'),
  phuket: colorPreset('phuket', '#EAF9FF', '#52B8D8', '#226D8B'),
  krabi: colorPreset('krabi', '#EAF9FF', '#52B8D8', '#226D8B'),
  phiphi: colorPreset('phiphi', '#EAF9FF', '#52B8D8', '#226D8B'),
  khaosok: colorPreset('khaosok', '#EAF8EF', '#4CAF50', '#2E7D32'),
  kohsamui: colorPreset('kohsamui', '#EAF9FF', '#52B8D8', '#226D8B'),
  singapore: colorPreset('singapore', '#EAF9F6', '#4DB6AC', '#1F6F68'),
  kualalumpur: colorPreset('kualalumpur', '#EFF6FF', '#5D9BD3', '#255A86'),
  hanoi: colorPreset('hanoi', '#EFF8EF', '#6AAE70', '#336C38'),
  halongbay: colorPreset('halongbay', '#EAF9FF', '#52B8D8', '#226D8B'),
  hochiminh: colorPreset('hochiminh', '#FFF4EC', '#E9896A', '#8A3F2F'),
  siemreap: colorPreset('siemreap', '#EFF8EF', '#6AAE70', '#336C38'),
  bali: colorPreset('bali', '#EAF8EF', '#4CAF50', '#2E7D32'),
  jakarta: colorPreset('jakarta', '#EFF6FF', '#5D9BD3', '#255A86'),
  yogyakarta: colorPreset('yogyakarta', '#FFF1E5', '#E8A15C', '#7A4C20'),
  bromo: colorPreset('bromo', '#F4F0FF', '#9275D8', '#59408D'),
  nusa_penida: colorPreset('nusa_penida', '#EAF9FF', '#52B8D8', '#226D8B'),
  lombok: colorPreset('lombok', '#EAF9FF', '#52B8D8', '#226D8B'),
  tokyo: colorPreset('tokyo', '#FFF0F6', '#E88AAA', '#8A3154'),
  kyoto: colorPreset('kyoto', '#FFF0F6', '#E88AAA', '#8A3154'),
  osaka: colorPreset('osaka', '#FFF4EC', '#E9896A', '#8A3F2F'),
  mtfuji: colorPreset('mtfuji', '#EEF6FF', '#6E91C8', '#2F4F7F'),
  seoul: colorPreset('seoul', '#F4F0FF', '#9275D8', '#59408D'),
  busan: colorPreset('busan', '#EAF9FF', '#52B8D8', '#226D8B'),
  hongkong: colorPreset('hongkong', '#EFF6FF', '#5D9BD3', '#255A86'),
  taipei: colorPreset('taipei', '#EFF8EF', '#6AAE70', '#336C38'),
  newyork: colorPreset('newyork', '#EEF6FF', '#5D9BD3', '#255A86'),
  sanfrancisco: colorPreset('sanfrancisco', '#EEF6FF', '#5D9BD3', '#255A86'),
  losangeles: colorPreset('losangeles', '#FFF4EC', '#E9896A', '#8A3F2F'),
  lasvegas: colorPreset('lasvegas', '#FFF4DF', '#D8A64C', '#775918'),
  miami: colorPreset('miami', '#EAF9FF', '#52B8D8', '#226D8B'),
  vancouver: colorPreset('vancouver', '#EFF8F4', '#75B89A', '#356B50'),
  mexicocity: colorPreset('mexicocity', '#FFF1E5', '#E8A15C', '#7A4C20'),
  rio: colorPreset('rio', '#EAF8EF', '#4CAF50', '#2E7D32'),
  machupicchu: colorPreset('machupicchu', '#EFF8EF', '#6AAE70', '#336C38'),
  sydney: colorPreset('sydney', '#EAF9FF', '#52B8D8', '#226D8B'),
  melbourne: colorPreset('melbourne', '#EEF6FF', '#6E91C8', '#2F4F7F'),
  queenstown: colorPreset('queenstown', '#EFF8F4', '#75B89A', '#356B50'),
  maldives: colorPreset('maldives', '#EAF9FF', '#52B8D8', '#226D8B'),
  mauritius: colorPreset('mauritius', '#EAF9FF', '#52B8D8', '#226D8B'),
  seychelles: colorPreset('seychelles', '#EAF9FF', '#52B8D8', '#226D8B'),
  petra: colorPreset('petra', '#FFF0E8', '#D97958', '#7B3E2D'),
  cappadocia: colorPreset('cappadocia', '#FFF1E5', '#E8A15C', '#7A4C20'),
};

function colorPreset(
  key: string,
  background: string,
  accent: string,
  text: string,
): Omit<DestinationHeroConfig, 'image'> {
  return {
    key,
    background,
    border: `${accent}2A`,
    accent,
    text,
    pillBg: 'rgba(255,255,255,0.76)',
    blobOne: '#FFF3D6',
    blobTwo: '#DDF3FF',
    hillBack: '#A9DCC3',
    hillFront: accent,
  };
}

function normalize(value?: string | null): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]/g, ' ')
    .trim();
}

function findHeroKey(name?: string | null, country?: string | null): string | null {
  const haystack = normalize(`${name ?? ''} ${country ?? ''}`);
  if (!haystack) return null;

  for (const [heroKey, aliases] of Object.entries(HERO_ALIASES)) {
    if (aliases.some((alias) => haystack.includes(normalize(alias)))) {
      return heroKey;
    }
  }

  return null;
}

export function getDestinationHero(name?: string | null, country?: string | null): DestinationHeroConfig {
  const heroKey = findHeroKey(name, country);

  if (heroKey && heroKey in ACTIVE_HEROES) {
    return ACTIVE_HEROES[heroKey as keyof typeof ACTIVE_HEROES];
  }

  if (heroKey && heroKey in HEROES_TO_GENERATE) {
    return {
      ...HEROES_TO_GENERATE[heroKey],
      image: null,
    };
  }

  return DEFAULT_HERO;
}
