export interface SavedTab {
  id: string;
  url: string;
  title: string;
  favIconUrl?: string;
  starred?: boolean;
  /** 이 시각까지 목록에서 숨겼다가 다시 보여준다 (epoch ms) */
  remindAt?: number;
}

export interface TabGroup {
  id: string;
  createdAt: number;
  name: string;
  locked: boolean;
  tabs: SavedTab[];
}
