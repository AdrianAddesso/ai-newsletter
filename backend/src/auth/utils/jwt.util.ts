import { JWTPayload, SignJWT, jwtVerify } from 'jose';

export async function signToken(
  payload: JWTPayload,
  secret: string,
  expiresIn: string | number
): Promise<string> {
  const encodedSecret = new TextEncoder().encode(secret);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(encodedSecret);
}

export async function verifyToken(token: string, secret: string): Promise<JWTPayload> {
  const encodedSecret = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, encodedSecret);
  return payload;
}
