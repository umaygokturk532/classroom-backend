import express from "express";
import { db } from "../db/index.js";
import { classes } from "../db/schema/index.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { name, teacherId, subjectId, capacity, description, status, bannerUrl, bannerCldPubId } = req.body;
        
        const [createdClass] = await db
            .insert(classes)
            .values({ ...req.body, inviteCode: Math.random().toString(36).substr(2, 9), schedules: [] })
            .returning({ id: classes.id });
        
        if (!createdClass) throw new Error('Error creating classes');
        
        res.status(201).json({ data: createdClass });
        
    } catch (err) {
        console.log('POST /classes error', err);
        res.status(500).json({ error: err });
    }
});

export default router;