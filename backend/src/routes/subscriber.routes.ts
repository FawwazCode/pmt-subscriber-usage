
import { Router } from "express";
import { getSubscribers } from "../controllers/subscriber.controller";

const router = Router();

router.get("/", getSubscribers);

export default router;
