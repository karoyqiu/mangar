export interface Viewer {
  currentPos: number;
  maxPos: number;
  scrollTo: (value: number) => void;
}
