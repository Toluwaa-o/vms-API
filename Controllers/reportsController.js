const Report = require("../Models/reportModel");
const CustomErrors = require("../Errors");
const moment = require("moment");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const checkPermissions = require("../Utils/checkPermissons");

const getAllReports = async (req, res) => {
  const { search, sort, category, status, region } = req.query;

  let report;
  let result;
  let queryObject = {};

  if (!req.user.verified)
    throw new CustomErrors.UnauthenticatedError("User is not verified yet!");

  if (req.user.userType === "civilian") {
    queryObject = {
      createdBy: req.user.userId,
    };

    if (search) {
      queryObject.title = { $regex: search, $options: "i" };
    }

    if (status && status !== "all") {
      queryObject.status = status;
    }

    if(region && region !== "all"){
      queryObject.region = region
    }

    result = Report.find(queryObject);

    if (sort === "latest") {
      result = result.sort("-createdAt");
    }

    if (sort === "oldest") {
      result = result.sort("createdAt");
    }

    if (sort === "a-z") {
      result = result.sort("title");
    }

    if (sort === "z-a") {
      result = result.sort("-title");
    }

    const page = req.query.page || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    result = result.skip(skip).limit(limit);

    report = await result;

    if (!report.length > 0) {
      throw new CustomErrors.NotFoundError("No reports found");
    }

    const totalReports = await Report.countDocuments(queryObject);
    const numOfPages = Math.ceil(totalReports / limit);

    return res.status(200).json({
      reports: report.map((item) => {
        const { title, category, status, media, region, description, _id } =
          item;
        return { title, category, status, media, region, description, _id };
      }),
      count: report.length,
      page,
      totalReports,
      numOfPages,
    });
  }

  if (search) {
    queryObject.title = { $regex: search, $options: "i" };
  }

  if(region && region !== "all"){
    queryObject.region = region
  }

  if (status && status !== "all") {
    queryObject.status = status;
  }

  result = Report.find(queryObject);

  if (sort === "latest") {
    result = result.sort("-createdAt");
  }

  if (sort === "oldest") {
    result = result.sort("createdAt");
  }

  if (sort === "a-z") {
    result = result.sort("title");
  }

  if (sort === "z-a") {
    result = result.sort("-title");
  }

  const page = Number(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  result = result.skip(skip).limit(limit);

  report = await result;

  if (!report.length > 0) {
    throw new CustomErrors.NotFoundError("No reports found");
  }

  const totalReports = await Report.countDocuments(queryObject);
  const numOfPages = Math.ceil(totalReports / limit);
  res.status(200).json({
    reports: report.map((item) => {
      const { title, category, status, media, region, description, _id } =
        item;
      return { title, category, status, media, region, description, _id };
    }),
    count: report.length,
    page,
    totalReports,
    numOfPages,
  });
};

const createReport = async (req, res) => {
  if (req.user.userType === "officer")
    throw new CustomErrors.UnauthenticatedError(
      `Police officers cannot create a report`
    );
  const { location, description, category, region } = req.body;

  if (!location || !description || !category || !region) {
    throw new CustomErrors.BadRequestError(
      "Please provide all neccessary values"
    );
  }

  req.body.createdBy = req.user.userId;
  req.body.status = "pending";

  const report = await Report.create(req.body);

  res.status(201).json({
    title: report.title,
    category: report.category,
    status: report.status,
    media: report.media,
    location: report.location,
    description: report.description,
  });
};

const deleteReport = async (req, res) => {
  const report = await Report.findOne({ _id: req.params.id });

  if (!report) {
    throw new CustomErrors.NotFoundError(
      `No report was found with that ${req.params.id}`
    );
  }

  await report.deleteOne();

  res.status(200).json({ msg: "Report deleted successfully!" });
};

const updateReport = async (req, res) => {
  const { title, location, category, description, media, region } = req.body;

  const report = await Report.findOne({ _id: req.params.id });

  if (!report) {
    throw new CustomErrors.NotFoundError(
      `No report was found with that ${req.params.id}`
    );
  }

  checkPermissions(req.user, report.createdBy);

  if (report.status === "responded")
    throw new CustomErrors.Forbidden("Report has already been attended to!");

  await report.updateOne(
    { title, location, category, description, media, region },
    { new: true, runValidators: true }
  );

  return res.status(200).json({ report });
};

const updateReponse = async (req, res) => {
  const { response, status } = req.body;

  const report = await Report.findOne({ _id: req.params.id });

  if (!report) {
    throw new CustomErrors.NotFoundError(
      `No report was found with that ${req.params.id}`
    );
  }

  if (status === "active" && !response)
    throw new CustomErrors.BadRequestError(
      "Please provide a the response information"
    );

  checkPermissions(req.user, report.createdBy);

  if (report.status === "responded")
    throw new CustomErrors.Forbidden("Report has already been attended to!");

  if (response && !report.response) {
    req.body.status = "active";
    req.body.response = response;
  }

  if (report.response) {
    req.body.response = report.response;
  }

  await report.updateOne(
    { response: req.body.response, status: req.body.status },
    { new: true, runValidators: true }
  );

  return res.status(200).json({ report });
};

const getReport = async (req, res) => {
  if (!req.user.verified)
    throw new CustomErrors.UnauthenticatedError("User is not verified yet!");
  const report = await Report.findOne({ _id: req.params.id }).populate({
    path: "createdBy",
    select: "firstName lastName contact",
  });

  if (!report) {
    throw new CustomErrors.NotFoundError("No reports found");
  }

  if (req.user.userType === "civilian")
    checkPermissions(req.user, report.createdBy._id);

  // const { title, category, status, media, location, description, _id } = report
  return res.status(200).json({ report });
};

const getStats = async (req, res) => {
  // if(req.user.userType === 'Civilian'){
  //     let stats = await Report.aggregate([
  //         {$match: {$createdBy: mongoose.Types.ObjectId(req.user.userId)}},
  //         {$group: {_id: '$status', count: {$sum: 1}}}
  //     ])

  //     stats = stats.reduce((arr, curr) => {
  //         const { _id: status, count } = curr
  //         acc[status] = count
  //         return acc
  //     }, {})

  //     const defaultStats = {
  //         Pending: stats.pending || 0,
  //         Active: stats.active || 0,
  //         Responded: stats.responded || 0
  //     }

  //     let monthlyApplications = await Report.aggregate([
  //         {$match: { $createdBy: mongoose.Types.ObjectId(req.user.userId)}},
  //         {$group: {_id: {year: {$year: '$createdAt'}, month: {$month: '$createdAt'}}, count: {$sum: 1}}},
  //         {$sort: { '_id.Year': -1, '_id.Month': -1}},
  //         {$limit: 6}
  //     ])

  //     monthlyApplications = monthlyApplications.map(item => {
  //         const {_id: {year, month}, count} = item
  //         const date = moment()
  //         .month(month - 1)
  //         .year(year)
  //         .format('MMM Y')

  //         return {date, count}
  //     }).reverse()

  //     return res.status(200).json({ defaultStats, monthlyApplications })
  // }

  if (!req.user.verified)
    throw new CustomErrors.UnauthenticatedError("User is not verified yet!");

  let stats = await Report.aggregate([
    { $match: {} },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  stats = stats.reduce((acc, curr) => {
    const { _id: status, count } = curr;
    acc[status] = count;
    return acc;
  }, {});

  const defaultStats = {
    pending: stats.pending || 0,
    active: stats.active || 0,
    responded: stats.responded || 0,
  };

  let monthlyApplications = await Report.aggregate([
    { $match: {} },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
    { $limit: 6 },
  ]);

  monthlyApplications = monthlyApplications
    .map((item) => {
      const {
        _id: { year, month },
        count,
      } = item;
      const date = moment()
        .month(month - 1)
        .year(year)
        .format("MMM Y");

      return { date, count };
    })
    .reverse();

  res.status(200).json({ defaultStats, monthlyApplications });
};

const uploadFile = async (req, res) => {
  const { image, video } = req.files;

  if (image) {
    if (!image.mimetype.startsWith("image")) {
      throw new CustomErrors.BadRequestError(
        "Please upload a video or an image"
      );
    }

    const result = await cloudinary.uploader.upload(image.tempFilePath, {
      use_filename: true,
      folder: "file uploads",
    });

    fs.unlinkSync(image.tempFilePath);

    return res.status(200).json({ src: result.secure_url });
  }

  if (video) {
    if (!video.mimetype.startsWith("image")) {
      throw new CustomErrors.BadRequestError(
        "Please upload a video or an image"
      );
    }

    const result = await cloudinary.uploader.upload(video.tempFilePath, {
      use_filename: true,
      folder: "file uploads",
    });

    fs.unlinkSync(video.tempFilePath);

    return res.status(200).json({ src: result.secure_url });
  }
};

module.exports = {
  getAllReports,
  deleteReport,
  updateReport,
  getReport,
  getStats,
  createReport,
  uploadFile,
  updateReponse,
};
