export type AppManifest = {
  appId: string;

  createApp: (appApi: any) => App;
};

export interface App {
  launch(): void;
}
