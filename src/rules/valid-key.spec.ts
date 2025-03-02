import { RuleTester } from "@typescript-eslint/rule-tester";
import { RawSettings } from "../utils/settings";
import rule from "./valid-key";

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
} as any);

const FLAT_SETTINGS: RawSettings = {
  "@amarant/react-i18next": {
    translationFiles: {
      location: "test/fixtures/flat/*.json",
      format: "flat",
    },
  },
};

const NESTED_SETTINGS: RawSettings = {
  "@amarant/react-i18next": {
    translationFiles: {
      location: "test/fixtures/nested/*.json",
      format: "nested",
    },
  },
};

const CUSTOM_TRANSLATION_FUNCTIONS_SETTINGS: RawSettings = {
  "@amarant/react-i18next": {
    translationFiles: {
      location: "test/fixtures/nested/*.json",
      format: "nested",
    },
    translationFunctions: ["t", "i18n.t", "tv"],
  },
};

ruleTester.run("valid-key", rule, {
  valid: [
    {
      code: `<Trans i18nKey="valid" />`,
      settings: FLAT_SETTINGS,
    },
    {
      code: `<Trans i18nKey="nested.valid" />`,
      settings: NESTED_SETTINGS,
    },
    {
      code: `t("valid")`,
      settings: FLAT_SETTINGS,
    },
    {
      code: `t("nested.valid")`,
      settings: NESTED_SETTINGS,
    },
    {
      code: `i18n.t("nested.valid")`,
      settings: NESTED_SETTINGS,
    },
    {
      code: `t("withCount", { count: 42 })`,
      settings: FLAT_SETTINGS,
    },
  ],
  invalid: [
    {
      code: `<Trans i18nKey />`,
      settings: FLAT_SETTINGS,
      errors: [
        {
          messageId: "empty-attribute",
          data: { filePath: "test/fixtures/flat/en-US.json" },
        },
      ],
    },
    {
      code: `<Trans i18nKey={dynamicKey} />`,
      settings: FLAT_SETTINGS,
      errors: [
        {
          messageId: "dynamic-key",
          data: { filePath: "test/fixtures/flat/en-US.json" },
        },
      ],
    },
    {
      code: `<Trans i18nKey={42} />`,
      settings: FLAT_SETTINGS,
      errors: [
        {
          messageId: "wrong-key-type",
          data: { filePath: "test/fixtures/flat/en-US.json" },
        },
      ],
    },
    {
      code: `<Trans i18nKey="invalid" />`,
      settings: FLAT_SETTINGS,
      errors: [
        {
          messageId: "non-existing-key",
          data: {
            key: "invalid",
            closestKey: "valid",
          },
        },
      ],
    },
    {
      code: `<Trans i18nKey="nested.invalid" />`,
      settings: NESTED_SETTINGS,
      errors: [
        {
          messageId: "non-existing-key",
          data: {
            key: "nested.invalid",
            closestKey: "nested.valid",
          },
        },
      ],
    },
    {
      code: `<Trans i18nKey="onlyInEn" />`,
      settings: FLAT_SETTINGS,
      errors: [
        {
          messageId: "missing-key-in-file",
          data: {
            key: "onlyInEn",
            filePath: "test/fixtures/flat/es-ES.json",
          },
        },
      ],
    },
    {
      code: `t(dynamicKey)`,
      settings: FLAT_SETTINGS,
      errors: [
        {
          messageId: "dynamic-key",
          data: { filePath: "test/fixtures/flat/en-US.json" },
        },
      ],
    },
    {
      code: `i18n.t(dynamicKey)`,
      settings: FLAT_SETTINGS,
      errors: [
        {
          messageId: "dynamic-key",
          data: { filePath: "test/fixtures/flat/en-US.json" },
        },
      ],
    },
    {
      code: `t(42)`,
      settings: FLAT_SETTINGS,
      errors: [
        {
          messageId: "wrong-key-type",
          data: { filePath: "test/fixtures/flat/en-US.json" },
        },
      ],
    },
    {
      code: `t("invalid")`,
      settings: FLAT_SETTINGS,
      errors: [
        {
          messageId: "non-existing-key",
          data: {
            key: "invalid",
            closestKey: "valid",
          },
        },
      ],
    },
    {
      code: `t("nested.invalid")`,
      settings: NESTED_SETTINGS,
      errors: [
        {
          messageId: "non-existing-key",
          data: {
            key: "nested.invalid",
            closestKey: "nested.valid",
          },
        },
      ],
    },
    {
      code: `t("onlyInEn")`,
      settings: FLAT_SETTINGS,
      errors: [
        {
          messageId: "missing-key-in-file",
          data: {
            key: "onlyInEn",
            filePath: "test/fixtures/flat/es-ES.json",
          },
        },
      ],
    },
    {
      code: `t("withCountOnlyOne", { count: 42 })`,
      settings: FLAT_SETTINGS,
      errors: [
        {
          messageId: "non-existing-key",
          data: {
            key: "withCountOnlyOne_other",
            closestKey: "withCountOnlyOne_one",
          },
        },
      ],
    },
    {
      code: `tv("nested.invalid")`,
      settings: CUSTOM_TRANSLATION_FUNCTIONS_SETTINGS,
      errors: [
        {
          messageId: "non-existing-key",
          data: {
            key: "nested.invalid",
            closestKey: "nested.valid",
          },
        },
      ],
    },
    {
      code: `i18n.t("nested.invalid")`,
      settings: CUSTOM_TRANSLATION_FUNCTIONS_SETTINGS,
      errors: [
        {
          messageId: "non-existing-key",
          data: {
            key: "nested.invalid",
            closestKey: "nested.valid",
          },
        },
      ],
    },
  ],
});
