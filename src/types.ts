export interface SavedTab {
  id: string;
  url: string;
  title: string;
  favIconUrl?: string;
  starred?: boolean;
}

export interface TabGroup {
  id: string;
  createdAt: number;
  name: string;
  locked: boolean;
  tabs: SavedTab[];
}
