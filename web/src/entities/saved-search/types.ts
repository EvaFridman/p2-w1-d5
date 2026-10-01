export type SavedSearchType = {
  id: number;
  name: string;
  token: string;
  query: string;
  isOutdated: boolean;
  createdAt: string;
};

export type SavedSearchByTokenType = {
  query: string;
  isOutdated: boolean;
};

export type SavedSearchActionResultType = {
  savedSearch?: SavedSearchType;
  error?: string;
};
