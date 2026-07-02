import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

type Props = {
  /** Rezultatul lui getDestinationHero(...) — sau orice obiect cu .image */
  hero: { image: any | null } | null | undefined;
  /** Poziționare/dimensiune — de obicei absolute, right/bottom, width/height */
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'contain' | 'cover';
};

/**
 * Suprapune imaginea reală a destinației (dacă există) peste orice hero card
 * colorat. Nu randează nimic dacă hero.image e null — fallback-ul colorat
 * din spate rămâne vizibil ca de obicei.
 *
 * Folosire (în interiorul unui hero card cu position: relative / overflow: hidden):
 *
 *   <DestinationHeroImage hero={theme} style={styles.illustration} />
 *
 * unde `styles.illustration` conține doar poziționarea/dimensiunea
 * (position: 'absolute', right, bottom, width, height) — fiecare ecran
 * își definește propriile dimensiuni, pentru că fiecare card e altă mărime.
 */
export default function DestinationHeroImage({ hero, style, resizeMode = 'contain' }: Props) {
  if (!hero?.image) return null;
  return <Image source={hero.image} resizeMode={resizeMode} style={style} />;
}
