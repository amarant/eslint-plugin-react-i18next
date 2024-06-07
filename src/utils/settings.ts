export type RawSettingsTranslationFilesLocation = string | string[];
export type RawSettingsTranslationFunctions = string | string[];
export type RawSettingsTranslationFilesFormat = string;
export type RawSettings = {
  "@amarant/react-i18next"?: {
    translationFiles?: {
      location?: RawSettingsTranslationFilesLocation;
      format?: RawSettingsTranslationFilesFormat;
    };
    translationFunctions?: RawSettingsTranslationFilesLocation;
  };
};

export enum TranslationFilesFormat {
  Flat = "flat",
  Nested = "nested",
}

export type Settings = {
  /** Settings for translation files */
  translationFiles: {
    /** Globs of locations of translation files */
    location: string[];
    /** The format of the translation files */
    format: TranslationFilesFormat;
  };
  /** The translation functions */
  translationFunctions: string[];
};

const DEFAULT_TRANSLATION_FILES_LOCATION = [
  "public/locales/*/translation.json",
];
const DEFAULT_TRANSLATION_FILES_FORMAT = TranslationFilesFormat.Flat;
const RAW_FORMAT_TO_TRANSLATION_FILES_FORMAT: {
  [key in `${TranslationFilesFormat}`]: TranslationFilesFormat;
} = {
  flat: TranslationFilesFormat.Flat,
  nested: TranslationFilesFormat.Nested,
};
const DEFAULT_TRANSLATION_FUNCTIONS = ["t", "i18n.t"];

export function getSettings(context: { settings: RawSettings }): Settings {
  const rawSettings = context.settings["@amarant/react-i18next"];
  const rawLocation = rawSettings?.translationFiles?.location;
  const rawFormat = rawSettings?.translationFiles?.format;
  const rawTranslationFunctions = rawSettings?.translationFunctions;
  return {
    translationFiles: {
      location: rawLocation
        ? normalizeTranslationFiles(rawLocation)
        : DEFAULT_TRANSLATION_FILES_LOCATION,
      format: rawFormat
        ? toFormat(rawFormat)
        : DEFAULT_TRANSLATION_FILES_FORMAT,
    },
    translationFunctions: rawTranslationFunctions
      ? normalizeTranslationFunctions(rawTranslationFunctions)
      : DEFAULT_TRANSLATION_FUNCTIONS,
  };
}

function normalizeTranslationFiles(
  rawFiles: RawSettingsTranslationFilesLocation
): string[] {
  return Array.isArray(rawFiles) ? rawFiles : [rawFiles];
}

function normalizeTranslationFunctions(
  rawFunctions: RawSettingsTranslationFunctions
): string[] {
  return Array.isArray(rawFunctions) ? rawFunctions : [rawFunctions];
}

function toFormat(
  rawFormat: RawSettingsTranslationFilesFormat
): TranslationFilesFormat {
  if (rawFormat in RAW_FORMAT_TO_TRANSLATION_FILES_FORMAT) {
    return RAW_FORMAT_TO_TRANSLATION_FILES_FORMAT[
      rawFormat as keyof typeof RAW_FORMAT_TO_TRANSLATION_FILES_FORMAT
    ];
  }
  throw new Error(`Invalid translation files format: "${rawFormat}"`);
}
