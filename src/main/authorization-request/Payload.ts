import { PEX } from '@sphereon/pex';
import Ajv from 'ajv';

import { validateLinkedDomainWithDid } from '../did';
import { getNonce } from '../helpers';
import { RequestObject } from '../request-object';
import { RPRegistrationMetadataPayloadSchema } from '../schemas';
import {
  AuthorizationRequestPayload,
  CheckLinkedDomain,
  ClaimPayloadVID1,
  ClientMetadataOpts,
  PassBy,
  RequestObjectPayload,
  RPRegistrationMetadataPayload,
  SIOPErrors,
  SupportedVersion,
} from '../types';

import { createRequestRegistration } from './RequestRegistration';
import { ClaimPayloadOptsVID1, CreateAuthorizationRequestOpts, VerifyAuthorizationRequestOpts } from './types';

const ajv = new Ajv({ allowUnionTypes: true, strict: false });
const validateRPRegistrationMetadata = ajv.compile(RPRegistrationMetadataPayloadSchema);

export const createPresentationDefinitionClaimsProperties = (opts: ClaimPayloadOptsVID1): ClaimPayloadVID1 => {
  if (!opts || !opts.vp_token || (!opts.vp_token.presentation_definition && !opts.vp_token.presentation_definition_uri)) {
    return undefined;
  }
  const pex: PEX = new PEX();
  const discoveryResult = pex.definitionVersionDiscovery(opts.vp_token.presentation_definition);
  if (discoveryResult.error) {
    throw new Error(SIOPErrors.REQUEST_CLAIMS_PRESENTATION_DEFINITION_NOT_VALID);
  }

  return {
    ...(opts.id_token ? { id_token: opts.id_token } : {}),
    ...(opts.vp_token.presentation_definition || opts.vp_token.presentation_definition_uri
      ? {
          vp_token: {
            ...(!opts.vp_token.presentation_definition_uri ? { presentation_definition: opts.vp_token.presentation_definition } : {}),
            ...(opts.vp_token.presentation_definition_uri ? { presentation_definition_uri: opts.vp_token.presentation_definition_uri } : {}),
          },
        }
      : {}),
  };
};

export const createAuthorizationRequestPayload = async (
  opts: CreateAuthorizationRequestOpts,
  requestObject?: RequestObject
): Promise<AuthorizationRequestPayload> => {
  const payload = opts.payload;
  const mergedPayload = { ...opts.payload, ...opts?.requestObject?.payload };
  const state = payload?.state ?? undefined;
  const nonce = payload?.nonce ? getNonce(state, payload.nonce) : undefined;
  // TODO: if opts['registration] throw Error to get rid of test code using that key
  const clientMetadata = opts['registration'] ? opts['registration'] : (opts.clientMetadata as ClientMetadataOpts);
  const registration = await createRequestRegistration(clientMetadata, opts);
  const claims =
    opts.version >= SupportedVersion.SIOPv2_ID1 ? mergedPayload.claims : createPresentationDefinitionClaimsProperties(mergedPayload.claims);
  // let clientId = mergedPayload.client_id;
  //
  // const metadataKey = opts.version >= SupportedVersion.SIOPv2_D11.valueOf() ? 'client_metadata' : 'registration';
  /*if (!clientId) {
    clientId = registration.payload[metadataKey].client_id;
  }*/
  const isRequestByValue = opts.requestObject.passBy === PassBy.VALUE;

  if (isRequestByValue && !requestObject) {
    throw Error(SIOPErrors.NO_JWT);
  }
  const request = isRequestByValue ? await requestObject.toJwt() : undefined;

  return {
    ...payload,
    //TODO implement /.well-known/openid-federation support in the OP side to resolve the client_id (URL) and retrieve the metadata
    ...(opts.requestObject.passBy === PassBy.REFERENCE ? { request_uri: opts.requestObject.referenceUri } : {}),
    ...(isRequestByValue ? { request } : {}),
    nonce,
    state,
    ...registration.payload,
    claims,
  };
};

export const assertValidRPRegistrationMedataPayload = (regObj: RPRegistrationMetadataPayload) => {
  if (regObj && !validateRPRegistrationMetadata(regObj)) {
    throw new Error('Registration data validation error: ' + JSON.stringify(validateRPRegistrationMetadata.errors));
  } else if (regObj?.subject_syntax_types_supported && regObj.subject_syntax_types_supported.length == 0) {
    throw new Error(`${SIOPErrors.VERIFY_BAD_PARAMS}`);
  }
};

export const checkWellknownDIDFromRequest = async (
  authorizationRequestPayload: RequestObjectPayload,
  opts: VerifyAuthorizationRequestOpts
): Promise<void> => {
  if (authorizationRequestPayload.client_id.startsWith('did:')) {
    if (opts.verification.checkLinkedDomain && opts.verification.checkLinkedDomain != CheckLinkedDomain.NEVER) {
      await validateLinkedDomainWithDid(
        authorizationRequestPayload.client_id,
        opts.verification.wellknownDIDVerifyCallback,
        opts.verification.checkLinkedDomain
      );
    } else if (!opts.verification.checkLinkedDomain) {
      await validateLinkedDomainWithDid(
        authorizationRequestPayload.client_id,
        opts.verification.wellknownDIDVerifyCallback,
        CheckLinkedDomain.IF_PRESENT
      );
    }
  }
};
