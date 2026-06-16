import { prisma } from "db";
import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from 'jose';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cewmqftxppafynkkiuwo.supabase.co';
const PROJECT_JWKS = createRemoteJWKSet(
    new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
)

async function verifyProjectJWT(jwt: string) {
    return jwtVerify(jwt, PROJECT_JWKS)
}

export default async function requireAuth(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader =  req.headers.authorization;
        if (!authHeader) throw new Error("No token");

        const token = authHeader.substring(7);
        const jwt = await verifyProjectJWT(token);
        const supabaseId = jwt.payload.sub as string;

        const user = await prisma.user.upsert({
            where: {
              supabaseUid: supabaseId,
            },
            update: {},
            create: {
              supabaseUid: supabaseId,
              usdBalance: 0,
              lockedBalance: 0,
            },
          });
          
          req.userId = user.id;
          
        next();
    } catch(e) {
        console.log(e);
        res.status(403).json({
            message: "Incorrect credentials"
        })
    }
}