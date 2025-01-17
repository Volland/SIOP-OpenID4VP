import fs from 'fs';
import {
  createFormatter,
  createParser,
  createProgram, MutableTypeFormatter,
  SchemaGenerator,
  BaseType,
  Definition,
  FunctionType,
  SubTypeFormatter
} from 'ts-json-schema-generator';

class CustomTypeFormatter implements SubTypeFormatter {
  public supportsType(type: FunctionType): boolean {
    return type instanceof FunctionType;
  }

  public getDefinition(): Definition {
    // Return a custom schema for the function property.
    return {
      properties: {
        isFunction: {
          type: "boolean",
          const: true,
        },
      },
    };
  }

  public getChildren(): BaseType[] {
    return [];
  }
}

function writeSchema(config) {
  const formatter = createFormatter(config, (fmt: MutableTypeFormatter) => {
    fmt.addTypeFormatter(new CustomTypeFormatter());
  });

  const program = createProgram(config);
  const schema = new SchemaGenerator(program, createParser(program, config), formatter, config).createSchema(config.type);

  let schemaString = JSON.stringify(schema, null, 2);
  schemaString = correctSchema(schemaString)

  fs.writeFile(config.outputPath, `export const ${config.outputConstName} = ${schemaString};`, (err) => {
    if (err) throw err;
  });
}

function correctSchema(schemaString: string) {
  return schemaString.replace("\"SuppliedSignature\": {\n" +
    "      \"type\": \"object\",\n" +
    "      \"properties\": {\n" +
    "        \"signature\": {\n" +
    "          \"properties\": {\n" +
    "            \"isFunction\": {\n" +
    "              \"type\": \"boolean\",\n" +
    "              \"const\": true\n" +
    "            }\n" +
    "          }\n" +
    "        },\n" +
    "        \"did\": {\n" +
    "          \"type\": \"string\"\n" +
    "        },\n" +
    "        \"kid\": {\n" +
    "          \"type\": \"string\"\n" +
    "        }\n" +
    "      },\n" +
    "      \"required\": [\n" +
    "        \"signature\",\n" +
    "        \"did\",\n" +
    "        \"kid\"\n" +
    "      ],\n" +
    "      \"additionalProperties\": false\n" +
    "    },",
    "\"SuppliedSignature\": {\n" +
    "      \"type\": \"object\",\n" +
    "      \"properties\": {\n" +
    "        \"did\": {\n" +
    "          \"type\": \"string\"\n" +
    "        },\n" +
    "        \"kid\": {\n" +
    "          \"type\": \"string\"\n" +
    "        }\n" +
    "      },\n" +
    "      \"required\": [\n" +
    "        \"did\",\n" +
    "        \"kid\"\n" +
    "      ],\n" +
    "      \"additionalProperties\": true\n" +
    "    },")
}

const requestOptsConf = {
  path: "../src/main/authorization-request/types.ts",
  tsconfig: "tsconfig.json",
  type: "CreateAuthorizationRequestOpts", // Or <type-name> if you want to generate schema for that one type only
  outputPath: "src/main/schemas/AuthorizationRequestOpts.schema.ts",
  outputConstName: "AuthorizationRequestOptsSchema",
  skipTypeCheck: true
};


const responseOptsConf = {
  path: "../src/main/authorization-response/types.ts",
  tsconfig: "tsconfig.json",
  type: "AuthorizationResponseOpts", // Or <type-name> if you want to generate schema for that one type only
  outputPath: "src/main/schemas/AuthorizationResponseOpts.schema.ts",
  outputConstName: "AuthorizationResponseOptsSchema",
  skipTypeCheck: true
};

const rPRegistrationMetadataPayload = {
  path: '../src/main/types/SIOP.types.ts',
  tsconfig: 'tsconfig.json',
  type: 'RPRegistrationMetadataPayload',
  outputPath: 'src/main/schemas/RPRegistrationMetadataPayload.schema.ts',
  outputConstName: 'RPRegistrationMetadataPayloadSchema',
  skipTypeCheck: true
};

const discoveryMetadataPayload = {
  path: '../src/main/types/SIOP.types.ts',
  tsconfig: 'tsconfig.json',
  type: 'DiscoveryMetadataPayload',
  outputPath: 'src/main/schemas/DiscoveryMetadataPayload.schema.ts',
  outputConstName: 'DiscoveryMetadataPayloadSchema',
  skipTypeCheck: true
};

const authorizationRequestPayloadVID1 = {
  path: "../src/main/types/SIOP.types.ts",
  tsconfig: "tsconfig.json",
  type: "AuthorizationRequestPayloadVID1", // Or <type-name> if you want to generate schema for that one type only
  outputPath: "src/main/schemas/AuthorizationRequestPayloadVID1.schema.ts",
  outputConstName: "AuthorizationRequestPayloadSchemaVID1",
  skipTypeCheck: true
};

const authorizationRequestPayloadVD11 = {
  path: "../src/main/types/SIOP.types.ts",
  tsconfig: "tsconfig.json",
  type: "AuthorizationRequestPayloadVD11", // Or <type-name> if you want to generate schema for that one type only
  outputPath: "src/main/schemas/AuthorizationRequestPayloadVD11.schema.ts",
  outputConstName: "AuthorizationRequestPayloadSchemaVD11",
  skipTypeCheck: true
}

writeSchema(authorizationRequestPayloadVID1)
writeSchema(authorizationRequestPayloadVD11)
writeSchema(requestOptsConf);
writeSchema(responseOptsConf);
writeSchema(rPRegistrationMetadataPayload);
writeSchema(discoveryMetadataPayload);
