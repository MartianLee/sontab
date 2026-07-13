export interface SavedTab {
  id: string;
  url: string;
  title: string;
  favIconUrl?: string;
}

export interface TabGroup {
  id: string;
  createdAt: number;
  name: string;
  locked: boolean;
  tabs: SavedTab[];
}
