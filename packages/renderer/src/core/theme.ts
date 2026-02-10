
/**
 * Defines the visual styling for all diagram elements.
 */
export interface Theme {
  // --- Nodes ---
  /** Background color of the class box. */
  nodeBackground: string;
  /** Border color of the class box. */
  nodeBorder: string;
  /** Background color for the class name header section. */
  nodeHeaderBg: string;
  /** Font color for the class name. */
  nodeHeaderText: string;
  /** Font color for attributes and methods. */
  nodeMemberText: string;
  /** Color of the line separating header, attributes, and methods. */
  nodeDivider: string;
  /** Background color for implicit classes. */
  nodeImplicitBg: string;
  /** Border color for implicit classes. */
  nodeImplicitBorder: string;
  /** Color for the double border in active classes. */
  nodeActiveLine: string;

  // --- Edges ---
  /** Color of the relationship lines. */
  edgeStroke: string;
  /** Thickness of the relationship lines. */
  edgeStrokeWidth: number;
  /** Color of the relationship label text. */
  edgeLabel: string;
  /** Color of the multiplicity numbers/strings. */
  multiplicityText: string;

  // --- Typography ---
  /** CSS font-family string. */
  fontFamily: string;
  /** Default font size for headers and members. */
  fontSizeBase: number;
  /** Smaller font size for stereotypes and multiplicities. */
  fontSizeSmall: number;

  // --- Packages ---
  /** Background color of the package/namespace container. */
  packageBackground: string;
  /** Border color of the package container. */
  packageBorder: string;
  /** Font color for the package name label. */
  packageLabelText: string;

  // --- Notes ---
  /** Background color of note elements. */
  noteBackground: string;
  /** Border color of note elements. */
  noteBorder: string;

  // --- Background ---
  /** Background color of the entire SVG canvas. */
  canvasBackground: string;
}

/**
 * Default light theme based on professional UML standards.
 */
export const lightTheme: Theme = {
  nodeBackground: '#ffffff',
  nodeBorder: '#333333',
  nodeHeaderBg: '#f0f0f0',
  nodeHeaderText: '#000000',
  nodeMemberText: '#333333',
  nodeDivider: '#cccccc',
  nodeImplicitBg: '#f9f9f9',
  nodeImplicitBorder: '#aaaaaa',
  nodeActiveLine: '#333333',

  edgeStroke: '#333333',
  edgeStrokeWidth: 1.5,
  edgeLabel: '#666666',
  multiplicityText: '#666666',

  fontFamily: 'monospace, "Courier New", Courier',
  fontSizeBase: 13,
  fontSizeSmall: 11,

  packageBackground: '#fdfdfd',
  packageBorder: '#dddddd',
  packageLabelText: '#999999',

  noteBackground: '#fff9c4',
  noteBorder: '#fbc02d',

  canvasBackground: '#ffffff'
};

/**
 * Default dark theme for high-contrast IDE environments.
 */
export const darkTheme: Theme = {
  nodeBackground: '#2d2d2d',
  nodeBorder: '#aaaaaa',
  nodeHeaderBg: '#3d3d3d',
  nodeHeaderText: '#e0e0e0',
  nodeMemberText: '#cccccc',
  nodeDivider: '#4a4a4a',
  nodeImplicitBg: '#252525',
  nodeImplicitBorder: '#666666',
  nodeActiveLine: '#aaaaaa',

  edgeStroke: '#aaaaaa',
  edgeStrokeWidth: 1.5,
  edgeLabel: '#999999',
  multiplicityText: '#999999',

  fontFamily: 'monospace, "Courier New", Courier',
  fontSizeBase: 13,
  fontSizeSmall: 11,

  packageBackground: '#1e1e1e',
  packageBorder: '#3a3a3a',
  packageLabelText: '#777777',

  noteBackground: '#424242',
  noteBorder: '#616161',

  canvasBackground: '#1e1e1e'
};
