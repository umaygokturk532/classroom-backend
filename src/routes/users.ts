import express from "express";
import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import { roleEnum, user } from "../db/schema/index.js";
import { db } from "../db/index.js";

const router = express.Router();

type Role = (typeof roleEnum.enumValues)[number];

router.get("/", async (req, res) => {
    try {
        const { search, role, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
        const limitPerPage = Math.min(Math.max(1, parseInt(String(limit), 10) || 10), 100);

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        // If search query exists, filter by user name or email
        if (search) {
            const searchPattern = `%${String(search).replace(/[\\%_]/g, '\\$&')}%`;
            filterConditions.push(
                or(
                    ilike(user.name, searchPattern),
                    ilike(user.email, searchPattern),
                )
            );
        }

        // If role filter exists, filter by exact role match
        if (role) {
            const roleValue = String(role);

            // role is a Postgres enum, so an unknown value would make the query fail
            if (!roleEnum.enumValues.includes(roleValue as Role)) {
                res.status(400).send(`Invalid role. Expected one of: ${roleEnum.enumValues.join(", ")}`);
                return;
            }

            filterConditions.push(eq(user.role, roleValue as Role));
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(user)
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        const usersList = await db
            .select({
                ...getTableColumns(user),
            })
            .from(user)
            .where(whereClause)
            .orderBy(desc(user.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: usersList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            }
        });


    } catch (err) {
        console.error(`GET /users error: ${err}`);
        res.status(500).send("Failed to get users");
    }
});

export default router;
