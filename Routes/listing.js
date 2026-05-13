const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js");

const multer  = require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage });

const {
  isLoggedIn,
  isOwner,
  validateListing,
} = require("../middleware.js");

const listingController = require("../controllers/listing.js");


// INDEX + CREATE
router.route("/")
.get(
  wrapAsync(listingController.index)
)
.post(
  isLoggedIn,
  upload.single("listing[image]"),
  validateListing,
  wrapAsync(listingController.createListing)
);



// NEW
router.get(
  "/new",
  isLoggedIn,
  listingController.renderNewForm
);


// EDIT
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.editListing)
);


// SHOW + UPDATE + DELETE
router.route("/:id")
.get(
  wrapAsync(listingController.showListing)
)
.put(
  isLoggedIn,
  isOwner,
  upload.single("listing[image]"),
  validateListing,
  wrapAsync(listingController.updateListing)
)
.delete(
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.deleteListing)
);

module.exports = router;