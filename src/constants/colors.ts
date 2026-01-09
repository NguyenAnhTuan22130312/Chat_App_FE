export interface ColorPreset {
  name: string;
  value: string;
  hex: string;
}

export const COLOR_MAP: Record<string, string> = {
  red: '#FF0000',
  blue: '#0084FF',
  green: '#00C851',
  yellow: '#FFD700',
  purple: '#9C27B0',
  orange: '#FF9800',
  pink: '#E91E63',
  brown: '#795548',
  gray: '#9E9E9E',
  black: '#000000',
};

export const PRESET_COLORS: ColorPreset[] = [
  { name: 'Đỏ', value: '#FF0000', hex: 'red' },
  { name: 'Xanh dương', value: '#0084FF', hex: 'blue' },
  { name: 'Xanh lá', value: '#00C851', hex: 'green' },
  { name: 'Vàng', value: '#FFD700', hex: 'yellow' },
  { name: 'Tím', value: '#9C27B0', hex: 'purple' },
  { name: 'Cam', value: '#FF9800', hex: 'orange' },
  { name: 'Hồng', value: '#E91E63', hex: 'pink' },
  { name: 'Nâu', value: '#795548', hex: 'brown' },
  { name: 'Xám', value: '#9E9E9E', hex: 'gray' },
  { name: 'Đen', value: '#000000', hex: 'black' },
];

export const getColorName = (color: string): string | undefined => {
  if (!color) return undefined;
  
  const normalizedColor = color.toLowerCase().trim();
  
  const rgbToColorMap: Record<string, string> = {
    'rgb(255, 0, 0)': 'red',
    'rgb(0, 132, 255)': 'blue',
    'rgb(0, 200, 81)': 'green',
    'rgb(255, 215, 0)': 'yellow',
    'rgb(156, 39, 176)': 'purple',
    'rgb(255, 152, 0)': 'orange',
    'rgb(233, 30, 99)': 'pink',
    'rgb(121, 85, 72)': 'brown',
    'rgb(158, 158, 158)': 'gray',
    'rgb(0, 0, 0)': 'black',
  };

  if (rgbToColorMap[normalizedColor]) {
    return rgbToColorMap[normalizedColor];
  }

  for (const [colorName, hexCode] of Object.entries(COLOR_MAP)) {
    if (hexCode.toLowerCase() === normalizedColor) {
      return colorName;
    }
  }

  return undefined;
};

export const getColorHex = (colorName: string): string | undefined => {
  return COLOR_MAP[colorName.toLowerCase()];
};
