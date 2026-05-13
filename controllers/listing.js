const Listing = require("../models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;

const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
  let allListings = await Listing.find({});
  res.render("listings/index", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new");
};

module.exports.showListing = async (req, res, next) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested does not exists");
    return res.redirect("/listings");
  }
  console.log(listing);
  res.render("listings/show", { listing });
};

module.exports.createListing = async (req, res) => {

//   let response = await geocodingClient.forwardGeocode({
//   query: 'req.body.listing.location',
//   limit: 2
// })
//   .send()
//   .then(response => {
//     const match = response.body;
//   });

//   response.body.features[0].geometry;
  


  let url = req.file.path;
  let filename = req.file.filename;
  let listing = req.body.listing;
  const newListing = new Listing({
    ...listing,
    image: {
      url: listing.image,
      filename: "listingimage",
    },
  });
  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  // newListing.geometry =  response.body.features[0].geometry;

  // let savedListing = await newListing.save();
  // console.log(savedListing);
  
  req.flash("success", "New listing created!");
  await newListing.save();
  res.redirect("/listings");
};

module.exports.editListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested does not exists");
    return res.redirect("/listings");
  }

  let OriginalImageUrl = listing.image.url;
  OriginalImageUrl = OriginalImageUrl.replace("/upload", "/upload/h_300,w_250");
  res.render("listings/edit", { listing, OriginalImageUrl});
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;

  let formData = req.body.listing; // ✅ renamed
  let updateData = { ...formData };

  if (formData.image && formData.image.trim() !== "") {
    updateData.image = {
      url: formData.image,
      filename: "listingimage",
    };
  } else {
    delete updateData.image;
  }

  let listing = await Listing.findByIdAndUpdate(id, updateData);

  if (typeof req.file != "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }

  req.flash("success", "Listing updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
