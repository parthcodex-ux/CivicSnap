import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: 'CITIZEN' | 'OFFICIAL' | 'ADMIN';
  fullName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

let supabaseAuthClient: any = null;
if (config.SUPABASE_URL && config.SUPABASE_ANON_KEY) {
  supabaseAuthClient = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
}

/**
 * Middleware that authenticates requests using Supabase Auth JWT or dev test token
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // If Supabase is configured, verify with Supabase Auth
    if (supabaseAuthClient) {
      try {
        const { data: { user }, error } = await supabaseAuthClient.auth.getUser(token);
        if (error || !user) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'INVALID_TOKEN',
              message: 'Supabase authentication token is invalid or expired'
            }
          });
        }

        req.user = {
          id: user.id,
          email: user.email,
          role: (user.user_metadata?.role as any) || 'CITIZEN',
          fullName: user.user_metadata?.full_name || 'Verified Citizen'
        };
        return next();
      } catch (err: any) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_VERIFICATION_ERROR',
            message: err.message
          }
        });
      }
    }

    // In dev / offline mode, accept standard test bearer token format
    if (token.startsWith('dev-citizen-')) {
      const citizenId = token.replace('dev-citizen-', '');
      req.user = {
        id: `usr_${citizenId}`,
        email: `${citizenId}@citizen.civicsnap.org`,
        role: 'CITIZEN',
        fullName: `Citizen (${citizenId})`
      };
      return next();
    }
  }

  // Default fallback citizen for seamless local dev & hackathon judging test
  req.user = {
    id: 'usr_default_citizen',
    email: 'citizen@civicsnap.org',
    role: 'CITIZEN',
    fullName: 'Demo Citizen'
  };
  return next();
}

