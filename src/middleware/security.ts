import { Request, Response, NextFunction } from "express";
import aj from '../config/arcjet.js';
import { slidingWindow, type ArcjetNodeRequest } from "@arcjet/node";

const securityMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'test') {
        return next();
    }
    
    try {
        const role: RateLimitRole = req.user?.role ?? 'guest';
        
        let limit: number;
        let message: string;
        
        switch (role) {
            case "admin":
                limit = 120;
                message = 'Admin request limit exceeded (120 per minute), slow down';
                break;
            case "teacher":
                limit = 60;
                message = 'User request limit exceeded (60 per minute), please wait';
                break;
            case "student":
                limit = 60;
                message = 'User request limit exceeded (60 per minute), please wait';
                break;
            default:
                limit = 30;
                message = 'Guest request limit exceeded (30 per minute), sign-up for higher limits';
                break;
        }
        
        const client = aj.withRule(
            slidingWindow({
                mode: 'LIVE',
                interval: '1m',
                max: limit,
            })
        );
        
        const arcjetRequest: ArcjetNodeRequest = {
            headers: req.headers,
            method: req.method,
            url: req.originalUrl ?? req.url,
            socket: { remoteAddress: req.socket.remoteAddress ?? req.ip ?? '0.0.0.0' },
        }
        
        const decision = await client.protect(arcjetRequest);
        
        if (decision.isDenied() && decision.reason.isBot()) {
            return res.status(403).json({ error: 'Unauthorized', message: 'Automated requests are not allowed' });
        }
        if (decision.isDenied() && decision.reason.isShield()) {
            return res.status(403).json({ error: 'Unauthorized', message: 'Request blocked by securoty policy' });
        }
        if (decision.isDenied() && decision.reason.isRateLimit()) {
            return res.status(429).json({ error: 'Too many requests', message });
        }
        
        next();
        
    } catch (err) {
        console.error('Arcjet middleware error', err);
        res.status(500).json({ error: 'internal server error', message: 'Something went wrong with the middleware' });
    }
}

export default securityMiddleware;