const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authenticate");
const badgeValidator = require("../middlewares/validators/badges");
const { upload } = require("../utils/multer");
const badge = require("../controllers/badges");
const authorizeRoles = require("../middlewares/authorizeRoles");
const { SUPERUSER } = require("../constants/roles");

router.get("/", badge.getBadges);
router.get("/:username", badge.getUserBadgeIds);
router.post(
  "/",
  authenticate,
  authorizeRoles([SUPERUSER]),
  upload.single("badge"),
  badgeValidator.createBadge,
  badge.postBadge
);
router.post(
  "/assign/:username",
  authenticate,
  authorizeRoles([SUPERUSER]),
  badgeValidator.assignOrUnassignBadges,
  badge.postUserBadges
);
router.delete(
  "/unassign/:username",
  authenticate,
  authorizeRoles([SUPERUSER]),
  badgeValidator.assignOrUnassignBadges,
  badge.deleteUserBadges
);

module.exports = router;
