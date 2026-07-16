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
  /** 주제 분류용 태그 (사이드바에서 폴더처럼 조회) */
  tags?: string[];
}
