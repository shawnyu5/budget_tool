import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "../backend/schema.graphql",
  documents: "src/graphql/**.graphql",
  generates: {
    "src/generated/graphql.ts": {
      plugins: [
        "typescript",
        "typescript-operations", // types for your GraphQL queries/mutations (e.g. GetUserQuery)
        "typescript-graphql-request", // types for making GraphQL requests
      ],
      config: {
        scalars: {
           Decimal: "decimal.js#Decimal",
           DateTime: "Date"
        },
      },
    },
    "./graphql.schema.json": {
      plugins: ["introspection"],
    },
  },
};

export default config;
