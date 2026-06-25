import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, G, Line, Polyline } from 'react-native-svg';

// Custom Travel Buddy icon set - replaces all emoji usage
// Each icon is a clean SVG component matching the mockup style

export function SuitcaseIcon({ size = 24, color = '#4CAF50' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="8" width="16" height="12" rx="2" stroke={color} strokeWidth="1.5" />
      <Path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2" stroke={color} strokeWidth="1.5" />
      <Line x1="12" y1="12" x2="12" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function PdfIcon({ size = 24, color = '#F44336' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth="1.5" />
      <Polyline points="14 2 14 8 20 8" stroke={color} strokeWidth="1.5" />
      <Path d="M9 13h6M9 17h3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function GmailIcon({ size = 24, color = '#EA4335' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={color} strokeWidth="1.5" />
      <Polyline points="22,6 12,13 2,6" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

export function EditPencilIcon({ size = 24, color = '#FF9800' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={color} strokeWidth="1.5" />
      <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

export function ReuseIcon({ size = 24, color = '#2196F3' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12" stroke={color} strokeWidth="1.5" />
      <Path d="M2 12l2-2m-2 2l2 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function UploadCloudIcon({ size = 24, color = '#4CAF50' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" stroke={color} strokeWidth="1.5" />
      <Polyline points="16 12 12 8 8 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function CalendarIcon({ size = 24, color = '#666' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.5" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

export function ClockIcon({ size = 24, color = '#666' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
      <Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function MapPinIcon({ size = 24, color = '#F44336' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={color} strokeWidth="1.5" />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

export function WifiIcon({ size = 24, color = '#2196F3' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="12" y1="20" x2="12.01" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function BreakfastIcon({ size = 24, color = '#FF9800' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" stroke={color} strokeWidth="1.5" />
      <Line x1="6" y1="1" x2="6" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="10" y1="1" x2="10" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="14" y1="1" x2="14" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function PoolIcon({ size = 24, color = '#00BCD4' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M2 12h20M2 16h20M2 8h20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M6 8V6a3 3 0 013-3h6a3 3 0 013 3v2" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

export function AcIcon({ size = 24, color = '#03A9F4' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v18M5 10l7-7 7 7M5 14l7 7 7-7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function ParkingIcon({ size = 24, color = '#FF5722' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="1.5" />
      <Path d="M9 17V7h3a3 3 0 010 6H9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function KitchenIcon({ size = 24, color = '#795548' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 3h18v18H3z" stroke={color} strokeWidth="1.5" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.5" />
      <Path d="M8 15h8M8 18h5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function WorkspaceIcon({ size = 24, color = '#607D8B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="3" width="20" height="14" rx="2" stroke={color} strokeWidth="1.5" />
      <Line x1="8" y1="21" x2="16" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="12" y1="17" x2="12" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function GymIcon({ size = 24, color = '#E91E63' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 5v14M18 5v14M3 8h3M18 8h3M3 16h3M18 16h3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function HotTubIcon({ size = 24, color = '#9C27B0' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12h16a4 4 0 01-4 4H8a4 4 0 01-4-4z" stroke={color} strokeWidth="1.5" />
      <Path d="M6 12V8m4 4V7m4 5V8m4 4V7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function CheckIcon({ size = 24, color = '#4CAF50' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 24, color = '#999' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="9 18 15 12 9 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LockIcon({ size = 24, color = '#4CAF50' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="1.5" />
      <Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

export function ControlIcon({ size = 24, color = '#FF9800' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
      <Path d="M8 12l3 3 5-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LightningIcon({ size = 24, color = '#FFEB3B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HouseIcon({ size = 24, color = '#4CAF50' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="1.5" />
      <Polyline points="9 22 9 12 15 12 15 22" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

export function HotelIcon({ size = 24, color = '#9C27B0' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 20h18M5 20V10l7-5 7 5v10" stroke={color} strokeWidth="1.5" />
      <Rect x="7" y="12" width="4" height="4" stroke={color} strokeWidth="1.5" />
      <Rect x="13" y="12" width="4" height="4" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

export function GlobeIcon({ size = 24, color = '#2196F3' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
      <Path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

export function DocumentIcon({ size = 24, color = '#2196F3' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth="1.5" />
      <Polyline points="14 2 14 8 20 8" stroke={color} strokeWidth="1.5" />
      <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function PassportIcon({ size = 24, color = '#3F51B5' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="1.5" />
      <Circle cx="12" cy="10" r="2" stroke={color} strokeWidth="1.5" />
      <Path d="M8 16c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

export function InsuranceIcon({ size = 24, color = '#4CAF50' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="1.5" />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function FlightTicketIcon({ size = 24, color = '#9C27B0' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 10v10a2 2 0 002 2h12a2 2 0 002-2V10" stroke={color} strokeWidth="1.5" />
      <Path d="M2 10l10-7 10 7" stroke={color} strokeWidth="1.5" />
      <Path d="M15 14l-3-3-3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HotelConfirmationIcon({ size = 24, color = '#673AB7' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 20h18M5 20V10l7-5 7 5v10" stroke={color} strokeWidth="1.5" />
      <Path d="M9 14l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function VisaIcon({ size = 24, color = '#FF9800' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="1.5" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.5" />
      <Line x1="7" y1="14" x2="7.01" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="11" y1="14" x2="13" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function CameraScanIcon({ size = 24, color = '#4CAF50' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="6" width="18" height="12" rx="2" stroke={color} strokeWidth="1.5" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" />
      <Path d="M16.5 6h.5a2 2 0 012 2v0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function ImportEmailIcon({ size = 24, color = '#EA4335' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={color} strokeWidth="1.5" />
      <Polyline points="22,6 12,13 2,6" stroke={color} strokeWidth="1.5" />
      <Circle cx="18" cy="18" r="5" fill="#fff" stroke={color} strokeWidth="1.5" />
      <Path d="M18 16v4M16 18h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function AddManualIcon({ size = 24, color = '#FF9800' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={color} strokeWidth="1.5" />
      <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

export function WarningIcon({ size = 24, color = '#FF9800' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={color} strokeWidth="1.5" />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function ExpiredIcon({ size = 24, color = '#F44336' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
      <Line x1="15" y1="9" x2="9" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="9" x2="15" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function SearchIcon({ size = 24, color = '#666' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="1.5" />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function PlusIcon({ size = 24, color = '#4CAF50' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function DownloadIcon({ size = 24, color = '#666' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Polyline points="7 10 12 15 17 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="12" y1="15" x2="12" y2="3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function ShareIcon({ size = 24, color = '#2196F3' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Polyline points="16 6 12 2 8 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="12" y1="2" x2="12" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function TrashIcon({ size = 24, color = '#F44336' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="3 6 5 6 21 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

export function MoreIcon({ size = 24, color = '#666' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="1.5" fill={color} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="19" r="1.5" fill={color} />
    </Svg>
  );
}

export function ArrowLeftIcon({ size = 24, color = '#1A1A1A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="19" y1="12" x2="5" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Polyline points="12 19 5 12 12 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CloseIcon({ size = 24, color = '#1A1A1A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// Document type icons for the Documents feature
export function DocPassportIcon({ size = 40, color = '#3F51B5' }: { size?: number; color?: string }) {
  return (
    <View style={[iconStyles.docIconBg, { backgroundColor: `${color}15` }]}>
      <PassportIcon size={size * 0.5} color={color} />
    </View>
  );
}

export function DocInsuranceIcon({ size = 40, color = '#4CAF50' }: { size?: number; color?: string }) {
  return (
    <View style={[iconStyles.docIconBg, { backgroundColor: `${color}15` }]}>
      <InsuranceIcon size={size * 0.5} color={color} />
    </View>
  );
}

export function DocFlightIcon({ size = 40, color = '#9C27B0' }: { size?: number; color?: string }) {
  return (
    <View style={[iconStyles.docIconBg, { backgroundColor: `${color}15` }]}>
      <FlightTicketIcon size={size * 0.5} color={color} />
    </View>
  );
}

export function DocHotelIcon({ size = 40, color = '#673AB7' }: { size?: number; color?: string }) {
  return (
    <View style={[iconStyles.docIconBg, { backgroundColor: `${color}15` }]}>
      <HotelConfirmationIcon size={size * 0.5} color={color} />
    </View>
  );
}

export function DocVisaIcon({ size = 40, color = '#FF9800' }: { size?: number; color?: string }) {
  return (
    <View style={[iconStyles.docIconBg, { backgroundColor: `${color}15` }]}>
      <VisaIcon size={size * 0.5} color={color} />
    </View>
  );
}

export function DocGenericIcon({ size = 40, color = '#607D8B' }: { size?: number; color?: string }) {
  return (
    <View style={[iconStyles.docIconBg, { backgroundColor: `${color}15` }]}>
      <DocumentIcon size={size * 0.5} color={color} />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  docIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Helper to get the right icon for document type
export function getDocumentTypeIcon(type: string, size?: number) {
  const s = size || 40;
  switch (type) {
    case 'Passport': return <DocPassportIcon size={s} />;
    case 'Insurance': return <DocInsuranceIcon size={s} />;
    case 'Flight Ticket': return <DocFlightIcon size={s} />;
    case 'Hotel Confirmation': return <DocHotelIcon size={s} />;
    case 'Visa': return <DocVisaIcon size={s} />;
    default: return <DocGenericIcon size={s} />;
  }
}

// Helper to get the right icon for amenity
export function getAmenityIcon(name: string, size = 20) {
  switch (name) {
    case 'WiFi': return <WifiIcon size={size} color="#2196F3" />;
    case 'Breakfast': return <BreakfastIcon size={size} color="#FF9800" />;
    case 'Pool': return <PoolIcon size={size} color="#00BCD4" />;
    case 'AC': return <AcIcon size={size} color="#03A9F4" />;
    case 'Parking': return <ParkingIcon size={size} color="#FF5722" />;
    case 'Kitchen': return <KitchenIcon size={size} color="#795548" />;
    case 'Workspace': return <WorkspaceIcon size={size} color="#607D8B" />;
    case 'Gym': return <GymIcon size={size} color="#E91E63" />;
    case 'Hot tub': return <HotTubIcon size={size} color="#9C27B0" />;
    default: return null;
  }
}

// Helper to get platform icon
export function getPlatformIcon(platform: string, size = 20) {
  switch (platform) {
    case 'Airbnb': return <HouseIcon size={size} color="#4CAF50" />;
    case 'Booking.com': return <HotelIcon size={size} color="#9C27B0" />;
    case 'Agoda': return <GlobeIcon size={size} color="#2196F3" />;
    default: return <HotelIcon size={size} color="#666" />;
  }
}
