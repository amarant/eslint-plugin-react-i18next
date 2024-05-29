import { AST_NODE_TYPES, ASTUtils, TSESTree } from "@typescript-eslint/utils";
import { closest } from "fastest-levenshtein";
import { createRule } from "../utils/create-rule";
import { getSettings } from "../utils/settings";
import {
  getKeysFromTranslations,
  getTranslations,
  hasKeyInTranslation,
} from "../utils/translations";

type Options = [];

const MESSAGES = {
  "non-existing-key":
    'The key "{{ key }}" does not exist in any of the translation files. Did you mean "{{ closestKey }}"? To add a new key make sure to define it in the translation files',
  "missing-key-in-file":
    'The key "{{ key }}" is missing in {{ filePath }} even though it exists in some of the translation files',
  "empty-attribute": "The attribute i18nKey must not be empty if defined",
  "dynamic-key": "The value of i18nKey must be a static string",
  "wrong-key-type": "The value of i18nKey must be a string",
} as const;

export default createRule<Options, keyof typeof MESSAGES>({
  name: "valid-key",
  meta: {
    docs: {
      description: "Validate i18next keys in Reade code",
      recommended: "recommended",
      requiresTypeChecking: false,
    },
    messages: MESSAGES,
    type: "problem",
    schema: [],
  },
  defaultOptions: [],
  create: function (context) {
    if (!context.getCwd) {
      throw new Error("can't get cwd");
    }

    const cwd = context.getCwd();
    const settings = getSettings(context);
    const translations = getTranslations(
      cwd,
      settings.translationFiles.location
    );
    const keys = getKeysFromTranslations(
      settings.translationFiles.format,
      translations
    );
    const keysArray = Array.from(keys);

    const nonExistingKeyReport = (key: string, node: TSESTree.Node) => {
      if (!keys.has(key)) {
        context.report({
          messageId: "non-existing-key",
          node,
          data: {
            key,
            closestKey: closest(key, keysArray),
          },
        });
        return true;
      }
      return false;
    };

    const missingKeyInFileReport = (key: string, node: TSESTree.Node) => {
      for (const [filePath, translation] of Object.entries(translations)) {
        if (
          !hasKeyInTranslation(
            settings.translationFiles.format,
            translation,
            key
          )
        ) {
          context.report({
            messageId: "missing-key-in-file",
            node,
            data: {
              key,
              filePath,
            },
          });
        }
      }
    };

    const validateStaticValue = (
      node: TSESTree.Node,
      staticValue: {
        value: unknown;
      } | null,
      hasCountProperty: boolean
    ) => {
      if (!staticValue) {
        context.report({
          messageId: "dynamic-key",
          node,
        });
        return;
      }

      if (typeof staticValue.value !== "string") {
        context.report({
          messageId: "wrong-key-type",
          node,
        });
        return;
      }

      const key = staticValue.value;

      const keysToCheck = hasCountProperty
        ? [`${key}_one`, `${key}_other`]
        : [key];

      if (
        keysToCheck.reduce(
          (acc, key) => nonExistingKeyReport(key, node) || acc,
          false
        )
      ) {
        return;
      }

      keysToCheck.forEach((key) => missingKeyInFileReport(key, node));
    };

    return {
      JSXElement: (element) => {
        if (isTransElement(element)) {
          const attribute =
            element.openingElement.attributes.find(isI18nKeyAttribute);

          if (!attribute) {
            return;
          }

          if (!attribute.value) {
            context.report({
              messageId: "empty-attribute",
              node: attribute,
            });
            return;
          }

          const staticValue = ASTUtils.getStaticValue(
            attribute.value.type === AST_NODE_TYPES.JSXExpressionContainer
              ? attribute.value.expression
              : attribute.value,
            context.getScope()
          );

          validateStaticValue(attribute, staticValue, false);
        }
      },
      CallExpression: (expression) => {
        if (
          ASTUtils.isIdentifier(expression.callee) &&
          expression.callee.name === "t"
        ) {
          if (!expression.arguments.length) {
            return;
          }
          const [firstArgument, secondArgument] = expression.arguments;
          const staticValue = ASTUtils.getStaticValue(
            firstArgument,
            context.getScope()
          );
          // check if second argument is an object with a count property
          const hasCountProperty =
            secondArgument &&
            secondArgument.type === AST_NODE_TYPES.ObjectExpression &&
            secondArgument.properties.some(
              (property) =>
                property.type === AST_NODE_TYPES.Property &&
                property.key.type === AST_NODE_TYPES.Identifier &&
                property.key.name === "count"
            );
          validateStaticValue(firstArgument, staticValue, hasCountProperty);
        }
      },
    };
  },
});

function isTransElement(element: TSESTree.JSXElement): boolean {
  return (
    element.openingElement.name.type === AST_NODE_TYPES.JSXIdentifier &&
    element.openingElement.name.name === "Trans"
  );
}

function isI18nKeyAttribute(
  attribute: TSESTree.JSXAttribute | TSESTree.JSXSpreadAttribute
): attribute is TSESTree.JSXAttribute {
  return (
    attribute.type === AST_NODE_TYPES.JSXAttribute &&
    attribute.name.name === "i18nKey"
  );
}
