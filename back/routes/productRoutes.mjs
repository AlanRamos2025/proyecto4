import express from "express";
import { getAll, create, update } from "../controllers/productController.mjs";
import { verifyToken } from "../middleware/authMiddleware.mjs";

const router = express.Router();

router.get("/", getAll);
router.post("/", verifyToken, create);
router.put("/:id", verifyToken, update);

export default router;
