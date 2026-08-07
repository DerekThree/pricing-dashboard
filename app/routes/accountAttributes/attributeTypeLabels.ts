import { AttributeType } from "../../generated/api/models";

export const attributeTypeLabels: Record<AttributeType, string> = {
  [AttributeType.TEXT]: "Text",
  [AttributeType.DECIMAL]: "Decimal",
  [AttributeType.INTEGER]: "Integer",
  [AttributeType.DATE]: "Date",
  [AttributeType.BOOLEAN]: "Boolean",
};
