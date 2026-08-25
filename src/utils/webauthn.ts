type RegistrationOptionsJson = Record<string, unknown>
type RegistrationCredentialJson = Record<string, unknown>

function base64UrlToArrayBuffer(value: string): ArrayBuffer {
  const base64 = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}

function bufferToBase64Url(value: ArrayBuffer | Uint8Array): string {
  const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : value
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function resolveDeviceName(): string {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  return nav.userAgentData?.platform || navigator.platform || 'Current device'
}

function readObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function mapTransports(transports: string[]): AuthenticatorTransport[] {
  return transports.filter(Boolean).filter((value): value is AuthenticatorTransport => {
    return ['usb', 'nfc', 'ble', 'smart-card', 'hybrid', 'internal'].includes(value)
  })
}

function toBufferSource(value: ArrayBuffer): BufferSource {
  return new Uint8Array(value)
}

function readResidentKeyRequirement(value: unknown): ResidentKeyRequirement {
  return value === 'discouraged' || value === 'preferred' || value === 'required'
    ? value
    : 'preferred'
}

function readUserVerificationRequirement(value: unknown): UserVerificationRequirement {
  return value === 'discouraged' || value === 'preferred' || value === 'required'
    ? value
    : 'preferred'
}

function readAuthenticatorAttachment(value: unknown): AuthenticatorAttachment | undefined {
  return value === 'platform' || value === 'cross-platform' ? value : undefined
}

function readAttestationConveyancePreference(value: unknown): AttestationConveyancePreference {
  return value === 'direct' || value === 'enterprise' || value === 'indirect' || value === 'none'
    ? value
    : 'none'
}

function normalizeRegistrationOptions(
  options: RegistrationOptionsJson,
  email: string
): PublicKeyCredentialCreationOptions {
  const source = readObject(options.publicKey) || options
  const rp = readObject(source.rp) || {}
  const user = readObject(source.user) || {}
  const authenticatorSelection = readObject(source.authenticatorSelection) || undefined
  const excludeCredentials: PublicKeyCredentialDescriptor[] | undefined = Array.isArray(
    source.excludeCredentials
  )
    ? source.excludeCredentials.flatMap((item) => {
        const descriptor = readObject(item)
        const credentialId = descriptor ? readString(descriptor.id) : ''
        if (!credentialId) {
          return []
        }
        return [
          {
            type: 'public-key' as const,
            id: toBufferSource(base64UrlToArrayBuffer(credentialId)),
            transports: mapTransports(
              Array.isArray(descriptor?.transports)
                ? descriptor.transports.map((transport) => String(transport))
                : []
            )
          }
        ]
      })
    : undefined
  const pubKeyCredParams = Array.isArray(source.pubKeyCredParams)
    ? source.pubKeyCredParams
        .map((item) => {
          const param = readObject(item)
          if (!param) {
            return null
          }
          const alg = Number(param.alg)
          return Number.isFinite(alg)
            ? {
                type: 'public-key' as const,
                alg
              }
            : null
        })
        .filter((item): item is PublicKeyCredentialParameters => !!item)
    : [
        { type: 'public-key' as const, alg: -7 },
        { type: 'public-key' as const, alg: -257 }
      ]

  // Pass through extensions and hints from server (not yet in TS PublicKeyCredentialCreationOptions type)
  const result: PublicKeyCredentialCreationOptions = {
    challenge: toBufferSource(base64UrlToArrayBuffer(readString(source.challenge))),
    rp: {
      id: readString(rp.id) || readString(source.rpId),
      name: readString(rp.name) || readString(source.rpName)
    },
    user: {
      id: toBufferSource(base64UrlToArrayBuffer(readString(user.id) || readString(source.userId))),
      name: readString(user.name) || readString(source.userName) || email,
      displayName: readString(user.displayName) || readString(source.userDisplayName) || email
    },
    pubKeyCredParams,
    timeout: Number(source.timeout || 60000),
    excludeCredentials,
    authenticatorSelection: authenticatorSelection
      ? {
          authenticatorAttachment: readAuthenticatorAttachment(
            authenticatorSelection.authenticatorAttachment
          ),
          residentKey: readResidentKeyRequirement(authenticatorSelection.residentKey),
          requireResidentKey: Boolean(authenticatorSelection.requireResidentKey),
          userVerification: readUserVerificationRequirement(authenticatorSelection.userVerification)
        }
      : undefined,
    attestation: readAttestationConveyancePreference(source.attestation)
  } as unknown as PublicKeyCredentialCreationOptions

  if (source.extensions)
    result.extensions = source.extensions as AuthenticationExtensionsClientInputs
  if (Array.isArray(source.hints) && source.hints.length > 0) (result as any).hints = source.hints

  return result
}

function encodeAuthenticatorAttestationResponse(response: AuthenticatorAttestationResponse) {
  const payload: Record<string, unknown> = {
    clientDataJSON: bufferToBase64Url(response.clientDataJSON),
    attestationObject: bufferToBase64Url(response.attestationObject)
  }
  if ('getTransports' in response && typeof response.getTransports === 'function') {
    payload.transports = response.getTransports()
  }
  if ('getPublicKeyAlgorithm' in response && typeof response.getPublicKeyAlgorithm === 'function') {
    payload.publicKeyAlgorithm = response.getPublicKeyAlgorithm()
  }
  if ('getAuthenticatorData' in response && typeof response.getAuthenticatorData === 'function') {
    payload.authenticatorData = bufferToBase64Url(response.getAuthenticatorData())
  }
  if ('getPublicKey' in response && typeof response.getPublicKey === 'function') {
    const publicKey = response.getPublicKey()
    if (publicKey) {
      payload.publicKey = bufferToBase64Url(publicKey)
    }
  }
  return payload
}

function encodeClientExtensionResults(
  results: AuthenticationExtensionsClientOutputs
): Record<string, unknown> {
  return Object.fromEntries(Object.entries(results).map(([key, value]) => [key, value ?? null]))
}

export async function runPasskeyRegistration(
  options: RegistrationOptionsJson,
  email: string
): Promise<RegistrationCredentialJson> {
  if (!window.PublicKeyCredential || !navigator.credentials?.create) {
    throw new Error('Passkey registration is not supported by this browser.')
  }
  const credential = await navigator.credentials.create({
    publicKey: normalizeRegistrationOptions(options, email)
  })
  if (!(credential instanceof PublicKeyCredential)) {
    throw new Error('Passkey registration did not return a browser credential response.')
  }
  const response = credential.response as AuthenticatorAttestationResponse
  return {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: credential.type,
    response: encodeAuthenticatorAttestationResponse(response),
    clientExtensionResults: encodeClientExtensionResults(credential.getClientExtensionResults()),
    authenticatorAttachment: credential.authenticatorAttachment,
    deviceName: resolveDeviceName()
  }
}

export async function runPasskeyAuthentication(options: {
  challenge?: string
  rpId?: string
  timeout?: number | string
  allowCredentials?: string[]
}): Promise<Record<string, string>> {
  if (!window.PublicKeyCredential || !navigator.credentials?.get) {
    throw new Error('Passkey verification is not supported by this browser.')
  }
  const allowCredentials = Array.isArray(options.allowCredentials)
    ? options.allowCredentials.filter(Boolean).map((credentialId) => ({
        type: 'public-key' as const,
        id: base64UrlToArrayBuffer(credentialId)
      }))
    : []
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: base64UrlToArrayBuffer(options.challenge || ''),
      rpId: options.rpId,
      timeout: Number(options.timeout || 60000),
      allowCredentials,
      userVerification: 'preferred'
    }
  })
  if (!(credential instanceof PublicKeyCredential)) {
    throw new Error('Passkey verification did not return a browser credential response.')
  }
  const response = credential.response as AuthenticatorAssertionResponse
  return {
    credentialId: credential.id,
    clientDataJSON: bufferToBase64Url(response.clientDataJSON)
  }
}
