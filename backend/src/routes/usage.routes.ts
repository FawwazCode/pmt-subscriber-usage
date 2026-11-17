
import { Router } from "express";
import {
  getUsageRecords,
  createUsageRecord,
} from "../controllers/usage.controller";

const router = Router();

router.get("/", getUsageRecords);
router.post("/", createUsageRecord);

export default router;
