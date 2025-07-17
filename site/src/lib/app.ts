export type AppManifest = {
  appId: string;

  app: new (appApi: any) => App;
}

export interface App {
  launch(): void;
}

