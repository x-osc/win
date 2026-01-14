import { CallbackManager } from "@lib/core/callbacks";
import { fsApi, FsError } from "@os/fs/filesystem";

export interface MainSettings {
  mainvol: number;
  uivol: number;
}

export const settingsCallbacks = new CallbackManager<SettingsEvents>();

type SettingsEvents = {
  changed: (newSettings: MainSettings) => void;
} & {
  [K in keyof MainSettings as `changed:${K}`]: (
    newValue: MainSettings[K],
  ) => void;
};

const SETTINGS_PATH = ["sys", "settings", "settings.sto"];

export const DEFAULT_SETTINGS: MainSettings = {
  mainvol: 80,
  uivol: 80,
};

export async function saveSettings(newSettings: MainSettings) {
  const oldSettings = await getSettingsNoCreate();

  await fsApi.ensureFile(SETTINGS_PATH);
  await fsApi.overwriteFile(SETTINGS_PATH, {
    data: new Blob([JSON.stringify(newSettings, null, 2)]),
  });

  if (oldSettings) {
    (Object.keys(newSettings) as Array<keyof MainSettings>).forEach((key) => {
      if (newSettings[key] !== oldSettings[key]) {
        settingsCallbacks.emit(`changed:${key}`, newSettings[key]);
      }
    });
  }

  settingsCallbacks.emit("changed", newSettings);
}

async function getSettingsNoCreate(): Promise<MainSettings | null> {
  try {
    let settingsText = await (await fsApi.readFile(SETTINGS_PATH)).data.text();
    return JSON.parse(settingsText) as MainSettings;
  } catch (err) {
    if (err instanceof FsError) {
      return null;
    }
    throw err;
  }
}

export async function getSettings(): Promise<MainSettings> {
  try {
    let settingsText = await (await fsApi.readFile(SETTINGS_PATH)).data.text();
    return JSON.parse(settingsText) as MainSettings;
  } catch (err) {
    if (err instanceof FsError && err.kind.type === "notfound") {
      await saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    } else {
      // TODO: error or smth here
      await saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
  }
}
